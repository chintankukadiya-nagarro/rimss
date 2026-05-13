import "../models/index";
import { sequelize } from "../db/sequelize";

async function main(): Promise<void> {
  await sequelize.sync();
  console.log("Migrations/sync complete (products, carts, cart_lines, orders, order_lines, stripe_webhook_events).");
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
