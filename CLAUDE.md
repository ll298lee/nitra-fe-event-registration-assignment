# Project guidance — the project constitution

This file is the **constitution** for this repo: the non-negotiable rules and the
**spec-driven development (SDD)** process every change must follow. It outranks habit and
convenience. If a request conflicts with it, surface the conflict instead of quietly
working around it.

This is a timed FE assessment: a 4-step **event-registration wizard** (Attendee Info →
Session Selection → Add-ons → Review & Submit). The functional spec already exists in
`README.md` and the visual spec exists in Figma — so we do not invent scope, we implement
against those sources.

---

## 1. Non-negotiables

1. **Plain JavaScript only.** This is a plain-JavaScript Quasar/Vue 3 project — do **not**
   introduce TypeScript (`lang="ts"`, typed `defineProps`/`defineEmits`, `.ts` files); use
   runtime prop declarations instead. The installed Vue/UnoCSS skills lean TypeScript in
   their examples — translate their patterns to plain JS.
2. **`README.md` is the immutable functional spec.** It is the source of truth for _what_
   to build (fields, validation rules, pricing, capacity, time-conflict logic). Treat it
   as **read-only — never edit `README.md`.** If it seems wrong or ambiguous, raise it;
   don't "fix" it or silently diverge. **Scope can still grow** — but only via **dated,
   append-only addenda authored from an authoritative source** (assessor / product owner /
   official doc), never by hand-editing `README.md`. A revised spec _replaces_ `README.md`
   wholesale from the source; the agent never patches it. Scope changes follow the §2
   "Scope changes" procedure.
3. **The Figma page is the source of visual truth — match it pixel-perfectly.** All UI must
   reproduce the target frame exactly: **every font size, weight, and line-height; every
   height, padding, gap, and margin; every border, radius, and color** comes from the frame's
   **measured** values (extracted from Figma, then mapped to the matching token per §1.4/§4),
   never eyeballed or rounded to "close enough." Where the design system genuinely lacks an
   exact token for a measured value, **record the discrepancy in `IMPLEMENTATION_PLAN.md` and
   resolve it deliberately** (§4) — do not silently approximate. Pixel parity is a blocking
   verify-gate check via `agent-browser` against the frame (§2.5). The canonical file is:
   `https://www.figma.com/design/euBzD5nFIKWTw1rVd69M6G/Nitra-FE-Assessment---v2--Copy-?node-id=1063-941&m=dev`
4. **Design tokens only — never hardcode hex.** Use the UnoCSS semantic shortcuts/tokens
   defined in `src/unocss/semantic.js` and `src/unocss/index.js` (e.g. `text-neutral`,
   `bg-surface-l1`, `border-neutral-muted`, `text-h3`). No raw color/typography literals.
5. **`IMPLEMENTATION_PLAN.md` is the living plan.** The plan, design/dependency decisions,
   and the acceptance-criteria→test map live there and are kept up to date as you work.
   (This is distinct from both the per-commit `JOURNAL.md` journal (§5) and the submission
   `PLAN.md` referenced by `README.md` §Submission — three documents; do not conflate them.)
6. **Gates are green before "done."** `yarn check` (ESLint + Prettier) and `yarn test:unit`
   must pass, and the UI must match Figma, **and the change's PR must be human-approved and
   merged** (see §2 step 6), before any change is considered complete.
7. **Comments describe code, not design.** Code comments (`.vue`, `.js`) must **never**
   restate styling, layout, spacing, colors, tokens, Figma frames/nodes, or measured px
   values — that design rationale lives **only** in `IMPLEMENTATION_PLAN.md` (§3 decisions,
   §4 reconciliation), never in the source. The markup + token classes are self-describing;
   annotating them with "16px → gap-4", "matches Figma frame X", or "teal[700] border" is
   noise that rots. Reserve code comments for **non-obvious JavaScript/business-logic
   behavior** the code cannot express itself (e.g. a spec rule, a deliberate workaround, an
   invariant), and add one only when it is genuinely needed. When in doubt, delete it and let
   `IMPLEMENTATION_PLAN.md` carry the rationale.

---

## 2. Spec-driven workflow (mandatory — these are blocking gates)

Work proceeds **specify → plan → tasks → implement → verify → review**. Each arrow is a
gate: do not cross it until the prior step is satisfied. The spec is the source of truth
and code is its projection — every line of code traces back to a rule in `README.md` and a
frame in Figma.

