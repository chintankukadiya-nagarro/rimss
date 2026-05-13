/**
 * Demo: GET cart → PUT with stale version → expect HTTP 409.
 * Run API on port 4000 (or set API_URL). Usage:
 *   npx tsx src/scripts/cart409-demo.ts
 */
async function main(): Promise<void> {
  const base = process.env.API_URL ?? "http://127.0.0.1:4000";

  const search = await fetch(`${base}/api/products/search?limit=1`);
  if (!search.ok) {
    console.error("Search failed:", search.status);
    process.exitCode = 1;
    return;
  }
  const sJson = (await search.json()) as { items: { id: string }[] };
  const pid = sJson.items[0]?.id;
  if (!pid) {
    console.error("No products in DB — run db:seed");
    process.exitCode = 1;
    return;
  }

  let cookie = "";
  const applyCookies = (res: Response): void => {
    const h = res.headers;
    if (typeof h.getSetCookie === "function") {
      const list = h.getSetCookie();
      if (list?.length) {
        cookie = list.map((c) => c.split(";")[0]).join("; ");
        return;
      }
    }
    const raw = h.get("set-cookie");
    if (raw) {
      const m = /rimss_cart=([^;]+)/.exec(raw);
      if (m) {
        cookie = `rimss_cart=${m[1]}`;
      }
    }
  };

  const put = await fetch(`${base}/api/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ version: 0, lines: [{ productId: pid, quantity: 1 }] }),
  });
  applyCookies(put);
  if (!put.ok) {
    console.error("Initial PUT failed:", put.status, await put.text());
    process.exitCode = 1;
    return;
  }

  const get = await fetch(`${base}/api/cart`, {
    headers: { Cookie: cookie },
  });
  applyCookies(get);
  const cart = (await get.json()) as { version: number };
  const v = cart.version;
  console.log("Cart version after add:", v);

  const stale = await fetch(`${base}/api/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      version: v - 1,
      lines: [{ productId: pid, quantity: 2 }],
    }),
  });

  if (stale.status !== 409) {
    console.error("Expected 409, got", stale.status, await stale.text());
    process.exitCode = 1;
    return;
  }

  const conflict = (await stale.json()) as { error: string };
  console.log("409 body error field:", conflict.error);
  console.log("cart409-demo: OK");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
