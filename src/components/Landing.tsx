import { HowItWorks } from "./HowItWorks";
import { BreedShowcase } from "./BreedShowcase";

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <span
          className="mb-6 text-6xl sm:text-7xl"
          aria-hidden="true"
        >
          🐶
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
          Find your perfect{" "}
          <span className="text-primary">canine companion</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Answer a handful of quick questions about your home, activity level,
          and household, and we&apos;ll match you with the dog breeds best
          suited to your life.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="transition-smooth mt-9 rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Start the quiz
        </button>
        <p className="mt-4 text-sm text-muted">
          Takes about 2 minutes · No sign-up required
        </p>
      </section>

      <HowItWorks />
      <BreedShowcase />
    </div>
  );
}
