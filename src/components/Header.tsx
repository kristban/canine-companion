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
          className="transition-smooth group flex items-center gap-2 rounded-full hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span
            className="transition-smooth inline-block text-2xl group-hover:-rotate-12"
            aria-hidden="true"
          >
            🐾
          </span>
          <span className="transition-smooth text-lg font-extrabold tracking-tight text-text group-hover:text-primary sm:text-xl">
            Canine Companion
          </span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
