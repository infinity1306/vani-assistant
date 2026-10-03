import pytest
import numpy as np
from core.audio_buffer import AudioBuffer

def test_audio_buffer_initialization():
    buf = AudioBuffer(sample_rate=16000, max_seconds=1)
    assert buf.sample_rate == 16000
    assert buf.audio_queue.empty()

def test_audio_buffer_push():
    buf = AudioBuffer()
    # Simulate a chunk
    mock_indata = np.ones((1280, 1), dtype=np.int16)
    buf._audio_callback(mock_indata, 1280, None, None)
    
    assert not buf.audio_queue.empty()
    chunk = buf.get_chunk()
    assert chunk is not None
    assert len(chunk) == 1280
