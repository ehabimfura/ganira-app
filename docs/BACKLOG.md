# Backlog: 15 November demo

Re-planned on 2026-11-08. The deadline was a working app demo on 15 November.
The pilot with real users follows the demo. The earlier plan (pilot from 23 November) is in Git history.
Last updated 2026-11-19 from the Git history and the progress log.

## Done

- Repo, local MySQL 8.4 for development, API with health check
- Sign-up and sign-in (email or username), 18+ age gate, argon2id passwords, revocable 30-day sessions
- Child profiles with parental consent, optional PIN, parent unlock, up to six children per parent
- Onboarding answers stored (SRS FR 2.1, FR 2.2)
- Unit 1 "Taking a moto in Kigali": 8 levels (5 lessons, 2 practice levels, 1 roleplay), five exercise types, mistakes return once (15 Nov)
- Audio for all of Module 1: learner lines and the motari's male voice, each approved by Espoir (10-12 Nov)
- Speech check: Python speech service with w2v-BERT 2.0 (ONNX int8), green words, Try again and Next (11 Nov)
- Per-word scoring with CTC forced alignment, so words are found even when the transcript differs (16 Nov)
- Lesson progress saved on the server, and lessons open in order (10 Nov)
- Daily streak (Kigali days) and spaced review with half-life regression, not FSRS (15 Nov)
- Credits screen for the speech model and voices (CC BY 4.0, CC BY-SA 4.0)
- Lucide icons, DiceBear avatars, Matcha look with Open Sans and Satoshi (15 Nov)
- Azure, South Africa North, live since 15 November: API and speech service on one B1 plan, MySQL B1ms (free 12 months)
- Automated tests: API 80 passing (23 suites), speech service 18, browser click-through 20 checks

## Plan (as it was set on 8 November)

| Day | Build | Status |
| --- | --- | --- |
| Nov 9 | Phone step A: welcome, who is this for, birth year, sign in, create account | Done |
| Nov 10 | Step B: onboarding questions and the first "Muraho" listen-and-repeat. Step C: add child, profile picker, home with the lesson path | Done |
| Nov 11 | Lessons in the database and 5 lessons on screen. Record native audio in the evening | Done (Module 1 content) |
| Nov 12 | Python speech service, speaking drill, green words | Done (speech service built 11 Nov) |
| Nov 13 | Praise ladder, tick and chime sounds, streak and daily goal. Move API, database and speech service to Azure | Praise ladder dropped by decision; sounds done; streak done 15 Nov; Azure move done 15 Nov |
| Nov 14 | Full run-through with native speakers on real phones; fix problems | Not recorded in the log |
| Nov 15 | Demo | Outcome not recorded in the log |

Testers use Expo Go for the demo, so no app-store builds are needed yet.

## Open after 18 November

- Speech check takes 4 to 11 seconds on Azure. Target: under 2 seconds. The plan is to free memory on the current B1 plan first.
- Test Unit 1 with native speakers and with foreigners living in Kigali.
- Installable test build, so testers no longer need Expo Go or the laptop.

## After the demo

- Two-week pilot measuring H1-H5
- Video lessons with repeat pauses (the current lessons are audio)
- Offline lesson download
- Scripted role-plays (the Unit 1 ride is the first one; more to come)
- Saved phrases
- Progress screen
- Parent view
- Second path and lessons 6-10
- Extra sounds and vibration

## Notes

- Azure moved on 15 November, not 13 November as first planned.
- The speech model uses about 640 MB of memory when loaded (measured on 11 November). The B1 plan is the current size; check it against the student credit.
- Differences from the SRS are deliberate decisions by Espoir (for example 30-day sessions, half-life regression instead of FSRS, no praise words, audio instead of video). The SRS text is unchanged.
