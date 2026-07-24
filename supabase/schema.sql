-- Canine Companion — initial database schema
-- Project: https://jebgptovxxtehniybjka.supabase.co
--
-- HOW TO APPLY: open the Supabase dashboard → SQL Editor → New query,
-- paste this whole file, and click "Run". Safe to re-run (idempotent).
--
-- Scope: newsletter subscribers + breeds only. Quiz answers and match
-- results are intentionally NOT stored here — they stay in the browser.

-- Case-insensitive text, so a@x.com and A@X.com are treated as the same email.
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Table: newsletter_subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      citext      not null unique,
  status     text        not null default 'subscribed'
               check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: breeds  (source of truth for the breed catalog)
-- Column names are snake_case (Postgres convention); the app's Breed type is
-- camelCase, so the data layer will map e.g. good_with_kids <-> goodWithKids.
-- ---------------------------------------------------------------------------
create table if not exists public.breeds (
  id                   text        primary key,  -- slug, e.g. 'labrador-retriever'
  name                 text        not null,
  emoji                text        not null,
  tagline              text        not null,
  description          text        not null,
  size                 text        not null check (size in ('small', 'medium', 'large')),
  -- Every trait is scored 1 (very low) to 5 (very high).
  energy               smallint    not null check (energy               between 1 and 5),
  grooming             smallint    not null check (grooming             between 1 and 5),
  trainability         smallint    not null check (trainability         between 1 and 5),
  good_with_kids       smallint    not null check (good_with_kids       between 1 and 5),
  good_with_other_pets smallint    not null check (good_with_other_pets between 1 and 5),
  apartment_friendly   smallint    not null check (apartment_friendly   between 1 and 5),
  independence         smallint    not null check (independence         between 1 and 5),
  novice_friendly      smallint    not null check (novice_friendly      between 1 and 5),
  vocal                smallint    not null check (vocal                between 1 and 5),
  running_partner      smallint    not null check (running_partner      between 1 and 5),
  heat_tolerance       smallint    not null check (heat_tolerance       between 1 and 5),
  cold_tolerance       smallint    not null check (cold_tolerance       between 1 and 5),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Keep breeds.updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists breeds_set_updated_at on public.breeds;
create trigger breeds_set_updated_at
  before update on public.breeds
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.newsletter_subscribers enable row level security;
alter table public.breeds                 enable row level security;

-- Table-level privileges. Supabase usually grants these to the anon /
-- authenticated roles by default; we set them explicitly so this file is
-- self-contained. RLS (below) remains the real gate on which rows are
-- visible or writable.
grant insert on table public.newsletter_subscribers to anon, authenticated;
grant select on table public.breeds                 to anon, authenticated;

-- Newsletter: the public form may INSERT a signup, but the list is NOT
-- readable/updatable/deletable with the anon key (no other policies), so it
-- can't be scraped. Server-side code uses the service_role key, which
-- bypasses RLS. NOTE for wiring: insert without .select() (returning the row
-- would hit RLS and fail), and handle the unique-email conflict.
drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Breeds: public catalog data — anyone can read; writes go through the
-- service_role key (bypasses RLS), so no write policy is granted here.
drop policy if exists "Breeds are publicly readable" on public.breeds;
create policy "Breeds are publicly readable"
  on public.breeds
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: breeds (mirrors src/lib/breeds.ts). "do nothing" on conflict so that
-- re-running this file never clobbers edits made in the DB (the new source of
-- truth). To reset a row to these values, delete it first, then re-run.
-- ---------------------------------------------------------------------------
insert into public.breeds
  (id, name, emoji, tagline, description, size,
   energy, grooming, trainability, good_with_kids, good_with_other_pets,
   apartment_friendly, independence, novice_friendly, vocal, running_partner,
   heat_tolerance, cold_tolerance)
values
  ('labrador-retriever','Labrador Retriever','🦮','The friendly, food-motivated all-rounder','Easygoing, sociable, and eager to please. Labs thrive on daily exercise and love being part of family activities.','large',5,2,5,5,5,2,2,5,2,5,3,4),
  ('golden-retriever','Golden Retriever','🐕','Gentle, affectionate, and endlessly patient','One of the most family-friendly breeds around. Goldens are smart, trainable, and love having a job to do.','large',4,3,5,5,5,2,2,5,2,4,3,4),
  ('french-bulldog','French Bulldog','🐾','A low-energy charmer built for city life','Compact, comical, and content with short walks and a lot of couch time. Great for apartments.','small',2,1,3,4,3,5,2,4,2,1,1,2),
  ('standard-poodle','Standard Poodle','🐩','Whip-smart and surprisingly athletic','Highly intelligent and trainable, with a low-shedding coat that needs regular grooming to look its best.','large',4,5,5,4,4,3,2,4,2,4,3,3),
  ('chihuahua','Chihuahua','🐕‍🦺','Tiny body, huge personality','A big-city favorite that needs minimal exercise but plenty of affection. Can be vocal and wary of strangers.','small',2,1,3,2,2,5,2,3,5,1,2,1),
  ('beagle','Beagle','🐶','A curious nose-led explorer','Merry and social, beagles love company and outdoor sniffing adventures, though they can be vocal and stubborn.','medium',4,2,3,5,4,3,2,3,5,3,3,3),
  ('german-shepherd','German Shepherd','🐕‍🦺','Loyal, confident, and hard-working','Highly trainable and protective, German Shepherds need consistent exercise and mental stimulation to thrive.','large',5,3,5,4,3,2,3,3,3,5,3,4),
  ('border-collie','Border Collie','🐕','The brainiest breed, built to work','Extremely intelligent and energetic. Needs a job, a yard, and a lot of stimulation, or it will get creative on its own.','medium',5,3,5,4,3,1,2,2,3,5,3,4),
  ('bulldog','English Bulldog','🐾','Low-key, dignified, and a little stubborn','A relaxed companion that''s happy with short strolls and long naps. Sensitive to heat and needs coat-fold care.','medium',1,2,2,4,3,5,3,3,1,1,1,2),
  ('cavalier-king-charles-spaniel','Cavalier King Charles Spaniel','🐕','A velcro dog that loves everyone','Sweet, affectionate, and adaptable to almost any home. Does best when it isn''t left alone for long stretches.','small',3,3,4,5,5,5,1,5,2,2,3,3),
  ('dachshund','Dachshund','🌭','A bold little hound with a big bark','Playful and clever with a stubborn streak. Small enough for apartments but vocal and prone to alerting to everything.','small',3,2,3,3,3,4,3,3,5,2,3,2),
  ('shih-tzu','Shih Tzu','🐕','A pint-sized lap dog with a flowing coat','Affectionate and calm, happiest curled up with its people. Needs frequent grooming to keep its coat healthy.','small',2,5,3,4,4,5,2,4,2,1,2,2),
  ('australian-shepherd','Australian Shepherd','🐕‍🦺','A tireless herder that needs a purpose','Athletic, smart, and devoted, but happiest with acreage, a job to do, and an experienced, active owner.','medium',5,3,5,4,3,1,2,2,3,5,3,4),
  ('boxer','Boxer','🥊','A goofy, loyal bundle of energy','Playful and protective with a soft spot for kids. Boxers need regular exercise to stay out of mischief.','large',5,1,3,5,3,2,2,3,2,4,2,3),
  ('pug','Pug','🐶','A comedic, cuddly companion','Charming and low-exercise, pugs are content with short walks and lots of lounging. Sensitive to heat.','small',2,2,3,5,4,5,2,5,2,1,1,2),
  ('pembroke-welsh-corgi','Pembroke Welsh Corgi','🐕','Short legs, big herding heart','Smart, sturdy, and surprisingly energetic for their size. They bond closely and can be vocal watchdogs.','small',4,3,4,4,4,4,2,4,4,2,3,3),
  ('great-dane','Great Dane','🐕‍🦺','A gentle giant with a surprisingly calm soul','Despite their size, Danes are laid-back homebodies who just need space to stretch out and a loving family nearby.','large',2,1,3,4,3,2,2,3,2,2,3,2),
  ('siberian-husky','Siberian Husky','🐺','A vocal, high-energy escape artist','Striking and athletic, huskies need serious daily exercise and secure fencing. Not known for reliable recall.','medium',5,4,2,4,3,1,4,1,5,5,1,5),
  ('yorkshire-terrier','Yorkshire Terrier','🎀','A tiny terrier with a big attitude','Feisty and affectionate in equal measure. Small enough for any home, but needs regular coat care and confident handling.','small',3,4,3,2,2,5,2,3,4,1,3,2),
  ('basset-hound','Basset Hound','🐾','A laid-back nose with short legs','Mellow and easygoing with a famously good nose. Content with modest exercise but can be stubborn about training.','medium',2,2,2,5,4,4,3,3,4,1,3,3)
on conflict (id) do nothing;
