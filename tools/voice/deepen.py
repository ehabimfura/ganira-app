"""Turn approved voice-B takes into a man's voice for the motari, keeping their accent.

Lowering a recording like slowing a tape moves the pitch and the "size" of the voice
(its formants) together, which sounds like a cartoon giant. This uses the WORLD vocoder
(pyworld) to move them separately: the pitch drops to a normal man's range while the
formants move only a little.

Usage:
    python deepen.py out/motari-b --out out/motari-man [--versions m1]

Each clip is made in three versions (or only those given with --versions); the native
speaker keeps one. The motari's approved depth is m1:
    _m1  pitch x0.62, formants x0.92   (~125 Hz, fuller man's voice)
    _m2  pitch x0.68, formants x0.95   (~135 Hz)
    _m3  pitch x0.75, formants x0.97   (~150 Hz, lighter man's voice)
Needs: pyworld, soundfile, numpy.
"""

import argparse
from pathlib import Path

import numpy as np
import pyworld
import soundfile as sf

VERSIONS = {"m1": (0.62, 0.92), "m2": (0.68, 0.95), "m3": (0.75, 0.97)}


def warp_formants(envelope: np.ndarray, factor: float) -> np.ndarray:
    """Moves every formant to `factor` times its frequency (below 1 = a bigger voice)."""
    bins = np.arange(envelope.shape[1])
    source = np.clip(bins / factor, 0, envelope.shape[1] - 1)
    return np.stack([np.interp(source, bins, frame) for frame in envelope])


def deepen(audio: np.ndarray, rate: int, pitch: float, formants: float) -> np.ndarray:
    audio = audio.astype(np.float64)
    f0, times = pyworld.harvest(audio, rate)
    envelope = pyworld.cheaptrick(audio, f0, times, rate)
    aperiodicity = pyworld.d4c(audio, f0, times, rate)
    out = pyworld.synthesize(f0 * pitch, warp_formants(envelope, formants), aperiodicity, rate)
    return (out / max(1e-9, np.abs(out).max()) * 0.9).astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path, help="folder of approved voice-B .wav takes")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--versions", nargs="+", choices=sorted(VERSIONS), default=sorted(VERSIONS))
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    for clip in sorted(args.source.glob("*.wav")):
        audio, rate = sf.read(clip)
        for name in args.versions:
            pitch, formants = VERSIONS[name]
            sf.write(args.out / f"{clip.stem}_{name}.wav", deepen(audio, rate, pitch, formants), rate)
        print(clip.stem)


if __name__ == "__main__":
    main()
