import cors from "cors";
import express from "express";

import "./models/index";

import { PORT } from "./config";
import { correlationMiddleware } from "./middleware/correlation";
import { healthRouter } from "./routes/health";
import { productsRouter } from "./routes/products";

const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(correlationMiddleware);
app.use(healthRouter);
app.use("/api/products", productsRouter);

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