1. **Specify.** Before touching code for a step, re-read the relevant `README.md` section
   **and** open the matching Figma frame (§4). Restate the behavior as testable acceptance
   criteria in **Given/When/Then** form (EARS — "The system SHALL…" — is an acceptable
   alternative). If you can't write a test for a criterion, it isn't specified yet.
2. **Plan** — _gate: no feature code until this exists._ In `IMPLEMENTATION_PLAN.md`,
   record the approach, any new dependency **with rationale** (per `README.md`), and a
   mapping of each acceptance criterion to the test that will verify it.
3. **Tasks.** Break the step into small units — a checklist in `IMPLEMENTATION_PLAN.md`
   and/or the Claude Code task tools. Each task names the spec rule it satisfies.
4. **Implement.** Write code to satisfy the acceptance criteria — not "what looks good."
   Consult the skills in §3. Prefer revising the spec-plan and regenerating over patching
   around a design that drifted.
5. **Verify** — _gate: automated checks green._ Business-logic Vitest tests (each tracing
   to an acceptance criterion) and `yarn check && yarn test:unit` green, **plus pixel-perfect
   visual parity vs Figma** via `agent-browser`: run the app, screenshot the built UI at the
   frame's width, and compare **measured** values — font sizes/weights/line-heights, spacing,
   borders, radii, colors — element-by-element against the Figma frame (§1.3, §4). Eyeballing
   "looks about right" is not verification; every deviation is either fixed or recorded as a
   deliberate discrepancy in `IMPLEMENTATION_PLAN.md`.
6. **Review (human)** — _gate: definition of done._ Every change is reviewed by a human on
   GitHub before it counts as done. **The unit of review is the PR** — size it to roughly
   **20 minutes of review for a senior engineer**: one coherent, single-theme change a
   reviewer can hold in their head and check carefully in one sitting. A PR may (and
   usually will) contain **several small, atomic commits**; if a change would take a senior
   materially longer than ~20 min to review well, split it into more than one PR. Err on
   the side of smaller. (Soft proxy, not a hard limit: often a few hundred lines of
   substantive diff.)
   - Work lives on a **branch**, never committed directly to `main`. Each commit carries
     its matching `JOURNAL.md` journal entry (§5) — a commit without one is not review-ready.
   - Open a PR against `main` with `gh pr create` (one coherent theme; multiple commits are
     fine). The
     description links the `README.md` rule(s) and Figma frame(s) implemented, the
     acceptance-criteria→test map from `IMPLEMENTATION_PLAN.md`, and an AI-usage note.
   - The PR **must surface the agent's own judgment** so the reviewer knows where to look
     hardest: **traps/gotchas** hit, **judgment calls and decisions** made (esp. spec-gap
     fills and deviations — cross-reference the `IMPLEMENTATION_PLAN.md` decision log
     `D#`), and **open questions / assumptions** it could not resolve from `README.md` or
     Figma. Silent judgment calls buried in the diff are exactly what this gate exists to
     catch. (The `.github/pull_request_template.md` checklist enforces this.)
   - As prep — **not** the gate itself — run the `/code-review` skill on the diff first to
     catch issues before a human looks.
   - **The agent MUST stop here and hand off. It may not approve or merge its own PR.**
     The **human approves and merges**; merging is never the agent's job.
   - A change is done only after a human approves the **PR** on GitHub and it is merged.
   - **How the agent confirms approval & ingests feedback.** The agent has no background
     listener — it never gets pushed a notification. On its **next turn** it must _pull_
     the PR state, and never trust its own memory of it:
     - **Approval / merge:** `gh pr view <n> --json state,mergedAt,reviewDecision`
       (cross-check with `git fetch origin && git log origin/main`). Not merged → not done;
       the agent stops and waits. Enforcement here is honor-system (no branch protection) —
       the agent simply must not self-merge.
     - **Changes requested:** review comments live in GitHub's API, **not in git**, so
       `git fetch` cannot see them. Read them with `gh pr view <n> --comments` /
       `gh api repos/{owner}/{repo}/pulls/<n>/reviews` (+ `/comments`), address each thread,
       then push new commits to the **same branch** (the PR auto-updates) for re-review.
       Repeat until the human approves and merges.

**Anti-patterns — do not do these:**

- **Vibe-coding** — writing feature code before the spec/plan step above.
- **Silent scope drift** — diverging from `README.md`/Figma without recording it in
  `IMPLEMENTATION_PLAN.md`.
- **Untestable acceptance criteria** — "looks nice", "feels fast"; if it can't fail a
  test, rewrite it.
