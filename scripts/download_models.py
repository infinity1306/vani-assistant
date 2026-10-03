import os
import urllib.request
import tarfile
from pathlib import Path

def download_file(url: str, dest_path: Path):
    if dest_path.exists():
        print(f"Already exists: {dest_path}")
        return
    print(f"Downloading {url} to {dest_path}...")
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, str(dest_path))
    print("Done.")

def download_piper_models():
    # Piper TTS models
    base_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/"
    model_file = "en_US-amy-medium.onnx"
    json_file = "en_US-amy-medium.onnx.json"
    
    piper_dir = Path("models/piper")
    download_file(base_url + model_file, piper_dir / model_file)
    download_file(base_url + json_file, piper_dir / json_file)

def download_silero_vad():
    # Silero VAD ONNX model v5
    url = "https://github.com/snakers4/silero-vad/raw/master/src/silero_vad/data/silero_vad.onnx"
    download_file(url, Path("models/silero_vad.onnx"))

def main():
    print("Downloading VANI offline models...")
    download_piper_models()
    download_silero_vad()
    print("All downloads complete.")

if __name__ == "__main__":
    main()
