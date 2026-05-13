import type { Request, Response } from "express";

export const CART_COOKIE = "rimss_cart";
export const ORDER_COOKIE = "rimss_order";

const COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export function uuidOk(s: string | undefined): s is string {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  );
}

export function getCartIdFromReq(req: Request): string | undefined {
  const v = req.cookies?.[CART_COOKIE] as string | undefined;
  return uuidOk(v) ? v : undefined;
}

export function setCartCookie(res: Response, cartId: string): void {
  res.cookie(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearCartCookie(res: Response): void {
  res.clearCookie(CART_COOKIE, { path: "/" });
}

export function getOrderIdFromReq(req: Request): string | undefined {
  const v = req.cookies?.[ORDER_COOKIE] as string | undefined;
  return uuidOk(v) ? v : undefined;
}

/** Demo-only: bind last created order to session for GET /orders/:id */
export function setOrderCookie(res: Response, orderId: string): void {
  res.cookie(ORDER_COOKIE, orderId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}
