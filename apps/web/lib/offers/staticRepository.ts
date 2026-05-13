import type { OfferCarouselDto } from "@rimss/shared-types";

import type { IOffersContentRepository } from "./types";
import data from "../../content/offers.json";

export class StaticOffersRepository implements IOffersContentRepository {
  async getOfferCarousel(): Promise<OfferCarouselDto> {
    return data as OfferCarouselDto;
  }
}
