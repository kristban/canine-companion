"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
}

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Please enter your name.";
    }
    if (!email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setName("");
    setEmail("");
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 4000);
  }

  return (
    <section
      aria-labelledby="signup-heading"
      className="w-full border-t-3 border-border bg-background-alt"
    >
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <h2
          id="signup-heading"
          className="scroll-mt-24 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl"
        >
          Stay in the loop
        </h2>
        <p className="mt-3 text-lg text-muted">
          Sign up to hear about new breeds and features. No spam, ever.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 flex flex-col gap-4 rounded-3xl border-3 border-border bg-surface p-6 text-left shadow-hard sm:p-8"
        >
          <div>
            <label
              htmlFor="signup-name"
              className="text-sm font-bold text-text"
            >
              Name
            </label>
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              className={`transition-smooth mt-1.5 w-full rounded-2xl border-2 bg-background px-4 py-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                errors.name ? "border-red-500" : "border-border"
              }`}
            />
            {errors.name && (
              <p
                id="signup-name-error"
                className="mt-1.5 text-sm font-semibold text-red-600"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="text-sm font-bold text-text"
            >
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "signup-email-error" : undefined
              }
              className={`transition-smooth mt-1.5 w-full rounded-2xl border-2 bg-background px-4 py-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                errors.email ? "border-red-500" : "border-border"
              }`}
            />
            {errors.email && (
              <p
                id="signup-email-error"
                className="mt-1.5 text-sm font-semibold text-red-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="transition-smooth mt-2 self-center rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign up
          </button>
        </form>
      </div>

      <div
        className={`transition-smooth fixed right-4 top-20 z-30 sm:right-6 ${
          toastVisible
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[120%] opacity-0"
        }`}
      >
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-2xl border-2 border-border bg-surface px-5 py-4 shadow-hard"
        >
          {toastVisible && (
            <>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-sm font-bold text-text"
                aria-hidden="true"
              >
                ✓
              </span>
              <div>
                <p className="text-sm font-bold text-text">
                  You&apos;re signed up!
                </p>
                <p className="text-xs text-muted">
                  We&apos;ll let you know when there&apos;s news.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
