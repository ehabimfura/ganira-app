"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import sys
import unittest
from pathlib import Path

import numpy as np

SPEECH = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SPEECH))

from transcriber import AudioError, Transcriber, decode_audio, trim_silence  # noqa: E402

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


class TrimSilenceTest(unittest.TestCase):
    """Less audio means less work for the model, so silence around the speech is cut."""

    def test_silence_before_and_after_speech_is_cut(self):
        speech = decode_audio((AUDIO / "muraho.wav").read_bytes())
        silence = np.zeros(16000 * 2, dtype=np.float32)
        padded = np.concatenate([silence, speech, silence])
        trimmed = trim_silence(padded)
        self.assertLess(len(trimmed), len(speech) + 16000 * 0.6)
        self.assertGreaterEqual(len(trimmed), int(len(speech) * 0.8))

    def test_audio_with_no_speech_is_kept(self):
        silence = np.zeros(16000, dtype=np.float32)
        self.assertEqual(len(trim_silence(silence)), len(silence))


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

    def test_still_hears_muraho_after_long_silences_are_cut(self):
        speech = decode_audio((AUDIO / "muraho.wav").read_bytes())
        silence = np.zeros(16000 * 3, dtype=np.float32)
        self.assertEqual(self.transcriber.transcribe(np.concatenate([silence, speech, silence])), "muraho")


if __name__ == "__main__":
    unittest.main()
