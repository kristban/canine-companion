import { questions, QuizOption } from "@/lib/questions";

interface AnswersRecapProps {
  answers: QuizOption[];
  /** When provided, each answer becomes a button that jumps back to re-answer it. */
  onEditAnswer?: (index: number) => void;
}

export function AnswersRecap({ answers, onEditAnswer }: AnswersRecapProps) {
  return (
    <div className="mb-8 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard">
      <h3 className="font-display text-lg font-semibold text-text">
        Your answers at a glance
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Here&apos;s a quick recap of what you told us — it&apos;s what shaped
        the matches below.
        {onEditAnswer ? " Tap any answer to change it." : null}
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {answers.map((answer, index) => {
          const content = (
            <>
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background-alt text-lg"
                aria-hidden="true"
              >
                {answer.icon}
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                  {questions[index].question}
                </dt>
                <dd className="text-sm font-bold text-text">
                  {answer.label}
                </dd>
              </div>
            </>
          );

          if (!onEditAnswer) {
            return (
              <div key={questions[index].id} className="flex items-start gap-3">
                {content}
              </div>
            );
          }

          return (
            <button
              key={questions[index].id}
              type="button"
              onClick={() => onEditAnswer(index)}
              aria-label={`Edit answer: ${questions[index].question}`}
              className="transition-smooth flex items-start gap-3 rounded-2xl px-1 py-0.5 text-left hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {content}
            </button>
          );
        })}
      </dl>
    </div>
  );
}
