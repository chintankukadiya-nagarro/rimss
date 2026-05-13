import { Router } from "express";
import Redis from "ioredis";

import { REDIS_URL, SKIP_REDIS } from "../config";
import { sequelize } from "../db/sequelize";

type ReadyPayload = {
  status: string;
  service: string;
  timestamp: string;
  database: "up" | "down";
  redis: "up" | "skipped" | "down";
};

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "rimss-api",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/health/ready", async (_req, res) => {
  const payload: ReadyPayload = {
    status: "ready",
    service: "rimss-api",
    timestamp: new Date().toISOString(),
    database: "down",
    redis: SKIP_REDIS ? "skipped" : "down",
  };

  try {
    await sequelize.authenticate();
    payload.database = "up";
  } catch {
    payload.database = "down";
  }

  if (!SKIP_REDIS) {
    const client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
    });
    try {
      await client.connect();
      const pong = await client.ping();
      payload.redis = pong === "PONG" ? "up" : "down";
    } catch {
      payload.redis = "down";
    } finally {
      client.disconnect();
    }
  } else {
    payload.redis = "skipped";
  }

  const ok = payload.database === "up" && (SKIP_REDIS || payload.redis === "up");
  res.status(ok ? 200 : 503).json(payload);
});
