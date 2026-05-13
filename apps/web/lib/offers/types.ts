import type { OfferCarouselDto } from "@rimss/shared-types";

/** Pluggable offers content (Phase 4). Swap for HTTP/CMS implementation later. */
export interface IOffersContentRepository {
  getOfferCarousel(): Promise<OfferCarouselDto>;
}
