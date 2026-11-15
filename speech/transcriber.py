"""Turns a short Kinyarwanda recording into text.

Model: OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx (int8), the ONNX export of
badrex/w2v-bert-2.0-kinyarwanda-asr by Badr M. Abdullah / the ASRwanda team and
Digital Umuganda. Licence CC BY 4.0, credited on the app's Credits screen.
"""

import io
import logging
import os
import time
from pathlib import Path

import av
import numpy as np
import onnxruntime as ort

from features import speech_features

SAMPLE_RATE = 16000
MAX_SECONDS = 15
BLANK = "<blk>"
WORD_SEPARATOR = "▁"
SKIPPED = {BLANK, "<s>", "</s>", "[UNK]"}


class AudioError(ValueError):
    """The upload is not audio that can be read."""


def decode_audio(data: bytes) -> np.ndarray:
    """Any audio format a phone or browser records (m4a, webm, wav...) -> 16 kHz mono floats.

    PyAV carries its own copy of FFmpeg, so the server needs nothing else installed.
    """
    limit = MAX_SECONDS * SAMPLE_RATE
    chunks, total = [], 0
    try:
        with av.open(io.BytesIO(data)) as container:
            resampler = av.AudioResampler(format="flt", layout="mono", rate=SAMPLE_RATE)
            for frame in container.decode(container.streams.audio[0]):
                for out in resampler.resample(frame):
                    chunks.append(out.to_ndarray().reshape(-1))
                    total += chunks[-1].size
                if total >= limit:
                    break
            else:
                chunks.extend(out.to_ndarray().reshape(-1) for out in resampler.resample(None))
    except (av.FFmpegError, IndexError, ValueError) as error:
        raise AudioError(str(error) or "no audio found") from error
    audio = np.concatenate(chunks)[:limit] if chunks else np.zeros(0, dtype=np.float32)
    if audio.size < SAMPLE_RATE // 10:
        raise AudioError("no audio found")
    return audio.astype(np.float32, copy=False)


FRAME = SAMPLE_RATE // 50  # 20 ms
LEAD = int(SAMPLE_RATE * 0.3)  # quiet kept before the speech
TAIL = int(SAMPLE_RATE * 0.6)  # and after it: the model needs a pause to finish the last word


def trim_silence(audio: np.ndarray) -> np.ndarray:
    """Cuts the quiet before and after the speech: the model's time grows with the audio's length.

    A frame counts as speech when it is louder than 2% of the loudest frame (a breathy "h" is soft) and above
    a fixed floor (so a silent recording is returned whole and judged by the model).
    """
    frames = len(audio) // FRAME
    if frames == 0:
        return audio
    rms = np.sqrt(np.mean(audio[: frames * FRAME].reshape(frames, FRAME) ** 2, axis=1))
    loud = np.flatnonzero(rms > max(0.02 * rms.max(), 0.003))
    if loud.size == 0:
        return audio
    start = max(0, loud[0] * FRAME - LEAD)
    end = min(len(audio), (loud[-1] + 1) * FRAME + TAIL)
    return audio[start:end]


class Transcriber:
    def __init__(self, model_dir: Path):
        # In a container the machine may show many processors while the plan pays for one.
        # ONNX Runtime would start a busy-waiting worker per processor, all fighting for that
        # one, so the worker count comes from SPEECH_THREADS and idle workers sleep.
        options = ort.SessionOptions()
        threads = int(os.environ.get("SPEECH_THREADS", "0"))  # 0: ONNX Runtime decides
        options.intra_op_num_threads = threads
        options.inter_op_num_threads = 1
        options.add_session_config_entry("session.intra_op.allow_spinning", "0")
        # On Intel/AMD servers ONNX Runtime can keep a second, rearranged copy of the weights
        # to run faster. SPEECH_PREPACK=0 turns that off to save memory.
        if os.environ.get("SPEECH_PREPACK") == "0":
            options.add_session_config_entry("session.disable_prepacking", "1")
        logging.getLogger("speech").info(
            "Processors seen: %s; usable: %s; model threads: %s; prepacking: %s",
            os.cpu_count(),
            len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else "?",
            threads or "auto",
            "off" if os.environ.get("SPEECH_PREPACK") == "0" else "on",
        )
        self.session = ort.InferenceSession(
            str(model_dir / "model.int8.onnx"), options, providers=["CPUExecutionProvider"]
        )
        self.last_timing = ""
        self.vocab = {}
        for line in (model_dir / "vocab.txt").read_text(encoding="utf-8").splitlines():
            token, index = line.rsplit(" ", 1)
            self.vocab[int(index)] = token

    def transcribe(self, audio: np.ndarray) -> str:
        audio = trim_silence(audio)
        started = time.perf_counter()
        # The input the model was trained with: log-mel, normalised, 2 frames stacked (features.py).
        features = speech_features(audio)[None]
        featured = time.perf_counter()
        logprobs, lengths = self.session.run(
            None,
            {"features": features.astype(np.float32), "features_lens": np.array([features.shape[1]], dtype=np.int64)},
        )
        done = time.perf_counter()
        self.last_timing = f"features {(featured - started) * 1000:.0f} ms, model {(done - featured) * 1000:.0f} ms"
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
