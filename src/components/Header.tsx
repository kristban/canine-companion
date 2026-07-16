interface HeaderProps {
  onLogoClick: () => void;
  onStart: () => void;
}

export function Header({ onLogoClick, onStart }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b-3 border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onLogoClick}
          className="transition-smooth group flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-secondary text-lg group-hover:-rotate-12 transition-smooth"
            aria-hidden="true"
          >
            🐾
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-text sm:text-xl">
            Canine Companion
          </span>
        </button>
        <button
          type="button"
          onClick={onStart}
          className="transition-smooth rounded-full border-2 border-border bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Start the quiz
        </button>
      </div>
    </header>
  );
}
