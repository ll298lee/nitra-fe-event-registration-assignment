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

First code of the wizard, and deliberately the least glamorous part: the data
edge. This is the opening commit of the "pure business-logic foundation" PR —
logic and its tests, no UI and no reactivity yet, so the numeric acceptance
criteria go green independently of any component.

The mocks are plain synchronous arrays, but loading and pending states are part
of the spec (the Step 2 session list, the Step 4 submit). So rather than import
the arrays directly, everything goes through a thin **async facade**
(`src/data/facade.js`) — `fetchEvent` / `fetchSessions` / `fetchAddons` /
`submitRegistration`, each resolving after a small simulated latency. That makes
real loading affordances possible, and swapping the bodies for `fetch()` later
changes nothing downstream. This is decision **D1**.

`src/data/normalize.js` parses each ISO timestamp (`2028-11-15T09:00:00Z`) into a
`Date` **once, here at the edge**, exposing `start` / `end` so nothing further in
the app ever re-parses a raw string. The JSDoc `@typedef`s for `Session`
and `Addon` document the shapes — the plain-JS alternative to TypeScript
interfaces the constitution requires.

### AI follow-up questions

- **Where should the confirmation number come from?** I put
  `generateConfirmationNumber` (`WDS-XXXXXXXX`) in the facade: it's the
  "server" assigning it on submit, not view logic. The success-screen wiring
  (AC-S-2 proper) is a later Step 4 commit; this just delivers and tests the
  primitive so the format is nailed down early.

### Verification

`facade.test.js` asserts the fetchers resolve asynchronously to the normalized
shape (parsed `Date`s, 12 sessions / 8 add-ons) — that is **AC-S-1** — plus the
confirmation-number format and registration echo behind **AC-S-2**.

## feat(utils): currency formatting + wall-clock datetime helpers

The two pure "how do we render a number / a time" primitives, kept separate from
the aggregation that composes them (the order summary is a later, reactive
commit).

`pricing.js` gives `formatCurrency` (via `Intl.NumberFormat` en-US/USD → the
`$X,XXX.XX` shape, **D5**), the VIP workshop discount, and a small `round2` that
keeps the money math exact. Two decisions worth calling out:

- **`WORKSHOP_DISCOUNT_RATE = 0.10` is a named, derived constant (D11).** The mock
  only carries the perk as the _display string_ `"10% off workshops"` — there is
  no numeric rate in the data — so I derived the `0.10` and named it rather than
  letting it read as a magic number. The discount is gated to the VIP ticket and,
  by construction, can only ever be applied over workshop prices (the function
  accepts nothing else), which is what makes "meals/merch/ticket never discounted"
  true by design.
- **`round2` exists on purpose.** `149 * 0.1` is `14.900000000000002` in IEEE
  floats; rounding to whole cents makes the discount land on `$14.90` / net
  `$134.10` instead of a hair off.

`datetime.js` is where the **wall-clock timezone policy (D4)** lives, and it is
the most deliberate call in this commit. The mock timestamps are all `Z`/UTC, but
they _mean_ the event's wall-clock time — `2028-11-15T09:00:00Z` is the 9 AM
session, not "09:00 UTC, shown in your zone." So I **read the `Date`'s UTC fields
and format the string by hand** instead of using `Intl.DateTimeFormat` with a
local time zone. Two reasons:

1. It never shifts by the viewer's offset. `ws2` (18:30Z) has to stay on Nov 15;
   a naive +8 (Taipei) render would push it to 02:30 the _next_ day and sort it
   onto the wrong day heading.
2. It's deterministic across environments. `Intl` with `hour12` also emits a
   **narrow no-break space (U+202F)** before AM/PM on modern ICU, which silently
   breaks an exact string match; building the string by hand sidesteps that trap
   entirely.

### Verification

`pricing.test.js` covers **AC-1.4** and **AC-P-1/P-2/P-5** (plus the pure part of
P-3/P-4). `datetime.test.js` covers **AC-2.1 / AC-2.5** and **AC-T-1/T-2/T-3**,
including the noon/midnight 12-hour edges and the ws2 "stays on Nov 15" case. An
adversarial verifier sub-agent re-derived every one of these values straight from
the raw mocks and confirmed the AM/PM separator is a plain ASCII space
byte-for-byte, and that the whole suite passes under `TZ=Asia/Taipei` and
`TZ=America/Los_Angeles`.
