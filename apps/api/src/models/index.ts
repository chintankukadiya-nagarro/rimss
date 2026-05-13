import "../db/sequelize";
import "./Product";
import { Cart } from "./Cart";
import { CartLine } from "./CartLine";
import { Order } from "./Order";
import { OrderLine } from "./OrderLine";
import { Product } from "./Product";
import { StripeWebhookEvent } from "./StripeWebhookEvent";

Cart.hasMany(CartLine, { foreignKey: "cartId", as: "lines" });
CartLine.belongsTo(Cart, { foreignKey: "cartId" });
CartLine.belongsTo(Product, { foreignKey: "productId", as: "product" });

Order.hasMany(OrderLine, { foreignKey: "orderId", as: "lines" });
OrderLine.belongsTo(Order, { foreignKey: "orderId" });

export { Cart } from "./Cart";
export { CartLine } from "./CartLine";
export { Order } from "./Order";
export { OrderLine } from "./OrderLine";
export { Product } from "./Product";
export { StripeWebhookEvent } from "./StripeWebhookEvent";
export { sequelize } from "../db/sequelize";
