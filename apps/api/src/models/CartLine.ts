import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export interface CartLineAttrs {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CartLineCreate = Optional<CartLineAttrs, "id">;

export class CartLine extends Model<CartLineAttrs, CartLineCreate> implements CartLineAttrs {
  declare id: string;
  declare cartId: string;
  declare productId: string;
  declare quantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CartLine.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: "CartLine",
    tableName: "cart_lines",
    indexes: [{ unique: true, fields: ["cartId", "productId"] }],
  },
);
