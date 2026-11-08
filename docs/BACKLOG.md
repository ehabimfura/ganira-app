# Ranked backlog (MVP)

Ranked on 2026-11-08, at the end of Sprint 0. This replaces the seven-sprint table in the SRS,
because about three weeks of November were left.

**Ranking rule:** a feature makes the cut if the two-week pilot needs it to measure a hypothesis.

| Hypothesis | Needs |
| --- | --- |
| H1: 70% of core phrases rated understandable | Speaking drill, speech check, native-speaker ratings |
| H2: 40% still practising in week 2 | Streak, daily goal, spaced review |
| H3: More Kinyarwanda at home (parents) | Parent report form (outside the app) |
| H4: More confidence (foreigners) | Before/after survey (outside the app) |
| H5: 80% agreement, model vs native speakers | Speech check, calibration during the pilot |

## Plan

| When | Build | Feeds |
| --- | --- | --- |
| Build week 1 (Nov 9-15) | Sign-in and test account; short onboarding (who you are, your goal); home screen; 1 path with 5 lessons, Learn step uses native audio + text | All |
| Build week 2 (Nov 16-22) | Python speech service; speaking drill; green words and praise ladder; small FSRS spaced review; streak and daily goal; move API and database to Azure | H1, H2, H5 |
| Pilot (Nov 23 - about Dec 6) | Real users; native speakers rate phrases; calibrate the speech check; fix bugs | H1-H5 |

## After the pilot

- Video lessons with repeat pauses
- Offline lesson download
- Scripted role-plays
- Saved phrases
- Progress screen
- Parent view
- Second path, lessons 6-10
- Extra sounds and vibration beyond the basic tick and chime

## Changes from the SRS

- The pilot runs into early December. If November is a hard end, the pilot shrinks to one week and H2 cannot be measured.
- Azure moves up from the end of Sprint 4 to the end of build week 2.
- The Learn step uses audio, not video, for the pilot.
- The speech model needs about 1-2 GB of memory on Azure; check the App Service plan against the student credit in week 2.
