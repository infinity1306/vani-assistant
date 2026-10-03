"""
VANI Pipeline Diagnostic — Tests each stage independently.
Run this WITHOUT admin elevation to diagnose failures.
"""
import sys, os, time, logging, json, queue, asyncio
import numpy as np

# Tee stdout to file for reading results
os.makedirs("data", exist_ok=True)

class Tee:
    def __init__(self, *files):
        self.files = files
    def write(self, obj):
        for f in self.files:
            f.write(obj)
            f.flush()
    def flush(self):
        for f in self.files:
            f.flush()

_log_file = open("data/diag_output.txt", "w", encoding="utf-8")
sys.stdout = Tee(sys.__stdout__, _log_file)
sys.stderr = Tee(sys.__stderr__, _log_file)

logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DIAG")

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pathlib import Path

def load_config():
    with open("config.json") as f:
        return json.load(f)

config = load_config()
results = {}

# ── STAGE 1: Audio Buffer ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 1: Audio Buffer (3-second capture test)")
print("="*60)
try:
    from core.audio_buffer import AudioBuffer
    buf = AudioBuffer(sample_rate=16000, max_seconds=3, chunk_size=1280)
    buf.start()
    time.sleep(0.5)
    
    chunk = buf.get_chunk()
    if chunk is not None:
        rms = np.sqrt(np.mean(np.square(chunk.astype(np.float32))))
        print(f"  ✓ Audio chunk received. Shape={chunk.shape}, RMS={rms:.1f}")
        if rms < 10:
            print(f"  ⚠ WARNING: RMS is near-zero ({rms:.1f}). Mic may be muted or wrong device.")
        results["audio"] = "OK" if rms > 10 else "LOW_SIGNAL"
    else:
        print("  ✗ FAIL: No audio chunk received after 0.5s")
        results["audio"] = "FAIL"
    
    # Capture 3 seconds and measure
    print("  Recording 3 seconds of audio...")
    chunks = []
    start = time.time()
    while time.time() - start < 3:
        c = buf.get_chunk()
        if c is not None:
            chunks.append(c)
        time.sleep(0.01)
    
    if chunks:
        full = np.concatenate(chunks)
        rms_3s = np.sqrt(np.mean(np.square(full.astype(np.float32))))
        print(f"  ✓ Captured {len(chunks)} chunks ({len(full)/16000:.1f}s). Overall RMS={rms_3s:.1f}")
    
    buf.stop()
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")
    results["audio"] = "EXCEPTION"

# ── STAGE 2: Wake Word Engine ─────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 2: Wake Word Engine (model load test)")
print("="*60)
try:
    from wakeword.engine import WakeWordEngine
    ww_cfg = config.get("wakeword", {})
    ww = WakeWordEngine(
        model_paths=[ww_cfg.get("model_path", "models/vani_v1.onnx")],
        threshold=ww_cfg.get("threshold", 0.5)
    )
    # Feed a silent chunk
    silent = np.zeros(1280, dtype=np.int16)
    detected = ww.process_chunk(silent)
    print(f"  ✓ Model loaded. Silent chunk detection: {detected} (should be False)")
    ww.reset()
    print(f"  ✓ Reset works.")
    results["wakeword"] = "OK"
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")
    results["wakeword"] = "EXCEPTION"

# ── STAGE 3: Speaker Auth ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 3: Speaker Authentication")
print("="*60)
try:
    from auth.engine import SpeakerAuthEngine
    auth_cfg = config.get("auth", {})
    auth = SpeakerAuthEngine(threshold=auth_cfg.get("threshold", 0.75))
    
    # Test with silent audio
    silent_audio = np.zeros(32000, dtype=np.int16)  # 2 seconds
    is_owner, score = auth.verify(silent_audio)
    print(f"  ✓ Auth result: is_owner={is_owner}, score={score:.3f}")
    if is_owner and score == 1.0:
        print(f"  ℹ No owner embedding enrolled — auth passes all voices.")
    results["auth"] = "OK"
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")
    results["auth"] = "EXCEPTION"

# ── STAGE 4: STT Engine ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 4: Speech-to-Text (Faster Whisper)")
print("="*60)
try:
    from stt.engine import STTEngine
    stt_cfg = config.get("stt", {})
    stt = STTEngine(
        model_size=stt_cfg.get("model_size", "base"),
        device=stt_cfg.get("device", "cpu"),
        compute_type=stt_cfg.get("compute_type", "int8")
    )
    
    # Transcribe silence (should return empty)
    silent_audio = np.zeros(48000, dtype=np.int16)  # 3 seconds silence
    text = stt.transcribe_array(silent_audio)
    print(f"  ✓ STT initialized. Silence transcription: '{text}' (should be empty)")
    results["stt"] = "OK"
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")
    results["stt"] = "EXCEPTION"

# ── STAGE 5: TTS Engine ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 5: TTS Engine (pyttsx3 — 3s timeout test)")
print("="*60)
try:
    import pyttsx3
    import threading
    
    tts_result = {"ok": False}
    
    def test_tts():
        try:
            engine = pyttsx3.init()
            engine.say("Test")
            engine.runAndWait()
            tts_result["ok"] = True
        except Exception as e:
            tts_result["error"] = str(e)
    
    t = threading.Thread(target=test_tts, daemon=True)
    t.start()
    t.join(timeout=5.0)
    
    if t.is_alive():
        print(f"  ✗ FAIL: pyttsx3.runAndWait() HUNG for >5 seconds (COM deadlock)")
        print(f"    → This confirms ROOT CAUSE #1: TTS blocks indefinitely.")
        results["tts"] = "HUNG"
    elif tts_result["ok"]:
        print(f"  ✓ TTS works (spoke 'Test' successfully)")
        results["tts"] = "OK"
    else:
        print(f"  ✗ FAIL: {tts_result.get('error', 'unknown')}")
        results["tts"] = "FAIL"
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")
    results["tts"] = "EXCEPTION"

# ── STAGE 6: Ollama LLM ─────────────────────────────────────────────────
print("\n" + "="*60)
print("STAGE 6: Ollama LLM Connectivity")
print("="*60)
try:
    import urllib.request
    intent_cfg = config.get("intent", {})
    url = intent_cfg.get("ollama_url", "http://localhost:11434")
    
    resp = urllib.request.urlopen(url, timeout=3)
    print(f"  ✓ Ollama API reachable (status {resp.status})")
    
    # Quick generate test
    import json as _json
    model = intent_cfg.get("model", "llama3.1:latest")
    payload = _json.dumps({"model": model, "prompt": "hi", "stream": False, "options": {"num_predict": 1}}).encode()
    req = urllib.request.Request(f"{url}/api/generate", data=payload, headers={"Content-Type": "application/json"})
    resp2 = urllib.request.urlopen(req, timeout=30)
    print(f"  ✓ Model '{model}' responded successfully")
    results["ollama"] = "OK"
except Exception as e:
    print(f"  ✗ FAIL: {e}")
    results["ollama"] = "FAIL"

# ── SUMMARY ──────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("DIAGNOSTIC SUMMARY")
print("="*60)
for stage, status in results.items():
    icon = "✓" if status == "OK" else "✗" if status in ("FAIL", "EXCEPTION", "HUNG") else "⚠"
    print(f"  {icon} {stage:12s} → {status}")

failed = [k for k,v in results.items() if v not in ("OK",)]
if failed:
    print(f"\n  FAILING STAGES: {', '.join(failed)}")
    print(f"  Fix these before running main.py")
else:
    print(f"\n  All stages passed! Pipeline should work end-to-end.")
