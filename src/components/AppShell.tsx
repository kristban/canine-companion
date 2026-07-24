"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";
import { Quiz } from "./Quiz";
import { Results } from "./Results";
import { SignupForm } from "./SignupForm";
import { Breed } from "@/lib/breeds";
import { QuizOption } from "@/lib/questions";
import { matchBreeds, MatchResult } from "@/lib/match";

type View = "landing" | "quiz" | "results";

export function AppShell({ breeds }: { breeds: Breed[] }) {
  const [view, setView] = useState<View>("landing");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [answers, setAnswers] = useState<QuizOption[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") === "quiz") {
      setView("quiz");
      window.history.replaceState(null, "", "/");
    }
  }, []);

  function handleComplete(quizAnswers: QuizOption[]) {
    setAnswers(quizAnswers);
    setResults(matchBreeds(quizAnswers, breeds));
    setView("results");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onLogoClick={() => setView("landing")}
        onStart={() => setView("quiz")}
      />
      <main className="flex flex-1 flex-col">
        {view === "landing" && (
          <Landing onStart={() => setView("quiz")} breeds={breeds} />
        )}
        {view === "quiz" && (
          <Quiz
            onComplete={handleComplete}
            onCancel={() => setView("landing")}
          />
        )}
        {view === "results" && (
          <Results
            results={results}
            answers={answers}
            onRestart={() => setView("quiz")}
          />
        )}
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
