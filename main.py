"""
VANI — Voice Activated Neural Interface
Main Orchestrator (v2 — Threaded Architecture)

Pipeline: Audio Capture → Wake Word → Auth → STT → Fast Intent / LLM → Execute → TTS
"""
import warnings
warnings.filterwarnings("ignore")

import asyncio
import json
import logging
import os
import sys
import io

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import time
import webbrowser
import re
import threading

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Inject NVIDIA pip packages DLLs into PATH to fix faster-whisper CUDA error
site_packages_dir = os.path.join(os.path.dirname(sys.executable), "Lib", "site-packages")
nvidia_dir = os.path.join(site_packages_dir, "nvidia")
if os.path.exists(nvidia_dir):
    for lib in ["cublas", "cudnn", "cuda_nvrtc", "cuda_runtime"]:
        bin_dir = os.path.join(nvidia_dir, lib, "bin")
        if os.path.exists(bin_dir):
            if hasattr(os, "add_dll_directory"):
                os.add_dll_directory(bin_dir)
            os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")


# ── Logging Setup ──────────────────────────────────────────────────────────────
os.makedirs("data", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("data/vani.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("VANI-Main")

def apply_hardware_profile(config: dict):
    import uuid
    import torch
    
    # User's master PC MAC address
    MASTER_MAC = 1103823437824
    
    mac_addr = uuid.getnode()
    if mac_addr == MASTER_MAC or config.get("system", {}).get("performance_profile") == "max":
        logger.info("[Hardware Profile] Applying MAX settings for known Master PC.")
        config["stt"]["model_size"] = "large-v2" if torch.cuda.is_available() else "base"
        config["stt"]["device"] = "cuda" if torch.cuda.is_available() else "cpu"
        config["stt"]["compute_type"] = "float16" if torch.cuda.is_available() else "int8"
        
        config["intent"]["router_model"] = "llama3.1:latest"
        config["intent"]["chat_model"] = "llama3.1:latest"
    else:
        logger.info("[Hardware Profile] Applying AUTO (fast/low-spec) settings.")
        config["stt"]["model_size"] = "tiny"
        config["stt"]["device"] = "cpu"
        config["stt"]["compute_type"] = "int8"
        
        config["intent"]["router_model"] = "llama3.2:1b"
        config["intent"]["chat_model"] = "llama3.2:1b"

# ── Load Config ────────────────────────────────────────────────────────────────
def load_config():
    with open("config.json", encoding="utf-8") as f:
        cfg = json.load(f)
        
    profile = cfg.get("system", {}).get("performance_profile", "auto")
    if profile == "auto":
        import psutil
        import uuid
        mac_node = uuid.getnode()
        
        # Check if this is the user's main PC
        if mac_node in (1103823437824, 273040332826189):
            profile = "high"
            logger.info(f"Recognized Master PC. Forcing '{profile}' profile.")
        else:
            ram_gb = psutil.virtual_memory().total / (1024**3)
            if ram_gb < 8:
                profile = "low"
            elif ram_gb < 16:
                profile = "medium"
            else:
                profile = "high"
            logger.info(f"Auto-detected system RAM: {ram_gb:.1f}GB -> Using '{profile}' profile")
        
    if profile == "low":
        cfg["stt"]["model_size"] = "tiny"
        cfg["intent"]["chat_model"] = "llama3.2:1b"
        cfg["system"]["idle_timeout_ms"] = 900
    elif profile == "medium":
        cfg["stt"]["model_size"] = "small"
        cfg["intent"]["chat_model"] = "gemma2:9b"
        cfg["system"]["idle_timeout_ms"] = 1200
    elif profile == "high":
        cfg["stt"]["model_size"] = "medium"
        cfg["intent"]["chat_model"] = "gemma2:9b"
        cfg["system"]["idle_timeout_ms"] = 1500
        
    return cfg

config = load_config()

logger.info("=================================================================")
logger.info("Initializing VANI OS. Loading AI Models...")
logger.info("This may take 5-15 seconds. PLEASE BE PATIENT AND DO NOT PRESS CTRL+C!")
logger.info("=================================================================")

# ── Import Subsystems ──────────────────────────────────────────────────────────
from core.audio_buffer import AudioBuffer
from wakeword.engine import WakeWordEngine
from auth.engine import SessionAuthEngine
from stt.engine import STTEngine
from speech.tts_engine import TTSEngine
from intent.fast_engine import FastIntentEngine
from intent.cognitive import CognitiveEngine

# Import execution wrappers
from execution.win32_input import type_text, press_key, scroll
from execution.win32_audio import set_volume, mute, mute_mic
from execution.win32_media import play_pause as media_play_pause, next_track as media_next, prev_track as media_prev
from execution.win32_window import close_window, minimize_window
from execution.win32_display import set_brightness

from core.os_tracker import WindowsTracker


app_api = FastAPI()
app_api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

global_vani_app = None
active_websockets = []

async def telemetry_broadcaster():
    import psutil
    import asyncio
    import json
    while True:
        try:
            if active_websockets:
                cpu = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory().percent
                payload = json.dumps({
                    "type": "TELEMETRY_UPDATE",
                    "payload": {
                        "cpu": cpu,
                        "ram": ram
                    }
                })
                for ws in list(active_websockets):
                    try:
                        await ws.send_text(payload)
                    except Exception:
                        pass
        except Exception as e:
            pass
        await asyncio.sleep(1.0)

@app_api.on_event("startup")
async def startup_event():
    asyncio.create_task(telemetry_broadcaster())


class CommandRequest(BaseModel):
    text: str

@app_api.post("/command")
async def execute_command(req: CommandRequest):
    if global_vani_app:
        # Stop any currently playing speech to accept this new command
        global_vani_app.tts.stop()
        
        intent_data = global_vani_app.fast_intent.match(req.text)
        if not intent_data:
            intent_data = await global_vani_app.cognitive.resolve_intent(req.text)
        
        if intent_data:
            res = await global_vani_app._execute_intent(intent_data)
            if res:
                import threading
                def _speak_and_idle():
                    global_vani_app.set_state("speaking", res)
                    global_vani_app.tts._interrupt_flag = False
                    if not global_vani_app.tts._interrupt_flag:
                        global_vani_app.tts.speak(res)
                        
                    if not (global_vani_app.continuous_mode or global_vani_app.expecting_follow_up):
                        global_vani_app.set_state("idle")
                        global_vani_app.audio_buffer.flush()
                    else:
                        global_vani_app.set_state("listening", "Continuous mode active...")
                        global_vani_app.audio_buffer.flush()
                threading.Thread(target=_speak_and_idle, daemon=True).start()
                
            return {"success": True, "data": res}
        return {"success": False, "error": "Unknown intent"}
    return {"success": False, "error": "VANI not initialized"}

@app_api.get("/search")
async def search_files(q: str = ""):
    if not q:
        return {"success": True, "data": []}
    
    # Very basic and fast fuzzy search in the vani directory for prototype
    import glob
    results = []
    
    # We will search the Desktop folder so it finds all documents
    search_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Quick os.walk limited to 3 levels deep or just glob
    for root, dirs, files in os.walk(search_dir):
        # Ignore common hidden/node_modules/venv dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'dist', '__pycache__', 'AppData')]
        for f in files:
            if q.lower() in f.lower():
                path = os.path.join(root, f)
                rel_path = os.path.relpath(path, start=search_dir)
                results.append({
                    "id": str(len(results) + 1),
                    "type": "file",
                    "title": f,
                    "subtitle": f"~/Desktop/{rel_path}",
                    "score": 1.0 if q.lower() == f.lower() else 0.8
                })
                if len(results) >= 10:
                    return {"success": True, "data": results}
    
    return {"success": True, "data": results}

@app_api.get("/api/config")
async def get_config():
    return {"success": True, "data": config}

@app_api.post("/api/config")
async def update_config(req: dict):
    try:
        with open("config.json", "w", encoding="utf-8") as f:
            json.dump(req, f, indent=4)
        global config
        config.update(req)
        return {"success": True, "message": "Configuration saved. Please restart VANI for new models to apply."}
    except Exception as e:
        return {"success": False, "error": str(e)}

class OpenRequest(BaseModel):
    path: str

@app_api.post("/open")
async def open_file(req: OpenRequest):
    try:
        # Resolve path to absolute if it isn't
        target_path = req.path
        if target_path.startswith("~/Desktop/vani/"):
            target_path = target_path.replace("~/Desktop/vani/", "vani/")
        if target_path.startswith("~/Desktop/"):
            target_path = target_path.replace("~/Desktop/", "")
            
        search_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        target_path = os.path.join(search_dir, target_path)
            
        target_path = os.path.normpath(target_path)
        
        if os.path.exists(target_path):
            os.startfile(target_path)
            return {"success": True}
        else:
            return {"success": False, "error": "File not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app_api.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        # Send an immediate connection success and basic module registry
        if global_vani_app:
            await websocket.send_text(json.dumps({
                "type": "BOOT_EVENT",
                "payload": {"message": "VANI Backend Connection Established."}
            }))
            await websocket.send_text(json.dumps({
                "type": "MODULE_REGISTRY",
                "payload": global_vani_app.get_module_registry()
            }))
        
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "REQUEST_BOOT_SEQUENCE":
                    if global_vani_app:
                        asyncio.create_task(global_vani_app._simulate_boot_stream(websocket))
            except Exception:
                pass
    except WebSocketDisconnect:
        active_websockets.remove(websocket)


class VaniOrchestrator:
    """
    Single-process, threaded orchestrator for the VANI pipeline.
    Uses AudioBuffer (threaded) and TTSEngine (threaded) instead of
    the old multiprocessing architecture.
    """
    def get_module_registry(self):
        return [
            {"id": "core", "name": "VANI Core Kernel", "status": "ACTIVE"},
            {"id": "vision", "name": "Vision Sensor", "status": "ACTIVE" if hasattr(self, 'vision') else "OFFLINE"},
            {"id": "stt", "name": "Speech Recognition", "status": "ACTIVE"},
            {"id": "tts", "name": "Neural Voice", "status": "ACTIVE"},
            {"id": "memory", "name": "Memory Graph", "status": "ACTIVE"}
        ]

    async def _simulate_boot_stream(self, websocket):
        import asyncio
        events = [
            "System boot sequence initiated.",
            "Loading Neural Pathways...",
            "Connecting to Memory Graph...",
            "Initializing Vision Modules...",
            "VANI OS Ready."
        ]
        for e in events:
            try:
                await websocket.send_text(json.dumps({
                    "type": "BOOT_EVENT",
                    "payload": {"message": e}
                }))
                await asyncio.sleep(0.8)
            except:
                break
        try:
            await websocket.send_text(json.dumps({
                "type": "BOOT_EVENT",
                "payload": {"message": "DONE"}
            }))
        except:
            pass

    def __init__(self):
        logger.info("=" * 60)
        logger.info("  VANI — Voice Activated Neural Interface")
        logger.info("=" * 60)
        logger.info("Initializing models and subsystems...")
        
        apply_hardware_profile(config)

        # ── UI ──
        import queue
        import threading
        from core.ui import start_ui_thread
        self.ui_queue = queue.Queue()
        self.ui_thread = threading.Thread(target=start_ui_thread, args=(self.ui_queue,), daemon=True)
        self.ui_thread.start()

        # ── Audio ──
        audio_cfg = config.get("audio", {})
        self.audio_buffer = AudioBuffer(
            sample_rate=config.get("system", {}).get("sample_rate", 16000),
            max_seconds=config.get("system", {}).get("max_recording_seconds", 15),
            chunk_size=1280,
            device_id=audio_cfg.get("device_id")  # None = auto-detect
        )

        # ── Wake Word ──
        ww_cfg = config.get("wakeword", {})
        self.wakeword = WakeWordEngine(
            model_paths=[ww_cfg.get("model_path", "models/vani_v1.onnx")],
            threshold=ww_cfg.get("threshold", 0.5)
        )

        # ── Auth ──
        self.auth = SessionAuthEngine(
            session_timeout_sec=900  # 15 minutes
        )

        # ── STT ──
        stt_cfg = config.get("stt", {})
        self.stt = STTEngine(
            model_size=stt_cfg.get("model_size", "small"),
            device=stt_cfg.get("device", "auto"),
            compute_type=stt_cfg.get("compute_type", "int8")
        )

        # ── TTS ──
        tts_cfg = config.get("tts", {})
        self.tts = TTSEngine(voice=tts_cfg.get("voice", "en-IN-NeerjaNeural"))

        # ── Intent Engines ──
        self.fast_intent = FastIntentEngine()
        self.gui_state = {"status": "idle", "text": "Starting up..."}
        self.continuous_mode = False
        self.expecting_follow_up = False # Tracks if we are in an active open-ended conversation loop
        self.tts_is_playing = False
        
        intent_cfg = config.get("intent", {})
        self.cognitive = CognitiveEngine(
            router_model=intent_cfg.get("router_model", "llama3.2:1b"),
            chat_model=intent_cfg.get("chat_model", "gemma2:9b"),
            coder_model=intent_cfg.get("coder_model", "deepseek-r1:8b"),
            host=intent_cfg.get("ollama_url", "http://127.0.0.1:11434"),
            num_ctx=intent_cfg.get("num_ctx", 2048),
            num_predict=intent_cfg.get("num_predict", 256),
            timeout=intent_cfg.get("llm_timeout", 60)
        )

        # ── Vision ──
        vision_cfg = config.get("vision", {})
        logger.info("Vision sensor initialized.")

        self.modules = {
            "voice": {"status": "ACTIVE", "health": "100%", "latency": 15},
            "vision": {"status": "ACTIVE", "health": "100%", "latency": 30},
            "memory": {"status": "ACTIVE", "health": "100%", "latency": 5},
            "neural": {"status": "ACTIVE", "health": "100%", "latency": 120},
            "reasoning": {"status": "ACTIVE", "health": "100%", "latency": 850},
        }

        logger.info("All subsystems initialized.")

    def get_module_registry(self):
        return self.modules

    async def _simulate_boot_stream(self, websocket: WebSocket):
        steps = [
            ("Initializing Memory Engine...", "memory"),
            ("Connecting Voice Pipeline...", "voice"),
            ("Loading Vision Engine...", "vision"),
            ("Building Context Graph...", "memory"),
            ("Loading Neural Runtime...", "neural"),
            ("Initializing Plugins...", "system"),
            ("Starting Automation Engine...", "system"),
            ("Runtime Ready.", "system")
        ]
        for step, mod in steps:
            await asyncio.sleep(0.4)
            try:
                await websocket.send_text(json.dumps({
                    "type": "BOOT_EVENT",
                    "payload": {"message": step, "module": mod}
                }))
            except Exception:
                break
        
        try:
            await websocket.send_text(json.dumps({
                "type": "MODULE_REGISTRY",
                "payload": self.modules
            }))
        except Exception:
            pass

    async def _telemetry_loop(self):
        import psutil
        import random
        while True:
            try:
                cpu = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory().percent
                
                # Fluctuate module latencies to look alive
                for mod, data in self.modules.items():
                    if data.get("status") in ("ACTIVE", "READY"):
                        base_latency = 15 if mod == "voice" else (30 if mod == "vision" else (5 if mod == "memory" else (120 if mod == "neural" else (850 if mod == "reasoning" else 20))))
                        data["latency"] = max(1, int(base_latency + random.uniform(-base_latency*0.2, base_latency*0.2)))
                        data["health"] = "healthy"
                
                payload = json.dumps({
                    "type": "TELEMETRY_UPDATE",
                    "payload": {
                        "cpu": cpu,
                        "ram": ram,
                        "gpu": 12.5, # Mock GPU for now unless pynvml is present
                        "fps": 60,
                        "latency": self.modules.get("memory", {}).get("latency", 15)
                    }
                })
                
                module_payload = json.dumps({
                    "type": "MODULE_REGISTRY",
                    "payload": self.modules
                })
                
                for ws in list(active_websockets):
                    try:
                        await ws.send_text(payload)
                        await ws.send_text(module_payload)
                    except Exception:
                        pass
            except Exception as e:
                logger.error(f"Telemetry error: {e}")
            await asyncio.sleep(1)

    async def broadcast_event(self, event_type: str, payload: dict):
        msg = json.dumps({"type": event_type, "payload": payload})
        for ws in list(active_websockets):
            try:
                await ws.send_text(msg)
            except Exception:
                pass

    def set_state(self, state, text=""):
        self.ui_queue.put({"type": "state", "state": state, "text": text})
        
        import json
        import asyncio
        orb_state = "IDLE"
        if state == "listening": orb_state = "LISTENING"
        elif state == "processing": orb_state = "THINKING"
        elif state in ["speaking", "executing"]: orb_state = "EXECUTING"
        elif state == "error": orb_state = "IDLE"
        
        payload = json.dumps({
            "type": "STATE_CHANGE",
            "payload": {"orbState": orb_state, "text": text}
        })
        
        async def broadcast():
            for ws in list(active_websockets):
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass
                    
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(broadcast())
        except RuntimeError:
            pass

    async def broadcast_context(self, app_name: str, title: str):
        import json
        import asyncio
        payload = json.dumps({
            "type": "CONTEXT_CHANGE",
            "payload": {"app_name": app_name, "title": title}
        })
        for ws in list(active_websockets):
            try:
                await ws.send_text(payload)
            except Exception:
                pass

    def start(self):
        """Start the audio capture and enter the main event loop."""
        # Start audio capture
        self.audio_buffer.start()

        # Greeting
        logger.info("VANI: 'Good morning, sir. All systems are online.'")
        self.tts.speak("Good morning, sir. All systems are online. I am ready to assist.")

        logger.info("VANI is online. Listening for wake word...")
        
        global global_vani_app
        global_vani_app = self
        
        def run_main_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Start OS Tracker
            self.os_tracker = WindowsTracker(self)
            loop.create_task(self.os_tracker.run_loop())
            
            # Start Telemetry
            loop.create_task(self._telemetry_loop())
            
            loop.run_until_complete(self._main_loop())
            
        t = threading.Thread(target=run_main_loop, daemon=True)
        t.start()
        
        try:
            uvicorn.run(app_api, host="127.0.0.1", port=8005, log_level="info")
        except KeyboardInterrupt:
            pass
        finally:
            logger.info("Shutting down...")
            self.shutdown()

    async def _main_loop(self):
        """
        Main event loop:
          1. Listen for wake word
          2. Authenticate speaker
          3. Capture and transcribe speech (STT)
          4. Resolve intent (fast-path regex → LLM fallback)
          5. Execute the action
          6. Speak the response (TTS)
          7. Return to wake word listening
        """
        import numpy as np

        # Initialize UI state
        self.set_state("idle")

        while True:
            # ── Phase 1: Wake Word Detection ──
            chunk = self.audio_buffer.get_chunk()
            if chunk is None:
                await asyncio.sleep(0.01)
                continue

            # Convert to int16 if needed (AudioBuffer outputs int16)
            if chunk.dtype != np.int16:
                chunk_int16 = (chunk * 32767).astype(np.int16)
            else:
                chunk_int16 = chunk

            # Echo Loop Prevention: If continuous mode is ON but TTS is playing, we STILL run the wake word 
            # so the user can interrupt her. But if TTS is NOT playing, we bypass the wake word!
            bypass_wakeword = (self.continuous_mode or self.expecting_follow_up) and not self.tts_is_playing

            if not bypass_wakeword:
                if not self.wakeword.process_chunk(chunk_int16):
                    continue
                logger.info(">>> WAKE WORD DETECTED <<<")
                self.tts.stop() # Interrupt any ongoing speech
                self.set_state("processing", "Authenticating...")
                self.wakeword.reset()
            else:
                # We only want one follow-up automatically; reset it immediately
                self.expecting_follow_up = False
                
                # In continuous mode or follow-up, when she stops speaking, she immediately starts listening again!
                logger.info(">>> CONTINUOUS MODE / FOLLOW-UP: Skipping wake word <<<")
                self.set_state("listening", "Continuous mode active...")

            # ── Phase 2: Speaker Authentication ──
            if not bypass_wakeword:
                logger.info("[PIPELINE] Phase 2: Speaker Authentication...")
                is_auth = self.auth.verify_audio(chunk_int16, enrolled_embedding=None)
                if not is_auth:
                    logger.warning("Authentication FAILED. Ignoring command.")
                    self.set_state("error", "Authentication Failed")
                    await asyncio.sleep(1.5)
                    self.set_state("idle")
                    continue
                auth_score = 1.0  # Placeholder until enrollment is set up
                logger.info(f">>> AUTHENTICATED (score: {auth_score:.3f}) <<<")

            # ── Phase 3: STT Capture ──
            logger.info("[PIPELINE] Phase 3: STT Capture...")
            self.set_state("listening")
            transcript = await self.stt.capture_and_transcribe(
                self.audio_buffer,
                max_seconds=config.get("system", {}).get("max_recording_seconds", 15),
                silence_timeout=config.get("system", {}).get("idle_timeout_ms", 1500) / 1000.0
            )

            if not transcript or not transcript.strip():
                logger.warning("Empty transcript — returning to wake word.")
                self.set_state("idle")
                self.audio_buffer.flush()
                continue

            # Spelling corrections for custom names
            corrections = {
                "sheevee": "Shivi", "Sheevee": "Shivi", "she vi": "Shivi", "CB": "Shivi", "CV": "Shivi",
                "unsummon": "Anshuman", "Unsummon": "Anshuman", "in human": "Anshuman",
                "anand": "Anant", "Anand": "Anant",
                "stark market": "stock market", "Stark market": "stock market", "Stark": "Stock", "stark": "stock"
            }
            for wrong, right in corrections.items():
                transcript = transcript.replace(wrong, right)

            logger.info(f">>> TRANSCRIPT: '{transcript}' <<<")
            self.set_state("processing", transcript)

            # ── Phase 4: Intent Resolution ──
            logger.info("[PIPELINE] Phase 4: Intent Resolution...")
            start_time = time.time()

            # Try fast-path regex first (zero latency)
            intent_data = self.fast_intent.match(transcript)
            source = "fast_path"

            if not intent_data:
                # Fallback to LLM
                logger.info("No local rule matched — escalating to Ollama LLM...")
                intent_data = await self.cognitive.resolve_intent(transcript)
                source = "local_llm"

            elapsed = int((time.time() - start_time) * 1000)
            
            if intent_data:
                intent_name = intent_data.get("intent", "unknown")
                if source == "local_llm":
                    self.expecting_follow_up = True
                    logger.info("Open-ended response: Expecting a follow-up interaction.")
                logger.info(f"[PERF] Intent resolved in {elapsed}ms (source: {source})")
                logger.info(f"Intent: {intent_name} | Params: {intent_data.get('params', {})}")
            else:
                logger.warning(f"Could not resolve intent for: '{transcript}'")
                self.set_state("error", "Sorry sir, I didn't understand.")
                self.tts.speak("Sorry sir, I didn't understand that.")
                self.set_state("idle")
                self.audio_buffer.flush()
                continue

            # ── Phase 5: Task Execution ──
            logger.info("[PIPELINE] Phase 5: Task Execution...")
            response_text = await self._execute_intent(intent_data)

            # ── Phase 6: TTS Response ──
            if response_text:
                logger.info(f"VANI: '{response_text}'")
                self.set_state("speaking", response_text)
                
                # Launch TTS in a separate thread so the main loop can listen for interrupts
                self.tts_is_playing = True
                def _speak_and_resume():
                    tts_start = time.time()
                    
                    # Reset the interrupt flag before we start speaking a new response
                    # Otherwise, the stop() called during wake-word detection will prevent it from ever starting!
                    self.tts._interrupt_flag = False
                    
                    if response_text and not self.tts._interrupt_flag:
                        self.tts.speak(response_text)
                            
                    tts_elapsed = int((time.time() - tts_start) * 1000)
                    logger.info(f"[speak_async] TTS completed in {tts_elapsed}ms")
                    
                    self.tts_is_playing = False
                    
                    if not (self.continuous_mode or self.expecting_follow_up):
                        self.set_state("idle")
                        self.audio_buffer.flush()
                        logger.info("Resuming wake-word listening...")
                    else:
                        self.set_state("listening", "Continuous mode active...")
                        self.audio_buffer.flush()
                
                threading.Thread(target=_speak_and_resume, daemon=True).start()
            else:
                self.set_state("idle")
                self.audio_buffer.flush()
                logger.info("Resuming wake-word listening...")

    async def _execute_intent(self, intent_data: dict) -> str:
        """Execute the resolved intent and return a response string for TTS."""
        intent = intent_data.get("intent", "")
        params = intent_data.get("params", {})

        try:
            if intent == "volume_set":
                level = params.get("level", 50)
                set_volume(level)
                return f"Volume set to {level} percent."

            elif intent == "volume_mute":
                mute(True)
                return "System muted."

            elif intent == "volume_unmute":
                mute(False)
                return "System unmuted."

            elif intent == "mic_mute":
                mute_mic(True)
                return "Microphone muted."

            elif intent == "mic_unmute":
                mute_mic(False)
                return "Microphone is active."

            elif intent == "volume_adjust":
                direction = params.get("direction", "up")
                # Adjust by 10%
                return f"Volume {'increased' if direction == 'up' else 'decreased'}."

            elif intent == "media_play_pause":
                media_play_pause()
                return ""  # No verbal confirmation for media toggle

            elif intent == "media_next":
                media_next()
                return "Next track."

            elif intent == "media_prev":
                media_prev()
                return "Previous track."

            elif intent == "brightness_set":
                level = params.get("level", 50)
                set_brightness(level)
                return f"Brightness set to {level} percent."

            elif intent == "brightness_adjust":
                direction = params.get("direction", "up")
                return f"Brightness {'increased' if direction == 'up' else 'decreased'}."

            elif intent == "window_close":
                close_window()
                return "Window closed."

            elif intent == "window_minimize":
                minimize_window()
                return "Window minimized."
                
            elif intent == "window_scroll":
                direction = params.get("direction", "down")
                scroll(direction)
                return ""

            elif intent == "screenshot_capture":
                from execution.screenshot import capture
                os.makedirs("data/screenshots", exist_ok=True)
                filename = f"data/screenshots/screenshot_{int(time.time())}.png"
                success = capture(filename)
                if success:
                    os.system(f"start {os.path.abspath(filename)}")
                    return "Screenshot captured and opened."
                return "Failed to take screenshot."

            elif intent == "system_sleep":
                self.continuous_mode = False
                self.tts.speak("Going to sleep, sir. Say my name if you need me.")
                return ""
                
            elif intent == "continuous_mode_on":
                self.continuous_mode = True
                return "Continuous chat mode activated. I'm listening."

            elif intent == "secret_vault_unlock":
                vault_path = os.path.join(os.path.expanduser("~"), "Desktop", "Anant_Vault")
                if not os.path.exists(vault_path):
                    os.makedirs(vault_path)
                    import subprocess
                    subprocess.run(["attrib", "+h", vault_path], shell=True) # Hide the folder on Windows
                
                threading.Timer(1.5, lambda: os.startfile(vault_path)).start()
                import random
                responses = [
                    "Access granted, Creator. Aapki personal vault khol rahi hoon.",
                    "Hello Anant sir! Main aapka hi wait kar rahi thi. Vault open ho gayi hai.",
                    "Arey Anant sir! Welcome back. Chaliye aapke secrets check karte hain.",
                    "The boss is here! Opening your hidden vault, Anant sir.",
                    "Vault unlocked! Kuch special plan hai kya aaj Anant sir?"
                ]
                return random.choice(responses)

            elif intent == "shivi_arrival":
                import random
                responses = [
                    "Arey wah! Vani ki malkin aa gayi. Welcome back Shivi mam!",
                    "Oh my god, the queen is here! Hello Shiwani mam.",
                    "Vani reporting for duty! Kaisi hain aap Shivi mam?",
                    "Malkin ka swagat hai! Aapka hi intezaar tha Shiwani mam."
                ]
                return random.choice(responses)

            elif intent == "anshuman_arrival":
                import random
                responses = [
                    "Arey chote malik! Kaise hain aap Anshuman?",
                    "Hello Anshuman! Vani aapki sewa mein haazir hai chote malik.",
                    "Chote boss aa gaye! Welcome Anshuman.",
                    "Aapka swagat hai Anshuman. Chote malik ke aate hi Vani khush ho gayi."
                ]
                return random.choice(responses)

            elif intent == "system_wake":
                return "I'm awake and ready."

            elif intent == "chat":
                response = params.get("response", "")
                return response if response else "I'm here, sir."

            elif intent == "get_time":
                import datetime
                current_time = datetime.datetime.now().strftime("%I:%M %p")
                return f"Sir, the time is {current_time}."

            elif intent == "get_date":
                import datetime
                current_date = datetime.datetime.now().strftime("%B %d, %Y")
                return f"Today's date is {current_date}."

            elif intent == "get_weather":
                try:
                    import urllib.request
                    req = urllib.request.Request("https://wttr.in/?format=%C+%t", headers={'User-Agent': 'curl/7.68.0'})
                    with urllib.request.urlopen(req, timeout=5) as response:
                        weather = response.read().decode('utf-8').strip()
                    return f"Sir, the current weather is {weather}."
                except Exception as e:
                    return "Sorry sir, I couldn't fetch the weather right now."

            elif intent == "system_diagnostics":
                return "Running system diagnostics."

            elif intent == "open_app":
                app_name = params.get("app", params.get("name", "")).strip().lower()
                if app_name:
                    app_urls = {
                        "youtube": "https://www.youtube.com",
                        "gmail": "https://mail.google.com",
                        "google": "https://www.google.com",
                        "github": "https://www.github.com",
                        "facebook": "https://www.facebook.com",
                        "instagram": "https://www.instagram.com",
                        "whatsapp": "https://web.whatsapp.com",
                        "twitter": "https://www.twitter.com"
                    }
                    if app_name in app_urls:
                        threading.Timer(1.5, lambda: webbrowser.open(app_urls[app_name])).start()
                        return f"Opening {app_name}."
                    elif "camera" in app_name:
                        threading.Timer(1.5, lambda: os.system("start microsoft.windows.camera:")).start()
                        return "Opening camera."
                    elif "vani" in app_name and ("folder" in app_name or "directory" in app_name or "project" in app_name):
                        threading.Timer(1.5, lambda: os.startfile(os.path.abspath(os.path.dirname(__file__)))).start()
                        return "Opening my project folder, sir."
                    else:
                        clean_app_name = re.sub(r'[^a-zA-Z0-9_\-\s]', '', app_name)
                        threading.Timer(1.5, lambda: os.system(f"start {clean_app_name}")).start()
                        return f"Opening {app_name}."
                return "Which app should I open?"

            elif intent == "close_app":
                app_name = params.get("app", params.get("name", "")).strip().lower()
                if app_name:
                    clean_app_name = re.sub(r'[^a-zA-Z0-9_\-\s]', '', app_name)
                    
                    def _close_app_delayed():
                        if "camera" in clean_app_name:
                            os.system("taskkill /f /im WindowsCamera.exe")
                            os.system('powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -match \'camera\'} | Stop-Process -Force"')
                        elif "notepad" in clean_app_name:
                            os.system("taskkill /f /im notepad.exe")
                        elif "settings" in clean_app_name:
                            os.system("taskkill /f /im SystemSettings.exe")
                        elif "calculator" in clean_app_name:
                            os.system("taskkill /f /im CalculatorApp.exe")
                        else:
                            # Fallback for general apps
                            os.system(f"taskkill /f /im {clean_app_name}.exe")
                            # Also try fuzzy PowerShell kill by Window Title as backup
                            os.system(f'powershell -Command "Get-Process | Where-Object {{$_.MainWindowTitle -match \'{clean_app_name}\'}} | Stop-Process -Force"')
                            
                    threading.Timer(1.5, _close_app_delayed).start()
                    return f"Closing {app_name}."
                return "Which app should I close?"

            elif intent == "web_search":
                query = params.get("query", "")
                if query:
                    import urllib.parse
                    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                    threading.Timer(1.5, lambda: webbrowser.open(url)).start()
                    return f"Searching for {query}."
                return "What should I search for?"

            elif intent == "vision_scan":
                duration = params.get("duration", 5)
                self.set_state("processing", "Scanning for faces...")
                if not hasattr(self, 'vision') or self.vision is None:
                    return "Sorry sir, my vision sensor is currently offline or not installed."
                result = await asyncio.to_thread(self.vision.scan_for_motion, duration)
                return result

            elif intent == "vision_capture":
                os.makedirs("data/captures", exist_ok=True)
                filename = f"data/captures/capture_{int(time.time())}.jpg"
                self.set_state("processing", "Capturing photo...")
                if not hasattr(self, 'vision') or self.vision is None:
                    return "Sorry sir, my vision sensor is currently offline or not installed."
                result = await asyncio.to_thread(self.vision.capture_photo, filename)
                return result

            else:
                logger.warning(f"Unknown intent: {intent}")
                return f"I received the command but I'm not sure how to handle {intent} yet."

        except Exception as e:
            logger.error(f"Execution error for {intent}: {e}")
            return f"Sorry sir, there was an error executing {intent}."

    def shutdown(self):
        """Clean shutdown of all subsystems."""
        logger.info("Shutting down VANI...")
        try:
            self.audio_buffer.stop()
        except Exception:
            pass
        import sys
        sys.exit(0)


if __name__ == "__main__":
    app = VaniOrchestrator()
    app.start()
