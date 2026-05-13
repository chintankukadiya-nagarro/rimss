import { Router, Request, Response } from "express";
import { Transaction } from "sequelize";

import type {
  CartPatchBody,
  CartPutBody,
  CartResponse,
} from "@rimss/shared-types";

import {
  clearCartCookie,
  getCartIdFromReq,
  setCartCookie,
  uuidOk,
} from "../lib/cookies";
import { Cart } from "../models/Cart";
import { CartLine } from "../models/CartLine";
import { Product } from "../models/Product";
import { sequelize } from "../db/sequelize";

export const cartRouter = Router();

const MAX_LINES = 100;
const MAX_PER_LINE = 99;

export async function linesToDto(cart: Cart): Promise<CartResponse> {
  const rows = await CartLine.findAll({
    where: { cartId: cart.id },
    include: [{ model: Product, as: "product", required: true }],
    order: [["createdAt", "ASC"]],
  });

  const lines: CartResponse["lines"] = [];
  let itemCount = 0;
  let subtotalCents = 0;

  for (const row of rows) {
    const p = row.get("product") as Product;
    const j = p.toJSON() as { id: string; slug: string; name: string; priceCents: number; imageUrl: string | null };
    const unitPriceCents = j.priceCents;
    const q = row.quantity;
    const lineTotalCents = unitPriceCents * q;
    itemCount += q;
    subtotalCents += lineTotalCents;
    lines.push({
      lineId: row.id,
      productId: j.id,
      slug: j.slug,
      name: j.name,
      quantity: q,
      unitPriceCents,
      lineTotalCents,
      imageUrl: j.imageUrl,
    });
  }

  return {
    lines,
    lineCount: lines.length,
    itemCount,
    subtotalCents,
    version: cart.version,
  };
}

const emptyResponse = (): CartResponse => ({
  lines: [],
  lineCount: 0,
  itemCount: 0,
  subtotalCents: 0,
  version: 0,
});

async function loadCartOrClear(req: Request, res: Response): Promise<Cart | null> {
  const id = getCartIdFromReq(req);
  if (!id) return null;
  const cart = await Cart.findByPk(id);
  if (!cart) {
    clearCartCookie(res);
  }
  return cart;
}

function normalizePutLines(
  raw: unknown,
): { ok: true; lines: { productId: string; quantity: number }[] } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || !("lines" in raw)) {
    return { ok: false, error: "invalid_body" };
  }
  const linesIn = (raw as { lines: unknown }).lines;
  if (!Array.isArray(linesIn)) {
    return { ok: false, error: "invalid_lines" };
  }
  const out: { productId: string; quantity: number }[] = [];
  for (const row of linesIn) {
    if (!row || typeof row !== "object") continue;
    const productId = (row as { productId?: unknown }).productId;
    const quantity = (row as { quantity?: unknown }).quantity;
    if (typeof productId !== "string" || !uuidOk(productId)) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) continue;
    if (quantity <= 0) continue;
    if (quantity > MAX_PER_LINE) {
      return { ok: false, error: "quantity_cap" };
    }
    out.push({ productId, quantity });
  }
  return { ok: true, lines: out };
}

function normalizePatchBody(raw: unknown): CartPatchBody | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.version !== "number" || !Number.isInteger(b.version)) return null;
  if (b.op !== "add" && b.op !== "set" && b.op !== "remove") return null;
  if (typeof b.productId !== "string" || !uuidOk(b.productId)) return null;
  if (b.quantity !== undefined && (typeof b.quantity !== "number" || !Number.isInteger(b.quantity))) {
    return null;
  }
  return {
    version: b.version,
    op: b.op,
    productId: b.productId,
    quantity: b.quantity,
  };
}

async function validateProductIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const found = await Product.findAll({
    where: { id: ids },
    attributes: ["id"],
  });
  return new Set(found.map((p) => p.id));
}

