import os
import sys
import logging
import asyncio
import numpy as np
import time
from faster_whisper import WhisperModel

# Wave 3: NVIDIA CUDA 12 DLL Path Fix for Windows venv
if sys.platform == "win32":
    # Try to add the venv/Lib/site-packages/nvidia folders to the DLL search path
    # This prevents the 'cublas64_12.dll not found' error.
    venv_site_pkgs = os.path.join(sys.prefix, "Lib", "site-packages")
    for lib in ["nvidia", "nvidia/cublas/bin", "nvidia/cudnn/bin"]:
        dll_path = os.path.abspath(os.path.join(venv_site_pkgs, lib))
        if os.path.exists(dll_path):
            try:
                os.add_dll_directory(dll_path)
            except Exception:
                pass

logger = logging.getLogger("VANI-STT")

class STTEngine:
    """
    Offline Speech-To-Text utilizing Faster-Whisper.
    """
    def __init__(self, model_size="base.en", device="auto", compute_type="int8"):
        # Wave 2 Perf: Lazy load model parameters
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = None
        self.sample_rate = 16000
        logger.info("STT Engine initialized (Lazy Loading).")

    def _ensure_model_loaded(self):
        if self.model is None:
            # Wave 3: Alert user of the initial download
            logger.info(f"VANI is calibrating her high-accuracy hearing model ({self.model_size})...")
            logger.info("NOTE: If this is the first run, I am downloading ~460MB of data. Please wait, sir...")
            
            # This is blocking, but it will be wrapped in asyncio.to_thread during execution
            self.model = WhisperModel(self.model_size, device=self.device, compute_type=self.compute_type)
            logger.info("VANI's hearing is now 100% accurate and GPU-accelerated.")

    def transcribe_array(self, audio_array: np.ndarray) -> str:
        """
        Runs transcription on a numpy array of audio samples.
        """
        self._ensure_model_loaded()
        audio_float32 = audio_array.astype(np.float32) / 32768.0
        
        # Wave 3: Robust Fallback System
        try:
            return self._run_transcription(audio_float32)
        except RuntimeError as e:
            if "cublas64_12.dll" in str(e) or "cudnn" in str(e) or "Library path" in str(e):
                logger.warning(f"CUDA library error detected. Falling back to CPU for accuracy...")
                self.device = "cpu"
                self.compute_type = "int8"
                self.model_size = "small" # Force lightweight multilingual model on CPU to prevent hangs, but still understand Hinglish
                self.model = None # Force complete reload on CPU
                self._ensure_model_loaded()
                try:
                    return self._run_transcription(audio_float32)
                except Exception as inner_e:
                    logger.error(f"CPU fallback also failed: {inner_e}")
                    return ""
            else:
                logger.error(f"STT RuntimeError: {e}")
                return ""
        except Exception as e:
            logger.error(f"Unexpected STT error: {e}")
            return ""

    def _run_transcription(self, audio_data: np.ndarray) -> str:
        """Helper to iterate segments and catch errors during generation."""
        segments, info = self.model.transcribe(
            audio_data, 
            beam_size=5, 
            condition_on_previous_text=False,
            vad_filter=True,  # ENABLED: Prevents Whisper from hallucinating captions/random text during silence
            language="en"  # Forces English alphabet, disables random language detection
        )
        
        logger.info(f"Detected language '{info.language}' with probability {info.language_probability:.2f}")
        
        transcript = []
        # The transcribe method returns a generator; library errors happen during iteration.
        for segment in segments:
            transcript.append(segment.text)
            
        final_text = " ".join(transcript).strip()
        
        # Filter common hallucinations that Whisper outputs when there is only noise
        lower_text = final_text.lower().strip()
        hallucinations = [
            "you", "thank you.", "thank you", "bye.", "bye", "the.", "the", 
            "am i?", "it's service.", "it's service", "service.", "service",
            "hey.", "hey", "hi.", "hi", "hello.", "hello"
        ]
        if lower_text in hallucinations:
            logger.info(f"Ignored hallucinated transcript: '{final_text}'")
            return ""
            
        if final_text:
            logger.info(f"Transcript: '{final_text}'")
        return final_text
    
    async def capture_and_transcribe(self, audio_buffer, max_seconds=15, silence_timeout=1.5):
        """
        Captures audio from the streaming buffer until silence is detected,
        then runs transcription.
        
        Args:
            audio_buffer: The thread-safe AudioBuffer instance
            max_seconds: Hard cutoff for recording length
            silence_timeout: Seconds of silence required to stop recording
        """
        logger.info(">>> Listening for command...")
        
        start_time = time.time()
        min_record_time = 0.3  # Reduced to stop listening faster for short commands
        
        # Pre-fill with the last ~2 seconds of background audio so we don't truncate the start
        # of the sentence while WakeWord/Auth was processing
        recent_background = audio_buffer.get_latest_audio(seconds=2.0)
        captured_chunks = [recent_background] if len(recent_background) > 0 else []
        
        silent_chunks = 0
        chunk_count = 0
        
        # AudioBuffer yields ~0.1s chunks (Sample rate / Chunk size)
        # We can approximate chunk length, assuming 10 chunks per second
        chunks_for_silence = int(silence_timeout * 10)
        
        # Use a more forgiving silence threshold and a moving average for RMS
        base_noise = getattr(audio_buffer, 'noise_floor', 0)
        # The threshold is dynamically set slightly above the noise floor
        silence_threshold = max(base_noise * 3.0 + 15, 15)
        logger.info(f"Silence threshold set to {silence_threshold:.1f} (noise_floor={base_noise:.1f})")
        
        rms_history = []
        has_started_speaking = False
        
        try:
            while True:
                elapsed = time.time() - start_time
                # Hard timeout
                if elapsed > max_seconds:
                    logger.warning(f"Max recording time ({max_seconds}s) reached. Forcing cutoff.")
                    break
                    
                chunk = audio_buffer.get_chunk()
                if chunk is not None:
                    captured_chunks.append(chunk)
                    chunk_count += 1
                    
                    # Volume-based pseudo-VAD
                    rms = np.sqrt(np.mean(np.square(chunk.astype(np.float32))))
                    rms_history.append(rms)
                    if len(rms_history) > 5:  # Keep a small moving average window (5 chunks = ~400ms)
                        rms_history.pop(0)
                        
                    smoothed_rms = sum(rms_history) / len(rms_history)
                    
                    # Log every ~0.5s
                    if chunk_count % 6 == 0:
                        logger.info(f"STT capture: {elapsed:.1f}s elapsed, RMS={rms:.0f}, Smoothed={smoothed_rms:.0f}, threshold={silence_threshold:.0f}, silent_chunks={silent_chunks}/{chunks_for_silence}, spoke={has_started_speaking}")
                    
                    # Only start silence detection after minimum recording time
                    if elapsed < min_record_time:
                        continue
                        
                    if smoothed_rms >= silence_threshold + 5:
                        has_started_speaking = True
                        
                    if smoothed_rms < silence_threshold:
                        if has_started_speaking or elapsed > 5.0: # If they haven't spoken after 5s, timeout anyway
                            silent_chunks += 1
                    else:
                        # Don't reset entirely on a single spike, decrement to smooth out sudden clicks
                        silent_chunks = max(0, silent_chunks - 2)
                        
                    if silent_chunks >= chunks_for_silence:
                        logger.info(f"Silence detected after {elapsed:.1f}s (threshold={silence_threshold:.0f}). Stopping capture.")
                        break
                else:
                    await asyncio.sleep(0.01)
                    
        except asyncio.CancelledError:
            logger.info("Recording cancelled.")
            
        # Combine chunks
        if not captured_chunks:
            return ""
            
        full_audio = np.concatenate(captured_chunks)
        
        logger.info("Processing Speech-To-Text...")
        transcript = await asyncio.to_thread(self.transcribe_array, full_audio)
        return transcript
