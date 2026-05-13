import Redis from "ioredis";
import { REDIS_URL, SKIP_REDIS } from "../config";

let client: Redis | undefined;

/** Singleton; callers treat falsy as no-cache. SKIP_REDIS=1 disables caching. */
export function getRedis(): Redis | undefined {
  if (SKIP_REDIS) return undefined;
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    client.on("error", (err) => console.error("[redis]", err.message));
  }
  return client;
}
