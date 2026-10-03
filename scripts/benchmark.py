import time
import asyncio
import numpy as np

# Mocking components to benchmark overhead
from intent.fast_engine import FastIntentEngine
from intent.cognitive import CognitiveEngine
from auth.engine import SessionAuthEngine

async def run_benchmark():
    print("=== VANI v2 Latency Benchmark ===")
    
    # 1. Auth Engine
    auth = SessionAuthEngine()
    dummy_audio = np.random.randn(16000)
    
    start = time.perf_counter()
    auth.verify_audio(dummy_audio, None)
    end = time.perf_counter()
    print(f"Auth verification (cold): {(end - start)*1000:.2f} ms")
    
    start = time.perf_counter()
    auth.verify_audio(dummy_audio, None)
    end = time.perf_counter()
    print(f"Auth verification (cached): {(end - start)*1000:.2f} ms")
    
    # 2. Fast Intent Engine
    fast = FastIntentEngine()
    
    start = time.perf_counter()
    res = fast.match("set volume to 80")
    end = time.perf_counter()
    print(f"Fast Intent Match (Volume): {(end - start)*1000:.2f} ms -> {res}")
    
    start = time.perf_counter()
    res = fast.match("some unknown command")
    end = time.perf_counter()
    print(f"Fast Intent Match (Miss): {(end - start)*1000:.2f} ms")

    # 3. Cognitive Engine (requires Ollama running)
    cognitive = CognitiveEngine()
    print("Testing Cognitive Engine (assuming Ollama is running at localhost:11434)...")
    
    start = time.perf_counter()
    res = await cognitive.resolve_intent("write a python script to reverse a string")
    end = time.perf_counter()
    
    if res:
        print(f"Cognitive Intent Resolve: {(end - start)*1000:.2f} ms -> {res}")
    else:
        print("Cognitive Intent Resolve: FAILED or TIMED OUT. Is Ollama running?")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
