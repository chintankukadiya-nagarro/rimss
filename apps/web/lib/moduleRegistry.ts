/**
 * Lightweight “module registry” for pluggable homepage slots (OfferZone, etc.).
 * New bundles register here without rewiring the host layout.
 */

import type { OfferCarouselDto, StoreThemeId } from "@rimss/shared-types";
import type { ComponentType } from "react";

export type OfferZoneModuleProps = {
  carousel: OfferCarouselDto;
  theme: StoreThemeId;
};

export type OfferZoneLoader = () => Promise<{
  default: ComponentType<OfferZoneModuleProps>;
}>;

const offerZoneLoaders: Record<string, OfferZoneLoader> = {
  default: () =>
    import("@/components/OfferZone").then((m) => ({ default: m.OfferZone })),
};

export function getOfferZoneLoader(slot = "default"): OfferZoneLoader {
  return offerZoneLoaders[slot] ?? offerZoneLoaders.default;
}
