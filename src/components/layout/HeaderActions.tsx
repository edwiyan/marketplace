"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import SearchBox from "@/components/marketplace/SearchBox";

/** Search and "Sell" in the header. On browse pages at desktop width the sidebar has both, so they hide. */
export default function HeaderActions() {
  const pathname = usePathname();
  const browsing = pathname === "/" || pathname.startsWith("/category/");
  const hideOnDesktop = browsing ? "lg:hidden" : "";
  return (
    <>
      <div className={`mx-auto w-full max-w-[520px] ${hideOnDesktop}`}>
        <SearchBox compact />
      </div>
      {pathname !== "/create" && !pathname.startsWith("/create/") && (
        <Link
          href="/create"
          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-[15px] font-semibold text-brand hover:bg-[#dbe7f2] ${hideOnDesktop}`}
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">Sell</span>
        </Link>
      )}
    </>
  );
}
