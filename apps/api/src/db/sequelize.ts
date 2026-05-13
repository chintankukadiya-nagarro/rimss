import { Sequelize } from "sequelize";
import { DATABASE_URL } from "../config";
console.log("DATABASE_URL", DATABASE_URL);
export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.DEBUG_SQL === "1" ? console.log : false,
});
