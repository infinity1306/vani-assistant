import mss
import numpy as np
from typing import Optional, Union

def capture(save_path: Optional[str] = None) -> Union[np.ndarray, bool]:
    """Captures a screenshot. Returns numpy array, or saves to file if save_path is provided."""
    try:
        with mss.mss() as sct:
            monitor = sct.monitors[1] # Primary monitor
            sct_img = sct.grab(monitor)
            
            # Convert to numpy array
            img = np.array(sct_img)
            
            if save_path:
                try:
                    import cv2
                    cv2.imwrite(save_path, img)
                    return True
                except ImportError:
                    # Fallback to PIL if cv2 is not available
                    try:
                        from PIL import Image
                        # mss returns BGRA, PIL expects RGBA or RGB
                        img_pil = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                        img_pil.save(save_path)
                        return True
                    except ImportError:
                        pass
                return False
            return img
    except Exception:
        if save_path:
            return False
        return np.zeros((1, 1, 3), dtype=np.uint8)
