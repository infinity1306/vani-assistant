import wmi

def set_brightness(level: int) -> bool:
    """Sets display brightness to a level between 0 and 100"""
    try:
        level = max(0, min(100, level))
        c = wmi.WMI(namespace='wmi')
        monitors = c.WmiMonitorBrightnessMethods()
        for monitor in monitors:
            monitor.WmiSetBrightness(level, 0)
        return True
    except Exception:
        return False
