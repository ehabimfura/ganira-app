# Backlog: 15 November demo

Re-planned on 2026-11-08. The deadline was a working app demo on 15 November.
The pilot with real users follows the demo. The earlier plan (pilot from 23 November) is in Git history.
Last updated 2026-11-19 from the Git history and the progress log.

## Done

- Repo, local MySQL 8.4 for development, API with health check
- Sign-up and sign-in (email or username), 18+ age gate, argon2id passwords, revocable 30-day sessions
- Child profiles with parental consent, optional PIN, parent unlock, up to six children per parent
- Onboarding answers stored (SRS FR 2.1, FR 2.2)
- Unit 1 "Taking a moto in Kigali": 9 levels (6 lessons, 2 practice levels, 1 roleplay)
- Video lesson "Meet Daisy" as level 2: Wikitongues clip (CC BY 3.0) with English and Kinyarwanda captions, three pauses for the learner to repeat (24 Nov), five exercise types, mistakes return once (15 Nov)
- Audio for all of Module 1: learner lines and the motari's male voice, each approved by Espoir (10-12 Nov)
- Speech check: Python speech service with w2v-BERT 2.0 (ONNX int8), green words, Try again and Next (11 Nov)
- Per-word scoring with CTC forced alignment, so words are found even when the transcript differs (16 Nov)
- Lesson progress saved on the server, and lessons open in order (10 Nov)
- Daily streak (Kigali days) and spaced review with half-life regression, not FSRS (15 Nov)
- Credits screen for the speech model and voices (CC BY 4.0, CC BY-SA 4.0)
- Lucide icons, DiceBear avatars, Open Sans and Satoshi fonts (15 Nov)
- Ganira colour look replaces Matcha (24 Nov): cyan #48dbfb and blue #54a0ff as main colours, yellow #feca57 and mint #1dd1a1 as accents, Apple white background (#F5F5F7), dark ink text
- Azure, South Africa North, live since 15 November: API and speech service on one B2 plan, MySQL B1ms (free 12 months)
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

- Speech check speed on Azure: accepted for now (the service runs on a B2 plan).
- Native speakers have tested Unit 1 (recorded in the progress log at the time of the test; the notes do not say the date).
- Installable demo build, so testers no longer need Expo Go or the laptop. In progress.

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
- The speech model uses about 640 MB of memory when loaded (measured on 11 November). The plan is B2; check it against the student credit.
- Differences from the SRS are deliberate decisions by Espoir (for example 30-day sessions, half-life regression instead of FSRS, no praise words, audio instead of video). The SRS text is unchanged.

## Plan to finish the SRS MVP (set 25 November 2026)

Excluded: the Intore finale (FR 5.4), which is tied to the praise words, and every SRS difference Espoir chose on purpose.

Phase A: confirm and finish the small items
- "Can't speak now" (FR 4.6), sound and vibration settings (FR 5.6), speech help screen (FR 12.1), consent for children under 16 (FR 1.4)

Phase B: learner features
- Progress screen: streak, minutes, phrases, lessons completed (FR 9.1)
- Saved phrases and lessons (FR 8)
- Roleplay hints and several accepted answers (FR 7.2, 7.3)
- Word-level help: show the part of a word to improve (FR 4.8)

Phase C: parent view
- See a child's progress (FR 10.1) and set the child's daily goal and reminder (FR 10.2)

Phase D: reminders
- One reminder a day at the learner's chosen time (FR 9.3). Needs a development build.

Phase E: offline use
- Download a lesson with its audio and video; practise without internet; sync progress within a minute (FR 3.4, 4.7, NFR 5)

Phase F: content from the server
- Lessons update without a new app release (FR 11.3)

Phase G: release checks
- Test account off in release builds (NFR 10); USD 5 spending alert on Azure (NFR 16, set in the Azure portal); measure unit test coverage against 80% (NFR 13)

Blocked on people and content, not code
- Cultural note for each lesson (FR 3.3): needs native-speaker approval
- Second path with 10 lessons (SRS path 2): needs recordings and approval
- More roleplays: needs scripts and approval

### Status after Phase A and B (25 November 2026)

Done in code, not yet on Azure or on a phone:
- Phase A: "Can't speak now" in lessons after the first (FR 4.6; the first lesson still has no skip); sound and vibration switches on the Profile screen (FR 5.6); speech help screen (FR 12.1).
- Phase B: progress screen with streak, minutes, lessons and phrases (FR 9.1); save and unsave lessons from the lesson's first screen, listed under My progress (FR 8, lessons only).
- API: migration 006 (learning minutes, saved items), tests in api/test/progress-saved.test.ts. 87 API tests pass locally.

Still open in Phase B:
- Saving phrases (the API accepts them; no screen yet).
- Roleplay hints and several accepted answers (FR 7.2, 7.3).
- Word-level help (FR 4.8).

Not yet done:
- Deploy the API with migration 006 to Azure, then check /progress and /saved live.
- Confirm consent for under-16s (FR 1.4) against the parental_consents table.
