// Scroll-reveal primitives. No dependency: one IntersectionObserver hook,
// and everything renders instantly when the visitor asks for reduced motion.
import { useEffect, useRef, useState, type ReactNode } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1200,
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Meter({
  value,
  max = 1,
  tone = "signal",
  delay = 0,
}: {
  value: number;
  max?: number;
  tone?: "signal" | "pass" | "fail" | "gap";
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg =
    tone === "signal"
      ? "var(--gradient-signal)"
      : tone === "pass"
        ? "linear-gradient(90deg, var(--pass), var(--accent))"
        : tone === "gap"
          ? "linear-gradient(90deg, var(--gap), var(--primary))"
          : "linear-gradient(90deg, var(--fail), var(--gap))";

  return (
    <div ref={ref} className="h-1 w-full overflow-hidden rounded-full bg-secondary/70">
      <div
        className="h-full rounded-full"
        style={{
          width: inView ? `${pct}%` : "0%",
          background: bg,
          transition: `width 1s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms`,
        }}
      />
    </div>
  );
}
