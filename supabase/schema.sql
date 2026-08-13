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
-- Breed group (added after the initial launch). Records which group a breed
-- belongs to, based on what it was originally bred to do. It's a browsing /
-- organisation aid only and is NOT used by the matcher. Written as an
-- idempotent migration so this file stays safe to re-run against a database
-- that predates the column. Maps to the camelCase `group` field in the app.
-- ---------------------------------------------------------------------------
alter table public.breeds
  add column if not exists breed_group text;

alter table public.breeds drop constraint if exists breeds_breed_group_check;
alter table public.breeds
  add constraint breeds_breed_group_check
  check (breed_group in
    ('gundog', 'hound', 'pastoral', 'terrier', 'toy', 'utility', 'working'));

-- Backfill the original catalog. Only fills rows still NULL, so edits made in
-- the DB (the source of truth) and re-runs are never clobbered — mirroring the
-- seed's "do nothing on conflict" philosophy. (The seed insert below carries
-- the same values for a fresh database, where this update matches no rows.)
update public.breeds as b
set breed_group = v.breed_group
from (values
  ('labrador-retriever', 'gundog'),
  ('golden-retriever', 'gundog'),
  ('french-bulldog', 'utility'),
  ('standard-poodle', 'utility'),
  ('chihuahua', 'toy'),
  ('beagle', 'hound'),
  ('german-shepherd', 'pastoral'),
  ('border-collie', 'pastoral'),
  ('bulldog', 'utility'),
  ('cavalier-king-charles-spaniel', 'toy'),
  ('dachshund', 'hound'),
  ('shih-tzu', 'utility'),
  ('australian-shepherd', 'pastoral'),
  ('boxer', 'working'),
  ('pug', 'toy'),
  ('pembroke-welsh-corgi', 'pastoral'),
  ('great-dane', 'working'),
  ('siberian-husky', 'working'),
  ('yorkshire-terrier', 'toy'),
  ('basset-hound', 'hound')
) as v(id, breed_group)
where b.id = v.id and b.breed_group is null;

-- Any row still without a group (e.g. one added via /admin before this column
-- existed) gets the 'utility' catch-all so the NOT NULL below always
-- succeeds. Re-categorise it in /admin afterwards.
update public.breeds set breed_group = 'utility' where breed_group is null;

alter table public.breeds alter column breed_group set not null;

-- ---------------------------------------------------------------------------
-- Table: saved_results  (per-user saved quiz results)
-- Added when public Google login shipped. Signed-in users may save a snapshot
-- of their quiz results; each user sees only their own rows. Unlike breeds /
-- subscribers (service-role), this table is accessed with the USER's session,
-- so RLS on auth.uid() is the whole security model. Quiz-taking itself stays
-- anonymous — nothing is written here unless a signed-in user clicks Save.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_results (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid()
               references auth.users(id) on delete cascade,
  title      text,
  results    jsonb       not null,   -- top breeds: [{id,name,emoji,matchPercent}]
  answers    jsonb,                  -- recap: [{question,label,icon}]
  created_at timestamptz not null default now()
);

