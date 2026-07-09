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
   don't "fix" it or silently diverge.
3. **The Figma page is the source of visual truth.** All UI must match it (see §4). The
   canonical file is:
   `https://www.figma.com/design/6Jl8Jyv7bETcHg2carNi6d/Nitra-FE-Assessment—v2`
4. **Design tokens only — never hardcode hex.** Use the UnoCSS semantic shortcuts/tokens
   defined in `src/unocss/semantic.js` and `src/unocss/index.js` (e.g. `text-neutral`,
   `bg-surface-l1`, `border-neutral-muted`, `text-h3`). No raw color/typography literals.
5. **`IMPLEMENTATION_PLAN.md` is the living plan.** The plan, design/dependency decisions,
   and the acceptance-criteria→test map live there and are kept up to date as you work.
   (This is distinct from the submission `PLAN.md` referenced by `README.md` §Submission —
   do not conflate the two.)
6. **Gates are green before "done."** `yarn check` (ESLint + Prettier) and `yarn test:unit`
   must pass, and the UI must match Figma, before any change is considered complete.

---

## 2. Spec-driven workflow (mandatory — these are blocking gates)

Work proceeds **specify → plan → tasks → implement → verify**. Each arrow is a gate: do
not cross it until the prior step is satisfied. The spec is the source of truth and code
is its projection — every line of code traces back to a rule in `README.md` and a frame in
Figma.

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
5. **Verify** — _gate: definition of done._ Business-logic Vitest tests (each tracing to
   an acceptance criterion), visual parity vs Figma via `agent-browser`, and
   `yarn check && yarn test:unit` green.

**Anti-patterns — do not do these:**

- **Vibe-coding** — writing feature code before the spec/plan step above.
- **Silent scope drift** — diverging from `README.md`/Figma without recording it in
  `IMPLEMENTATION_PLAN.md`.
- **Untestable acceptance criteria** — "looks nice", "feels fast"; if it can't fail a
  test, rewrite it.
- **Retrofitted docs** — writing code first and back-filling the plan to match.
- **Tests as decoration** — tests that don't map to a stated acceptance criterion.

---

## 3. Which skill to use in which phase (installed this session)

| Phase                 | Skill / MCP                         | Use it for                                                           |
| --------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| Specify (visual)      | **`figma-mcp-free`** MCP            | Read the Figma design → frames, tokens, structure (§4).              |
| Implement (framework) | **`quasar-skilld`**                 | Correct Quasar 2 component APIs (QInput, QStepper, QCard, …).        |
| Implement (Vue)       | **`vue`**, **`vue-best-practices`** | Composition API `<script setup>`, props/emits, composables — in JS.  |
| Implement (styling)   | **`unocss`**                        | Utility/shortcut usage that reuses the existing semantic tokens.     |
| Verify (tests)        | **`vue-testing-best-practices`**    | Vitest + Vue Test Utils patterns for business-logic and SFC tests.   |
| Verify (visual/E2E)   | **`agent-browser`**                 | Drive the running app on `:9001`, screenshot, compare against Figma. |

The `vue*`/`unocss` skills show TypeScript — translate every example to plain JS (§1.1).

---

## 4. Figma-driven UI workflow (enforced)

UI is implemented _from_ the Figma design, not approximated. Use the **`figma-mcp-free`**
MCP server (chosen because we lack Dev Mode access to the file — see `tmp.md`). Every tool
accepts the `figmaUrl` above **or** a `fileId`.

1. **`list_frames`** — enumerate frames and identify the target for the step you're
   building.
2. **`export_tokens`** — pull the frame's design tokens and **reconcile against**
   `src/unocss/semantic.js`. If Figma diverges from our tokens, record the discrepancy in
   `IMPLEMENTATION_PLAN.md` and resolve it deliberately — **never silently hardcode a hex
   value** (see §1.4).
3. **`get_file` / `get_components`** — inspect the frame's layer/component structure to
   plan the Vue component tree and map Figma components to Quasar components.
4. **`generate_code { framework: 'vue', figmaUrl + nodeId }`** — _reference only._ Never
   ship generated markup as-is: rewrite it to **Quasar components + UnoCSS token classes**,
   in plain JS.
5. **Verify visually** — use `agent-browser` to run the app (`yarn dev`, `:9001`) and
   compare the rendered component against the Figma frame; iterate until it matches.

_Fallback:_ the official `claude.ai Figma` MCP (`get_screenshot`, `get_design_context`,
`get_variable_defs`) gives richer context but needs Dev Mode access we don't have — reach
for it only if `figma-mcp-free` is insufficient.

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
  spec area (e.g. `feat: step 3 add-ons running total`).
