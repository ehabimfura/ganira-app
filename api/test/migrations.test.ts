import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { runMigrations } from "../src/migrate.js";
import { dropAllTables, TABLES, testDbSettings as settings, usernameFor } from "./test-db.js";

let conn: mysql.Connection;

async function addAccount(email: string, kind = "PARENT") {
  const [result] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO accounts (email, username, password_hash, kind, birth_year) VALUES (?, ?, 'x', ?, 1990)",
    [email, usernameFor(email), kind],
  );
  return result.insertId;
}

beforeAll(async () => {
  await dropAllTables();
  conn = await mysql.createConnection(settings);
});

afterAll(async () => {
  await conn.end();
});

describe("migrations", () => {
  test("first run applies every migration and creates the account tables", async () => {
    const applied = await runMigrations(settings);
    expect(applied).toEqual(["001_accounts.sql", "002_onboarding.sql", "003_adult_path.sql"]);

    const [rows] = await conn.query<mysql.RowDataPacket[]>("SHOW TABLES");
    const names = rows.map((row) => Object.values(row)[0]);
    expect(names).toEqual(expect.arrayContaining(TABLES));
  });

  test("second run applies nothing", async () => {
    expect(await runMigrations(settings)).toEqual([]);
  });

  test("rejects a duplicate email", async () => {
    await addAccount("dup@example.com");
    await expect(addAccount("dup@example.com")).rejects.toThrow(/Duplicate entry/);
  });

  test("rejects a PIN on a SELF profile", async () => {
    const accountId = await addAccount("self@example.com", "LEARNER");
    await expect(
      conn.query(
        "INSERT INTO learners (account_id, kind, nickname, avatar, pin_hash) VALUES (?, 'SELF', 'Ann', 'lion', 'h')",
        [accountId],
      ),
    ).rejects.toThrow(/ck_learners_pin_child/);
  });

  test("deleting a parent account removes its children, consents and sessions", async () => {
    const parentId = await addAccount("parent@example.com");
    const [child] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO learners (account_id, kind, nickname, avatar) VALUES (?, 'CHILD', 'Keza', 'giraffe')",
      [parentId],
    );
    await conn.query("INSERT INTO parental_consents (parent_account_id, learner_id) VALUES (?, ?)", [
      parentId,
      child.insertId,
    ]);
    await conn.query(
      "INSERT INTO sessions (account_id, active_learner_id, token_hash, expires_at) VALUES (?, ?, REPEAT('a', 64), NOW() + INTERVAL 1 DAY)",
      [parentId, child.insertId],
    );

    await conn.query("DELETE FROM accounts WHERE id = ?", [parentId]);

    for (const [table, column] of [
      ["learners", "account_id"],
      ["parental_consents", "parent_account_id"],
      ["sessions", "account_id"],
    ]) {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`,
        [parentId],
      );
      expect(rows[0].n, table).toBe(0);
    }
  });
});
