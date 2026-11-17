import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrowsePage from "@/components/marketplace/BrowsePage";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = categoryBySlug(slug);
  return { title: category ? `${category.name} · Marketplace` : "Marketplace" };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  if (!categoryBySlug(slug)) notFound();
  return <BrowsePage slug={slug} searchParams={props.searchParams} />;
}
