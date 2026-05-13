import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export interface OrderLineAttrs {
  id: string;
  orderId: string;
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderLineCreate = Optional<OrderLineAttrs, "id" | "imageUrl">;

export class OrderLine extends Model<OrderLineAttrs, OrderLineCreate> implements OrderLineAttrs {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare slug: string;
  declare name: string;
  declare quantity: number;
  declare unitPriceCents: number;
  declare lineTotalCents: number;
  declare imageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OrderLine.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(500), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPriceCents: { type: DataTypes.INTEGER, allowNull: false },
    lineTotalCents: { type: DataTypes.INTEGER, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: "OrderLine", tableName: "order_lines" },
);
