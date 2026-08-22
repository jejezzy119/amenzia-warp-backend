import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  await client.connect();

  const sqlDir = path.resolve(__dirname, "../sql");

  const files = (await fs.readdir(sqlDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);

    const sql = await fs.readFile(path.join(sqlDir, file), "utf8");

    await client.query(sql);

    console.log(`Completed: ${file}`);
  }

  await client.end();

  console.log("All migrations completed.");
}

migrate().catch(async (error) => {
  console.error("Migration failed:", error);

  await client.end().catch(() => {});

  process.exit(1);
});
