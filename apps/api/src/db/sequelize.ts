import { Sequelize } from "sequelize";
import { DATABASE_URL } from "../config";

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.DEBUG_SQL === "1" ? console.log : false,
});
