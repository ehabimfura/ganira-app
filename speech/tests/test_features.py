"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import sys
import unittest
from pathlib import Path

import numpy as np

SPEECH = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SPEECH))

from features import speech_features  # noqa: E402
from transcriber import decode_audio  # noqa: E402

AUDIO = SPEECH.parent / "app" / "assets" / "audio"
FIXTURES = Path(__file__).parent / "fixtures"


class SpeechFeaturesTest(unittest.TestCase):
    """Our features must match transformers' SeamlessM4TFeatureExtractor, which the model was
    trained with. The fixtures hold its output for two lesson clips."""

    def test_matches_the_feature_extractor_the_model_was_trained_with(self):
        for clip in ["muraho", "ndaguha"]:
            expected = np.load(FIXTURES / f"{clip}_features.npy")
            ours = speech_features(decode_audio((AUDIO / f"{clip}.wav").read_bytes()))
            self.assertEqual(ours.shape, expected.shape, clip)
            np.testing.assert_allclose(ours, expected, atol=1e-3, err_msg=clip)


if __name__ == "__main__":
    unittest.main()
