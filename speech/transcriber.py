"""Turns a short Kinyarwanda recording into text.

Model: OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx (int8), the ONNX export of
badrex/w2v-bert-2.0-kinyarwanda-asr by Badr M. Abdullah / the ASRwanda team and
Digital Umuganda. Licence CC BY 4.0, credited on the app's Credits screen.
"""

import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import SeamlessM4TFeatureExtractor

SAMPLE_RATE = 16000
MAX_SECONDS = 15
BLANK = "<blk>"
WORD_SEPARATOR = "▁"
SKIPPED = {BLANK, "<s>", "</s>", "[UNK]"}


class AudioError(ValueError):
    """The upload is not audio ffmpeg can read, or it is too long."""


def decode_audio(data: bytes) -> np.ndarray:
    """Any audio format a phone or browser records (m4a, webm, wav...) -> 16 kHz mono floats."""
    result = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", "pipe:0",
         "-t", str(MAX_SECONDS), "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "pipe:1"],
        input=data,
        capture_output=True,
        check=False,
    )
    audio = np.frombuffer(result.stdout, dtype=np.float32)
    if result.returncode != 0 or audio.size < SAMPLE_RATE // 10:
        raise AudioError(result.stderr.decode(errors="replace").strip() or "no audio found")
    return audio


class Transcriber:
    def __init__(self, model_dir: Path):
        self.session = ort.InferenceSession(str(model_dir / "model.int8.onnx"), providers=["CPUExecutionProvider"])
        # The feature extractor the model was trained with (log-mel, normalised, 2 frames stacked).
        self.features = SeamlessM4TFeatureExtractor()
        self.vocab = {}
        for line in (model_dir / "vocab.txt").read_text(encoding="utf-8").splitlines():
            token, index = line.rsplit(" ", 1)
            self.vocab[int(index)] = token

    def transcribe(self, audio: np.ndarray) -> str:
        features = self.features(audio, sampling_rate=SAMPLE_RATE, return_tensors="np")["input_features"]
        logprobs, lengths = self.session.run(
            None,
            {"features": features.astype(np.float32), "features_lens": np.array([features.shape[1]], dtype=np.int64)},
        )
        return self._greedy_ctc(logprobs[0][: lengths[0]].argmax(axis=-1))

    def _greedy_ctc(self, ids: np.ndarray) -> str:
        """Best token per frame, repeats merged, blanks dropped."""
        text, previous = [], None
        for index in ids.tolist():
            if index != previous:
                token = self.vocab[index]
                if token not in SKIPPED:
                    text.append(" " if token == WORD_SEPARATOR else token)
            previous = index
        return " ".join("".join(text).split())
