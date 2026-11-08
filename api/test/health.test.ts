import request from "supertest";
import { describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import type { Database } from "../src/db.js";

// Health only calls ping(); the rest of the database is never touched here.
function fakeDb(ping: () => Promise<void>): Database {
  return { pool: undefined as never, ping, close: async () => {} };
}

describe("GET /health", () => {
  test("returns ok when the database answers", async () => {
    const db = fakeDb(async () => {});

    const res = await request(createApp(db)).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  test("returns 503 when the database is unreachable", async () => {
    const db = fakeDb(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    const res = await request(createApp(db)).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", database: "down" });
  });
});
