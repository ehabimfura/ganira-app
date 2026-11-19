# Ganira

Ganira (from *kuganira*, "to converse") is a speaking-first app for learning Kinyarwanda.
It is built for diaspora families and for foreigners living in Rwanda.

## Layout

| Folder | What it holds | Status |
| --- | --- | --- |
| `app/` | Phone app (Expo, React Native, TypeScript) | Unit 1 on phones: 8 levels, sign-in, profiles, speech check |
| `api/` | Node.js API (Express 5, TypeScript, mysql2) | Accounts, child profiles, lesson progress, streak, spaced review, speech check |
| `speech/` | Python speech-recognition service (w2v-BERT 2.0, ONNX int8) | Running on Azure; per-word scoring |
| `docs/` | Backlog, lesson design, and pointers to the SRS and UML diagrams | Current |
| `e2e/` | Browser click-through tests of the app screens | Unit 1 path (20 checks) |
| `tools/voice/` | Makes lesson clips in Ganira's voice for approval | Voice B; Module 1 audio approved |

## Hosting

- **Azure (South Africa North), live since 15 November 2026.** The API and speech service are two App
  Services (`ganira-api-eh`, `ganira-speech-eh`) on one B1 plan. The database is Azure Database
  for MySQL Flexible Server (`ganira-db`, B1ms, free for 12 months). Resource group: `ganira-rg`.
- Secrets live only in Azure App Settings and in a local file outside the repo. Nothing secret is committed.
- Deploy the API and speech service with `scripts/deploy-azure.sh` (builds locally, stops, uploads, starts).

## Local development

Requirements: Node 24+, npm, Homebrew, MySQL 8.4.

```sh
# Database (local development; production is on Azure)
brew services start mysql@8.4

# API (first time: cp .env.example .env and fill in DB_PASSWORD)
cd api
npm install
npm run migrate    # create or update tables
npm run seed:test-account   # test parent "john" + child "Keza" (dev only)
npm run dev        # http://localhost:3000/health
npm test

# Phone app (in development it finds the API on your Mac by itself)
cd app
npm install
npm start          # then scan the QR code with Expo Go
```

To click through the screens automatically: start the API and `npx expo start --web` in `app/`,
then `cd e2e && npm install && npm test`.

Your phone and Mac must be on the same Wi-Fi. `EXPO_PUBLIC_API_URL` in `app/.env`
points the app at the API. Set it to the Azure API to test without the laptop.

The local database is `ganira_dev` on `127.0.0.1:3306`. The live database is on Azure.
Plan and history: [docs/BACKLOG.md](docs/BACKLOG.md).
