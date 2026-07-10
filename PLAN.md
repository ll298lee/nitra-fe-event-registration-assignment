# PLAN — Development Journey

## How I planned and broke it down

I'm running this as a spec-driven build. `README.md` is the immutable functional
spec (what to build — fields, validation, pricing, capacity, time-conflict
logic), the Figma page is the visual spec, and `CLAUDE.md` is the guardrail that
keeps both AI and me honest (plain JavaScript, design tokens only, specify →
plan → tasks → implement → verify → review). Each arrow is a blocking gate: I
don't cross it until the previous one is satisfied, so every line of code traces
back to a rule in the spec rather than to vibes.

The final gate is **review, done through GitHub**. No change counts as done until
it's on a branch, opened as a pull request, and approved + merged by a human (me)
— never committed straight to `main`. Review happens **per PR**, each sized to
roughly 20 minutes of a senior engineer's review, so a PR is one coherent change
(often several small commits) rather than a giant drop. Every PR uses a template
(`.github/pull_request_template.md`) that forces the agent to spell out its
judgment calls, traps, and open questions, so review time lands where it matters. The agent opens the PR and then hands off: it can't approve or merge its
own work, and it confirms the outcome by pulling PR state with the `gh` CLI
rather than assuming.

The spec is treated as read-only but not frozen: it can **grow**, only through
governed, dated addenda from an authoritative source (never by hand-editing
`README.md`, which stays a faithful copy of what I was given — a revised spec
replaces it wholesale from the source). When scope expands with new requirements
or new Figma frames, I classify it (a real change vs. my own idea), raise it,
capture it as an addendum, catalog the new frames, and then run it through the
same specify → plan → tasks → implement → verify → review flow as everything
else — so growth is auditable instead of smuggled in.

I work in small conventional commits, and this document is deliberately
organized to mirror that commit history — each `##` section below maps to one
commit, so the journey reads in the same order it was built.

**Current state:** the setup/tooling commits below are done. The 4-step
event-registration wizard (Step 1 Attendee Info → Step 2 Session Selection →
Step 3 Add-ons → Step 4 Review & Submit) is the next phase, and I'll append a
commit section here for each step as I go.

---

## chore: initial project scaffold / import Nitra starter baseline

Committed the provided Nitra starter repo unmodified first, so the baseline is a
clean reference point and every later diff is clearly my own work.

## chore: add .nvmrc and extend .gitignore

Pinned the toolchain with `.nvmrc` (Node 22.17, per the README requirement) so
the environment is reproducible, and extended `.gitignore` to keep build and
tooling output out of the committed diff.

## chore: set up ESLint and Prettier with Vue flat config

I come from the React/Next.js world, so here I just asked AI to configure ESLint
and Prettier with common Vue best practices.

### AI follow-up questions

- **The project is currently JavaScript-only (.vue + .js, no .ts files). Should
  the ESLint flat config include TypeScript support?**
  Answer: JS-only — the project came with a JavaScript-only setup, so I respect
  that setting.
- **How should linting/formatting be enforced?**
  Answer: Scripts only. I'm not adding linting/formatting to git-commit time,
  for convenience — if the codebase gets large, linting could take several
  seconds on every commit.
- **Prettier formatting style preferences?**
  Answer: Single quotes, semicolons. Single quotes for cleaner visuals (a
  personal style choice); semicolons to prevent the rare subtle bugs caused by
  JavaScript's automatic semicolon insertion.

### Command-line shortcuts

In `package.json` I also added yarn shortcuts for lint and format:

- **lint (ESLint)** checks code quality / correctness — unused variables,
  `no-debugger`, Vue-specific mistakes (bad `v-for` keys, misused directives,
  etc.). These are things a human should look at and decide on.
- **format (Prettier)** only rewrites whitespace and style — quotes, semicolons,
  line width, indentation. It's purely mechanical and always safe to auto-apply.

Two shortcuts do both lint and format in one line:

```jsonc
"check": "eslint . && prettier --check \"**/*.{js,vue,scss,json,md}\"",
"fix":   "eslint . --fix && prettier --write \"**/*.{js,vue,scss,json,md}\""
```

`check` for CI (fails on either), `fix` for a one-shot local cleanup.

## style: format codebase with ESLint and Prettier

A mechanical first pass applying the new Prettier/ESLint config across the
existing codebase, so all later diffs are style-clean and review-focused.

## chore: add Vitest for targeted business-logic tests

Asked AI to set up Vitest. The intent is targeted business-logic tests (not
coverage theatre) for the rules the mocks are built around: the VIP workshop
discount, capacity (`registered >= capacity`), time-conflict detection, and
currency formatting.

## chore: add relevant claude code skills and figma mcp and update .gitignore

### Agent skills

- **quasar-skilld** — keeps generated code on current Quasar 2 APIs.
- **unocss** — the app is styled with UnoCSS, so I want accurate utility
  guidance that reuses my existing tokens and shortcuts.
- **vue** — a dependable Vue 3.5 Composition API reference so SFCs use correct,
  current syntax.
- **vue-best-practices** — guides how components, props/events, and composables
  are structured to keep the code clean and idiomatic.
- **vue-testing-best-practices** — matches my Vitest + Vue Test Utils setup and
  helps write solid, non-brittle tests.
- **agent-browser** — browser automation CLI for driving the running app
  (navigate, fill forms, click, screenshot) to manually verify UI changes
  end-to-end.

### MCP servers

- **figma-mcp-free** — read-only design-to-code from Figma. I chose the
  open-source server because I don't have Dev Mode access to the provided Figma
  URL, which the official one requires.
- **figma-desktop** — tried the official Dev Mode server first, then removed it
  since I lack Dev Mode access to that file.

### Also

- **CLAUDE.md** — a guardrail reminding Claude this is plain JavaScript, since
  the skills lean toward TypeScript examples.

### Why gitignore the skill files

They're regenerable, machine-specific tooling (like `node_modules`) — not app
code — so I keep them out of the submission to keep the committed diff focused
on my actual work. I do track `skills-lock.json`, though: it's a small manifest
that pins each skill's source and hash, so the exact skill set stays
reproducible via `skills experimental_install` without committing the bulky
generated files.

## docs: add CLAUDE.md with project conventions and AI guardrails

AI prompt I used:

> update CLAUDE.md to enforce a spec driven design paradigm. search for common
> good sdd practices. you may explicitly mention current installed skills for
> relevant flow. also enforce that ui design should follow the figma page
> "https://www.figma.com/design/6Jl8Jyv7bETcHg2carNi6d/Nitra-FE-Assessment—v2"
> accessed with "figma-mcp-free" mcp

The result codifies the constitution: spec-driven workflow (specify → plan →
tasks → implement → verify), plain-JavaScript-only, design-tokens-only, and
Figma as the source of visual truth — so the rules survive across sessions
instead of living in my head.

