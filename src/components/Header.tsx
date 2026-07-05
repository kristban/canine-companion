import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onLogoClick: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onLogoClick}
          className="transition-smooth flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="text-2xl" aria-hidden="true">
            🐾
          </span>
          <span className="text-lg font-extrabold tracking-tight text-text sm:text-xl">
            Canine Companion
          </span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
