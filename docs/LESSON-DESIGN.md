# How Ganira lessons are built, and why

Ganira's course is a path, the way Duolingo lays out its courses: units by theme, and
levels inside each unit. Each choice below comes from research on how people remember
and from how proven language apps work. The content lives in `app/src/content/unit1.ts`.

## The path: Unit 1, "Taking a moto in Kigali"

| Level | Kind | Teaches |
| --- | --- | --- |
| 1. Hello | Lesson | Muraho, Mwaramutse, Mwiriwe |
| 2. Hi and thanks | Lesson | Bite se, Murakoze, Yego, Oya |
| 3. Practice: greetings | Practice | Levels 1-2 again |
| 4. Calling a moto | Lesson | Mota?, and the motari's greetings |
| 5. Where to? | Lesson | Ndashaka kujya i Remera kuri Sitadi (built up backward) |
| 6. How much? | Lesson | ni angahe?, magana inani, the offer |
| 7. Practice: the ride | Practice | Levels 4-6 again |
| 8. The ride | Roleplay | The whole conversation with the motari |

Each kind of level has its own icon on the path: a star for a lesson, a dumbbell for
practice, speech bubbles for a roleplay (as Duolingo marks its levels). Polite words
(thanks, yes, no) now sit with the greetings, and calling a moto has a lesson of its own.

## Inside a level

| Part | What happens | Why |
| --- | --- | --- |
| **Goal** | "By the end you can: tell a motari where you want to go." Repeated at the end as "Now you can". | Courses aligned to CEFR "can do" goals (Duolingo rebuilt its courses this way). Task-based teaching: a meta-analysis of 52 studies found a strong positive effect (Bryfonski & McKay, 2019). |
| **New phrase** | A phrase is introduced inside the exercises: hear it, say it, words that were heard turn green. At most 4 new things per lesson. | Duolingo's "learn by doing": no word list first; new material appears in exercises and is used straight away, with repetition and variation (Freeman et al., 2023). Working memory holds about 4 chunks (Cowan, 2001). |
| **Backward build-up** | Long phrases are taught from the end: *Sitadi*, *kuri Sitadi*, *i Remera kuri Sitadi*, then the whole sentence. | Pimsleur's method; keeps each step small and the sentence's natural melody. |
| **Five exercise types** | Listen and pick the meaning, read and pick the Kinyarwanda, match pairs, put the words in order, say it from memory. | Varied exercises on the same items help learners notice patterns (Freeman et al., 2023). |
| **Recall** | Only the English shows; the learner says it from memory, then sees which words were heard. Includes phrases from earlier lessons. | Retrieval practice: 61% remembered after a week vs 40% for re-studying (Roediger & Karpicke, 2006). Pimsleur's "anticipation". |
| **Mistakes come back** | An exercise answered wrongly returns once at the end of the lesson, marked "Previous mistake". | Duolingo reviews a lesson's mistakes at its end; another retrieval attempt after a short gap. |
| **Practice levels** | Levels 3 and 7 mix earlier phrases again. | Spaced review: spacing beat cramming across a 317-experiment meta-analysis (Cepeda et al., 2006). Duolingo places practice levels along the path. |
| **Talk / roleplay** | Short exchanges with the motari inside lessons; level 8 is the whole ride. | Learn, Practice, Apply (Speak); the real-life task from task-based teaching. Duolingo's roleplay levels. |

Feedback is color, a sound and a vibration, never praise words. A right answer turns
green and a wrong one red, with the right answer shown in green. Speaking has no pass
mark: after any try the learner can move on or try again.

## Next

A daily review that brings each phrase back just before it is likely to be forgotten,
as Duolingo does with half-life regression (Settles & Meeder, 2016). It needs
per-phrase memory tracking.

## Sources

- Bryfonski, L., & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. *Language Teaching Research, 23*(5), 603-632.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin, 132*(3), 354-380.
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences, 24*(1), 87-114.
- Freeman, C., Kittredge, A., Wilson, H., & Pajak, B. (2023). *The Duolingo method for app-based teaching and learning* [Research report]. Duolingo. https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science, 17*(3), 249-255.
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL 2016*.
- The Duolingo learning path: https://duoplanet.com/duolingo-learning-path/
- Pimsleur method: https://www.pimsleur.com/the_pimsleur_method
- Speak method: https://www.speak.com/blog/how-speak-reinvents-language-learning
- Duolingo and the CEFR: https://blog.duolingo.com/how-are-duolingo-courses-evolving
