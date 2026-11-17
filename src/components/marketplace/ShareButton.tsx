"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Uses the phone's share sheet when available, otherwise copies the link. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-field px-3 text-[15px] font-semibold text-ink hover:bg-[#e2e5e9]"
    >
      {copied ? <Check className="size-4 text-[#1e6b34]" /> : <Link2 className="size-4" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
