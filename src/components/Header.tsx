import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🐾
          </span>
          <span className="text-lg font-extrabold tracking-tight text-text sm:text-xl">
            Canine Companion
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
