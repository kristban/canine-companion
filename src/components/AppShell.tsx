"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";
import { Quiz } from "./Quiz";
import { Results } from "./Results";
import { QuizOption } from "@/lib/questions";
import { matchBreeds, MatchResult } from "@/lib/match";

type View = "landing" | "quiz" | "results";

export function AppShell() {
  const [view, setView] = useState<View>("landing");
  const [results, setResults] = useState<MatchResult[]>([]);

  function handleComplete(answers: QuizOption[]) {
    setResults(matchBreeds(answers));
    setView("results");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogoClick={() => setView("landing")} />
      <main className="flex flex-1 flex-col">
        {view === "landing" && (
          <Landing onStart={() => setView("quiz")} />
        )}
        {view === "quiz" && (
          <Quiz
            onComplete={handleComplete}
            onCancel={() => setView("landing")}
          />
        )}
        {view === "results" && (
          <Results results={results} onRestart={() => setView("quiz")} />
        )}
      </main>
      <Footer />
    </div>
  );
}
