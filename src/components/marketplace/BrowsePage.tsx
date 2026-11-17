import Link from "next/link";
import { Suspense } from "react";
import { SlidersHorizontal, SearchX, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { categoryBySlug } from "@/lib/categories";
import { cleanSearch, parseBound, parseSort } from "@/lib/listing";
import { getListings } from "@/lib/server/listings";
import CategoryTabs from "./CategoryTabs";
import Filters from "./Filters";
import ListingCard, { CardSkeleton, GRID } from "./ListingCard";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Shared by `/` and `/category/[slug]`: sidebar, category tabs and the results grid. */
export default function BrowsePage({ slug, searchParams }: { slug?: string; searchParams: SearchParams }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
        <Suspense fallback={<div className="h-9" />}>
          <CategoryTabs />
        </Suspense>

        <details className="group mt-3 rounded-lg border border-line bg-white lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[15px] font-semibold text-ink">
            <SlidersHorizontal className="size-4" /> Sort and price
          </summary>
          <div className="border-t border-line p-3">
            <Suspense fallback={null}>
              <Filters />
            </Suspense>
          </div>
        </details>

        <Suspense fallback={<ResultsSkeleton />}>
          <Results slug={slug} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Results({ slug, searchParams }: { slug?: string; searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = cleanSearch(one(sp.q));
  const category = slug ? categoryBySlug(slug) : undefined;
  const { listings, error } = await getListings({
    category: slug,
    q,
    sort: parseSort(one(sp.sort)),
    min: parseBound(one(sp.min)),
    max: parseBound(one(sp.max)),
  });

  const heading = q
    ? `Results for “${q}”${category ? ` in ${category.name}` : ""}`
    : category
      ? category.name
      : "Today's picks";

  return (
    <section aria-labelledby="results-heading" className="mt-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="results-heading" className="text-[20px] font-bold text-ink">
          {heading}
        </h2>
        {!error && (
          <p className="shrink-0 text-[14px] text-muted" aria-live="polite">
            {listings.length === 1 ? "1 listing" : `${listings.length} listings`}
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-[#f3c2c2] bg-[#fdeeee] p-4 text-[15px] text-[#8a1f1f]">
          Couldn&apos;t load listings: {error}
        </p>
      ) : listings.length === 0 ? (
        <EmptyState searching={Boolean(q)} category={category?.name} />
      ) : (
        <div className={GRID}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ searching, category }: { searching: boolean; category?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-field text-muted">
        <SearchX className="size-7" />
      </span>
      <p className="mt-3 text-[17px] font-semibold text-ink">
        {searching ? "No listings match your search" : `No listings${category ? ` in ${category}` : ""} yet`}
      </p>
      <p className="mt-1 text-[15px] text-muted">
        {searching ? "Try a different word or another category." : "Be the first to sell something here."}
      </p>
      <Link
        href="/create"
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[15px] font-semibold text-white hover:bg-brand-dark"
      >
        <Plus className="size-5" /> Create new listing
      </Link>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-5">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-field" />
      <div className={GRID}>
        {Array.from({ length: 10 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
