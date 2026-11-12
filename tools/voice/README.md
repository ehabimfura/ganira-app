# Lesson voice (voice B)

Ganira's lesson audio is generated with Digital Umuganda's Kinyarwanda voice,
copying the reference clip in `reference/voice_b.wav`. A native speaker approves
every clip before it goes into the app. Generated voices get some words wrong
(7 of the first 12 test clips were rejected), so unchecked clips never ship.

## Credits and licences

| Part | Source | Licence |
| --- | --- | --- |
| Voice model | [DigitalUmuganda/KinyarwandaTTS_female_voice](https://huggingface.co/DigitalUmuganda/KinyarwandaTTS_female_voice) | CC BY-SA 4.0 |
| Reference clip `voice_b.wav` | `examples/audio_2.wav` from [badrex/w2v-bert-2.0-kinyarwanda-asr](https://huggingface.co/badrex/w2v-bert-2.0-kinyarwanda-asr) | CC BY 4.0 |

Both are credited on the app's Credits screen.

## One-time setup

The voice library needs Python 3.10–3.14 (not 3.15).

```sh
brew install python@3.13
python3.13 -m venv ~/ganira-voice-venv
~/ganira-voice-venv/bin/pip install "coqui-tts[codec]" six

# The model is about 1 GB, so it stays outside Git.
mkdir -p ~/ganira-voice-model && cd ~/ganira-voice-model
for f in model.pth config.json config_se.json SE_checkpoint.pth.tar; do
  curl -LO "https://huggingface.co/DigitalUmuganda/KinyarwandaTTS_female_voice/resolve/main/$f"
done
```

## Making clips

1. List the phrases in a text file, one per line as `id|text`:
   ```
   muraho|Muraho
   amakuru|Amakuru yawe
   ```
2. Generate them:
   ```sh
   ~/ganira-voice-venv/bin/python tools/voice/generate.py phrases.txt --model-dir ~/ganira-voice-model
   ```
3. A native speaker listens to every file in `tools/voice/out/`.
4. Copy only the approved clips into `app/assets/audio/`. Each run sounds slightly
   different, so keep the exact file that was approved; generating it again gives a new clip
   that needs a new check. For a rejected clip, try a
   different spelling or punctuation and generate again, or record it by voice memo.

## The motari's voice (a man's voice)

The motari's lines are voice-B takes lowered to a man's voice with `deepen.py`, which uses
the WORLD vocoder to drop the pitch to about 125 Hz while changing the voice's size only a
little (lowering both, like a slowed tape, sounds like a cartoon giant). The approved depth is `m1`.

```sh
~/ganira-voice-venv/bin/pip install pyworld "setuptools<81" soundfile
~/ganira-voice-venv/bin/python tools/voice/generate.py lines.txt --model-dir ~/ganira-voice-model --out takes/
~/ganira-voice-venv/bin/python tools/voice/deepen.py takes/ --out out/motari-man --versions m1
```

A SpeechT5 male voice (NMutangana) was tried and rejected: a buzzing sound throughout.
