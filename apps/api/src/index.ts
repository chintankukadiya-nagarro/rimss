import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import "./models/index";

import { PORT } from "./config";
import { correlationMiddleware } from "./middleware/correlation";
import { cartRouter } from "./routes/cart";
import { checkoutRouter } from "./routes/checkout";
import { healthRouter } from "./routes/health";
import { ordersRouter } from "./routes/orders";
import { productsRouter } from "./routes/products";
import { stripeWebhookHandler } from "./routes/webhooks/stripe";

const app = express();

app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      await stripeWebhookHandler(req, res);
    } catch (e) {
      next(e);
    }
  },
);

app.use(express.json());
app.use(correlationMiddleware);
app.use(healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_server_error" });
});

app.listen(PORT, () => {
  console.log(`RIMSS API listening on http://localhost:${PORT}`);
});
