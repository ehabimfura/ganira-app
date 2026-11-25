# Ganira

Ganira (from *kuganira*, "to converse") is a speaking-first app for learning Kinyarwanda.
It is built for diaspora families and for foreigners living in Rwanda.

## Setting up the project on your computer

Follow these steps in order. Commands are run in the Terminal, from the folder that holds this README.

### What you need

- **Node.js 24 or newer** (includes npm). Check with `node --version`.
- **Homebrew** (macOS), to install MySQL. Install it from https://brew.sh if you don't have it.
- **MySQL 8.4**.
- **Python 3.11 or newer**, for the speech service.
- **Expo Go** on your phone (free, from the App Store or Google Play), to run the app without building it.

### Step 1: Start the database

```sh
brew install mysql@8.4
brew services start mysql@8.4
mysql -u root -e "CREATE DATABASE ganira_dev; CREATE DATABASE ganira_test; CREATE USER 'ganira'@'localhost' IDENTIFIED BY 'choose-a-password'; GRANT ALL ON ganira_dev.* TO 'ganira'@'localhost'; GRANT ALL ON ganira_test.* TO 'ganira'@'localhost';"
```

Replace `choose-a-password` with your own password and keep it for Step 2.

### Step 2: Set up the API

```sh
cd api
cp .env.example .env
```

Open `api/.env` and fill in:

- `DB_PASSWORD`: the password from Step 1.
- `TEST_ACCOUNT_PASSWORD`: any password you choose (for the test account, used only on your computer).

Then install and start it:

```sh
npm install
npm run migrate            # creates the tables
npm run seed:test-account  # test parent "john" and child "Keza" (local only)
npm run dev                # leave this running; check http://localhost:3000/health shows "ok"
```

To run the API tests, open a second Terminal window, `cd api`, and run `npm test`.

### Step 3: Start the speech service (optional, needed for speaking checks)

Open a third Terminal window:

```sh
cd speech
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python server.py
```

The first start downloads the speech model, which takes a few minutes. Leave it running.
Without this step the app still works, but the speaking checks say they can't reach the speech service.

### Step 4: Set up the app

Open a fourth Terminal window:

```sh
cd app
cp .env.example .env
npm install
npm start
```

`app/.env` can stay empty for local work: in development the app finds the API on your computer by itself.

### Step 5: Open the app on your phone

1. Make sure your phone and computer are on the same Wi-Fi.
2. Open Expo Go on your phone.
3. Scan the QR code shown in the Terminal from Step 4.

The app opens in Expo Go. On a laptop without a phone, press `w` in the Terminal from Step 4 to open the web version.

### Step 6 (optional): Run the screen tests

With the API (Step 2) and the web version (Step 5) running, in a new Terminal window:

```sh
cd e2e
npm install
npm test
```

## Install on Android (APK)

**Download the app:** https://expo.dev/artifacts/eas/DBY04DyAstW86R4WejuTp4b7scn8KGYG1o9TJ2IpCcg.apk (about 106 MB)

Install steps on an Android phone:

1. Open the link above in the phone's browser and download the file.
2. When the download finishes, open the file from the notifications or the Downloads app.
3. If the phone asks, allow installs from this browser (Settings → Apps → your browser → Install unknown apps).
4. Tap Install, then Open.
5. Sign in, or create an account. The app uses the live API on Azure.

The APK is built in the cloud by Expo (EAS). To build it yourself, you need a free Expo account:

```sh
cd app
npx eas-cli login          # sign in to your Expo account
npx eas-cli build -p android --profile preview
```

The build already points at the live API on Azure (set in `app/eas.json`).

iPhones cannot install APK files. An iPhone install needs an Apple Developer account and TestFlight, which is not set up yet.

## Layout

| Folder | What it holds | Status |
| --- | --- | --- |
| `app/` | Phone app (Expo, React Native, TypeScript) | Unit 1 on phones: 9 levels, including the Daisy video, sign-in, profiles, speech check |
| `api/` | Node.js API (Express 5, TypeScript, mysql2) | Accounts, child profiles, lesson progress, streak, spaced review, speech check |
| `speech/` | Python speech-recognition service (w2v-BERT 2.0, ONNX int8) | Running on Azure; per-word scoring |
| `docs/` | Backlog, lesson design, and pointers to the SRS and UML diagrams | Current |
| `e2e/` | Browser click-through tests of the app screens | Unit 1 path (20 checks) |
| `tools/voice/` | Makes lesson clips in Ganira's voice for approval | Voice B; Module 1 audio approved |

## Hosting

- **Azure (South Africa North), live since 15 November 2026.** The API and speech service are two App
  Services (`ganira-api-eh`, `ganira-speech-eh`) on one B2 plan. The database is Azure Database
  for MySQL Flexible Server (`ganira-db`, B1ms, free for 12 months). Resource group: `ganira-rg`.
- Secrets live only in Azure App Settings and in a local file outside the repo. Nothing secret is committed.
- Deploy the API and speech service with `scripts/deploy-azure.sh` (builds locally, stops, uploads, starts).

## Where things live

- The local database is `ganira_dev` on `127.0.0.1:3306`. The live database is on Azure.
- Plan and history: [docs/BACKLOG.md](docs/BACKLOG.md). Lesson design: [docs/LESSON-DESIGN.md](docs/LESSON-DESIGN.md).
- The Software Requirements Specification (SRS) is linked from the submission document.
