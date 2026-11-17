"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/** Keyword search. Updates `?q=` as you type (debounced), keeping the current category and filters. */
export default function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();

  // Follow the URL when it changes from elsewhere (back button, category tab).
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setValue(urlQ);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function go(q: string) {
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    // Searching from a listing or the create page goes back to browsing.
    const base = pathname.startsWith("/category/") || pathname === "/" ? pathname : "/";
    const qs = next.toString();
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }

  function onChange(q: string) {
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(q), 350);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(value);
      }}
      className="relative"
    >
      <label htmlFor={inputId} className="sr-only">
        Search Marketplace
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted" />
      <input
        id={inputId}
        data-search={compact ? "header" : "sidebar"}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Marketplace"
        autoComplete="off"
        className="h-10 w-full rounded-full bg-field pr-9 pl-10 text-[15px] text-ink outline-none placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-brand/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-black/5"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
