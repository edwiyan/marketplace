import { describe, expect, it } from "vitest";
import {
  cleanSearch,
  formatPrice,
  parseBound,
  parsePrice,
  parseSort,
  timeAgo,
  validateListing,
  validateMessage,
} from "./listing";

const PREFIX = "https://x.supabase.co/storage/v1/object/public/listing-images/";
const good = {
  title: "  Mountain   bike ",
  description: "Barely used",
  price: "1,250.50",
  category: "Sporting Goods",
  seller_email: "Seller@Example.com",
  image_url: PREFIX + "a.jpg",
  location: "",
};

describe("validateListing", () => {
  it("accepts and normalises a good listing", () => {
    const r = validateListing(good, PREFIX);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.title).toBe("Mountain bike");
      expect(r.value.price).toBe(1250.5);
      expect(r.value.seller_email).toBe("seller@example.com");
      expect(r.value.location).toBeNull();
    }
  });

  it("reports each bad field", () => {
    const r = validateListing({ title: "x", price: "abc", category: "Cars", seller_email: "nope", image_url: "" }, PREFIX);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["category", "image_url", "price", "seller_email", "title"]);
  });

  it("rejects photos that weren't uploaded to our bucket", () => {
    const r = validateListing({ ...good, image_url: "https://evil.example/x.jpg" }, PREFIX);
    expect(r.ok).toBe(false);
  });

  it("allows free items", () => {
    expect(validateListing({ ...good, price: "0" }, PREFIX).ok).toBe(true);
  });
});

describe("validateMessage", () => {
  it("needs a real listing id, an email and a message", () => {
    expect(validateMessage({ listing_id: "1", buyer_email: "x", message: "" }).ok).toBe(false);
    expect(
      validateMessage({
        listing_id: "0b3c1f7e-2a4d-4c55-9f1e-1234567890ab",
        buyer_email: "buyer@example.com",
        message: "Is this still available?",
      }).ok,
    ).toBe(true);
  });
});

describe("parsePrice", () => {
  it("handles common formats", () => {
    expect(parsePrice("$300")).toBe(300);
    expect(parsePrice("99.5")).toBe(99.5);
    expect(parsePrice("1.234")).toBeNaN();
    expect(parsePrice("-5")).toBeNaN();
  });
});

describe("cleanSearch", () => {
  it("removes characters that could change the filter", () => {
    expect(cleanSearch("bike,title.eq.x)")).toBe("bike title.eq.x");
    expect(cleanSearch("50% off*")).toBe("50 off");
    expect(cleanSearch("  road   bike ")).toBe("road bike");
  });
});

describe("URL params", () => {
  it("falls back to safe defaults", () => {
    expect(parseSort("price-asc")).toBe("price-asc");
    expect(parseSort("drop table")).toBe("newest");
    expect(parseBound("100")).toBe(100);
    expect(parseBound("abc")).toBeNull();
    expect(parseBound(undefined)).toBeNull();
  });
});

describe("formatPrice", () => {
  it("formats money and free items", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(1250)).toBe("$1,250");
    expect(formatPrice(99.5)).toBe("$99.50");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-17T12:00:00Z");
  it("formats relative times", () => {
    expect(timeAgo("2026-11-17T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-11-17T11:00:00Z", now)).toBe("1 hour ago");
    expect(timeAgo("2026-11-14T12:00:00Z", now)).toBe("3 days ago");
    expect(timeAgo("2026-11-03T12:00:00Z", now)).toBe("2 weeks ago");
    expect(timeAgo("2026-08-01T12:00:00Z", now)).toBe("Aug 1, 2026");
  });
});
