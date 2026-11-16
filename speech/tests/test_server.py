"""Run from speech/: .venv/bin/python -m unittest discover tests"""

import json
import sys
import threading
import time
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
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(lambda: FakeTranscriber(), key="secret-key"))
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


class StartingTest(unittest.TestCase):
    """While the model loads, the service already answers, so Azure can retire the old copy."""

    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(lambda: None))
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_health_answers_while_the_model_loads(self):
        with urllib.request.urlopen(f"{self.url}/health") as response:
            self.assertEqual(json.load(response), {"status": "ok", "model": "loading"})

    def test_a_recording_sent_too_early_gets_a_clear_not_ready(self):
        request = urllib.request.Request(f"{self.url}/transcribe", data=WAV, method="POST")
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request)
        self.assertEqual((caught.exception.code, json.load(caught.exception)), (503, {"error": "STARTING"}))


class SlowTranscriber:
    """Remembers how many transcriptions ran at the same moment."""

    def __init__(self):
        self.running = 0
        self.most = 0
        self.lock = threading.Lock()

    def transcribe(self, audio):
        with self.lock:
            self.running += 1
            self.most = max(self.most, self.running)
        time.sleep(0.2)
        with self.lock:
            self.running -= 1
        return "muraho"


class OneAtATimeTest(unittest.TestCase):
    """On a one-core server, checks that run together all slow down; one at a time is faster."""

    def test_recordings_are_transcribed_one_after_another(self):
        transcriber = SlowTranscriber()
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(lambda: transcriber))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/transcribe"
        try:
            def post():
                urllib.request.urlopen(urllib.request.Request(url, data=WAV, method="POST")).read()

            threads = [threading.Thread(target=post) for _ in range(3)]
            for t in threads:
                t.start()
            for t in threads:
                t.join()
        finally:
            server.shutdown()
            server.server_close()
        self.assertEqual(transcriber.most, 1)


class ScoringTranscriber:
    def transcribe(self, audio):
        return "muraho"

    def score(self, audio, expected):
        return "muraho", [0.0, 4.0]  # the first word fits the audio, the second does not


class ExpectedPhraseTest(unittest.TestCase):
    """With the X-Expected header, the answer says which words fit the audio, not only the text."""

    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(lambda: ScoringTranscriber()))
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}/transcribe"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_each_expected_word_says_whether_it_was_heard(self):
        request = urllib.request.Request(self.url, data=WAV, headers={"X-Expected": "Muraho%20mwiriwe"}, method="POST")
        with urllib.request.urlopen(request) as response:
            body = json.load(response)
        self.assertEqual(body["text"], "muraho")
        self.assertEqual([w["heard"] for w in body["words"]], [True, False])

    def test_without_the_header_the_answer_is_text_only(self):
        with urllib.request.urlopen(urllib.request.Request(self.url, data=WAV, method="POST")) as response:
            self.assertEqual(json.load(response), {"text": "muraho"})


if __name__ == "__main__":
    unittest.main()
