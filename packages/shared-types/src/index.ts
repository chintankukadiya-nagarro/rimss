/** Shared API contracts (expand in Phase 1 search DTO). */
export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ReadyResponse extends HealthResponse {
  database: "up" | "down";
  redis: "up" | "skipped" | "down";
}

/** Phase 2 — cart */
export interface CartLineItemDto {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
}

export interface CartResponse {
  lines: CartLineItemDto[];
  /** Distinct SKU rows */
  lineCount: number;
  /** Sum of quantities */
  itemCount: number;
  subtotalCents: number;
  version: number;
}

export interface CartPutBody {
  version: number;
  lines: { productId: string; quantity: number }[];
}

export type CartPatchOp = "add" | "set" | "remove";

export interface CartPatchBody {
  version: number;
  op: CartPatchOp;
  productId: string;
  quantity?: number;
}

export interface CartConflictResponse {
  error: "conflict";
  serverVersion: number;
  cart: CartResponse;
}

/** Phase 3 — checkout / orders */
export type OrderStatus = "pending_payment" | "paid" | "failed" | "cancelled";

export interface OrderLineSnapDto {
  id: string;
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
}

export interface OrderSummaryDto {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  currency: string;
  cartVersionAtCheckout: number | null;
  /** Present for server-side cart clearing (webhooks); demo use only */
  sourceCartId: string | null;
  paidAt: string | null;
  lines: OrderLineSnapDto[];
  createdAt: string;
}

export type PaymentProvider = "stripe" | "mock";

export interface CheckoutSessionResponse {
  orderId: string;
  clientSecret: string;
  publishableKey: string | null;
  paymentProvider: PaymentProvider;
}

/** Phase 4 — offers carousel (static JSON / CMS-ready) */
export type StoreThemeId = "stone" | "ocean";

export interface OfferSlideDto {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  ctaLabel: string;
  imageUrl?: string | null;
}

export interface OfferCarouselDto {
  id: string;
  /** Optional heading above the carousel */
  heading?: string;
  slides: OfferSlideDto[];
  /** Hint for default CSS theme; can be overridden by URL or env */
  theme?: StoreThemeId;
}
