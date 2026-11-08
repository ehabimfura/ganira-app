import { config } from "./config.js";
import { runMigrations } from "./migrate.js";

try {
  const applied = await runMigrations(config.db);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
}
