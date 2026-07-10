# PLAN.md — Development Journey

This documents how I built the 4-step event-registration wizard (Attendee Info → Session
Selection → Add-ons → Review & Submit). Two companion documents carry the full detail:

- **`JOURNAL.md`** — one entry per commit, in commit order: the narrative as it happened.
- **`IMPLEMENTATION_PLAN.md`** — the living engineering plan: 45 numbered decisions
  (D1–D45) with rationale, the Figma frame catalog with recorded visual discrepancies, and
  the acceptance-criteria → test map.
- Plus **25 merged PRs** on GitHub, each surfacing its own judgment calls, traps, and open
  questions in the description.

Final state: 82 commits across 25 PRs, 201 unit tests green, `yarn check` clean,
pixel-verified against Figma, responsive (768/1024), and localized (en + zh-TW).

> **Running it:** `yarn dev` starts at **http://localhost:9001**, not `:9000` as the
> README's Getting Started says — the provided starter's `quasar.config.js` sets
> `devServer.port: 9001`. Since the README is treated as read-only spec, I noted the
> mismatch here instead of editing it.

---

## How I planned and broke down the task

**Process before code.** I spent the first PRs building the working agreement, not features:

1. **A project constitution (`CLAUDE.md`)** that both the AI and I must follow: `README.md`
   is the immutable functional spec (never edited), Figma is the visual source of truth
   (matched by measured values, not eyeballed), plain JavaScript only, design tokens only
   (no hardcoded hex), and a mandatory spec-driven flow — _specify → plan → tasks →
   implement → verify → review_ — where each arrow is a blocking gate.
2. **A human review gate.** All work lands on branches and goes through a PR sized to ~20
   minutes of senior review. The AI opens the PR but may never approve or merge its own
   work; I review and merge. A PR template forces the AI to surface its judgment calls,
   spec-gap fills, and open questions — so review time lands where the risk is.
3. **Scope-change governance.** The spec can grow, but only via dated, append-only addenda
   from an authoritative source — never by silently drifting from `README.md`.

**Build order: pure logic before UI.** Every rule with a number in it shipped as a tested,
framework-free module before any component consumed it:

