"""Quick script to list all audio input devices and test their signal levels."""
import sounddevice as sd
import numpy as np
import time, json, os

os.makedirs("data", exist_ok=True)

print("=" * 60)
print("Available Audio Input Devices:")
print("=" * 60)

devices = sd.query_devices()
input_devices = []

for i, d in enumerate(devices):
    if d['max_input_channels'] > 0:
        input_devices.append((i, d))
        default_marker = " <<<< DEFAULT" if i == sd.default.device[0] else ""
        print(f"  [{i}] {d['name']} (inputs={d['max_input_channels']}, rate={d['default_samplerate']:.0f}Hz){default_marker}")

print(f"\nTesting {len(input_devices)} input device(s) for 2 seconds each...\n")

results = []

for idx, dev in input_devices:
    try:
        print(f"  Testing [{idx}] {dev['name']}...")
        chunks = []
        
        def callback(indata, frames, t, status):
            chunks.append(indata[:, 0].copy())
        
        stream = sd.InputStream(
            device=idx,
            samplerate=16000,
            channels=1,
            dtype='int16',
            callback=callback,
            blocksize=1280
        )
        stream.start()
        time.sleep(2)
        stream.stop()
        stream.close()
        
        if chunks:
            all_audio = np.concatenate(chunks)
            rms = np.sqrt(np.mean(np.square(all_audio.astype(np.float32))))
            peak = np.max(np.abs(all_audio.astype(np.float32)))
            result = {"device_id": idx, "name": dev['name'], "rms": float(rms), "peak": float(peak)}
            results.append(result)
            
            status = "GOOD" if rms > 50 else "LOW" if rms > 10 else "SILENT"
            print(f"    RMS={rms:.1f}, Peak={peak:.0f} -> {status}")
        else:
            print(f"    No audio captured!")
            results.append({"device_id": idx, "name": dev['name'], "rms": 0, "peak": 0})
            
    except Exception as e:
        print(f"    ERROR: {e}")
        results.append({"device_id": idx, "name": dev['name'], "error": str(e)})

# Find best device
best = max(results, key=lambda r: r.get("rms", 0)) if results else None

print(f"\n{'='*60}")
print(f"RECOMMENDATION:")
print(f"{'='*60}")
if best and best.get("rms", 0) > 10:
    print(f"  Best device: [{best['device_id']}] {best['name']} (RMS={best['rms']:.1f})")
elif best:
    print(f"  All devices have very low signal. Best available: [{best['device_id']}] {best['name']} (RMS={best['rms']:.1f})")
    print(f"  >> Please check Windows Sound Settings:")
    print(f"     1. Right-click speaker icon in taskbar -> Sound Settings")
    print(f"     2. Go to 'Input' section")
    print(f"     3. Make sure the correct mic is selected and NOT muted")
    print(f"     4. Increase the 'Volume' slider for the input device")
else:
    print(f"  No working input devices found!")

# Save results for other scripts to use
with open("data/audio_devices.json", "w") as f:
    json.dump({"devices": results, "best": best}, f, indent=2)
    print(f"\n  Results saved to data/audio_devices.json")
