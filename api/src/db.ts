import mysql from "mysql2/promise";

// The rest of the API talks to the database through this small interface,
// so tests can swap in a fake without a running MySQL.
export interface Database {
  ping(): Promise<void>;
}

export interface DbSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function createDatabase(settings: DbSettings): Database {
  const pool = mysql.createPool({ ...settings, connectionLimit: 5 });

  return {
    async ping() {
      await pool.query("SELECT 1");
    },
  };
}
