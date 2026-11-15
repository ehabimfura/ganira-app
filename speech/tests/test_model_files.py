"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import sys
import tempfile
import unittest
from pathlib import Path

SPEECH = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SPEECH))

from model_files import MODEL_FILES, ensure_model  # noqa: E402


class EnsureModelTest(unittest.TestCase):
    """On Azure the model is downloaded once, at first start, into persistent storage."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.source = root / "source"
        self.source.mkdir()
        for name in MODEL_FILES:
            (self.source / name).write_text(f"contents of {name}")
        self.target = root / "model"

    def tearDown(self):
        self.tmp.cleanup()

    def test_missing_files_are_downloaded(self):
        ensure_model(self.target, base_url=self.source.as_uri())
        for name in MODEL_FILES:
            self.assertEqual((self.target / name).read_text(), f"contents of {name}")

    def test_files_already_there_are_kept(self):
        self.target.mkdir()
        (self.target / "vocab.txt").write_text("already here")
        ensure_model(self.target, base_url=self.source.as_uri())
        self.assertEqual((self.target / "vocab.txt").read_text(), "already here")

    def test_a_failed_download_leaves_no_half_file(self):
        (self.source / "model.int8.onnx").unlink()
        with self.assertRaises(OSError):
            ensure_model(self.target, base_url=self.source.as_uri())
        self.assertFalse((self.target / "model.int8.onnx").exists())


if __name__ == "__main__":
    unittest.main()
