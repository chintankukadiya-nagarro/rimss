import path from "path";
import dotenv from "dotenv";

/** Support running npm scripts from monorepo root or apps/api */
function loadDotenv(): void {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
    path.join(cwd, "..", ".env"),
    path.join(cwd, "..", "..", ".env"),
  ];
  for (const p of candidates) {
    dotenv.config({ path: p });
  }
}

loadDotenv();

export function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== "") return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env ${name}`);
}

export const PORT = Number(process.env.API_PORT ?? 4000);
export const DATABASE_URL = env(
  "DATABASE_URL",
  "postgresql://rimss:rimss@localhost:5433/rimss",
);
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6380";
export const SKIP_REDIS = process.env.SKIP_REDIS === "1";
export const SEARCH_CACHE_TTL_SEC = Number(process.env.SEARCH_CACHE_TTL_SEC ?? 90);