- **Retrofitted docs** — writing code first and back-filling the plan to match.
- **Tests as decoration** — tests that don't map to a stated acceptance criterion.
- **Self-approval / self-merge** — the agent approving or merging its own PR. The review
  gate requires a human.
- **Committing feature work directly to `main`** — bypassing the branch + PR review gate.
- **Silent judgment calls** — landing a spec-gap fill, deviation, or assumption without
  calling it out in the PR (see §2 step 6).
- **Silent visual approximation** — eyeballing UI or rounding a **measured** Figma value
  (font size, weight, line-height, spacing, border, radius, color) to a "close enough" token
  without recording it. Match the frame's measured values; where no exact token exists,
  record the discrepancy in `IMPLEMENTATION_PLAN.md` and resolve it deliberately (§1.3, §4).
- **Style narration in comments** — annotating markup/classes with the Figma values, node
  ids, tokens, or spacing they implement (e.g. `// 16px → gap-4`, `<!-- matches frame X -->`).
  Design rationale belongs in `IMPLEMENTATION_PLAN.md`; the code stays comment-free unless a
  comment clarifies non-obvious JS/business-logic behavior (§1.7).

**Scope changes (spec expansion).** When new requirements or new Figma frames arrive, the
spec is _growing_, not being corrected — a governed event, not scope creep. Handle it in
this order (blocking, like the main flow):

1. **Classify.** Authoritative change (assessor / product owner / official doc) vs. an
   idea. An idea is scope creep — raise it, don't fold it in.
2. **Raise / confirm** before absorbing it (per §1.2 — raise, don't silently diverge).
3. **Capture as a dated, append-only addendum** (a `SPEC_ADDENDUM.md`, created only when
   the first real change lands). **Never edit `README.md`** — keep the original given
   pristine and the delta auditable.
4. **Register new Figma frames** in `IMPLEMENTATION_PLAN.md` §4 (name + nodeId) and
   reconcile their tokens (§4 below) **before** implementing.
5. **Run the normal flow** on the addendum as spec-of-record: specify → plan → tasks →
   implement → verify → review.

---

## 3. Which skill to use in which phase (installed this session)

| Phase                 | Skill / MCP                                                            | Use it for                                                               |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Specify (visual)      | **`figma-dev-mode-mcp-server`** MCP + **`figma-design-to-code`** skill | Read the Figma design → context, tokens, structure (§4).                 |
| Implement (framework) | **`quasar-skilld`**                                                    | Correct Quasar 2 component APIs (QInput, QStepper, QCard, …).            |
| Implement (Vue)       | **`vue`**, **`vue-best-practices`**                                    | Composition API `<script setup>`, props/emits, composables — in JS.      |
| Implement (styling)   | **`unocss`**                                                           | Utility/shortcut usage that reuses the existing semantic tokens.         |
| Verify (tests)        | **`vue-testing-best-practices`**                                       | Vitest + Vue Test Utils patterns for business-logic and SFC tests.       |
| Verify (visual/E2E)   | **`agent-browser`**                                                    | Drive the running app on `:9001`, screenshot, compare against Figma.     |
| Review (human)        | **`/code-review`** + `gh` CLI                                          | Self-review the diff, then open the PR and hand off for approval (§2.6). |

The `vue*`/`unocss` skills show TypeScript — translate every example to plain JS (§1.1).

---

## 4. Figma-driven UI workflow (enforced)

UI is implemented _from_ the Figma design, not approximated. Use the official **Figma local
Dev Mode MCP server** (`figma-dev-mode-mcp-server`, served by the Figma **desktop app** — it
must be running with the file open and the local MCP server enabled), following the
**`figma-design-to-code`** skill for the read-FROM-Figma workflow. We now have Dev Mode access
via a **copy** of the file (see the §1.3 URL / `tmp.md`), so the official server replaced the
earlier `figma-mcp-free` (removed — see `IMPLEMENTATION_PLAN.md` D18). Every tool takes a
`nodeId` + `fileKey` (extracted from the §1.3 URL).

1. **`get_metadata`** — enumerate the frame's structure (node IDs, layer types, names,
   positions, sizes) and identify the target node for the step you're building.
2. **`get_variable_defs`** — pull the node's design variables/tokens and **reconcile against**
   `src/unocss/semantic.js`. If Figma diverges from our tokens, record the discrepancy in
   `IMPLEMENTATION_PLAN.md` and resolve it deliberately — **never silently hardcode a hex
   value** (see §1.4).
