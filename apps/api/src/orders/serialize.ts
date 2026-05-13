import type { OrderSummaryDto } from "@rimss/shared-types";

import type { Order } from "../models/Order";
import { OrderLine } from "../models/OrderLine";
import { OrderStatusDb } from "../models/Order";

function statusApi(s: OrderStatusDb): OrderSummaryDto["status"] {
  return s;
}

export async function orderToSummary(order: Order): Promise<OrderSummaryDto> {
  const lines = await OrderLine.findAll({
    where: { orderId: order.id },
    order: [["createdAt", "ASC"]],
  });

  return {
    id: order.id,
    status: statusApi(order.status),
    subtotalCents: order.subtotalCents,
    currency: order.currency,
    cartVersionAtCheckout: order.cartVersionAtCheckout,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    sourceCartId: order.sourceCartId,
    lines: lines.map((row) => ({
      id: row.id,
      productId: row.productId,
      slug: row.slug,
      name: row.name,
      quantity: row.quantity,
      unitPriceCents: row.unitPriceCents,
      lineTotalCents: row.lineTotalCents,
      imageUrl: row.imageUrl,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}
