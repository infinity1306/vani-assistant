import logging
import asyncio
import numpy as np
from openwakeword.model import Model

logger = logging.getLogger("VANI-WakeWord")

class WakeWordEngine:
    """
    Wraps the OpenWakeWord model to continuously scan audio chunks for 'Vani'.
    """
    def __init__(self, model_paths=["models/vani_v1.onnx"], threshold=0.5):
        # Load the defined customized model
        logger.info(f"Loading custom OpenWakeWord model(s): {model_paths}")
        self.model = Model(wakeword_models=model_paths, inference_framework="onnx")
             
        self.threshold = threshold
        self.model_name = list(self.model.models.keys())[0]
        logger.info(f"WakeWord Engine initialized with model '{self.model_name}' (threshold: {self.threshold})")

    def reset(self):
        """Resets internal model state after a detection to prevent ghost triggers."""
        try:
            self.model.reset()
            logger.info("WakeWord model state reset.")
        except Exception as e:
            logger.warning(f"WakeWord reset failed (non-critical): {e}")

    def process_chunk(self, chunk: np.ndarray) -> bool:
        """
        Process a new chunk of 16kHz int16 audio data.
        Returns True if wake word is detected.
        """
        # openwakeword expects chunks of ~1280 samples (80ms)
        prediction = self.model.predict(chunk)
        
        # Check scores
        if self.model_name in prediction:
            score = prediction[self.model_name]
            if score > self.threshold:
                logger.info(f"Wake Word Detected! Score: {score:.3f}")
                return True
                
        return False
