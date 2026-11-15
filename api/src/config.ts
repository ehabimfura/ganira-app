import { existsSync } from "node:fs";

// Locally, settings come from api/.env. On Azure they come from App Settings,
// so a missing .env file is normal there.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing setting ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  // The speech service (speech/server.py). On a laptop it only listens on this computer;
  // on Azure it is its own web app and needs SPEECH_KEY.
  speechUrl: process.env.SPEECH_URL ?? "http://127.0.0.1:8000",
  speechKey: process.env.SPEECH_KEY || undefined,
  db: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    // Azure Database for MySQL only accepts encrypted connections.
    ssl: process.env.DB_SSL === "true" ? ({ rejectUnauthorized: true } as const) : undefined,
  },
};
