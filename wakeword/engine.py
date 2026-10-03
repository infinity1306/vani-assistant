import numpy as np
import logging

try:
    from openwakeword.model import Model
    OWW_AVAILABLE = True
except ImportError:
    OWW_AVAILABLE = False

logger = logging.getLogger("VANI-WakeWord")

class WakeWordEngine:
    def __init__(self, model_paths=None, threshold=0.5):
        if model_paths is None:
            model_paths = ["models/vani_v1.onnx"]
        self.model_paths = model_paths
        self.threshold = threshold
        self.owwModel = None
        
        if OWW_AVAILABLE:
            try:
                self.owwModel = Model(wakeword_models=self.model_paths, inference_framework="onnx")
                logger.info(f"OpenWakeWord initialized with models: {self.model_paths}")
            except Exception as e:
                logger.error(f"Failed to load OpenWakeWord: {e}")
        else:
            logger.warning("openwakeword package not found. VANI voice wake is disabled or relying on fallback.")

    def process_chunk(self, chunk):
        # Fallback to simple RMS audio detection if model fails
        if self.owwModel is None:
            return False

        prediction = self.owwModel.predict(chunk)
        
        # Check if any model crossed the threshold
        for mdl in self.owwModel.prediction_buffer.keys():
            scores = list(self.owwModel.prediction_buffer[mdl])
            if scores and scores[-1] > self.threshold:
                self.reset() # Reset state after trigger
                return True
        return False

    def reset(self):
        if self.owwModel is not None:
            self.owwModel.reset()

