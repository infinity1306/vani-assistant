import sounddevice as sd
import numpy as np
import time

print("Testing microphone volume. Speak into the mic for 5 seconds...")

def callback(indata, frames, time, status):
    if status:
        print(status)
    vol = np.linalg.norm(indata)*10
    print(f"Volume: {vol:.2f} | {'|' * int(vol)}")

stream = sd.InputStream(callback=callback, channels=1, samplerate=16000)
with stream:
    time.sleep(5)
print("Done.")
