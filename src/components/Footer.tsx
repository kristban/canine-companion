import Link from "next/link";

const productLinks = [
  { label: "How it works", href: "/#how-it-works-heading" },
  { label: "Meet the breeds", href: "/#breed-showcase-heading" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t-3 border-border bg-background-alt">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-secondary text-lg"
                aria-hidden="true"
              >
                🐾
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-text">
                Canine Companion
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Helping you find the dog breed that fits your life.
            </p>
          </div>

          <nav aria-labelledby="footer-product-heading">
            <h3
              id="footer-product-heading"
              className="text-sm font-extrabold uppercase tracking-wide text-text"
            >
              Product
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-smooth text-sm text-muted hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal-heading">
            <h3
              id="footer-legal-heading"
              className="text-sm font-extrabold uppercase tracking-wide text-text"
            >
              Legal
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-smooth text-sm text-muted hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <address className="not-italic">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-text">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href="mailto:hello@caninecompanion.app"
                  className="transition-smooth break-words text-sm text-muted hover:text-primary"
                >
                  hello@caninecompanion.app
                </a>
              </li>
              <li className="text-sm text-muted">Portland, OR</li>
            </ul>
          </address>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t-2 border-border pt-6 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>&copy; {year} Canine Companion. All rights reserved.</p>
          <p>Made with 🐾 for dog lovers everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
