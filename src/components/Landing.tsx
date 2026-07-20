import Image from "next/image";
import { HowItWorks } from "./HowItWorks";
import { BreedShowcase } from "./BreedShowcase";

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="w-full bg-grid-pattern bg-background">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:text-left">
          <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Find your perfect{" "}
              <span className="text-primary">canine companion</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Answer a handful of quick questions about your home, activity
              level, and household, and we&apos;ll match you with the dog
              breeds best suited to your life.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="transition-smooth mt-9 rounded-full border-2 border-border bg-primary px-8 py-4 text-lg font-bold text-white shadow-hard hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start the quiz 🐾
            </button>
            <p className="mt-4 text-sm font-semibold text-muted">
              Takes about 2 minutes · No sign-up required
            </p>
          </div>

          <div className="order-1 hidden justify-center sm:flex lg:order-2">
            <div className="relative w-full max-w-sm sm:max-w-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border-3 border-border shadow-hard">
                <Image
                  src="/IMG_27872.jpeg"
                  alt="A small Shih Tzu and a large Old English Sheepdog sitting side by side on a patio"
                  fill
                  sizes="(min-width: 1024px) 448px, (min-width: 640px) 448px, 384px"
                  className="object-cover"
                />
              </div>
              <span
                className="absolute -right-4 -top-4 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-center text-[0.6rem] font-bold uppercase leading-tight text-text shadow-hard-sm sm:-right-6"
                aria-hidden="true"
              >
                2 min
                <br />
                quiz
              </span>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <BreedShowcase />
    </div>
  );
}
