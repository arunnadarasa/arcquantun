import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Maximize,
  Printer,
  StickyNote,
  X,
} from "lucide-react";
import { ScaledSlide } from "@/components/slide";
import { deck } from "@/data/deck";

interface DeckSearch {
  slide: number;
  print: boolean;
}

export const Route = createFileRoute("/deck")({
  validateSearch: (search: Record<string, unknown>): DeckSearch => {
    const raw = Number(search["slide"]);
    const slide = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), deck.length) : 1;
    return { slide, print: search["print"] === true || search["print"] === "1" };
  },
  head: () => ({
    meta: [
      { title: "Deck — Clinical Quantum Exchange" },
      {
        name: "description",
        content:
          "The submission deck: agents paid in USDC on Arc for clinical assessment work, gated on a receipt a stranger can re-check.",
      },
      { property: "og:title", content: "Deck — Clinical Quantum Exchange" },
      {
        property: "og:description",
        content:
          "Problem, run order, agents, receipt grading, the blocked lane, and the honest boundary between what is live and what is simulated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeckPage,
});

function PrintSheet() {
  return (
    <div className="bg-background">
      {deck.map((s, i) => (
        <div key={s.id} className="print-slide">
          {s.render(i, deck.length)}
        </div>
      ))}
    </div>
  );
}

function DeckPage() {
  const { slide, print } = Route.useSearch();
  const navigate = useNavigate({ from: "/deck" });
  const index = slide - 1;
  const total = deck.length;
  const current = deck[index] ?? deck[0]!;

  const [grid, setGrid] = useState(false);
  const [notes, setNotes] = useState(false);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), total - 1);
      void navigate({ search: (prev) => ({ ...prev, slide: clamped + 1 }), replace: true });
    },
    [navigate, total],
  );

  useEffect(() => {
    document.title = `${index + 1}/${total} — ${current.label} · Clinical Quantum Exchange`;
  }, [index, total, current.label]);

  useEffect(() => {
    if (print) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key.toLowerCase() === "g") {
        setGrid((v) => !v);
      } else if (e.key.toLowerCase() === "n") {
        setNotes((v) => !v);
      } else if (e.key === "F5" || e.key.toLowerCase() === "f") {
        e.preventDefault();
        void document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (e.key === "Escape") {
        setGrid(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, print]);

  if (print) return <PrintSheet />;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="print-hide flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            ← Exchange
          </Link>
          <span className="num text-xs text-muted-foreground">
            {index + 1} / {total} · {current.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGrid((v) => !v)}
            className="rounded border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle slide grid"
          >
            {grid ? <X className="size-4" /> : <Grid3x3 className="size-4" />}
          </button>
          <button
            onClick={() => setNotes((v) => !v)}
            className={`rounded border border-border p-2 hover:text-foreground ${
              notes ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label="Toggle presenter notes"
          >
            <StickyNote className="size-4" />
          </button>
          <button
            onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
            className="rounded border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Present fullscreen"
          >
            <Maximize className="size-4" />
          </button>
          <Link
            to="/deck"
            search={{ slide: index + 1, print: true }}
            className="rounded border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Open print sheet"
          >
            <Printer className="size-4" />
          </Link>
        </div>
      </header>

      {grid ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3">
            {deck.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  go(i);
                  setGrid(false);
                }}
                className={`overflow-hidden rounded-lg border text-left transition-colors ${
                  i === index ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <ScaledSlide className="aspect-video w-full">
                  {s.render(i, total)}
                </ScaledSlide>
                <span className="block border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  {i + 1}. {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex-1">
          <ScaledSlide className="h-full w-full">{current.render(index, total)}</ScaledSlide>
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="print-hide absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-muted-foreground backdrop-blur hover:text-foreground disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            className="print-hide absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-muted-foreground backdrop-blur hover:text-foreground disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      {notes && !grid ? (
        <div className="print-hide max-h-40 overflow-y-auto border-t border-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
            Presenter notes
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {current.notes}
          </p>
        </div>
      ) : null}

      <footer className="print-hide border-t border-border px-4 py-2 text-[0.68rem] text-muted-foreground">
        ← → or space to move · G grid · N notes · F fullscreen · printer icon for a PDF handout
      </footer>
    </div>
  );
}
