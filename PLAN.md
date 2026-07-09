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
