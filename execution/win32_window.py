import win32gui
import win32con
from typing import Optional

def get_active_window() -> str:
    try:
        hwnd = win32gui.GetForegroundWindow()
        return win32gui.GetWindowText(hwnd)
    except Exception:
        return ""

def _find_window_by_title(title: str) -> Optional[int]:
    found_hwnd = None
    def enum_windows_proc(hwnd, lParam):
        nonlocal found_hwnd
        if win32gui.IsWindowVisible(hwnd):
            window_text = win32gui.GetWindowText(hwnd)
            if title.lower() in window_text.lower():
                found_hwnd = hwnd
                return False # Stop enumerating
        return True
    try:
        win32gui.EnumWindows(enum_windows_proc, 0)
    except Exception:
        pass
    return found_hwnd

def focus_window(title: str) -> bool:
    hwnd = _find_window_by_title(title)
    if hwnd:
        try:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(hwnd)
            return True
        except Exception:
            return False
    return False

def minimize_window(title: Optional[str] = None) -> bool:
    if title:
        hwnd = _find_window_by_title(title)
    else:
        hwnd = win32gui.GetForegroundWindow()
        
    if hwnd:
        try:
            win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)
            return True
        except Exception:
            return False
    return False

def close_window(title: Optional[str] = None) -> bool:
    if title:
        hwnd = _find_window_by_title(title)
    else:
        hwnd = win32gui.GetForegroundWindow()
        
    if hwnd:
        try:
            win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
            return True
        except Exception:
            return False
    return False
