import { HowItWorks } from "./HowItWorks";
import { BreedShowcase } from "./BreedShowcase";

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="w-full bg-grid-pattern bg-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-[45%] border-3 border-border bg-accent/40 sm:h-40 sm:w-40">
            <span className="text-6xl sm:text-7xl" aria-hidden="true">
              🐶
            </span>
            <span
              className="absolute -right-6 -top-4 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-center text-[0.6rem] font-bold uppercase leading-tight text-text shadow-hard-sm sm:-right-8"
              aria-hidden="true"
            >
              2 min
              <br />
              quiz
            </span>
          </div>

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
      </section>

      <HowItWorks />
      <BreedShowcase />
    </div>
  );
}
