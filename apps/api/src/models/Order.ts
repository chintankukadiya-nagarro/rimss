import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export type OrderStatusDb = "pending_payment" | "paid" | "failed" | "cancelled";

export interface OrderAttrs {
  id: string;
  status: OrderStatusDb;
  subtotalCents: number;
  currency: string;
  cartVersionAtCheckout: number | null;
  /** Set at checkout so webhooks can clear the anonymous cart without browser cookies. */
  sourceCartId: string | null;
  externalPaymentId: string | null;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderCreate = Optional<
  OrderAttrs,
  "id" | "cartVersionAtCheckout" | "sourceCartId" | "externalPaymentId" | "paidAt" | "currency"
>;

export class Order extends Model<OrderAttrs, OrderCreate> implements OrderAttrs {
  declare id: string;
  declare status: OrderStatusDb;
  declare subtotalCents: number;
  declare currency: string;
  declare cartVersionAtCheckout: number | null;
  declare sourceCartId: string | null;
  declare externalPaymentId: string | null;
  declare paidAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: "pending_payment",
    },
    subtotalCents: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "usd" },
    cartVersionAtCheckout: { type: DataTypes.INTEGER, allowNull: true },
    sourceCartId: { type: DataTypes.UUID, allowNull: true },
    externalPaymentId: { type: DataTypes.STRING(255), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: "Order", tableName: "orders" },
);
