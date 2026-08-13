// The article catalog for the /guides page. Static and hardcoded here —
// unlike breeds/newsletter this is editorial content, not user data, so it
// doesn't need Supabase; see docs/conventions.md for the project's
// "backend-free by default" boundary. Add an entry here (and the matching
// .mdx file in src/content/advice/) to publish a new guide.

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  emoji: string;
  category: string;
  readTime: string;
  tags: string[];
  date: string;
}

export const articles: Article[] = [
  {
    id: "bringing-your-new-dog-home-ireland",
    title: "Bringing Your New Dog Home: The First 30 Days in an Irish Household",
    excerpt:
      "A week-by-week guide to settling a new dog or puppy into an Irish home — what to buy, what to skip, how to handle the first night, and the legal boxes to tick in month one.",
    emoji: "🏡",
    category: "Welcoming a New Dog",
    readTime: "9 min read",
    tags: ["new dog", "puppy", "settling in", "Ireland"],
    date: "2026-08-13",
  },
  {
    id: "dog-ownership-law-ireland",
    title: "The Legal Side of Owning a Dog in Ireland: Licences, Microchips, ID and Fines",
    excerpt:
      "Everything an Irish dog owner is legally required to do — licence costs, microchipping deadlines, ID tags, restricted breeds, the XL Bully ban, and the on-the-spot fines rising in September 2026.",
    emoji: "⚖️",
    category: "Law & Responsibility",
    readTime: "10 min read",
    tags: ["dog licence", "microchip", "Irish law", "restricted breeds", "XL Bully"],
    date: "2026-08-13",
  },
  {
    id: "dog-nutrition-guide-ireland",
    title: "Feeding Your Dog Well: A Nutrition Guide for Irish Owners",
    excerpt:
      "How to read an Irish or EU dog food label, how much to feed, when to change life stages, and how to tell marketing from nutrition — without spending a fortune.",
    emoji: "🥘",
    category: "Nutrition",
    readTime: "11 min read",
    tags: ["nutrition", "dog food", "feeding", "FEDIAF", "Ireland"],
    date: "2026-08-13",
  },
  {
    id: "finding-a-vet-in-ireland",
    title: "Finding and Working With a Vet in Ireland",
    excerpt:
      "How to choose a veterinary practice in Ireland, what happens at the first appointment, how out-of-hours emergency care works, and how to get more out of every consultation.",
    emoji: "🩺",
    category: "Veterinary Care",
    readTime: "9 min read",
    tags: ["vet", "veterinary", "emergency", "Ireland", "health"],
    date: "2026-08-13",
  },
  {
    id: "parasite-prevention-calendar-ireland",
    title: "Vaccinations, Worming and Parasites: A Prevention Calendar for Irish Dogs",
    excerpt:
      "Ticks, lungworm, fleas and worms in the Irish climate — what your dog actually needs, when, and why the advice here differs from what you'll read on American sites.",
    emoji: "💉",
    category: "Veterinary Care",
    readTime: "10 min read",
    tags: ["parasites", "ticks", "lungworm", "fleas", "worming", "vaccination", "Ireland"],
    date: "2026-08-13",
  },
  {
    id: "cost-of-owning-a-dog-ireland",
    title: "What a Dog Really Costs in Ireland — and Whether to Insure",
    excerpt:
      "Honest, itemised figures for the first year and every year after, real Irish vet prices, how pet insurance works here, and what to do if you can't afford a bill.",
    emoji: "💶",
    category: "Money & Planning",
    readTime: "10 min read",
    tags: ["cost", "budget", "pet insurance", "vet bills", "Ireland"],
    date: "2026-08-13",
  },
  {
    id: "neutering-spaying-ireland",
    title: "Neutering and Spaying in Ireland: Timing, Cost and What to Expect",
    excerpt:
      "When to neuter, why the timing advice has changed, what it costs in Ireland, where to find subsidised schemes, and how to manage the two weeks afterwards.",
    emoji: "🏥",
    category: "Veterinary Care",
    readTime: "8 min read",
    tags: ["neutering", "spaying", "surgery", "Ireland", "health"],
    date: "2026-08-13",
  },
  {
    id: "introducing-a-dog-to-other-pets",
    title: "Bringing a Dog Into a Home That Already Has Pets",
    excerpt:
      "How to introduce a new dog to a resident dog, a cat, or small animals — the week-by-week process, the mistakes that cause lasting problems, and when to get help.",
    emoji: "🐈",
    category: "Welcoming a New Dog",
    readTime: "10 min read",
    tags: ["multi-pet", "cats", "introductions", "resident dog", "small animals"],
    date: "2026-08-13",
  },
  {
    id: "walking-your-dog-in-ireland",
    title: "Walking Your Dog in Ireland: Countryside, Livestock, Beaches and the Law",
    excerpt:
      "Sheep worrying, right of way, beach bye-laws, blue-green algae, ticks and Irish weather — how to walk your dog safely and legally, from the Wicklow hills to a west coast strand.",
    emoji: "🥾",
    category: "Law & Responsibility",
    readTime: "10 min read",
    tags: ["walking", "countryside", "livestock", "beaches", "safety", "Ireland"],
    date: "2026-08-13",
  },
  {
    id: "fireworks-storms-anxious-dogs-ireland",
    title: "Fireworks, Storms and Halloween: Helping a Frightened Dog in Ireland",
    excerpt:
      "Halloween in Ireland is weeks long and storm season runs all winter. How to prepare a noise-sensitive dog, what to do on the night, and what actually helps long term.",
    emoji: "⛈️",
    category: "Behaviour & Wellbeing",
    readTime: "9 min read",
    tags: ["fireworks", "Halloween", "storms", "anxiety", "noise phobia", "Ireland"],
    date: "2026-08-13",
  },
];
