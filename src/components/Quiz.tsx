"use client";

import { useState } from "react";
import { questions, QuizOption } from "@/lib/questions";

interface QuizProps {
  onComplete: (answers: QuizOption[]) => void;
  onCancel: () => void;
}

export function Quiz({ onComplete, onCancel }: QuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizOption[]>([]);

  const question = questions[step];
  const progress = Math.round((step / questions.length) * 100);
  const selectedOptionId = answers[step]?.id;

  function selectOption(option: QuizOption) {
    const next = [...answers.slice(0, step), option];
    setAnswers(next);

    if (step === questions.length - 1) {
      onComplete(next);
    } else {
      setStep(step + 1);
    }
  }

  function goBack() {
    if (step === 0) {
      onCancel();
    } else {
      setStep(step - 1);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-border"
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

      <h2 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
        {question.question}
      </h2>
      <p className="mt-2 text-muted">{question.helperText}</p>

      <fieldset className="mt-8 flex flex-col gap-3">
        <legend className="sr-only">{question.question}</legend>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectOption(option)}
              aria-pressed={isSelected}
              className={`transition-smooth flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface hover:border-primary/60"
              }`}
            >
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

      <button
        type="button"
        onClick={goBack}
        className="transition-smooth mt-8 self-start rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ← {step === 0 ? "Cancel" : "Back"}
      </button>
    </section>
  );
}
