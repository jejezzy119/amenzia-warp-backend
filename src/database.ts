import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

if (!config.database.url) {
  throw new Error("DATABASE_URL is not configured");
}

export const db = new Pool({
  connectionString: config.database.url,
  ssl:
    config.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined,
});
