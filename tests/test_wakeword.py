import time
import queue
import numpy as np
import sounddevice as sd
from openwakeword.model import Model

print("Initializing Model...")
# Use default 'hey_jarvis' model provided by openwakeword tests
model = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")

audio_queue = queue.Queue()

def audio_callback(indata, frames, time, status):
    if status:
        print(f"Status: {status}")
    audio_queue.put(indata[:, 0].copy())

print("Starting audio stream...")
stream = sd.InputStream(
    samplerate=16000,
    channels=1,
    dtype='int16',
    blocksize=1280,
    callback=audio_callback
)
stream.start()

print("Say 'hey jarvis'...")

try:
    while True:
        chunk = audio_queue.get()
        prediction = model.predict(chunk)
        
        try:
            score = prediction["hey_jarvis"]
            if score > 0.05: # Very low threshold just to see if it moves
                print(f"Score: {score:.3f}")
        except KeyError:
            pass

except KeyboardInterrupt:
    print("Stopped.")
finally:
    stream.stop()
    stream.close()
