import { getConfig, type StoredConfig } from "./configStore.js";

export async function getActiveConfig(
  id: string,
): Promise<
  { config: StoredConfig } | { error: "not_found" | "disabled" | "expired" }
> {
  const stored = await getConfig(id);

  if (!stored) {
    return {
      error: "not_found",
    };
  }

  if (stored.status !== "active") {
    return {
      error: "disabled",
    };
  }

  if (stored.expiresAt !== null && stored.expiresAt <= new Date()) {
    return {
      error: "expired",
    };
  }

  return {
    config: stored,
  };
}
