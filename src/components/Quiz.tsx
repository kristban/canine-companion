"use client";

import { useEffect, useState } from "react";
import { questions, QuizOption } from "@/lib/questions";
import { readQuizProgress, saveQuizProgress } from "@/lib/quizProgress";

interface QuizProps {
  onComplete: (answers: QuizOption[]) => void;
  onCancel: () => void;
  // Lets Results.tsx send the visitor back to a specific answered question
  // (to tweak it) instead of always restarting the whole quiz from scratch.
  // Left undefined for a genuinely fresh start, which is also the signal to
  // hydrate from any in-progress answers saved in sessionStorage (see below).
  initialAnswers?: QuizOption[];
  initialStep?: number;
}

export function Quiz({
  onComplete,
  onCancel,
  initialAnswers,
  initialStep = 0,
}: QuizProps) {
  const [step, setStep] = useState(() => {
    if (initialAnswers === undefined) {
      const saved = readQuizProgress();
      if (saved) return saved.step;
    }
    return initialStep;
  });
  const [answers, setAnswers] = useState<QuizOption[]>(() => {
    if (initialAnswers === undefined) {
      const saved = readQuizProgress();
      if (saved) return saved.answers;
    }
    return initialAnswers ?? [];
  });
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const question = questions[step];
  const progress = Math.round((step / questions.length) * 100);
  const selectedOptionId = answers[step]?.id;

  // Persist in-progress answers so a refresh doesn't lose them. Cleared by
  // AppShell once the quiz completes or is explicitly cancelled/restarted.
  useEffect(() => {
    saveQuizProgress({ step, answers });
  }, [step, answers]);

  // Number-key shortcuts (1-4) let keyboard users answer without tabbing
  // through each option button.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < question.options.length) {
        selectOption(question.options[index]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  function selectOption(option: QuizOption) {
    const next = [...answers.slice(0, step), option];
    setAnswers(next);

    if (step === questions.length - 1) {
      onComplete(next);
    } else {
      setDirection("forward");
      setStep(step + 1);
    }
  }

  function goBack() {
    if (step === 0) {
      onCancel();
    } else {
      setDirection("back");
      setStep(step - 1);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-muted">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full border-2 border-border bg-background-alt"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Quiz progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        key={step}
        className={
          direction === "forward"
            ? "animate-quiz-step-forward"
            : "animate-quiz-step-back"
        }
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {question.question}
        </h2>
        <p className="mt-2 text-muted">{question.helperText}</p>

        <fieldset className="mt-8 flex flex-col gap-3">
          <legend className="sr-only">{question.question}</legend>
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(option)}
                aria-pressed={isSelected}
                className={`transition-smooth flex items-center gap-4 rounded-2xl border-2 border-border px-5 py-4 text-left hover:-translate-y-0.5 hover:shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? "bg-secondary/40 shadow-hard-sm"
                    : "bg-surface"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background-alt text-xs font-bold text-muted sm:flex"
                >
                  {index + 1}
                </span>
                <span className="text-2xl" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="text-base font-semibold text-text sm:text-lg">
                  {option.label}
                </span>
              </button>
            );
          })}
        </fieldset>
      </div>

      <button
        type="button"
        onClick={goBack}
        className="transition-smooth mt-8 self-start rounded-full border-2 border-border bg-surface px-5 py-2.5 text-sm font-bold text-text hover:-translate-y-0.5 hover:shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ← {step === 0 ? "Cancel" : "Back"}
      </button>
    </section>
  );
}
