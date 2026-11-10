# How Ganira lessons are built, and why

Every lesson follows the same shape. Each part comes from research on how people
remember and from how proven language apps work. The content lives in
`app/src/content/module1.ts`.

| Part | What happens | Why |
| --- | --- | --- |
| **Goal** | "By the end you can: tell a motari where you want to go." Repeated at the end as "Now you can". | Courses aligned to CEFR "can do" goals (Duolingo rebuilt its courses this way). Task-based teaching: a meta-analysis of 52 studies found a strong positive effect (Bryfonski & McKay, 2019). |
| **Learn** | At most 4 new things. Hear it, say it, words that were heard turn green. | Working memory holds about 4 chunks (Cowan, 2001). Speaking from the first seconds and instant speech feedback (Speak). |
| **Backward build-up** | Long phrases are taught from the end: *Sitadi*, *kuri Sitadi*, *i Remera kuri Sitadi*, then the whole sentence. | Pimsleur's method; keeps each step small and the sentence's natural melody. |
| **Listen** | The motari speaks; the learner picks what it means. | Learners must understand the replies they will hear, not only say their own lines. |
| **Recall** | Only the English shows; the learner says it from memory, then sees which words were heard. Includes 1-2 phrases from earlier lessons. | Retrieval practice: 61% remembered after a week vs 40% for re-studying (Roediger & Karpicke, 2006). Pimsleur's "anticipation". Spaced review: spacing beat cramming across a 317-experiment meta-analysis (Cepeda et al., 2006). |
| **Talk** | A short exchange with the motari using the lesson's phrases; lesson 5 is the whole ride. | Learn, Practice, Apply (Speak); the real-life task from task-based teaching. |

Listen sits between Learn and Recall on purpose: the short gap makes the recall a real
memory test instead of an echo.

Feedback is a sound and a vibration, never praise words. There is no pass mark: after
any try the learner can move on or try again.

## Next, after the Nov 15 demo

A daily review that brings each phrase back just before it is likely to be forgotten,
as Duolingo does with half-life regression (Settles & Meeder, 2016). It needs
per-phrase memory tracking.

## Sources

- Bryfonski, L., & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. *Language Teaching Research, 23*(5), 603-632.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin, 132*(3), 354-380.
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences, 24*(1), 87-114.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science, 17*(3), 249-255.
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL 2016*.
- Pimsleur method: https://www.pimsleur.com/the_pimsleur_method
- Speak method: https://www.speak.com/blog/how-speak-reinvents-language-learning
- Duolingo and the CEFR: https://blog.duolingo.com/how-are-duolingo-courses-evolving
