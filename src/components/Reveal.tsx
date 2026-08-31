"use client";

import { useEffect, useRef, useState } from "react";

// Fades + rises an element in once it scrolls into view. Motion is killed
// globally for prefers-reduced-motion (see globals.css), so this doesn't
// need to check that itself — under reduced motion the .reveal ->
// .reveal-visible transition just resolves instantly instead of animating.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, className: visible ? "reveal reveal-visible" : "reveal" };
}

// A plain <div> wrapper around useReveal, for wrapping server-rendered
// content (e.g. ArticleCard) where adding a ref/hook to the content itself
// would mean converting it to a client component. Only use this where an
// extra wrapping <div> is harmless — not around <li> elements inside a
// <ul>/<ol>, where it would break list semantics (use useReveal directly
// on the <li> instead, from a client component).
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, className: revealClassName } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${revealClassName} ${className}`}>
      {children}
    </div>
  );
}
