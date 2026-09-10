# Refinement pass — borrow the polish from EndoTrack v1

The exchange works end to end; it currently looks flat next to EndoTrack v1. This pass lifts
four proven visual devices from that project and applies them here, without touching the run
flow, the receipt rules, or any claim wording.

## What changes on screen

1. **A living background.** A slow-drifting aurora wash plus a faint animated grid and a
   sparse particle field behind the hero, fading into the page. Static and calm, not flashy.
2. **Glass cards.** Pathway cards, agent cards and receipt cards get the translucent card
   treatment with a soft lift and a coloured edge on hover, instead of flat bordered boxes.
3. **Numbers that arrive.** The four hero figures count up when they scroll into view, and
   each pathway card gains a thin meter bar showing its classical floor against its scale.
4. **Sections that fade in.** Each card and section rises a few pixels into place on first
   scroll, so a long evidence page reads as a sequence rather than a wall.

Everything respects "reduce motion": with that setting on, all of it renders instantly and
still.

## Palette

Keep the current identity — dark slate with the amber signal colour, and green/red/yellow for
pass, fail and gap. The aurora and gradients get built from the amber and a cool teal-blue
accent so it reads as an instrument panel, not as a copy of the other project. Nothing about
the pass/fail colour meanings changes.

## What does not change

- No change to the run flow, the policy gate, the receipt grading, or the payment order.
- No change to any claim, number, verdict or piece of safety language.
- No new pages, no new dependencies, no backend changes.

## Technical notes

- `src/styles.css`: add `--gradient-signal`, `--gradient-aurora`, `--glow-signal`,
  `--shadow-glass`; add `aurora-field`, `glass-card`, `text-gradient`, `grid-veil` utilities
  and the `aurora-drift` / `grid-pan` keyframes; add the `prefers-reduced-motion` block and
  smooth scrolling. Existing tokens stay as they are.
- New `src/components/motion.tsx`: `Reveal`, `CountUp`, `Meter`, built on one shared
  `useInView` hook (IntersectionObserver, no dependency).
- New `src/components/aurora-background.tsx`: `AuroraBackground` plus a canvas `ParticleField`
  that bails out under reduced motion and cleans up its rAF loop on unmount. Rendered once in
  `src/components/shell.tsx` behind the content, `pointer-events-none`.
- Apply `glass-card` to the cards in `index.tsx`, `agents.tsx`, `evidence.tsx`,
  `architecture.tsx` and the settlement rows in `ledger.tsx`; wrap card grids in `Reveal`;
  swap the hero stat values for `CountUp`.
- Header keeps its solid backdrop blur so it stays readable over the moving field.
