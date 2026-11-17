import Link from "next/link";
import { Suspense } from "react";
import { Plus, Store } from "lucide-react";
import Filters from "@/components/marketplace/Filters";
import SearchBox from "@/components/marketplace/SearchBox";

/** Desktop sidebar: search, create button and filters. Hidden below `lg` (the header has search there). */
export default function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[340px] shrink-0 overflow-y-auto border-r border-line bg-white p-4 lg:block">
      <h1 className="mb-3 text-[24px] font-bold text-ink">Marketplace</h1>
      <Suspense fallback={<div className="h-10 rounded-full bg-field" />}>
        <SearchBox />
      </Suspense>

      <nav className="mt-3 space-y-1">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] font-semibold text-ink hover:bg-field">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white">
            <Store className="size-5" />
          </span>
          Browse all
        </Link>
      </nav>

      <Link
        href="/create"
        className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-soft text-[15px] font-semibold text-brand hover:bg-[#dbe7f2]"
      >
        <Plus className="size-5" />
        Create new listing
      </Link>

      <hr className="my-4 border-line" />
      <h2 className="mb-3 text-[17px] font-semibold text-ink">Filters</h2>
      <Suspense fallback={null}>
        <Filters />
      </Suspense>
    </aside>
  );
}
