# Speech service

Turns a short Kinyarwanda recording into text, so the app can show which words
the learner said (green words). Only the Ganira API calls it; it listens on
`127.0.0.1:8000`. The API compares the text with the phrase (`api/src/speech/match.ts`).

## Model and licence

[OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx](https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx)
(int8, about 560 MB), the ONNX export of
[badrex/w2v-bert-2.0-kinyarwanda-asr](https://huggingface.co/badrex/w2v-bert-2.0-kinyarwanda-asr)
by Badr M. Abdullah / the ASRwanda team and Digital Umuganda. Licence **CC BY 4.0**;
credited on the app's Credits screen.

## One-time setup

Needs Python 3.10-3.14 and ffmpeg (`brew install ffmpeg`).

```sh
cd speech
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt
mkdir -p model && cd model
for f in model.int8.onnx vocab.txt config.json; do
  curl -LO "https://huggingface.co/OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx/resolve/main/$f"
done
```

The model and `.venv` stay out of Git.

## Run and test

```sh
.venv/bin/python server.py                    # http://127.0.0.1:8000
.venv/bin/python -m unittest discover tests   # needs the model for 2 of the 4 tests
```

On a Mac a phrase takes about 0.2-0.5 s. The running service uses about 650 MB of
memory (measured), so the Azure plan needs at least 1 GB free for it.