create index if not exists saved_results_user_id_idx
  on public.saved_results (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Table: profiles  (PUBLIC identity — readable by anyone)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid        primary key default auth.uid()
                 references auth.users(id) on delete cascade,
  username     citext      not null unique
                 check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.newsletter_subscribers enable row level security;
alter table public.breeds                 enable row level security;
alter table public.saved_results          enable row level security;
alter table public.profiles               enable row level security;

-- Table-level privileges. Supabase usually grants these to the anon /
-- authenticated roles by default; we set them explicitly so this file is
-- self-contained. RLS (below) remains the real gate on which rows are
-- visible or writable.
grant insert on table public.newsletter_subscribers to anon, authenticated;
grant select on table public.breeds                 to anon, authenticated;
grant select on table public.profiles               to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

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

-- Saved results: a signed-in user may read, create, and delete ONLY their own
-- rows. No update policy (results are immutable snapshots). auth.uid() = user_id
-- is enforced on both read (using) and write (with check).
grant select, insert, delete on table public.saved_results to authenticated;

drop policy if exists "Users read own saved results" on public.saved_results;
create policy "Users read own saved results"
  on public.saved_results
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own saved results" on public.saved_results;
create policy "Users insert own saved results"
  on public.saved_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own saved results" on public.saved_results;
create policy "Users delete own saved results"
  on public.saved_results
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Profiles: anyone can read; only the owner can create/edit/delete their own.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users delete own profile" on public.profiles;
create policy "Users delete own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Seed: breeds (mirrors src/lib/breeds.ts). "do nothing" on conflict so that
-- re-running this file never clobbers edits made in the DB (the new source of
-- truth). To reset a row to these values, delete it first, then re-run.
-- ---------------------------------------------------------------------------
insert into public.breeds
  (id, name, emoji, tagline, description, size, breed_group,
   energy, grooming, trainability, good_with_kids, good_with_other_pets,
   apartment_friendly, independence, novice_friendly, vocal, running_partner,
   heat_tolerance, cold_tolerance)
values
  ('labrador-retriever','Labrador Retriever','🦮','The friendly, food-motivated all-rounder','Easygoing, sociable, and eager to please. Labs thrive on daily exercise and love being part of family activities.','large','gundog',5,2,5,5,5,2,2,5,2,5,3,4),
  ('golden-retriever','Golden Retriever','🐕','Gentle, affectionate, and endlessly patient','One of the most family-friendly breeds around. Goldens are smart, trainable, and love having a job to do.','large','gundog',4,3,5,5,5,2,2,5,2,4,3,4),
  ('french-bulldog','French Bulldog','🐾','A low-energy charmer built for city life','Compact, comical, and content with short walks and a lot of couch time. Great for apartments.','small','utility',2,1,3,4,3,5,2,4,2,1,1,2),
  ('standard-poodle','Standard Poodle','🐩','Whip-smart and surprisingly athletic','Highly intelligent and trainable, with a low-shedding coat that needs regular grooming to look its best.','large','utility',4,5,5,4,4,3,2,4,2,4,3,3),
  ('chihuahua','Chihuahua','🐕‍🦺','Tiny body, huge personality','A big-city favorite that needs minimal exercise but plenty of affection. Can be vocal and wary of strangers.','small','toy',2,1,3,2,2,5,2,3,5,1,2,1),
  ('beagle','Beagle','🐶','A curious nose-led explorer','Merry and social, beagles love company and outdoor sniffing adventures, though they can be vocal and stubborn.','medium','hound',4,2,3,5,4,3,2,3,5,3,3,3),
  ('german-shepherd','German Shepherd','🐕‍🦺','Loyal, confident, and hard-working','Highly trainable and protective, German Shepherds need consistent exercise and mental stimulation to thrive.','large','pastoral',5,3,5,4,3,2,3,3,3,5,3,4),
  ('border-collie','Border Collie','🐕','The brainiest breed, built to work','Extremely intelligent and energetic. Needs a job, a yard, and a lot of stimulation, or it will get creative on its own.','medium','pastoral',5,3,5,4,3,1,2,2,3,5,3,4),
  ('bulldog','English Bulldog','🐾','Low-key, dignified, and a little stubborn','A relaxed companion that''s happy with short strolls and long naps. Sensitive to heat and needs coat-fold care.','medium','utility',1,2,2,4,3,5,3,3,1,1,1,2),
  ('cavalier-king-charles-spaniel','Cavalier King Charles Spaniel','🐕','A velcro dog that loves everyone','Sweet, affectionate, and adaptable to almost any home. Does best when it isn''t left alone for long stretches.','small','toy',3,3,4,5,5,5,1,5,2,2,3,3),
  ('dachshund','Dachshund','🌭','A bold little hound with a big bark','Playful and clever with a stubborn streak. Small enough for apartments but vocal and prone to alerting to everything.','small','hound',3,2,3,3,3,4,3,3,5,2,3,2),
  ('shih-tzu','Shih Tzu','🐕','A pint-sized lap dog with a flowing coat','Affectionate and calm, happiest curled up with its people. Needs frequent grooming to keep its coat healthy.','small','utility',2,5,3,4,4,5,2,4,2,1,2,2),
  ('australian-shepherd','Australian Shepherd','🐕‍🦺','A tireless herder that needs a purpose','Athletic, smart, and devoted, but happiest with acreage, a job to do, and an experienced, active owner.','medium','pastoral',5,3,5,4,3,1,2,2,3,5,3,4),
  ('boxer','Boxer','🥊','A goofy, loyal bundle of energy','Playful and protective with a soft spot for kids. Boxers need regular exercise to stay out of mischief.','large','working',5,1,3,5,3,2,2,3,2,4,2,3),
  ('pug','Pug','🐶','A comedic, cuddly companion','Charming and low-exercise, pugs are content with short walks and lots of lounging. Sensitive to heat.','small','toy',2,2,3,5,4,5,2,5,2,1,1,2),
  ('pembroke-welsh-corgi','Pembroke Welsh Corgi','🐕','Short legs, big herding heart','Smart, sturdy, and surprisingly energetic for their size. They bond closely and can be vocal watchdogs.','small','pastoral',4,3,4,4,4,4,2,4,4,2,3,3),
  ('great-dane','Great Dane','🐕‍🦺','A gentle giant with a surprisingly calm soul','Despite their size, Danes are laid-back homebodies who just need space to stretch out and a loving family nearby.','large','working',2,1,3,4,3,2,2,3,2,2,3,2),
  ('siberian-husky','Siberian Husky','🐺','A vocal, high-energy escape artist','Striking and athletic, huskies need serious daily exercise and secure fencing. Not known for reliable recall.','medium','working',5,4,2,4,3,1,4,1,5,5,1,5),
  ('yorkshire-terrier','Yorkshire Terrier','🎀','A tiny terrier with a big attitude','Feisty and affectionate in equal measure. Small enough for any home, but needs regular coat care and confident handling.','small','toy',3,4,3,2,2,5,2,3,4,1,3,2),
  ('basset-hound','Basset Hound','🐾','A laid-back nose with short legs','Mellow and easygoing with a famously good nose. Content with modest exercise but can be stubborn about training.','medium','hound',2,2,2,5,4,4,3,3,4,1,3,3),
  ('akita','Akita','🐕‍🦺','Silent guardian, unwavering heart.','Originating in the mountains of Japan, Akitas were bred to guard nobility and hunt large game, and that dignified independence still shows. They form deep bonds with their family but tend to be reserved with strangers and other dogs, making early socialization important. Best suited to an experienced owner who appreciates a loyal, low-maintenance-coat companion with a strong protective streak.','large','utility',3,3,3,3,2,2,5,2,2,3,2,5),
  ('australian-cattle-dog','Australian Cattle Dog','🐕','Built to work, wired to run.','Developed to herd unruly cattle across the Australian outback, these compact dogs have stamina and problem-solving skills to spare. They thrive with a job to do -- agility, herding trials, or long runs -- and can grow bored or nippy without one. A brilliant match for active owners, less so for anyone hoping for a low-key couch companion.','medium','pastoral',5,2,4,3,3,1,3,2,3,5,4,3),
  ('bernese-mountain-dog','Bernese Mountain Dog','🐕','A gentle giant with a farmhand''s work ethic.','This tri-colored Swiss farm dog combines serious size with a famously sweet, patient temperament. Bernese dogs love children, adapt well to family life, and are happiest close to their people rather than left alone in a yard. Their thick double coat sheds heavily and they don''t handle heat well, so cooler climates suit them best.','large','working',3,4,4,5,4,2,2,4,2,2,1,5),
  ('bichon-frise','Bichon Frise','🐩','A powder puff with a permanent smile.','Cheerful and people-focused, the Bichon Frise was bred purely for companionship and it shows in their sunny, affectionate nature. Their curly white coat doesn''t shed much, making them a popular pick for allergy-sensitive households, though it does need regular trims and brushing. Small and adaptable, they do just as well in a city apartment as a house.','small','toy',3,5,4,4,4,5,1,4,3,1,3,3),
  ('bloodhound','Bloodhound','🐕','Nose to the ground, heart on its sleeve.','Famous for the most sensitive nose in the dog world, the Bloodhound will happily follow a scent trail for miles, so a secure yard and leash are non-negotiable. Beneath the droopy, wrinkled exterior is a gentle, affectionate dog that''s wonderful with kids. They can be stubborn in training since their nose often overrides their ears.','large','hound',3,2,2,4,3,1,4,2,3,2,2,3),
  ('boston-terrier','Boston Terrier','🐶','The tuxedo-clad clown of the dog world.','Known as the American Gentleman for its tuxedo-like markings, the Boston Terrier is friendly, easygoing, and endlessly good-humored. Its short coat makes grooming a breeze, and its compact size and moderate energy suit apartment life well. As a flat-faced breed, it''s sensitive to heat and shouldn''t be over-exercised in warm weather.','small','utility',3,1,4,4,4,5,2,4,2,2,1,1),
  ('bullmastiff','Bullmastiff','🐕‍🦺','A quiet wall of muscle and devotion.','A powerful cross between the Mastiff and Bulldog, this breed was originally used to guard estates from poachers, and its calm, watchful nature remains. Bullmastiffs are quiet, low-energy homebodies who bond fiercely with their family but can be wary of strangers. Their size and strength call for early training and a confident handler.','large','working',2,1,3,4,2,2,3,2,1,1,2,3),
  ('cane-corso','Cane Corso','🐕‍🦺','Ancient Roman guardian, modern-day protector.','This muscular Italian mastiff descends from Roman war dogs and carries an imposing, protective presence. Cane Corsos are intelligent and trainable but need consistent, experienced handling and plenty of early socialization to channel their guarding instincts appropriately. Not a breed for first-time owners or tight apartment living.','large','working',3,1,4,3,2,1,3,1,2,3,2,3),
  ('cocker-spaniel','Cocker Spaniel','🐕','Silky ears, sweeter disposition.','With silky ears and an eager-to-please attitude, the Cocker Spaniel is one of the most affectionate sporting breeds around. They get along well with children and other pets and respond happily to positive training. Their long, wavy coat needs regular brushing and professional grooming to stay mat-free.','medium','gundog',3,4,4,5,4,3,2,4,3,3,3,3),
  ('collie-rough','Collie (Rough)','🐕','Lassie''s legacy, brains and beauty.','Made famous by Lassie, the Rough Collie pairs a stunning flowing coat with a gentle, intelligent, and devoted temperament. They''re excellent with children and naturally watchful without being aggressive, making them a classic family favorite. That gorgeous coat, though, means frequent brushing to prevent matting.','large','pastoral',3,5,4,5,4,3,2,4,3,3,2,5),
  ('dalmatian','Dalmatian','🐕','Spotted, sporty, and never sits still.','Historically bred to run alongside horse-drawn carriages, Dalmatians have the endurance and drive to match -- they need serious daily exercise to stay balanced. Their short, spotted coat is easy to maintain, but they shed more than people expect. Best for active households who can keep pace with their energy.','large','utility',5,2,3,4,3,1,3,2,2,5,3,3),
  ('doberman-pinscher','Doberman Pinscher','🐕‍🦺','Sleek, sharp, and fiercely loyal.','Athletic, alert, and remarkably quick to learn, the Doberman was originally bred as a personal protection dog and remains fiercely loyal to its family. They need structured training and daily exercise to stay happy, and their short coat offers little insulation against the cold. A devoted companion for owners ready to keep both their body and mind engaged.','large','working',4,1,5,4,2,2,2,2,2,5,3,1),
  ('english-springer-spaniel','English Springer Spaniel','🐕','A gundog with boundless enthusiasm.','Bred to flush and retrieve game, Springer Spaniels bring boundless enthusiasm to everything from a walk around the block to a full day in the field. They''re warm with kids, quick to train, and need a real outlet for their energy to avoid restlessness. Their silky coat and feathered ears require regular brushing.','medium','gundog',5,4,5,5,4,2,2,4,3,5,3,3),
  ('great-pyrenees','Great Pyrenees','🐕‍🦺','A snow-white sentinel that never sleeps on the job.','Bred for centuries to guard flocks alone on mountainsides, the Great Pyrenees is calm, watchful, and fiercely protective, with a tendency to bark at anything unusual after dark. They''re gentle giants with children but are independent thinkers who don''t always prioritize obedience. Their thick white coat is built for cold climates, not heat.','large','pastoral',2,4,2,5,3,1,5,2,4,1,1,5),
  ('irish-setter','Irish Setter','🐕','A red blur with a heart of gold.','Elegant and endlessly good-natured, the Irish Setter brings a burst of red-coated energy to any active household. They''re friendly with people and other dogs but need substantial daily exercise to keep their exuberance in check. Their silky coat requires regular brushing to stay tangle-free.','large','gundog',5,4,3,4,4,1,3,3,2,5,3,3),
  ('maltese','Maltese','🐶','Ancient royalty in a five-pound package.','One of the oldest toy breeds, the Maltese has been a pampered lapdog for royalty and commoners alike for centuries. Small, affectionate, and adaptable, they thrive in apartments and are happiest glued to their favorite person. Their long white coat needs daily brushing, though many owners keep it trimmed short for easier care.','small','toy',2,5,3,3,3,5,1,3,4,1,3,1),
  ('miniature-schnauzer','Miniature Schnauzer','🐶','Big personality, low-shed coat.','Compact, wiry-coated, and endlessly spirited, the Miniature Schnauzer packs a big personality into a small body. Their low-shed coat is a plus for allergy sufferers, though it needs regular grooming to keep its signature look. Alert and vocal, they make excellent watchdogs for apartment or house alike.','small','utility',3,4,4,4,3,4,2,4,4,2,3,2),
  ('newfoundland','Newfoundland','🐕‍🦺','A gentle lifeguard with a heart as big as its paws.','Gentle, patient, and famously good with children, the Newfoundland was originally bred to assist fishermen and still loves water more than almost any other breed. Their sheer size and thick, weather-resistant coat mean they''re best suited to cooler climates with plenty of space. Despite their bulk, they''re calm, low-energy companions indoors.','large','working',2,5,4,5,4,1,2,3,1,1,1,5),
  ('papillon','Papillon','🦋','Butterfly ears, athlete''s spirit.','Named for its distinctive butterfly-shaped ears, the Papillon is far more athletic and trainable than its dainty appearance suggests. These tiny dogs consistently rank among the smartest toy breeds and enjoy agility and trick training as much as lap time. Their small size makes them a natural fit for apartment living.','small','toy',4,3,5,3,3,5,1,4,3,2,3,1),
  ('rottweiler','Rottweiler','🐕‍🦺','Steady, strong, and devoted to family.','Confident, calm, and deeply devoted to their family, Rottweilers descend from Roman cattle-driving dogs and carry a strong protective instinct. They''re intelligent and trainable but need firm, consistent guidance and early socialization to be their best selves. Their short coat is low-maintenance, though their size and strength mean they''re not typically recommended for first-time owners.','large','working',3,1,4,3,2,2,3,1,1,3,2,2)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: Irish/European breed pack. Same do-nothing-on-conflict philosophy as
-- the seed above — re-running this file never clobbers edits made in the DB.
-- ---------------------------------------------------------------------------
insert into public.breeds
  (id, name, emoji, tagline, description, size, breed_group, energy, grooming, trainability, good_with_kids, good_with_other_pets, apartment_friendly, independence, novice_friendly, vocal, running_partner, heat_tolerance, cold_tolerance)
values
  ('irish-wolfhound', 'Irish Wolfhound', '🐕‍🦺', 'The tallest dog in the world, with the softest heart.', 'Bred in Ireland to hunt wolves and elk, the Irish Wolfhound is the tallest of all breeds and yet one of the gentlest, famously described as slow to anger and quick to forgive. Indoors it is calm and undemanding, content to sprawl across whatever furniture it can reach, though it needs daily walks and space simply to turn around. Prospective owners should know the breed''s lifespan is short, typically six to eight years, which is the great sorrow of owning one.', 'large', 'hound', 3, 2, 3, 5, 3, 1, 3, 2, 1, 2, 2, 4),
  ('kerry-beagle', 'Kerry Beagle', '🐶', 'Ireland''s rarest hound, and its loudest.', 'The only surviving scent hound native to Ireland, the Kerry Beagle is far larger than its name suggests and still worked in packs across Munster today. It is friendly and easygoing with people but driven almost entirely by its nose, which means a secure yard, a lead, and a great deal of patience with recall. Its deep, carrying bay is part of the breed''s appeal in the field and a genuine problem in a housing estate.', 'medium', 'hound', 5, 1, 2, 4, 3, 1, 4, 2, 5, 4, 3, 3),
  ('irish-water-spaniel', 'Irish Water Spaniel', '🐩', 'Curly, comic, and never happier than when soaked.', 'Instantly recognizable by its liver-colored curls, topknot, and smooth rat tail, the Irish Water Spaniel is the tallest of the spaniels and the clown of the group. It is intelligent and eager but has an independent streak and a sense of humor, so training works best when it stays varied and rewarding rather than repetitive. The dense curly coat sheds very little but needs regular brushing and trimming to stay free of mats.', 'large', 'gundog', 5, 4, 4, 4, 4, 2, 2, 2, 2, 4, 3, 4),
  ('irish-red-and-white-setter', 'Irish Red and White Setter', '🐕', 'The setter that came back from the brink.', 'Older than the solid red Irish Setter and nearly lost to it, this breed was rescued from near-extinction by a small group of Irish breeders in the 1920s and remains uncommon outside the country. It is a working gundog first, powerful and tireless in the field, with a friendly and biddable nature that makes it slightly steadier than its red cousin. It needs serious daily exercise and a job to think about, and its feathered coat requires regular brushing.', 'large', 'gundog', 5, 3, 3, 5, 4, 1, 2, 2, 2, 5, 3, 3),
  ('irish-terrier', 'Irish Terrier', '🍀', 'The daredevil in the red coat.', 'Nicknamed the daredevil for its reckless courage, the Irish Terrier is bold, quick, and deeply loyal to its own family, having served as a messenger dog in the trenches of the First World War. It is affectionate and playful with children but notoriously willing to scrap with other dogs, so early socialization and a firm lead are essential. Its harsh red coat sheds very little and needs stripping a few times a year rather than daily brushing.', 'medium', 'terrier', 4, 2, 3, 4, 2, 3, 3, 2, 4, 4, 3, 3),
  ('glen-of-imaal-terrier', 'Glen of Imaal Terrier', '🐾', 'One of the rarest dogs in the world, and one of the quietest terriers.', 'From a remote valley in the Wicklow mountains, the Glen is a low-slung, powerfully built terrier that is now classed as a vulnerable native breed with only a few hundred puppies registered worldwide each year. Unusually for a terrier it is calm and notably less vocal than its relatives, happy to spend the evening flat out by the fire. It still has real terrier grit underneath, however, and tends not to back down from other dogs.', 'small', 'terrier', 3, 2, 3, 4, 2, 4, 3, 3, 2, 2, 3, 4),
  ('soft-coated-wheaten-terrier', 'Soft Coated Wheaten Terrier', '🐕', 'A silky, bouncing welcome committee.', 'The Wheaten is the softest of the Irish terriers in both coat and temperament, an all-purpose farm dog turned devoted family companion known for greeting people by leaping straight up at them. It is friendly with almost everyone, including strangers and other dogs, which makes it a poor guard dog and an excellent housemate. Its single silky coat sheds very little but mats readily and needs brushing every few days plus regular trims.', 'medium', 'terrier', 4, 4, 3, 5, 3, 3, 2, 3, 3, 4, 3, 3),
  ('kerry-blue-terrier', 'Kerry Blue Terrier', '🐕', 'Born black, turns blue, never backs down.', 'Puppies are born black and take up to two years to fade into the soft slate blue that gives the breed its name. Intelligent, spirited, and adaptable, the Kerry Blue worked as a herder, ratter, and guard on Irish farms and carries a strong sense of its own opinion into family life. It is affectionate with its people but often argumentative with other dogs, and its non-shedding coat needs professional grooming roughly every six weeks.', 'medium', 'terrier', 4, 4, 3, 4, 2, 3, 3, 2, 3, 4, 3, 3),
  ('jack-russell-terrier', 'Jack Russell Terrier', '🐶', 'Small dog, enormous engine.', 'Bred to bolt foxes from underground, the Jack Russell is fearless, clever, and packed with more energy than most dogs three times its size. It is a poor match for anyone hoping a small dog means a low-maintenance one, needing real daily exercise and mental work to stay out of trouble. Its strong prey drive makes it unreliable around small pets and unreliable off-lead near wildlife, though its short coat asks almost nothing.', 'small', 'terrier', 5, 1, 3, 3, 2, 2, 3, 2, 4, 4, 3, 3),
  ('west-highland-white-terrier', 'West Highland White Terrier', '🐶', 'A confident little Scot in a white coat.', 'The Westie is sturdy, self-assured, and far more robust than its fluffy white appearance suggests, originally bred to hunt rats and foxes in the Scottish highlands. It is friendly and adaptable enough for apartment life, provided it gets a decent walk and some company, and it makes a determined little watchdog. The harsh double coat needs regular brushing and trimming, and the breed is prone to skin allergies worth discussing with a vet.', 'small', 'terrier', 3, 3, 3, 4, 3, 4, 3, 3, 4, 2, 3, 3),
  ('border-terrier', 'Border Terrier', '🐾', 'The terrier that gets on with everyone.', 'Bred along the Scottish borders to keep up with hounds on horseback, the Border Terrier is hardy, sensible, and unusually good-natured for a terrier, tolerating children and other dogs with rare patience. It is one of the easier terriers for a first-time owner, though it retains a real prey drive and a talent for digging under fences. Its wiry coat is low-maintenance, needing a hand-strip a couple of times a year rather than constant grooming.', 'small', 'terrier', 4, 2, 4, 5, 3, 3, 2, 4, 2, 4, 3, 4),
  ('cairn-terrier', 'Cairn Terrier', '🐶', 'Scruffy, curious, and always mid-excavation.', 'Best known as Toto from The Wizard of Oz, the Cairn was bred to bolt vermin from the rock piles of the Scottish highlands and has lost none of its enthusiasm for digging. It is cheerful, curious, and adaptable to most homes, but it is an independent thinker that tends to treat recall as a suggestion. Its shaggy weather-resistant coat is easy to care for and sheds relatively little.', 'small', 'terrier', 4, 2, 3, 4, 3, 4, 3, 3, 4, 2, 3, 3),
  ('scottish-terrier', 'Scottish Terrier', '🐾', 'Dignified, stubborn, and entirely his own dog.', 'The Scottie is famously independent, carrying itself with a seriousness that borders on aloof and forming intense bonds with one or two people rather than the whole world. It is quiet and dignified indoors and suits apartment life well, but training requires patience because the breed genuinely considers whether your request is worth its time. Its hard wiry coat needs regular professional grooming to keep the distinctive silhouette.', 'small', 'terrier', 3, 3, 2, 3, 2, 4, 4, 2, 3, 2, 2, 4),
  ('airedale-terrier', 'Airedale Terrier', '🐕‍🦺', 'The King of Terriers, and he knows it.', 'The largest of the terriers, the Airedale has worked as a hunter, wartime messenger, and police dog, and combines genuine intelligence with a mischievous streak that keeps owners honest. It is affectionate and playful with its family and needs both physical exercise and mental challenge to stay settled. Its dense wiry coat sheds little but needs stripping or clipping several times a year, and it can be pushy with unfamiliar dogs.', 'large', 'terrier', 4, 3, 4, 4, 2, 2, 3, 2, 3, 4, 3, 4),
  ('wire-fox-terrier', 'Wire Fox Terrier', '🐶', 'A spring-loaded showman with a mind of his own.', 'Alert, athletic, and endlessly entertaining, the Wire Fox Terrier was bred to bolt foxes and brings that same intensity to everything from a walk to a doorbell. It is affectionate and hugely playful with its family but needs firm, interesting training to channel a strong independent streak. Its wiry coat sheds very little and needs regular stripping, and its prey drive makes secure fencing non-negotiable.', 'small', 'terrier', 5, 3, 3, 4, 2, 3, 3, 2, 4, 3, 3, 3),
  ('bedlington-terrier', 'Bedlington Terrier', '🐑', 'Looks like a lamb, runs like a whippet.', 'With its arched back, pear-shaped head, and curly coat, the Bedlington is often mistaken for a small sheep until it moves, at which point the sighthound in its ancestry becomes obvious. It is gentler and quieter at home than most terriers, making it a surprisingly good apartment dog, but it can be fiery with strange dogs and fast off the mark after a squirrel. Its non-shedding coat needs clipping every six to eight weeks.', 'medium', 'terrier', 3, 4, 3, 4, 2, 4, 3, 3, 3, 4, 3, 3),
  ('staffordshire-bull-terrier', 'Staffordshire Bull Terrier', '🐶', 'The nanny dog with a barrel chest.', 'Muscular and startlingly strong for its size, the Staffie is also one of the most affectionate and people-focused breeds there is, with a long-standing reputation for patience with children. It is eager to please and trains readily, but it can be intolerant of unfamiliar dogs and needs consistent socialization from puppyhood. Note that in Ireland the Staffordshire Bull Terrier is a restricted breed, which means muzzling and a short lead in public.', 'medium', 'terrier', 4, 1, 4, 5, 2, 3, 2, 3, 2, 3, 2, 2),
  ('bull-terrier', 'Bull Terrier', '🥚', 'An egg-shaped head and a comedian''s timing.', 'Unmistakable for its long egg-shaped head and small triangular eyes, the Bull Terrier is a boisterous, funny, and relentlessly playful dog that stays puppyish well into adulthood. It is strong, stubborn, and easily bored, so it needs an owner who enjoys training and can stay a step ahead of the mischief. Note that in Ireland the English Bull Terrier is a restricted breed, which means muzzling and a short lead in public.', 'medium', 'terrier', 4, 1, 2, 4, 2, 3, 3, 1, 2, 3, 2, 2),
  ('greyhound', 'Greyhound', '🐕', 'A 45mph sprinter who sleeps 20 hours a day.', 'The fastest dog on earth is also one of the laziest, capable of a blistering two-minute sprint and then eighteen hours flat out on the sofa. Retired racing greyhounds are rehomed in large numbers across Ireland and adapt remarkably well to quiet family life, needing far less exercise than their build suggests. Their thin coat and almost total lack of body fat mean they feel the cold badly and need a coat in winter, and their prey drive makes them a poor match for cats or small pets.', 'large', 'hound', 2, 1, 3, 4, 2, 4, 3, 4, 1, 2, 3, 1),
  ('lurcher', 'Lurcher', '🐕', 'Sighthound speed with a working dog''s brain.', 'Not a breed but a type, the Lurcher is a sighthound crossed with a collie, terrier, or retriever, and has been a fixture of Irish and British rural life for centuries. The mix tends to produce a dog with the greyhound''s calm indoor nature plus a bit more biddability and stamina, though exactly what you get depends entirely on the cross. Lurchers fill Irish rescue centres in large numbers and make superb companions for owners who can offer secure fencing and a tolerance for high prey drive.', 'large', 'hound', 3, 2, 3, 4, 2, 3, 3, 3, 1, 4, 3, 2),
  ('whippet', 'Whippet', '🐕', 'The poor man''s racehorse, and the perfect flat dog.', 'A greyhound in miniature, the Whippet combines explosive speed outdoors with an almost comical devotion to comfort indoors, seeking out the warmest blanket in the house without fail. It is quiet, gentle, rarely barks, and adapts beautifully to apartment living provided it gets a good run in a safe enclosed space. Its fine coat offers no insulation and it will shiver in an Irish winter without a jumper.', 'medium', 'hound', 3, 1, 3, 5, 2, 5, 2, 4, 1, 3, 3, 1),
  ('cockapoo', 'Cockapoo', '🐩', 'The crossbreed that took over the country.', 'A Cocker Spaniel crossed with a Poodle, the Cockapoo has become one of the most common dogs in Irish homes thanks to its sunny temperament and low-shedding coat. It is bright, sociable, and eager to please, though it inherits the spaniel''s need for company and can struggle badly when left alone all day. Coat type varies from wavy to tightly curled depending on the cross, and most need professional grooming every six to eight weeks.', 'medium', 'utility', 4, 4, 4, 5, 4, 4, 1, 4, 3, 3, 3, 3),
  ('cavapoo', 'Cavapoo', '🐩', 'A lapdog with a poodle''s brain.', 'Crossing the Cavalier King Charles Spaniel with a Miniature or Toy Poodle produces a small, soft-natured dog that suits flats, first-time owners, and households wanting a genuine lap companion. It is quick to learn and friendly with almost everyone, but it is bred squarely for company and does not cope well with long stretches alone. Buyers should ask breeders about heart and eye screening, since the Cavalier side of the cross carries known health risks.', 'small', 'utility', 3, 4, 4, 5, 4, 5, 1, 4, 2, 2, 3, 3),
  ('labradoodle', 'Labradoodle', '🐩', 'Labrador warmth in a low-shedding coat.', 'Originally bred in Australia as an allergy-friendly guide dog, the Labradoodle pairs the Labrador''s friendliness with the Poodle''s coat and intelligence. It is boisterous, people-loving, and slow to grow up, needing substantial daily exercise and consistent training through a long adolescence. Coat type is unpredictable in first-generation crosses, so low shedding is likely rather than guaranteed, and the curlier coats mat quickly without regular brushing.', 'large', 'utility', 4, 4, 4, 5, 4, 2, 1, 3, 2, 4, 3, 3),
  ('sprocker-spaniel', 'Sprocker Spaniel', '🐕', 'Two spaniels'' worth of energy in one dog.', 'A cross between the English Springer and the Cocker Spaniel, the Sprocker is enormously popular as a working gundog across Ireland and increasingly as a family dog. It is affectionate, biddable, and endlessly willing, but it carries a working spaniel''s engine and will invent its own entertainment if underexercised. This is a dog for genuinely active households, ideally ones that can offer scentwork, gundog training, or long daily rambles.', 'medium', 'gundog', 5, 3, 4, 4, 4, 2, 2, 3, 3, 5, 3, 3),
  ('weimaraner', 'Weimaraner', '🐕', 'The grey ghost who cannot bear to be left behind.', 'Striking in silver-grey with pale amber eyes, the Weimaraner was bred for German nobility to hunt large game and remains a powerful, driven athlete. It bonds with extraordinary intensity and is among the breeds most prone to separation anxiety, making it a poor choice for households out of the home all day. It needs vigorous daily exercise, real mental work, and an owner who enjoys training a dog with strong opinions.', 'large', 'gundog', 5, 1, 4, 4, 2, 1, 1, 2, 3, 5, 3, 2),
  ('german-shorthaired-pointer', 'German Shorthaired Pointer', '🐕', 'Built to run all day and then ask for more.', 'A versatile hunting dog that points, retrieves, and tracks with equal enthusiasm, the GSP is one of the most athletic breeds you can bring into a home. It is friendly, smart, and highly trainable, but it needs an hour or more of hard exercise every single day and becomes destructive when it does not get it. Its short coat is almost maintenance-free, though it offers little protection on cold wet mornings.', 'large', 'gundog', 5, 1, 4, 4, 3, 1, 2, 2, 3, 5, 3, 2),
  ('shetland-sheepdog', 'Shetland Sheepdog', '🐕', 'A miniature collie with an oversized opinion.', 'Developed on the Shetland Islands to work small hardy sheep, the Sheltie is one of the most trainable breeds in existence and excels at obedience and agility. It is devoted and sensitive with its own family but reserved with strangers, and it is genuinely vocal, alerting to post, passers-by, and anything else it deems worth reporting. Its long double coat sheds heavily and needs brushing several times a week.', 'small', 'pastoral', 4, 4, 5, 4, 4, 3, 2, 4, 5, 3, 2, 4),
  ('miniature-poodle', 'Miniature Poodle', '🐩', 'All the poodle brains, half the poodle.', 'The middle of the three poodle sizes, the Miniature offers the same remarkable intelligence and low-shedding coat as its larger cousin in a package that fits comfortably into a flat. It learns new behaviours faster than almost any breed and needs mental stimulation as much as physical exercise to stay content. Its curly coat does not shed but requires professional clipping every six weeks or so.', 'small', 'utility', 3, 4, 5, 4, 4, 5, 2, 4, 3, 2, 3, 3),
  ('toy-poodle', 'Toy Poodle', '🐩', 'A very clever dog in a very small parcel.', 'The smallest of the poodles is every bit as bright as the standard and thrives on trick training, puzzle toys, and constant involvement in family life. It is a true lap dog that dislikes being alone and can become anxious and yappy without company or structure. Its fine bones need care around boisterous small children, and its coat needs regular professional grooming.', 'small', 'utility', 3, 4, 5, 3, 3, 5, 1, 4, 3, 1, 3, 2),
  ('pomeranian', 'Pomeranian', '🦊', 'A fox-faced ball of fluff and self-belief.', 'Descended from much larger Arctic sled dogs and bred down to a few kilos, the Pomeranian has kept the spitz confidence entirely intact. It is lively, bold, and forms a strong bond with one or two people, but it is a serious barker and needs early training to keep the alerting under control. Its double coat needs brushing several times a week and it is too fragile for rough handling by very young children.', 'small', 'toy', 3, 4, 3, 3, 3, 5, 2, 3, 5, 1, 2, 4),
  ('miniature-dachshund', 'Miniature Dachshund', '🌭', 'A small badger hunter with a large sense of purpose.', 'Bred to follow badgers underground, the Miniature Dachshund is bold, clever, and reliably stubborn, with a bark far bigger than its frame. It suits apartment living and modest exercise, but its long back makes it vulnerable to disc disease, so stairs and jumping off furniture are best discouraged from puppyhood. Coat comes in smooth, long, and wire varieties, with the long and wire types needing more grooming.', 'small', 'hound', 3, 2, 2, 3, 3, 5, 3, 3, 4, 1, 3, 2),
  ('cardigan-welsh-corgi', 'Cardigan Welsh Corgi', '🐕', 'The corgi with the tail, and the older claim.', 'The lesser-known and older of the two corgi breeds, the Cardigan is distinguished by its long fox-like tail and slightly heavier build. It is affectionate and clever like its Pembroke cousin but tends to be a little more reserved with strangers and steadier in temperament. It is a real herding dog under the short legs, needing daily exercise and a job, and it will bark at anything approaching the house.', 'small', 'pastoral', 4, 3, 4, 4, 4, 4, 2, 4, 4, 2, 3, 4),
  ('bearded-collie', 'Bearded Collie', '🐕', 'A bouncing, shaggy optimist.', 'Bred to drove cattle and sheep across the Scottish highlands, the Beardie is famously exuberant, bounding through life with an enthusiasm that rarely dims with age. It is affectionate with children and other dogs and highly trainable, though it can be independent-minded and needs training that stays fun. Its long shaggy double coat is the main commitment, requiring thorough brushing several times a week to avoid serious matting.', 'medium', 'pastoral', 4, 5, 4, 5, 4, 2, 2, 3, 3, 4, 2, 4),
  ('old-english-sheepdog', 'Old English Sheepdog', '🐕', 'A wall of coat with a gentle heart behind it.', 'Instantly recognisable for its profuse shaggy coat and rolling bear-like gait, the Old English Sheepdog is patient, affectionate, and famously good with children. Energy needs are moderate rather than extreme, but the coat is a genuine daily commitment, needing hours of brushing each week or a short clip. The breed struggles badly in warm weather and does far better in cool damp climates.', 'large', 'pastoral', 3, 5, 3, 5, 4, 2, 3, 2, 3, 2, 1, 5),
  ('lagotto-romagnolo', 'Lagotto Romagnolo', '🐩', 'The truffle hunter with a nose for everything.', 'The only breed in the world specifically bred to hunt truffles, the Lagotto comes from the marshlands of Romagna and combines an extraordinary nose with a affectionate, biddable nature. It is smaller and calmer than most working gundogs and its dense woolly coat sheds very little, making it popular with allergy-sensitive households. That nose needs employing, though, and scentwork games are close to essential for a settled Lagotto.', 'medium', 'gundog', 4, 4, 4, 4, 4, 3, 2, 3, 3, 4, 3, 3),
  ('spanish-water-dog', 'Spanish Water Dog', '🐩', 'A corded coat and a relentless work ethic.', 'A rustic all-rounder from Andalusia used to herd goats and sheep and to help fishermen, the Spanish Water Dog is intense, athletic, and deeply attached to its handler. Its distinctive coat is never brushed but instead allowed to form cords and is shorn right down once or twice a year. It is wary of strangers and needs thorough socialisation, and it is far too driven for a low-key household.', 'medium', 'pastoral', 5, 3, 4, 4, 3, 2, 2, 2, 3, 4, 4, 3),
  ('portuguese-water-dog', 'Portuguese Water Dog', '🌊', 'Bred to herd fish, now herding families.', 'Portuguese fishermen used these dogs to drive fish into nets and carry messages between boats, and the breed still swims with obvious joy. It is robust, clever, and hugely energetic, needing real daily exercise and preferably access to water, and it thrives on training that gives it a purpose. Its curly or wavy coat sheds minimally but needs clipping and regular brushing to stay in order.', 'large', 'working', 5, 4, 4, 4, 4, 2, 2, 3, 3, 4, 3, 3),
  ('belgian-malinois', 'Belgian Malinois', '🐕‍🦺', 'A working dog first, a pet a distant second.', 'The Malinois is the breed of choice for police and military units worldwide, and that is precisely the problem for most households: it is bred for intensity, drive, and hours of daily work. In the right hands it is brilliant, biddable, and fiercely loyal, but in an ordinary family home it commonly becomes anxious, destructive, and unmanageable. It should be considered only by owners with serious dog experience and a genuine plan for its working needs.', 'large', 'pastoral', 5, 2, 5, 3, 2, 1, 2, 1, 3, 5, 3, 3),
  ('dogue-de-bordeaux', 'Dogue de Bordeaux', '🐕‍🦺', 'A wrinkled French mastiff built like a barrel.', 'One of the oldest French breeds, the Dogue de Bordeaux is enormously powerful yet calm and low-energy indoors, devoted to its family and naturally suspicious of strangers. It requires early training and confident handling simply because of its strength, and it drools prodigiously. Prospective owners should be aware the breed has one of the shortest lifespans of any dog, often only five to eight years.', 'large', 'working', 2, 1, 2, 4, 2, 2, 3, 1, 2, 1, 1, 2),
  ('leonberger', 'Leonberger', '🦁', 'A lion-maned giant with impeccable manners.', 'Created in the German town of Leonberg to resemble the lion on its coat of arms, this giant breed combines Newfoundland, Saint Bernard, and Pyrenean ancestry into a strikingly gentle whole. It is patient with children, steady with strangers, and surprisingly trainable for its size, making it a favourite for water rescue and therapy work. Its enormous double coat sheds seasonally in dramatic quantities and needs frequent brushing.', 'large', 'working', 3, 5, 4, 5, 4, 1, 2, 2, 2, 2, 1, 5),
  ('saint-bernard', 'Saint Bernard', '🐕‍🦺', 'An Alpine rescuer who now rescues the sofa.', 'Bred by monks in the Swiss Alps to find travellers lost in the snow, the Saint Bernard is calm, kind, and remarkably tolerant, particularly with children. It is low-energy for its size and content with moderate walks, but it needs space simply to exist and drools enough to require towels in every room. Heat is a serious problem for the breed and its heavy coat suits cool climates far better than warm ones.', 'large', 'working', 2, 4, 3, 5, 4, 1, 2, 2, 2, 1, 1, 5),
  ('giant-schnauzer', 'Giant Schnauzer', '🐕‍🦺', 'A serious dog for a serious owner.', 'Originally a cattle drover and later a brewery and police dog in Bavaria, the Giant Schnauzer is powerful, intensely intelligent, and territorial. It bonds deeply with its family and is highly trainable, but it needs a confident owner, structured work, and a great deal of exercise or it will make its own decisions. Its harsh wiry coat sheds little but needs stripping or clipping every couple of months.', 'large', 'working', 5, 4, 4, 3, 2, 1, 3, 1, 3, 5, 3, 4),
  ('standard-schnauzer', 'Standard Schnauzer', '🐕', 'The original schnauzer, and arguably the best balanced.', 'The oldest of the three schnauzer sizes, the Standard is a versatile German farm dog that ratted, guarded, and drove livestock with equal competence. It is spirited, clever, and mischievous, needing consistent training and enough activity to occupy a sharp mind. Its wiry beard and eyebrows need regular grooming, but the coat sheds very little and suits allergy-sensitive homes.', 'medium', 'utility', 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 3, 4),
  ('keeshond', 'Keeshond', '🐺', 'The smiling Dutch barge dog.', 'A companion and watchdog on Dutch canal barges for centuries, the Keeshond is friendly, outgoing, and unusually people-oriented for a spitz breed. It is bright and eager to please, suiting first-time owners well, though it is a committed barker and needs training to keep the alerting proportionate. Its plush grey double coat sheds heavily twice a year and needs thorough weekly brushing.', 'medium', 'utility', 3, 4, 4, 5, 4, 4, 2, 4, 4, 3, 2, 5),
  ('finnish-lapphund', 'Finnish Lapphund', '🐺', 'A reindeer herder with a permanently cheerful face.', 'Used by the Sámi people to herd reindeer above the Arctic Circle, the Finnish Lapphund is calm, sweet-natured, and notably gentle with children for a herding breed. It is adaptable and reasonably easy to train, though it retains the spitz habit of barking to move livestock and will use it liberally. Its thick weatherproof coat handles cold superbly and warm weather badly.', 'medium', 'pastoral', 3, 4, 4, 5, 4, 3, 3, 4, 4, 3, 1, 5),
  ('norwegian-elkhound', 'Norwegian Elkhound', '🐺', 'A Viking hunting dog with a Viking voice.', 'One of the oldest European breeds, the Elkhound hunted moose by holding them at bay and barking until the hunter arrived, which explains a great deal about its volume. It is bold, hardy, and affectionate with its family, but independent and inclined to decide for itself whether recall applies today. Its dense grey coat is built for Scandinavian winters and sheds spectacularly in spring.', 'medium', 'hound', 4, 4, 3, 4, 3, 2, 4, 2, 5, 4, 1, 5),
  ('samoyed', 'Samoyed', '☁️', 'A white cloud with a permanent smile.', 'Bred by the Samoyedic peoples of Siberia to herd reindeer and sleep among the family for warmth, the Samoyed is exceptionally friendly and hopeless as a guard dog. It is playful, sociable, and needs a great deal of company and exercise, becoming vocal and destructive when bored or left alone. The famous white coat sheds constantly and needs brushing several times a week, and the breed suffers badly in heat.', 'large', 'pastoral', 4, 5, 3, 5, 4, 2, 3, 2, 4, 4, 1, 5),
  ('alaskan-malamute', 'Alaskan Malamute', '🐺', 'A freight sled dog who has never heard of recall.', 'Larger and heavier than the Siberian Husky, the Malamute was bred to haul heavy loads over long distances and retains formidable strength and stamina. It is affectionate and playful with people but strongly independent, notably poor at recall, and carries a prey drive that makes it dangerous around cats and small livestock. It needs secure high fencing, serious exercise, and an owner unbothered by an enormous twice-yearly coat blow.', 'large', 'working', 4, 5, 2, 4, 1, 1, 5, 1, 3, 3, 1, 5),
  ('petit-basset-griffon-vendeen', 'Petit Basset Griffon Vendéen', '🐾', 'A scruffy French hound with a permanent grin.', 'Bred to hunt rabbit through the dense brambles of the Vendée, this small rough-coated hound is cheerful, hardy, and relentlessly cheerful company. It is excellent with children and other dogs but thoroughly nose-led, meaning recall is unreliable and secure fencing essential. Like most pack hounds it is loud, and its harsh coat needs regular brushing and occasional stripping.', 'small', 'hound', 4, 3, 2, 5, 4, 3, 4, 3, 5, 3, 3, 3),
  ('eurasier', 'Eurasier', '🐺', 'A modern breed designed purely to be good company.', 'Created in 1960s Germany by crossing the Chow Chow, Wolfspitz, and Samoyed, the Eurasier was bred deliberately as a calm family companion rather than a working dog. It is notably quiet, rarely barking, devoted to its household and politely reserved with strangers, and it does not cope well with being left alone or kennelled. Its thick double coat needs regular brushing but is otherwise low-maintenance.', 'medium', 'utility', 3, 4, 4, 5, 4, 3, 3, 3, 1, 3, 2, 5),
  ('schipperke', 'Schipperke', '🖤', 'A small black tornado from the Belgian canals.', 'Bred as a barge watchdog and ratter in Flanders, the Schipperke is curious, confident, and almost inexhaustibly busy despite its small size. It is a superb little alarm system and takes the job extremely seriously, which makes it a challenging neighbour in a terrace or apartment block. Its short thick black coat is easy to care for but sheds heavily a few times a year.', 'small', 'utility', 4, 2, 3, 3, 3, 4, 4, 2, 5, 3, 3, 4),
  ('italian-greyhound', 'Italian Greyhound', '🐕', 'A sighthound scaled down to lap size.', 'The smallest of the sighthounds has been a companion to European nobility for centuries and remains a devoted, affectionate shadow that will burrow under any available blanket. It is quiet and ideally suited to apartment life, but its very fine legs are prone to fracture, making it a poor match for boisterous small children. It feels the cold acutely and needs coats and often indoor toileting options in an Irish winter.', 'small', 'toy', 3, 1, 2, 2, 3, 5, 2, 3, 3, 2, 3, 1),
  ('coton-de-tulear', 'Coton de Tuléar', '🐶', 'A cotton-coated clown from Madagascar.', 'The national dog of Madagascar, named for its remarkably soft cotton-like coat, the Coton is playful, adaptable, and bred for nothing but companionship. It is gentle with children and other pets and content with modest exercise, making it one of the easier small breeds for a first-time owner. Its white coat sheds very little but tangles readily and needs brushing every day or two.', 'small', 'toy', 2, 4, 4, 4, 4, 5, 1, 4, 2, 1, 3, 2),
  ('havanese', 'Havanese', '🐶', 'Cuba''s national dog, and a natural performer.', 'The only dog breed native to Cuba, the Havanese is cheerful, sociable, and genuinely easy to train, taking to trick work and therapy visiting with obvious pleasure. It is one of the most reliably good-natured small breeds with children and other pets and adapts happily to apartment life. It is bred entirely for company and does poorly when left alone for long days, and its silky coat needs daily attention.', 'small', 'toy', 3, 4, 4, 5, 4, 5, 1, 5, 3, 1, 3, 2),
  ('lhasa-apso', 'Lhasa Apso', '🐶', 'A Tibetan monastery sentinel in a floor-length coat.', 'Kept for a thousand years as an indoor watchdog in Tibetan monasteries, the Lhasa Apso is far more independent and self-possessed than its lapdog appearance suggests. It bonds closely with its own people, is naturally suspicious of visitors, and will announce every one of them, but it asks for little exercise. Its floor-length coat requires daily brushing unless kept in a short puppy clip.', 'small', 'utility', 2, 5, 2, 3, 3, 5, 4, 2, 4, 1, 2, 3),
  ('tibetan-terrier', 'Tibetan Terrier', '🐕', 'Not a terrier at all, but a Himalayan good-luck charm.', 'Despite the name this is not a terrier but a Tibetan monastery companion, bred with uniquely large flat feet that work like snowshoes on mountain ground. It is affectionate, adaptable, and sensitive to its owner''s mood, though reserved with strangers and inclined to be a touch stubborn. Its long double coat needs thorough brushing several times a week to prevent matting.', 'medium', 'utility', 3, 5, 3, 4, 4, 4, 3, 3, 3, 3, 2, 4),
  ('chow-chow', 'Chow Chow', '🦁', 'Dignified, aloof, and entirely uninterested in strangers.', 'One of the oldest breeds in the world, the Chow Chow is famous for its lion-like mane, blue-black tongue, and cat-like independence. It is loyal to its own household but genuinely aloof with everyone else, and it does not enjoy handling from people it does not know, which makes early socialisation essential. Its enormous coat sheds heavily and needs frequent brushing, and the breed copes poorly with heat.', 'medium', 'utility', 2, 5, 2, 2, 2, 3, 5, 1, 2, 1, 1, 5),
  ('shar-pei', 'Chinese Shar-Pei', '🐶', 'Ancient Chinese guardian in a coat two sizes too big.', 'Known for its deep wrinkles, blue-black tongue, and distinctive hippopotamus muzzle, the Shar-Pei is calm, quiet, and intensely devoted to its own family. It is naturally suspicious of strangers and other dogs, needing thorough early socialisation and a confident owner. The wrinkles and short bristly coat need regular cleaning and drying to prevent skin infections, which is a genuine ongoing commitment.', 'medium', 'utility', 2, 2, 2, 3, 2, 4, 4, 1, 2, 1, 2, 3),
  ('shiba-inu', 'Shiba Inu', '🦊', 'A cat in a dog suit, and proud of it.', 'The smallest of Japan''s native breeds, the Shiba Inu is bold, alert, and famously independent, keeping itself meticulously clean and holding strong views on being told what to do. It is quiet at home but has an unreliable recall, a strong prey drive, and a real talent for escaping, so off-lead freedom is rarely safe. Its thick double coat sheds dramatically twice a year and is otherwise low-maintenance.', 'small', 'utility', 3, 3, 2, 3, 2, 4, 5, 1, 2, 3, 2, 4),
  ('japanese-spitz', 'Japanese Spitz', '☁️', 'A small white spitz with a huge appetite for company.', 'Developed in Japan in the twentieth century as a companion dog, the Japanese Spitz is bright, affectionate, and considerably easier to train than most spitz breeds. It is devoted to its family, good with children, and suits apartment life well, though it will bark to announce arrivals. Its brilliant white coat is surprisingly easy to maintain, being naturally dirt-resistant and needing brushing only a couple of times a week.', 'small', 'utility', 3, 3, 4, 5, 4, 5, 2, 4, 3, 2, 2, 4),
  ('basenji', 'Basenji', '🐕', 'The barkless dog that yodels instead.', 'An ancient African hunting dog, the Basenji physically cannot bark in the usual way, producing instead a distinctive yodel when it feels the need. It is fastidious, cat-like, and thoroughly independent, with a prey drive and a curiosity that make secure fencing and lead walking non-negotiable. Its short coat needs almost no care, but it feels the cold and will refuse to go out in Irish rain.', 'medium', 'hound', 4, 1, 2, 3, 2, 4, 5, 1, 1, 3, 4, 1),
  ('saluki', 'Saluki', '🐕', 'Desert royalty, built for the long chase.', 'One of the oldest known breeds, prized for millennia across the Middle East for coursing gazelle, the Saluki is elegant, reserved, and deeply attached to its own people. It is gentle and quiet indoors but possesses an overwhelming prey drive and will run for miles after anything that moves, so off-lead exercise is only safe in fully enclosed space. It is sensitive to harsh handling and responds only to patient, gentle training.', 'large', 'hound', 4, 2, 2, 3, 1, 3, 5, 1, 1, 4, 4, 2),
  ('afghan-hound', 'Afghan Hound', '🐕', 'Spectacular to look at, impossible to boss around.', 'Bred to hunt independently across the mountains of Afghanistan, this sighthound is dignified, aloof, and famously indifferent to instruction, consistently ranking near the bottom of obedience trainability lists. It is affectionate with its own household in its own time and needs a secure space to gallop, since recall is essentially theoretical. Its magnificent silky coat is a serious daily grooming commitment and the main reason most owners eventually seek professional help.', 'large', 'hound', 3, 5, 1, 3, 1, 2, 5, 1, 1, 3, 3, 3),
  ('borzoi', 'Borzoi', '🐕', 'A Russian aristocrat with a very long face.', 'Bred by the Russian nobility to course wolves across open steppe, the Borzoi is quiet, gentle, and almost cat-like in its self-containment, forming calm attachments rather than needy ones. It is undemanding indoors and needs less exercise than expected, but it will chase anything running and has minimal recall once the chase begins. Its silky coat needs regular brushing and it is sensitive to certain anaesthetics, which is worth mentioning to any vet.', 'large', 'hound', 3, 4, 2, 3, 1, 2, 4, 2, 1, 3, 2, 4),
  ('rhodesian-ridgeback', 'Rhodesian Ridgeback', '🦁', 'The African lion hound, quiet and immovable.', 'Named for the distinctive ridge of backward-growing hair along its spine, the Ridgeback was bred in southern Africa to track lion and guard the homestead. It is quiet, clean, and calm indoors but powerfully built, strong-willed, and inclined to make its own judgements, which calls for confident and consistent handling. Note that in Ireland the Rhodesian Ridgeback is a restricted breed, which means muzzling and a short lead in public.', 'large', 'hound', 4, 1, 3, 4, 2, 1, 4, 1, 2, 5, 5, 2),
  ('english-mastiff', 'English Mastiff', '🐕‍🦺', 'One of the heaviest dogs alive, and one of the softest.', 'Among the most massive of all breeds, the Mastiff is a calm and famously good-natured giant that spends most of its day asleep and requires only modest walks. It is patient with children and naturally protective without being aggressive, though its sheer weight means training must start in puppyhood while it is still liftable. Owners should budget for a large dog''s food and veterinary bills and accept a lifespan of roughly seven to ten years.', 'large', 'working', 1, 2, 3, 4, 3, 2, 3, 1, 1, 1, 1, 3),
  ('welsh-springer-spaniel', 'Welsh Springer Spaniel', '🐕', 'The quieter, steadier springer.', 'An ancient Welsh gundog distinguished by its rich red and white coat, this breed is calmer and more reserved than the English Springer while remaining every bit as capable in the field. It is deeply devoted to its family, excellent with children, and slightly wary of strangers, making it a better watchdog than most spaniels. It needs substantial daily exercise and its feathered coat requires regular brushing.', 'medium', 'gundog', 4, 3, 4, 5, 4, 2, 2, 3, 3, 4, 3, 4),
  ('clumber-spaniel', 'Clumber Spaniel', '🐕', 'The gentleman''s spaniel, in no particular hurry.', 'The heaviest and slowest of the spaniels, the Clumber was bred for methodical work in dense cover and brings the same unhurried dignity to family life. It is sweet-tempered, exceptionally good with children, and content with far less exercise than other gundogs, though it drools and sheds more than most. Its heavy build makes it prone to weight gain, so portions need watching carefully.', 'large', 'gundog', 2, 3, 3, 5, 4, 3, 3, 3, 2, 1, 2, 4),
  ('flat-coated-retriever', 'Flat-Coated Retriever', '🐕', 'The Peter Pan of retrievers, forever young.', 'Known as the breed that never quite grows up, the Flat-Coat keeps a puppyish exuberance well into old age and greets the world with relentless optimism. It is sociable with everyone, including strangers and other dogs, and needs a great deal of exercise and company to be content. Its glossy black or liver coat needs weekly brushing, and prospective owners should research the breed''s elevated cancer risk with a reputable breeder.', 'large', 'gundog', 5, 3, 4, 5, 5, 2, 1, 3, 3, 5, 3, 4),
  ('nova-scotia-duck-tolling-retriever', 'Nova Scotia Duck Tolling Retriever', '🦆', 'The smallest retriever, with the loudest opinion.', 'Bred in Canada to lure ducks within range by playing at the water''s edge, the Toller is compact, intensely driven, and startlingly athletic for its size. It is clever and highly trainable but needs a real job, and it is known for a piercing scream of excitement that surprises most new owners. Its water-repellent double coat sheds seasonally and needs regular brushing.', 'medium', 'gundog', 5, 3, 4, 4, 4, 2, 2, 3, 4, 5, 3, 4),
  ('brittany', 'Brittany', '🐕', 'A compact French pointer with limitless stamina.', 'Smaller than most pointing breeds but no less capable, the Brittany is agile, quick to learn, and happiest working across open ground all day. It is affectionate and sensitive, responding badly to harsh correction and well to enthusiastic reward-based training. It needs an hour or more of real exercise daily and makes an excellent companion for runners and hillwalkers.', 'medium', 'gundog', 5, 2, 4, 4, 4, 2, 2, 3, 3, 5, 3, 3),
  ('pointer', 'Pointer', '🐕', 'Bred for one thing: covering ground.', 'The classic English Pointer is a lean, powerful running machine developed to quarter open country for hours and freeze on point when it finds game. It is even-tempered and friendly at home but needs an enormous amount of exercise, and it is a genuinely poor fit for anyone hoping for a housebound companion. Its short coat is easy to care for and offers little insulation in cold wet weather.', 'large', 'gundog', 5, 1, 3, 4, 3, 1, 3, 2, 2, 5, 3, 2)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Table: articles  (Paws & Pointers advice content, /guides)
-- Same shape as breeds: public catalog data, anyone can read, writes go
-- through the service_role key (the admin interface). See docs/data-model.md.
-- ---------------------------------------------------------------------------

-- Table: articles (Paws & Pointers advice content)
-- Public catalog data, same shape as breeds: anyone can read, writes go
-- through the service_role key (the admin interface). See docs/data-model.md.
create table if not exists public.articles (
  id            text        primary key,  -- slug, e.g. 'dog-ownership-law-ireland'
  title         text        not null,
  excerpt       text        not null,
  emoji         text        not null,
  category      text        not null,
  tags          text[]      not null default '{}',
  reading_time  smallint    not null check (reading_time between 1 and 60),
  body          text        not null,      -- markdown
  published_at  date        not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

grant select on table public.articles to anon, authenticated;

drop policy if exists "Articles are publicly readable" on public.articles;
create policy "Articles are publicly readable"
  on public.articles
  for select
  to anon, authenticated
  using (true);

-- Seed: the ten Irish dog-care articles (Paws & Pointers launch content).
insert into public.articles
  (id, title, excerpt, emoji, category, tags, reading_time, body, published_at)
values
  ('bringing-your-new-dog-home-ireland', 'Bringing Your New Dog Home: The First 30 Days in an Irish Household', 'A week-by-week guide to settling a new dog or puppy into an Irish home — what to buy, what to skip, how to handle the first night, and the legal boxes to tick in month one.', '🏡', 'Welcoming a New Dog', ARRAY['new dog','puppy','settling in','Ireland']::text[], 9, 'The first month with a new dog is the one everyone remembers, and it''s also the one most people get slightly wrong. The instinct is to fill it — visitors, walks, the beach, the in-laws, a trip to the pet shop every second day. The dog''s experience of that is a stranger''s house, unfamiliar smells, and no idea when anything is going to happen next.

The dogs who settle fastest are almost always the ones whose first month was quiet.

Here''s how to structure it.

## Before the dog arrives

**Decide the rules now, with everyone in the house.** Sofa or no sofa. Upstairs or not. Who does the morning walk. Who feeds. A dog can learn almost any rule; what it can''t learn is a rule that changes depending on which human is in the room.

**Set up one safe space.** A crate, a covered bed in a corner, or a utility room — somewhere the dog can go and be left completely alone. This is non-negotiable and it is the single most useful thing you will set up. Children need to be told, clearly and repeatedly, that the dog in its bed is off limits.

**What you actually need on day one:**

- Bowls for food and water
- A collar with an ID tag, and a lead (see the legal section below — the tag is a legal requirement in Ireland, not a nicety)
- A bed and a crate or pen if you''re using one
- Whatever food the breeder, rescue or previous owner was feeding
- Poo bags
- A soft brush
- Two or three durable chew items

**What you don''t need yet:** a wardrobe of coats, six squeaky toys, a raised feeder, a car harness for the dog who hasn''t yet been in a car. Buy these once you know the dog.

**Ask for the current food.** Whatever the dog has been eating, get a bag of it or at least the exact name. Changing home and changing diet in the same week is the most reliable way to produce a week of diarrhoea. You transition food over seven to ten days, once the dog is settled — not on day one.

## Days 1–3: do almost nothing

Bring the dog home at a quiet time, ideally the start of a few days when someone will be around. Skip the airport-arrivals welcome party.

Take the dog straight to the garden or a quiet patch of grass before going inside. Then let it into the house and let it explore at its own pace. Don''t follow it around. Don''t call it over. Sit down, be boring, let it come to you.

**The first night is usually the hard one.** A puppy that has just left its litter will cry, and this is not manipulation — it has never in its life slept alone. Most Irish households find the easiest path is a crate or bed beside your own bed for the first week or two, then moving it gradually to where you actually want it. This is much less work than three weeks of downstairs howling.

For an adult rescue dog, expect the opposite: a dog that seems oddly quiet and well-behaved. That''s not the real dog yet. It''s a dog that hasn''t unpacked.

**No visitors for the first three days.** None. The dog does not need to meet your sister.

## Days 4–14: routine, and the first vet visit

Now you build the shape of the day. Dogs are far more settled by predictable rhythm than by variety.

- Feed at the same times (puppies: three or four small meals a day up to about four months; adults: usually twice)
- Toilet break first thing, after every meal, after every nap, and last thing at night
- Two or three short, calm outings rather than one long one
- A clear "nothing is happening now" period each day, in the safe space

**Book the vet in the first week.** Even if the dog is fully vaccinated, an early health check does three things: it confirms what you''ve taken on, it establishes a relationship with a practice before you need one urgently, and it gets the microchip details checked. Ask the vet to scan the chip and confirm the number matches the paperwork you were given.

**Toilet training, briefly:** take the dog out on a schedule rather than waiting for signals, reward outdoors within a second or two of finishing, and clean indoor accidents with an enzymatic cleaner — not bleach or ordinary disinfectant, which can leave an ammonia note that reads as a toilet marker. Irish winters mean a lot of these trips happen in the rain, at night, in your dressing gown. Everyone does this. It passes.

**If you already have pets,** the introductions are their own project and shouldn''t be rushed into week one. See our guide to [bringing a dog into a home that already has pets](/guides/introducing-a-dog-to-other-pets).

## Days 15–30: careful, deliberate socialisation

Socialisation is not "meeting lots of dogs." It''s the dog learning that ordinary things are unremarkable. A bin lorry on a Tuesday. A man in a hi-vis. The Luas. Cattle in a field. A hoover. Rain hammering off a conservatory roof.

The rule is **distance and choice**. The dog should be far enough from the new thing that it can look at it and then look away. If it can''t look away, you''re too close. Never hold a nervous dog in place near something it''s worried about — that''s how you build a fear, not a tolerance.

For puppies, the critical window closes around 16 weeks, which puts real pressure on households who wait for the full vaccination course. Talk to your vet about carrying the puppy outdoors, or arranging meetings with known, vaccinated adult dogs, so those weeks aren''t lost.

**Start alone-time training in week three, not month three.** Leave for two minutes. Come back before the dog is upset. Build up. Separation problems are far easier to prevent than to treat, and a dog that has never once been alone until you go back to the office in September is a dog headed for trouble.

## The legal checklist for month one

Ireland has specific requirements and the deadlines come faster than people expect:

- **Microchip.** A dog must be microchipped and registered on an approved database, and this must be done before it''s sold or given away. Make sure the registration is transferred into *your* name and your current phone number — an unchanged chip record is the single most common reason a found dog doesn''t get home.
- **Dog licence.** Required for any dog over four months old. €20 for a year, €140 for the dog''s lifetime, available through licences.ie or your local post office.
- **ID on the collar.** Your dog must wear a collar or harness bearing your name and address. The on-the-spot fine for not doing so is €200.

Full detail — including restricted breeds and the fines that rise in September 2026 — is in our [guide to the legal side of dog ownership in Ireland](/guides/dog-ownership-law-ireland).

## What normal looks like at four weeks

Not "perfect." At the one-month mark, a reasonable outcome is: the dog eats well, sleeps through most of the night, toilets outside most of the time, can be left alone for a short spell without panic, and has started to show you some personality — including some behaviour you didn''t sign up for.

That last part is normal. A rescue dog in particular often gets *more* difficult around weeks three to six, not less, as it relaxes enough to test things. That''s a sign the settling worked.

If you''re still in the research stage and not sure which breed suits your household, our [breed matching quiz](/?start=quiz) takes about two minutes and scores your lifestyle against every breed in our matcher.', '2026-08-13'),
  ('cost-of-owning-a-dog-ireland', 'What a Dog Really Costs in Ireland — and Whether to Insure', 'Honest, itemised figures for the first year and every year after, real Irish vet prices, how pet insurance works here, and what to do if you can''t afford a bill.', '💶', 'Money & Planning', ARRAY['cost','budget','pet insurance','vet bills','Ireland']::text[], 10, 'The purchase price of a dog is the least significant number in this article. People budget for it carefully and then get blindsided by year three, when a cruciate ligament goes and they''re looking at a four-figure bill with no insurance.

Here is what it actually costs to keep a dog in Ireland, with the awkward numbers included.

> Prices below are typical ranges from Irish practices and retailers as of 2026. Dublin sits at the higher end of every veterinary range; rural practices are often meaningfully cheaper. Always confirm with your own vet.

## Year one

The expensive year, because everything happens at once.

| Item | Typical cost |
|---|---|
| Acquisition — rescue adoption fee | €80–€350 |
| Acquisition — reputable breeder | €800–€3,000+ |
| Puppy vaccination course | €120–€200 (often ~€65 per visit) |
| Microchipping | €20–€30 |
| Dog licence | €20/year or €140 lifetime |
| Neutering or spaying | €150–€450 depending on size and sex |
| Bed, crate, bowls, collar, lead, harness | €120–€300 |
| Food, first year | €400–€900 |
| Parasite prevention | €120–€250 |
| Puppy classes / basic training | €100–€250 |
| Pet insurance | €240–€720 |

**Realistic year-one total: €1,400–€3,000**, excluding the purchase price of the dog itself and excluding anything going wrong.

## Every year after

| Item | Typical annual cost |
|---|---|
| Food | €400–€900 |
| Annual booster and health check | €65–€120 |
| Parasite prevention | €120–€250 |
| Dog licence | €20 |
| Insurance | €240–€720 |
| Grooming (breed dependent) | €0–€600 |
| Toys, beds, replacements | €80–€200 |
| Boarding or dog sitting while away | €0–€600 |

**Realistic ongoing total: €900–€2,500 a year**, with grooming being the biggest swing factor.

A short-coated Labrador needs a brush and the occasional bath. A Cocker Spaniel, Poodle, Doodle or Bichon needs professional grooming every six to eight weeks at €50–€90 a time — that''s €400–€700 a year, indefinitely, and it is genuinely non-optional for coat and skin health. This is the cost that most surprises new owners, and it''s decided the day you choose the breed. Our [breed matching quiz](/?start=quiz) factors grooming demands into its scoring.

## The numbers that actually hurt

These are the ones to plan for:

| Procedure | Typical Irish cost |
|---|---|
| Standard consultation | €55–€80 |
| Out-of-hours emergency consultation | €100–€180 (exam only) |
| Blood work | €80–€180 |
| X-ray | €80–€150 per image |
| Dental scale, polish and extractions under GA | €200–€450+ |
| Foreign body removal (the eaten sock) | €800–€2,000 |
| Cruciate ligament repair | €1,500–€3,500 |
| Emergency surgery, general | €800–€2,500+ |
| Long-term medication (e.g. epilepsy, arthritis) | €30–€120 per month, for life |

Dental disease deserves a special mention because it''s so common and so under-anticipated. A large proportion of dogs over three have some periodontal disease, and a dental under general anaesthetic is a routine several-hundred-euro event that many insurance policies exclude or limit. Daily tooth brushing genuinely reduces this, and costs €8 for a brush and dog-safe toothpaste. Never use human toothpaste — many contain xylitol, which is toxic to dogs.

## Pet insurance in Ireland

Premiums typically run **€20–€60 a month** for a dog, depending on age, breed and cover level. Providers active in the Irish market include Allianz, Petinsure, PetSure and others; comparing directly is worthwhile because the structures differ significantly.

**The four policy types:**

- **Accident only** — cheapest, covers injuries not illnesses. Limited value.
- **Time limited** — covers a condition for 12 months from onset, then stops. Fine for one-off injuries, useless for chronic disease.
- **Maximum benefit** — a fixed pot per condition, no time limit. Once the pot''s gone, it''s gone.
- **Lifetime** — an annual limit that resets each year, for as long as you keep renewing. The most expensive and the only one that genuinely handles chronic illness.

**What to check before buying:**

- **Pre-existing conditions are excluded, always.** This is the reason to insure a young, healthy dog. Insuring after a limp appears is closing the stable door.
- **Excess** — both the fixed amount and whether there''s a percentage co-payment. Many Irish policies add a co-payment once the dog passes a certain age (often 8 or 9), which can quietly turn a €2,000 claim into a €700 bill.
- **Dental cover** — frequently excluded or conditional on annual check-ups
- **Breed exclusions** — some policies exclude conditions common to a breed
- **Upper age limits** for taking out a new policy
- **Whether third-party liability is included** — worth having in Ireland, where an owner is liable for damage a dog does to livestock

**Is it worth it?** Over an average dog''s life, insurers make money, so on pure expected value most people pay in more than they take out. But insurance isn''t an investment — it''s protection against the one bill you cannot pay. The question is not "will I come out ahead" but "could I write a cheque for €3,000 next Tuesday?"

**The alternative** is self-insuring: a standing order of €40 a month into a separate account you don''t touch. This works, on two conditions — that you actually do it every month, and that the emergency doesn''t arrive in year one before the fund has built up.

## Practice health plans

Many Irish practices offer monthly plans (roughly €15–€30) bundling consultations, vaccinations, boosters and parasite treatments, often with discounts on procedures. These frequently save money if you''d buy all the components anyway.

They are **not insurance**. They cover the predictable and nothing else. A health plan plus lifetime insurance is a reasonable combination; a health plan alone leaves you exposed.

## If you genuinely can''t afford a bill

Say so, early and directly. Vets deal with this constantly and there are usually more options than you''d guess — a staged diagnostic approach, a cheaper treatment path, or a payment arrangement. What doesn''t help anyone is waiting until the problem is surgical.

Ireland has real support:

- **The Irish Blue Cross** provides affordable veterinary treatment from its Inchicore clinic in Dublin and a network of mobile clinics
- **The ISPCA** and local SPCAs offer reduced-cost veterinary services subject to eligibility
- **Dogs Trust Ireland** runs subsidised neutering schemes

These are reduced-cost rather than free, and generally require you to demonstrate need. Contact them before a crisis, not during one.

## The honest summary

Budget **€1,500–€2,500 for year one** and **€1,000–€2,000 a year after that** for a medium-sized dog, plus either insurance or a genuine emergency fund. If those numbers are uncomfortable, that''s useful information to have before the dog arrives rather than after.

**Sources:** [Vet Costs in Ireland](https://newtoireland.ie/pets-animals/vet-costs-ireland), [Village Vets price list](https://www.villagevets.ie/pricelist), [An Post — Dog Licence](https://www.anpost.com/Government-Services/Dog-Licence), [Irish Blue Cross](https://www.bluecross.ie/), [ISPCA](https://ispca.ie/)', '2026-08-13'),
  ('dog-nutrition-guide-ireland', 'Feeding Your Dog Well: A Nutrition Guide for Irish Owners', 'How to read an Irish or EU dog food label, how much to feed, when to change life stages, and how to tell marketing from nutrition — without spending a fortune.', '🥘', 'Nutrition', ARRAY['nutrition','dog food','feeding','FEDIAF','Ireland']::text[], 11, 'Dog food is one of the most heavily marketed products in any Irish supermarket or pet shop, and almost none of the marketing is about nutrition. "Grain free," "ancestral," "human grade," "no fillers" — these are positioning statements, not nutritional claims, and none of them is regulated in the way you''d assume.

The good news is that the actual regulation is quite robust, and once you know where to look on a label, you can assess any food in about ninety seconds.

## The single most important word on the bag: "complete"

Under EU pet food rules, which apply in Ireland, a food must be labelled as either:

- **Complete** — it contains everything a dog needs, in the right proportions, and can be fed as the only food.
- **Complementary** — it does not. It''s a topper, a treat, a mixer, or a part of a diet. Fed alone, it will cause deficiencies over time.

Plenty of attractive, expensive, well-photographed products are complementary. Raw "toppers," many fresh-food pouches, and most tinned "chunks in jelly" sold as a mixer fall into this category. If you''re feeding one thing and one thing only, that thing must say **complete**.

The nutritional benchmarks behind "complete" come from **FEDIAF**, the European pet food federation, whose Nutritional Guidelines set the minimum and maximum levels for every nutrient at each life stage. A food labelled complete and formulated to FEDIAF levels is, nutritionally, doing its job — whether it costs €25 or €90 a bag.

## How to read the label in ninety seconds

**1. Life stage.** Puppy/growth, adult/maintenance, or senior. Large-breed puppies specifically need a food formulated for large-breed growth — controlled calcium and energy density matter a great deal for joint development in a dog that will finish over 25kg. Feeding a standard puppy food to a Labrador or German Shepherd pup is a genuine risk, not a preference.

**2. Composition list.** Ingredients are listed by weight *at the time of processing*. This is why "fresh chicken" often appears first in premium foods — fresh chicken is roughly 70% water, so after cooking it contributes far less than its position suggests. **Chicken meal** or **dried chicken** looks less appealing but is water-removed, so it delivers more actual protein per unit of weight. Neither is better; you just can''t compare them by position alone.

Watch for **"meat and animal derivatives"** with no percentage. That''s legal but uninformative — it means the manufacturer can vary the source batch to batch. A named percentage ("chicken 26%") tells you more.

**3. Analytical constituents.** Protein, fat, fibre, ash, moisture. Useful for comparison, but only between foods of the same moisture level. A wet food at 8% protein and a dry food at 26% protein may be nutritionally identical once you account for the wet food being 80% water.

**4. Feeding guide.** Treat this as a starting point, not a prescription — see below.

**5. Additives panel.** Vitamins and trace elements listed here are the fortification that makes a food complete. A "natural, no additives" food that is also labelled complete has added vitamins and minerals; they''re just described differently.

## How much to feed

The number on the bag is calculated for an average, entire, moderately active dog. Yours is probably not that dog. Neutered dogs in particular need meaningfully less — often 10–20% less — than the guide suggests, and this is one of the most common causes of creeping weight gain in Irish pets.

**Feed to body condition, not to the bag.** Once a week:

- Run your hands along the ribcage. You should feel the ribs easily, with a thin covering — like the back of your hand, not like your knuckles and not like your palm.
- Look from above. There should be a visible waist behind the ribs.
- Look from the side. The belly should tuck up, not run parallel to the ground.

Adjust by about 10% at a time and give it three weeks before judging.

**Weigh the food.** A "cup" is not a unit and kitchen scoops vary by 30% or more. A €12 digital scale removes the single biggest source of overfeeding in Irish households.

**Treats count.** Treats and chews should be roughly 10% of daily calories at most. A large dental chew can be 100–150 kcal — a serious chunk of a small dog''s day. If you''re training heavily, take the training treats out of the daily meal ration.

## Life stages

**Puppies** (to roughly 12 months, or 18 months for giant breeds): growth food, three or four meals a day up to about four months, then two or three. Transition to adult food when growth slows, not on a birthday.

**Adults**: two meals a day suits most dogs. One meal is workable but leaves a long gap; deep-chested breeds are often better on two or three smaller meals, partly for comfort and partly as one small element of bloat risk management.

**Seniors** (roughly 7+ for large breeds, 9+ for small): the real changes are calorie needs falling and joint, kidney and dental issues becoming more likely. "Senior" foods vary wildly — some are just lower calorie, some add joint support. This is the life stage where a conversation with your vet is worth more than a label.

## Changing food safely

Transition over **seven to ten days**: 25% new for three days, 50% for three days, 75% for two days, then 100%. Sudden changes are the most common cause of a week of loose stools, and they''ll make you wrongly conclude the new food "doesn''t suit" the dog.

If you''ve just brought a dog home, don''t change the food and the house in the same week. Get the dog settled first.

## Things that come up a lot in Ireland

**Grain-free.** Genuine grain allergy in dogs is uncommon; food sensitivities more often involve a protein source. Grain-free foods have been the subject of ongoing investigation internationally regarding a possible association with dilated cardiomyopathy in some dogs, and the picture is still not fully resolved. Unless your dog has a diagnosed grain issue, there''s no default reason to choose grain-free — and if you do, it''s a reasonable thing to mention to your vet.

**Raw feeding.** It can be done properly, but "properly" means a complete, FEDIAF-compliant commercial raw product rather than a home-assembled mix, plus strict handling hygiene. Raw diets carry a real bacterial risk to the household — which matters more if there are young children, elderly or immunocompromised people, or other pets in the house. If you go this route, buy a product labelled complete and store and handle it as you would raw chicken for humans.

**Bones.** Cooked bones splinter and should never be given. Raw weight-bearing bones are hard enough to fracture teeth. Neither is as safe as it''s often presented, and dental fractures are expensive.

**Toxic foods worth memorising:** chocolate, xylitol (in sugar-free gum, some peanut butters and increasingly in "diet" baked goods), grapes and raisins in any form — which makes Christmas pudding, mince pies and barmbrack a seasonal Irish hazard — onions, garlic, leeks and chives, macadamia nuts, alcohol, and cooked bones. Grape and raisin toxicity is idiosyncratic: there''s no established safe dose, and a small quantity can cause kidney failure in some dogs. Any ingestion is a same-day call to your vet.

**Multi-pet households:** cat food is not a complete diet for a dog, and dog food is dangerously incomplete for a cat — cats need taurine that dog food doesn''t reliably provide. Feed separately, and put the cat''s bowl somewhere the dog physically cannot reach. Raised feeding stations or a baby gate with a cat flap solve this cleanly. It''s also worth knowing that dogs raiding the litter tray is common, harmless-ish, and best solved with a covered tray in a dog-proof spot.

## What good actually costs

A complete, FEDIAF-compliant dry food from a mid-range brand will run roughly €40–€70 a month for a 20kg dog in Ireland. Premium fresh and raw subscription services can be three to four times that. The premium is buying palatability, convenience and ingredient sourcing — not, in most cases, a nutritional gap.

The dogs who do best are not usually the ones on the most expensive food. They''re the ones at a healthy weight, on a consistent complete diet, with their treats counted.

**Sources:** [FEDIAF Nutritional Guidelines](https://europeanpetfood.org/self-regulation/nutritional-guidelines/), [FEDIAF — Labelling](https://europeanpetfood.org/self-regulation/labelling/)', '2026-08-13'),
  ('dog-ownership-law-ireland', 'The Legal Side of Owning a Dog in Ireland: Licences, Microchips, ID and Fines', 'Everything an Irish dog owner is legally required to do — licence costs, microchipping deadlines, ID tags, restricted breeds, the XL Bully ban, and the on-the-spot fines rising in September 2026.', '⚖️', 'Law & Responsibility', ARRAY['dog licence','microchip','Irish law','restricted breeds','XL Bully']::text[], 10, 'Most Irish dog owners are compliant with about two-thirds of the law and have no idea which third they''re missing. Usually it''s the collar tag or a chip registered to a previous owner. Both are cheap to fix and both carry real fines.

Here''s the complete picture, current as of August 2026.

> This is a plain-English summary for dog owners, not legal advice. Local authorities apply and enforce these rules, so your county council''s dog warden service is the definitive source for your area.

## 1. The dog licence

**Every dog over four months old must have a licence.** There are three types:

| Licence | Cost | Covers |
|---|---|---|
| Individual | €20 | One dog, 12 months |
| Lifetime | €140 | One dog, for its life |
| General | €400 | Multiple dogs at one premises, 12 months (kennels, breeders) |

You must be at least 16 to hold a licence. Buy online at **licences.ie** or at any post office. Keep it — you must be able to produce it for a dog warden or Garda on request.

**The lifetime licence maths:** €140 versus €20 a year means it pays for itself after seven years. For a puppy, that''s almost always the better buy. For an older rescue dog, the annual licence usually makes more sense.

**Fine for no licence: €150.**

## 2. Microchipping

Microchipping is **mandatory**. A dog must be chipped and registered on a government-approved database, and — this is the part people miss — **it must be done before the dog is sold, supplied or otherwise transferred to a new keeper.** Puppies must be chipped and registered by 12 weeks old.

The chip itself costs roughly €20–€30 at a vet, and some welfare organisations run reduced-cost or free chipping days.

**The critical bit: transferring the registration.** A microchip is a number. It''s useless unless that number points to a database record with *your* name and *your* current mobile. When you take on a dog:

1. Get the microchip number and the certificate from the seller, breeder or rescue
2. Contact the database it''s registered with (the certificate names it) and transfer it to you
3. Update the record every time you move house or change your phone number

Ask your vet to scan the chip at the first visit and confirm the number matches your paperwork. A mismatch is worth catching on a calm Tuesday rather than the night your dog goes missing.

## 3. Identification on the collar

Separate from the chip, and frequently overlooked: **your dog must wear a collar or harness with your name and address on it** when out in public. A tag or engraved plate satisfies this.

**Fine: €200.**

Most people put a phone number on the tag, which is sensible and far more useful in practice — but the legal requirement is name and address, so include both. Space is tight on a small tag; an address line and a mobile number on the reverse covers you.

## 4. Control in public

You must keep your dog **under effectual control** in a public place. That means either on a lead or genuinely responsive to you — a recall that works reliably, not a recall that works in the garden.

**Fine for a dog not under effectual control: €300.**

Local authorities can also make bye-laws requiring dogs to be on leads in specified areas — town parks, beaches during the summer months, playgrounds. These vary by county, so check your council''s website before assuming an off-lead spot is legal.

## 5. Restricted breeds

Ten breeds — and **any cross containing them** — face additional rules in public under the Control of Dogs Regulations 1998:

1. American Pit Bull Terrier
2. English Bull Terrier
3. Staffordshire Bull Terrier
4. Bull Mastiff
5. Dobermann Pinscher
6. Rottweiler
7. German Shepherd (Alsatian)
8. Rhodesian Ridgeback
9. Japanese Akita
10. Japanese Tosa

In a public place, a dog of these breeds must be:

- **Muzzled**
- **On a strong lead no longer than two metres**
- **Held by a person over 16** who is capable of controlling it
- **Wearing a collar with the owner''s name and address**

The "any cross" clause is broad and catches a lot of shelter dogs of uncertain parentage. If you''re adopting a dog described as a "shepherd cross" or "staffy cross," ask the rescue directly whether they consider it restricted, and plan for muzzle training either way. A muzzle-trained dog is a calmer, safer dog in a vet''s waiting room regardless of breed.

Working exemptions exist for An Garda Síochána, Revenue, search and rescue and similar services.

## 6. The XL Bully ban

This is separate from and stricter than the restricted-breed rules.

- **From 1 October 2024:** it became illegal to import, breed, rehome or sell an XL Bully in Ireland.
- **From 1 February 2025:** it became illegal to own one without a **Certificate of Exemption**.

To hold a Certificate of Exemption, the dog must be **licensed, microchipped and neutered** (unless a vet certifies it medically unfit for the procedure). The certificate itself is free, and it ties the dog to a registered address — moving house means applying for an updated certificate.

Penalties for breaching the rules run to **fines of up to €2,500, up to three months'' imprisonment, or both**, and a dog without an exemption can be seized. Over 1,400 certificates of exemption had been issued as of early 2026.

If you are offered a dog described as an "XL Bully type," "bully," or similar, do not take it on without resolving its legal status first.

## 7. Dog fouling — and the September 2026 increase

Not cleaning up after your dog is an offence. The on-the-spot fine has been **€150**, and **from 1 September 2026 it rises to €250**, in line with a broader increase in litter fines.

Carry more bags than you think you need. The fine applies whether or not anyone is watching, and councils increasingly use wardens in plain clothes.

## 8. Straying, and livestock

A dog found straying can be seized and impounded. **Fine: €150.** Impounded dogs are held for a minimum of five days.

Livestock worrying is the most serious everyday risk for rural and semi-rural owners. Under the Control of Dogs Act 1986 the owner is liable for damage a dog does to livestock, and in defined circumstances a farmer is entitled to shoot a dog worrying sheep. Damages agreed in Irish cases have run into thousands of euro for a single incident. There''s more detail in our [guide to walking your dog in the Irish countryside](/guides/walking-your-dog-in-ireland).

## The one-page summary

| Requirement | Detail | Fine if you don''t |
|---|---|---|
| Dog licence | Over 4 months; €20/yr, €140 lifetime | €150 |
| Microchip | Before sale/transfer; by 12 weeks | Prosecution |
| Collar ID | Name and address in public | €200 |
| Effectual control | On lead or reliable recall | €300 |
| Clean up fouling | Everywhere, always | €150 → €250 from 1 Sept 2026 |
| Not straying | Secure boundaries | €150 |

Three things to do this week if you''re not sure: check your chip registration is in your name, check the tag on the collar has your address on it, and check whether your licence is in date.

**Sources:** [Citizens Information — Dog licences and ownership](https://www.citizensinformation.ie/en/environment/pets-and-wildlife/control-of-dogs/), [Citizens Information — Ban on XL Bully dogs in Ireland](https://www.citizensinformation.ie/en/environment/pets-and-wildlife/ban-on-xl-bully-dogs-in-ireland/), [An Post — Dog Licence](https://www.anpost.com/Government-Services/Dog-Licence), [gov.ie — Ban on XL Bully dogs](https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/ban-on-xl-bully-dogs/)', '2026-08-13'),
  ('finding-a-vet-in-ireland', 'Finding and Working With a Vet in Ireland', 'How to choose a veterinary practice in Ireland, what happens at the first appointment, how out-of-hours emergency care works, and how to get more out of every consultation.', '🩺', 'Veterinary Care', ARRAY['vet','veterinary','emergency','Ireland','health']::text[], 9, 'Most people choose a vet the way they choose a plumber: whoever is nearest, at the moment they need one. That''s fine right up until 11pm on a bank holiday Sunday, when it becomes the most expensive decision you''ve made all year.

Choosing deliberately, before you need to, takes an afternoon.

## Check the practice is registered

Every practising veterinary surgeon in Ireland must be registered with the **Veterinary Council of Ireland (VCI)**, and veterinary premises must also be registered. The VCI maintains a public register you can search. This is a quick sanity check and worth doing — particularly if you''re considering a mobile service or a clinic operating out of an unusual premises.

Veterinary nurses are separately registered with the VCI too. A practice with registered nurses running nurse clinics is usually a practice that has invested in preventive care, and nurse appointments (weight checks, nail trims, post-op checks, dental advice) are typically much cheaper than a vet consult.

## What to actually look for

**Distance matters more than you think.** Not for routine visits, but for the day your dog is bleeding or in respiratory distress. A practice 15 minutes away that you can reach without a motorway is worth more than a slightly better one 45 minutes away.

**Ask directly about out-of-hours.** This is the question that separates practices. Some Irish practices run their own 24-hour rota. Others refer to a dedicated emergency clinic — Dublin, Cork and a handful of other cities have these; large parts of the country do not. Some have a reciprocal arrangement with neighbouring practices.

Ask: *"If I ring at 2am on a Sunday, what happens? Who answers, and where do I drive to?"*

Get the answer now and put the number in your phone under something you''ll find while panicking. **Vet — emergency** works.

**Ask about facilities.** Does the practice have in-house bloods, X-ray, ultrasound? In-house diagnostics mean results in an hour rather than three days, which changes outcomes in acute cases. If they refer for surgery or imaging, ask where to — you want to know the referral centre before you need it.

**Ask about payment.** Irish practices generally require payment at the time of treatment. Ask whether they offer payment plans, and whether they deal directly with insurers or expect you to claim back. Most expect you to pay and claim.

**Ask about health plans.** Many Irish practices now offer a monthly health plan bundling consultations, vaccinations, boosters and parasite treatments, often with a discount on procedures. These can be good value if you''d use all the elements anyway — but read what''s included. They are not insurance and cover nothing unexpected.

## The first appointment

Book a health check within the first week of bringing a dog home, even a healthy adult.

**Bring with you:**

- Any vaccination card or health records
- The microchip number and certificate
- A recent stool sample if the practice asks for one
- The name of the food the dog is currently on
- A written list of your questions — you will forget them otherwise

**What should happen:** a nose-to-tail physical exam, weight, temperature, heart and chest, teeth, ears, eyes, skin, abdomen palpation, and a microchip scan.

**Ask the vet to scan the chip and read the number back to you.** Confirm it matches your paperwork. This catches unregistered chips, chips still registered to a breeder, and — occasionally — chips that have migrated or failed. It takes ten seconds and it is the highest-value ten seconds of the appointment.

## Vaccination, in brief

Core vaccination in Ireland covers **distemper, hepatitis (adenovirus), parvovirus and leptospirosis**. Puppies typically get a primary course of two or three injections a few weeks apart, finishing at around 10–12 weeks, with a first booster about a year later. **Kennel cough** (bordetella/parainfluenza) is a separate, usually intranasal vaccine — non-core, but required by most Irish boarding kennels and worth having if your dog goes to daycare, training classes or groomers.

Leptospirosis is worth a specific mention in Ireland: it''s spread through rat urine and contaminated water, and a dog that swims in rivers, drinks from ditches or lives near farmland or waterways is at real risk. It''s also a zoonosis — it can infect people. This vaccine typically needs annual boosting.

**Rabies** is not required for dogs living in Ireland, but is required for travel. If there''s any chance of a trip to the UK or Europe, mention it early — the rabies vaccine has a **21-day waiting period** before travel is permitted, and people routinely discover this two weeks before a ferry.

Full detail on schedules and parasite timing is in our [Irish parasite and prevention calendar](/guides/parasite-prevention-calendar-ireland).

## Getting more out of a consultation

A standard consult in Ireland is typically 10–15 minutes and costs somewhere in the region of €55–€80, with Dublin practices at the higher end. That''s not long. To use it well:

**Lead with the actual concern.** Vets are used to the "oh, and one more thing" at the door, but the thing at the door is usually the important one. Say it first.

**Bring evidence.** A 20-second phone video of a limp, a cough, a seizure or an odd gait is worth more than any description. Dogs are famously asymptomatic in the consulting room. Photograph anything that changes — a lump, a rash, a wound — with something for scale.

**Know the numbers.** How long has it been going on? How often? Has the dog''s appetite, drinking, or toileting changed? Weight change? These are the questions you''ll be asked and "I''m not sure" costs you diagnostic time.

**Ask what the plan is if this doesn''t work.** A good answer tells you whether you''re on a defined path or guessing.

**Ask about cost before agreeing.** It is entirely normal and reasonable to ask "roughly what will that come to?" before consenting to diagnostics. Any decent practice will tell you, and will often offer a staged approach — do the cheap test first, see what it shows.

## When to go immediately, without ringing first

Some things don''t wait for an appointment. Go straight in, ringing from the car:

- Difficulty breathing, or gums that are pale, blue or brick red
- Collapse or inability to stand
- A seizure lasting more than a few minutes, or repeated seizures
- **Bloat signs** — a swollen, hard abdomen with unproductive retching, restlessness and drooling. This is a surgical emergency measured in hours, and it disproportionately affects deep-chested breeds.
- Suspected poisoning — bring the packaging
- Straining to urinate and producing nothing
- Uncontrolled bleeding
- Being hit by a car, even if the dog seems fine — internal injury can present hours later
- A bitch in labour straining hard for more than 30 minutes with no puppy

**Emergency consultations cost more** — typically €100–€180 for the initial exam alone, before anything is done. That''s not a reason to delay. It''s a reason to have insurance or a savings buffer, which we cover in [what a dog really costs in Ireland](/guides/cost-of-owning-a-dog-ireland).

## If money is genuinely tight

Ireland has real options and they are not widely enough known:

- **The Irish Blue Cross** provides affordable veterinary treatment through its clinic in Inchicore, Dublin 8 and a network of mobile clinics, handling roughly 16,000 visits a year
- **The ISPCA** and local SPCAs (**DSPCA**, **Cork SPCA**, **Galway SPCA** and others) offer reduced-cost veterinary services, usually subject to eligibility
- **Dogs Trust Ireland** operates subsidised neutering schemes

These services generally require you to demonstrate financial need, and they are reduced-cost rather than free. Contacting them early — before a small problem becomes a surgical one — is far better than waiting.

**Sources:** [Veterinary Council of Ireland](https://www.vci.ie/), [The Irish Blue Cross](https://www.bluecross.ie/), [ISPCA](https://ispca.ie/), [Dogs Trust Ireland](https://www.dogstrust.ie/)', '2026-08-13'),
  ('fireworks-storms-anxious-dogs-ireland', 'Fireworks, Storms and Halloween: Helping a Frightened Dog in Ireland', 'Halloween in Ireland is weeks long and storm season runs all winter. How to prepare a noise-sensitive dog, what to do on the night, and what actually helps long term.', '⛈️', 'Behaviour & Wellbeing', ARRAY['fireworks','Halloween','storms','anxiety','noise phobia','Ireland']::text[], 9, 'Irish dog owners have a harder time with this than most. Halloween here isn''t one night — fireworks and bangers start weeks in advance and continue well into November. Then storm season arrives, with named Atlantic storms rolling in from October through March. That''s roughly half the year with unpredictable loud noise.

The good news: noise fear responds well to preparation, and the preparation is cheap. The bad news: it needs to start in September, not on 30 October.

## Why Halloween is worse here

Under Irish law, only **Category F1 fireworks** — party poppers, some sparklers, ground spinners — can be legally bought by the public, and importing even those requires a licence. Bangers are illegal for the general public to import, possess or use.

None of this stops them. Large volumes come across the border every October, and the result is unpredictable bangs at unpredictable hours across most of the country for several weeks. Enforcement is a Garda matter and penalties are significant — up to €10,000 and five years on indictment — but from a dog owner''s perspective, planning around the reality is more useful than relying on the law.

## Start in September

**Get a vet appointment early.** For a dog with genuine noise phobia — not mild unease, but panic, destruction, house-soiling or trying to escape — there are prescription options that work far better than anything over the counter. Some need to be started well in advance. Your vet may also want to rule out pain, which is an underappreciated driver of new-onset noise sensitivity in older dogs.

**Build the den now.** Pick the quietest, most enclosed spot in the house — under the stairs, an interior room, behind a sofa, a covered crate. Ideally away from external walls and windows. Layer it with blankets and add something that smells of you. Let the dog use it casually for weeks before it''s needed, so it''s a familiar refuge rather than a strange box that appeared on a frightening night.

Never close the dog in. A dog that panics in a confined space can injure itself badly.

**Sound desensitisation.** Recordings of fireworks and thunder are freely available. Play them at a volume so low the dog barely registers it, while something good happens — dinner, a chew, a game. Increase the volume by tiny increments over weeks, always staying below the level that produces any reaction. If the dog reacts, you''ve gone too fast; drop back down.

This genuinely works, and it takes six to eight weeks. It cannot be done in a fortnight.

**Check the microchip and ID.** More dogs go missing in Ireland around Halloween than at any other time of year, and a panicked dog will get through a gate or over a fence it has never attempted before. Confirm your microchip registration is in **your** name with your **current** mobile number, and that the collar tag has your name and address. Both are legal requirements anyway — see our [guide to Irish dog law](/guides/dog-ownership-law-ireland).

**Check the garden.** Gaps under fences, loose panels, a gate that doesn''t latch properly. Fix them in September.

## The weeks around Halloween

**Walk in daylight.** Bring walks forward. Late October in Ireland means dusk before 6pm, and dusk is when the bangers start. An early afternoon walk is far better than an anxious one at half five.

**Keep dogs on lead outside**, even in reliably safe places. A single unexpected bang and a dog is gone.

**Toilet before dark**, and go out with the dog rather than opening the back door.

**Never take a dog to a fireworks display.** It sounds obvious. People still do it.

**In multi-pet households**, remember that cats need the same consideration — indoors before dusk, litter tray available, hiding places accessible. Rabbits and guinea pigs housed outside should be brought into a shed or garage if possible, or their hutches covered with thick blankets leaving airflow, with extra bedding to burrow into. Prey animals hide their fear well and can die of stress.

## On the night

**Close everything.** Windows, curtains, blinds, cat flaps, internal doors to rooms with an escape route. Closed curtains cut both the noise and the flashes, which matter more than people realise.

**Put on background noise.** Television, radio, music. Something with a steady bass helps mask the low-frequency thump that dogs find most alarming. Turn it on before the noise starts, not in response to it.

**Feed a little earlier.** Anxious dogs often won''t eat once it''s started.

**Let the dog choose where to be.** If it wants the den, leave it. If it wants to be pressed against your leg, that''s fine too. If it wants to sit in the bath — a surprisingly common choice — let it.

**Stay calm and normal.** Not falsely cheerful, not sympathetic and dramatic. Just ordinary. Dogs read our behaviour closely and a household that''s tense on their behalf confirms that something is genuinely wrong.

**You cannot reinforce fear with comfort.** This is a persistent myth and it''s wrong. Fear is an emotion, not a behaviour, and you can''t reward an emotion into being stronger. If your dog comes to you for reassurance, give it. Ignoring a frightened dog to avoid "rewarding" it makes things worse, not better.

**Don''t force anything.** Don''t drag the dog out from under the bed to comfort it. Don''t try to show it the fireworks aren''t dangerous. Don''t tell it off for panting, pacing or drooling — these are involuntary.

**Don''t punish accidents.** A house-trained dog that toilets indoors during fireworks is not misbehaving.

## What helps, and what''s oversold

**Reasonable evidence, worth trying:**

- Prescription anti-anxiety medication from your vet, for genuine phobia
- A prepared den, used habitually
- Sound desensitisation done properly over weeks
- Masking noise and blocked-out light

**Mixed evidence, low risk, worth a go:**

- Pheromone diffusers (plug in a few days ahead)
- Snug-fitting anxiety wraps or a well-fitted t-shirt
- Calming supplements — ask your vet, as quality varies enormously

**Avoid:**

- **Sedatives that immobilise without reducing fear.** Some older sedatives leave a dog unable to move but fully aware and frightened. If your vet prescribes something, ask specifically whether it addresses anxiety or just sedates.
- Alcohol, human medication, or anything from the internet without veterinary advice
- Flooding — deliberately exposing a frightened dog to the noise to "get it used to it." This reliably makes phobias worse.

## Storms

Most of the above applies, with one addition: dogs often react to storms before you notice them, picking up on barometric pressure changes and the static build-up that precedes thunder. A dog that becomes restless an hour before a storm isn''t being odd.

Ireland''s winter storms bring wind noise, rattling doors, and debris against windows as much as thunder. The same den, the same masking noise, the same calm approach.

Named storms are forecast days ahead — use the warning. Bring walks forward, secure the garden, and have the den ready.

## When it''s more than nerves

Get veterinary help if your dog: tries to escape or injures itself, won''t eat for a day or more, house-soils repeatedly, shakes uncontrollably for hours, or is becoming worse each year. Noise phobia tends to escalate without intervention and generalise to other sounds — the bin lorry, the smoke alarm, a dropped saucepan.

**New-onset noise sensitivity in an older dog is worth investigating properly.** Pain — often arthritis — makes dogs more sensitive to everything, and there''s a well-recognised link between musculoskeletal pain and sound sensitivity. A dog that suddenly develops a fear of fireworks at nine years old may be telling you something about its joints.

**Sources:** [Citizens Information — Fireworks: the law](https://www.citizensinformation.ie/en/justice/criminal-law/criminal-offences/the-law-on-fireworks/), [Dogs Trust Ireland — Supporting your dog during fireworks](https://www.dogstrust.ie/dog-advice/life-with-your-dog/seasonal/fireworks), [ISPCA — Safety tips for our pets this Halloween](https://ispca.ie/safety_tips_for_our_pets_this_halloween/)', '2026-08-13'),
  ('introducing-a-dog-to-other-pets', 'Bringing a Dog Into a Home That Already Has Pets', 'How to introduce a new dog to a resident dog, a cat, or small animals — the week-by-week process, the mistakes that cause lasting problems, and when to get help.', '🐈', 'Welcoming a New Dog', ARRAY['multi-pet','cats','introductions','resident dog','small animals']::text[], 10, 'Most failed pet introductions fail in the first ten minutes, and they fail the same way: everyone is excited, someone opens a door, and two animals meet nose-to-nose in a hallway with no exit. What happens next sets the tone for months.

The alternative takes two weeks and is almost entirely undramatic. That''s the point.

## The principle behind all of it

Animals don''t need to like each other on day one. They need to learn that the other one''s presence is boring and safe. Every technique below is a way of building that association slowly enough that nobody gets frightened — because a single genuine fright can take months to undo.

Two rules underpin everything:

1. **Never let either animal be trapped.** Both must always be able to leave.
2. **End every session while it''s still going well.** Not when it starts to go wrong.

## Before the new dog arrives

**Set up separate territory.** The new dog needs its own room or clearly defined space with a bed, water, and a closed door. The resident animals keep the rest of the house. This is not cruelty — it''s the thing that makes the introduction work.

**Get baby gates.** Two, ideally. A gate lets animals see and smell each other with a physical barrier, which is the entire middle phase of the process. A gate the cat can jump but the dog can''t is even better.

**Create vertical escape routes for cats.** Cat trees, cleared shelves, a wardrobe top. A cat that can get up high is a cat that stays calm. A cat cornered at floor level is a cat that lashes out — and a scratched cornea is a real vet bill.

**Move the cat''s resources out of the dog''s reach.** Litter tray, food and water bowls should be somewhere the dog physically cannot go — behind a cat flap, a gate with a cat-sized gap, or upstairs. A cat that has to run a gauntlet to use its tray will stop using its tray, and house-soiling is much harder to fix than the original problem.

**Separate feeding areas, permanently.** Not just during introductions. Food is the most common flashpoint between dogs, and dog food is not adequate for cats — they need taurine that dog food doesn''t reliably supply.

## Dog to dog

**Meet on neutral ground first.** Not in the house, not in the garden. A quiet park or a stretch of footpath neither dog considers theirs. Two handlers, both dogs on loose leads.

**Walk parallel, don''t meet head-on.** Start well apart — 20 metres or more if either dog is reactive — and walk in the same direction. Gradually reduce the distance over the walk. A face-to-face greeting is confrontational in dog terms; a shared walk is not. Let them sniff each other briefly when they''re calm, then move on. Brief is better.

**Go home together, and go into the garden first**, not straight into the house. Then into the house with the resident dog leading.

**Remove all high-value items** before the new dog comes in — chews, favourite toys, food bowls, and the resident dog''s most prized bed. Put them away for the first fortnight and reintroduce them gradually.

**Supervise every interaction for at least two weeks**, and separate whenever you can''t supervise. Crates, gates, closed doors.

**What normal looks like:** a lot of sniffing, some stiffness, the resident dog telling the new dog off with a growl or a lip curl. A growl is communication, not aggression — a dog that growls is a dog giving warning rather than escalating. Punishing a growl teaches the dog to skip the warning next time, which is how you get a bite with "no warning."

**What isn''t normal:** sustained stiff staring, a dog repeatedly pinning or standing over the other, any bite that breaks skin, or one dog unable to eat, sleep or move around freely. Separate and get a qualified behaviourist involved.

**Same-sex adult pairs**, particularly two bitches, can be harder work than mixed pairs. It''s not a reason not to, but it''s a reason to go slower.

## Dog to cat

Slower, and structured in phases. Do not rush to phase four.

**Phase 1 — scent only (2–3 days).** Complete separation. Swap bedding between them. Rub a cloth on one animal''s cheek and leave it near the other''s sleeping area. Rotate which animal has access to which part of the house so each explores the other''s scent without ever meeting.

**Phase 2 — sound and sight through a barrier (3–7 days).** A closed door first, then a baby gate with a blanket over the lower half, then the gate uncovered. Feed both animals near the barrier so the other''s presence predicts something good. Keep sessions to a few minutes.

**Phase 3 — same room, dog on lead (1–2 weeks).** Dog on a lead, lying down, ideally chewing something. Cat free to enter and leave, with a clear high escape route. **The cat sets the pace entirely** — never carry a cat towards a dog or hold it to be sniffed. If the dog fixates, stares, whines or lunges, calmly increase the distance and shorten the session.

Reward the dog for *ignoring* the cat. That''s the behaviour you actually want. A dog that looks at the cat and then looks back at you has understood the assignment.

**Phase 4 — supervised freedom.** Only when the dog is reliably calm and can be called away from the cat. Keep supervising for weeks. Separate when you''re out.

**Be realistic about prey drive.** Some dogs — particularly sighthounds, terriers and some working breeds — have a chase response that training manages but does not remove. Many ex-racing Greyhounds live happily with cats; many cannot, which is why Irish greyhound rescues cat-test their dogs and will tell you honestly. If you''re adopting and you have a cat, **say so at application stage** and ask specifically whether the dog has been cat-tested.

A dog that chases and catches a cat once is a permanent management problem, not a training problem.

## Dog to rabbits, guinea pigs and small animals

Be honest about the goal here. It is **safe coexistence with permanent separation**, not friendship.

- Hutches and runs must be genuinely dog-proof, including from digging and from a dog leaning on mesh
- Never leave a dog unsupervised with small animals, even behind wire. Stress alone can kill a rabbit or guinea pig; a dog doesn''t need to make contact to do harm.
- Free-range house rabbits and dogs require constant management and separate zones
- Watch for a dog that fixates on a hutch — staring, whining, pacing near it. That''s a welfare problem for the prey animal even if nothing ever happens, and it needs to be interrupted and redirected.

Birds are similar: a dog and a bird should not share unsupervised airspace, and cages must be somewhere a dog cannot knock or reach.

## Parasites and the multi-pet household

Fleas, ticks and worms move between species freely, and treating one animal creates a reservoir in the others. Plan the whole household with your vet.

**Critical:** never use a dog flea product on a cat. Many contain permethrin, which is highly toxic to cats and can kill. This includes indirect exposure — a cat grooming a dog that''s just had a spot-on applied. Keep them apart for the drying period the product specifies. More on this in our [Irish parasite prevention guide](/guides/parasite-prevention-calendar-ireland).

## When to get help

Contact a qualified behaviourist if you see: any bite breaking skin, sustained fixation that you can''t interrupt, one animal hiding constantly or stopping eating, a cat that stops using its tray, or resource guarding that escalates over time rather than settling.

Look for someone with a recognised qualification and an approach based on reward and management rather than dominance or correction. Your vet can refer you, and the referral is worth having — early intervention on an introduction problem is dramatically cheaper and more effective than intervention after six months of rehearsed conflict.

## The realistic timeline

Two to four weeks of structured work gets most dog-dog pairs to comfortable coexistence. Dog-cat often takes six to eight weeks, sometimes longer, and "comfortable" may mean mutual polite avoidance rather than curling up together. That''s a complete success and worth being pleased about.

If you''re still deciding which dog would fit a household that already has pets, our [breed matching quiz](/?start=quiz) factors temperament and prey drive into its scoring.', '2026-08-13'),
  ('neutering-spaying-ireland', 'Neutering and Spaying in Ireland: Timing, Cost and What to Expect', 'When to neuter, why the timing advice has changed, what it costs in Ireland, where to find subsidised schemes, and how to manage the two weeks afterwards.', '🏥', 'Veterinary Care', ARRAY['neutering','spaying','surgery','Ireland','health']::text[], 8, 'Neutering used to be a simple conversation: six months, book it in, done. It isn''t any more, and the change is a genuine improvement in veterinary understanding rather than fashion. The timing now depends on your dog''s size, sex and circumstances, and getting it right matters more than getting it done early.

## What the procedures are

**Castration (males):** removal of the testicles. A relatively quick procedure, usually a day case, with a small incision in front of the scrotum.

**Spaying (females):** removal of the ovaries, or the ovaries and uterus. Abdominal surgery, more involved, longer recovery. Some Irish practices offer **keyhole (laparoscopic) spaying**, which typically means less post-operative pain and a faster recovery, at a higher price.

**Chemical castration** — a hormonal implant lasting six or twelve months — is also available. It''s genuinely useful as a trial: if you''re neutering to address a behaviour, the implant lets you see whether the behaviour actually changes before you make an irreversible decision.

## Timing: why the advice changed

The old six-month rule came from a period when the main goal was preventing unwanted litters. It''s now clear that sex hormones do more than reproduction — they play a role in closing the growth plates in long bones.

Neutering a large or giant breed dog before its growth plates close means the bones keep growing slightly longer than they otherwise would. Research, particularly in Golden Retrievers, Labradors and German Shepherds, has associated early neutering in some large breeds with an increased incidence of certain joint disorders — cruciate ligament rupture and hip dysplasia among them — and with some cancers. The findings are breed-specific rather than universal, which is exactly why the blanket rule fell away.

**Where the advice broadly sits now:**

| Dog | Typical guidance |
|---|---|
| Small breeds (under ~10kg) | From around 6 months |
| Medium breeds | Around 9–12 months |
| Large and giant breeds | Often 12–18 months, after growth plates close |
| Females, first season | Practices differ on before vs. after the first season |

**This is a conversation with your vet, not a rule to apply from an article.** Your vet knows your dog''s breed, size, temperament and your household circumstances. The honest position is that there is real, ongoing veterinary debate here.

## The arguments, plainly

**In favour:**

- No unwanted litters — and Irish rescues remain full
- **Females:** eliminates pyometra, a life-threatening womb infection that is common in unspayed older bitches and often presents as an emergency costing €1,500+. Also substantially reduces mammary tumour risk, with the protective effect strongest when spaying happens earlier.
- **Males:** eliminates testicular cancer, reduces prostate problems
- No seasons — an unspayed bitch comes into season roughly every six months, for about three weeks, with bleeding and considerable male dog attention
- Reduced roaming and some hormone-driven behaviours
- Many Irish boarding kennels, daycares and insurance policies favour or require neutered dogs

**Against, or worth weighing:**

- Increased risk of certain joint conditions and cancers when done early in some large breeds
- Weight gain — metabolic rate drops, and this is real and predictable. It''s manageable by reducing food by roughly 10–20% at the time of surgery, but most people don''t, which is why so many neutered dogs are overweight.
- Coat changes in some breeds
- A small proportion of spayed bitches develop urinary incontinence later in life — treatable, but a consideration
- **It will not fix fear-based aggression or anxiety.** Neutering reduces hormone-driven behaviour; it does nothing for a dog that''s frightened, and in some anxious dogs removing testosterone can make things marginally worse. If behaviour is your reason, talk to a qualified behaviourist first, and consider the implant as a trial.

## The legal angle: XL Bully dogs

For one group of Irish owners this isn''t a choice. Under the XL Bully ban, a dog kept under a **Certificate of Exemption must be neutered** (unless a vet certifies it medically unfit), as well as licensed and microchipped. See our [guide to Irish dog law](/guides/dog-ownership-law-ireland) for the full requirements.

## What it costs in Ireland

| Procedure | Typical range |
|---|---|
| Male castration | €150–€350 |
| Female spay | €200–€450 |
| Laparoscopic (keyhole) spay | €450–€700 |
| Pre-anaesthetic blood test | €40–€80 |

Larger dogs cost more — more anaesthetic, more surgical time. Dublin practices sit at the higher end.

**Ask what''s included.** Some quotes cover pre-op bloods, pain relief to take home, a buster collar and the post-op check; others price these separately. Get the total.

**Subsidised schemes.** **Dogs Trust Ireland** runs subsidised neutering schemes, and the **ISPCA**, **DSPCA** and local SPCAs offer reduced-cost veterinary services subject to eligibility. If cost is the barrier, contact them — these schemes exist precisely because unneutered dogs produce the litters that fill their kennels.

## The day itself

- Fast from the night before — your practice will give exact timing. **Water is usually allowed**; confirm.
- Drop off in the morning, usually collect the same afternoon or evening
- Leave a phone number you will definitely answer
- Expect a groggy, wobbly, possibly whiny dog that evening. Anaesthetic makes some dogs vocal and disoriented for a few hours. It''s normal.
- A small amount of food that evening, if the practice says so

## The two weeks afterwards

This is where most complications are made rather than encountered.

**Keep the collar on.** The single most common reason for a wound breaking down is the dog licking it. Inflatable and soft collars are more comfortable than the plastic cone, but only if your dog physically can''t reach the wound with them on — check. A dog can undo a spay incision in ninety seconds.

**Restrict exercise properly.** Short lead walks only for 10–14 days. No running, no jumping, no stairs if avoidable, no off-lead, no dog park, no swimming, no bath. For a young energetic dog this is the hard part — use scent games, chew items, food puzzles and short training sessions to tire the brain instead of the body.

**Check the wound daily.** Mild swelling and bruising are normal. Ring the vet if you see: increasing redness or heat, discharge, a gap opening in the incision, a swelling that grows, or a dog that''s off its food or lethargic beyond the first 24 hours.

**Adjust the food.** Reduce by roughly 10–20% from around the time of surgery and monitor body condition weekly. This is far easier than losing the weight later.

**Attend the post-op check.** It''s usually included, it''s usually quick, and it catches problems while they''re small.

**In a multi-pet household**, separate the recovering dog from boisterous housemates for the first few days. A well-meaning play invitation from another dog or a cat''s swipe at a shaved belly can undo the whole thing. A crate, a closed door or a baby gate for a week is worth it.

**Sources:** [Citizens Information — Ban on XL Bully dogs in Ireland](https://www.citizensinformation.ie/en/environment/pets-and-wildlife/ban-on-xl-bully-dogs-in-ireland/), [Dogs Trust Ireland](https://www.dogstrust.ie/), [ISPCA](https://ispca.ie/)', '2026-08-13'),
  ('parasite-prevention-calendar-ireland', 'Vaccinations, Worming and Parasites: A Prevention Calendar for Irish Dogs', 'Ticks, lungworm, fleas and worms in the Irish climate — what your dog actually needs, when, and why the advice here differs from what you''ll read on American sites.', '💉', 'Veterinary Care', ARRAY['parasites','ticks','lungworm','fleas','worming','vaccination','Ireland']::text[], 10, 'Ireland''s climate is mild, damp and rarely freezes hard. That''s pleasant for us and excellent for parasites. Several of the assumptions carried over from American or continental advice — that there''s a "flea season," that ticks die off in winter, that heartworm is the main worry — don''t map onto Irish conditions.

Here''s what actually matters here.

## The Irish parasite picture

**Fleas: year-round, not seasonal.** Central heating means the flea life cycle continues through an Irish winter without interruption. There is no off-season. The other thing worth knowing is that the adult fleas on your dog are a small fraction of the problem — the eggs, larvae and pupae in carpets, skirting boards and dog beds are the bulk of it. This is why one-off treatments fail and why treating the environment matters as much as treating the dog.

**Ticks: a serious and increasing Irish issue.** *Ixodes ricinus*, the sheep tick, is widespread across Ireland — in long grass, woodland, upland walking routes, coastal dunes and anywhere sheep or deer graze. Activity peaks in **spring and autumn** but mild winters mean ticks can be active in any month. They can transmit **Lyme disease**, which affects both dogs and people.

**Lungworm (*Angiostrongylus vasorum*): established in Ireland and genuinely dangerous.** The parasite is carried by slugs and snails. Dogs pick it up by eating them — deliberately, or accidentally via slime trails on grass, on a ball left out overnight, or from a water bowl left in the garden. Irish gardens are close to ideal slug habitat. Untreated lungworm can cause bleeding disorders, breathing difficulty and death, and it is **not** covered by all standard wormers. This is the single most important thing to raise specifically with your vet.

**Roundworm and tapeworm: routine, but worth doing properly.** Roundworm is close to universal in puppies. Tapeworm is associated with fleas and with scavenging — a dog that eats carrion or raw offal is at higher risk.

**Heartworm: not currently a routine Irish concern**, unlike in the US or southern Europe — but it becomes one if you travel with your dog to affected regions.

## The puppy schedule

| Age | What |
|---|---|
| From 2 weeks | Roundworm treatment, then repeated fortnightly until 12 weeks |
| 6–8 weeks | First vaccination (distemper, hepatitis, parvovirus, leptospirosis) |
| By 12 weeks | Microchipped and registered — legally required before sale or transfer |
| 10–12 weeks | Second (and sometimes third) vaccination completing the primary course |
| 12 weeks–6 months | Monthly worming |
| From around 8 weeks | Flea, tick and lungworm prevention — product and timing per your vet |
| ~12 months | First annual booster |

Puppies are commonly born with roundworm passed from the mother, which is why the worming starts so early and repeats so often. Follow the vet''s schedule rather than a shop-bought product''s label.

## The adult year

**Every 1–3 months: broad parasite prevention.** The exact interval depends on the product and your dog''s risk profile. A dog that walks in fields, swims, scavenges or lives with cats that hunt needs more frequent treatment than a dog that walks on pavements in a housing estate.

**Every 12 months: booster and health check.** Some core vaccine components are given every three years while leptospirosis is boosted annually — your vet will run the appropriate schedule. The annual visit is also the health check that catches lumps, dental disease and weight creep early.

**Ask specifically about lungworm cover.** Not every wormer covers *Angiostrongylus*. Some products need monthly dosing to be effective against it. Say the word "lungworm" out loud in the consult and ask whether your current product covers it and at what interval.

## Ticks: what to do

**Prevention** is a spot-on, collar or oral product. Some kill ticks after they attach; some repel. Discuss which suits your walking habits — a dog doing hill walks and forest trails is in a different risk category to a suburban dog.

**Checking**, after every walk in long grass, woodland or on farmland:

- Run your hands slowly over the whole dog, feeling for small bumps
- Concentrate on the head, ears and inside the ear flaps, neck, armpits, groin, between the toes and under the tail
- A tick can be anywhere from poppy-seed to pea sized depending on how long it''s been feeding

**Removal.** Use a tick hook or fine-tipped tweezers. Grip as close to the skin as possible and twist or lever the tick straight out — do not squeeze the body, and do not use vaseline, alcohol, a burnt match or any of the folk methods. All of them make the tick regurgitate into the wound, which is exactly what you''re trying to avoid. Clean the site afterwards and note the date.

If your dog becomes lethargic, lame in shifting joints, feverish or off its food in the weeks after a tick bite, mention the bite to your vet. **Check yourself too** — Lyme disease in humans is a real risk after Irish country walks, and an expanding circular rash needs a GP.

## Lungworm: reducing the risk

- Pick up water bowls and toys from the garden overnight rather than leaving them out
- Discourage the dog from eating slugs, snails and frogs
- Clear up dog waste promptly, which reduces the slug attraction and the parasite cycle
- Use a preventive product that specifically covers lungworm

**Warning signs:** unexplained bleeding or bruising, bleeding that won''t stop from a small cut, coughing, breathlessness, reluctance to exercise, weight loss, or a change in behaviour. These need a same-day appointment, and you should say "could this be lungworm?" — it''s often not the first thing considered.

## Fleas: treating properly

If you find fleas, treating the dog alone will not work.

1. **Treat every pet in the house** on the same day — including cats. Never use a dog flea product on a cat: many contain permethrin, which is highly toxic to cats and can be fatal. This applies to spot-ons applied to the dog too if the cat grooms the dog.
2. **Wash all bedding** at 60°C
3. **Vacuum thoroughly**, especially edges of rooms, under furniture and along skirting boards — then empty the vacuum outside
4. **Consider a household spray** for the environmental stages
5. **Keep treating for at least three months** — pupae can lie dormant for weeks and hatch after you think it''s over

Flea dirt (small dark specks that turn rust-red on damp white paper) confirms fleas even when you can''t find one.

## A note for multi-pet households

Parasites move freely between species. A cat that hunts brings tapeworm and fleas into the house; a dog that scavenges does the same. Treating one animal and not the others gives you a reservoir and a cycle you''ll never break.

Ask your vet to plan the whole household together, and get products appropriate to each species — from the vet or a pharmacy rather than a supermarket, where product quality and species-appropriateness are much less reliable.

Rabbits, guinea pigs and small mammals in the same house need their own consideration: fleas will use them, some flea products are dangerous to them, and a dog''s interest in a hutch is a welfare issue in its own right.

## The short version

- Fleas and ticks are year-round in Ireland — there is no safe season to skip
- Lungworm is here, it''s serious, and not every wormer covers it
- Check for ticks after every rural walk, and remove them with a proper tool
- Treat the whole household, not the animal with the symptom
- Never put a dog product on a cat

**Sources:** [MSD Animal Health Ireland — Ticks](https://www.msd-animal-health.ie/species/dogs/ticks/), [Acorn Veterinary Clinic — Lungworm](https://www.acornvets.ie/lungworm-what-is-it-and-how-to-prevent-it/), [Irish Blue Cross — Vaccinating Your Pet FAQs](https://www.bluecross.ie/whats-happening/vaccinating-your-pet-faqs/)', '2026-08-13'),
  ('walking-your-dog-in-ireland', 'Walking Your Dog in Ireland: Countryside, Livestock, Beaches and the Law', 'Sheep worrying, right of way, beach bye-laws, blue-green algae, ticks and Irish weather — how to walk your dog safely and legally, from the Wicklow hills to a west coast strand.', '🥾', 'Law & Responsibility', ARRAY['walking','countryside','livestock','beaches','safety','Ireland']::text[], 10, 'Ireland is an outstanding country to own a dog in, and it comes with a set of rules and hazards that no imported advice will tell you about. Most of them are about livestock, and the consequences of getting them wrong are more serious than people expect.

## Livestock: the thing to get right

This is the single most important section for anyone walking a dog outside a town.

**The law.** Under the Control of Dogs Act 1986, the owner of a dog is liable for damage done by that dog to livestock. And — the part that shocks people — a farmer is entitled, in defined circumstances, to shoot a dog found worrying livestock. This is not a folk myth. It is the law, and it is exercised.

**"Worrying" is broader than attacking.** It includes chasing sheep in a way likely to cause suffering, injury, or — critically — the loss or abortion of lambs. A dog does not need to touch a sheep to cause a fatal outcome. A ewe in late pregnancy chased across a field can abort. A flock pushed against a fence or over a ditch can suffer crush injuries and deaths.

**The financial exposure is real.** Irish cases have seen owners agree to compensation running into thousands of euro for a single incident, and civil liability sits with the owner regardless of intent. Check whether your pet insurance includes **third-party liability** — many policies do, and in Ireland it is genuinely worth having.

**The rule, then, is simple: if there is any chance of livestock, your dog is on a lead.** Not a long line, not "under voice control." A lead. This includes the friendliest dog you have ever met, because a flock of sheep breaking into a run triggers a chase response in dogs that have never chased anything in their lives.

Lambing season — broadly February to May, depending on the county and the flock — is the highest-risk period, and many upland walking routes ask dog owners to stay away entirely during it. Respect that.

**Also:** never let a dog into a field with cattle, especially cows with calves. Cattle will charge a dog, and the person most often injured is the owner running after it. **If cattle move towards you, let the dog off the lead.** The dog will outrun them; you won''t. Get yourself to the fence and call the dog once you''re clear. Counter-intuitive, well-established, and it has saved lives.

## Access and rights of way

Ireland has relatively little statutory right to roam compared to Scotland or the Nordic countries. Most upland and rural land is privately owned, and access to many popular walking routes exists through the goodwill of landowners rather than by right.

The **Leave No Trace** principles and the walkers'' code apply: use gates and stiles, close gates behind you, don''t damage fences or walls, and take everything home. Where waymarked trails cross farmland, the signage often specifies dogs on leads or dogs not permitted — those signs exist because of previous incidents, and ignoring them puts the access itself at risk for everyone.

## Beaches

Irish beaches are one of the best things about owning a dog here, with three things to know.

**Bye-laws vary by council and by season.** Many Blue Flag beaches restrict or ban dogs during the bathing season, typically 1 June to 15 September, or restrict them to certain hours or certain sections. These are local authority bye-laws, so check your council''s website — Fingal, Dún Laoghaire-Rathdown, Wexford, Kerry and Clare all publish theirs, and they differ.

**Salt water and sand.** A dog that drinks seawater will usually vomit; a dog that drinks a lot of it can develop salt toxicity, which is serious. Bring fresh water and offer it regularly. Sand ingestion — usually from repeatedly fetching a ball off wet sand — can cause a genuine intestinal impaction. Wet the ball in a rock pool rather than dropping it on sand, and rinse the dog afterwards.

**Currents and cold.** Irish sea temperatures are low year-round and rip currents on Atlantic beaches are strong. A dog swimming out after a stick or a bird can get into difficulty quickly, and the number one cause of drowning in these situations is the owner going in after them. Don''t throw anything into the sea for a dog to fetch.

## Rivers, lakes and blue-green algae

**Blue-green algae (cyanobacteria)** blooms occur in Irish lakes and slow rivers, typically in warm still weather from late spring through autumn. It can look like blue-green paint, a scum, or small clumps on the surface and along the shoreline. It can be **rapidly fatal to dogs** — sometimes within hours — and there is no antidote.

If the water looks discoloured, scummy or has an odd sheen, keep the dog out and don''t let it drink. If your dog has been in suspect water, rinse it thoroughly with clean water before it can groom itself and contact your vet immediately. Local authorities and the EPA issue warnings for affected waters; if there''s a sign, believe it.

**Leptospirosis** is the other water risk — spread through rat urine in standing water, ditches and slow rivers. It''s covered by the core vaccination given in Ireland, which is a good reason not to skip the annual booster. It can also infect humans.

## Ticks

Long grass, woodland, upland routes and coastal dunes are all tick habitat in Ireland, with peaks in spring and autumn and activity possible year-round in a mild winter. Check your dog after every rural walk — head, ears, neck, armpits, groin, between the toes — and remove ticks with a proper tick hook rather than tweezers, vaseline or a match. Details in our [parasite prevention guide](/guides/parasite-prevention-calendar-ireland).

Check yourself too. Lyme disease in humans is a genuine risk after Irish country walks.

## The weather

**Rain and cold.** Most dogs handle Irish weather perfectly well, but thin-coated breeds — Greyhounds, Whippets, Staffies, Vizslas — genuinely need a coat in winter, and it''s function rather than fashion. After a wet walk, dry the dog properly, particularly the chest, belly and between the toes, where damp coats lead to skin problems.

**Wind and storms.** Named storms bring falling branches and, on the coast, dangerous conditions on piers and cliff paths. People are swept off Irish piers with regrettable regularity, sometimes while retrieving a dog. Stay well back from the water in high seas.

**Heat.** Ireland doesn''t get hot often, which is precisely why heat is dangerous here — dogs and owners are unacclimatised, and a 24°C day in Ireland catches people out. Walk early or late, avoid the middle of the day, and use the five-second test on tarmac: if you can''t hold the back of your hand on it for five seconds, it will burn paw pads. **Never leave a dog in a car**, even briefly, even with windows cracked, even on a mild cloudy day.

Flat-faced breeds — Bulldogs, Pugs, French Bulldogs, Boxers — are at substantially higher risk of heatstroke and should be walked in cool conditions only.

**Signs of heatstroke:** heavy frantic panting, bright red gums, drooling, staggering, vomiting, collapse. Move to shade, wet the dog with cool (not ice-cold) water, and get to a vet immediately. This is an emergency.

## Sensible everyday practice

- **Poo bags, more than you need.** The on-the-spot fine is €150, rising to **€250 from 1 September 2026**. Bag it and take it with you — a bagged poo left on a wall or hung in a tree is worse than nothing.
- **ID tag with your name and address** is a legal requirement in Ireland, and a mobile number on the back is what actually gets your dog home. The €200 fine applies for not having one.
- **Lights and hi-vis in winter.** Irish winter walks happen in the dark at both ends of the day, often on roads with no footpath. A light-up collar and a hi-vis vest for yourself are cheap.
- **Walk facing traffic** on rural roads, with the dog on your inside.
- **Restricted breeds** must be muzzled and on a lead under two metres in public, held by someone over 16. The list includes German Shepherds, Rottweilers, Staffordshire Bull Terriers and any cross of the ten listed breeds — see our [guide to Irish dog law](/guides/dog-ownership-law-ireland).

## The short version

Lead near livestock, always. Check beach bye-laws before you go. Stay out of discoloured water. Check for ticks. Carry more bags than you need. Beyond that, Ireland is about as good as dog walking gets.

**Sources:** [Citizens Information — Dog licences and ownership](https://www.citizensinformation.ie/en/environment/pets-and-wildlife/control-of-dogs/), [Irish Farmers Journal — Dog owners'' responsibility to prevent livestock worrying](https://www.farmersjournal.ie/news/opinion/legal-queries-dog-owners-responsibility-to-prevent-livestock-worrying-156043), [RTÉ — Sheep farmers call for more supports over dog attacks](https://www.rte.ie/news/2026/0215/1558566-sheep-dog-attacks/)', '2026-08-13')
on conflict (id) do nothing;
