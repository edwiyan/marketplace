import {
  Armchair,
  Baby,
  Bike,
  Briefcase,
  Car,
  Clapperboard,
  Dog,
  Gift,
  Guitar,
  Hammer,
  House,
  KeyRound,
  Laptop,
  Newspaper,
  Puzzle,
  Shirt,
  Sprout,
  Volleyball,
  type LucideIcon,
} from "lucide-react";

export type Category = { name: string; slug: string; icon: LucideIcon };

/** Same list (and order) as the challenge's example app. Must match the DB check constraint. */
export const CATEGORIES: Category[] = [
  { name: "Vehicles", slug: "vehicles", icon: Car },
  { name: "Property Rentals", slug: "property-rentals", icon: KeyRound },
  { name: "Apparel", slug: "apparel", icon: Shirt },
  { name: "Classifieds", slug: "classifieds", icon: Newspaper },
  { name: "Electronics", slug: "electronics", icon: Laptop },
  { name: "Entertainment", slug: "entertainment", icon: Clapperboard },
  { name: "Family", slug: "family", icon: Baby },
  { name: "Free Stuff", slug: "free-stuff", icon: Gift },
  { name: "Garden & Outdoor", slug: "garden-outdoor", icon: Sprout },
  { name: "Hobbies", slug: "hobbies", icon: Bike },
  { name: "Home Goods", slug: "home-goods", icon: Armchair },
  { name: "Home Improvement", slug: "home-improvement", icon: Hammer },
  { name: "Home Sales", slug: "home-sales", icon: House },
  { name: "Musical Instruments", slug: "musical-instruments", icon: Guitar },
  { name: "Office Supplies", slug: "office-supplies", icon: Briefcase },
  { name: "Pet Supplies", slug: "pet-supplies", icon: Dog },
  { name: "Sporting Goods", slug: "sporting-goods", icon: Volleyball },
  { name: "Toys & Games", slug: "toys-games", icon: Puzzle },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryByName(name: string): Category | undefined {
  return CATEGORIES.find((c) => c.name === name);
}
