"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ImagePlus, Loader2, Mail, MapPin, X } from "lucide-react";
import { imageFromTransfer, resizeImage } from "@/lib/client/image";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { IMAGE_TYPES, LIMITS, formatPrice, isEmail, parsePrice } from "@/lib/listing";

type Fields = {
  title: string;
  price: string;
  category: string;
  location: string;
  seller_email: string;
  description: string;
};

const EMAIL_KEY = "marketplace:seller-email";

export default function CreateListingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [fields, setFields] = useState<Fields>(() => ({
    title: "",
    price: params.get("price") ?? "",
    category: categoryBySlug(params.get("category") ?? "")?.name ?? "",
    location: "",
    seller_email: "",
    description: "",
  }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | "image_url", string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "saving">("idle");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser storage after mount
      if (saved) setFields((f) => (f.seller_email ? f : { ...f, seller_email: saved }));
    } catch {}
  }, []);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const set = (key: keyof Fields) => (value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function choosePhoto(file: File | null | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setErrors((e) => ({ ...e, image_url: "Use a JPG, PNG, WebP or GIF photo." }));
    if (file.size > 20 * 1024 * 1024) return setErrors((e) => ({ ...e, image_url: "That photo is too large." }));
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, image_url: undefined }));
  }

  function removePhoto() {
    setPhoto(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function validate() {
    const e: typeof errors = {};
    if (!photo) e.image_url = "Add a photo.";
    if (fields.title.trim().length < LIMITS.titleMin) e.title = "Give it a title (at least 3 characters).";
    const price = parsePrice(fields.price);
    if (Number.isNaN(price)) e.price = "Enter a price, e.g. 250 or 99.50.";
    if (!fields.category) e.category = "Choose a category.";
    if (!isEmail(fields.seller_email.trim())) e.seller_email = "Enter a valid email so buyers can reach you.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate() || !photo) return;
    try {
      setStep("uploading");
      const resized = await resizeImage(photo, { max: 1600 });
      const form = new FormData();
      form.set("file", new File([resized], "photo", { type: resized.type || photo.type }));
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upBody = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(upBody.error ?? "Photo upload failed.");

      setStep("saving");
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, image_url: upBody.url }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        throw new Error(body.error ?? "Couldn't save the listing.");
      }
      try {
        localStorage.setItem(EMAIL_KEY, fields.seller_email.trim());
      } catch {}
      router.push(`/item/${body.listing.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setStep("idle");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    choosePhoto(imageFromTransfer(e.dataTransfer));
  }

  const busy = step !== "idle";
  const price = parsePrice(fields.price);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row">
      {/* Form */}
      <form
        onSubmit={submit}
        noValidate
        className="w-full shrink-0 overflow-y-auto border-line bg-white lg:w-[380px] lg:border-r"
        aria-labelledby={`${id}-title`}
      >
        <div className="space-y-4 p-4">
          <div>
            <Link href="/create" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink">
              <ArrowLeft className="size-4" /> Listing type
            </Link>
            <h1 id={`${id}-title`} className="mt-1 text-[24px] font-bold text-ink">
              Item for sale
            </h1>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-muted">Photo</p>
            {preview ? (
              <div className="relative overflow-hidden rounded-lg border border-line bg-field">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={preview} alt="Selected photo" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={busy}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
                  dragging ? "border-brand bg-brand-soft" : errors.image_url ? "border-[#e0245e] bg-[#fff5f7]" : "border-line bg-field hover:bg-[#e8eaed]"
                }`}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-sm">
                  <ImagePlus className="size-5" />
                </span>
                <span className="mt-2 text-[15px] font-semibold text-ink">Add photo</span>
                <span className="text-[13px] text-muted">or drag and drop · JPG, PNG, WebP</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="sr-only"
                  onChange={(e) => choosePhoto(e.target.files?.[0])}
                />
              </label>
            )}
            <FieldError msg={errors.image_url} />
          </div>

          <Field label="Title" error={errors.title} htmlFor={`${id}-t`}>
            <input
              id={`${id}-t`}
              value={fields.title}
              onChange={(e) => set("title")(e.target.value)}
              maxLength={LIMITS.title}
              placeholder="What are you selling?"
              className={input(errors.title)}
            />
          </Field>

          <Field label="Price (USD)" error={errors.price} htmlFor={`${id}-p`}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] text-muted">$</span>
              <input
                id={`${id}-p`}
                inputMode="decimal"
                value={fields.price}
                onChange={(e) => set("price")(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0 for free"
                className={`${input(errors.price)} pl-7`}
              />
            </div>
          </Field>

          <Field label="Category" error={errors.category} htmlFor={`${id}-c`}>
            <select id={`${id}-c`} value={fields.category} onChange={(e) => set("category")(e.target.value)} className={input(errors.category)}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description" optional error={errors.description} htmlFor={`${id}-d`}>
            <textarea
              id={`${id}-d`}
              value={fields.description}
              onChange={(e) => set("description")(e.target.value)}
              maxLength={LIMITS.description}
              rows={4}
              placeholder="Condition, size, what's included, pickup details…"
              className={`${input(errors.description)} h-auto resize-y py-2`}
            />
            <p className="mt-1 text-right text-[12px] text-muted tabular-nums">
              {fields.description.length}/{LIMITS.description}
            </p>
          </Field>

          <Field label="Location" optional error={errors.location} htmlFor={`${id}-l`}>
            <input
              id={`${id}-l`}
              value={fields.location}
              onChange={(e) => set("location")(e.target.value)}
              maxLength={LIMITS.location}
              placeholder="e.g. Malolos, Bulacan"
              className={input(errors.location)}
            />
          </Field>

          <Field label="Contact email" error={errors.seller_email} htmlFor={`${id}-e`}>
            <input
              id={`${id}-e`}
              type="email"
              autoComplete="email"
              value={fields.seller_email}
              onChange={(e) => set("seller_email")(e.target.value)}
              placeholder="you@example.com"
              className={input(errors.seller_email)}
            />
            <p className="mt-1 text-[12px] text-muted">Shown on your listing. Buyer messages are emailed here.</p>
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-[#fdeeee] px-3 py-2 text-[14px] text-[#8a1f1f]">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button
            type="submit"
            disabled={busy}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {step === "uploading" ? "Uploading photo…" : step === "saving" ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </form>

      {/* Live preview */}
      <section aria-label="Preview" className="flex-1 overflow-y-auto bg-field p-4 lg:p-8">
        <div className="mx-auto max-w-[900px] rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <p className="border-b border-line px-4 py-3 text-[15px] font-semibold text-ink">Preview</p>
          <div className="flex flex-col md:flex-row">
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#18191a] md:aspect-auto md:min-h-[420px] md:flex-1 md:rounded-bl-xl">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview
                <img src={preview} alt="" className="max-h-[420px] w-auto max-w-full object-contain" />
              ) : (
                <div className="px-6 text-center text-[#b0b3b8]">
                  <p className="text-[17px] font-semibold">Your listing preview</p>
                  <p className="mt-1 text-[14px]">As you create your listing, you can preview how it will appear to others.</p>
                </div>
              )}
            </div>
            <div className="w-full p-4 md:w-[300px]">
              <p className="text-[22px] leading-tight font-bold break-words text-ink">{fields.title.trim() || "Title"}</p>
              <p className="mt-1 text-[17px] font-semibold text-ink">{Number.isNaN(price) ? "Price" : formatPrice(price)}</p>
              <p className="mt-1 text-[13px] text-muted">Listed just now{fields.location.trim() ? ` in ${fields.location.trim()}` : ""}</p>
              {fields.category && (
                <p className="mt-2 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-[13px] font-semibold text-brand">{fields.category}</p>
              )}
              <p className="mt-3 text-[15px] font-semibold text-ink">Details</p>
              <p className="mt-1 line-clamp-6 text-[14px] break-words whitespace-pre-wrap text-muted">
                {fields.description.trim() || "Description will appear here."}
              </p>
              <hr className="my-3 border-line" />
              <p className="text-[15px] font-semibold text-ink">Seller information</p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-[14px] text-muted">
                <Mail className="size-4 shrink-0" /> {fields.seller_email.trim() || "seller@email.com"}
              </p>
              {fields.location.trim() && (
                <p className="mt-1 flex items-center gap-1.5 truncate text-[14px] text-muted">
                  <MapPin className="size-4 shrink-0" /> {fields.location.trim()}
                </p>
              )}
              <button type="button" disabled className="mt-4 h-9 w-full rounded-lg bg-brand/60 text-[15px] font-semibold text-white">
                Message
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const input = (err?: string) =>
  `h-10 w-full rounded-lg border px-3 text-[15px] text-ink outline-none focus:ring-2 ${
    err ? "border-[#e0245e] focus:ring-[#e0245e]/20" : "border-line focus:border-brand focus:ring-brand/20"
  }`;

function Field({
  label,
  optional,
  error,
  htmlFor,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-muted">
        {label} {optional && <span className="font-normal">(optional)</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-[13px] text-[#c4123f]">{msg}</p> : null;
}
