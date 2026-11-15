"""Downloads the speech model files that are missing (on Azure: once, at first start)."""

import logging
import shutil
import urllib.request
from pathlib import Path

HF_URL = "https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx/resolve/main"
MODEL_FILES = ("model.int8.onnx", "vocab.txt", "config.json")

log = logging.getLogger("speech")


def ensure_model(model_dir: Path, base_url: str = HF_URL) -> None:
    model_dir.mkdir(parents=True, exist_ok=True)
    for name in MODEL_FILES:
        target = model_dir / name
        if target.exists():
            continue
        log.info("Downloading %s", name)
        # Written under a temporary name first, so a broken download is never mistaken for the model.
        partial = target.with_name(name + ".part")
        try:
            with urllib.request.urlopen(f"{base_url}/{name}") as response, partial.open("wb") as out:
                shutil.copyfileobj(response, out)
            partial.rename(target)
        finally:
            partial.unlink(missing_ok=True)
