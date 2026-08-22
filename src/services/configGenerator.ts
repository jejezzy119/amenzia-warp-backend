import { registerWarp, parseWarpConfig } from "./warp.js";

import { buildAwg2Config } from "./awg.js";
import { writeAwg2Config } from "./configWriter.js";

export async function generateConfig(expiresInDays?: number) {
  const id = crypto.randomUUID();

  let expiresAt: Date | null = null;

  if (expiresInDays !== undefined) {
    expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const result = await registerWarp();

  const warp = parseWarpConfig(result.data);

  const awg = buildAwg2Config(result.keys, warp);

  const config = writeAwg2Config(awg);

  return {
    id,
    config,
    expiresAt,
  };
}
