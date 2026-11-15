"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import json
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

SPEECH = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SPEECH))

from server import make_handler  # noqa: E402

WAV = (SPEECH.parent / "app" / "assets" / "audio" / "muraho.wav").read_bytes()


class FakeTranscriber:
    def transcribe(self, audio):
        return "muraho"


class ServerKeyTest(unittest.TestCase):
    """On Azure the service has a public address, so only callers with the key get an answer."""

    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(FakeTranscriber(), key="secret-key"))
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def post(self, headers):
        request = urllib.request.Request(f"{self.url}/transcribe", data=WAV, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def test_health_needs_no_key(self):
        with urllib.request.urlopen(f"{self.url}/health") as response:
            self.assertEqual(response.status, 200)

    def test_a_request_without_the_key_is_refused(self):
        self.assertEqual(self.post({}), (401, {"error": "UNAUTHORIZED"}))

    def test_a_wrong_key_is_refused(self):
        self.assertEqual(self.post({"X-Speech-Key": "guess"}), (401, {"error": "UNAUTHORIZED"}))

    def test_the_right_key_gets_the_text(self):
        self.assertEqual(self.post({"X-Speech-Key": "secret-key"}), (200, {"text": "muraho"}))


if __name__ == "__main__":
    unittest.main()
