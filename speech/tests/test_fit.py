"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fit import BLANK, word_gaps  # noqa: E402

LETTER = {c: i + 2 for i, c in enumerate("abcdefghijklmnopqrstuvwxyz")}
SEPARATOR = 0


def sounding(frames: list[int], vocab: int = 30) -> np.ndarray:
    """Log-probabilities that put almost all weight on the given symbol in each frame."""
    logp = np.full((len(frames), vocab), np.log(1e-4))
    for t, symbol in enumerate(frames):
        logp[t, symbol] = np.log(0.9999)
    return logp


class WordGapsTest(unittest.TestCase):
    def test_a_word_said_exactly_as_expected_has_no_gap(self):
        # "ab" spoken: a, a, blank, b, b
        logp = sounding([LETTER["a"], LETTER["a"], BLANK, LETTER["b"], LETTER["b"]])
        gaps = word_gaps(logp, "ab")
        self.assertLess(gaps[0], 0.01)

    def test_a_different_word_has_a_large_gap(self):
        logp = sounding([LETTER["a"], LETTER["a"], BLANK, LETTER["b"], LETTER["b"]])
        gaps = word_gaps(logp, "cd")
        self.assertGreater(gaps[0], 1.0)

    def test_each_word_gets_its_own_gap(self):
        # "ab cd" spoken, both words right
        frames = [LETTER["a"], BLANK, LETTER["b"], SEPARATOR, LETTER["c"], BLANK, LETTER["d"]]
        gaps = word_gaps(sounding(frames), "ab cd")
        self.assertEqual(len(gaps), 2)
        self.assertLess(max(gaps), 0.01)

    def test_a_missing_word_is_a_large_gap_for_that_word_only(self):
        # Only "ab" spoken, "cd" missing
        frames = [LETTER["a"], BLANK, LETTER["b"], BLANK, BLANK]
        gaps = word_gaps(sounding(frames), "ab cd")
        self.assertLess(gaps[0], 0.01)
        self.assertGreater(gaps[1], 1.0)

    def test_too_few_frames_gives_large_gaps_not_a_crash(self):
        gaps = word_gaps(sounding([LETTER["a"]]), "abcdef")
        self.assertTrue(all(g > 1.0 for g in gaps))


if __name__ == "__main__":
    unittest.main()
