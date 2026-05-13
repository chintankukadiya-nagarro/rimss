import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/sequelize";

export interface StripeWebhookEventAttrs {
  stripeEventId: string;
  createdAt?: Date;
}

export type StripeWebhookEventCreate = Optional<StripeWebhookEventAttrs, never>;

export class StripeWebhookEvent extends Model<
  StripeWebhookEventAttrs,
  StripeWebhookEventCreate
> implements StripeWebhookEventAttrs {
  declare stripeEventId: string;
  declare readonly createdAt: Date;
}

StripeWebhookEvent.init(
  {
    stripeEventId: { type: DataTypes.STRING(255), primaryKey: true },
  },
  { sequelize, modelName: "StripeWebhookEvent", tableName: "stripe_webhook_events", updatedAt: false },
);
