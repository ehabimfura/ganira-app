// Decides which words of a phrase the learner said, from what the speech model heard.
// The model often joins or splits words ("i Remera" -> "iremera"), so each expected
// word is searched for inside the heard text, in order, allowing a few wrong letters.

export interface WordResult {
  word: string; // as the learner sees it, e.g. "Stade."
  heard: boolean;
}

// About one wrong letter in three is forgiven; words of 3 letters or fewer must be exact.
const FORGIVEN_PER_LETTER = 0.3;

function letters(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

// Smallest number of letter changes that turns `word` into some stretch of `text`,
// and where in `text` that stretch ends (the earliest such place).
function bestMatch(word: string, text: string): { distance: number; end: number } {
  let previous = new Array<number>(text.length + 1).fill(0); // a match may start anywhere
  for (let i = 1; i <= word.length; i++) {
    const current = [i];
    for (let j = 1; j <= text.length; j++) {
      const change = previous[j - 1] + (word[i - 1] === text[j - 1] ? 0 : 1);
      current.push(Math.min(change, previous[j] + 1, current[j - 1] + 1));
    }
    previous = current;
  }
  let end = 0;
  for (let j = 1; j <= text.length; j++) if (previous[j] < previous[end]) end = j;
  return { distance: previous[end], end };
}

const VOWEL = /[aeiou]/;

// In natural speech a word's last vowel drops before a word starting with a vowel
// ("ni angahe" is said "nangahe"), so that shorter form also counts.
function spokenForms(word: string, nextWord: string | undefined): string[] {
  const elides = word.length > 1 && VOWEL.test(word.at(-1)!) && VOWEL.test(nextWord?.[0] ?? "");
  return elides ? [word, word.slice(0, -1)] : [word];
}

export function matchWords(expected: string, transcript: string): WordResult[] {
  const heardText = letters(transcript);
  const shown = expected.trim().split(/\s+/);
  const targets = shown.map(letters);
  let cursor = 0;
  return shown.map((word, i) => {
    if (!targets[i]) return { word, heard: true };
    for (const form of spokenForms(targets[i], targets[i + 1])) {
      const { distance, end } = bestMatch(form, heardText.slice(cursor));
      if (distance <= Math.floor(form.length * FORGIVEN_PER_LETTER)) {
        cursor += end;
        return { word, heard: true };
      }
    }
    return { word, heard: false };
  });
}
