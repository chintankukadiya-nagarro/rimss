"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";

const categories = ["", "outerwear", "dresses", "accessories", "knitwear", "footwear"];
const colours = [
  "",
  "natural",
  "navy",
  "midnight",
  "rose",
  "stone",
  "charcoal",
  "sand",
  "black",
  "white",
  "brown",
  "red",
];

export default function ProductFilters(): JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();

    const setIf = (k: string): void => {
      const v = fd.get(k);
      if (v !== null && String(v).trim() !== "") next.set(k, String(v).trim());
    };

    setIf("category");
    setIf("colour");
    setIf("sale");
    setIf("minPrice");
    setIf("maxPrice");
    setIf("q");

    next.set("limit", "12");
    next.set("offset", "0");

    router.push(`/products?${next.toString()}`);
  };

  const val = (k: string): string => sp.get(k) ?? "";

  return (
    <form
      className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-7"
      onSubmit={onSubmit}
    >
      <label className="flex flex-col text-xs md:col-span-2">
        <span className="mb-1 text-stone-500">Keywords</span>
        <input
          defaultValue={val("q")}
          name="q"
          placeholder="Name or slug..."
          type="text"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col text-xs">
        <span className="mb-1 text-stone-500">Category</span>
        <select
          defaultValue={val("category")}
          name="category"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c || "__all"} value={c}>
              {c === "" ? "All" : c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-xs">
        <span className="mb-1 text-stone-500">Colour</span>
        <select
          defaultValue={val("colour")}
          name="colour"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        >
          {colours.map((c) => (
            <option key={c || "__all"} value={c}>
              {c === "" ? "All" : c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-xs">
        <span className="mb-1 text-stone-500">Sale only</span>
        <select
          defaultValue={val("sale")}
          name="sale"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Either</option>
          <option value="true">On sale</option>
          <option value="false">Full price</option>
        </select>
      </label>

      <label className="flex flex-col text-xs">
        <span className="mb-1 text-stone-500">Min USD</span>
        <input
          defaultValue={val("minPrice")}
          inputMode="decimal"
          name="minPrice"
          placeholder="0"
          step="any"
          type="number"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col text-xs">
        <span className="mb-1 text-stone-500">Max USD</span>
        <input
          defaultValue={val("maxPrice")}
          inputMode="decimal"
          name="maxPrice"
          placeholder="500"
          step="any"
          type="number"
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex items-end md:col-span-1">
        <button
          type="submit"
          className="w-full rounded bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
