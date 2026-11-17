import type { Metadata } from "next";
import { Suspense } from "react";
import CreateListingForm from "@/components/marketplace/CreateListingForm";

export const metadata: Metadata = { title: "Item for sale · Marketplace" };

export default function CreateItemPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-3.5rem)] animate-pulse bg-field" />}>
      <CreateListingForm />
    </Suspense>
  );
}
