from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
import comtypes

def _get_audio_interface():
    comtypes.CoInitialize()
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    return volume

def set_volume(level: float) -> bool:
    """Sets volume to a level between 0.0 and 1.0"""
    try:
        level = max(0.0, min(1.0, level))
        volume = _get_audio_interface()
        volume.SetMasterVolumeLevelScalar(level, None)
        return True
    except Exception:
        return False

def get_volume() -> float:
    try:
        volume = _get_audio_interface()
        return volume.GetMasterVolumeLevelScalar()
    except Exception:
        return -1.0

def mute(state: bool = True) -> bool:
    try:
        volume = _get_audio_interface()
        volume.SetMute(1 if state else 0, None)
        return True
    except Exception:
        return False

def _get_mic_interface():
    comtypes.CoInitialize()
    devices = AudioUtilities.GetMicrophone()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    mic_volume = cast(interface, POINTER(IAudioEndpointVolume))
    return mic_volume

def mute_mic(state: bool = True) -> bool:
    try:
        mic = _get_mic_interface()
        mic.SetMute(1 if state else 0, None)
        return True
    except Exception as e:
        print(f"Error muting mic: {e}")
        return False
