"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

/** Horizontal, scrollable category tabs. Keeps the search and filters when switching. */
export default function CategoryTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const active = pathname.startsWith("/category/") ? pathname.split("/")[2] : "all";
  const strip = useRef<HTMLDivElement>(null);

  // Bring the active tab into view (useful on phones).
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const tabs = [{ name: "All", slug: "all", icon: LayoutGrid }, ...CATEGORIES];

  return (
    <nav aria-label="Categories" className="relative -mx-4 sm:mx-0">
      <div ref={strip} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:px-0">
        {tabs.map(({ name, slug, icon: Icon }) => {
          const href = (slug === "all" ? "/" : `/category/${slug}`) + (qs ? `?${qs}` : "");
          const current = active === slug;
          return (
            <Link
              key={slug}
              href={href}
              scroll={false}
              aria-current={current ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                current ? "bg-brand text-white shadow-sm" : "bg-field text-ink hover:bg-[#e2e5e9]"
              }`}
            >
              <Icon className="size-4" />
              {name}
            </Link>
          );
        })}
      </div>
      {/* Fade at the right edge hints that the tabs scroll. */}
      <div aria-hidden className="pointer-events-none absolute top-0 right-0 bottom-1 w-10 bg-gradient-to-l from-white to-transparent" />
    </nav>
  );
}
