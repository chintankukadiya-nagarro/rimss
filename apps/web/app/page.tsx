import Link from "next/link";

import { OfferZone } from "@/components/OfferZone";
import { StaticOffersRepository } from "@/lib/offers/staticRepository";
import { resolveStoreTheme } from "@/lib/theme";

async function fetchReady(): Promise<Record<string, unknown>> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/health/ready`, {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    ...(body as object),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const rawTheme = searchParams.theme;
  const qTheme = Array.isArray(rawTheme) ? rawTheme[0] : rawTheme;

  const offersRepo = new StaticOffersRepository();
  const carousel = await offersRepo.getOfferCarousel();
  const theme = resolveStoreTheme(
    qTheme,
    process.env.NEXT_PUBLIC_STORE_THEME,
    carousel.theme,
  );
  let ready: Record<string, unknown>;
  try {
    ready = await fetchReady();
  } catch {
    ready = {
      ok: false,
      error: "Unable to reach API — is Docker up and NEXT_PUBLIC_API_URL correct?",
    };
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          RIMSS storefront host
        </h1>
        <p className="text-sm text-stone-600">
          Next.js host with pluggable <strong>OfferZone</strong> (
          <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">content/offers.json</code>
          ), catalogue, cart, and checkout. Try{" "}
          <Link className="font-medium underline" href="/?theme=ocean">
            ?theme=ocean
          </Link>{" "}
          for alternate CSS tokens.
        </p>
      </div>

      <OfferZone carousel={carousel} theme={theme} />

      <section className="flex flex-wrap gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <Link
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          href="/products"
        >
          Open catalogue
        </Link>
        <Link
          className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
          href="/products?sale=true"
        >
          Quick filter: Sale only
        </Link>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-stone-800">
          GET /health/ready (SSR fetch)
        </h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-stone-900 p-4 text-xs text-emerald-200">
          {JSON.stringify(ready, null, 2)}
        </pre>
        <p className="mt-2 text-xs text-stone-500">
          Expect <strong>database: up</strong> and{" "}
          <strong>redis: up</strong> after compose + migrate + seed + API boot.
        </p>
      </section>

      <p className="text-xs text-stone-400">
        Correlation IDs: DevTools Network → inspect API response headers for{" "}
        <code className="text-stone-500">x-request-id</code>.
      </p>
    </main>
  );
}
