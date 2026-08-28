# NEXUS Brand Specification

> One honest brand. Two independent products. Zero artificial architecture.

This document defines the **shared Nexus brand identity** that both products
implement independently. It is a _conceptual_ token system — the definitions
below live inside each repository and are kept in sync by convention, not by a
shared package or monorepo.

**Products covered**

| Product      | Repo                            | Role                                    |
| ------------ | ------------------------------- | --------------------------------------- |
| NEXUS Tools  | `nexusauth0-cloud/nexus-tools`  | Web / PWA utility platform              |
| NEXUS Mobile | `nexusauth0-cloud/nexus-mobile` | Desktop / Android device control center |

The two products are technically independent. They are related by **brand
identity only** — no shared backend, database, accounts, authentication, or
forced integration.

---

## 1. Brand Personality

```
Precise · Technical · Modern · Confident · Minimal · Useful · Engineered
```

**Avoid:** corporate filler, childish decoration, overt cyberpunk / neon,
crypto or "generative-AI startup" clichés, and copying recognizable brands
(Vercel, Linear, Apple, Microsoft).

**Voice principles**

- State what the product does. Do not inflate.
- Prefer plain, precise language: _tools, control, utility, engineering,
  privacy, efficiency, precision_.
- Do not use "revolutionary", "world-class", "next-generation",
  "AI-powered everything", or "at any scale" unless genuinely supported.
- Never advertise fictional or aspirational features.

---

## 2. Logo Direction

**Mark: a hexagon.**

Both products already use a hexagonal mark — a shared, emergent motif.

- **NEXUS Tools** (`src/components/design-system/logo.tsx`): an outer hexagon
  outline plus an inner gold hexagon and center dot.
- **NEXUS Mobile** (sidebar, `src/components/layout/SidebarContent.tsx`): a
  gold-gradient tile with a hexagon glyph.

**Wordmark:** uppercase `NEXUS`, wide letter-spacing, in a geometric sans.

The hexagon + gold + `NEXUS` wordmark works at app, favicon, and small sizes, on
dark or light backgrounds. Preserve it; refine only where the sub-label is
needed to disambiguate the product (e.g. "NEXUS Tools" vs "NEXUS Mobile").

---

## 3. Color System

**Base — a neutral technical foundation (dark-first).**

Examples (per product, same philosophy, own tokens):

| Token          | NEXUS Tools (oklch)      | NEXUS Mobile (hsl) |
| -------------- | ------------------------ | ------------------ |
| Background     | `oklch(0.145 0.005 285)` | `0 0% 3.5%`        |
| Surface / card | `oklch(0.17–0.205 …)`    | `0 0% 6.5%`        |
| Border         | `oklch(0.28 0.008 285)`  | `0 0% 14%`         |
| Foreground     | `oklch(0.97 0.004 85)`   | `0 0% 96%`         |
| Muted fg       | `oklch(0.68 0.01 285)`   | `0 0% 62%`         |

**Brand accent — gold.**

Both products already share the gold accent. This is the single recognisable
Nexus color. It is used for primary actions, highlights, and the hexagon mark.

- NEXUS Tools: `--gold` / `--primary` = `oklch(0.8 0.145 85)`
- NEXUS Mobile: `--primary` / `--accent` = `45 74% 52%`, hardcoded golds
  `#e8c766` / `#b8860b` / `#d4af37`

**Product accents.** Where a product needs a second functional accent it may
keep its own (e.g. NEXUS Tools uses a violet `oklch(0.66 0.19 300)` secondary;
NEXUS Mobile uses status colors emerald/amber/red). Same company, different
products — the gold stays shared, the complementary palette stays product-local.

---

## 4. Typography

A single _principle_, not a single family across platforms:

- **UI / sans:** geometric, technical sans (NEXUS Tools: Geist Sans; NEXUS
  Mobile: Inter).
- **Display:** a stronger geometric family for headings/wordmark (NEXUS Mobile:
  Space Grotesk).
- **Mono:** a technical monospace for data, code, and labels (NEXUS Tools:
  Geist Mono; NEXUS Mobile: JetBrains Mono).

Keep each product's existing fonts — cross-app font duplication is not worth the
loading cost and platform differences. Uppercase `NEXUS` wordmarks use wide
letter-spacing (~0.18em) in both.

---

## 5. Spacing, Radius, Motion

- **Radius:** consistent small–medium radii for controls/cards
  (NEXUS Tools `--radius: 0.625rem`; NEXUS Mobile `--radius: 0.75rem`).
- **Spacing:** 4px-based scale, dense tool/control density preferred.
- **Motion:** short, purposeful transitions; respect
  `prefers-reduced-motion`. No heavy animation libraries for branding purposes.

---

## 6. Design Principles

1. **Dark-first, gold accents.** Share the mood, not the markup.
2. **Utility and control first.** Density is a feature for power users.
3. **Privacy by default.** On-device processing; no accounts where unnecessary.
4. **Accessible.** Preserve contrast, focus rings, keyboard navigation, and
   semantic markup.
5. **Lightweight.** No heavy image/video/animation payloads just for branding.

---

## 7. Taglines

**Selected brand tagline**

> **NEXUS — Technology built for useful work.**

This works for both a browser-based tool suite and a desktop control center,
and deliberately does **not** claim the products are integrated.

**Rejected alternatives**

- "One Nexus for everything" — implies false integration.
- "Everything, connected" — implies a shared platform that does not exist.
- "The unified cloud ecosystem" — misrepresents a desktop, offline-first app.
- "Infrastructure at any scale" — would reuse the fictional cloud-PaaS claim.

**Product taglines**

- NEXUS Tools — _Fast, private, offline-capable online tools. No accounts._
- NEXUS Mobile — _Android device control center for desktop._

---

## 8. Positioning

- **NEXUS Tools** — A privacy-conscious web utility platform for getting everyday
  technical tasks done quickly, in the browser, without accounts.
- **NEXUS Mobile** — A desktop control center for managing and debugging Android
  devices through ADB, scrcpy, and developer tooling.

---

## 9. Learning projects (not part of the brand)

- `nexus-landing` — a fictional cloud-PaaS marketing prototype. Keep separate;
  it does not represent the real products.
- `nexusauth` — an early HTML/CSS portfolio project. Not an authentication
  product; part of project history only.

Neither project should be presented as a live Nexus product or merged into the
shared identity.
