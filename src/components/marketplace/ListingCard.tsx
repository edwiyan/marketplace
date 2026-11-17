import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatPrice, type Listing } from "@/lib/listing";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/item/${listing.id}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-field">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
          <img
            src={listing.image_url}
            alt={listing.title}
            loading="lazy"
            className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute inset-0 rounded-lg ring-1 ring-black/5 ring-inset" />
      </div>
      <div className="px-0.5 pt-2">
        <p className="text-[17px] leading-tight font-bold text-ink">{formatPrice(listing.price)}</p>
        <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-ink">{listing.title}</p>
        {listing.location && <p className="mt-0.5 truncate text-[13px] text-muted">{listing.location}</p>}
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="aspect-square rounded-lg bg-field" />
      <div className="mt-2 h-4 w-1/3 rounded bg-field" />
      <div className="mt-1.5 h-4 w-3/4 rounded bg-field" />
    </div>
  );
}

export const GRID = "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";
