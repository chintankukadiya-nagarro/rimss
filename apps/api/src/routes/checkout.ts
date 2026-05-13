import { Router, type Request, type Response } from "express";

import type { CheckoutSessionResponse } from "@rimss/shared-types";

import {
  PAYMENT_PROVIDER,
  STRIPE_PUBLISHABLE_KEY,
} from "../config";
import {
  clearCartCookie,
  getCartIdFromReq,
  setOrderCookie,
} from "../lib/cookies";
import { markOrderPaidMock } from "../orders/orderPaid";
import { orderToSummary } from "../orders/serialize";
import { getPaymentAdaptor } from "../payment/factory";
import { isMockClientSecret } from "../payment/mockAdaptor";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { OrderLine } from "../models/OrderLine";
import { sequelize } from "../db/sequelize";
import { linesToDto } from "./cart";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/session",
  async (req: Request, res: Response, next) => {
    try {
      const cartId = getCartIdFromReq(req);
      if (!cartId) {
        return res.status(400).json({ error: "no_cart" });
      }
      const cart = await Cart.findByPk(cartId);
      if (!cart) {
        clearCartCookie(res);
        return res.status(400).json({ error: "no_cart" });
      }
      const snapshot = await linesToDto(cart);
      if (snapshot.lines.length === 0) {
        return res.status(400).json({ error: "empty_cart" });
      }
      const body = req.body as { version?: number };
      if (body.version !== undefined && body.version !== snapshot.version) {
        return res.status(409).json({
          error: "cart_conflict",
          serverVersion: snapshot.version,
        });
      }

      const adaptor = getPaymentAdaptor();

      const createdOrder = await sequelize.transaction(async (t) => {
        const o = await Order.create(
          {
            status: "pending_payment",
            subtotalCents: snapshot.subtotalCents,
            cartVersionAtCheckout: snapshot.version,
            sourceCartId: cartId,
            currency: "usd",
          },
          { transaction: t },
        );
        for (const line of snapshot.lines) {
          await OrderLine.create(
            {
              orderId: o.id,
              productId: line.productId,
              slug: line.slug,
              name: line.name,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              lineTotalCents: line.lineTotalCents,
              imageUrl: line.imageUrl,
            },
            { transaction: t },
          );
        }
        return o;
      });

      const pay = await adaptor.createPayment({
        orderId: createdOrder.id,
        amountCents: snapshot.subtotalCents,
        currency: "usd",
      });

      await createdOrder.update({ externalPaymentId: pay.externalId });

      setOrderCookie(res, createdOrder.id);

      const payload: CheckoutSessionResponse = {
        orderId: createdOrder.id,
        clientSecret: pay.clientSecret,
        publishableKey:
          PAYMENT_PROVIDER === "stripe" ? STRIPE_PUBLISHABLE_KEY || null : null,
        paymentProvider: PAYMENT_PROVIDER,
      };
      return res.status(201).json(payload);
    } catch (err) {
      next(err);
    }
  },
);

checkoutRouter.post(
  "/mock/complete",
  async (req: Request, res: Response, next) => {
    try {
      if (PAYMENT_PROVIDER !== "mock") {
        return res.status(404).json({ error: "not_found" });
      }
      const { orderId, clientSecret } = req.body as {
        orderId?: string;
        clientSecret?: string;
      };
      if (!orderId || typeof orderId !== "string" || !clientSecret) {
        return res.status(400).json({ error: "invalid_body" });
      }
      if (!isMockClientSecret(clientSecret, orderId)) {
        return res.status(400).json({ error: "invalid_client_secret" });
      }
      const existing = await Order.findByPk(orderId);
      if (!existing) {
        return res.status(404).json({ error: "not_found" });
      }
      if (existing.status !== "pending_payment") {
        const summary = await orderToSummary(existing);
        return res.status(200).json(summary);
      }
      await markOrderPaidMock(orderId);
      const fresh = await Order.findByPk(orderId);
      if (!fresh) {
        return res.status(500).json({ error: "order_missing" });
      }
      setOrderCookie(res, orderId);
      return res.json(await orderToSummary(fresh));
    } catch (err) {
      next(err);
    }
  },
);
