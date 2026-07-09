<!--
This template enforces the Review (human) gate defined in CLAUDE.md §2 step 6.
Review is per commit — keep this PR small (prefer one logical commit).
Fill every section. Delete nothing; write "n/a" where a section doesn't apply.
-->

## What & why

<!-- One or two sentences: what this change does and which wizard step / logic module. -->

## Spec traceability

- **`README.md` rule(s):** <!-- e.g. Step 3 §5 running total, §4 unified validation -->
- **Figma frame(s):** <!-- frame name + nodeId -->
- **Acceptance criteria → test map:** <!-- link the IMPLEMENTATION_PLAN.md §5 criteria and the Vitest cases / agent-browser checks that cover them -->

## Judgment & decisions (required — this is what the reviewer scrutinizes)

<!-- Do NOT leave blank. Silent judgment calls are the failure mode this gate exists to catch. -->

- **Traps / gotchas hit:**
- **Judgment calls & decisions made** (map to `IMPLEMENTATION_PLAN.md` decision log `D#`):
- **Deliberate spec-gap fills / deviations from README or Figma:**
- **Open questions / assumptions I could NOT resolve from the spec:**

## Gates (automated — must be green before requesting review)

- [ ] `yarn check` (ESLint + Prettier) passes
- [ ] `yarn test:unit:ci` passes
- [ ] Figma visual parity confirmed via `agent-browser`

## Constitution compliance

- [ ] Plain JavaScript only — no TypeScript (`lang="ts"`, typed macros, `.ts` files)
- [ ] Design tokens only — no hardcoded hex / typography literals
- [ ] `README.md` untouched
- [ ] Committed on a branch, not directly to `main`
- [ ] `PLAN.md` journal section added/updated for each commit (§5 convention)

## AI-usage note

<!-- What was AI-generated / AI-assisted in this change. -->

---

**Reviewer sign-off** (human — the author/agent must NOT self-approve or self-merge):

- [ ] Reviewed commit-by-commit; judgment calls above are sound; approved to merge
