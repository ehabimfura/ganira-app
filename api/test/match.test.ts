import { describe, expect, test } from "vitest";
import { matchWords } from "../src/speech/match.js";

// The transcripts below are what the speech model really heard from Ganira's own clips.
const heard = (expected: string, transcript: string) =>
  matchWords(expected, transcript)
    .filter((w) => w.heard)
    .map((w) => w.word);

describe("green words", () => {
  test("an exact match turns every word green", () => {
    expect(matchWords("Muraho", "muraho")).toEqual([{ word: "Muraho", heard: true }]);
  });

  test("capitals and punctuation don't matter, and the learner's words keep their spelling", () => {
    expect(matchWords("Mota?", "MOTA")).toEqual([{ word: "Mota?", heard: true }]);
  });

  test("a small slip in a long word still counts", () => {
    expect(heard("Murakoze", "murakuze")).toEqual(["Murakoze"]);
    expect(heard("Mwaramutse", "naramutse")).toEqual(["Mwaramutse"]);
  });

  test("words the model joins together are still found", () => {
    expect(heard("Oya, ndaguha magana inani.", "oya ndaguhamagani inani")).toEqual([
      "Oya,",
      "ndaguha",
      "magana",
      "inani.",
    ]);
    expect(heard("Ndashaka kujya i Remera kuri Stade.", "dashaka kujya iremera kuri sade")).toEqual([
      "Ndashaka",
      "kujya",
      "i",
      "Remera",
      "kuri",
      "Stade.",
    ]);
  });

  test("a final vowel dropped before a vowel, as people speak, still counts", () => {
    // "ni angahe" is said "nangahe".
    expect(heard("I Remera kuri Stade ni angahe?", "iremera kuri sade nangahe")).toEqual([
      "I",
      "Remera",
      "kuri",
      "Stade",
      "ni",
      "angahe?",
    ]);
  });

  test("a short word must be exact", () => {
    expect(heard("Oya", "uya")).toEqual([]);
  });

  test("words are looked for in order, so a word said too early is not counted twice", () => {
    expect(heard("Yego yego", "yego")).toEqual(["Yego"]);
  });

  test("a different phrase stays grey", () => {
    expect(heard("Murakoze", "mwiriwe")).toEqual([]);
  });

  test("silence leaves every word grey", () => {
    expect(matchWords("Bite se", "")).toEqual([
      { word: "Bite", heard: false },
      { word: "se", heard: false },
    ]);
  });
});
