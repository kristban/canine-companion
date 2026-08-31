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
  // Set only when returning to the quiz to edit an answer (as opposed to a
  // full "Retake the quiz" restart), so Quiz knows to resume with the
  // previous answers instead of starting blank.
  const [resumeAtLastQuestion, setResumeAtLastQuestion] = useState(false);

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
    }
  }, []);

  function handleComplete(quizAnswers: QuizOption[]) {
    setAnswers(quizAnswers);
    setResults(matchBreeds(quizAnswers, breeds));
    setView("results");
  }

  function handleRestart() {
    setResumeAtLastQuestion(false);
    setView("quiz");
  }

  function handleEditLastAnswer() {
    setResumeAtLastQuestion(true);
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
            onCancel={() => setView("landing")}
            initialAnswers={resumeAtLastQuestion ? answers : undefined}
            initialStep={
              resumeAtLastQuestion ? Math.max(0, answers.length - 1) : 0
            }
          />
        )}
        {view === "results" && (
          <Results
            results={results}
            answers={answers}
            onRestart={handleRestart}
            onEditLastAnswer={handleEditLastAnswer}
          />
        )}
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
