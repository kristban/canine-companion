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
