import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { formatPrice, type Listing } from "@/lib/listing";

let transport: Transporter | null | undefined;

/**
 * Gmail by default (GMAIL_USER + GMAIL_APP_PASSWORD). SMTP_HOST/SMTP_PORT can point at
 * another server instead, e.g. a local test inbox. Returns null when email isn't set up.
 */
function getTransport(): Transporter | null {
  if (transport !== undefined) return transport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const host = process.env.SMTP_HOST;
  if (host) {
    transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: user && pass ? { user, pass } : undefined,
    });
  } else if (user && pass) {
    transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  } else {
    transport = null;
  }
  return transport;
}

export const emailConfigured = () => getTransport() !== null;

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Emails the seller about a new message. Reply-To is the buyer, so the seller can just hit Reply. */
export async function notifySeller(listing: Listing, buyerEmail: string, message: string, origin: string): Promise<boolean> {
  const t = getTransport();
  if (!t) return false;
  const link = `${origin}/item/${listing.id}`;
  const from = process.env.GMAIL_USER ?? "marketplace@localhost";
  const subject = `New message about "${listing.title}"`;
  const text = [
    `You have a new message about your listing "${listing.title}" (${formatPrice(listing.price)}).`,
    "",
    `From: ${buyerEmail}`,
    "",
    message,
    "",
    `Reply to this email to answer ${buyerEmail} directly.`,
    `View the listing: ${link}`,
  ].join("\n");
  const html = `
  <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;color:#1c1e21">
    <p style="font-size:13px;color:#65676b;margin:0 0 4px">Marketplace</p>
    <h2 style="margin:0 0 12px;font-size:18px">New message about <a href="${escape(link)}" style="color:#1877f2;text-decoration:none">${escape(listing.title)}</a></h2>
    <p style="margin:0 0 6px;font-size:14px"><strong>${escape(buyerEmail)}</strong> wrote:</p>
    <blockquote style="margin:0 0 16px;padding:12px 14px;background:#f0f2f5;border-radius:8px;font-size:15px;white-space:pre-wrap">${escape(message)}</blockquote>
    <p style="font-size:14px;margin:0 0 16px">Just reply to this email to answer them.</p>
    <a href="${escape(link)}" style="display:inline-block;background:#1877f2;color:#fff;padding:9px 16px;border-radius:6px;font-weight:600;text-decoration:none;font-size:14px">View listing</a>
    <p style="font-size:12px;color:#65676b;margin-top:20px">${escape(listing.title)} · ${escape(formatPrice(listing.price))} · ${escape(listing.category)}</p>
  </div>`;
  try {
    await t.sendMail({
      from: { name: "Marketplace", address: from },
      to: listing.seller_email,
      replyTo: buyerEmail,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email to seller failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