- Foundation logic (PR #6): async data facade, currency/wall-clock datetime helpers,
  capacity, strict-overlap conflict detection — 34 tests before any UI existed.
- Wizard shell + state (#7–#10): provide/inject store, free-navigation stepper, Step 1.
- Steps 2–3 (#11–#14, #19): sessions, pricing engine (`useOrderSummary`, again pure logic
  first in #12), workshops, merchandise, meals.
- Step 4 (#15–#18): deliberately split into four PRs — pure validation logic → review UI →
  validation wiring → async submit + success screen — so each judgment call was reviewable
  before UI depended on it.
- Polish (#21–#24): UX (skeletons, transitions, scroll-to-error), responsive breakpoints,
  i18n copy extraction.

This cadence meant the killer acceptance tests (VIP discount math, capacity, time-conflict
boundaries) were green and reviewed before a single pixel depended on them.

---

## Key decisions and why

| Decision                                                                | Why                                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Async facade over the sync mocks** (D1)                               | Loading/pending states become real, and swapping in a real `fetch` later changes nothing downstream.                                                                                                |
| **`provide/inject` composable store, not Pinia** (D2)                   | The state need is one wizard; adding a store library is negative restraint. A plain `createRegistration` factory stays unit-testable without a component.                                           |
| **Pricing is fully computed, zero watchers** (D3)                       | The hardest sequence — VIP → add workshop → Review → Edit → switch to General — needs the discount to vanish with **no** reconciliation code. Computeds make that free.                             |
| **Wall-clock timezone policy** (D4)                                     | Timestamps are UTC but mean event wall-clock. Using the viewer's offset would shift an 18:30Z workshop onto the wrong day for most of the world (including my UTC+8).                               |
| **Strict-inequality overlap** (D6)                                      | The mock data is engineered around a 14:00Z touch boundary — back-to-back sessions must stay co-selectable, so touching endpoints are not a conflict.                                               |
| **All validation at submit, then "reward early, punish late"** (D7/D36) | README defers validation to Step 4. After the first failed submit, errors clear live as fields become valid — a single `submitted` flag, no per-field touched map (the live recompute subsumes it). |
| **Stale conflicts are kept and surfaced, never auto-removed** (D10/D33) | Never mutate the user's selections behind their back. A workshop that becomes conflicting stays selected, is flagged on its card, and errors at submit.                                             |
| **Custom token-styled stepper, not Quasar's `QStepper`** (D13)          | Material defaults fight the Figma design, and navigation must be free/non-linear (not validation-gated).                                                                                            |

---

## Where the spec was silent or Figma was unclear

These are the calls that couldn't be read directly from `README.md` or the frames. Every
one is numbered in the decision log and was flagged in its PR — usually with an explicit
exit hatch ("one-line removal if you disagree") so the reviewer could veto cheaply.

- **The Step 2 frame is a state catalog, not a literal screen (D24).** It draws an
  actually-full session as selectable and a not-full one as disabled — mutually
  inconsistent. I let README drive behavior (full = disabled; no conflict-gating at Step 2)
  and took only the _visual language_ of each state from the frame.
- **Capacity color bands (D25).** README asks only for "remaining spots"; the frame
  color-codes the bar with no stated cutoffs. I fitted four thresholds (<50 / ≥50 / ≥75 /
  100%) that reproduce **all six** day-1 cards exactly, and applied the rule everywhere.
- **Ticket selection is required at submit (D34b).** README's Step-1 field table omits the
  ticket, but a ticketless registration has no price and no ticket line. Filed as a
  spec-gap fill with a one-line removal offered.
- **"Subtotals" (D35b).** README says "breakdown with subtotals and grand total"; the frame
  shows line items → discount → Grand Total with **no** aggregate subtotal row. Two
  independent extractions agreed, so I read "subtotals" as per-line amounts and flagged it.
- **No Figma frame exists at all** for: the Meal Packages card (D41 — designed by reusing
  the workshop-card pattern minus time/capacity), the workshop time-conflict state (D31 —
  non-selectable with a warning naming the conflicting session), the pending-submit
  affordance (spinner + disabled button), and any responsive behavior (D44 — Figma is a
  fixed 1440 frame; I designed 768/1024 breakpoints mobile-first while keeping the 1440
  rendering byte-identical so the parity gate stays provable).
- **Currency format: README vs Figma (D42).** README mandates `$X,XXX.XX`; the frames draw
  whole-dollar prices with no cents (`$299`, `$45`). Resolved toward Figma with my
  confirmation: whole dollars drop the `.00`, genuinely fractional amounts keep two
  decimals — display-only, so the `$14.90` discount is never misreported as `$15`.
- **Copy conflicts resolved toward the frame** ("Sold Out" vs README's "full"), and the
  confirmation-number format (`WDS-XXXXXXXX`) invented since both sources are silent.
- **Two calls the human review corrected** — proof the gate works: AI first read a darker
  input border as a focus style; the reviewer confirmed it is the shipping-required state
  (label gains `*`, border darkens at rest — D38→D39). And I initially declined a stepper
  error badge after inspecting only a partial frame; the reviewer pointed at the full error
  frame, which does show it (D36f→D37). Both were superseded on the record, not silently.

---

## Additional dependencies (vs. the initial scaffold)

**Exactly one runtime dependency was added: `vue-i18n`.** Everything else is dev-only
tooling. The README suggests `date-fns`/`lodash-es` are fair game — I deliberately added
neither (see below).

| Package                                            | Kind    | Why it's here                                                                                                                                                   | Alternatives considered                                                                                                                 |
| -------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `vue-i18n@11`                                      | runtime | Extracts all 105 UI strings behind locale files (en default + zh-TW) with a header language switcher; also consolidated duplicated conflict copy under one key. | A hand-rolled reactive dictionary — rejected: no pluralization/interpolation contract, and vue-i18n is the Vue-standard reviewers know. |
| `eslint`, `@eslint/js`                             | dev     | Code-quality gate (`yarn check`) — unused vars, Vue mistakes, correctness rules.                                                                                | Biome/oxlint — faster but younger Vue SFC support; I chose the ecosystem standard.                                                      |
| `eslint-plugin-vue` + `vue-eslint-parser`          | dev     | The Vue-specific rules and the parser that lets ESLint read `.vue` SFC templates.                                                                               | None realistic — this is _the_ Vue lint stack.                                                                                          |
| `globals`                                          | dev     | Standard browser/node global definitions for ESLint flat config.                                                                                                | Hand-listing globals — needless maintenance.                                                                                            |
| `prettier`                                         | dev     | Mechanical formatting so diffs stay review-focused; `yarn check` fails on drift.                                                                                | ESLint stylistic rules — the ecosystem has moved formatting out of linters.                                                             |
| `eslint-config-prettier`                           | dev     | Disables ESLint rules that would fight Prettier — one tool owns formatting.                                                                                     | —                                                                                                                                       |
| `vitest`                                           | dev     | Test runner for the 201 business-logic + component tests. Vite-native, so SFCs compile in tests exactly as in the app, with zero transform config.              | Jest — needs babel/transform setup for Vite+SFC projects and isn't what Quasar's official testing extension targets.                    |
| `@vue/test-utils`                                  | dev     | Official low-level component mounting/interaction API.                                                                                                          | Testing Library Vue — a layer on top; I preferred the official primitive for fine-grained assertions (a11y roles, classes).             |
| `@quasar/quasar-app-extension-testing-unit-vitest` | dev     | Quasar's official Vitest app extension — provides `installQuasarPlugin()` so components using Quasar internals mount correctly in tests.                        | Hand-wiring Quasar into the test env — reinventing what the official extension maintains.                                               |
| `@vitejs/plugin-vue` + `@quasar/vite-plugin`       | dev     | Required by `vitest.config.mjs` to compile SFCs (and Quasar's `transformAssetUrls`) outside `quasar dev`, which normally injects them.                          | —                                                                                                                                       |
| `resolutions: { vite: ^6.1.0 }`                    | —       | Forces the whole tree (Quasar CLI + Vitest + plugins) onto a single Vite 6 copy so dev and tests share identical SFC transforms.                                | —                                                                                                                                       |

**What I deliberately did _not_ add:**

- **Pinia** — provide/inject + a factory covers one wizard's state and is directly testable (D2).
- **date-fns** — it formats in the viewer's local timezone, which is exactly what the
  wall-clock policy must avoid (D4); the two hand-rolled UTC helpers are ~30 lines and fully tested.
- **lodash-es** — nothing needed it.

---

## How I used AI tools

I drove the entire build with **Claude Code (Opus 4.8, max effort)** as the implementer and
myself as reviewer/merger. Highlights of what that actually looked like:

- **Learning Vue on the fly.** I come from React/Next.js with zero prior Vue experience, so
  the very first thing I did was have the AI generate a self-contained HTML crash course to
  learn Vue basics — then relied on the AI for most implementation and focused my time on
  reviewing its output and decisions.
- **A constitution instead of per-prompt instructions.** Rules that must survive every
  session (plain JS only, tokens only, the SDD gates, pixel-parity verification) live in
  `CLAUDE.md`, which the agent loads every time — I hardened it whenever review found a
  gap (e.g. pixel-parity became a written gate after PR #7's fidelity misses).
- **Skills + MCP as the toolbelt:** Quasar/Vue/UnoCSS/testing skills to keep generated code
  idiomatic (translated from their TypeScript examples to plain JS), the **Figma Dev Mode
  MCP** for design extraction, and **agent-browser** to drive the running app and verify
  computed styles element-by-element.
- **Multi-agent verification before human review.** Figma frames were extracted by
  subagents returning token-mapped specs — for high-risk frames, two independent
  extractions reconciled against each other. Pricing test numbers were re-derived from the
  raw mocks by agents blind to the test file. Before each PR, an adversarial `/code-review`
  workflow (up to 27 subagents across 9 review lenses) attacked the diff; confirmed
  findings were fixed pre-review, dismissed ones recorded with rationale.

**What worked:**

- Spec-gap fills flagged with exit hatches made human review fast and targeted.
- The adversarial review workflows caught real bugs tests missed — e.g. a selection ring
  that silently rendered as `box-shadow: none` because UnoCSS never emits classes built via
  template interpolation, and a full-but-selected workshop that locked the user out of
  deselecting.
- In-browser `getComputedStyle` verification caught what eyeballing never would (a divider
  that didn't render for lack of `border-style`, phantom 3px borders from a missing CSS reset).

**What didn't (and the fix):**

- **The AI invented plausible details** — chevron icons on buttons, a calendar logo, a
  Material check glyph — none in Figma. Review caught them; "don't invent Figma details"
  became written doctrine, and later extractions were told to verify-or-omit.
- **The first Figma pipeline was inaccurate.** I started on an open-source Figma MCP
  (no Dev Mode access) whose measurements drifted; after switching to the official Dev Mode
  server I re-audited the already-built shell and corrected every discrepancy (PR #9).
- **AI verbosity needed pruning** — my first journal entries were too long; I asked for
  brief description + critical judgment only, and that became the standing convention.
- **One model for everything was slow.** Opus 4.8 at max effort for trivial tasks (docs
  sync, mechanical fixes) wasted wall-clock time — see improvements below.

---

## Challenges and how I solved them

- **Zero Vue experience.** I'm a React/Next.js engineer; this was my first Vue project. I
  used AI to bootstrap my mental model (crash course), leaned on official skills for
  idiomatic patterns, and shifted my own effort to where I could add value regardless of
  framework: spec fidelity, state architecture, review, and process.
- **Figma Dev Mode is paywalled.** The MCP needs Dev Mode, which needs a paid seat I don't
  have on Nitra's file. I solved it by duplicating the file to my personal Figma account
  and upgrading my personal plan — then treated the copy as ground truth and re-verified
  prior work against it.
- **Quasar/UnoCSS/UA-stylesheet collisions** were the recurring technical trap: no CSS
  preflight ships, so unset border sides default to 3px, buttons keep UA chrome and
  `cursor: default`, and headings/lists keep UA margins (fixed with a small global
  normalize + grid layouts + shadow-based selection rings that add zero layout shift);
  Quasar's `!important` rules beat UnoCSS utilities (`disabled:!opacity-50`,
  `tablet:!inline`); Quasar's `.flex` helper force-wraps flex rows (banner icon stacking).
  Each fix was verified via computed styles, and each trap recorded so it was only paid once.
- **Timezone correctness.** All mock timestamps are UTC but mean event wall-clock; naive
  `Intl` formatting shifts sessions onto the wrong day for non-UTC viewers (and injects a
  U+202F space that breaks exact-copy assertions). Hand-rolled UTC formatters fixed both.

---

## What I would improve given more time

**Product / code:**

- **A submit-failure surface** (retry/error state). The mock never rejects, so I deferred
  it deliberately and flagged it on the PR — it's the first thing a real API integration needs.
- **Locale-aware date/currency formatting** (currently deliberately locale-independent to
  keep Figma parity deterministic), and a human zh-TW copy review.
- **CI + branch protection.** The gates (`yarn check`, tests, no self-merge) are currently
  honor-system; a CI pipeline plus protected `main` would enforce them mechanically, and
  Playwright E2E + visual-regression snapshots would automate the pixel-parity gate.

**Process / AI workflow:**

- **An orchestration layer above the coding agent** — a supervisor AI that plans the PR
  sequence, dispatches implementation, and enforces the gates, instead of me driving each turn.
- **Messenger integration for human-in-the-loop** — the agent regularly blocks on decisions
  only I can make (spec readings, visual confirmations); a ping into a chat app would cut
  the idle gaps between "agent done" and "human noticed".
- **Concurrent multi-agent development** — independent spec areas (e.g. Step 2 vs pricing
  engine) could be built in parallel by separate agents on separate branches; the missing
  piece is automated PR conflict resolution and a merge queue.
- **Task-appropriate model routing.** I ran Opus 4.8 at maximum effort for everything —
  great for architecture and tricky fidelity work, wasteful for mechanical fixes and docs.
  Routing small tasks to faster models would have cut total wall-clock significantly.
