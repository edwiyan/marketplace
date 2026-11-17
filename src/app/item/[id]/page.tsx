import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Mail, MapPin, Tag } from "lucide-react";
import ListingCard, { GRID } from "@/components/marketplace/ListingCard";
import MessageSeller from "@/components/marketplace/MessageSeller";
import ShareButton from "@/components/marketplace/ShareButton";
import TimeAgo from "@/components/marketplace/TimeAgo";
import { categoryByName } from "@/lib/categories";
import { formatPrice } from "@/lib/listing";
import { getListing, getRelated } from "@/lib/server/listings";
import { DetailSkeleton } from "./skeleton";

export async function generateMetadata(props: PageProps<"/item/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found · Marketplace" };
  return {
    title: `${listing.title} · ${formatPrice(listing.price)} · Marketplace`,
    description: listing.description?.slice(0, 160) ?? `${listing.title} in ${listing.category}`,
    openGraph: listing.image_url ? { images: [listing.image_url] } : undefined,
  };
}

export default function ItemPage(props: PageProps<"/item/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ItemDetail params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ItemDetail({ params, searchParams }: Pick<PageProps<"/item/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const { created } = await searchParams;
  const listing = await getListing(id);
  if (!listing) notFound();
  const related = await getRelated(listing);
  const category = categoryByName(listing.category);

  return (
    <main>
      {created && (
        <p role="status" className="bg-[#e6f4ea] px-4 py-2.5 text-center text-[15px] font-semibold text-[#1e6b34]">
          Your listing is live! Share the link so buyers can find it.
        </p>
      )}

      <div className="flex flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row">
        {/* Photo */}
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-[#18191a] lg:min-h-0 lg:flex-1">
          {listing.image_url && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- blurred backdrop of the same photo */}
              <img src={listing.image_url} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
              <img
                src={listing.image_url}
                alt={listing.title}
                className="relative max-h-[70vh] w-auto max-w-full object-contain lg:max-h-full"
              />
            </>
          )}
          <Link
            href={category ? `/category/${category.slug}` : "/"}
            className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60"
            aria-label="Back to listings"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        {/* Details */}
        <aside className="w-full shrink-0 overflow-y-auto border-line bg-white lg:w-[400px] lg:border-l">
          <div className="p-4">
            <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
              <Link href="/" className="hover:underline">
                Marketplace
              </Link>
              {category && (
                <>
                  {" › "}
                  <Link href={`/category/${category.slug}`} className="hover:underline">
                    {category.name}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="mt-1 text-[24px] leading-tight font-bold break-words text-ink">{listing.title}</h1>
            <p className="mt-1 text-[20px] font-semibold text-ink">{formatPrice(listing.price)}</p>
            <p className="mt-1 text-[14px] text-muted">
              Listed <TimeAgo iso={listing.created_at} />
              {listing.location ? ` in ${listing.location}` : ""}
            </p>

            <div className="mt-3 flex gap-2">
              <a
                href="#message"
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark"
              >
                <Mail className="size-4" /> Message
              </a>
              <ShareButton title={listing.title} />
            </div>

            <hr className="my-4 border-line" />

            <h2 className="text-[17px] font-semibold text-ink">Details</h2>
            <dl className="mt-2 space-y-2 text-[15px]">
              <div className="flex items-center gap-2">
                <dt className="flex items-center gap-1.5 text-muted">
                  <Tag className="size-4" /> Category
                </dt>
                <dd>
                  {category ? (
                    <Link href={`/category/${category.slug}`} className="font-semibold text-brand hover:underline">
                      {category.name}
                    </Link>
                  ) : (
                    listing.category
                  )}
                </dd>
              </div>
              {listing.location && (
                <div className="flex items-center gap-2">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <MapPin className="size-4" /> Location
                  </dt>
                  <dd>{listing.location}</dd>
                </div>
              )}
            </dl>
            {listing.description ? (
              <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink">{listing.description}</p>
            ) : (
              <p className="mt-3 text-[15px] text-muted">No description provided.</p>
            )}

            <hr className="my-4 border-line" />

            <h2 className="text-[17px] font-semibold text-ink">Seller information</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-[16px] font-bold text-brand uppercase">
                {listing.seller_email[0]}
              </span>
              <a href={`mailto:${listing.seller_email}`} className="min-w-0 truncate text-[15px] font-semibold text-brand hover:underline">
                {listing.seller_email}
              </a>
            </div>

            <div id="message" className="mt-4 scroll-mt-20">
              <MessageSeller listingId={listing.id} title={listing.title} />
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="border-t border-line px-4 py-6 sm:px-6">
          <h2 id="related" className="mb-4 text-[20px] font-bold text-ink">
            More in {listing.category}
          </h2>
          <div className={GRID}>
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
