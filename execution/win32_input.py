import ctypes
from ctypes import wintypes
import time

# Types and constants
LONG = ctypes.c_long
DWORD = ctypes.c_ulong
ULONG_PTR = ctypes.POINTER(DWORD)
WORD = ctypes.c_ushort

class MOUSEINPUT(ctypes.Structure):
    _fields_ = (("dx", LONG),
                ("dy", LONG),
                ("mouseData", DWORD),
                ("dwFlags", DWORD),
                ("time", DWORD),
                ("dwExtraInfo", ULONG_PTR))

class KEYBDINPUT(ctypes.Structure):
    _fields_ = (("wVk", WORD),
                ("wScan", WORD),
                ("dwFlags", DWORD),
                ("time", DWORD),
                ("dwExtraInfo", ULONG_PTR))

class HARDWAREINPUT(ctypes.Structure):
    _fields_ = (("uMsg", DWORD),
                ("wParamL", WORD),
                ("wParamH", WORD))

class INPUT_I(ctypes.Union):
    _fields_ = (("mi", MOUSEINPUT),
                ("ki", KEYBDINPUT),
                ("hi", HARDWAREINPUT))

class INPUT(ctypes.Structure):
    _fields_ = (("type", DWORD),
                ("ii", INPUT_I))

INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
INPUT_HARDWARE = 2

# Mouse flags
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_ABSOLUTE = 0x8000
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_MIDDLEDOWN = 0x0020
MOUSEEVENTF_MIDDLEUP = 0x0040

# Keyboard flags
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004

VK_SHIFT = 0x10
VK_CONTROL = 0x11
VK_MENU = 0x12 # ALT

def move_mouse(x: int, y: int) -> None:
    screen_width = ctypes.windll.user32.GetSystemMetrics(0)
    screen_height = ctypes.windll.user32.GetSystemMetrics(1)
    
    fx = int(x * 65536 / screen_width)
    fy = int(y * 65536 / screen_height)
    
    extra = ctypes.c_ulong(0)
    ii_ = INPUT_I()
    ii_.mi = MOUSEINPUT(fx, fy, 0, MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, 0, ctypes.pointer(extra))
    x_input = INPUT(INPUT_MOUSE, ii_)
    ctypes.windll.user32.SendInput(1, ctypes.pointer(x_input), ctypes.sizeof(x_input))

def click(button: str = 'left') -> None:
    down_flag = MOUSEEVENTF_LEFTDOWN
    up_flag = MOUSEEVENTF_LEFTUP
    if button == 'right':
        down_flag = MOUSEEVENTF_RIGHTDOWN
        up_flag = MOUSEEVENTF_RIGHTUP
    elif button == 'middle':
        down_flag = MOUSEEVENTF_MIDDLEDOWN
        up_flag = MOUSEEVENTF_MIDDLEUP
        
    extra = ctypes.c_ulong(0)
    
    ii_down = INPUT_I()
    ii_down.mi = MOUSEINPUT(0, 0, 0, down_flag, 0, ctypes.pointer(extra))
    input_down = INPUT(INPUT_MOUSE, ii_down)
    
    ii_up = INPUT_I()
    ii_up.mi = MOUSEINPUT(0, 0, 0, up_flag, 0, ctypes.pointer(extra))
    input_up = INPUT(INPUT_MOUSE, ii_up)
    
    inputs = (INPUT * 2)(input_down, input_up)
    ctypes.windll.user32.SendInput(2, inputs, ctypes.sizeof(INPUT))

def type_text(text: str) -> None:
    for char in text:
        extra = ctypes.c_ulong(0)
        
        ii_down = INPUT_I()
        ii_down.ki = KEYBDINPUT(0, ord(char), KEYEVENTF_UNICODE, 0, ctypes.pointer(extra))
        input_down = INPUT(INPUT_KEYBOARD, ii_down)
        
        ii_up = INPUT_I()
        ii_up.ki = KEYBDINPUT(0, ord(char), KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 0, ctypes.pointer(extra))
        input_up = INPUT(INPUT_KEYBOARD, ii_up)
        
        inputs = (INPUT * 2)(input_down, input_up)
        ctypes.windll.user32.SendInput(2, inputs, ctypes.sizeof(INPUT))

def press_key(vk_code: int) -> None:
    extra = ctypes.c_ulong(0)
    
    ii_down = INPUT_I()
    ii_down.ki = KEYBDINPUT(vk_code, 0, 0, 0, ctypes.pointer(extra))
    input_down = INPUT(INPUT_KEYBOARD, ii_down)
    
    ii_up = INPUT_I()
    ii_up.ki = KEYBDINPUT(vk_code, 0, KEYEVENTF_KEYUP, 0, ctypes.pointer(extra))
    input_up = INPUT(INPUT_KEYBOARD, ii_up)
    
    inputs = (INPUT * 2)(input_down, input_up)
    ctypes.windll.user32.SendInput(2, inputs, ctypes.sizeof(INPUT))

def scroll(direction: str = 'down', clicks: int = 3) -> None:
    """Scrolls the mouse wheel up or down."""
    MOUSEEVENTF_WHEEL = 0x0800
    WHEEL_DELTA = 120
    
    amount = WHEEL_DELTA * clicks
    if direction == 'down':
        amount = -amount
        
    extra = ctypes.c_ulong(0)
    ii = INPUT_I()
    # mouseData is a DWORD, but it can represent negative numbers as 2's complement
    # For negative values, we need to mask it with 0xFFFFFFFF
    mouse_data = amount & 0xFFFFFFFF
    ii.mi = MOUSEINPUT(0, 0, mouse_data, MOUSEEVENTF_WHEEL, 0, ctypes.pointer(extra))
    
    x_input = INPUT(INPUT_MOUSE, ii)
    ctypes.windll.user32.SendInput(1, ctypes.pointer(x_input), ctypes.sizeof(INPUT))
