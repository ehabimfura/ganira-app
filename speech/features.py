"""The model's input: Kaldi-style log-mel filter banks, as SeamlessM4TFeatureExtractor makes them.

A small NumPy port of the parts of Hugging Face transformers (Apache 2.0) that the model needs:
SeamlessM4TFeatureExtractor, spectrogram, mel_filter_bank and window_function. Carrying these
60 lines instead of the whole transformers library keeps the server small enough to stay in
memory on Azure's B1 plan. tests/test_features.py checks the output against the original.
"""

import numpy as np

SAMPLE_RATE = 16000
FRAME = 400  # 25 ms
HOP = 160  # 10 ms
FFT = 512
MEL_BINS = 80
STRIDE = 2  # two frames are stacked into one model step
PREEMPHASIS = 0.97
MEL_FLOOR = 1.192092955078125e-07


def _hz_to_mel(hz: np.ndarray | float) -> np.ndarray:
    return 1127.0 * np.log(1.0 + np.asarray(hz) / 700.0)  # Kaldi's mel scale


def _mel_filters() -> np.ndarray:
    """(257, 80) triangular filters, laid out evenly on the mel scale from 20 Hz to 8 kHz."""
    mel_points = np.linspace(_hz_to_mel(20), _hz_to_mel(SAMPLE_RATE // 2), MEL_BINS + 2)
    bins = FFT // 2 + 1
    fft_mels = _hz_to_mel(SAMPLE_RATE / ((bins - 1) * 2) * np.arange(bins))
    widths = np.diff(mel_points)
    slopes = mel_points[None, :] - fft_mels[:, None]
    down = -slopes[:, :-2] / widths[:-1]
    up = slopes[:, 2:] / widths[1:]
    return np.maximum(0.0, np.minimum(down, up))


_FILTERS = _mel_filters()
_WINDOW = np.hanning(FRAME) ** 0.85  # Kaldi's "povey" window


def speech_features(audio: np.ndarray) -> np.ndarray:
    """16 kHz mono floats -> (steps, 160) features for one recording."""
    wave = audio.astype(np.float64) * 2**15  # Kaldi works on 16-bit sample values
    count = 1 + (len(wave) - FRAME) // HOP
    frames = np.lib.stride_tricks.sliding_window_view(wave, FRAME)[::HOP][:count].copy()
    frames -= frames.mean(axis=1, keepdims=True)
    frames[:, 1:] -= PREEMPHASIS * frames[:, :-1].copy()
    frames[:, 0] *= 1 - PREEMPHASIS
    frames *= _WINDOW
    power = np.abs(np.fft.rfft(frames, n=FFT, axis=1)) ** 2
    logmel = np.log(np.maximum(MEL_FLOOR, power @ _FILTERS))
    # Each mel band to zero mean and unit variance over the recording.
    logmel = (logmel - logmel.mean(axis=0)) / np.sqrt(logmel.var(axis=0, ddof=1) + 1e-7)
    if len(logmel) % STRIDE:
        logmel = np.vstack([logmel, np.zeros((1, MEL_BINS))])
    return logmel.reshape(-1, MEL_BINS * STRIDE).astype(np.float32)
