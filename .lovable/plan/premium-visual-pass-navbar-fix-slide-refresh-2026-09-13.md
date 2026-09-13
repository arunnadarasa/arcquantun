# Premium visual pass + navbar fix + slide refresh

Three things: make the site feel high-end, stop the desktop menu from being cut off, and bring the Arc, ENS and World slides up to date with what the app now actually does.

## 1. Navigation (desktop cropping)

Ten items at full width no longer fit inside the centred container, so the last ones get clipped.

- Widen the header container to the full viewport with generous side padding, keeping page content at its current width.
- Group the ten links into three: primary run flow (Exchange, Agents, Settlements), proof layers (Identity, Human, Device) collapsed under one "Proof" menu, and evidence (Evidence, Quantum gap, Architecture, Deck) under one "Evidence" menu.
- Active state highlights the parent group when a child page is open; the current page keeps its underline.
- A sliding highlight follows the active item; keyboard focus and Escape-to-close behave correctly.
- Mobile menu becomes a full-height panel with the same three groups and larger tap targets.
- Add a compact "Run a pathway" call-to-action on the right so the bar reads as a product, not a list.

## 2. Premium look and feel

Keeping the existing instrument-panel identity (deep slate, signal amber, verdict green/red) and the existing fonts — refining, not restyling.

- Header: thin gradient hairline under the bar, deeper blur, and a subtle shrink-on-scroll.
- Hero on the Exchange page: larger display headline with the signal gradient on the key phrase, a live status strip (Arc Testnet, Nexus emulator, device gate) and a soft spotlight that tracks the pointer.
- Cards: unify on the existing glass treatment with a faint top-edge highlight, tighter shadow, and a restrained lift on hover.
- Numbers and verdicts: tabular figures, verdict pills with a soft glow matching their tone, and a short count-up when results land.
- Section rhythm: consistent heading kickers, more vertical breathing room, and a divider that fades in from the centre.
- Motion: staggered fade-and-rise on first paint per section, and gate steps that fill in sequence as the run advances. All of it disabled under reduced-motion.
- Footer: restructured into three columns (what this is, the rails, the disclaimer) instead of one dense paragraph.

## 3. Slides — Arc, ENS, World

- **Arc**: state the settled facts plainly — chain 5042002, USDC as gas, four Circle wallets, the ReceiptAnchor address, anchor-before-payment ordering, and that a losing method still gets paid with the loss on the record. Add the real Arcscan-verifiable framing.
- **ENS**: replace generic wording with the actual shape — ENSv2 Sepolia subnames under clinicalquantum.eth, records carrying the Arc actor address plus a permitted intent, resolution through the Universal Resolver before release, and the custom AgentResolver we had to deploy.
- **World**: keep the nullifier-hash-only stance, authority bound to one pathway and never rebound, unauthorised runs settling 0.00, and the sandbox-pending label on demo credentials.
- Each of the three gets the same premium slide treatment: gradient kicker, one large claim, a three-item evidence row, and the address/identifier line in mono at chrome size.
- Also refresh the boundary slide so the Nexus leg reads as executed on the H2 emulator with its job id, not as a committed offline run, and mention the Ledger device tap in the gate order.

## Technical notes

- All colour work goes through existing tokens in `src/styles.css`; new gradients, glows and the highlight are added there as tokens, never hardcoded in components.
- Navbar rebuild lives in `src/components/shell.tsx` using the existing shadcn navigation primitives; route list stays the single source.
- Slide edits are in `src/data/deck.tsx` only, using the existing `SlideFrame` and `.slide-*` classes so the print/PDF route stays byte-correct at 1920x1080.
- Density check on each edited slide: header ~100px + body + footer ~80px must stay inside 1080px.
- No changes to gating, receipts, settlement or any server logic.
