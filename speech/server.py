"""Ganira speech service: POST a recording to /transcribe, get back {"text": "..."}.

Only the Ganira API calls this, so it listens on this computer only (127.0.0.1).
Run: .venv/bin/python server.py   (needs the model in speech/model/, see README.md)
"""

import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from transcriber import AudioError, Transcriber, decode_audio

HOST = os.environ.get("SPEECH_HOST", "127.0.0.1")
PORT = int(os.environ.get("SPEECH_PORT", "8000"))
MODEL_DIR = Path(os.environ.get("SPEECH_MODEL_DIR", Path(__file__).parent / "model"))
MAX_BYTES = 2 * 1024 * 1024

log = logging.getLogger("speech")


def make_handler(transcriber: Transcriber):
    class Handler(BaseHTTPRequestHandler):
        def _send(self, status: int, body: dict) -> None:
            data = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self) -> None:
            if self.path == "/health":
                self._send(200, {"status": "ok"})
            else:
                self._send(404, {"error": "NOT_FOUND"})

        def do_POST(self) -> None:
            if self.path != "/transcribe":
                self._send(404, {"error": "NOT_FOUND"})
                return
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BYTES:
                self._send(400, {"error": "BAD_AUDIO"})
                return
            try:
                audio = decode_audio(self.rfile.read(length))
            except AudioError as error:
                log.info("Unreadable audio: %s", error)
                self._send(400, {"error": "BAD_AUDIO"})
                return
            try:
                self._send(200, {"text": transcriber.transcribe(audio)})
            except Exception:  # noqa: BLE001 - log everything, tell the API only that it failed
                log.exception("Transcription failed")
                self._send(500, {"error": "TRANSCRIBE_FAILED"})

        def log_message(self, format: str, *args) -> None:  # noqa: A002 - quieter request logs
            log.debug(format, *args)

    return Handler


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    transcriber = Transcriber(MODEL_DIR)
    server = ThreadingHTTPServer((HOST, PORT), make_handler(transcriber))
    log.info("Ganira speech service listening on http://%s:%d", HOST, PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
