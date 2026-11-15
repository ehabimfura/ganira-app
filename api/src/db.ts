import mysql from "mysql2/promise";

// Routes get the database through this object. `ping` is separate so the
// health tests can fake a database without a running MySQL.
export interface Database {
  pool: mysql.Pool;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export interface DbSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  // Set on Azure; checks the server's certificate against the roots built into Node.
  ssl?: { rejectUnauthorized: true };
}

export function createDatabase(settings: DbSettings): Database {
  // Read and write DATETIME values as UTC, so times match on the Mac and on Azure.
  const pool = mysql.createPool({ ...settings, connectionLimit: 5, timezone: "Z" });
  // Make MySQL's own NOW() and CURRENT_TIMESTAMP use UTC too (Azure's default).
  pool.pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });

  return {
    pool,
    async ping() {
      await pool.query("SELECT 1");
    },
    async close() {
      await pool.end();
    },
  };
}
