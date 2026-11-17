import Link from "next/link";
import { PackageX } from "lucide-react";

export default function ListingNotFound() {
  return (
    <main className="flex flex-col items-center px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-field text-muted">
        <PackageX className="size-8" />
      </span>
      <h1 className="mt-4 text-[22px] font-bold text-ink">This listing isn&apos;t available</h1>
      <p className="mt-1 text-[15px] text-muted">It may have been removed, or the link is wrong.</p>
      <Link href="/" className="mt-5 rounded-lg bg-brand px-4 py-2 text-[15px] font-semibold text-white hover:bg-brand-dark">
        Browse Marketplace
      </Link>
    </main>
  );
}
