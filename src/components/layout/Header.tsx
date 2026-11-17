import Link from "next/link";
import { Suspense } from "react";
import { Store } from "lucide-react";
import HeaderActions from "./HeaderActions";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Marketplace home">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white">
            <Store className="size-5" strokeWidth={2.25} />
          </span>
          <span className="hidden text-[20px] font-bold tracking-tight text-ink sm:inline">Marketplace</span>
        </Link>
        <Suspense fallback={null}>
          <HeaderActions />
        </Suspense>
      </div>
    </header>
  );
}
