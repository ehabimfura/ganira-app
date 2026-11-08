# Ganira

Ganira (from *kuganira*, "to converse") is a speaking-first app for learning Kinyarwanda.
It is built for diaspora families and for foreigners living in Rwanda.

## Layout

| Folder | What it holds | Status |
| --- | --- | --- |
| `app/` | Phone app (Expo, React Native, TypeScript) | Sprint 0 skeleton |
| `api/` | Node.js API | Not started |
| `speech/` | Python speech-recognition service | Not started (Sprint 3) |
| `docs/` | Pointers to the SRS and UML diagrams | Done |

## Local development

Requirements: Node 24+, npm, Homebrew, MySQL 8.4.

```sh
# Database (local only during Sprints 0-4)
brew services start mysql@8.4

# Phone app
cd app
npm install
npm start          # then scan the QR code with Expo Go
```

The local database is `ganira_dev` on `127.0.0.1:3306`.
The project moves to Azure Database for MySQL before the pilot in Sprint 5.
