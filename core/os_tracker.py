import asyncio
import os
import psutil
import logging

try:
    import win32gui
    import win32process
    HAS_PYWIN32 = True
except ImportError:
    HAS_PYWIN32 = False

logger = logging.getLogger("vani.core.os_tracker")

class WindowsTracker:
    def __init__(self, app_instance):
        self.app = app_instance
        self.running = False
        self.last_window_title = ""
        self.last_app_name = ""
        
        if os.name != 'nt' or not HAS_PYWIN32:
            logger.warning("[WindowsTracker] Not running on Windows or pywin32 not installed. Tracker disabled.")

    def get_active_window_info(self):
        if not HAS_PYWIN32:
            return "Unknown App", "Unknown Title"
            
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return "Unknown App", "Unknown Title"
                
            title = win32gui.GetWindowText(hwnd)
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            
            app_name = "Unknown App"
            if pid > 0:
                try:
                    proc = psutil.Process(pid)
                    app_name = proc.name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            return app_name, title
        except Exception as e:
            logger.error(f"Error getting window info: {e}")
            return "Unknown App", "Unknown Title"

    async def run_loop(self):
        if not HAS_PYWIN32:
            return
            
        self.running = True
        logger.info("[WindowsTracker] Started polling active windows...")
        
        while self.running:
            try:
                app_name, title = self.get_active_window_info()
                
                if title and (title != self.last_window_title or app_name != self.last_app_name):
                    self.last_window_title = title
                    self.last_app_name = app_name
                    
                    # Notify the frontend via VaniOrchestrator's broadcast capabilities
                    if hasattr(self.app, "broadcast_context"):
                        await self.app.broadcast_context(app_name, title)
                            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[WindowsTracker] Error in loop: {e}")
                
            await asyncio.sleep(1.0)
