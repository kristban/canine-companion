interface Step {
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: "📋",
    title: "Answer a few questions",
    description:
      "Tell us about your home, activity level, experience, and household in a quick 9-question quiz.",
  },
  {
    icon: "🧠",
    title: "We score every breed",
    description:
      "Your answers are weighed against traits like energy, grooming needs, and temperament for 20 popular breeds.",
  },
  {
    icon: "🐾",
    title: "Meet your matches",
    description:
      "See your best-fitting breeds ranked by match percentage, with details on what makes each one a good fit.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="text-center">
        <h2
          id="how-it-works-heading"
          className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl"
        >
          How it works
        </h2>
        <p className="mt-3 text-lg text-muted">
          Three simple steps to finding your future best friend.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="transition-smooth relative flex flex-col items-center rounded-3xl border border-border bg-surface p-6 text-center shadow-sm hover:-translate-y-1 hover:shadow-lg"
          >
            <span
              className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="mt-4 text-4xl" aria-hidden="true">
              {step.icon}
            </span>
            <h3 className="mt-4 text-lg font-bold text-text">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
