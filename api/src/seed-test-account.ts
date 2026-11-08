// Creates the test account from the SRS: a parent ("john") with one child profile.
// Credentials come from .env. Never runs in production.
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { hashSecret } from "./auth/passwords.js";
import { config } from "./config.js";
import { createDatabase } from "./db.js";

const TEST_BIRTH_YEAR = 1990;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create the test account in production.");
  }
  const email = process.env.TEST_ACCOUNT_EMAIL;
  const password = process.env.TEST_ACCOUNT_PASSWORD;
  if (!email || !password) {
    throw new Error("Set TEST_ACCOUNT_EMAIL and TEST_ACCOUNT_PASSWORD in .env first.");
  }

  const db = createDatabase(config.db);
  try {
    const [existing] = await db.pool.query<RowDataPacket[]>("SELECT id FROM accounts WHERE email = ?", [email]);
    if (existing.length) {
      console.log(`Test account ${email} already exists.`);
      return;
    }

    const [account] = await db.pool.query<ResultSetHeader>(
      "INSERT INTO accounts (email, password_hash, kind, birth_year) VALUES (?, ?, 'PARENT', ?)",
      [email, await hashSecret(password), TEST_BIRTH_YEAR],
    );
    const [child] = await db.pool.query<ResultSetHeader>(
      "INSERT INTO learners (account_id, kind, nickname, avatar, age_range) VALUES (?, 'CHILD', 'Keza', 'giraffe', '6-9')",
      [account.insertId],
    );
    await db.pool.query("INSERT INTO parental_consents (parent_account_id, learner_id) VALUES (?, ?)", [
      account.insertId,
      child.insertId,
    ]);
    console.log(`Created test parent ${email} with child profile Keza.`);
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