/** Replace all lines; expects cart locked and version already verified */
async function applyLines(
  cart: Cart,
  normalized: { productId: string; quantity: number }[],
  t: Transaction,
): Promise<void> {
  if (normalized.length > MAX_LINES) {
    throw new Error("line_cap");
  }
  const ids = [...new Set(normalized.map((l) => l.productId))];
  const allowed = await validateProductIds(ids);
  const missing = ids.filter((id) => !allowed.has(id));
  if (missing.length > 0) {
    const err = new Error("unknown_product") as Error & { productIds: string[] };
    err.productIds = missing;
    throw err;
  }

  await CartLine.destroy({ where: { cartId: cart.id }, transaction: t });
  for (const line of normalized) {
    await CartLine.create(
      { cartId: cart.id, productId: line.productId, quantity: line.quantity },
      { transaction: t },
    );
  }
  cart.version += 1;
  await cart.save({ transaction: t });
}

cartRouter.get("/", async (req: Request, res: Response, next) => {
  try {
    const cart = await loadCartOrClear(req, res);
    if (!cart) {
      return res.json(emptyResponse());
    }
    const body = await linesToDto(cart);
    return res.json(body);
  } catch (err) {
    next(err);
  }
});

cartRouter.put("/", async (req: Request, res: Response, next) => {
  try {
    const body = req.body as CartPutBody;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof body.version !== "number" ||
      !Number.isInteger(body.version)
    ) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const parsed = normalizePutLines(body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    let cartId = getCartIdFromReq(req);
    let created = false;

    await sequelize.transaction(async (t) => {
      let cart: Cart | null = null;
      if (cartId) {
        cart = await Cart.findByPk(cartId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }

      if (!cart) {
        cart = await Cart.create({ version: 0 }, { transaction: t });
        cartId = cart.id;
        created = true;
      }

      if (cart.version !== body.version) {
        const fresh = await linesToDto(cart);
        throw Object.assign(new Error("conflict"), {
          conflict: { serverVersion: cart.version, cart: fresh },
        });
      }

      try {
        await applyLines(cart, parsed.lines, t);
      } catch (e: unknown) {
        const err = e as Error & { productIds?: string[] };
        if (err.message === "unknown_product" && err.productIds) {
          throw Object.assign(new Error("unknown_product"), { productIds: err.productIds });
        }
        if (err.message === "line_cap") {
          throw Object.assign(new Error("line_cap"));
        }
        throw e;
      }
    });

    if (created && cartId) {
      setCartCookie(res, cartId);
    }

    const cart = await Cart.findByPk(cartId!);
    if (!cart) {
      return res.status(500).json({ error: "cart_missing" });
    }
    return res.json(await linesToDto(cart));
  } catch (e: unknown) {
    const err = e as Error & { conflict?: { serverVersion: number; cart: CartResponse }; productIds?: string[] };
    if (err.message === "conflict" && err.conflict) {
      return res.status(409).json({
        error: "conflict" as const,
        serverVersion: err.conflict.serverVersion,
        cart: err.conflict.cart,
      });
    }
    if (err.message === "unknown_product" && err.productIds) {
      return res.status(400).json({ error: "unknown_product", productIds: err.productIds });
    }
    if (err.message === "line_cap") {
      return res.status(400).json({ error: "line_cap", maxLines: MAX_LINES });
    }
    next(e);
  }
});

cartRouter.patch("/", async (req: Request, res: Response, next) => {
  try {
    const parsed = normalizePatchBody(req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    let qty = parsed.quantity;
    if (parsed.op === "add" && qty === undefined) {
      qty = 1;
    }
    if (parsed.op !== "remove" && (qty === undefined || qty <= 0 || qty > MAX_PER_LINE)) {
      return res.status(400).json({ error: "invalid_quantity" });
    }

    const cartPre = await loadCartOrClear(req, res);

    if (
      !cartPre &&
      parsed.op === "add" &&
      parsed.version === 0
    ) {
      const q = qty ?? 1;
      let newId: string | undefined;
      try {
        await sequelize.transaction(async (t) => {
          const c = await Cart.create({ version: 0 }, { transaction: t });
          newId = c.id;
          await applyLines(c, [{ productId: parsed.productId, quantity: q }], t);
        });
      } catch (e: unknown) {
        const err = e as Error & { productIds?: string[] };
        if (err.message === "unknown_product" && err.productIds) {
          return res.status(400).json({ error: "unknown_product", productIds: err.productIds });
        }
        if (err.message === "line_cap") {
          return res.status(400).json({ error: "line_cap", maxLines: MAX_LINES });
        }
        throw e;
      }
      if (newId) {
        setCartCookie(res, newId);
      }
      const fresh = await Cart.findByPk(newId!);
      if (!fresh) {
        return res.status(500).json({ error: "cart_missing" });
      }
      return res.json(await linesToDto(fresh));
    }

    if (!cartPre) {
      return res.status(400).json({ error: "no_cart", hint: "PUT /api/cart or PATCH add with version 0" });
    }

    const cart = cartPre;

    if (cart.version !== parsed.version) {
      const fresh = await linesToDto(cart);
      return res.status(409).json({
        error: "conflict",
        serverVersion: cart.version,
        cart: fresh,
      });
    }

    const existing = await CartLine.findAll({
      where: { cartId: cart.id },
      include: [{ model: Product, as: "product", required: true }],
    });

    const merged: { productId: string; quantity: number }[] = [];

    if (parsed.op === "remove") {
      for (const line of existing) {
        if (line.productId !== parsed.productId) {
          merged.push({ productId: line.productId, quantity: line.quantity });
        }
      }
    } else if (parsed.op === "set") {
      if (qty === undefined) {
        return res.status(400).json({ error: "invalid_quantity" });
      }
      let hit = false;
      for (const line of existing) {
        if (line.productId === parsed.productId) {
          hit = true;
          merged.push({ productId: line.productId, quantity: qty });
        } else {
          merged.push({ productId: line.productId, quantity: line.quantity });
        }
      }
      if (!hit) {
        merged.push({ productId: parsed.productId, quantity: qty });
      }
    } else {
      /* add */
      const addQty = qty ?? 1;
      let hit = false;
      for (const line of existing) {
        if (line.productId === parsed.productId) {
          hit = true;
          const next = Math.min(line.quantity + addQty, MAX_PER_LINE);
          merged.push({ productId: line.productId, quantity: next });
        } else {
          merged.push({ productId: line.productId, quantity: line.quantity });
        }
      }
      if (!hit) {
        merged.push({ productId: parsed.productId, quantity: addQty });
      }
    }

    await sequelize.transaction(async (t) => {
      const locked = await Cart.findByPk(cart.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!locked) {
        throw new Error("cart_missing");
      }
      if (locked.version !== parsed.version) {
        const fresh = await linesToDto(locked);
        throw Object.assign(new Error("conflict"), {
          conflict: { serverVersion: locked.version, cart: fresh },
        });
      }
      try {
        await applyLines(locked, merged, t);
      } catch (e: unknown) {
        const err = e as Error & { productIds?: string[] };
        if (err.message === "unknown_product" && err.productIds) {
          throw Object.assign(new Error("unknown_product"), { productIds: err.productIds });
        }
        if (err.message === "line_cap") {
          throw Object.assign(new Error("line_cap"));
        }
        throw e;
      }
    });

    const fresh = await Cart.findByPk(cart.id);
    if (!fresh) return res.status(500).json({ error: "cart_missing" });
    return res.json(await linesToDto(fresh));
  } catch (e: unknown) {
    const err = e as Error & { conflict?: { serverVersion: number; cart: CartResponse }; productIds?: string[] };
    if (err.message === "conflict" && err.conflict) {
      return res.status(409).json({
        error: "conflict" as const,
        serverVersion: err.conflict.serverVersion,
        cart: err.conflict.cart,
      });
    }
    if (err.message === "unknown_product" && err.productIds) {
      return res.status(400).json({ error: "unknown_product", productIds: err.productIds });
    }
    if (err.message === "line_cap") {
      return res.status(400).json({ error: "line_cap", maxLines: MAX_LINES });
    }
    next(e);
  }
});