## docs: add PLAN.md skeleton

Scaffolded this `PLAN.md` — the intro and commit-by-commit sections above — as
the living record of the development journey, ready to grow a new section per
commit as the wizard gets built.

## docs: require a PLAN.md journal entry per commit

Made this journal a rule, not just a habit. `CLAUDE.md` §5 now mandates that
every commit also add or update a matching `##` section here in `PLAN.md` — the
`##` heading being the commit's conventional-commit subject — and that the entry
land in the **same commit** as the change it documents, never backfilled later.
The review gate (§2.6) treats a commit without its journal entry as not
review-ready, and the PR template gained a checkbox so a missing entry is caught
at review time. This keeps the development story 1:1 with the commit history
instead of reconstructed from memory at the end. (This very section is the first
entry written under that rule.)

## docs: govern scope changes and new Figma frames

Closed a gap in the constitution: it said `README.md` was immutable but never
said how the spec is allowed to _grow_. `CLAUDE.md` §1.2 now clarifies that scope
can expand only via dated, append-only addenda from an authoritative source —
never by hand-editing `README.md` — and a new §2 "Scope changes" procedure spells
out the steps (classify a real change vs. my own idea → raise → capture as an
addendum → catalog the new Figma frames → run the normal specify → … → review
flow). §4 gained a rule that new frames are cataloged with their nodeId and have
tokens reconciled before implementation. I deliberately did **not** create the
`SPEC_ADDENDUM.md` file yet — the procedure is documented, but an empty addendum
would just be noise until real scope actually arrives.

## docs: size PRs by review effort, not one-commit-each

One commit per PR turned out too granular. Changed the review gate so the **PR**
is the unit of review, sized to roughly **20 minutes of a senior engineer's
review** — a coherent, single-theme change that usually spans several small,
atomic commits, split into more than one PR if it would take materially longer to
review well. Commits stay small and each still carries its own `PLAN.md` journal
entry (the per-commit journaling rule is unchanged); a multi-commit PR just lands
several `##` sections at once. Updated `CLAUDE.md` §1.6/§2.6/§5, the PR template,
and the §9 review log (now per-PR) to match.

## feat(data): async facade over mocks + JSDoc-typed normalizers

Async facade (`fetchEvent`/`fetchSessions`/`fetchAddons`/`submitRegistration`)
over the sync mocks so loading/pending states are real and swapping in `fetch()`
later changes nothing downstream (**D1**). `normalize.js` parses ISO timestamps
into `Date` `start`/`end` once at the edge, with JSDoc `@typedef`s for the shapes;
`generateConfirmationNumber` (`WDS-XXXXXXXX`) lives here as the "server"-assigned
id. Tests: `facade.test.js` → AC-S-1 (async + normalized shape) and the AC-S-2
confirmation-number primitive.

## feat(utils): currency formatting + wall-clock datetime helpers

Pure rendering primitives (aggregation stays in the later order-summary commit).
`pricing.js`: `formatCurrency` (Intl en-US/USD, **D5**), `round2`, VIP discount.
`datetime.js`: wall-clock time/day helpers (**D4**).

Critical decisions:

- **`WORKSHOP_DISCOUNT_RATE = 0.10` (D11)** — derived and named; the mock only has
  the string "10% off workshops". Discount is VIP-only and, by construction,
  workshop-only.
- **Wall-clock via manual UTC formatting, not `Intl.DateTimeFormat` (D4)** — keeps
  `ws2` (18:30Z) on Nov 15 regardless of viewer offset, and avoids Intl's U+202F
  space before AM/PM that breaks exact string matches.

Tests cover AC-1.4, AC-P-1/2/5 and AC-2.1/2.5, AC-T-1/2/3.

## feat(logic): capacity + strict-overlap time-conflict detection

`capacity.js`: `isFull` = `registered >= capacity`, `remainingSpots` clamped;
meals/merch uncapped. `conflicts.js`: `detectConflicts` + `conflictingSessions`.

Critical decisions:

- **Strict-inequality overlap (D6)** — touching endpoints don't conflict, so the
  14:00Z back-to-back slots (`s10`→`s11`/`ws1`) stay co-selectable.
- **Capacity ships with conflicts** — the decoy test needs `isFull` to filter the
  full sessions (`s2`/`s9`) before asserting live conflicts.
- **Conflict message (AC-C-5) deferred** to the Step 3 i18n commit; this ships the
  detection data. **Added AC-C-6** for the meals/merch guard.

Tests cover AC-C-1..C-4/C-6 and AC-Cap-1/2/3; numbers re-derived from the mocks by
an adversarial workflow.

## fix(data): harden the data edge against partial payloads (code-review prep)

The `/code-review` prep pass found no confirmed bugs but four plausible latent
gaps at the D1 seam (safe vs the mocks, risky once swapped for a real `fetch`).
Hardened per **D17**: missing `registered` reads as 0 (keeps `isFull`/
`remainingSpots` consistent instead of `false`/`NaN`); an add-on time slot is
attached only when both `date` and `endDate` exist (no truthy `Invalid Date` that
hides conflicts); the confirmation number draws 8 uniform `[A-Z0-9]` chars.
Deliberately did **not** re-validate in `conflicts` — keeping data honest is the
edge's job (the normalize-at-the-edge invariant). New tests: `normalize.test.js` +
a capacity partial-data case.

## feat(state): useRegistration wizard store via provide/inject

Single reactive wizard store (`createRegistration`) shared via provide/inject, not
Pinia (**D2**): step/attendee/ticket/session/add-on selections + `goToStep`/`next`/
`prev`.

Critical decisions:

- **No validation gate on navigation (D13)** — `goToStep` allows any step; the spec
  defers all validation to the Step 4 submit, so free/non-linear movement is
  intentional.
- **Plain `createRegistration` factory + thin provide/inject wrappers** — the factory
  is unit-testable without a component; `useRegistration` throws if no provider.

Tests: AC-N-1 (free nav), AC-N-2 (state survives forward/back), AC-N-3 (single
shared instance via provide/inject).

## feat(shell): free-navigation wizard stepper + shell layout

The wizard skeleton, built from Figma (Step 1 `1069:968` / Step 4 `1074:897` via
`figma-mcp-free`): a `WizardStepper` component + the `IndexPage` shell (header with
dynamic event name → stepper → step-title + placeholder content → footer action
bar), all token-styled, no hex. Step forms land in later PRs.

Critical decisions:

