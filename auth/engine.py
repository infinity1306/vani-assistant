import os
import json
import time
import numpy as np
import torch
import logging

logger = logging.getLogger("VANI-SpeakerAuth")

class SpeakerAuthEngine:
    """
    Speaker authentication engine utilizing SpeechBrain's ECAPA-TDNN model.
    Handles enrollment of voice samples and verification against enrolled profiles.
    """
    def __init__(self, threshold: float = 0.75, embeddings_path: str = None):
        self.threshold = threshold
        if embeddings_path is None:
            try:
                with open("config.json", encoding="utf-8") as f:
                    config = json.load(f)
                    self.embeddings_path = config.get("auth", {}).get("embeddings_path", "data/embeddings.enc")
            except Exception:
                self.embeddings_path = "data/embeddings.enc"
        else:
            self.embeddings_path = embeddings_path
            
        self._verifier = None

    def _get_verifier(self):
        if self._verifier is None:
            try:
                from speechbrain.inference.speaker import SpeakerRecognition
                # Load pre-trained speaker recognition model
                self._verifier = SpeakerRecognition.from_hparams(
                    source="speechbrain/spkrec-ecapa-voxceleb", 
                    savedir="models/spkrec-ecapa-voxceleb"
                )
            except ImportError:
                logger.warning("SpeechBrain not installed. Speaker authentication will run in MOCK mode.")
                self._verifier = "MOCK"
        return self._verifier

    def enroll(self, samples: list) -> None:
        """
        Enrolls a speaker profile using multiple voice samples.
        """
        verifier = self._get_verifier()
        if verifier == "MOCK":
            logger.warning("MOCK Mode: Saving dummy voice profile.")
            dummy = np.zeros((1, 192), dtype=np.float32)
            os.makedirs(os.path.dirname(self.embeddings_path), exist_ok=True)
            with open(self.embeddings_path, "wb") as f:
                np.save(f, dummy)
            return

        embeddings = []
        for sample in samples:
            if sample.dtype == np.int16:
                audio_float = sample.astype(np.float32) / 32768.0
            else:
                audio_float = sample.astype(np.float32)
                
            audio_tensor = torch.from_numpy(audio_float).float().unsqueeze(0)
            
            with torch.no_grad():
                emb = verifier.encode_batch(audio_tensor)
                emb_np = emb.squeeze().cpu().numpy()
                embeddings.append(emb_np)
                
        avg_embedding = np.mean(embeddings, axis=0)
        os.makedirs(os.path.dirname(self.embeddings_path), exist_ok=True)
        with open(self.embeddings_path, "wb") as f:
            np.save(f, avg_embedding)

    def verify(self, audio_data: np.ndarray) -> tuple:
        """
        Verifies the speaker's audio against the enrolled voice profile.
        Returns (is_owner, score).
        """
        if not os.path.exists(self.embeddings_path):
            logger.warning("No owner embedding found! VANI will accept ALL voices until enrolled.")
            return True, 1.0

        verifier = self._get_verifier()
        if verifier == "MOCK":
            return True, 1.0

        try:
            with open(self.embeddings_path, "rb") as f:
                enrolled_emb = np.load(f)
        except Exception as e:
            logger.error(f"Failed to load enrolled embedding: {e}")
            return True, 1.0

        if audio_data.dtype == np.int16:
            audio_float = audio_data.astype(np.float32) / 32768.0
        else:
            audio_float = audio_data.astype(np.float32)
            
        audio_tensor = torch.from_numpy(audio_float).float().unsqueeze(0)
        
        with torch.no_grad():
            emb = verifier.encode_batch(audio_tensor)
            emb_np = emb.squeeze().cpu().numpy()

        # Compute cosine similarity
        norm_enrolled = np.linalg.norm(enrolled_emb)
        norm_current = np.linalg.norm(emb_np)
        if norm_enrolled == 0 or norm_current == 0:
            score = 0.0
        else:
            score = np.dot(enrolled_emb, emb_np) / (norm_enrolled * norm_current)

        is_owner = bool(score >= self.threshold)
        return is_owner, float(score)


class SessionAuthEngine:
    """
    Session-cached speaker verification to minimize latency.
    Authenticates the user once, then grants a 15-minute trust token.
    """
    def __init__(self, session_timeout_sec: int = 900):
        self.session_timeout_sec = session_timeout_sec
        self.last_auth_time = 0.0
        self.is_authenticated = False
        self.speaker_auth = SpeakerAuthEngine()

    def verify_audio(self, audio_chunk: np.ndarray, enrolled_embedding=None) -> bool:
        """
        Verify the speaker's audio.
        If already authenticated within the session timeout, returns True instantly.
        """
        current_time = time.time()
        
        # Check session cache
        if self.is_authenticated and (current_time - self.last_auth_time < self.session_timeout_sec):
            return True

        is_match, score = self.speaker_auth.verify(audio_chunk)

        if is_match:
            self.is_authenticated = True
            self.last_auth_time = current_time
            return True
            
        return False

    def revoke_session(self):
        """Force re-authentication on the next wake word."""
        self.is_authenticated = False
        self.last_auth_time = 0.0
