import { Size } from "./breeds";

export type Trait =
  | "energy"
  | "grooming"
  | "trainability"
  | "goodWithKids"
  | "goodWithOtherPets"
  | "apartmentFriendly"
  | "independence"
  | "noviceFriendly"
  | "vocal";

/**
 * How a contribution is scored against a breed's trait value (1-5 scale):
 * - "min": breed value should be >= target (penalty only for deficits)
 * - "max": breed value should be <= target (penalty only for excess)
 * - "match": breed value should be close to target (penalty for any distance)
 */
export type ContributionMode = "min" | "max" | "match";

export interface TraitContribution {
  trait: Trait;
  target: number;
  mode: ContributionMode;
  weight: number;
}

export interface QuizOption {
  id: string;
  label: string;
  icon: string;
  contributions: TraitContribution[];
  sizePreference?: Size[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  helperText: string;
  options: QuizOption[];
}

export const questions: QuizQuestion[] = [
  {
    id: "home",
    question: "Where do you live?",
    helperText: "Your living space shapes how comfortable a dog will be day to day.",
    options: [
      {
        id: "apartment",
        label: "Apartment or condo",
        icon: "🏢",
        contributions: [
          { trait: "apartmentFriendly", target: 5, mode: "min", weight: 3 },
          { trait: "vocal", target: 3, mode: "max", weight: 2 },
          { trait: "energy", target: 2, mode: "match", weight: 1 },
        ],
      },
      {
        id: "townhouse",
        label: "Townhouse with a small yard",
        icon: "🏘️",
        contributions: [
          { trait: "apartmentFriendly", target: 3, mode: "min", weight: 2 },
        ],
      },
      {
        id: "house",
        label: "House with a big yard",
        icon: "🏡",
        contributions: [
          { trait: "energy", target: 4, mode: "match", weight: 1 },
        ],
      },
    ],
  },
  {
    id: "activity",
    question: "How active is your day-to-day lifestyle?",
    helperText: "Matching energy levels keeps both of you happy.",
    options: [
      {
        id: "relaxed",
        label: "Relaxed — short walks and lots of lounging",
        icon: "🛋️",
        contributions: [{ trait: "energy", target: 1, mode: "match", weight: 3 }],
      },
      {
        id: "moderate",
        label: "Moderate — daily walks and playtime",
        icon: "🚶",
        contributions: [{ trait: "energy", target: 3, mode: "match", weight: 3 }],
      },
      {
        id: "very-active",
        label: "Very active — runs, hikes, or sports",
        icon: "🏃",
        contributions: [{ trait: "energy", target: 5, mode: "match", weight: 3 }],
      },
    ],
  },
  {
    id: "experience",
    question: "How much experience do you have with dogs?",
    helperText: "First-timers do best with patient, easy-to-train breeds.",
    options: [
      {
        id: "first-time",
        label: "First-time owner",
        icon: "🌱",
        contributions: [
          { trait: "trainability", target: 4, mode: "min", weight: 2 },
          { trait: "noviceFriendly", target: 4, mode: "min", weight: 3 },
        ],
      },
      {
        id: "some",
        label: "Some experience",
        icon: "📘",
        contributions: [
          { trait: "trainability", target: 3, mode: "min", weight: 1 },
          { trait: "noviceFriendly", target: 2, mode: "min", weight: 1 },
        ],
      },
      {
        id: "experienced",
        label: "Very experienced",
        icon: "🎓",
        contributions: [],
      },
    ],
  },
  {
    id: "grooming",
    question: "How much time can you spend on grooming each week?",
    helperText: "Some coats need daily brushing; others barely need any care.",
    options: [
      {
        id: "minimal",
        label: "Minimal — a quick brush now and then",
        icon: "⏱️",
        contributions: [{ trait: "grooming", target: 2, mode: "max", weight: 3 }],
      },
      {
        id: "some",
        label: "Some — a weekly grooming routine",
        icon: "🧴",
        contributions: [{ trait: "grooming", target: 3, mode: "max", weight: 1 }],
      },
      {
        id: "lots",
        label: "Lots — I enjoy grooming or use a groomer",
        icon: "✂️",
        contributions: [],
      },
    ],
  },
  {
    id: "kids",
    question: "Are there kids in your home?",
    helperText: "Some breeds are especially patient with little ones.",
    options: [
      {
        id: "young-kids",
        label: "Yes, young kids",
        icon: "🧒",
        contributions: [{ trait: "goodWithKids", target: 5, mode: "min", weight: 3 }],
      },
      {
        id: "older-kids",
        label: "Yes, older kids",
        icon: "🧑",
        contributions: [{ trait: "goodWithKids", target: 4, mode: "min", weight: 2 }],
      },
      {
        id: "no-kids",
        label: "No kids at home",
        icon: "🚫",
        contributions: [],
      },
    ],
  },
  {
    id: "other-pets",
    question: "Do you have other pets?",
    helperText: "Not every breed is naturally sociable with other animals.",
    options: [
      {
        id: "yes-pets",
        label: "Yes, other pets at home",
        icon: "🐈",
        contributions: [{ trait: "goodWithOtherPets", target: 4, mode: "min", weight: 3 }],
      },
      {
        id: "no-pets",
        label: "No other pets",
        icon: "🚫",
        contributions: [],
      },
    ],
  },
  {
    id: "alone-time",
    question: "How many hours will your dog typically be alone each day?",
    helperText: "Some breeds handle solitude far better than others.",
    options: [
      {
        id: "rarely",
        label: "Rarely — someone's usually home",
        icon: "🏠",
        contributions: [],
      },
      {
        id: "few-hours",
        label: "A few hours",
        icon: "🕑",
        contributions: [{ trait: "independence", target: 2, mode: "min", weight: 1 }],
      },
      {
        id: "most-of-day",
        label: "Most of the workday",
        icon: "🕗",
        contributions: [{ trait: "independence", target: 4, mode: "min", weight: 3 }],
      },
    ],
  },
  {
    id: "noise",
    question: "How do you feel about barking?",
    helperText: "Vocal breeds can be a dealbreaker in close quarters.",
    options: [
      {
        id: "quiet",
        label: "I'd prefer a quiet dog",
        icon: "🤫",
        contributions: [{ trait: "vocal", target: 2, mode: "max", weight: 3 }],
      },
      {
        id: "some-barking",
        label: "Some barking is fine",
        icon: "🔉",
        contributions: [{ trait: "vocal", target: 4, mode: "max", weight: 1 }],
      },
      {
        id: "no-problem",
        label: "No problem at all",
        icon: "🔊",
        contributions: [],
      },
    ],
  },
  {
    id: "size",
    question: "Do you have a size preference?",
    helperText: "Purely a matter of taste and space.",
    options: [
      {
        id: "small",
        label: "Small",
        icon: "🐁",
        contributions: [],
        sizePreference: ["small"],
      },
      {
        id: "medium",
        label: "Medium",
        icon: "🐕",
        contributions: [],
        sizePreference: ["medium"],
      },
      {
        id: "large",
        label: "Large",
        icon: "🐕‍🦺",
        contributions: [],
        sizePreference: ["large"],
      },
      {
        id: "no-preference",
        label: "No preference",
        icon: "✨",
        contributions: [],
      },
    ],
  },
];
