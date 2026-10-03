import queue
import logging
import sounddevice as sd
import numpy as np
import collections
import time

logger = logging.getLogger("VANI-Audio")

class AudioBuffer:
    """
    Continuous ring buffer for audio capture.
    Runs on a background thread and pushes audio blocks to a queue.
    Auto-selects the best microphone device at startup.
    """
    def __init__(self, sample_rate=16000, max_seconds=3, chunk_size=1280, device_id=None):
        self.sample_rate = sample_rate
        self.channels = 1
        self.dtype = 'int16'
        self.chunk_size = chunk_size
        self.max_seconds = max_seconds
        self.enabled = True
        self.device_id = device_id  # None = auto-detect
        
        # Ring buffer to store the last N seconds of audio
        max_chunks = int((sample_rate * max_seconds) / chunk_size)
        self.ring_buffer = collections.deque(maxlen=max_chunks)
        
        # We use a Queue to pass audio safely from the audio thread to main thread
        self.audio_queue = queue.Queue(maxsize=100) # Prevents memory leaks if unread
        self.stream = None
        self.is_running = False
        self.noise_floor = 0.0  # Calibrated at startup

    def _audio_callback(self, indata, frames, time, status):
        """Called automatically by sounddevice for each audio block."""
        if not self.enabled:
            return

        if status:
            logger.warning(f"Audio Buffer Status: {status}")
            
        audio_data = indata[:, 0].copy() # Ensure memory contiguous
        self.ring_buffer.append(audio_data)
        
        try:
            self.audio_queue.put_nowait(audio_data)
        except queue.Full:
            try:
                self.audio_queue.get_nowait()  # Drop oldest
            except queue.Empty:
                pass
            try:
                self.audio_queue.put_nowait(audio_data)
            except queue.Full:
                pass  # Failsafe: queue is being consumed too slowly

    # Output device keywords — these should NEVER be used as input
    _OUTPUT_KEYWORDS = ['speaker', 'headphone', 'hdmi', 'display audio', 'realtek(r) audio',
                        'noise-cancelling output', 'stereo mix', 'loopback', 'pc speaker']

    @staticmethod
    def probe_best_device(sample_rate=16000):
        """
        Tests all available input devices for 1 second each and returns
        the device_id with the strongest signal (highest RMS).
        Skips output/loopback devices that falsely report input channels.
        """
        logger.info("Auto-detecting best microphone...")
        devices = sd.query_devices()
        best_id = None
        best_rms = 0
        
        for i, d in enumerate(devices):
            if d['max_input_channels'] < 1:
                continue

            # Skip devices that are clearly output-only (speakers, HDMI, etc.)
            name_lower = d['name'].lower()
            if any(kw in name_lower for kw in AudioBuffer._OUTPUT_KEYWORDS):
                logger.debug(f"  Device [{i}] '{d['name']}': SKIP (output device)")
                continue

            try:
                chunks = []
                def cb(indata, frames, t, status, c=chunks):
                    c.append(indata[:, 0].copy())
                
                stream = sd.InputStream(
                    device=i, samplerate=sample_rate, channels=1,
                    dtype='int16', callback=cb, blocksize=1280
                )
                stream.start()
                time.sleep(0.2)
                stream.stop()
                stream.close()
                
                if chunks:
                    audio = np.concatenate(chunks)
                    rms = float(np.sqrt(np.mean(np.square(audio.astype(np.float32)))))
                    logger.info(f"  Device [{i}] '{d['name']}': RMS={rms:.1f}")
                    if rms > best_rms:
                        best_rms = rms
                        best_id = i
            except Exception as e:
                logger.debug(f"  Device [{i}] '{d['name']}': SKIP ({e})")
        
        if best_id is not None:
            dev_name = sd.query_devices(best_id)['name']
            logger.info(f">> Selected mic: [{best_id}] '{dev_name}' (RMS={best_rms:.1f})")
        else:
            logger.warning("No working input device found! Using system default.")
        
        return best_id, best_rms

    def start(self):
        """Starts the audio capture thread. Auto-detects the best mic if no device_id set."""
        if self.device_id is None:
            self.device_id, _ = self.probe_best_device(self.sample_rate)
        
        dev_label = ""
        if self.device_id is not None:
            dev_label = f" (device {self.device_id}: {sd.query_devices(self.device_id)['name']})"
        logger.info(f"Starting Audio Input Stream ({self.sample_rate}Hz){dev_label}...")
        self.is_running = True
        
        # Try the selected device first, then fall back to system default
        for attempt, dev in enumerate([self.device_id, None]):
            try:
                if attempt == 1:
                    logger.warning(f"Retrying with system default input device...")
                self.stream = sd.InputStream(
                    device=dev,
                    samplerate=self.sample_rate,
                    channels=self.channels,
                    dtype=self.dtype,
                    callback=self._audio_callback,
                    blocksize=self.chunk_size 
                )
                self.stream.start()
                self.device_id = dev  # Update to the device that actually worked
                
                # Calibrate noise floor: capture 0.5s and measure ambient noise
                time.sleep(0.5)
                calibration_chunks = []
                while not self.audio_queue.empty():
                    try:
                        calibration_chunks.append(self.audio_queue.get_nowait())
                    except queue.Empty:
                        break
                if calibration_chunks:
                    cal_audio = np.concatenate(calibration_chunks)
                    self.noise_floor = float(np.sqrt(np.mean(np.square(cal_audio.astype(np.float32)))))
                    logger.info(f"Noise floor calibrated: RMS={self.noise_floor:.1f}")
                
                logger.info("Audio stream started successfully.")
                return  # Success — exit the retry loop
            except Exception as e:
                logger.error(f"Failed to start audio stream (device={dev}): {e}")
                if attempt == 1:  # Both attempts failed
                    self.is_running = False
                    raise

    def stop(self):
        """Stops the audio capture."""
        if self.stream:
            logger.info("Stopping Audio Input Stream...")
            self.stream.stop()
            self.stream.close()
            self.is_running = False

    def get_chunk(self) -> np.ndarray:
        """Pulls the next available chunk from the queue (Blocking). Returns None if empty."""
        if not self.is_running or not self.stream:
            return None
            
        try:
            return self.audio_queue.get(timeout=0.1)
        except queue.Empty:
            return None

    def flush(self):
        """Thread-safe drain of the audio queue. Discards all pending chunks."""
        flushed = 0
        while True:
            try:
                self.audio_queue.get_nowait()
                flushed += 1
            except queue.Empty:
                break
        if flushed > 0:
            logger.info(f"Flushed {flushed} stale audio chunks from queue.")

    def get_latest_audio(self, seconds: float = 2.0) -> np.ndarray:
        """
        Returns the last `seconds` of audio from the ring buffer.
        """
        num_chunks = int((self.sample_rate * seconds) / self.chunk_size)
        current_chunks = list(self.ring_buffer)
        
        if not current_chunks:
            return np.array([], dtype=self.dtype)
            
        if num_chunks < len(current_chunks):
            recent_chunks = current_chunks[-num_chunks:]
        else:
            recent_chunks = current_chunks
            
        return np.concatenate(recent_chunks)