3. **`get_design_context`** — the primary design-to-code call: returns reference code + a
   screenshot + contextual metadata for the node. _Reference only._ Never ship generated
   markup as-is: rewrite it to **Quasar components + UnoCSS token classes**, in plain JS.
   **Extract the exact measured values** from the node — every font size/weight/line-height,
   height, padding, gap, border width+color, radius, and fill — and map each to the token
   whose value matches (per the token px in `src/css/typography.scss` and the palette in
   `src/unocss/colors.js`). Any measured value with **no exact token** is a discrepancy:
   record it in `IMPLEMENTATION_PLAN.md` §4 and resolve it deliberately (never silently round
   to a near token). _`get_metadata`/`get_design_context` output can be large — run Figma
   inspection inside a subagent that returns a concise token-mapped spec._
4. **`get_screenshot`** — pull the node's rendered image for a visual reference alongside the
   measured values.
5. **Verify pixel-perfect** — use `agent-browser` to run the app (`yarn dev`; the port may
   drift to `:9001`/`:9002` — confirm the URL) and compare the rendered component against the
   Figma frame at the frame's width. Compare **measured** values element-by-element (computed
   font size, spacing, border, radius, color — e.g. via `agent-browser eval` of
   `getComputedStyle`), not just a glance; iterate until every measured value matches or is a
   recorded discrepancy.

_New frames (scope growth):_ any newly-introduced frame must be **cataloged in
`IMPLEMENTATION_PLAN.md` §4 (name + nodeId) and have its tokens reconciled against
`src/unocss/semantic.js` before implementation** — same rule as §1.4, no silent hex. This
is step 4 of the §2 "Scope changes" procedure.

_Fallback:_ the remote **`claude.ai Figma`** MCP exposes the same read tools
(`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`) if the local
desktop server is unavailable — reach for it only if `figma-dev-mode-mcp-server` is down.

---

## 5. Stack quick reference

- **Stack:** Quasar 2.18 / Vue 3.5 / Vue Router 4, plain-JS ESM. Node 22.17, yarn 4.6.
- **Styling:** UnoCSS with a semantic token system in `src/unocss/{semantic,index,colors}.js`
  (tokens exposed as CSS vars + shortcuts). Configured in `uno.config.js`.
- **Data:** mock fixtures in `src/mocks/{event,sessions,addons}.js`.
- **Entry point:** `src/pages/IndexPage.vue` (currently a placeholder — build the wizard here).
- **Tests:** Vitest + Vue Test Utils. Co-locate business-logic tests next to their source
  (`src/**/*.test.js`, e.g. `src/utils/pricing.test.js`); broader tests under
  `test/vitest/__tests__/`. Focus on the rules the mocks are built for: VIP workshop
  discount, capacity (`registered >= capacity`), time-conflict detection, currency format.
- **Commands:** `yarn dev` (→ `:9001`, auto-opens) · `yarn build` · `yarn check`
  (ESLint + Prettier) · `yarn fix` · `yarn test:unit` (watch) · `yarn test:unit:ci` (once).
- **Commits:** conventional commits (repo uses `feat:` / `chore:` / `style:`); name the
  spec area (e.g. `feat: step 3 add-ons running total`). Keep commits **small and atomic** —
  they're the building blocks of a PR, but the **PR is the unit of human review** (§2.6),
  sized to ~20 min of senior review.
- **`JOURNAL.md` journal (per commit):** every commit **must also add or update a matching
  `##` section in `JOURNAL.md`** — the per-commit development log, renamed from the
  original `PLAN.md` journal (§1.5; distinct from `IMPLEMENTATION_PLAN.md` and from the
  submission `PLAN.md`, do not conflate). `JOURNAL.md` mirrors the commit history one
  `##` section per commit, in order. Keep the existing convention and format:
  - the `##` heading is the commit's conventional-commit subject (e.g.
    `## feat: step 3 add-ons running total`);
  - below it, describe _what and why_ in the doc's established first-person voice, using
    `###` sub-sections (e.g. _AI follow-up questions_, _Command-line shortcuts_) where they
    add value;
  - the journal entry lands **in the same commit** as the change it documents — never a
    separate trailing "docs" commit, and never left for later.
- **Branches & PRs:** never commit feature work to `main`. Branch per change
  (e.g. `feat/step-1-attendee-info`) scoped to one ~20-min-review theme (several commits
  fine), open a PR against `main` via `gh pr create` (the
  `.github/pull_request_template.md` checklist is auto-loaded), and hand off for human
  approval — the agent never self-approves or self-merges.
