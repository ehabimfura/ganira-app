"""Generate lesson clips in Ganira's voice (voice B) for a native speaker to approve.

Usage:
    python generate.py phrases.txt --model-dir ~/ganira-voice-model --out out/

phrases.txt has one phrase per line as `id|Kinyarwanda text`, e.g. `muraho|Muraho`.
Clips are written to --out as <id>.wav. Only clips a native speaker approves are
copied into app/assets/audio/.
"""

import argparse
import json
from pathlib import Path

from TTS.utils.synthesizer import Synthesizer

HERE = Path(__file__).parent
REFERENCE_VOICE = HERE / "reference" / "voice_b.wav"
SPEAKER_NAME = "voice_b"


def local_config(model_dir: Path) -> Path:
    """The published config points at files on the author's server; use the local copies."""
    config = json.loads((model_dir / "config.json").read_text())
    for section in (config, config["model_args"]):
        section["speakers_file"] = None
        section["d_vector_file"] = None
        section["speaker_encoder_model_path"] = str(model_dir / "SE_checkpoint.pth.tar")
        section["speaker_encoder_config_path"] = str(model_dir / "config_se.json")
    patched = model_dir / "config.local.json"
    patched.write_text(json.dumps(config))
    return patched


def read_phrases(path: Path) -> list[tuple[str, str]]:
    phrases = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "|" not in line:
            raise SystemExit(f"{path}:{number}: expected `id|text`, got {line!r}")
        clip_id, text = (part.strip() for part in line.split("|", 1))
        phrases.append((clip_id, text))
    return phrases


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("phrases", type=Path)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=HERE / "out")
    args = parser.parse_args()

    phrases = read_phrases(args.phrases)
    args.out.mkdir(parents=True, exist_ok=True)
    synth = Synthesizer(
        tts_checkpoint=str(args.model_dir / "model.pth"),
        tts_config_path=str(local_config(args.model_dir)),
        encoder_checkpoint=str(args.model_dir / "SE_checkpoint.pth.tar"),
        encoder_config=str(args.model_dir / "config_se.json"),
        use_cuda=False,
    )
    for clip_id, text in phrases:
        wav = synth.tts(text, speaker_name=SPEAKER_NAME, speaker_wav=[str(REFERENCE_VOICE)])
        synth.save_wav(wav, str(args.out / f"{clip_id}.wav"))
        print(f"{clip_id}.wav  {len(wav) / synth.output_sample_rate:.2f}s  {text}")


if __name__ == "__main__":
    main()
