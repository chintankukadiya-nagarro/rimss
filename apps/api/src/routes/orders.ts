import { Router, type Request, type Response } from "express";

import { getOrderIdFromReq } from "../lib/cookies";
import { orderToSummary } from "../orders/serialize";
import { Order } from "../models/Order";

export const ordersRouter = Router();

ordersRouter.get("/:id", async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const allowedId = getOrderIdFromReq(req);
    if (!allowedId || allowedId !== id) {
      return res.status(403).json({ error: "forbidden" });
    }
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.json(await orderToSummary(order));
  } catch (e) {
    next(e);
  }
});
