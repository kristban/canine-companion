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

const STEP_COLORS = ["bg-secondary", "bg-primary", "bg-accent"];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="w-full border-t-3 border-border bg-background-alt"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="scroll-mt-24 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl"
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
              className="transition-smooth relative flex flex-col items-center rounded-3xl border-3 border-border bg-surface p-6 text-center shadow-hard hover:-translate-y-1"
            >
              <span
                className={`absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border ${STEP_COLORS[index]} text-sm font-extrabold text-text`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span
                className={`mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border ${STEP_COLORS[index]}/40 text-4xl`}
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
