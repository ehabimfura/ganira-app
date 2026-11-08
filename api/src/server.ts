import { config } from "./config.js";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";

const db = createDatabase(config.db);
const app = createApp(db);

// 0.0.0.0 means "accept connections from other devices on the network",
// so a phone on the same Wi-Fi can reach the API during development.
app.listen(config.port, "0.0.0.0", () => {
  console.log(`Ganira API listening on port ${config.port}`);
});
