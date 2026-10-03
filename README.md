# VANI — Voice Activated Neural Interface

A production-grade hybrid AI voice assistant with JARVIS-level desktop control.

## Quick Start

```bash
# 1. Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
playwright install chromium

# 3. Start Ollama (LLM backend)
ollama serve            # Terminal 1
ollama run llama3.1     # Pull model if needed

# 4. Start VANI
python main.py          # Terminal 2

# 5. (Optional) Start frontend
cd frontend && npm install && npm run dev  # Terminal 3

# 6. (Optional) Start WebSocket bridge
cd backend && uvicorn main:app --port 8000  # Terminal 4
```

## Project Structure

```
vani/
├── main.py                  # Entry point — audio loop, wake word, pipeline
├── config.json              # Runtime configuration
├── requirements.txt         # Unified Python dependencies
├── .env                     # API keys & secrets (not committed)
│
├── core/                    # Audio buffer & terminal UI
│   ├── audio_buffer.py
│   └── ui.py
│
├── wakeword/                # Wake word detection (openwakeword)
│   └── engine.py
│
├── auth/                    # Speaker verification (SpeechBrain)
│   ├── engine.py
│   └── enroll.py
│
├── stt/                     # Speech‑to‑text (faster‑whisper)
│   └── engine.py
│
├── intent/                  # LLM intent resolution (Ollama)
│   └── router.py
│
├── execution/               # Command execution layer
│   ├── router.py            # Action registry & dispatch
│   ├── os_agent.py          # OS control, telemetry, ghost typing
│   ├── browser.py           # Web search, weather, news
│   ├── hardware.py          # Volume, brightness, media, displays
│   └── system.py            # Shutdown, restart, lock, screenshot
│
├── sensors/                 # Environmental sensing
│   └── vision.py            # Webcam face detection (OpenCV)
│
├── security/                # Command validation & audit logging
│   └── policy.py
│
├── backend/                 # FastAPI WebSocket bridge → frontend
│   ├── main.py
│   ├── websocket_server.py
│   └── events.py
│
├── frontend/                # React + Three.js EVA character UI
│
├── models/                  # ML model files (.onnx, SpeechBrain)
├── data/                    # Runtime data (audit logs)
├── tests/                   # All test files
└── utils/                   # Shared utilities
```

## Architecture

```
Mic → AudioBuffer → WakeWord → Auth → STT → IntentRouter (Ollama) → CommandRouter → Executors
                                                                           ↓
                                                         OS · Browser · Hardware · Vision
```

## Key Capabilities

| Category | Commands |
|----------|----------|
| **OS Control** | `open_app`, `close_app`, `get_active_window`, `ghost_type`, `minimize/maximize_window` |
| **System** | `system_diagnostics`, `system_control` (lock/sleep/restart/shutdown/volume) |
| **Hardware** | `set_brightness`, `control_media`, `set_power_plan`, `turn_off_displays`, `trigger_lockdown` |
| **Intelligence** | `live_search`, `live_weather`, `get_global_news`, `get_clipboard_data` |
| **Vision** | `scan_vision`, `capture_photo` |
| **Automation** | `run_dynamic_code` (execute arbitrary Python) |
