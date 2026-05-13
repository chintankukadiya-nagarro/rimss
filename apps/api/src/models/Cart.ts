import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export interface CartAttrs {
  id: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CartCreate = Optional<CartAttrs, "id" | "version">;

export class Cart extends Model<CartAttrs, CartCreate> implements CartAttrs {
  declare id: string;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, modelName: "Cart", tableName: "carts" },
);