- **Custom token stepper, clickable for free nav (D13 confirmed)** — hand-built (not
  Quasar's Material `QStepper`); teal current/completed circles with a check glyph on
  completed, gray upcoming. Figma doesn't show step-click, but D13 mandates non-gated
  navigation, so steps are clickable.
- **Event name is fetched from the facade, not hardcoded** — matches the "dynamic from
  state" note (§4); the Figma "2025" title is a placeholder.
- **Verified visually** against Figma via `agent-browser` at 1440px (header, stepper
  states, footer) — parity confirmed.

Tests: `WizardStepper.spec.js` — AC-N-1 (clicking a future step emits `select`, no
gate) + completed/current rendering.

## docs: enforce pixel-perfect Figma parity in CLAUDE.md

Review feedback on #7: the shell wasn't strictly matching Figma (wrong font sizes,
a missing header divider). Strengthened the constitution to prevent recurrence —
§1.3 now requires **measured** Figma values (every font size/weight/line-height,
spacing, border, radius, color) mapped to the matching token, §2.5 makes
pixel-perfect `agent-browser` comparison (via computed styles, not eyeballing) a
blocking verify gate, §4 adds exact-measurement extraction + in-browser
verification, and a new **"silent visual approximation"** anti-pattern bans
rounding a measured value to a "close enough" token without recording it.

## fix(shell): match Figma exactly — fonts, dividers, button sizing

Re-measured Step 1 / Step 4 in Figma and corrected the shell to the exact values,
verified in-browser with `getComputedStyle`:

- **Header bottom divider now renders** (the reported bug) — it was
  `border-neutral-muted` with no explicit border-style, so `border-b` produced no
  visible line. Now `divider-default` (`rgba(0,0,0,0.1)`) 1px `border-solid`, on the
  header, stepper, and footer.
- **Fonts corrected to Figma:** event title `text-subtitle1`(16) → **`text-h4`(20)**;
  step title `text-h2`(28) → **`text-h3`(24)**; stepper label per-state weights +
  `text-neutral-quiet` upcoming; buttons `text-subtitle2`/`text-subtitle1` (14/16).
- **Exact insets** (header 48px / body 120px) and **exact button sizing** (40/48px
  height, 10/12px radius); todo connector `bg-surface-l2` per Figma.

Discrepancies recorded in §4 (no silent rounding): stepper label 13px → `text-md`(14,
nearest); Figma weights 680/600/500/400 → nearest token weights; 10px radius →
`rounded-[10px]`; native `<button>` over `QBtn` for exact sizing.

## fix(shell): remove invented footer-button icons

Follow-up to PR #7 review: the footer buttons had no chevron/arrow icons in Figma,
but I had added leading/trailing chevrons (an extraction artifact I wrongly
"interpreted" into a direction). Removed them — Next/Back/Submit are now text-only,
matching Figma. Verified in-browser: 0 icons in every footer button. (The completed-
step **check** glyphs in the stepper stay — those are in Figma.)

## chore: switch Figma read to official Dev Mode MCP + design-to-code skill

Replaced the `figma-mcp-free` MCP server with the official **local Dev Mode** server
(`figma-dev-mode-mcp-server`, Figma desktop) and installed the read-only
**`figma-design-to-code`** skill; also repointed the ground-truth Figma URL to a
Dev-Mode-enabled **copy** of the file (fileId `euBzD5nFIKWTw1rVd69M6G`). Updated
CLAUDE.md §3/§4 and `tmp.md` to match.

**Judgment call:** the original choice of `figma-mcp-free` was forced by lacking Dev
Mode access; that no longer holds (the copy grants it), so this supersedes CLAUDE.md
§4's "no Dev Mode" rationale — recorded as **D18**. Only the read (design→code) skill
was installed; write-back-to-Figma skills are deliberately excluded. Left the stale
`mcp__figma-mcp-free__list_frames` allowlist entry for a follow-up (permission-file
edits are gated), and §4 frame nodeIds still need a confirm against the copy.

## fix(shell): match Figma exactly via Dev Mode MCP re-audit

The shell's first fidelity pass (#7) was measured with the now-removed `figma-mcp-free`
server. With the official **Dev Mode MCP** in place (D18), I re-measured the header,
stepper, and action bar element-by-element (a parallel extraction workflow returning
token-mapped specs) and fixed every discrepancy, verifying each in-browser with
`getComputedStyle` at 1440px. Most values already matched; the real gaps:

- **Invented glyphs → real Figma vectors.** The header logo was a Quasar `event` calendar
  icon — an invented mark. It's actually the **"N Emblem — White"** component (3 white
  vectors), now inlined as an SVG. The completed-step **check** was the Material `q-icon`
  (filled) — replaced with Figma's own 2px round-cap stroked check SVG. (Both were exactly
  the "don't invent Figma details" trap.)
