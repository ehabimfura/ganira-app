# Ganira

Ganira (from *kuganira*, "to converse") is a speaking-first app for learning Kinyarwanda.
It is built for diaspora families and for foreigners living in Rwanda.

## Layout

| Folder | What it holds | Status |
| --- | --- | --- |
| `app/` | Phone app (Expo, React Native, TypeScript) | Sprint 0 skeleton |
| `api/` | Node.js API (Express 5, TypeScript, mysql2) | Sprint 0: `/health` |
| `speech/` | Python speech-recognition service | Not started (Sprint 3) |
| `docs/` | Pointers to the SRS and UML diagrams | Done |
| `e2e/` | Browser click-through tests of the app screens | Steps A, B and C (18 checks) |
| `tools/voice/` | Makes lesson clips in Ganira's voice for approval | Voice B |

## Local development

Requirements: Node 24+, npm, Homebrew, MySQL 8.4.

```sh
# Database (local only until 13 November)
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
is only needed to point the app at another API, such as the Azure one.

The local database is `ganira_dev` on `127.0.0.1:3306`.
The project moves to Azure on 13 November, before the demo. See [docs/BACKLOG.md](docs/BACKLOG.md).
