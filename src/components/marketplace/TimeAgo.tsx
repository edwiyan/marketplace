"use client";

import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/listing";

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};

/** "3 hours ago", computed in the browser so it's always relative to the viewer's clock. */
export default function TimeAgo({ iso }: { iso: string }) {
  const now = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  // The tooltip uses the viewer's time zone, so it's only added in the browser.
  const title = now === null ? undefined : new Date(iso).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  return (
    <time dateTime={iso} title={title}>
      {now === null ? "recently" : timeAgo(iso, now * 60_000)}
    </time>
  );
}
