import { Cart } from "../models/Cart";
import { CartLine } from "../models/CartLine";
import { Order } from "../models/Order";
import { StripeWebhookEvent } from "../models/StripeWebhookEvent";
import { sequelize } from "../db/sequelize";

export async function clearCartById(cartId: string): Promise<void> {
  await sequelize.transaction(async (t) => {
    const cart = await Cart.findByPk(cartId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cart) return;
    await CartLine.destroy({ where: { cartId }, transaction: t });
    cart.version += 1;
    await cart.save({ transaction: t });
  });
}

/**
 * Idempotent: duplicate stripeEventId is ignored; missing order does not record the event so Stripe can retry.
 */
export async function markOrderPaidFromWebhook(
  orderId: string,
  stripeEventId: string,
): Promise<void> {
  await sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) {
      return;
    }

    const [, created] = await StripeWebhookEvent.findOrCreate({
      where: { stripeEventId },
      defaults: { stripeEventId },
      transaction: t,
    });
    if (!created) {
      return;
    }

    if (order.status === "paid") {
      return;
    }

    order.status = "paid";
    order.paidAt = new Date();
    await order.save({ transaction: t });

    if (order.sourceCartId) {
      await CartLine.destroy({ where: { cartId: order.sourceCartId }, transaction: t });
      const cart = await Cart.findByPk(order.sourceCartId, { transaction: t, lock: t.LOCK.UPDATE });
      if (cart) {
        cart.version += 1;
        await cart.save({ transaction: t });
      }
    }
  });
}

export async function markOrderPaidMock(orderId: string): Promise<Order | null> {
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) return null;
    if (order.status !== "pending_payment") {
      return order;
    }
    order.status = "paid";
    order.paidAt = new Date();
    await order.save({ transaction: t });

    if (order.sourceCartId) {
      await CartLine.destroy({ where: { cartId: order.sourceCartId }, transaction: t });
      const cart = await Cart.findByPk(order.sourceCartId, { transaction: t, lock: t.LOCK.UPDATE });
      if (cart) {
        cart.version += 1;
        await cart.save({ transaction: t });
      }
    }
    return order;
  });
}
