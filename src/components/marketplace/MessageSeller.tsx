"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { LIMITS, isEmail } from "@/lib/listing";

const EMAIL_KEY = "marketplace:buyer-email";
const QUICK = ["Is this still available?", "Is the price negotiable?", "When can I pick it up?"];

type Sent = { emailed: boolean; to: string };

export default function MessageSeller({ listingId, title }: { listingId: string; title: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Hi, is this still available?");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const emailId = useId();
  const messageId = useId();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser storage after mount
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!isEmail(email.trim())) local.buyer_email = "Enter your email so the seller can reply.";
    if (!message.trim()) local.message = "Write a message.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, buyer_email: email.trim(), message: message.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.fields ?? {});
        setError(body.error ?? "Couldn't send your message. Try again.");
        return;
      }
      try {
        localStorage.setItem(EMAIL_KEY, email.trim());
      } catch {}
      setSent({ emailed: Boolean(body.emailed), to: email.trim() });
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl border border-[#b7e1c1] bg-[#effaf2] p-4">
        <p className="flex items-center gap-2 text-[16px] font-semibold text-[#1e6b34]">
          <CheckCircle2 className="size-5" /> Message sent
        </p>
        <p className="mt-1 text-[14px] text-ink">
          {sent.emailed
            ? "The seller has been emailed and can reply straight to "
            : "Your message is saved for the seller, who can reply to "}
          <strong>{sent.to}</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            setMessage("");
          }}
          className="mt-2 text-[14px] font-semibold text-brand hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
        <Send className="size-4 text-brand" /> Message Seller
      </h2>
      <p className="mt-0.5 truncate text-[13px] text-muted">About “{title}”</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setMessage(q)}
            className={`rounded-full border px-2.5 py-1 text-[13px] ${
              message === q ? "border-brand bg-brand-soft text-brand" : "border-line text-ink hover:bg-field"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      <label htmlFor={messageId} className="mt-3 block text-[13px] font-semibold text-muted">
        Message
      </label>
      <textarea
        id={messageId}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={LIMITS.message}
        rows={3}
        aria-invalid={Boolean(errors.message)}
        className="mt-1 w-full resize-y rounded-lg border border-line px-3 py-2 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-[#e0245e]"
      />
      {errors.message && <p className="mt-1 text-[13px] text-[#c4123f]">{errors.message}</p>}

      <label htmlFor={emailId} className="mt-3 block text-[13px] font-semibold text-muted">
        Your email
      </label>
      <input
        id={emailId}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="you@example.com"
        aria-invalid={Boolean(errors.buyer_email)}
        className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-[#e0245e]"
      />
      {errors.buyer_email && <p className="mt-1 text-[13px] text-[#c4123f]">{errors.buyer_email}</p>}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-[#fdeeee] px-3 py-2 text-[14px] text-[#8a1f1f]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send"}
      </button>
      <p className="mt-2 text-[12px] text-muted">The seller will reply to the email you enter.</p>
    </form>
  );
}
