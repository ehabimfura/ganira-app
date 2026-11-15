"""Ganira speech service: POST a recording to /transcribe, get back {"text": "..."}.

Only the Ganira API calls this. On a laptop it listens on this computer only (127.0.0.1).
On Azure it has a public address, so SPEECH_KEY is set and every request must send it
in the X-Speech-Key header. Missing model files are downloaded at start.
Run: .venv/bin/python server.py   (see README.md)
"""

import hmac
import json
import logging
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from model_files import ensure_model
from transcriber import AudioError, Transcriber, decode_audio

HOST = os.environ.get("SPEECH_HOST", "127.0.0.1")
PORT = int(os.environ.get("SPEECH_PORT", "8000"))
MODEL_DIR = Path(os.environ.get("SPEECH_MODEL_DIR", Path(__file__).parent / "model"))
KEY = os.environ.get("SPEECH_KEY") or None
MAX_BYTES = 2 * 1024 * 1024

log = logging.getLogger("speech")


def memory_report() -> str:
    """This process's memory and the machine's free memory, from Linux's /proc (blank elsewhere)."""
    try:
        status = Path("/proc/self/status").read_text()
        info = Path("/proc/meminfo").read_text()
        load = Path("/proc/loadavg").read_text().split()[0]
    except OSError:
        return "memory unknown"
    def kb(text: str, field: str) -> int:
        line = next(l for l in text.splitlines() if l.startswith(field + ":"))
        return int(line.split()[1]) // 1024
    # The container's own memory cap, which can be lower than the machine's memory.
    limit = "none"
    for path in ("/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"):
        try:
            raw = Path(path).read_text().strip()
            limit = raw if raw == "max" else f"{int(raw) // 2**20} MB"
            break
        except (OSError, ValueError):
            continue
    return (
        f"process {kb(status, 'VmRSS')} MB in memory + {kb(status, 'VmSwap')} MB in swap, container cap {limit}, "
        f"machine free {kb(info, 'MemAvailable')} of {kb(info, 'MemTotal')} MB, "
        f"swap used {kb(info, 'SwapTotal') - kb(info, 'SwapFree')} MB, load {load}"
    )


def make_handler(transcriber: Transcriber, key: str | None = None):
    # One transcription at a time: on a one-core server, checks running together all slow
    # down and can all miss the API's deadline. Waiting in line keeps each one fast.
    one_at_a_time = threading.Lock()

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
            if key and not hmac.compare_digest(self.headers.get("X-Speech-Key", "").encode(), key.encode()):
                self._send(401, {"error": "UNAUTHORIZED"})
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
                with one_at_a_time:
                    started = time.perf_counter()
                    text = transcriber.transcribe(audio)
                log.info(
                    "Transcribed %.1f s of audio in %d ms (%s); %s",
                    len(audio) / 16000,
                    (time.perf_counter() - started) * 1000,
                    getattr(transcriber, "last_timing", ""),
                    memory_report(),
                )
                self._send(200, {"text": text})
            except Exception:  # noqa: BLE001 - log everything, tell the API only that it failed
                log.exception("Transcription failed")
                self._send(500, {"error": "TRANSCRIBE_FAILED"})

        def log_message(self, format: str, *args) -> None:  # noqa: A002 - quieter request logs
            log.debug(format, *args)

    return Handler


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ensure_model(MODEL_DIR)
    transcriber = Transcriber(MODEL_DIR)
    server = ThreadingHTTPServer((HOST, PORT), make_handler(transcriber, KEY))
    log.info("Ganira speech service listening on http://%s:%d", HOST, PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
