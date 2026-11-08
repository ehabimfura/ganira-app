# Backlog: 15 November demo

Re-planned on 2026-11-08. The deadline is a working app demo on 15 November.
The pilot with real users follows the demo. The earlier plan (pilot from 23 November) is in Git history.

## Done

- Repo, local MySQL 8.4, API with health check
- Sign-up and sign-in (email or username), 18+ age gate, argon2id passwords, revocable 30-day sessions
- Child profiles with parental consent, optional PIN, parent unlock
- Onboarding answers stored (SRS FR 2.1, FR 2.2)
- 38 automated API tests

## Plan

| Day | Build |
| --- | --- |
| Nov 9 | Phone step A: welcome, who is this for, birth year, sign in, create account |
| Nov 10 | Step B: onboarding questions and the first "Muraho" listen-and-repeat. Step C: add child, profile picker, home with the lesson path |
| Nov 11 | Lessons in the database and 5 lessons on screen. Record native audio in the evening |
| Nov 12 | Python speech service, speaking drill, green words |
| Nov 13 | Praise ladder, tick and chime sounds, streak and daily goal. Move API, database and speech service to Azure |
| Nov 14 | Full run-through with native speakers on real phones; fix problems |
| Nov 15 | Demo |

Testers use Expo Go for the demo, so no app-store builds are needed yet.

## After the demo

- Two-week pilot measuring H1-H5
- Spaced review (FSRS)
- Video lessons with repeat pauses
- Offline lesson download
- Scripted role-plays
- Saved phrases
- Progress screen
- Parent view
- Second path and lessons 6-10
- Extra sounds and vibration

## Notes

- Azure moves to 13 November because a demo away from home Wi-Fi cannot reach a laptop.
- The speech model needs about 1-2 GB of memory on Azure; check the plan against the student credit before 13 November.
