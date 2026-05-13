import type { StoreThemeId } from "@rimss/shared-types";

const ALLOWED = new Set<StoreThemeId>(["stone", "ocean"]);

export function resolveStoreTheme(
  queryTheme: string | undefined,
  envTheme: string | undefined,
  contentDefault: StoreThemeId | undefined,
): StoreThemeId {
  const tryParse = (s: string | undefined): StoreThemeId | undefined => {
    if (!s) return undefined;
    const t = s.trim().toLowerCase();
    return ALLOWED.has(t as StoreThemeId) ? (t as StoreThemeId) : undefined;
  };

  return (
    tryParse(queryTheme) ??
    tryParse(envTheme) ??
    (contentDefault && ALLOWED.has(contentDefault) ? contentDefault : undefined) ??
    "stone"
  );
}
