import { questions, QuizOption } from "@/lib/questions";

interface AnswersRecapProps {
  answers: QuizOption[];
}

export function AnswersRecap({ answers }: AnswersRecapProps) {
  return (
    <div className="mb-8 rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text">Your answers at a glance</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Here&apos;s a quick recap of what you told us — it&apos;s what shaped
        the matches below.
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {answers.map((answer, index) => (
          <div key={questions[index].id} className="flex items-start gap-3">
            <span className="mt-0.5 text-xl" aria-hidden="true">
              {answer.icon}
            </span>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {questions[index].question}
              </dt>
              <dd className="text-sm font-semibold text-text">
                {answer.label}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
