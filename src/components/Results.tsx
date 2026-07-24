import { MatchResult } from "@/lib/match";
import { QuizOption } from "@/lib/questions";
import { BreedCard } from "./BreedCard";
import { AnswersRecap } from "./AnswersRecap";

interface ResultsProps {
  results: MatchResult[];
  answers: QuizOption[];
  onRestart: () => void;
}

export function Results({ results, answers, onRestart }: ResultsProps) {
  const topResults = results.slice(0, 5);

  if (topResults.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 text-center sm:px-6">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-secondary text-4xl"
          aria-hidden="true"
        >
          🐾
        </span>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          We couldn&apos;t load your matches
        </h2>
        <p className="mt-2 max-w-md text-muted">
          Breed data isn&apos;t available right now. Please try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="transition-smooth mt-8 rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Retake the quiz
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-secondary text-4xl"
          aria-hidden="true"
        >
          🎉
        </span>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Your best-matched breeds
        </h2>
        <p className="mt-2 text-muted">
          Based on your answers, here&apos;s how well each breed fits your
          lifestyle.
        </p>
      </div>

      <AnswersRecap answers={answers} />

      <div className="flex flex-col gap-4">
        {topResults.map((result, index) => (
          <BreedCard key={result.breed.id} result={result} rank={index} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="transition-smooth rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Retake the quiz
        </button>
      </div>
    </section>
  );
}
