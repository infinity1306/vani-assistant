import win32api
import win32con

VK_MEDIA_NEXT_TRACK = 0xB0
VK_MEDIA_PREV_TRACK = 0xB1
VK_MEDIA_STOP = 0xB2
VK_MEDIA_PLAY_PAUSE = 0xB3
VK_VOLUME_MUTE = 0xAD
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF

def _press_media_key(key_code: int) -> bool:
    try:
        win32api.keybd_event(key_code, 0, 0, 0)
        win32api.keybd_event(key_code, 0, win32con.KEYEVENTF_KEYUP, 0)
        return True
    except Exception:
        return False

def play_pause() -> bool:
    return _press_media_key(VK_MEDIA_PLAY_PAUSE)

def next_track() -> bool:
    return _press_media_key(VK_MEDIA_NEXT_TRACK)

def prev_track() -> bool:
    return _press_media_key(VK_MEDIA_PREV_TRACK)

def stop() -> bool:
    return _press_media_key(VK_MEDIA_STOP)
