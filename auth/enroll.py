import asyncio
import numpy as np
import warnings
from auth.engine import SpeakerAuthEngine
from core.audio_buffer import AudioBuffer

# Ignore torch future warnings for clean output
warnings.filterwarnings("ignore")

async def run_enrollment():
    print("="*50)
    print(" VANI SPEAKER ENROLLMENT TOOL")
    print("="*50)
    
    buffer = AudioBuffer(sample_rate=16000, max_seconds=3)
    auth = SpeakerAuthEngine(threshold=0.75)
    
    print("\nWe need 3 distinct samples of you saying the wake word 'Vani'.")
    samples = []
    
    buffer.start()
    try:
        for i in range(1, 4):
            input(f"\nPress Enter, then clearly say 'Vani' (Sample {i}/3)...")
            
            # Wait a moment to capture the audio after they press enter
            # In a real UI we would use VAD. Here we just sleep and grab buffer
            print("Listening...")
            await asyncio.sleep(1.5)
            
            audio_data = buffer.get_latest_audio(seconds=2.0)
            
            # Simple check to ensure it's not complete silence
            # audio array is int16, so values up to 32k. 
            if np.max(np.abs(audio_data)) < 100:
                print("Audio too quiet! Did you speak? We will try to enroll it anyway.")
                
            samples.append(audio_data)
            print(f"Sample {i} captured.")
            
        print("\nAll samples captured. Processing embeddings (this might take a few seconds)...")
        auth.enroll(samples)
        
        print("\nEnrollment Complete! Your voice profile has been saved securely.")
        print(f"Profile path: {auth.embeddings_path}")
        
    finally:
        buffer.stop()

if __name__ == "__main__":
    asyncio.run(run_enrollment())
