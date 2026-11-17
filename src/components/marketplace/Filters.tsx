"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SORTS, parseSort } from "@/lib/listing";

/** Sort order and price range, stored in the URL so results can be shared. */
export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const sort = parseSort(params.get("sort"));

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hasFilters = params.has("min") || params.has("max") || params.has("sort");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="sort" className="mb-1.5 block text-[13px] font-semibold text-muted">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ min: min.trim(), max: max.trim() });
        }}
      >
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-muted">Price</legend>
          <div className="flex items-center gap-2">
            <input
              aria-label="Minimum price"
              inputMode="decimal"
              value={min}
              onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Min"
              className="h-10 w-full min-w-0 rounded-lg border border-line px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span className="text-muted">to</span>
            <input
              aria-label="Maximum price"
              inputMode="decimal"
              value={max}
              onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Max"
              className="h-10 w-full min-w-0 rounded-lg border border-line px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-9 w-full rounded-lg bg-field text-[14px] font-semibold text-ink hover:bg-[#e2e5e9]"
          >
            Apply price
          </button>
        </fieldset>
      </form>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setMin("");
            setMax("");
            update({ min: "", max: "", sort: "" });
          }}
          className="text-[14px] font-semibold text-brand hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