- **Exact measured values.** Stepper label `text-md`(14) → **`text-[13px] leading-[normal]`**
  (the earlier round-to-14 was a silent approximation; `leading-[normal]` ≠ Tailwind
  `leading-normal`=1.5). Connector radius → `rounded-[1px]`. Buttons hug content with net
  **`px-4`**/**`px-5`** + `min-w-[72px]`/`[88px]` (prior `px-2`/`px-3` were ~16px too narrow);
  Submit label `text-subtitle1` → **`text-lg font-semibold`** (16/24/610). Step-1 Next copy
  → verbatim **"Next: Session Selection"**.
- **Trap — phantom 3px band borders (visual bug).** `border-solid` styles all four sides, but
  the project has no Tailwind `border-width:0` reset, so unset sides defaulted to `medium`
  (3px) and rendered faint borders around the header/stepper/footer. Zeroed the unwanted
  sides (`border-x-0`/`border-t-0`/`border-b-0`) so each band shows only its single 1px
  divider — same missing-reset root cause behind the earlier `border-solid` gotcha.

**Open question / assumption:** the phantom-border fix is surgical (per-band). The root cause
is a missing global border reset; a project-wide preflight reset would prevent the whole bug
class but could shift Quasar component borders in Phase 3, so I left that as a deliberate
follow-up rather than fold it into a shell PR. Details in `IMPLEMENTATION_PLAN.md` §4.

## feat(attendee): Step 1 attendee form + ticket selection

Step 1 (frame `1069:968`), built to exact measured values and verified in-browser with
`getComputedStyle` @1440px: `FormField` (tokenized native input, carries an `error` contract
for Step 4), `TicketCard` (single-select, `circle-check` perks, "✓ Selected" badge),
`StepAttendee` (ticket grid + attendee form), wired into `IndexPage` (Step 1 renders; Steps
2–4 keep a placeholder). No inline validation — deferred to Step 4 (AC-1.5).

Critical decisions / judgment calls:

- **No page/step title on Step 1.** The frame's content starts directly at "Select Ticket
  Type"; the shell no longer renders a step title for Step 0. The only body heading is
  "Attendee Information" (`text-h3`), distinct from the smaller "Select Ticket Type"
  (`text-subtitle1`).
- **Selection never shifts layout (D20)** — after review feedback that switching tickets
  changed the container height, the card is now pixel-stable at **288px** across all
  selections: the ticket row is **CSS grid** (Quasar's `.flex` helper forces
  `flex-wrap:wrap`, and `flex:1 1 0%` items over-grow the flex cross-size by ~16px); the
  selection ring is an **inset `box-shadow`** (token vars, no hex) with the button `border-0`,
  so the 1px→2px ring change and the UA `<button>` border add 0px; the "✓ Selected" badge is
  always rendered and toggled with `invisible` to reserve its space. A global element
  normalize in `app.scss` (`h1–h6,p,ul,ol` margin/padding 0) removes the Quasar/UA base
  margins that were inflating gaps — this also closes the border-reset follow-up flagged in
  the shell PR.
- **Perk icon = FontAwesome `circle-check`, colored `text-neutral`.** Inlined as the exact
  Figma SVG (node `1089:985`); its Figma fill is black with **no bound colour variable**, so
  it maps to `text-neutral` — explicitly not teal/green (avoiding the "don't invent Figma
  details" trap). The badge "✓" is a literal U+2713 glyph, per the frame.
- **Assumption:** the Full Name / Email placeholders aren't shown in the frame (it shows
  sample filled values), so I matched the other fields' "Enter your …" pattern.
- **Discrepancies (no exact token, recorded in §4):** badge type 11px → arbitrary
  `text-[11px] leading-[14px]`; card dual drop-shadow → arbitrary two-layer `shadow-[…]`.

**Review hardening (from the `/code-review` prep pass, D21):** implemented the full
WAI-ARIA radiogroup keyboard pattern (roving tabindex + Arrow/Home/End) rather than an
inert `role=radio`; added a `sr-only` `<h1>` so Step 1 has a top-level heading (the frame
shows none); gave `FormField` a `focus-visible` ring (weak 1px-border focus was the only
indicator); and memoized `fetchEvent` so the header + Step 1 share one fetch and revisiting
Step 1 doesn't reload the spinner. **Dismissed with rationale** (not bugs): the ticket price
stays `${{ price }}` — Figma shows `$299`, and `formatCurrency` is reserved for the Step 3/4
totals; "Next: Session Selection" vs the stepper's "Sessions" are both verbatim from Figma;
the global `app.scss` normalize's blast radius is deliberate.

Tests: `StepAttendee.spec.js` — AC-1.1 (fields + optional shipping), AC-1.2 (single-select +
roving-tabindex/arrow-key a11y), AC-1.3 (VIP-only workshop perk), AC-1.4 (whole-dollar prices,
render side), AC-1.5 (no inline errors pre-submit).

## docs: forbid design-narration comments in code (CLAUDE §1.7)

On request, made "comments describe code, not design" a constitution rule: `CLAUDE.md` §1.7 +
a new anti-pattern bar style/layout/token/Figma/measured-value narration from source — that
rationale lives only in `IMPLEMENTATION_PLAN.md`. Stripped such comments from the merged
`WizardStepper.vue` (the new Step 1 components were written comment-light from the start).
Recorded as **D19**.

**Judgment call:** I kept two terse _behavior_ comments (the badge `invisible` toggle and the
box-shadow selection ring) — not style narration, but guards against a well-meaning
"simplify back to `v-if` / a border" refactor that would reintroduce the selection-time
layout shift the review explicitly asked to fix.

## fix(attendee): pin the Selected badge to the card bottom-left

Per reviewer request, the "✓ Selected" badge now sits in the **same bottom-left corner on
every ticket card** (`mt-auto`) instead of flowing 12px below each card's last perk. Since
the cards are equal-height (grid), this lands the badge at a consistent 20px-from-bottom-left
inset on all three; height stays 288px and stable across selection. Recorded as **D22** —
a deliberate override of the earlier Figma reading (D20), where the badge tracked each card's
perk count.

## feat(sessions): Step 2 session selection — day tabs + capacity states

Step 2 (frame `1072:912`), built to measured values and verified in-browser: `TrackBadge`
(track → semantic palette), `SessionCard` (checkbox card with track badge, wall-clock time,
capacity fill-tone bar, remaining-spots/"Sold Out" label, and available/selected/full states),
`StepSessions` (day-tab switcher + live selection counter + card grid, off the async facade),
wired into `IndexPage` for Step 2. `formatDayLabel` ("Nov 15") added to `datetime.js`.

Critical decisions / judgment calls:

- **The frame is a state-catalog, so README drives behavior (D24).** Its cards show
  inconsistent states (the _full_ `s2` drawn selectable + "Sold Out"; the _not-full_ `s5`
  drawn greyed/disabled — an apparent conflict artifact). Per README §1.2 I follow the spec:
  **full** sessions (`s2`, `s9`) are greyed + not selectable + "Sold Out"; there is **no
  conflict-gating at Step 2** (free multi-select; conflicts defer to Step 4, D6/AC-2.6). The
  full-state visual synthesizes the frame's two treatments (its disabled card + its "Sold Out"
  bar).
- **Group-by-date is a segmented day-tab control (D23),** not stacked day sections — that's
  how the frame renders it. Built as the WAI-ARIA tabs pattern (roving tabindex + arrows), so
  it matches Step 1's a11y bar. Days derive from the wall-clock `dayGroupKey` (D4).
- **Capacity fill-tone bands (D25).** README asks only for "remaining spots"; the frame
  color-codes the bar by fill %, so I fit four bands (teal/warning/accent/danger) that match
  all six day-1 cards, applied to both days. Presentation-only → lives in `SessionCard`.
- **Copy call, flagged:** the full label uses the frame's **"Sold Out"** rather than README's
  descriptive "full".
- **Open question:** should the greyed `s5` treatment mean Step 2 _does_ preview time
  conflicts (contradicting README's "defer to Step 4")? I read it as a catalog artifact and
  kept README's free-select — worth a reviewer gut-check.
- **Discrepancies (no exact token, §4):** 11px/14 type, two-layer drop shadow, `rounded-[3px]`
  /`[2px]`/`[10px]`; `main`-badge text and the low/high spots-label colors map to the nearest
  semantic token (frame uses gray[700]/teal[700]/orange[700], which have no exact _text_ token);
  the frame's `bg/brand/muted/rest` #EEF6F7 matches **our** `bg-brand-subtle-rest` by hex.

Tests: `StepSessions.spec.js` — AC-2.1 (day tabs + grouping + roving-tabindex/arrow a11y),
AC-2.2 (card content + live counter), AC-2.3/Cap-4 (only `s2`/`s9` full + not selectable),
AC-2.6 (co-select conflicting `s4`+`s5`), AC-2.7 (no ticket gating), plus toggle/multi-select.
`datetime.test.js` — `formatDayLabel` wall-clock ("Nov 15"/"Nov 16", no local shift).

## feat(pricing): useOrderSummary computed order totals + VIP workshop discount

The pure pricing engine for Step 3's running total and Step 4's breakdown, split ahead of the
add-ons UI (like the foundation PR #6, and small enough to review on its own). `createOrderSummary`
is **fully computed, zero watchers** (D3): ticket line, workshop/meal/merch lines, a combined
`lineItems` (ticket-first, then Workshops→Meals→Merch), the VIP workshop-only discount, subtotal,
and grand total. `useOrderSummary` is the provide/inject wrapper; `sources` accept refs/getters via
`toValue` so a component can pass still-loading facade data. Recorded as **D26**.

Critical decisions / judgment calls:

- **Discount is structural, not conditional (D11).** It is computed only from `workshopLines`, so
  meal/merch/ticket amounts are never passed to `workshopDiscountAmount` — nothing else _can_ be
  discounted (AC-P-3/P-4). Exposed as a positive number; the UI decides the display shape.
- **Discount display shape stays open (§7).** Separate `−$14.90` line vs struck-through per-workshop
  price is Figma-blocked — a UI concern deferred to the Step 3 add-ons PR; the engine is agnostic.
- **Merch shape `{ size, quantity }`** matches the store + `useRegistration.test.js`; quantity-max is
  the picker UI's job, not the summary's (D16). Zero-quantity and unknown-id selections drop out.
- **Numbers independently re-derived** from the raw mocks by a verification workflow (two blind
  derivations + an adversarial correctness review) before the tests were trusted.

Tests: `useOrderSummary.test.js` — AC-P-2 (VIP+ws1 → $14.90 / net $134.10 / $733.10), AC-P-3/P-4
(workshops-only), AC-P-5 (General/Student → $0), AC-P-6 (killer ticket-switch $733.10→$448.00),
AC-P-7 (full cart VIP $848.10 / General $563.00), AC-4.2 (itemized lines + order), AC-3.11 (live
recompute), merch quantity/size + zero-qty/unknown-id edges, and the provide/inject wrapper.

## feat(addons): Step 3 scaffold, workshop cards & order summary

Step 3 UI part 1 (frames `1073:899` Workshops / `1149:565` Merchandise), built to measured values
and verified in-browser at 1440px. `StepAddons` (title, category tabs, two-column layout — add-ons
list + `OrderSummaryPanel` sidebar, off the async facade), `WorkshopCard`
(available/selected/full/conflict), `OrderSummaryPanel` (live total + teal VIP discount line),
wired into `IndexPage`. `formatDateTimeRange` ("Nov 16, 2:00 PM – 5:00 PM") added to `datetime.js`.
Merch + Meals tabs are placeholders (later PRs). Recorded as **D27–D31**.

Critical decisions / judgment calls:

- **Category grouping = segmented tabs (D27),** reusing the Step 2 day-tab WAI-ARIA pattern — that's
  how the frame renders "group by category", and it keeps the running total always visible beside a
  two-column layout.
- **Workshop full state diverges from Step 2 (D28).** The frame draws the sold-out `ws2` as a plain
  **white** card whose only signal is a muted "Sold Out" label — no red/grey/disabled greying (unlike
  `SessionCard`, D24). Capacity is plain "{n} spots remaining" with no bar. Followed the frame.
- **Two spec-gap fills flagged (D31):** Figma has **no Meal-Packages card** and **no
  workshop-conflict state**. This PR fills the conflict state — a conflicting workshop is
  non-selectable with a `text-warning` line naming the session; a **stale** conflict on an
  already-selected workshop is **kept** (D10) and still deselectable. Meals land in a later PR.
- **Discount display resolved (D29):** a separate teal "Workshop discount (VIP 10%) / -$14.90" line
  (frame `1073:964`), not a struck-through price. The mock's inconsistent per-row font sizes
  (12/13/11px) are normalized to `text-sm`.
- **Discrepancy (verified in-browser):** workshop price + discount teal — frame is teal[700] #264D4F,
  `text-brand-emphasis` renders teal[800] #1E3C3E, the nearest _text_ token (same 1-shade
  approximation recorded for Step 2).

**Review hardening (from the `/code-review` prep pass — a 9-angle recall workflow):** fixed
`blocked = !selected && (full || conflicting)` so a full/conflicting workshop that is _already_
selected stays deselectable (never locked, D10); a full workshop that also conflicts now shows only
"Sold Out" (the conflict line is suppressed when full); the order-summary sidebar is gated behind the
loading state so it no longer flashes "Nothing selected yet." / $0.00 during the fetch; the empty
Meals/Merch tabpanel gets `tabindex=0` (a11y); order-summary labels wrap while the price is pinned
(long names, esp. once reused in Step 4); conflicts are memoized into a computed map; and
`toggleWorkshop` re-asserts the full/conflict block at the store mutation, not only in the card.
**Deferred (flagged):** extracting a shared `SegmentedTabs`/`SelectableCard`/shadow token (would
touch the merged Step 2 — its own refactor PR); real fetch-error handling (consistent with D21).

Tests: `StepAddons.spec.js` — AC-3.1 (tabs + order + a11y), AC-3.2 (`ws2` Sold Out + not selectable),
AC-3.3/D9 (conflict names the session), AC-3.4/D6 (`s10` touch ≠ conflict), D10 (stale conflict kept

- full-but-selected deselectable), full-and-conflict → only "Sold Out", AC-3.11 (summary updates
  live). `OrderSummaryPanel.spec.js` — ticket/workshop/merch lines, VIP discount line, non-VIP omits
  it, empty state. `datetime.test.js` — `formatDateTimeRange`.

## feat(addons): step 3 merchandise cards + shipping banner

Step 3 UI part 2 (PR B). Added `MerchCard.vue` (name + neutral price, description, optional size
`<select>`, −/count/+ quantity stepper capped at the item's `maxQuantity`, "✓ Added to order" footer)
and `ShippingBanner.vue`, wired into the Merchandise tab of `StepAddons` — replacing its placeholder.
Selections write `{ size, quantity }` into `merchSelections`, so the existing `useOrderSummary` prices
them and the running total updates live. Recorded as **D32** (five D30 corrections).

Critical decisions / judgment calls:

- **Merch prices show no cents** ("$35"), unlike the sibling `WorkshopCard` ("$149.00") — the frame
  draws merch unit prices without cents (verified in-browser); the Order Summary still uses
  `formatCurrency` ("$35.00"), also per the frame. `WorkshopCard`'s cents are the lone Step-3 outlier,
  left untouched (out of scope).
- **Five D30 measured claims corrected from a fresh Dev Mode read + `getComputedStyle` (D32):** price is
  `text-neutral` not teal; added ring is **1px** `border-brand-emphasis` (not the family's 2px);
  `#EEF6F7` → `bg-brand-subtle-rest` (by measured hex, not the Figma variable's `muted` label); banner is
  `rounded-lg` with a bold **"Shipping Information"** title above the body; the card is a static
  `role=group`, not a `role=checkbox` toggle. Banner sits **above** the card list (frame position).
- **UnoCSS static-scan trap (caught in the `agent-browser` pass):** the 1px brand-emphasis inset ring
  first rendered as `box-shadow: none` because the class was built via a `${DROP_SHADOW}` template — and
  UnoCSS extracts classes by scanning source text, so a spliced token is never generated. Fixed by
  writing the full `shadow-[…]` literal inline (this 1px-brand ring exists on no other card).
- **Merch state invariant:** "merch added" is always `quantity >= 1` (used by `anyMerchAdded` and the
  order summary), never key presence — a size picked before the first `+` leaves a harmless
  `{ size, quantity: 0 }` entry so the dropdown doesn't snap back. Flagged so the upcoming
  shipping-required-when-merch validation (AC-1.6) keys off `quantity >= 1`.
- **Spec-gap fill:** the frames show no disabled −/+ key style, so a disabled key dims its glyph to
  `text-neutral-disabled` + `cursor-not-allowed`.

Tests: `MerchCard.spec.js` — price no-cents, size selector present/absent (merch1 vs merch2), "max N"
hint, − disabled at 0 / + disabled at max (merch4), added footer, emit contract. `StepAddons.spec.js`
— four merch cards in order (AC-3.1), add → store + live total (AC-3.11), size recorded (AC-3.6), qty
cap at maxQuantity (merch3 → 2), banner exact README copy when added (AC-3.9) / absent when none
(AC-3.10), decrement-to-0 drops the entry + hides the banner. All 110 tests green; `yarn check` clean;
pixel parity confirmed vs frame `1149:565`.

## docs(plan): confirm Step 2 stays free-select on stale conflicts (D33)

Recorded a product decision from review discussion: when a workshop is selected first and a
conflicting session is then added via back-nav, the session stays **freely selectable in Step 2
with no warning there** — this is README §2.2 (Step 2 defers time-conflict validation to Step 4).
The stale conflict is surfaced on the Step 3 workshop card ("Overlaps {session}", D10) and, once
built, at Step 4 submit (AC-4.6). A non-blocking Step 2 indicator was considered and **declined**;
gating Step 2 or auto-removing the workshop were rejected as README §2.2 / D10 violations. No code
change — **AC-4.6 (pending validation PR) is the closing mechanism**; the current "nothing happens"
is only because that Step 4 validation isn't built yet.

## feat(validation): pure submit-time validation logic

Step 4 PR 1 (of ~4 — the pure-logic-first split recorded as **D34**). Added `src/logic/validation.js`:
lenient field predicates (`isValidEmail`, `isValidPhone`, `isPresent`, `hasMerchSelected`),
`validateAttendee` (required-then-format; shipping conditional on merch), the conflict-error helpers
(reusing `conflicts.js`), and `validateAll` → a per-step error map (`attendee`/`sessions`/`addons`)
plus `errorStepKeys`/`isValid`. Framework-free over a plain store snapshot — the reactive
touched-field wrapper is the later `useValidation` composable. 22 co-located tests; 132 total green,
`yarn check` clean.

Judgment calls (flagged for review):

- **Ticket-required is a spec-gap fill** filed under Step 1 — README's Step-1 fields table omits the
  ticket, but a ticketless registration is invalid; one-line removal if the reviewer disagrees (D34b).
- **Session↔session conflicts flag Step 2, workshop↔session flag Step 3** (D9) at submit — satisfies
  README §2.2 and is consistent with AC-2.6/D33 (those forbid an in-Step-2 gate, not a submit error).
- **Validation copy lives inline in the logic layer** for now (centralized builders), relocating
  behind `vue-i18n` in Phase 4 (D14) — the whole app currently inlines copy.
- **`validateAll` is pure and never mutates** the registration, so a stale conflict is reported and
  kept, not auto-removed (D10, AC-4.6).

## feat(review): step 4 review summary + itemized pricing

Step 4 PR 2 (of ~4, D34). Built the read-only **Review** UI that replaces the shell's Step-4
placeholder: a single-column stack of summary cards (Attendee Information / Selected Sessions /
Add-ons) plus an itemized `PricingSummaryCard`, each summary card carrying an **Edit → Step N** link
that jumps back with all state preserved (AC-4.1/4.2/4.3). New components `StepReview.vue`,
`ReviewSection.vue`, `PricingSummaryCard.vue`; a `formatDateTime` helper (wall-clock date + start
time); `StepReview` wired into `IndexPage`. Pricing reuses the existing `useOrderSummary` engine
(D26). Measured pixel-parity vs frame `1074:897` via `agent-browser` (`getComputedStyle`); recorded
as **D35**. 148 tests green, `yarn check` clean.

Judgment calls (flagged for review):

- **No aggregate "Subtotal" row** — the frame shows line items → discount → Grand Total only (two
  independent Dev Mode extractions agree). README §4.2 "subtotals" is read as the **per-line**
  amounts; a one-line add-back if the reviewer wants an explicit pre-discount subtotal (D35b).
- **Edit-link colour #3a7679 (teal[500]) has no semantic _text_ token** → mapped to the nearest,
  `text-brand` (#2e5e60), a recorded 1-shade approximation; the Figma variable is mislabeled
  `components/button/primary-link/text/rest` (D35c).
- **Add-ons/merch summary is a spec-gap fill** (frame proves only the workshop case): a category
  label with `{name} ($price)`, merch appending `, {size} × {qty}` (D35e). Pricing line labels
  **omit "× 1"** (show "× n" only when qty>1, D35f) — deliberately unlike the Step-3 running total.
- **Shipping Address is a conditional 7th attendee row**, shown only when non-empty (the frame's
  6-row sample has none), so the summary is complete when the user provided one (D35g).
- **Shell `<h1>` is now sr-only on all four steps** — each step owns its visible title; the stepper
  label stays the accessible landmark (it was visible only on Step 4, rendering the short "Review").

Tests: `StepReview.spec.js` — four sections render (AC-4.1); attendee/ticket/session/add-on rows;
merch size+qty; the two independent merch-summary conditionals (sizeless item, no "× 1" at qty 1,
D35e); the conditional Shipping Address row present/absent (D35g); itemized pricing with the VIP
discount + Grand Total + no-subtotal (AC-4.2); non-VIP no discount; Edit → `goToStep` with state
preserved (AC-4.3); empty states incl. the pricing card's own empty state and the em-dash ticket
fallback. `datetime.test.js` — `formatDateTime` wall-clock (no viewer-offset shift).

## feat(validation): step 4 submit-time validation wiring

Step 4 PR 3 (of ~4, D34/D36). Wired the pure `validation.js` (PR #15) into the UI: a new
`useValidation` composable (provide/inject at the wizard root, like `useRegistration`) exposes a
`submitted` flag + a **live** `validateAll` error map + `attemptSubmit()`. The Step-4 "Submit
Registration" button now runs unified validation; on failure the Review page marks the failing
sections and Step-1 surfaces its field errors, all clearing live once fixed. New
`useValidation.js` + tests; `ReviewSection`/`StepReview`/`StepAttendee`/`IndexPage` wired. Measured
error-state parity vs frame `1076:936` via `agent-browser`. Recorded as **D36**. 168 tests green,
`yarn check` clean.

Judgment calls (flagged for review):

- **"Reward early, punish late" via a single `submitted` flag (D7/D36b):** nothing validates before
  the first submit; after a failed submit every currently-invalid field shows its error and clears
  live as it becomes valid. No separate per-field "touched" map — an invalid field surfaces its
  error post-submit whether or not it was touched, so the live recompute subsumes touched-tracking.
- **Review error display from frame `1076:936`:** an errored section card turns its border and
  heading danger-red; a failing attendee field shows "— (required)" / "— (required for merchandise)"
  (or the entered value in red when present-but-invalid). **Spec-gap fill (D36d):** the frame shows
  only the Attendee card, so session↔session / workshop↔session conflicts are rendered as red rows on
  the Sessions / Add-ons cards by analogy.
- **Error navigation = the red section cards + the existing Edit links** (no invented stepper error
  badge — Figma has none; a red card maps 1:1 to a step + its Edit link, satisfying README §4.5).
- **PR-boundary refinement (D36h):** this PR is the invalid path only — a **valid** submit is a
  guarded no-op placeholder; the async `submitRegistration` + pending + **double-submit guard** +
  terminal success screen move together into the next PR (the guard is meaningless without the async
  call, so it left D34's PR-3 grouping).
- **Shipping "(Optional)" label drops** once merch is selected (required, AC-1.6) and reverts when
  merch is removed (non-sticky, AC-1.7).

Tests: `useValidation.test.js` — no pre-submit errors, reveal-on-fail, live-clear, valid-pass,
reset, session/workshop conflict attribution + wizard order, shipping-conditional (AC-V-5, AC-4.4/4.6/4.9,
AC-1.6/1.7). `StepReview.spec.js` — red Attendee card + "— (required)" markers, present-but-invalid
value shown flagged, session/stale-workshop conflict rows (kept, D10), merch-shipping requirement,
live revert of a section's error state, and a valid submit leaving every section clean.
`StepAttendee.spec.js` — field + ticket errors after failed submit, live-clear, shipping "(Optional)"
toggle.

## feat(validation): step-4 error affordances + step-1 input focus/error states

A round of reviewer/user feedback on the open PR #17, all grounded in Figma frames. **Step-4 error
state (D37, frame `1076:904`):** I had declined a stepper badge in D36f after inspecting only the
Attendee sub-frame (`1076:936`); the user pointed to the full error frame `1076:904`, so **D37
supersedes D36f** (recorded, not silently). Added a `WizardStepper` error state (red circle + white
"!" glyph + red label for an errored step, and the **connector after it turns gray**), a new
`ErrorBanner` (role="alert", "Please fix…" heading + "• Step N: {message}" bullets), and a **disabled
Submit** in the error state. **Step-1 input states (D38, frame `1203:587`):** `FormField` now
**darkens its border on focus without thickening** (dropped the focus ring + the off-palette teal),
and an **errored field stays red-bordered even when focused**, with the whole label red. Measured
parity vs both frames via `agent-browser`. 178 tests green, `yarn check` clean.

Judgment calls (flagged for review):

- **D37 supersedes D36f** — reasoned from an incomplete (Attendee-only) frame; the full `1076:904`
  is the visual truth. The stepper error style **overrides** completed/current/upcoming, and the
  connector **after** an errored step reverts to gray (`bg-surface-l2`) while connectors after
  completed steps stay teal (confirmed against the stepper node `1101:1070`).
- **Banner copy** uses the app's **canonical `validation.js` messages** ("Step 1: Phone is required"),
  not the frame's mock wording, to keep a single message source (D34d); the heading is verbatim.
  `summarizeErrors` flattens the per-step map to wizard-ordered "Step N: {msg}" lines.
- **Disabled Submit = 50% opacity** (frame). Quasar's global `[disabled]{opacity:.6!important}` beat a
  plain `disabled:opacity-50`, so I matched the frame's 0.5 with **`disabled:!opacity-50`** (verified
  in-browser). It re-enables live as the errors clear (reward early, D7).
- **Input focus = darken, not thicken (D38).** The states node `1203:587` has no teal and all-1px
  borders; focus darkens to `border-neutral-emphasis` (#5c6970). Read the node's darker-gray column as
  the **focus** darken rather than a persistent required border (a required border would contradict the
  Step-1 frame `1069:968`, which draws required fields light). **Deferred/flagged:** the node shows a
  required "Shipping Address \*" asterisk — not added, since `1069:968` shows no asterisks and a "\*"
  only on shipping would be inconsistent. **A11y:** dropping the focus ring per the user weakens the
  keyboard-focus cue to a border-colour darken — a deliberate fidelity-over-a11y tradeoff.

Tests: `validation.test.js` — `summarizeErrors`. `useValidation.test.js` — submitted-gated
`errorSummary`/`errorStepsShown`. `WizardStepper.spec.js` — errored step flagged with the "!" glyph
overriding the check + the gray connector. `StepReview.spec.js` — the banner appears after a failed
submit. `IndexPage.spec.js` — end-to-end: a failed submit marks the stepper, disables Submit, shows
the banner; and Submit re-enables once the form is fixed. `FormField.spec.js` (new) — rest/focus/error
border classes (darken-not-thicken, red-even-when-focused, red error label).

## fix(step-1): shipping required state — darker border + "\*" label

User correction of a D38 interpretation call. When merchandise is selected (Shipping Address becomes
required), its input border **darkens at rest** (`border-neutral-emphasis`, not only on focus) and the
label becomes **"Shipping Address \*"** — the "MERCHANDISE SELECTED" state of frame `1203:587`. D38 had
read that darker-gray column as a focus-only darken and deferred the asterisk; the user confirmed it is
the required state, recorded as **D39** (supersedes those two D38 flags). Added a `FormField`
`required` prop (darker resting border + an appended " \*"); `StepAttendee` passes
`:required="shippingRequired"`. Only the conditionally-required shipping field gets this — the
always-required fields stay light + asterisk-free per `1069:968`, so the "\*" + darken are a
requirement-just-changed transition cue, not a general required style. 179 tests green, `yarn check`
clean; verified in-browser (label "Shipping Address \*", resting border #5c6970 with no focus).

Tests: `FormField.spec.js` — a required field shows the "\*" and a darker resting border (no focus).
`StepAttendee.spec.js` — the shipping label toggles between "(Optional)" and "Shipping Address \*" as
merch is added/removed.

## fix(step-3): shipping banner icon left of content + font-weight verification

Two post-review touch-ups on PR #17.

- **Shipping banner icon position** (`ShippingBanner`, frame `1220:2186`): the info icon rendered
  **stacked above** the title/body instead of to its left. Cause: Quasar's core `.flex` rule forces
  `flex-wrap: wrap`, so the wide body paragraph wrapped the whole text column below the icon. Fixed
  with **`flex-nowrap`** on the row (+ `min-w-0` on the column so the paragraph wraps internally).
  Verified in-browser: container `flex-wrap: nowrap`, icon and content share the top edge with the
  icon to the left — matching the frame.
- **Font-weight check** (user-requested; **no code change**): re-verified the input-label weight
  (`FormField` `font-medium`) and the stepper label weights (current/errored `font-semibold`,
  completed `font-medium`, upcoming `font-regular`) against Figma. Every element is in the **correct
  weight tier**; the only divergences are inherent token quantization (Figma `body/sm/medium` = 550
  and the stepper's unbound raw Inter styles 600/500/400 vs the design system's 485/570/610/630) —
  the chosen tokens are the nearest available, so nothing changed. Recorded in `IMPLEMENTATION_PLAN.md`
  §4.

179 tests green, `yarn check` clean. Tests: `StepAddons.spec.js` gains a `flex-nowrap` assertion on
the banner to guard the icon-on-top regression; the font check needed no code, so no new test.

## feat(review): step 4 async submit + terminal success screen

The final Step-4 piece (D40, README §4.6): a valid submit now calls the async facade, shows a pending
state, and lands on the terminal success screen (frame `1075:903`).

- **Async submit + pending + double-submit guard.** On the last step `onPrimary` runs the unified
  validation first (an invalid submit still just reveals the errors and never hits the network); a
  valid submit sets an `isSubmitting` flag, awaits `submitRegistration(snapshot)`, and stores the
  returned confirmation number. The primary button disables and swaps its label for a `q-spinner`
  while in flight, and `onPrimary` short-circuits if already submitting — so a double-click can't fire
  a second submit (guarded two ways). The pending affordance has no Figma frame — a flagged spec-gap fill.
- **Terminal success screen.** A non-null confirmation number is the terminal state: the stepper +
  steps + footer give way to a centered `SuccessScreen` (the header stays), matching `1075:903` — a
  green check circle, "Registration Complete!", the confirmation number, a personalized two-line
  thank-you, and a single "Back to Home" CTA. Every measured value verified in-browser via
  `getComputedStyle` @1440px (full pass, zero deviation).
- **Judgment calls (D40):** (a) the submission lifecycle (`isSubmitting`/`confirmationNumber`) lives in
  the shell, not the store — the store owns form/nav state and gains a `reset()`, the shell already owns
  async orchestration. (b) `SuccessScreen` is presentational (props + `home` emit), so it unit-tests
  without a store. (c) The greeting uses the **first name** and the confirmation reads "Confirmation #"
  - the facade's `WDS-XXXXXXXX` (the frame's "John"/"TC2025-47291" are placeholders, §4). (d) "Back to
    Home" is the only path back — it resets the store + validation to a pristine Step 1 (no "register
    another", no read-only back-nav).

184 tests green, `yarn check` clean. Tests: `SuccessScreen.spec.js` (new) — renders the confirmation
heading/number + personalized thank-you, emits `home`. `IndexPage.spec.js` — a valid submit shows the
success screen with the confirmation # + dynamic name/email; a double-submit is guarded while in
flight; "Back to Home" resets to a pristine Step 1. `facade.test.js` already covered the
confirmation-number format + echo.

## feat(addons): step 3 meal package selection

The last Step-3 add-on category. A new `MealCard` fills the previously-placeholder Meal
Packages tab in `StepAddons`; selecting a meal toggles it into `selectedMealIds`, which the
existing `useOrderSummary` engine and the Step-4 review already priced and listed — so this
change is UI-only.

**Figma provides no visual spec for meal packages** — meals appear only as a tab _label_,
never as a card. Per the ask, I designed the card from the **common Step-3 card pattern
(Workshops + Merchandise)**: a meal is a selectable toggle add-on with no quantity, capacity,
or time, so `MealCard` reuses the `WorkshopCard` treatment wholesale **minus** the time/
capacity/conflict rows — header (name + price), description, and the shift-free selection
ring. Recorded as **D41** (confirms the earlier D31a plan).

Judgment calls (flagged for review):

- **Teal price + cents, inherited by reusing `WorkshopCard` verbatim** — the two priced-
  _toggle_ add-ons (workshop, meal) share a treatment; merch (a quantity add-on) keeps
  neutral/no-cents. Switching meals to match merch is a one-line change if preferred.
- **Plain multi-select, no conflict/full guard** (meals have no capacity or time slot, so
  both packages are independently selectable and the workshop guard would be dead code); no
  "✓ Added" footer, following `WorkshopCard` not `MerchCard`. Also removed the meal-
  placeholder tabpanel `tabindex=0` hack now that every panel holds focusable controls.

192 tests green, `yarn check` clean; verified in-browser (`agent-browser` `getComputedStyle`
@1440px) byte-identical to `WorkshopCard`, selection ring renders (no UnoCSS static-scan issue).
Tests: `MealCard.spec.js` (new) + `StepAddons.spec.js` meal block (both cards in order AC-3.12;
toggle on/off + live total + `aria-checked`, both selectable together AC-3.13).

## fix(pricing): whole-dollar prices show no cents

Per the Figma visual spec (user-directed), all displayed prices drop the `.00` — **unless the
value genuinely has cents, in which case the cents are kept**. So `formatCurrency` now branches on
`Number.isInteger`: whole dollars format with no fraction digits (`$45`, `$299`, `$1,234`), and
fractional amounts keep two decimals (the VIP discount `$14.90`, discounted totals `$733.10`).
Recorded as **D42** (supersedes D5's always-two-decimals); it also resolves the D41 meal-price
cents flag (the price-colour flag stays open).

Key points:

- **Display-only, zero precision loss.** The fix lives entirely in the one shared `formatCurrency`
  primitive, so every price display inherits it and the pricing engine keeps exact values — the VIP
  discount is still precisely `14.9` and the killer-sequence math is untouched. Rounding everything
  to whole dollars was rejected: it would misreport the `$14.90` discount as `$15`.
- **Preserves the measured Figma discount.** D29 measured the order-summary discount as `-$14.90`;
  that's fractional, so it keeps its cents. Only whole-dollar item prices/totals lose the trailing
  `.00`. Ticket/merch cards + the Step-4 `dollars` helper already rendered whole dollars.
- **Test split for rigor:** engine tests assert exact **numeric** values + the fractional strings
  (`$14.90`), the formatter's own test locks the whole-vs-fractional rule, and component tests
  assert the rendered no-cents strings.

192 tests green, `yarn check` clean; verified in-browser @1440px — Step-3 workshop `$149`, meal
`$45`/`$89`, ticket line `$599` (all whole, no cents); the VIP order summary keeps `-$14.90` and
`$733.10`.
