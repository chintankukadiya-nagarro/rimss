import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export interface ProductAttrs {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  colour: string | null;
  priceCents: number;
  onSale: boolean;
  imageUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductCreate = Optional<
  ProductAttrs,
  "id" | "category" | "colour" | "imageUrl"
>;

export class Product extends Model<ProductAttrs, ProductCreate> {}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(500), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    colour: { type: DataTypes.STRING(80), allowNull: true },
    priceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    onSale: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: "Product", tableName: "products" },
);
