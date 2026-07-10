---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
  - "src/app/globals.css"
---

# Neobrutalism design system (AD-005)

This project's UI is a **neobrutalism** system. Before adding or modifying any component,
screen, or token, **read the canonical contracts**: [`agent_docs/design.md`](../../agent_docs/design.md)
(tokens, palette, banned list) and [`agent_docs/system.md`](../../agent_docs/system.md)
(component usage, when/when-not, APIs). They are the single source of truth.

Non-negotiable constraints (enforced here so they apply the moment a UI file is opened):

- **Visual language**: 3px solid black borders, hard zero-blur offset shadows
  (`shadow-brutal` / `-sm` / `-lg`), square corners (`--radius: 0`), flat fills, physical
  hover (shift toward shadow) / active (offset collapse + translate). Bold everywhere,
  including RSVP training and assessment reading surfaces.
- **Palette**: monochrome base + `#FFD23F` (`--main`: primary/highlights/active) and
  `#FF6B6B` (`--error`: errors only). Text on accents is **always black**. Success is
  non-color (icon + pt-BR text + border). **No green. No white-on-accent. No gradients.**
- **No DaisyUI** — never use `btn`, `card`, `input-bordered`, `label-text`, `form-control`,
  `alert-error`, `badge`, `join`, `divider`, `range`, `tab`, etc. Use the primitives/
  wrappers in `src/components/ui/` and `src/components/`.
- **Reuse, don't rebuild** — prefer wrappers (`src/components/{Button,Card,…}.tsx`) over
  the raw primitives; never invent Button/Card variants. Add new components via
  `npx neobrutal add` or a hand-rolled token-driven primitive.
- **Accessibility** — every input gets `<Label htmlFor>` + `required`; every interactive
  element gets `focus-brutal`; meet WCAG AA contrast; tap targets ≥44px; mobile-first.

If an existing component doesn't fit the need, extend the token system / CVA variants in
`src/components/ui/` and `src/app/globals.css` — do not hard-code hex or bypass tokens.