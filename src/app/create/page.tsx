import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Car, Gift, House, Tag } from "lucide-react";

export const metadata: Metadata = { title: "Create new listing · Marketplace" };

const TYPES = [
  { href: "/create/item", icon: Tag, title: "Item for sale", text: "Create a single listing for one or more items to sell." },
  { href: "/create/item?category=vehicles", icon: Car, title: "Vehicle for sale", text: "Sell a car, motorcycle, bike or other vehicle." },
  { href: "/create/item?category=property-rentals", icon: House, title: "Home for rent", text: "List a room, apartment or house for rent." },
  { href: "/create/item?category=free-stuff&price=0", icon: Gift, title: "Give away for free", text: "Pass on something you no longer need." },
];

export default function ChooseListingType() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Marketplace
      </Link>
      <h1 className="mt-3 text-[26px] font-bold text-ink">Choose listing type</h1>
      <p className="mt-1 text-[15px] text-muted">No account needed: buyers reach you at the email you add.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {TYPES.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full flex-col items-center rounded-xl border border-line bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="size-7" />
              </span>
              <span className="mt-3 text-[17px] font-semibold text-ink">{title}</span>
              <span className="mt-1 text-[14px] text-muted">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
