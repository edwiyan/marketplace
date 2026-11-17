import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center px-6 py-20 text-center">
      <h1 className="text-[22px] font-bold text-ink">Page not found</h1>
      <p className="mt-1 text-[15px] text-muted">The link may be broken, or the page may have moved.</p>
      <Link href="/" className="mt-5 rounded-lg bg-brand px-4 py-2 text-[15px] font-semibold text-white hover:bg-brand-dark">
        Browse Marketplace
      </Link>
    </main>
  );
}
