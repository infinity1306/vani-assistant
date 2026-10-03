import asyncio
import edge_tts
import logging
import os
import queue
import socket
import threading
import time
import hashlib
from pathlib import Path

logger = logging.getLogger("VANI-TTS")


def _check_edge_tts_dns() -> bool:
    """Quick DNS check to see if Edge-TTS endpoint is reachable."""
    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(3.0)
    try:
        # Try Bing first
        socket.getaddrinfo("speech.platform.bing.com", 443, socket.AF_INET, socket.SOCK_STREAM)
        return True
    except socket.gaierror:
        try:
            # Fallback to Google DNS to check general internet connectivity
            socket.getaddrinfo("8.8.8.8", 53, socket.AF_INET, socket.SOCK_STREAM)
            return True
        except socket.gaierror:
            return False
    finally:
        socket.setdefaulttimeout(old_timeout)


class TTSEngine:
    """
    Text-to-Speech engine with 3-tier fallback:
      1. Edge-TTS (Neural, online) — best quality
      2. Piper TTS (ONNX, offline) — good quality, fast
      3. SAPI5 Zira (Windows COM, offline) — last resort

    pyttsx3/SAPI5 uses Win32 COM internally, and COM objects MUST be created
    and used within the same thread apartment.
    """
    def __init__(self, voice="en-IN-NeerjaNeural"):
        logger.info(f"Initializing TTS engine (Preferred Voice: {voice})...")
        self.voice = voice
        self._interrupt_flag = False
        self._ready = threading.Event()
        self.is_speaking = False
        self.voice = "hi-IN-SwaraNeural"  # Changed to beautiful Hindi female voice
        
        self.cache_dir = Path("data/tts_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._edge_tts_available = True # Always try edge-tts first
        if not self._edge_tts_available:
            logger.warning("Edge-TTS DNS unreachable — will use offline TTS only.")
        
        self._piper_engine = None
        
        self._queue = queue.Queue()
        self._thread = threading.Thread(target=self._tts_worker, daemon=True)
        self._thread.start()
        
        # Pygame mixer initialization removed to prevent dependency issues

        # Wait for the worker thread to finish initializing
        self._ready.wait(timeout=10)
        logger.info("TTS engine ready.")

    def _tts_worker(self):
        """Dedicated thread that handles Neural (Edge), Piper, and SAPI5 fallback."""
        import sys
        import asyncio
        if sys.platform == 'win32':
            loop = asyncio.WindowsSelectorEventLoopPolicy().new_event_loop()
        else:
            loop = asyncio.new_event_loop()
            
        asyncio.set_event_loop(loop)
        self._worker_loop = loop
        self._utterance_count = 0
        self._ready.set()
        
        self._piper_engine = None

        async def _edge_speak(text, voice):
            # Calculate MD5 hash for caching short/common responses
            text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
            cache_file = self.cache_dir / f"{text_hash}.mp3"
            
            # Use unique temp file for non-cached long responses
            self._utterance_count += 1
            temp_file = f"data/tts_{self._utterance_count}.mp3"
            old_file = f"data/tts_{self._utterance_count - 1}.mp3"
            
            try:
                # Clean up previous temp files
                if os.path.exists(old_file):
                    try: os.remove(old_file)
                    except OSError: pass

                play_file = None
                
                # If cached version exists and is not empty, use it instantly
                if cache_file.exists():
                    if cache_file.stat().st_size > 0:
                        logger.debug(f"[TTS-Worker] Playing cached file for '{text[:20]}...'")
                        play_file = str(cache_file)
                    else:
                        try:
                            cache_file.unlink()
                        except OSError:
                            pass

                if play_file is None:
                    communicate = edge_tts.Communicate(text, voice)
                    
                    # Cache short phrases (<100 chars), else use temp file
                    # Add timeout to prevent 1-2 minute hangs if network is unstable
                    if len(text) < 100:
                        await asyncio.wait_for(communicate.save(str(cache_file)), timeout=12.0)
                        play_file = str(cache_file)
                    else:
                        await asyncio.wait_for(communicate.save(temp_file), timeout=25.0)
                        play_file = temp_file
                
                await asyncio.to_thread(self._play_audio_file, play_file)
                return True
            except asyncio.TimeoutError:
                logger.error("Edge-TTS timed out while downloading audio.")
                return False
            except Exception as e:
                logger.error(f"Edge-TTS failed: {e}")
                return False

        def _piper_speak(text):
            """Speak using Piper TTS (offline, ONNX-based)."""
            try:
                import sounddevice as sd  # type: ignore
                import time
                if self._piper_engine is None:
                    logger.info("Initializing Piper TTS engine on demand...")
                    from tts.piper_engine import PiperTTSEngine
                    self._piper_engine = PiperTTSEngine()
                    logger.info("Piper TTS loaded.")
                audio_data = self._piper_engine.synthesize(text)
                sd.play(audio_data, self._piper_engine.sample_rate)
                # wait while playing or interrupted
                while sd.get_stream() and sd.get_stream().active:
                    if self._interrupt_flag:
                        sd.stop()
                        break
                    time.sleep(0.05)
                return True
            except Exception as e:
                logger.error(f"Piper TTS failed: {e}")
                return False

        def _sapi5_speak(text):
            """Speak using Windows SAPI5 with a hard timeout to prevent hangs."""
            result = {"ok": False}
            
            def _do_speak():
                try:
                    import pythoncom  # type: ignore
                    import win32com.client  # type: ignore
                    pythoncom.CoInitialize()
                    speaker = win32com.client.Dispatch("SAPI.SpVoice")
                    # Find Zira or any female voice
                    for v in speaker.GetVoices():
                        if 'zira' in v.GetDescription().lower() or 'female' in v.GetDescription().lower():
                            speaker.Voice = v
                            break
                    speaker.Rate = 2
                    speaker.Speak(text)
                    del speaker
                    pythoncom.CoUninitialize()
                    result["ok"] = True
                except Exception as e:
                    logger.error(f"SAPI5 error: {e}")
            
            t = threading.Thread(target=_do_speak, daemon=True)
            t.start()
            t.join(timeout=15.0)  # Hard 15s timeout to prevent the 30s hang
            
            if t.is_alive():
                logger.warning("[TTS] SAPI5 hung — killing speech thread.")
                return False
            return result["ok"]

        while True:
            text, done_event = self._queue.get()
            if text is None: break
            
            if self._interrupt_flag:
                done_event.set()
                continue
                
            spoken = False
            
            # Tier 1: Try Neural Speech (Edge-TTS)
            logger.info(f"[TTS-Worker] Speaking (Neural): '{text[:50]}...'")
            try:
                spoken = loop.run_until_complete(_edge_speak(text, self.voice))
            except Exception as e:
                logger.error(f"Neural speech processing error: {e}")

            # Tier 2: Try Piper TTS (offline, good quality)
            if not spoken:
                logger.info(f"[TTS-Worker] Speaking (Piper): '{text[:50]}...'")
                spoken = _piper_speak(text)

            # Tier 3: Last resort — SAPI5 Zira (Windows built-in)
            if not spoken:
                logger.warning("[TTS-Worker] Falling back to SAPI5 (Zira).")
                spoken = _sapi5_speak(text)

            if not spoken:
                logger.error(f"[TTS] ALL engines failed for: '{text[:50]}...'")

            done_event.set()

    def _play_audio_file(self, file_path: str):
        """Play an MP3 or WAV file using PyAV and sounddevice, with fallback to WMPlayer.OCX."""
        # 1. Try PyAV + sounddevice
        try:
            import av  # type: ignore
            import sounddevice as sd  # type: ignore
            import numpy as np  # type: ignore

            container = av.open(file_path)
            try:
                stream = container.streams.audio[0]
                rate = stream.rate
                chunks = []
                for frame in container.decode(audio=0):
                    chunks.append(frame.to_ndarray())
            finally:
                container.close() # CRITICAL: Releases the file lock so edge-tts can delete it later!
                
            if chunks:
                audio_data = np.concatenate(chunks, axis=1).T
                sd.play(audio_data, rate)
                import time
                while sd.get_stream() and sd.get_stream().active:
                    if self._interrupt_flag:
                        sd.stop()
                        break
                    time.sleep(0.05)
                return True
        except Exception as e:
            logger.warning(f"PyAV + sounddevice playback failed: {e}. Trying Windows Media Player fallback.")

        # 2. Try Windows Media Player fallback
        try:
            import win32com.client  # type: ignore
            import pythoncom  # type: ignore
            
            pythoncom.CoInitialize()
            player = win32com.client.Dispatch("WMPlayer.OCX")
            player.URL = os.path.abspath(file_path)
            player.controls.play()
            
            # Wait for the playState to become 3 (Playing) or 8 (MediaEnded)
            start_wait = time.time()
            while player.playState not in (3, 8) and time.time() - start_wait < 2.0:
                if self._interrupt_flag:
                    break
                time.sleep(0.05)
                
            # Wait while playing
            while player.playState in (3, 6, 9):
                if self._interrupt_flag:
                    player.controls.stop()
                    break
                time.sleep(0.05)
            
            player.close()
            pythoncom.CoUninitialize()
            return True
        except Exception as e:
            logger.error(f"All audio playback fallbacks failed: {e}")
            return False

    def speak(self, text: str):
        """Send text to the TTS thread and block until it finishes speaking."""
        self._interrupt_flag = False
        logger.debug(f"[TTS] Queuing text: '{text[:50]}...'")
        done_event = threading.Event()
        self._queue.put((text, done_event))
        finished = done_event.wait(timeout=30)  # 30s max for any utterance
        if not finished:
            logger.warning(f"[TTS] TIMEOUT: Speech did not complete within 30s for: '{text[:50]}...'")
        logger.debug(f"[TTS] Done event received.")

    def stop(self):
        """Interrupts currently playing speech and clears the queue."""
        logger.info("[TTS] Stopping playback and clearing queue.")
        self._interrupt_flag = True
        
        # Clear the queue
        while not self._queue.empty():
            try:
                _, done_event = self._queue.get_nowait()
                done_event.set()
            except queue.Empty:
                break
