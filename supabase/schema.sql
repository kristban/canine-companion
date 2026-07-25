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
    ('sporting', 'hound', 'working', 'terrier', 'herding', 'toy', 'companion'));

-- Backfill the original catalog. Only fills rows still NULL, so edits made in
-- the DB (the source of truth) and re-runs are never clobbered — mirroring the
-- seed's "do nothing on conflict" philosophy. (The seed insert below carries
-- the same values for a fresh database, where this update matches no rows.)
update public.breeds as b
set breed_group = v.breed_group
from (values
  ('labrador-retriever', 'sporting'),
  ('golden-retriever', 'sporting'),
  ('french-bulldog', 'companion'),
  ('standard-poodle', 'companion'),
  ('chihuahua', 'toy'),
  ('beagle', 'hound'),
  ('german-shepherd', 'herding'),
  ('border-collie', 'herding'),
  ('bulldog', 'companion'),
  ('cavalier-king-charles-spaniel', 'toy'),
  ('dachshund', 'hound'),
  ('shih-tzu', 'toy'),
  ('australian-shepherd', 'herding'),
  ('boxer', 'working'),
  ('pug', 'toy'),
  ('pembroke-welsh-corgi', 'herding'),
  ('great-dane', 'working'),
  ('siberian-husky', 'working'),
  ('yorkshire-terrier', 'toy'),
  ('basset-hound', 'hound')
) as v(id, breed_group)
where b.id = v.id and b.breed_group is null;

-- Any row still without a group (e.g. one added via /admin before this column
-- existed) gets the 'companion' catch-all so the NOT NULL below always
-- succeeds. Re-categorise it in /admin afterwards.
update public.breeds set breed_group = 'companion' where breed_group is null;

alter table public.breeds alter column breed_group set not null;

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
  (id, name, emoji, tagline, description, size, breed_group,
   energy, grooming, trainability, good_with_kids, good_with_other_pets,
   apartment_friendly, independence, novice_friendly, vocal, running_partner,
   heat_tolerance, cold_tolerance)
