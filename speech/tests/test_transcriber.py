"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import sys
import unittest
from pathlib import Path

import numpy as np

SPEECH = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SPEECH))

from transcriber import AudioError, Transcriber, decode_audio  # noqa: E402

AUDIO = SPEECH.parent / "app" / "assets" / "audio"
MODEL = SPEECH / "model"


class DecodeAudioTest(unittest.TestCase):
    def test_a_wav_becomes_16khz_mono(self):
        audio = decode_audio((AUDIO / "muraho.wav").read_bytes())
        self.assertEqual(audio.dtype, np.float32)
        self.assertAlmostEqual(len(audio) / 16000, 1.3, delta=0.5)

    def test_something_that_is_not_audio_is_refused(self):
        with self.assertRaises(AudioError):
            decode_audio(b"this is not a recording")


@unittest.skipUnless((MODEL / "model.int8.onnx").exists(), "speech model not downloaded")
class TranscriberTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.transcriber = Transcriber(MODEL)

    def test_greedy_decoding_merges_repeats_and_drops_blanks(self):
        ids = {token: index for index, token in self.transcriber.vocab.items()}
        frames = [ids[t] for t in ["y", "y", "<blk>", "e", "g", "g", "o", "▁", "▁", "<blk>", "o"]]
        self.assertEqual(self.transcriber._greedy_ctc(np.array(frames)), "yego o")

    def test_hears_muraho_in_the_lesson_voice(self):
        audio = decode_audio((AUDIO / "muraho.wav").read_bytes())
        self.assertEqual(self.transcriber.transcribe(audio), "muraho")


if __name__ == "__main__":
    unittest.main()
