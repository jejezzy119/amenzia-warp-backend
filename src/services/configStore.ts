import { db } from "../database.js";

export interface StoredConfig {
  id: string;
  config: string;
  createdAt: Date;
  expiresAt: Date | null;
  status: string;
}

export async function saveConfig(
  id: string,
  config: string,
  expiresAt: Date | null = null,
): Promise<StoredConfig> {
  const result = await db.query(
    `
    INSERT INTO configs (
      id,
      config,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      config,
      created_at,
      expires_at,
      status
    `,
    [id, config, expiresAt],
  );

  const row = result.rows[0];

  return {
    id: row.id,
    config: row.config,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: row.status,
  };
}

export async function getConfig(id: string): Promise<StoredConfig | undefined> {
  const result = await db.query(
    `
    SELECT
      id,
      config,
      created_at,
      expires_at,
      status
    FROM configs
    WHERE id = $1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    config: row.config,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: row.status,
  };
}

export async function disableConfig(id: string): Promise<boolean> {
  const result = await db.query(
    `
    UPDATE configs
    SET status = 'disabled'
    WHERE id = $1
      AND status = 'active'
    `,
    [id],
  );

  return result.rowCount === 1;
}
