# Speech service

Turns a short Kinyarwanda recording into text, so the app can show which words
the learner said (green words). Only the Ganira API calls it. On a laptop it listens
on `127.0.0.1:8000`; on Azure it runs as its own web app and only answers requests that
carry the shared key (`SPEECH_KEY`, sent in the `X-Speech-Key` header). The API compares the text with the phrase (`api/src/speech/match.ts`).

## Model and licence

[OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx](https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx)
(int8, about 560 MB), the ONNX export of
[badrex/w2v-bert-2.0-kinyarwanda-asr](https://huggingface.co/badrex/w2v-bert-2.0-kinyarwanda-asr)
by Badr M. Abdullah / the ASRwanda team and Digital Umuganda. Licence **CC BY 4.0**;
credited on the app's Credits screen.

## One-time setup

Needs Python 3.10-3.14. Audio is decoded with PyAV, which carries its own FFmpeg.

```sh
cd speech
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

The model files are downloaded into `model/` the first time the server starts
(`model_files.py`).

The model and `.venv` stay out of Git.

## Run and test

```sh
.venv/bin/python server.py                    # http://127.0.0.1:8000
.venv/bin/python -m unittest discover tests   # needs the model for 2 of the 11 tests
```

On a Mac a phrase takes about 0.2-0.5 s. The running service uses about 650 MB of
memory (measured), so the Azure plan needs at least 1 GB free for it.

## On Azure

The web app `ganira-speech-eh` runs `python server.py` with these App Settings:
`SPEECH_HOST=0.0.0.0`, `SPEECH_PORT=8000`, `SPEECH_MODEL_DIR=/home/ganira-model`
(persistent storage, so the model is downloaded only once) and `SPEECH_KEY`.
The key is set in App Settings only, never in code.
