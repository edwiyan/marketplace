# Marketplace

A Facebook-style mini marketplace. Anyone can list an item with a photo, browse listings by category, search, open a listing's own page, and message the seller. Messages are saved in Supabase and emailed to the seller, who can reply straight to the buyer.

**Stack:** Next.js 16 (App Router, Route Handlers) · React 19 · Tailwind CSS 4 · Supabase (Postgres, Storage) · Gmail SMTP via Nodemailer · Vercel

## What works

**The four "done" checks**
1. **Create a listing** with a photo, title, description, price, email and category; it's saved in Supabase (`/create` → `/create/item`).
2. **Home page** shows all listings in a responsive grid (2–5 columns), with **category tabs** to filter them (`/category/[slug]`).
3. **Each listing has its own page** with the photo and full details, including the seller's email (`/item/[id]`).
4. **Message Seller** saves the buyer's message in Supabase.

**Bonuses**
- **Keyword search** across title, description and location (updates as you type, works inside a category).
- **The seller gets a real email** when a message arrives, with Reply-To set to the buyer.

**Extras**
- Sort (newest, price low→high, high→low) and a price range filter, all kept in the URL so results can be shared
- Live preview while creating a listing; drag-and-drop photo; photos are resized in the browser before upload
- Listing types: item, vehicle, home for rent, or give away for free (pre-fills the category and price)
- Quick replies ("Is this still available?"), "More in this category", share/copy link, friendly 404 page
- Loading skeletons, field-level validation messages, and works on phones

## How it's built

| Path | What it does |
|---|---|
| `src/app/page.tsx`, `src/app/category/[slug]/page.tsx` | Browse pages, server-rendered from Supabase (`BrowsePage`) |
| `src/app/item/[id]/page.tsx` | Listing detail, server-rendered, with page metadata for link previews |
| `src/app/create/…` | Listing type picker and the create form |
| `src/app/api/listings` | `GET` search/filter, `POST` create |
| `src/app/api/listings/[id]` | `GET` one listing |
| `src/app/api/upload` | `POST` photo → Supabase Storage |
| `src/app/api/messages` | `POST` save message and email the seller (no `GET`: messages are private) |
| `src/lib/listing.ts` | Validation, search clean-up, price and time formatting (unit-tested in `listing.test.ts`) |
| `src/lib/server/` | Supabase clients, queries, rate limiting and the email sender (server-only) |
| `supabase/schema.sql` | Tables, constraints, triggers, RLS and the storage bucket |

### Database

Uses the challenge's schema (`listings`, `messages`, `listing-images` bucket) with these security changes. The reasons are also at the top of `supabase/schema.sql`.

- **Visitors can only read listings.** Creating listings, uploading photos and sending messages go through the API routes, which validate the input, rate-limit each visitor, and then write with the server-only secret key.
- **Messages are private.** The original "Anyone can view messages" policy would have exposed every buyer's email and message to anyone.
- **Messages can only reach the listing's real seller.** A trigger copies `seller_email` from the listing, so neither a message nor its email can be redirected to someone else.
- **Check constraints** on title length, price, email format, category and message length.
- **Listings can only use photos from this project's bucket.**

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com), or reuse one.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**. It's safe to run again.
3. Open **Project Settings → API Keys** and copy the **Project URL**, the **Publishable** key and the **Secret** key.

### 2. Gmail (optional, for the email bonus)

1. Turn on **2-Step Verification** for your Google account: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Create an **app password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Name it "Marketplace" and copy the 16-character password.
3. Set `GMAIL_USER` (your Gmail address) and `GMAIL_APP_PASSWORD`.

Without these, messages are still saved; they just aren't emailed.

### 3. Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                   # http://localhost:3000
```

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`), server only |
| `GMAIL_USER` | Your Gmail address (optional) |
| `GMAIL_APP_PASSWORD` | Gmail app password (optional) |

### 4. Deploy to Vercel

Import the GitHub repo in Vercel (**Add New → Project**), add the variables above under **Environment Variables**, and deploy. Share the production `*.vercel.app` URL.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm test        # unit tests (Vitest)
npm run lint    # ESLint
```
