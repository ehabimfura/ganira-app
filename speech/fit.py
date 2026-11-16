"""How well the audio fits each expected word, without needing an exact transcript.

The model gives, for every frame, the odds of each letter (vocab.txt: a-z, a word separator,
and a blank). Each expected word is laid over the frames with the best local alignment (a
Viterbi search in the style of CTC forced alignment), free to start and stop anywhere in the
recording. That way a missing word does not drag the frames of the words that were said.
The word's gap is how much less likely its letters are than the model's own best guess,
averaged over the frames that carry letters. A gap near 0 means the audio fits the word; a
large gap means it doesn't. Accents shift the odds a little, so a close pronunciation still
gives a small gap, while a different word does not.
"""

import numpy as np

BLANK = 29
LETTERS = {c: i + 2 for i, c in enumerate("abcdefghijklmnopqrstuvwxyz")}
MISSING_GAP = 10.0  # a word with no alignment at all: the strongest "not heard" value
# Provisional. Set from four correct and four wrong words in the lesson clips: correct words
# scored 0.00-1.07, wrong words 4.5-4.9. Accented speech is not in that set yet; retune on it.
HEARD_GAP = 2.0
_NEG = -1e18
_START = -1  # back-pointer marking where a local alignment begins


def _local_align(logp: np.ndarray, ext: list[int]):
    """Best path through the expanded letters, starting and ending at any frame.

    Returns (frame, state) pairs in time order, or None if the frames cannot hold the letters.
    """
    frames, states = logp.shape[0], len(ext)
    score = np.full((frames, states), _NEG)
    back = np.full((frames, states), _START, dtype=int)
    for t in range(frames):
        for s in range(states):
            options = []
            if s <= 1:
                options.append((0.0, _START))  # a fresh start at this frame
            if t >= 1:
                options.append((score[t - 1, s], s))
                if s >= 1:
                    options.append((score[t - 1, s - 1], s - 1))
                if s >= 2 and ext[s] != BLANK and ext[s] != ext[s - 2]:
                    options.append((score[t - 1, s - 2], s - 2))
            if not options:  # a later state cannot start a path on the first frame
                continue
            best, previous = max(options)
            if best <= _NEG / 2:
                continue
            score[t, s] = best + logp[t, ext[s]]
            back[t, s] = previous
    # The alignment must finish on the last letter (or the blank after it).
    end_candidates = [(score[t, s], t, s) for t in range(frames) for s in (states - 1, states - 2) if s >= 0]
    best_score, t, s = max(end_candidates)
    if best_score <= _NEG / 2:
        return None
    path = []
    while s != _START:
        path.append((t, s))
        previous = back[t, s]
        t, s = t - 1, previous
    return path[::-1]


def _letters(word: str) -> list[int]:
    return [LETTERS[c] for c in word.lower() if c in LETTERS]


def word_gaps(logp: np.ndarray, phrase: str) -> list[float]:
    """One gap per expected word, in the order the words are written (0 = a perfect fit)."""
    gaps = []
    for word in phrase.split():
        letters = _letters(word)
        if not letters:
            gaps.append(0.0)  # nothing to say (a dash or a number, say): counts as heard
            continue
        ext = [BLANK]
        for letter in letters:
            ext += [letter, BLANK]
        path = _local_align(logp, ext)
        if path is None:
            gaps.append(MISSING_GAP)
            continue
        best_guess = logp.max(axis=1)
        gap_total, count = 0.0, 0
        for t, state in path:
            if state % 2 == 1:  # a letter state (blanks carry no letter)
                gap_total += float(best_guess[t] - logp[t, ext[state]])
                count += 1
        gaps.append(gap_total / count if count else MISSING_GAP)
    return gaps
