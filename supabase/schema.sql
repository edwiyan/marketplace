-- Marketplace: run this once in Supabase → SQL Editor → New query → Run.
-- Safe to run again: every step checks whether it already exists.
--
-- Based on the challenge's Supabase-Schema.sql (same tables, columns and bucket), with
-- these changes:
--   • Visitors can only READ listings. Creating listings, uploading photos and sending
--     messages go through the app's API routes, which validate input, rate-limit, and
--     write with the server-only secret key.
--   • Messages are private: the original "Anyone can view messages" policy would have
--     exposed every buyer's email and message, so there is no visitor access at all.
--   • messages.seller_email is always copied from the listing (trigger), so a message
--     (and its email notification) can only ever go to that listing's seller.
--   • Check constraints on lengths, price, email format and category.
--   • The "update their own listings" policy is dropped: there is no login, so it could
--     never match anyone.

-- 1. Listings
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  title         varchar(255) not null,
  description   text,
  price         decimal(10,2) not null,
  category      varchar(100) not null,
  seller_email  varchar(255) not null,
  image_url     text,
  location      varchar(255) default 'Palo Alto, CA',
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now()
);

alter table public.listings drop constraint if exists listings_title_check;
alter table public.listings add constraint listings_title_check
  check (char_length(btrim(title)) between 3 and 100);

alter table public.listings drop constraint if exists listings_description_check;
alter table public.listings add constraint listings_description_check
  check (description is null or char_length(description) <= 2000);

alter table public.listings drop constraint if exists listings_price_check;
alter table public.listings add constraint listings_price_check
  check (price >= 0);

alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check
  check (category in (
    'Vehicles', 'Property Rentals', 'Apparel', 'Classifieds', 'Electronics',
    'Entertainment', 'Family', 'Free Stuff', 'Garden & Outdoor', 'Hobbies',
    'Home Goods', 'Home Improvement', 'Home Sales', 'Musical Instruments',
    'Office Supplies', 'Pet Supplies', 'Sporting Goods', 'Toys & Games'
  ));

alter table public.listings drop constraint if exists listings_seller_email_check;
alter table public.listings add constraint listings_seller_email_check
  check (seller_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(seller_email) <= 254);

alter table public.listings drop constraint if exists listings_location_check;
alter table public.listings add constraint listings_location_check
  check (location is null or char_length(location) <= 100);

-- 2. Messages
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id) on delete cascade,
  buyer_email   varchar(255) not null,
  seller_email  varchar(255) not null,
  message       text not null,
  created_at    timestamp with time zone default now()
);

alter table public.messages alter column listing_id set not null;

alter table public.messages drop constraint if exists messages_message_check;
alter table public.messages add constraint messages_message_check
  check (char_length(btrim(message)) between 1 and 1000);

alter table public.messages drop constraint if exists messages_buyer_email_check;
alter table public.messages add constraint messages_buyer_email_check
  check (buyer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(buyer_email) <= 254);

-- A message always goes to the listing's real seller, whatever the client sent.
create or replace function public.set_message_seller_email()
returns trigger as $$
begin
  select l.seller_email into new.seller_email from public.listings l where l.id = new.listing_id;
  if new.seller_email is null then
    raise exception 'Listing % does not exist', new.listing_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_message_seller_email on public.messages;
create trigger set_message_seller_email before insert on public.messages
  for each row execute function public.set_message_seller_email();

-- 3. Indexes
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_created_at on public.listings(created_at desc);
create index if not exists idx_messages_listing_id on public.messages(listing_id);

-- 4. updated_at trigger (from the original schema)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_listings_updated_at on public.listings;
create trigger update_listings_updated_at before update on public.listings
  for each row execute function public.update_updated_at_column();

-- 5. Row Level Security
alter table public.listings enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Anyone can view listings" on public.listings;
create policy "Anyone can view listings" on public.listings
  for select to anon, authenticated using (true);

-- Removed from the original: visitor inserts (the API does them) and the
-- "update their own listings" / "view messages" policies (see the note at the top).
drop policy if exists "Anyone can create listings" on public.listings;
drop policy if exists "Users can update their own listings" on public.listings;
drop policy if exists "Anyone can view messages" on public.messages;
drop policy if exists "Anyone can create messages" on public.messages;

-- Table permissions, spelled out so this works even if "Automatically expose new tables"
-- was off when the project was created.
grant usage on schema public to anon, authenticated, service_role;
revoke all on public.listings, public.messages from anon, authenticated;
grant select on public.listings to anon, authenticated;
grant all on public.listings, public.messages to service_role;

-- 6. Listing photos: public bucket, images only, 5 MB max. Only the server uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload listing images" on storage.objects;
drop policy if exists "Anyone can view listing images" on storage.objects;
-- No storage policies are needed: the bucket is public, so photo URLs work without a
-- select policy (and visitors can't list the files), and uploads use the secret key.
