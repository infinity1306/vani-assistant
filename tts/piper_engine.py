import numpy as np

class PiperTTSEngine:
    def __init__(self, model_path="models/piper/en_US-amy-medium.onnx", config_path=None):
        """
        Initialize the Piper TTS engine with the specified ONNX model.
        """
        from piper.voice import PiperVoice  # type: ignore
        
        if config_path is None:
            config_path = f"{model_path}.json"
            
        self.voice = PiperVoice.load(model_path, config_path)
        
        # Typically the sample rate is inside voice.config.sample_rate
        # Defaulting to 22050 if not found
        if hasattr(self.voice, 'config') and hasattr(self.voice.config, 'sample_rate'):
            self.sample_rate = self.voice.config.sample_rate
        else:
            self.sample_rate = 22050
            
        self.cache = {}

    def synthesize(self, text):
        """
        Synthesize text to audio. Uses a simple cache for short phrases (< 100 chars).
        Returns a numpy array of audio data.
        """
        is_short = len(text) < 100
        
        if is_short and text in self.cache:
            return self.cache[text]

        audio_chunks = []
        for chunk in self.voice.synthesize(text):
            audio_chunks.append(chunk.audio_int16_array)
            
        if not audio_chunks:
            audio_array = np.array([], dtype=np.int16)
        else:
            audio_array = np.concatenate(audio_chunks)

        if is_short:
            self.cache[text] = audio_array

        return audio_array
