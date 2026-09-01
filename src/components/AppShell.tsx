"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";
import { Quiz } from "./Quiz";
import { Results } from "./Results";
import { SignupForm } from "./SignupForm";
import { Breed } from "@/lib/breeds";
import { Article } from "@/lib/articles";
import { QuizOption } from "@/lib/questions";
import { matchBreeds, MatchResult } from "@/lib/match";
import { clearPendingResults, readPendingResults } from "@/lib/results";
import { clearQuizProgress, readQuizProgress } from "@/lib/quizProgress";

type View = "landing" | "quiz" | "results";

export function AppShell({
  breeds,
  articles,
}: {
  breeds: Breed[];
  articles: Article[];
}) {
  const [view, setView] = useState<View>("landing");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [answers, setAnswers] = useState<QuizOption[]>([]);
  // Set only when returning to the quiz to edit a specific answer (as
  // opposed to a full "Retake the quiz" restart), so Quiz knows to resume at
  // that question with the previous answers instead of starting blank.
  const [resumeAtIndex, setResumeAtIndex] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") === "quiz") {
      setView("quiz");
      window.history.replaceState(null, "", "/");
      return;
    }
    // Returning from Google sign-in mid-save: restore the results the visitor
    // stashed before the redirect so they can finish saving them.
    if (params.get("savePending") === "1") {
      const pending = readPendingResults();
      if (pending) {
        setAnswers(pending.answers);
        setResults(pending.results);
        setView("results");
      }
      clearPendingResults();
      window.history.replaceState(null, "", "/");
      return;
    }
    // A plain reload/revisit with no query params: resume an in-progress
    // quiz from sessionStorage rather than dropping back to the landing page.
    const saved = readQuizProgress();
    if (saved && (saved.step > 0 || saved.answers.length > 0)) {
      setView("quiz");
    }
  }, []);

  function handleComplete(quizAnswers: QuizOption[]) {
    clearQuizProgress();
    setAnswers(quizAnswers);
    setResults(matchBreeds(quizAnswers, breeds));
    setView("results");
  }

  function handleRestart() {
    clearQuizProgress();
    setResumeAtIndex(null);
    setView("quiz");
  }

  function handleEditAnswer(index: number) {
    setResumeAtIndex(index);
    setView("quiz");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onLogoClick={() => setView("landing")}
        onStart={() => setView("quiz")}
      />
      <main className="flex flex-1 flex-col">
        {view === "landing" && (
          <Landing
            onStart={() => setView("quiz")}
            breeds={breeds}
            articles={articles}
          />
        )}
        {view === "quiz" && (
          <Quiz
            onComplete={handleComplete}
            onCancel={() => {
              clearQuizProgress();
              setView("landing");
            }}
            initialAnswers={resumeAtIndex !== null ? answers : undefined}
            initialStep={resumeAtIndex ?? 0}
          />
        )}
        {view === "results" && (
          <Results
            results={results}
            answers={answers}
            onRestart={handleRestart}
            onEditAnswer={handleEditAnswer}
          />
        )}
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
