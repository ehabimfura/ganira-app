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

# Phone app (first time: cp .env.example .env and set your Mac's Wi-Fi IP)
cd app
npm install
npm start          # then scan the QR code with Expo Go
```

Your phone and Mac must be on the same Wi-Fi. If your Mac's IP changes,
update `EXPO_PUBLIC_API_URL` in `app/.env` (find it with `ipconfig getifaddr en0`).

The local database is `ganira_dev` on `127.0.0.1:3306`.
The project moves to Azure on 13 November, before the demo. See [docs/BACKLOG.md](docs/BACKLOG.md).
