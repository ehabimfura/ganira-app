import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { DbSettings } from "./db.js";

export const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../db/migrations");

// Applies every .sql file in `dir` that hasn't run yet, in file-name order,
// and records each one in schema_migrations. Running it twice changes nothing.
export async function runMigrations(settings: DbSettings, dir = MIGRATIONS_DIR): Promise<string[]> {
  // Migration files hold several statements, which only this connection allows.
  const conn = await mysql.createConnection({ ...settings, multipleStatements: true });
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT name FROM schema_migrations");
    const done = new Set(rows.map((row) => row.name as string));
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

    const applied: string[] = [];
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      // MySQL commits table changes immediately, so a failed file can leave
      // part of its work behind. Keep one logical change per file.
      await conn.query(sql);
      await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      applied.push(file);
    }
    return applied;
  } finally {
    await conn.end();
  }
}
