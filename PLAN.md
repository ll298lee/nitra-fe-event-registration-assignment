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
— never committed straight to `main`. Review is per commit, and every PR uses a
template (`.github/pull_request_template.md`) that forces the agent to spell out
its judgment calls, traps, and open questions, so review time lands where it
matters. The agent opens the PR and then hands off: it can't approve or merge its
own work, and it confirms the outcome by pulling PR state with the `gh` CLI
rather than assuming.

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

