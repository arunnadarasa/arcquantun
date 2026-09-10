// Fixed 1920x1080 slide stage, scaled to fit whatever box it is dropped into.
// One component serves the editor view, the thumbnail grid, fullscreen
// presenting and the print sheet, so every context shows identical geometry.
import { useEffect, useRef, useState, type ReactNode } from "react";

/** The slide itself. Always laid out at 1920x1080 coordinates. */
export function SlideCanvas({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`slide-content bg-background text-foreground ${className}`}>{children}</div>
  );
}

/**
 * Scales its child slide to fit the available box. Absolutely positioned and
 * centred so the transform shrinks symmetrically around the centre.
 */
export function ScaledSlide({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / 1920, height / 1080));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Standard slide chrome: kicker, title, body area, footer with page number. */
export function SlideFrame({
  kicker,
  title,
  index,
  total,
  children,
}: {
  kicker?: string;
  title?: string;
  index: number;
  total: number;
  children?: ReactNode;
}) {
  return (
    <SlideCanvas>
      <div className="pointer-events-none absolute inset-0 aurora-field opacity-45" />
      <div className="pointer-events-none absolute inset-0 grid-veil opacity-25" />
      <div className="relative flex h-full flex-col px-[120px] pb-[70px] pt-[80px]">
        {kicker ? <p className="slide-kicker text-primary">{kicker}</p> : null}
        {title ? <h2 className="slide-title mt-[18px] max-w-[1500px]">{title}</h2> : null}
        <div className="mt-[48px] flex-1">{children}</div>
        <div className="flex items-center justify-between border-t border-border pt-[24px]">
          <span className="slide-chrome text-muted-foreground">
            Clinical Quantum Exchange · Arc Testnet 5042002 · testnet USDC
          </span>
          <span className="slide-page text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
      </div>
    </SlideCanvas>
  );
}

/** A bordered panel sized for slide type. */
export function SlideCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card/70 p-[36px] ${className}`}>
      {children}
    </div>
  );
}

/** Bullet list at slide body size. Four items maximum by house rule. */
export function SlideBullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[26px]">
      {items.map((t) => (
        <li key={t} className="slide-body flex gap-[22px] text-foreground/90">
          <span className="mt-[14px] size-[12px] shrink-0 rounded-full bg-primary" />
          <span className="max-w-[1400px]">{t}</span>
        </li>
      ))}
    </ul>
  );
}
