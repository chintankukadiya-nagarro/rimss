import { Router, Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";

import { SEARCH_CACHE_TTL_SEC } from "../config";
import { Product, ProductAttrs } from "../models/Product";
import { getRedis } from "../redis/client";
import { normalizeSearchQuery, searchCacheKey } from "../search/query";

export const productsRouter = Router();

export interface ProductJson {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  colour: string | null;
  priceCents: number;
  onSale: boolean;
  imageUrl: string | null;
}

function toJson(p: Product): ProductJson {
  const j = p.toJSON() as ProductAttrs;
  return {
    id: j.id,
    slug: j.slug,
    name: j.name,
    category: j.category,
    colour: j.colour,
    priceCents: j.priceCents,
    onSale: j.onSale,
    imageUrl: j.imageUrl,
  };
}

function buildWhere(n: ReturnType<typeof normalizeSearchQuery>): WhereOptions<ProductAttrs> {
  const parts: WhereOptions<ProductAttrs>[] = [];
  if (n.category) {
    parts.push({ category: { [Op.iLike]: n.category } });
  }
  if (n.colour) {
    parts.push({ colour: { [Op.iLike]: n.colour } });
  }
  if (n.onSale !== undefined) {
    parts.push({ onSale: n.onSale });
  }
  if (n.minPriceCents !== undefined && n.maxPriceCents !== undefined) {
    parts.push({
      priceCents: { [Op.between]: [n.minPriceCents, n.maxPriceCents] },
    });
  } else if (n.minPriceCents !== undefined) {
    parts.push({ priceCents: { [Op.gte]: n.minPriceCents } });
  } else if (n.maxPriceCents !== undefined) {
    parts.push({ priceCents: { [Op.lte]: n.maxPriceCents } });
  }
  if (n.q) {
    const like = `%${n.q.replace(/[%_\\]/g, "\\$&")}%`;
    parts.push({
      [Op.or]: [
        { name: { [Op.iLike]: like } },
        { slug: { [Op.iLike]: like } },
        { category: { [Op.iLike]: like } },
      ],
    });
  }
  if (parts.length === 0) return {};
  return { [Op.and]: parts };
}

productsRouter.get("/search", async (req: Request, res: Response, next) => {
  try {
    const normalized = normalizeSearchQuery(req.query as Record<string, unknown>);
    const redis = getRedis();
    const key = searchCacheKey(normalized);

    if (redis) {
      try {
        const hit = await redis.get(key);
        if (hit) {
          res.setHeader("X-Cache", "HIT");
          res.setHeader("Content-Type", "application/json");
          return res.status(200).send(hit);
        }
      } catch {
        /* fall through */
      }
    }

    const where = buildWhere(normalized);
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: normalized.limit,
      offset: normalized.offset,
      order: [["updatedAt", "DESC"]],
    });

    const body = {
      items: rows.map(toJson),
      total: count,
      limit: normalized.limit,
      offset: normalized.offset,
      query: normalized,
    };

    const json = JSON.stringify(body);
    res.setHeader("X-Cache", "MISS");
    if (redis) {
      try {
        await redis.setex(key, SEARCH_CACHE_TTL_SEC, json);
      } catch {
        /* ignore cache write errors */
      }
    }
    return res.status(200).type("json").send(json);
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:slug", async (req: Request, res: Response, next) => {
  try {
    const { slug } = req.params;
    if (slug === "search") {
      return res.status(404).json({ error: "not_found" });
    }
    const p = await Product.findOne({ where: { slug } });
    if (!p) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json(toJson(p));
  } catch (err) {
    next(err);
  }
});
