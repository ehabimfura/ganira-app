import mysql from "mysql2/promise";
import { config } from "../src/config.js";
import { runMigrations } from "../src/migrate.js";

// Tests use a separate local database so they never touch ganira_dev.
export const testDbSettings = { ...config.db, database: "ganira_test" };

const TABLES = ["sessions", "parental_consents", "learners", "accounts", "schema_migrations"];

export async function dropAllTables(): Promise<void> {
  const conn = await mysql.createConnection(testDbSettings);
  try {
    for (const table of TABLES) await conn.query(`DROP TABLE IF EXISTS ${table}`);
  } finally {
    await conn.end();
  }
}

export async function freshTestDatabase(): Promise<void> {
  await dropAllTables();
  await runMigrations(testDbSettings);
}

export { TABLES };
