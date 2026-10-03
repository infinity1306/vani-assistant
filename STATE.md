# VANI OS State (STATE.md)

## Current Context
- **Phase:** Month 2: Command Center & Universal Input
- **Active Task:** Completed Command Center UI and FastAPI Backend integration.

## Next Steps
- Verify that `Ctrl+Space` globally activates VANI's Universal Input window.
- Ensure the Command Center layout responds appropriately to inputs.
- Move towards implementing context-aware plugins in Phase 3.

## Memory & Notes
- Month 1 completed: WebGL shaders for AmbientOrb, Tauri global shortcut `CommandOrControl+Space`, and WebSocket client stub.
- Month 2 (Part 1) completed: `CommandCenter.tsx` implemented. `main.py` refactored to use FastAPI and Uvicorn on a background thread for HTTP `/command` and WS `/ws` state broadcasting.
- Tauri permissions added: `global-shortcut:allow-is-registered`, `global-shortcut:allow-unregister`.