values
  ('labrador-retriever','Labrador Retriever','🦮','The friendly, food-motivated all-rounder','Easygoing, sociable, and eager to please. Labs thrive on daily exercise and love being part of family activities.','large','sporting',5,2,5,5,5,2,2,5,2,5,3,4),
  ('golden-retriever','Golden Retriever','🐕','Gentle, affectionate, and endlessly patient','One of the most family-friendly breeds around. Goldens are smart, trainable, and love having a job to do.','large','sporting',4,3,5,5,5,2,2,5,2,4,3,4),
  ('french-bulldog','French Bulldog','🐾','A low-energy charmer built for city life','Compact, comical, and content with short walks and a lot of couch time. Great for apartments.','small','companion',2,1,3,4,3,5,2,4,2,1,1,2),
  ('standard-poodle','Standard Poodle','🐩','Whip-smart and surprisingly athletic','Highly intelligent and trainable, with a low-shedding coat that needs regular grooming to look its best.','large','companion',4,5,5,4,4,3,2,4,2,4,3,3),
  ('chihuahua','Chihuahua','🐕‍🦺','Tiny body, huge personality','A big-city favorite that needs minimal exercise but plenty of affection. Can be vocal and wary of strangers.','small','toy',2,1,3,2,2,5,2,3,5,1,2,1),
  ('beagle','Beagle','🐶','A curious nose-led explorer','Merry and social, beagles love company and outdoor sniffing adventures, though they can be vocal and stubborn.','medium','hound',4,2,3,5,4,3,2,3,5,3,3,3),
  ('german-shepherd','German Shepherd','🐕‍🦺','Loyal, confident, and hard-working','Highly trainable and protective, German Shepherds need consistent exercise and mental stimulation to thrive.','large','herding',5,3,5,4,3,2,3,3,3,5,3,4),
  ('border-collie','Border Collie','🐕','The brainiest breed, built to work','Extremely intelligent and energetic. Needs a job, a yard, and a lot of stimulation, or it will get creative on its own.','medium','herding',5,3,5,4,3,1,2,2,3,5,3,4),
  ('bulldog','English Bulldog','🐾','Low-key, dignified, and a little stubborn','A relaxed companion that''s happy with short strolls and long naps. Sensitive to heat and needs coat-fold care.','medium','companion',1,2,2,4,3,5,3,3,1,1,1,2),
  ('cavalier-king-charles-spaniel','Cavalier King Charles Spaniel','🐕','A velcro dog that loves everyone','Sweet, affectionate, and adaptable to almost any home. Does best when it isn''t left alone for long stretches.','small','toy',3,3,4,5,5,5,1,5,2,2,3,3),
  ('dachshund','Dachshund','🌭','A bold little hound with a big bark','Playful and clever with a stubborn streak. Small enough for apartments but vocal and prone to alerting to everything.','small','hound',3,2,3,3,3,4,3,3,5,2,3,2),
  ('shih-tzu','Shih Tzu','🐕','A pint-sized lap dog with a flowing coat','Affectionate and calm, happiest curled up with its people. Needs frequent grooming to keep its coat healthy.','small','toy',2,5,3,4,4,5,2,4,2,1,2,2),
  ('australian-shepherd','Australian Shepherd','🐕‍🦺','A tireless herder that needs a purpose','Athletic, smart, and devoted, but happiest with acreage, a job to do, and an experienced, active owner.','medium','herding',5,3,5,4,3,1,2,2,3,5,3,4),
  ('boxer','Boxer','🥊','A goofy, loyal bundle of energy','Playful and protective with a soft spot for kids. Boxers need regular exercise to stay out of mischief.','large','working',5,1,3,5,3,2,2,3,2,4,2,3),
  ('pug','Pug','🐶','A comedic, cuddly companion','Charming and low-exercise, pugs are content with short walks and lots of lounging. Sensitive to heat.','small','toy',2,2,3,5,4,5,2,5,2,1,1,2),
  ('pembroke-welsh-corgi','Pembroke Welsh Corgi','🐕','Short legs, big herding heart','Smart, sturdy, and surprisingly energetic for their size. They bond closely and can be vocal watchdogs.','small','herding',4,3,4,4,4,4,2,4,4,2,3,3),
  ('great-dane','Great Dane','🐕‍🦺','A gentle giant with a surprisingly calm soul','Despite their size, Danes are laid-back homebodies who just need space to stretch out and a loving family nearby.','large','working',2,1,3,4,3,2,2,3,2,2,3,2),
  ('siberian-husky','Siberian Husky','🐺','A vocal, high-energy escape artist','Striking and athletic, huskies need serious daily exercise and secure fencing. Not known for reliable recall.','medium','working',5,4,2,4,3,1,4,1,5,5,1,5),
  ('yorkshire-terrier','Yorkshire Terrier','🎀','A tiny terrier with a big attitude','Feisty and affectionate in equal measure. Small enough for any home, but needs regular coat care and confident handling.','small','toy',3,4,3,2,2,5,2,3,4,1,3,2),
  ('basset-hound','Basset Hound','🐾','A laid-back nose with short legs','Mellow and easygoing with a famously good nose. Content with modest exercise but can be stubborn about training.','medium','hound',2,2,2,5,4,4,3,3,4,1,3,3),
  ('akita','Akita','🐕‍🦺','Silent guardian, unwavering heart.','Originating in the mountains of Japan, Akitas were bred to guard nobility and hunt large game, and that dignified independence still shows. They form deep bonds with their family but tend to be reserved with strangers and other dogs, making early socialization important. Best suited to an experienced owner who appreciates a loyal, low-maintenance-coat companion with a strong protective streak.','large','working',3,3,3,3,2,2,5,2,2,3,2,5),
  ('australian-cattle-dog','Australian Cattle Dog','🐕','Built to work, wired to run.','Developed to herd unruly cattle across the Australian outback, these compact dogs have stamina and problem-solving skills to spare. They thrive with a job to do -- agility, herding trials, or long runs -- and can grow bored or nippy without one. A brilliant match for active owners, less so for anyone hoping for a low-key couch companion.','medium','herding',5,2,4,3,3,1,3,2,3,5,4,3),
  ('bernese-mountain-dog','Bernese Mountain Dog','🐕','A gentle giant with a farmhand''s work ethic.','This tri-colored Swiss farm dog combines serious size with a famously sweet, patient temperament. Bernese dogs love children, adapt well to family life, and are happiest close to their people rather than left alone in a yard. Their thick double coat sheds heavily and they don''t handle heat well, so cooler climates suit them best.','large','working',3,4,4,5,4,2,2,4,2,2,1,5),
  ('bichon-frise','Bichon Frise','🐩','A powder puff with a permanent smile.','Cheerful and people-focused, the Bichon Frise was bred purely for companionship and it shows in their sunny, affectionate nature. Their curly white coat doesn''t shed much, making them a popular pick for allergy-sensitive households, though it does need regular trims and brushing. Small and adaptable, they do just as well in a city apartment as a house.','small','companion',3,5,4,4,4,5,1,4,3,1,3,3),
  ('bloodhound','Bloodhound','🐕','Nose to the ground, heart on its sleeve.','Famous for the most sensitive nose in the dog world, the Bloodhound will happily follow a scent trail for miles, so a secure yard and leash are non-negotiable. Beneath the droopy, wrinkled exterior is a gentle, affectionate dog that''s wonderful with kids. They can be stubborn in training since their nose often overrides their ears.','large','hound',3,2,2,4,3,1,4,2,3,2,2,3),
  ('boston-terrier','Boston Terrier','🐶','The tuxedo-clad clown of the dog world.','Known as the American Gentleman for its tuxedo-like markings, the Boston Terrier is friendly, easygoing, and endlessly good-humored. Its short coat makes grooming a breeze, and its compact size and moderate energy suit apartment life well. As a flat-faced breed, it''s sensitive to heat and shouldn''t be over-exercised in warm weather.','small','companion',3,1,4,4,4,5,2,4,2,2,1,1),
  ('bullmastiff','Bullmastiff','🐕‍🦺','A quiet wall of muscle and devotion.','A powerful cross between the Mastiff and Bulldog, this breed was originally used to guard estates from poachers, and its calm, watchful nature remains. Bullmastiffs are quiet, low-energy homebodies who bond fiercely with their family but can be wary of strangers. Their size and strength call for early training and a confident handler.','large','working',2,1,3,4,2,2,3,2,1,1,2,3),
  ('cane-corso','Cane Corso','🐕‍🦺','Ancient Roman guardian, modern-day protector.','This muscular Italian mastiff descends from Roman war dogs and carries an imposing, protective presence. Cane Corsos are intelligent and trainable but need consistent, experienced handling and plenty of early socialization to channel their guarding instincts appropriately. Not a breed for first-time owners or tight apartment living.','large','working',3,1,4,3,2,1,3,1,2,3,2,3),
  ('cocker-spaniel','Cocker Spaniel','🐕','Silky ears, sweeter disposition.','With silky ears and an eager-to-please attitude, the Cocker Spaniel is one of the most affectionate sporting breeds around. They get along well with children and other pets and respond happily to positive training. Their long, wavy coat needs regular brushing and professional grooming to stay mat-free.','medium','sporting',3,4,4,5,4,3,2,4,3,3,3,3),
  ('collie-rough','Collie (Rough)','🐕','Lassie''s legacy, brains and beauty.','Made famous by Lassie, the Rough Collie pairs a stunning flowing coat with a gentle, intelligent, and devoted temperament. They''re excellent with children and naturally watchful without being aggressive, making them a classic family favorite. That gorgeous coat, though, means frequent brushing to prevent matting.','large','herding',3,5,4,5,4,3,2,4,3,3,2,5),
  ('dalmatian','Dalmatian','🐕','Spotted, sporty, and never sits still.','Historically bred to run alongside horse-drawn carriages, Dalmatians have the endurance and drive to match -- they need serious daily exercise to stay balanced. Their short, spotted coat is easy to maintain, but they shed more than people expect. Best for active households who can keep pace with their energy.','large','companion',5,2,3,4,3,1,3,2,2,5,3,3),
  ('doberman-pinscher','Doberman Pinscher','🐕‍🦺','Sleek, sharp, and fiercely loyal.','Athletic, alert, and remarkably quick to learn, the Doberman was originally bred as a personal protection dog and remains fiercely loyal to its family. They need structured training and daily exercise to stay happy, and their short coat offers little insulation against the cold. A devoted companion for owners ready to keep both their body and mind engaged.','large','working',4,1,5,4,2,2,2,2,2,5,3,1),
  ('english-springer-spaniel','English Springer Spaniel','🐕','A gundog with boundless enthusiasm.','Bred to flush and retrieve game, Springer Spaniels bring boundless enthusiasm to everything from a walk around the block to a full day in the field. They''re warm with kids, quick to train, and need a real outlet for their energy to avoid restlessness. Their silky coat and feathered ears require regular brushing.','medium','sporting',5,4,5,5,4,2,2,4,3,5,3,3),
  ('great-pyrenees','Great Pyrenees','🐕‍🦺','A snow-white sentinel that never sleeps on the job.','Bred for centuries to guard flocks alone on mountainsides, the Great Pyrenees is calm, watchful, and fiercely protective, with a tendency to bark at anything unusual after dark. They''re gentle giants with children but are independent thinkers who don''t always prioritize obedience. Their thick white coat is built for cold climates, not heat.','large','working',2,4,2,5,3,1,5,2,4,1,1,5),
  ('irish-setter','Irish Setter','🐕','A red blur with a heart of gold.','Elegant and endlessly good-natured, the Irish Setter brings a burst of red-coated energy to any active household. They''re friendly with people and other dogs but need substantial daily exercise to keep their exuberance in check. Their silky coat requires regular brushing to stay tangle-free.','large','sporting',5,4,3,4,4,1,3,3,2,5,3,3),
  ('maltese','Maltese','🐶','Ancient royalty in a five-pound package.','One of the oldest toy breeds, the Maltese has been a pampered lapdog for royalty and commoners alike for centuries. Small, affectionate, and adaptable, they thrive in apartments and are happiest glued to their favorite person. Their long white coat needs daily brushing, though many owners keep it trimmed short for easier care.','small','toy',2,5,3,3,3,5,1,3,4,1,3,1),
  ('miniature-schnauzer','Miniature Schnauzer','🐶','Big personality, low-shed coat.','Compact, wiry-coated, and endlessly spirited, the Miniature Schnauzer packs a big personality into a small body. Their low-shed coat is a plus for allergy sufferers, though it needs regular grooming to keep its signature look. Alert and vocal, they make excellent watchdogs for apartment or house alike.','small','terrier',3,4,4,4,3,4,2,4,4,2,3,2),
  ('newfoundland','Newfoundland','🐕‍🦺','A gentle lifeguard with a heart as big as its paws.','Gentle, patient, and famously good with children, the Newfoundland was originally bred to assist fishermen and still loves water more than almost any other breed. Their sheer size and thick, weather-resistant coat mean they''re best suited to cooler climates with plenty of space. Despite their bulk, they''re calm, low-energy companions indoors.','large','working',2,5,4,5,4,1,2,3,1,1,1,5),
  ('papillon','Papillon','🦋','Butterfly ears, athlete''s spirit.','Named for its distinctive butterfly-shaped ears, the Papillon is far more athletic and trainable than its dainty appearance suggests. These tiny dogs consistently rank among the smartest toy breeds and enjoy agility and trick training as much as lap time. Their small size makes them a natural fit for apartment living.','small','toy',4,3,5,3,3,5,1,4,3,2,3,1),
  ('rottweiler','Rottweiler','🐕‍🦺','Steady, strong, and devoted to family.','Confident, calm, and deeply devoted to their family, Rottweilers descend from Roman cattle-driving dogs and carry a strong protective instinct. They''re intelligent and trainable but need firm, consistent guidance and early socialization to be their best selves. Their short coat is low-maintenance, though their size and strength mean they''re not typically recommended for first-time owners.','large','working',3,1,4,3,2,2,3,1,1,3,2,2)
on conflict (id) do nothing;
