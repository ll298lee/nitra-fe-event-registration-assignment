# IMPLEMENTATION_PLAN.md — living engineering plan

> **Status:** foundation not yet started. This is the living plan mandated by `CLAUDE.md` §1.5 /
> §2. It records the spec-driven approach, every design/dependency **decision with rationale**, and
> the **acceptance-criteria → test map**. It is kept up to date as work proceeds.
>
> **Not** the submission `PLAN.md`. `PLAN.md` (README §Submission) is the submission narrative;
> this file is the engineering plan. Do not conflate them.

---

## 1. Purpose & how to use this doc

We build the 4-step event-registration wizard (Attendee Info → Session Selection → Add-ons →
Review & Submit) under **spec-driven development**. Each arrow is a blocking gate:

**specify → plan → tasks → implement → verify → review**

- **`README.md`** is the immutable **functional** spec (fields, validation, pricing, capacity,
  conflict logic). Read-only — never edited.
- **Figma** (`euBzD5nFIKWTw1rVd69M6G`, "Nitra FE Assessment — v2 (Copy)", read via the official
  Dev Mode MCP — see D18) is the **visual** spec. Frame nodeIds are catalogued in §4.
- Every acceptance criterion in §5 is Given/When/Then and maps to a named Vitest case **or** a
  visual `agent-browser` vs Figma check. If a rule can't be written as a failing test, it isn't
  specified yet.
- **Definition of done:** `yarn check` (ESLint + Prettier) and `yarn test:unit:ci` green, the UI
  matches its Figma frame, **and the commit's PR is human-approved and merged** (the `review`
  gate — `CLAUDE.md` §2 step 6). The agent never self-approves or self-merges; PRs are logged in
  §9.

All numbers in this plan were verified directly against `src/mocks/{event,sessions,addons}.js`, the
UnoCSS token files, and `quasar.config.js` — not from memory.

---

## 2. Architecture & file layout

Pure logic is written and tested **before** any UI, so the numeric acceptance criteria go green
independently of components (satisfies the "must be testable" gate).

| Module                               | Responsibility                                                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/facade.js`                 | Thin **async** wrapper over the three mocks (simulated fetch) — exposes `fetchEvent()`, `fetchSessions()`, `fetchAddons()`, `submitRegistration()` returning Promises so loading/pending states are real (D1). |
| `src/data/normalize.js`              | JSDoc `@typedef`s (`Session`, `Addon`, `Ticket`, `Registration`) + normalizers that parse ISO strings **once at the edge**.                                                                                    |
| `src/utils/pricing.js`               | `formatCurrency`, `WORKSHOP_DISCOUNT_RATE`, workshop-discount math (D5, D11).                                                                                                                                  |
| `src/utils/datetime.js`              | Wall-clock time-range formatter + day-group key (D4).                                                                                                                                                          |
| `src/logic/conflicts.js`             | `intervalsOverlap`, `detectConflicts` — strict inequality (D6).                                                                                                                                                |
| `src/logic/capacity.js`              | `isFull`, `remainingSpots`.                                                                                                                                                                                    |
| `src/logic/validation.js`            | Pure predicates: `isValidEmail`, `isValidPhone` (lenient), required/conditional checks, `validateAll` → per-step error map (D7–D10).                                                                           |
| `src/composables/useRegistration.js` | Single source of wizard state via **provide/inject** (D2); survives free forward/back navigation.                                                                                                              |
| `src/composables/useOrderSummary.js` | **Fully computed** totals + VIP workshop-only discount, zero watchers (D3).                                                                                                                                    |
| `src/composables/useValidation.js`   | Wraps `validation.js` with touched-field tracking + "reward early, punish late" (D7).                                                                                                                          |
| `src/components/wizard/*`            | Step SFCs (`StepAttendee`, `StepSessions`, `StepAddons`, `StepReview`, `SuccessScreen`) + shared field/card components.                                                                                        |
| `src/i18n/en.js` + boot              | `vue-i18n` `en` locale; UI copy extracted behind it (D14).                                                                                                                                                     |
| `src/pages/IndexPage.vue`            | Hosts the stepper shell + provides `useRegistration`.                                                                                                                                                          |

Tests co-locate for pure logic (`src/**/*.test.js`); component tests under
`test/vitest/__tests__/`.

---

## 3. Decisions log

| #       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Rationale                                                                                                                                                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1**  | Thin **async facade** over the mocks (simulated fetch).                                                                                                                                                                                                                                                                                                                                                                                                                         | Loading/pending states are graded but the mocks are synchronous; a facade resolves that tension and mirrors real API integration.                                                                                                                                                                                    |
| **D2**  | `useRegistration` composable + **provide/inject**, not Pinia.                                                                                                                                                                                                                                                                                                                                                                                                                   | The rubric names composable/inject as accepted patterns; adding a store is negative restraint. State must survive free forward/back navigation.                                                                                                                                                                      |
| **D3**  | `useOrderSummary` **fully computed, zero watchers**.                                                                                                                                                                                                                                                                                                                                                                                                                            | Makes the killer sequence free & instant: VIP → add ws1 → Review → Edit → switch to General → discount vanishes with no reconciliation code.                                                                                                                                                                         |
| **D4**  | **Wall-clock timezone policy** for display and day-group keys.                                                                                                                                                                                                                                                                                                                                                                                                                  | All timestamps are `Z`/UTC but represent event wall-clock. Applying the viewer's offset (Taipei +8) shifts everything and pushes `ws2` (18:30Z → 02:30 next-day local) onto the wrong day.                                                                                                                           |
| **D5**  | Currency via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.                                                                                                                                                                                                                                                                                                                                                                                              | `$X,XXX.XX`, always two decimals, thousands separators. _(SUPERSEDED by D42: whole-dollar amounts now show **no** cents; only genuinely fractional amounts keep 2-decimal cents.)_                                                                                                                                   |
| **D6**  | **Strict-inequality** overlap (`aStart < bEnd && bStart < aEnd`); back-to-back = no conflict.                                                                                                                                                                                                                                                                                                                                                                                   | The data is engineered around the 14:00Z boundary (`s10`↔`s11`, `ws1`↔`s10`); touch must remain selectable.                                                                                                                                                                                                          |
| **D7**  | **Deferred, unified submit-time validation**; after the first failed submit, touched fields re-validate live ("reward early, punish late").                                                                                                                                                                                                                                                                                                                                     | README defers all validation to Step 4; live-after-failure is the humane and testable behavior. Before the first submit, nothing eager.                                                                                                                                                                              |
| **D8**  | **Lenient phone** validation (format-ish, not strict E.164).                                                                                                                                                                                                                                                                                                                                                                                                                    | Over-strict phone regex is a junior tell and rejects valid international numbers.                                                                                                                                                                                                                                    |
| **D9**  | Session↔workshop conflict **owned by Step 3** (where the dependent workshop choice lives); message **names the conflicting session**. Step 1 can display an error caused by a Step 3 condition (shipping-required-from-merch).                                                                                                                                                                                                                                                  | Flag errors where the causing choice lives; make cross-step causes explicit.                                                                                                                                                                                                                                         |
| **D10** | A **stale** workshop conflict (revisit Step 2 and add a conflicting session after selecting the workshop) is **kept and surfaced at submit**, not silently auto-removed.                                                                                                                                                                                                                                                                                                        | Consistent with the deferred-validation philosophy; never mutate the user's selections behind their back.                                                                                                                                                                                                            |
| **D11** | `WORKSHOP_DISCOUNT_RATE = 0.10` is a **derived constant** in `pricing.js`.                                                                                                                                                                                                                                                                                                                                                                                                      | The mock stores the VIP perk only as the display string `"10% off workshops"` — there is **no numeric rate in the data**. Documenting this keeps `0.10` from reading as a magic number.                                                                                                                              |
| **D12** | Capacity-full → **disabled + "Full"** for sessions **and** the `ws2` workshop.                                                                                                                                                                                                                                                                                                                                                                                                  | README spells this out for sessions only; extending it to full workshops is a deliberate spec-gap fill for consistency.                                                                                                                                                                                              |
| **D13** | **Custom stepper** styled with tokens, **free/non-linear** navigation. **Confirmed against Figma in the shell PR:** hand-built token stepper (teal current/completed circles, check glyph on completed, gray upcoming); steps are **clickable** for free nav — Figma doesn't depict step-click, but D13 mandates non-gated navigation, so I made them clickable.                                                                                                                | Quasar's Material `QStepper` defaults fight the Figma and Design Fidelity is 20% of the grade. Navigation must not be validation-gated.                                                                                                                                                                              |
| **D14** | **i18n in scope** — add `vue-i18n`, scaffold an `en` locale, extract UI copy.                                                                                                                                                                                                                                                                                                                                                                                                   | Requested. Dependency rationale: isolates all display strings (labels, banners, error messages) behind one locale file, easing copy review against README/Figma and future localization. Registered via a boot file.                                                                                                 |
| **D15** | **Post-success: terminal / locked** — success screen (generated confirmation #, personalized thank-you echoing name + email) + a single **"Back to Home"** CTA that resets to the entry state. No "register another", no read-only back-navigation.                                                                                                                                                                                                                             | Matches Figma **Success State** frame `1075:903` exactly.                                                                                                                                                                                                                                                            |
| **D16** | Merch `maxQuantity` is a **top-level total** across sizes (data-verified); `merch4` (max 1) renders a quantity control capped at 1.                                                                                                                                                                                                                                                                                                                                             | Data-backed; the size+quantity interaction shape is confirmed against the Figma Step 3 frame during implementation.                                                                                                                                                                                                  |
| **D17** | **Data-edge robustness** (from the `/code-review` prep pass): missing `registered` reads as 0 (keeps `isFull`/`remainingSpots` consistent); an add-on time slot is attached only when **both** `date` and `endDate` are present (no Invalid Date); the confirmation number draws 8 uniform `[A-Z0-9]` chars. Downstream `conflicts`/`capacity` deliberately **trust the normalized shape** and do not re-validate — the "normalize once at the edge" invariant is the contract. | The facade (D1) is designed to be swapped for a real `fetch`; hardening the seam (not every downstream caller) keeps partial/real payloads from silently corrupting capacity or conflict results without duplicating validation everywhere.                                                                          |
| **D18** | **Switch the Figma read path** from `figma-mcp-free` to the official **local Dev Mode MCP** (`figma-dev-mode-mcp-server`) + the **`figma-design-to-code`** skill, reading a **Dev-Mode-enabled copy** of the file (fileId `euBzD5nFIKWTw1rVd69M6G`; ground-truth URL updated in CLAUDE.md §1.3 / §1 above). Only the read (design→code) skill is installed — write-back-to-Figma skills are excluded. Permission allowlist + §4 nodeIds to be re-confirmed against the copy.    | The copy grants the Dev Mode access we originally lacked (the reason `figma-mcp-free` was chosen). The official server gives targeted `get_design_context`/`get_variable_defs`/`get_metadata` and first-party token fidelity vs. the open-source server; supersedes the CLAUDE.md §4 "no Dev Mode access" rationale. |

| **D19** | **Code comments describe code/behavior, not design.** Style/layout/token/Figma/measured-value narration is banned from source; design rationale lives in this plan. Codified in `CLAUDE.md` §1.7 + an anti-pattern bullet, and applied by stripping such comments from the wizard components (incl. the already-merged `WizardStepper.vue`). | Requested by the user mid-Step-1. Measured-value comments (`// 16px → gap-4`) rot as tokens change and duplicate this plan; the token classes are self-describing. Comments are reserved for non-obvious JS/business logic. |
| **D20** | **Ticket-row layout is grid + box-shadow ring, height pixel-stable across selection.** (a) `src/css/app.scss` gains a global `h1–h6,p,ul,ol { margin:0; padding:0 }` (+ `list-style:none`) normalize; (b) the ticket row is **CSS grid** (`grid-cols-3`), not flex; (c) the selected/unselected ring is an **inset `box-shadow`** (token vars, no hex) with the button set `border-0`; (d) the "✓ Selected" badge is always rendered and toggled with `invisible`. Result: card = **288px exactly**, identical across none/General/VIP/Student. | Quasar's base CSS re-adds UA margins (h2 0.83em, `<p>` 16px, `<ul>` 40px indent) that inflated every gap; Quasar's `.flex` helper forces `flex-wrap:wrap` and `flex:1 1 0%` items over-grow the flex cross-size (+16px); the UA `<button>` border is 2px and a 1px→2px border-width change on select shifted the grid row. Grid + shadow-ring + `border-0` + badge-reservation remove every source of selection-time layout shift (user-reported). |
| **D21** | **A11y + efficiency hardening from the `/code-review` prep pass.** (a) The ticket group now implements the full **WAI-ARIA radiogroup pattern** — roving tabindex (active radio = single tab stop) + Arrow/Home/End selection with focus management — instead of over-promising `role=radio` with no keyboard behavior; (b) Step 1 gets a **`sr-only` `<h1>`** (the step label) so the page has a top-level heading (the frame shows no visible title) — h2 sections nest correctly beneath it; (c) `FormField` adds a **`focus-visible` ring** (token `box-shadow`, no layout shift) since `outline-none` + a 1px border swap is a weak focus indicator; (d) **`fetchEvent` memoizes** its promise so the header + Step 1 share one fetch and revisiting Step 1 never re-incurs latency. | Confirmed findings from the high-recall review. **Dismissed (recorded, not bugs):** ticket price uses `${{price}}` not `formatCurrency` — Figma shows `$299` (no cents); the $X,XXX.XX formatter is for the Step 3/4 totals. "Next: Session Selection" vs stepper "Sessions" — both verbatim from Figma. The app.scss normalize's global blast radius is deliberate (Tailwind-Preflight-style; Quasar `.q-*` rules out-specify it). Real error/retry UI for a failing fetch is deferred to the real-integration phase (the mock never rejects). |

| **D22** | **The "✓ Selected" badge is pinned to the card's bottom-left corner (`mt-auto`), the same spot on all three cards** — overriding the earlier Figma reading (D20) where it flowed 12px below the last perk. | User request: the badge should sit in one consistent position across cards, not track each card's perk count. Because the grid makes all cards equal height, `mt-auto` drops the (always-rendered, `invisible`-toggled) badge to the same 20px-from-bottom-left corner on every card; height stays 288px and stable across selection. |

| **D23** | **Step 2 groups sessions by day via a segmented day-tab control** (`Nov 15` / `Nov 16`) that swaps the visible day, **not** stacked day-heading sections. Implemented as the WAI-ARIA **tabs** pattern (roving tabindex + Arrow/Home/End, `role=tablist/tab/tabpanel`). | The Figma Step 2 frame `1072:912` renders "group by date" (README §Step 2.1) as a segmented control, not stacked sections — this is the visual truth (§1.3) and still satisfies README's group-by-day requirement (both days reachable, organized by wall-clock date via `dayGroupKey`/`formatDayLabel`, D4). |
| **D24** | **The Figma Step 2 frame is a state-catalog; behavior is reconciled to README.** The frame shows mutually-inconsistent per-card states (the actually-full `s2` is drawn selected + "Sold Out"; the not-full `s5` is drawn greyed/disabled — an apparent time-conflict artifact). README wins on behavior (§1.2): **(a)** full sessions (`registered >= capacity` → `s2`, `s9`) get the frame's greyed/disabled visual (`bg-surface-l2`, dimmed text, no checkbox, not selectable) **and** a red "Sold Out" capacity bar — synthesizing the frame's two treatments; **(b)** **no conflict-gating at Step 2** (the greyed `s5` is deliberately not reproduced) — conflicts stay free-select and defer to Step 4 (README §Step 2.2, D6, AC-2.6); selected-vs-full are independent. **Copy judgment call:** the full-state label uses the frame's word **"Sold Out"** (visual truth) rather than README's descriptive "full" — flagged in the PR. | README §1.2 is the immutable functional spec and forbids silent divergence; the frame's per-card states can't all be literal (a full session shown selectable, a non-full one disabled), so it is read as a state showcase and behavior is driven by README while the _visual language_ of each state is taken from the frame. |
| **D25** | **Capacity fill-level tone bands.** The bar + spots-label color are keyed to how full a session is: `full` (≥100%) danger/"Sold Out", `high` (≥75%) accent, `medium` (≥50%) warning, `low` (<50%) brand. | The frame color-codes the capacity bar by fill level but README specifies only "remaining spots" (no thresholds) — a recorded spec-gap fill. The four thresholds fit **all six** day-1 cards observed in the frame (s6 41%→teal, s5 58%→yellow, s3 78% / s4 81% / s1 97%→orange, s2 100%→red); day-2 sessions use the same rule. Presentation-only, so it lives in `SessionCard` (not `logic/`), verified visually. |

| **D26** | **`useOrderSummary` is the single cart-pricing contract** for both the Step 3 running total and the Step 4 breakdown. Shape: a `LineItem` = `{ id, type, name, size, unitPrice, quantity, amount }`; it exposes `ticketLine`, `workshopLines` / `mealLines` / `merchLines`, a combined `addonLines`, `lineItems` (ticket-first, then add-ons in Workshops→Meals→Merch order), a **positive** `workshopDiscount` number, `subtotal` (pre-discount), and `total`. **Fully computed, zero watchers** (D3). Merch selections are read as `merchSelections[id] = { size, quantity }` — the shape the store + `useRegistration.test.js` already use; quantity-max is enforced by the Step 3 picker UI, not the summary (D16). Built as a plain `createOrderSummary(registration, sources)` factory (unit-testable, like `createRegistration`) with a `useOrderSummary(sources)` provide/inject wrapper; `sources.ticketTypes` / `sources.addons` accept refs/getters/plain via `toValue` so a component can pass still-loading facade refs. | The discount **display shape** (a separate `−$14.90` line vs a struck-through per-workshop price) is Figma-blocked (§7) — a UI concern — so the engine exposes the discount as a plain number and lets the UI render it either way. Keeping the discount over `workshopLines` only makes AC-P-3/P-4 structural: meal/merch/ticket amounts are never fed to `workshopDiscountAmount`, so nothing else can ever be discounted. `lineItems` order is fixed here (not in the UI) so Step 3 and Step 4 render the same itemization (AC-3.1 / AC-4.2). Splitting this pure engine into its own PR — ahead of the Step 3 UI — mirrors the foundation-logic PR (#6): it is testable without a component and independently reviewable. |

| **D27** | **Step 3 layout = two-column + category tabs.** Content is `Add-ons List` (788px, left) + `Order Summary` sidebar (380px, right), 32px gap (frames `1073:899` / `1149:565`). "Group by category" (README §Step 3.1) is a **segmented tab control** (Workshops / Meal Packages / Merchandise), reusing the Step 2 day-tab WAI-ARIA tabs pattern (roving tabindex + Arrow/Home/End) — **not** stacked sections. | The frame renders category grouping as a segmented control, same as Step 2's day grouping (D23) — visual truth (§1.3) while still satisfying README's "group by category" (all three reachable, in the frame's order). Two-column keeps the running total (AC-3.11) always visible beside the selections. |
| **D28** | **Workshop card treatment** (frame `1073:935` / `1073:942`). Header = name `text-subtitle1` + price in **`text-brand-emphasis`** (teal, unlike the neutral ticket/merch price); description `text-sm`; **wall-clock time _with date_** "Nov 16, 2:00 PM – 5:00 PM" `text-[11px] leading-[14px] text-neutral-quiet`; capacity "{n} spots remaining" `text-[11px]` **plain `text-neutral-quiet`, no bar/no tone** (simpler than `SessionCard`). Selected = inset **2px** `border-brand-emphasis` ring + `bg-brand-subtle-rest` (shift-free, per `SessionCard`). **Full (`ws2`) = white card + "Sold Out"** `text-[11px] font-semibold text-neutral-quiet` — **not** red/greyed. | Measured from the frames. The Step 3 workshop full-state deliberately diverges from `SessionCard`'s greyed/red full treatment (D24): the frame draws `ws2` as a plain white card whose only signal is a muted "Sold Out" label. The date-prefixed time needs a new `datetime` helper (`formatDateTimeRange`). |
| **D29** | **Order Summary panel** (frame `1149:626` + discount node `1073:964`). `bg-surface-l1` card, `p-6`, `rounded-md`, 1px `border-neutral-muted`; title `text-subtitle1`; line rows `flex justify-between` `text-sm font-regular text-neutral-muted`, label "{name} × {qty}" (× = U+00D7) + right-aligned `formatCurrency` price; **VIP discount = a separate line** "Workshop discount (VIP 10%)" / "-$14.90" in **`text-brand-emphasis`** (teal, not red/green); 1px `divider-muted` rule; Total row `text-sm font-medium text-neutral`. | The frame's mock rows have **inconsistent** per-row sizes (12/13/11px) and one stray teal label — read as mock noise; all data-driven rows are normalized to the canonical `text-sm` (rows 1–2), a recorded spec-gap fill. The discount's teal (not danger/success) colour is the frame's deliberate treatment. |
| **D30** | **Merch card + shipping banner** (frames `1172:588`/`609`/`640`, banner `1220:2186`) — **PR B.** Card: header (name + **neutral** price), description, Controls = optional **Size dropdown** (styled native `<select>`: "Size:" + value/"Select" placeholder + ▾) + **Qty stepper** (−/n/+ 28px `bg-surface-l2` keys, "max N" `text-[10px]`); **added (qty≥1)** = 1px `border-brand-emphasis` + `bg-brand-subtle-rest` + green **"✓ Added to order"** footer (`text-success`). One size + one total quantity (`+` disabled at `maxQuantity`) — confirms `{ size, quantity }` (D16/D26). **Banner** (`bg-info-subtle-rest`, `border-info-opacity`, `circle-info` icon `text-info`, `rounded-lg`) shows when any merch qty≥1; body copy verbatim from README §Step 3.4. | Resolves the §7 merch-interaction, merch4, and discount-shape gaps from the measured frames. Banner radius is `rounded-lg` (8px, measured) — distinct from the cards' `rounded-md`. |
| **D31** | **Two Step-3 states have NO Figma frame — deliberate spec-gap fills, flagged for review.** **(a) Meal Packages card** (PR C): no meal frame exists (meals are only a tab label); designed by reusing the `WorkshopCard` pattern minus time/capacity (header + teal price + description + selectable ring). **(b) Workshop time-conflict/unavailable state** (PR A): not drawn; a workshop overlapping a selected session becomes **non-selectable** with a status line naming the session ("Unavailable — overlaps {session}") in `text-warning`. A **stale** conflict on an already-selected workshop **keeps** the selection (never auto-removed, D10) and shows the same warning, still deselectable. | README requires meals (§Step 3.1) and workshop-conflict marking (§Step 3.2) that Figma does not depict, so these are designed from the nearest Figma-defined patterns and recorded rather than invented silently (§1.2). Conflict detection uses `conflictingSessions` (D6); the message names the session per D9. |

| **D32** | **Merch card + banner — Dev Mode re-audit corrects five D30 measured claims (PR B).** Re-measured against frames `1172:588/609/640` (cards) + `1220:2186` (banner) via the Dev Mode MCP: **(a)** merch **price is `text-neutral`** (black), _not_ teal — header name + price share `text-subtitle1 text-neutral`; the teal price is workshop-only (D28); **(b)** the added-state (qty≥1) ring is **1px** `border-brand-emphasis` (inset), _not_ 2px — a deliberate departure from the 2px selected ring the rest of the card family uses (Ticket/Session/Workshop); **(c)** the added-card fill `#EEF6F7` maps to **`bg-brand-subtle-rest`** (teal[0]) — matched by measured hex to the sibling cards' convention (§4), _not_ the `bg-brand-muted-rest` the Figma variable label suggested (that token = teal[50] `#CBE5E6`); **(d)** the banner radius is **8px = `rounded-lg`** and it carries a bold **"Shipping Information"** title (`text-subtitle2`) above the verbatim README body (`text-md font-regular text-neutral`) — D30's "single paragraph" was wrong; **(e)** the merch card is a **static `role=group` container** (state driven by the size `<select>` + qty stepper inside), _not_ a `role=checkbox` toggle button like `WorkshopCard`, so it has no card-level click/hover; **(f)** the banner sits **above** the card list (between the tabs and the first card, frame position), not below. Merch **unit prices show no cents** (`${price}` → "$35", verified in-browser against the frame), matching the Step-1 ticket cards — the **Order Summary** still uses `formatCurrency` ("$35.00"), also per the frame. (`WorkshopCard`'s `formatCurrency` "$149.00" is the lone Step-3 card that shows cents — left as-is, out of PR-B scope, flagged in the PR.) **Spec-gap fills:** (i) the frames show no disabled −/+ key style, so a disabled key dims its glyph to `text-neutral-disabled` + `cursor-not-allowed` (recorded, not measured); (ii) the 1px brand-emphasis inset ring is written as one full `shadow-[…]` literal (not interpolated from a shared const) — UnoCSS extracts classes by scanning source text and this 1px-brand ring appears on no other card, so a split token generated nothing (the ring rendered as `none` until inlined; caught in the `agent-browser` pass). | Frames are the visual source of truth (§1.3); D30 was authored from an earlier read and these values are corrected from a fresh Dev Mode measurement + in-browser `getComputedStyle` rather than shipped silently (§2 anti-pattern "silent visual approximation"). The `#EEF6F7`→`bg-brand-subtle-rest` mapping reuses the exact by-hex reconciliation already recorded for Step 2 (§4). |

| **D33** | **Step 2 stays purely free-select — no immediate in-Step-2 conflict indicator (confirmed with the user).** A workshop selected _first_, then a conflicting session added via back-nav, leaves that session **freely selectable in Step 2 with no warning shown there**. This is the README §2.2 behavior (Step 2 defers all time-conflict validation to Step 4). The stale conflict is surfaced (a) on the **Step 3** workshop card ("Overlaps {session}", D10 — kept, never auto-removed) and (b) at **Step 4 submit** (AC-4.6 — pending validation PR). A non-blocking Step 2 session-card indicator was explicitly **considered and declined**; **gating** Step 2 or **auto-removing** the workshop were rejected as README §2.2 / D10 violations (would require the §2 scope-change procedure). | The asymmetry (sessions primary/free, workshops dependent/gated — D9) is the spec's own design (§Step 2.2 vs §Step 3.2). Recording the confirmation prevents re-litigating and keeps **AC-4.6 as the single closing mechanism** — the perceived "nothing happens" is only because that Step 4 validation is not built yet. |

| **D34** | **Step 4 ships as ~4 reviewable PRs, pure validation logic first.** Mirroring the pure-engine-before-UI split of PR #6 (foundation logic) and PR #12 (`useOrderSummary`): (1) **pure validation logic** — `src/logic/validation.js` (predicates + `validateAll` → per-step error map) + co-located tests; (2) **Review UI** — grouped summary + itemized breakdown + Edit navigation; (3) **submit + `useValidation` wiring** — touched-field "reward early, punish late" (D7), step error indicators, jump-to-step, double-submit guard; (4) **terminal success screen** (D15). Three judgment calls land in PR 1: **(a)** `validation.js` is **framework-free** over a plain store snapshot (same boundary as `conflicts.js`/`capacity.js`); the reactive `toValue`/touched-field adapter is the PR-3 `useValidation` composable. **(b)** **Ticket selection is a submit-time requirement** filed under Step 1 (`attendee.ticketId`) — a deliberate **spec-gap fill**: README's Step-1 _fields_ table does not list the ticket, but a registration with no ticket is invalid (no price, no ticket line), and Step 4 §4 validates "all fields across all steps." Flagged in the PR; one-line removal if the reviewer disagrees. **(c)** **Session↔session** time conflicts flag **Step 2** at submit and **workshop↔session** flag **Step 3** (D9); this satisfies README §2.2 ("conflicts detected → relevant step indicated with errors") and is **consistent** with AC-2.6/D33 — those forbid an _in-Step-2 gate_ (free-select stays), not a _submit-time_ error. **(d)** Validation **copy lives inline in the logic layer** for now (centralized message builders), moving behind `vue-i18n` in Phase 4 (D14) — the whole app currently inlines copy, so a code→copy indirection now then redone for i18n is churn. **Known consequence (flagged):** time-conflict copy now lives in _two_ places — `validation.js`'s builders ("{workshop} overlaps with {session}") and the already-merged `WorkshopCard`'s in-card status ("Overlaps {session}") — so the same stale conflict reads differently on the Step-3 card vs. the Step-4 submit error; the Phase-4 i18n extraction must consolidate both under shared keys so they cannot drift. | The pure logic is testable without a component and independently reviewable, keeping each PR to one ~20-min-review theme (§2.6). Splitting the judgment calls into the first, smallest PR surfaces them for review before any UI depends on them. |

| **D35** | **Step 4 PR 2 — Review UI, measured from frame `1074:897` (two independent Dev Mode extractions, reconciled).** **(a) Single-column** stacked cards — Attendee Information / Selected Sessions / Add-ons / Pricing Summary — **not** the two-column sticky sidebar of Step 3; pricing is the last stacked card. **(b) NO aggregate "Subtotal" row** — the frame renders line items → discount → divider → Grand Total only (confirmed by both extractors). README §4.2 "line-by-line breakdown with **subtotals** and grand total" is read as **per-line subtotals** (each line's own amount) + the grand total, which the itemized lines satisfy. **Flagged for review:** one-line add-back if the reviewer reads "subtotals" as a single pre-discount aggregate row. **(c) Edit-link colour** measured `#3a7679` (teal[500] = `--bg-brand-emphasis-active`) has **no semantic _text_ token** — the brand text tokens are `text-brand` #2e5e60 / `text-brand-emphasis` #1e3c3e / `text-brand-muted` #4a979b — so it maps to the nearest, **`text-brand`** (#2e5e60), a recorded 1-shade approximation (as Step 2 §4). The Figma variable is mislabeled `components/button/primary-link/text/rest`; our set has no `text-link` token. **(d) Visible title "Review Your Registration"** (`text-h3`) is owned by `StepReview` as an `<h2>`, mirroring Steps 1–3 (each owns its visible title). The shell `<h1>` becomes **`sr-only` for all four steps** (it was visible only on step 4, where it rendered the short stepper label "Review"); the stepper label stays the accessible landmark. **(e) Add-ons summary presentation is a spec-gap fill** (the frame proves only the Workshop case): left = category label (Workshop / Meal / Merchandise), right = `{name} ($unitPrice)` (no cents, per frame); **merch appends `, {size}` and `× {qty}`** so the readable summary is complete; meals reuse the workshop format. **(f) Pricing line labels omit `× 1`** — the frame shows `Hands-on Vue.js Testing`, not `× 1`; merch qty>1 shows `× {qty}`. Deliberately unlike Step-3 `OrderSummaryPanel` (which shows `× 1` per its own frame, D29) — each pricing panel is faithful to its own frame. **(g) Shipping Address** is a **conditional 7th attendee row, shown only when non-empty** (the frame's 6-row sample has none) — keeps parity when empty, completes the summary when provided (esp. merch-required, AC-1.6). Empty required fields render an em-dash "—" placeholder. **(h) Discount row is 11px** (`text-[11px] leading-[14px] text-brand-emphasis`), intentionally 1px smaller than Step 3's `text-sm` discount — matches the frame's `body/xs`; recorded discrepancy (no 11px token). **(i)** The pricing **engine `useOrderSummary` is reused** (D26 contract) but the Step-4 **`PricingSummaryCard` is a distinct component** from Step-3 `OrderSummaryPanel` (p-5 vs p-6, gap-2 vs gap-4, "Pricing Summary"/"Grand Total" vs "Order Summary"/"Total", 11px discount, omit-`× 1`) — frame-faithful per panel, not prop-soup on one shared component. | Frame `1074:897` is the visual source of truth (§1.3); the two README-vs-Figma tensions (no subtotal row; add-ons/merch presentation not drawn) are surfaced and recorded rather than silently resolved (§1.2, §2 anti-patterns). Reuses the by-hex reconciliation convention (§4) and the pure-engine/faithful-per-panel split (D26). Submit wiring, step-error indicators, and the success screen stay in the later Step-4 PRs (D34). |

| **D36** | **Step 4 PR 3 — submit-time validation wiring + Review error display, grounded in frame `1076:936` ("Review – Attendee (Error)").** **(a) `useValidation` composable** — provide/inject at the wizard root (like `useRegistration`/`useOrderSummary`), wrapping the pure `validation.js` (D34): a `submitted` ref, a **live** `errors = computed(validateAll(storeSnapshot, { sessions, addons }))`, `isValid`/`errorSteps`, and `attemptSubmit()` (sets `submitted`, returns validity). It fetches `sessions`+`addons` once at root mount (conflict validation needs the normalized objects); field validation needs no sources. **(b) "Reward early, punish late" (D7, AC-V-5)** = a **`submitted`-gated live** per-field error: nothing shows before the first submit; after a failed submit every currently-invalid field shows its error and each clears live as it becomes valid. Per-field "touched" tracking is **subsumed** by the post-submit live recompute (an invalid field shows its error whether or not it was touched), so no separate touched map is kept — recorded so the simplification is deliberate, not an omission. **(c) Review error display (frame `1076:936`, all tokenized):** a section with any error renders its card border **`border-danger-emphasis`** (#c71a1a, red — still 1px solid) and its heading **`text-danger`** instead of `text-neutral`; a failing **attendee field row** shows its value in `text-sm font-regular text-danger` as **"— (required)"** (empty) / **"— (required for merchandise)"** (empty shipping) / the entered value in red (present-but-invalid). **(d) Sessions/Add-ons conflict errors** (frame shows only the Attendee card — spec-gap fill): the section card goes red and each conflict message from `validateAll` (`sessions`/`addons` arrays) renders as a red row (AC-4.5/4.9, AC-C-5). **(e) Step-1 `FormField` errors** are driven by the same `useValidation` (submitted-gated); `FormField` already renders `border-danger-emphasis` + a `text-danger` message, so no restyle. **(f) Error navigation = the red section cards + the existing "Edit → Step N" links** (PR 2); **no invented stepper error badge** — Figma has none (frame `1076:936` shows only the card), and a red card mapping 1:1 to a step + its Edit link already satisfies README §4.5 ("indicate which step(s) have errors and allow the user to jump"). **(g) Terse review markers** ("— (required)" / "— (required for merchandise)") are **review-surface copy**, distinct from `validation.js`'s verbose Step-1 messages ("Full Name is required", "Enter a valid email address"); both stay inline for now, to be consolidated under `vue-i18n` in Phase 4 (D14/D34d). **(h) PR-boundary refinement of D34:** this PR is the **invalid path only** — validation gate + error display + navigation. A **valid** submit is a guarded no-op placeholder here; the **async `submitRegistration` + pending state + double-submit guard + terminal success screen** (AC-4.7/4.8/S-2/S-4, D15) all move together into the **next** PR (they are one coherent async-submit theme, and the double-submit guard is meaningless without the async call D34 had grouped it away from). | Frame `1076:936` is the visual source of truth for the error state (§1.3); the Attendee-only frame is extended to Sessions/Add-ons conflict rows as a recorded spec-gap fill (§1.2). Keeping the async-submit/success flow in its own PR holds each to one ~20-min-review theme (§2.6) and avoids a throwaway interim success screen. `useValidation` mirrors the established provide/inject composable pattern (D2/D26). |

| **D37** | **Stepper error indicator + error-summary banner — corrects D36f, grounded in the full error frame `1076:904` ("Validation Error State").** D36f declined a stepper error badge because the sub-frame I had inspected (`1076:936`) showed only the Attendee card. The **user pointed to the parent frame `1076:904`**, which does show two error affordances D36f missed, so D36f is **superseded** here (not silently — the earlier reasoning was on an incomplete view). Added, still in PR #17 (same error-navigation theme, AC-4.5): **(a) Stepper error state** — a step whose section has errors renders a **red circle `bg-danger-emphasis-rest` (#c71a1a) with a white "!" glyph** (inlined SVG, replacing the check/number) and a **`text-danger` semibold label**; error styling **overrides** the completed/current/upcoming state, and the connector **after** an errored step reverts to the incomplete `bg-surface-l2` while connectors after completed steps stay teal (confirmed against the stepper node `1101:1070` — corrected from an initial "connectors unchanged" reading after the user pointed to it). Driven by a new `WizardStepper` `errorKeys` prop, fed the **submitted-gated** `errorSteps` from `useValidation`. **(b) Error-summary banner** (`ErrorBanner`) — shown between the stepper and the "Review Your Registration" title (first child of the Step-4 content column, `gap-6` to the title), `role="alert"`: `bg-danger-muted-rest` (#fce4e4) + 1px `border-danger-muted` (#f6b7b7) + `rounded-md` + `p-4` + `flex-col gap-2`; a `text-sm font-medium text-danger` heading **"Please fix the following errors before submitting"** (verbatim) above a bulleted list of `text-sm font-regular text-danger` items, each a literal **"• Step {N}: {message}"** (bullet is literal text, not a CSS marker — the app's `ul` reset removes list markers). The item list is built by a pure `summarizeErrors(errors)` in `validation.js` (copy home, D34d) that flattens the per-step error map to `"Step 1/2/3: {msg}"` in wizard order. **(c) Disabled Submit button** — in the error state the frame draws the primary "Submit Registration" button at **50% opacity** (its `#fb7429`/`bg-accent-emphasis-rest` fill unchanged); implemented as `:disabled` + `disabled:!opacity-50 disabled:cursor-not-allowed` (the `!` overrides Quasar's global `[disabled]{opacity:.6!important}`, see §4) when `submitted && !isValid`, so it re-enables live as the errors clear (reward-early, D7). Before the first submit it stays enabled (clicking is what runs validation). | The user is an authoritative source (§1.2) surfacing an under-implementation of README §4.5 ("clearly indicate which step(s) have errors"); the full frame `1076:904` is the visual truth for that indication. Recording the correction (rather than editing D36f) keeps the decision history auditable (§2). **Copy judgment call (flagged):** the banner items use the app's **canonical `validation.js` messages** ("Step 1: Phone is required"), not the frame's slightly-reworded mock copy ("Phone number is required"), to keep a single message source (D34d) and avoid the copy-drift the plan already warns about — the heading is verbatim. |

| **D38** | **`FormField` focus + error border states, grounded in "Shipping Address — States Reference" `1203:587` (user-pointed).** The node shows the input at three states, all **1px borders (never thickens)** — optional `border-neutral-muted` (#e3e6e8), a darker `border-neutral-emphasis` (#5c6970), and error `border-danger-emphasis` (#c71a1a) with the **whole label red** (`text-danger`) and message "Shipping address is required for merchandise orders". Two user asks + the node drove three changes: **(a) Focus darkens, never thickens** — removed the D21 `focus-visible:shadow-[0 0 0 2px …]` ring **and** the off-palette `focus:border-brand-emphasis` (teal); a non-error input now darkens to **`focus:border-neutral-emphasis`** (#5c6970, the node's darker gray) at a steady 1px. **(b) Error border stays red even when focused** — the error branch is just `border-danger-emphasis` with **no focus override**, so focusing an errored field keeps it red (the previous teal `focus:` rule used to win on focus). **(c) Error label turns red** — the label is `text-danger` when the field errors (per the node's error state), else `text-neutral`. | The node (§1.3) is the states spec the user pointed to; its palette has **no teal**, confirming the input focus/error borders are neutral/danger only — so the earlier teal focus border was off-palette. **Interpretation call (flagged):** the node labels its darker-gray column "MERCHANDISE SELECTED" (required), but the merged Step-1 frame `1069:968` draws the always-required attendee inputs with the **light** `border-neutral-muted`; reading the darker gray as a _persistent required_ border would contradict `1069:968` and dark-border every field, so it is read as the **focus/active darken** (matching the user's "when focused … just darken") rather than a required-state border. _(SUPERSEDED by D39: the user confirmed the darker gray **is** the required-shipping rest border.)_ **Deferred (SUPERSEDED by D39):** the node also shows required labels as "Shipping Address \*" (asterisk same colour as the label, not a red span); the asterisk was **not** added initially — but the user confirmed it should be (D39). **A11y note:** dropping the focus ring per the user weakens the keyboard-focus indicator to a border-colour darken (`outline-none` retained); recorded as a deliberate fidelity-over-a11y tradeoff the user chose. |

| **D39** | **Shipping required-state visual = persistent darker border + "Shipping Address \*" — corrects D38 (user-confirmed).** D38 read the node `1203:587` darker-gray "MERCHANDISE SELECTED" column as a focus-only darken and deferred the asterisk. The user confirmed the intended behavior: **when merchandise is selected (Shipping Address becomes required), its input border darkens to `border-neutral-emphasis` (#5c6970) at rest — without focus — and the label becomes "Shipping Address \*"**. Implemented via a new `FormField` `required` prop: `required` → rest border `border-neutral-emphasis` (steady 1px) + a " \*" appended to the label (same colour as the label — neutral normally, red when errored, per the node; not a separate red span). `StepAttendee` passes `:required="shippingRequired"` (`= hasMerchSelected`) alongside `:optional="!shippingRequired"`, so shipping reads "Shipping Address (Optional)" (light) with no merch and "Shipping Address \*" (darker) with merch. The D38 focus-darken (any field), error-red-border-even-focused, and red-error-label behaviors are **unchanged**; error still wins over required (`border-danger-emphasis`). | The user is authoritative (§1.2) and resolved the exact interpretation D38 flagged. The darker border + asterisk apply **only to the conditionally-required Shipping field** — the always-required Step-1 fields (Full Name, etc.) stay light-bordered + asterisk-free per `1069:968`, so the "\*" + darken highlight the one field whose requirement just _changed_ (a transition cue), not every required field. Reuses the same `border-neutral-emphasis` token the D38 focus-darken uses (the node's only non-muted, non-danger border), so required-at-rest and focused look identical — consistent with the node's 3-border palette. |
| **D40** | **Step 4 PR 4 (final) — async submit + pending + double-submit guard + terminal success screen (D15), frame `1075:903`.** **(a)** The submission lifecycle (`isSubmitting`, `confirmationNumber`) lives in the **shell** (`IndexPage`), not the store: the shell already orchestrates the root data fetches and holds the facade import, so it owns the async `submitRegistration` call + pending flag + assigned number, while the store owns form/nav state and gains a `reset()`. `isSuccess = confirmationNumber !== null` is the terminal state. **(b) `SuccessScreen` is presentational** — props `confirmationNumber`/`name`/`email`/`ticketName`/`eventName`, emits `home`; no inject/fetch, so it unit-tests trivially and stays faithful-per-panel, not prop-soup. **(c) Full-page replacement:** the header stays; the stepper band + steps + footer are `v-else` and give way to a centered `flex-1` success column (icon → heading → confirmation → 2-line body → button; single `gap-4`/16px, `py-15`/60px). The screen's heading is its own `<h1>` (`text-h2`) since the shell's `sr-only` `<h1>` is hidden here. Icon = `size-20` circle `bg-success-emphasis-rest` (#15B471) + inlined Figma check SVG (path `M22 40L34.8571 54L58 26`, 80-viewBox, white 4px round-cap stroke); heading `text-success` (#11925C); confirmation `text-lg font-regular text-neutral` (16/24/485); body `text-sm font-regular text-neutral-muted text-center` (12/16/485); button reuses the footer primary (`h-10 min-w-[72px] rounded-[10px] px-4 text-subtitle2 bg-accent-emphasis-rest text-inverse`). **(d) Dynamic echo:** greeting uses the **first name** (`fullName` first token) per the frame ("Thank you, John!"), tier = selected ticket `name`, event = `event.name`; the frame's "John"/"TechConf 2025" are placeholders (§4). **(e) Pending affordance = spec-gap fill** (no Figma frame): the primary button disables and swaps its label for a `q-spinner` while in flight; double-submit is guarded twice — `submitDisabled` includes `isSubmitting` **and** `onPrimary` short-circuits when already in flight. **(f) Back to Home** clears the confirmation, calls `registration.reset()` + `resetValidation()`, returning a pristine Step 1 (terminal — no "register another", no read-only back-nav, D15). **(g) Submit-failure UX is deliberately deferred (D21).** The mock facade never rejects and `onPrimary`'s `try/finally` always resets `isSubmitting`, so there is no stuck state and AC-S-4's "no partial state corruption" holds even on a hypothetical rejection; a real error/retry surface needs a Figma frame that does not exist yet, so no `catch`/error UI is built here (adding a `catch` now would be dead code against a facade that cannot throw). Flagged as the PR's top open question — the `/code-review` prep pass surfaced this as its headline finding (uniformly PLAUSIBLE/latent, never a live bug). | Frame `1075:903` is the visual source of truth (§1.3) — every measured value verified in-browser via `getComputedStyle` @1440px (full pass, zero deviation). Keeping the submission lifecycle in the shell mirrors how the root already owns async orchestration (the store stays framework-data-free + unit-testable, D2); the presentational `SuccessScreen` mirrors the pure-engine/faithful-per-panel split (D26/D35i). **Copy judgment calls (flagged in the PR):** (i) the confirmation line is the literal label "Confirmation #" + the facade's generated `WDS-XXXXXXXX`, so it reads "Confirmation #WDS-…" (the frame placeholder "TC2025-47291" carried no prefix); (ii) the first-name greeting derives from the free-text Full Name field (first whitespace token). **Test-map deviation:** the success flow is shell-owned, so its integration tests live in `IndexPage.spec.js` (+ a focused `SuccessScreen.spec.js`), not `StepReview.spec.js` as the §5 map first guessed. |

| **D41** | **Meal Packages card — implements the D31a spec-gap fill (no Figma frame exists).** There is **no meal frame** in Figma (the Dev Mode scan found only a "Meal Packages" tab _label_, no card design), so the card is **not** measured from Figma — it is designed by **reusing an existing, Figma-verified Step-3 card wholesale rather than inventing a new one**, per the user's instruction ("use the common style pattern in Step 3 — see Workshops and Merchandise") and D31a. **(a)** Meals are a **selectable toggle add-on with no quantity, capacity, or time slot**, so structurally they are a `WorkshopCard` **minus** the date/time, "spots remaining", and conflict/"Sold Out" rows — `MealCard` reuses that card's exact treatment: a `role="checkbox"` toggle button, header (name `text-subtitle1 text-neutral` + price), description `text-sm text-neutral-muted`, and the shift-free selection ring (2px `border-brand-emphasis` inset shadow + `bg-brand-subtle-rest` when selected; 1px `border-neutral-muted` + `hover:bg-surface-l2` at rest). **(b) Price colour = teal `text-brand-emphasis` via `formatCurrency`, inherited by reusing `WorkshopCard`.** Whole-dollar meal prices render `$45`/`$89` — **no cents** (per D42, which dropped cents from all whole-dollar prices app-wide). **Flagged for review (colour only):** the price stays teal (workshop treatment); switching to neutral `text-neutral` to match the Merchandise cards is a one-line change if the reviewer prefers meals align with merch. _(The cents half of this flag is now moot — D42 made every whole-dollar price cents-free, so the meal price is `$45`, not `$45.00`.)_ **(c) No "✓ Added to order" footer** — follows `WorkshopCard` (selection = the ring + fill + `aria-checked`), not `MerchCard`'s footer badge, keeping meals a clean "workshop minus extras". **(d) `toggleMeal` is a plain multi-select** into `selectedMealIds` (both packages independently selectable) with **no full/conflict guard** — meals have neither capacity nor a time slot (`isFull`/`conflictingSessions` already return `false`/`[]` for them, capacity.test/conflicts.test), so the guard `toggleWorkshop` carries would be dead code. **(e) Removed the meal-placeholder tabpanel `tabindex=0` hack** (D31a-era): the meal panel previously held non-focusable placeholder text and needed to be a tab stop; now all three panels contain focusable card controls, so no panel takes an explicit `tabindex` — matching the Workshops/Merchandise panels. The pricing engine (`useOrderSummary.mealLines`, D26) and the Step-4 review meal rows already existed, so this PR is UI-only. | Frames are the visual source of truth (§1.3), but none exists for meals; reusing a verified card wholesale (drop the rows meals lack) is the **least-invented** resolution and avoids silently synthesizing a new visual (§2 anti-pattern "silent visual approximation"). Confirms D31a rather than superseding it. **Verified in-browser** (`agent-browser` `getComputedStyle` @1440px): the meal card's rest **and** selected computed styles — box-shadow (incl. the 2px brand-emphasis ring), background, padding, radius, gap, and price/name typography — are **byte-identical** to `WorkshopCard`. The selection-ring box-shadow **renders correctly** (not `none`): each `shadow-[…]` ring is written as a **full contiguous literal inline** (not interpolated from a `DROP_SHADOW` const the way `WorkshopCard`/`SessionCard` do), so UnoCSS's source-text scan emits the rule from `MealCard` itself — the card is self-contained, not dependent on a sibling card's inlined literal. This adopts the `MerchCard` fix pattern (D32f) and matches the memory `unocss-static-scan-arbitrary-class`; the `/code-review` prep pass flagged that `WorkshopCard`'s interpolated version only works because the same resolved string is inlined in `TicketCard.vue`, so the new card was made independent of that coupling. |

| **D42** | **All displayed prices drop cents unless the value is genuinely fractional (user-directed, Figma).** The user (authoritative per §1.2, citing Figma) directed that prices show **no decimal points/cents** — _"if the actual value of price includes cents, do include cents in display."_ So `formatCurrency` now branches on `Number.isInteger(amount)`: whole dollars use a `maximumFractionDigits: 0` formatter (`$45`, `$299`, `$1,234`), and fractional amounts use a 2-decimal formatter (`$14.90`, `$733.10`). It is **display-only** — the engine (`useOrderSummary`/`round2`) keeps exact values, so the VIP discount stays precisely `14.9` and the killer-sequence math (AC-P-\*) is unchanged; only the rendered string loses `.00`. Cascades to every `formatCurrency` caller (`WorkshopCard`, `MealCard`, `OrderSummaryPanel`, `PricingSummaryCard`); the ticket/merch cards + Step-4 `StepReview.dollars` already rendered whole dollars, so they were already compliant. **Reconciliation:** this preserves the discount line D29 measured (`-$14.90`, still fractional → cents kept) and the discounted totals (`$733.10`/`$848.10`); it only removes the trailing `.00` from whole-dollar item prices/totals — so D28/D32a's per-card cents notes and D29/D35's summary formatting are refined (whole → no cents), not reversed. Resolves the D41 meal-price **cents** flag (the colour flag stays open). Supersedes D5's "always two decimals." Tests split accordingly: engine tests assert exact **numeric** values + the fractional strings (`$14.90`), the formatter's own test locks the whole-vs-fractional rule, and component tests assert the rendered no-cents strings. | The user is authoritative (§1.2) and Figma is the visual source of truth (§1.3). Branching on integer-ness satisfies the literal instruction ("no cents, unless the value actually has cents") with **zero precision loss** — the alternative (rounding everything to whole dollars) would misreport the `$14.90` discount as `$15` and could make itemized lines fail to sum. Fixing it in the one shared `formatCurrency` primitive (not per-call-site) keeps it at the right altitude — every current and future price display inherits the rule. **Verified in-browser** (`getComputedStyle`/text @1440px): Step-3 workshop `$149`, meal `$45`/`$89`, ticket line `$599`, all whole; the VIP order summary shows `-$14.90` discount and `$733.10` total with cents intact. |

| **D43** | **Phase-4 UX polish — spec-gap fills across several UX themes (no Figma frames), one branch / several atomic commits.** _Scope expanded by the user mid-PR_ from the original three to four themes — **loading/disabled states, transitions & animations, stepper navigation feel, validation error experience**. None has a Figma frame, so each is a recorded spec-gap fill (§7), not a measured value. May **split into two PRs at review** (transitions+stepper / validation+disabled) if it exceeds a ~20-min review (§2.6). **(a) Stable scrollbar gutter (user-reported).** The document (`<html>`) is the scroll container (no Quasar `QLayout`; `App.vue` → `router-view` → `IndexPage`'s `min-h-screen` div), so a tall step gains a viewport scrollbar while a short step does not — the width difference shifts the centered layout horizontally when switching steps. Fix: `html { scrollbar-gutter: stable }` in `src/css/app.scss` (global, alongside the existing UA normalize). Chosen over `overflow-y: scroll` (which paints a **permanent empty track** on short steps); `stable` reserves the gutter without a visible track. On overlay-scrollbar platforms (macOS default) scrollbars take no space, so it is a harmless no-op there — which is correct, since those platforms never show the shift. **(b) Skeleton loaders replace the bare `q-spinner`.** All four steps gate their content on a `loading` ref off the async facade (D1, `SIMULATED_LATENCY_MS = 250`); the loading branch swaps the centered spinner for content-shaped `q-skeleton` placeholders (Quasar built-in, auto-registered) approximating each step's card layout, so first-paint shows structure instead of a spinner and there is no jump when data resolves. _(Steps 1–3 landed in the skeleton commit; Step 4/Review was added in the disabled-states commit — see PLAN.md.)_ **(c) Step fade transition.** The `v-if`/`v-else-if` step swap in `IndexPage`'s `<main>` is wrapped in `<Transition name="step" mode="out-in">` with a 150ms opacity + 4px `translateY` fade + a `prefers-reduced-motion` guard, replacing the hard cut. Classes live in a **non-scoped** `<style>` (Vue applies the `step-*` classes to the child step's root, which carries the _child's_ scope attribute — scoped rules here would not match; names are unique to avoid clashes); timing/opacity only — no tokens/hex, §1.4 unaffected. **(d) Stepper navigation feel, (e) validation error experience, (f) disabled-state polish** — the user-expansion themes; each documented in its own `PLAN.md` journal entry (§5) as it lands. **Commits:** (a) `fix(ux)` scrollbar, (b) `feat(ux)` skeletons, (c) `feat(ux)` step transition, then (d)/(e)/(f) as separate `feat(ux)` commits — each carries its own `PLAN.md` entry. | Frames are the visual source of truth (§1.3) but none exists for a scrollbar gutter, a loading skeleton, or a step transition — so all three are designed and recorded as spec-gap fills rather than invented silently (§2 anti-pattern). `scrollbar-gutter: stable` is the idiomatic remedy for the exact shift the user reported and is safe on every platform (reserves the gutter where classic scrollbars exist — Windows/Linux, macOS "always show" — and no-ops on overlay). **Verification caveat (recorded):** headless Chromium uses **overlay** scrollbars (0-width), so the visual shift **cannot be reproduced in `agent-browser`**; verification confirms (i) `getComputedStyle(document.documentElement).scrollbarGutter === 'stable'` (the rule is applied to the real scroll container) and (ii) no regression across all four steps — the shift-on-classic-scrollbars is reasoned from the property's spec, not screenshotted. Skeletons/transition are verified visually + by component test (loading branch renders skeletons, resolved branch renders content). |

**New dependency introduced:** `vue-i18n` (per D14) — the only planned addition; rationale above.

---

## 4. Design-token & Figma reconciliation

- **Tokens reused (no hex, ever):** typography `text-h1..h4`, `text-subtitle1/2`; text colors
  `text-neutral{,-muted,-quiet,-disabled}`, `text-brand/accent/success/danger/info/warning{,-emphasis}`;
  surfaces `bg-surface-l0..l3`; borders/dividers `border-*`, `divider-*`; interactive state triples
  `bg-<palette>-<variant>-{rest,hover,active}` — **the `-rest`/`-hover`/`-active` pairs are exactly
  what "all interactive states handled" means in this codebase**.
- **Breakpoints:** `tablet 768` / `desktop 1024` (from `src/unocss/index.js`) — use these, not
  arbitrary values.
- **Track badges (mapping observed from Step 2 frame `1072:912`, applied in the Step 2 PR):**
  `main` → neutral (`bg-surface-l2` / `text-neutral-muted`), `frontend` → accent
  (`bg-accent-muted-rest` / `text-accent-emphasis`), `backend` → info
  (`bg-info-subtle-rest` / `text-info-emphasis`), `devops` → accent. No dedicated track token
  exists; these reuse existing palettes — never hardcode a hex.
- **Shell + stepper — exact measured values (Step 1 `1069:968` / Step 4 `1074:897`, verified
  in-browser via `getComputedStyle`):** vertical band layout, **Figma insets replicated** —
  header `48px` (`px-12`), stepper/content/footer `120px` (`px-30`); header `72px`, stepper
  `80px`. Header: `40px` teal `bg-brand-emphasis-rest` logo tile + dynamic event name at
  **`text-h4` (20px)**; step title **`text-h3` (24px)**. **Chrome dividers = `divider-default`
  (`rgba(0,0,0,0.1)`) 1px `border-solid`** below header + stepper and above the footer (the
  earlier `border-neutral-muted` was the wrong color _and_ needed an explicit border-style — it
  was rendering as no border). Stepper (D13): 32px circles, current/completed teal + white
  number/check, upcoming `bg-surface-l2` + `text-neutral-quiet`; label weights
  current=semibold / completed=medium / upcoming=regular; **todo connector `bg-surface-l2`
  (gray[50])** per Figma. Footer buttons: Next `40px`/`rounded-[10px]`/`text-subtitle2`, Submit
  `48px`/`rounded-xl`/`text-subtitle1`, Back `bg-neutral-muted-rest` + `text-neutral-muted`;
  primary `bg-accent-emphasis-rest` (`#FB7429`). **Text-only labels — no icons** (Figma has no
  arrow/chevron on the footer buttons; an earlier chevron was removed as invented).
- **Shell discrepancies (measured value → resolution, per §1.3/§4 — no silent rounding):**
  (1) **stepper label 13px** → **`text-[13px] leading-[normal]`** — exact arbitrary value. _(Corrected
  in the 2026-07-10 Dev Mode re-audit; the earlier `text-md`/14px was a silent round-up, and
  `leading-[normal]` matches Figma's CSS `line-height: normal` — **not** Tailwind's `leading-normal`,
  which is 1.5.)_ (2) **Figma font-weights 680/600/500/400** → nearest token weights **630/610/570/485**
  (`font-bold`/`semibold`/`medium`/`regular`); only 610 matches exactly. (3) **button radius 10px**
  → `rounded-[10px]` (arbitrary; scale jumps 8→12), Submit's 12px = `rounded-xl`. (4) **native
  `<button>` for footer/stepper controls** (not `QBtn`) for exact height/radius/padding fidelity;
  `QBtn`'s min-height/padding fight the measured `40/48px`. Interactive states use the
  `-rest/-hover/-active` token triples. (5) **Header logo glyph** — **resolved:** the mark is the Figma
  **"N Emblem — White"** component (node `1116:1005`, 3 white vectors) inlined as an SVG
  (viewBox `500×250.408`, rendered 28×14, `currentColor` = white via `text-inverse`). The earlier
  Quasar `event` calendar icon was an **invented glyph** and is removed. (6) **Responsive** not in
  Figma (fixed 1440) — desktop insets shipped; responsive is the Phase 4 task.

- **Dev Mode re-audit (2026-07-10) — shell re-verified against the official Dev Mode MCP** (the
  earlier shell fidelity used the removed `figma-mcp-free` server; D18 switched to the local Dev Mode
  server, so the shell was re-measured element-by-element and diffed vs. the code). Corrections landed
  (all mapped to tokens, verified in-browser via `getComputedStyle` @ 1440px):
  - **Completed-step check** = Figma's own 2px round-cap/round-join stroked glyph (path
    `M9 16.3667L13.9 21.5L23 10.5`, 32-viewBox), inlined as SVG — replaces the Material `q-icon`
    check (a different, filled glyph). Its co-located spec test now asserts the check **`svg`**.
  - **Connector line radius** `rounded-full` → **`rounded-[1px]`** (Figma line rect `rx=1`).
  - **Action-bar buttons** are hug-content with nested outer+inner padding → net **`px-4`** (md
    Next/Back) / **`px-5`** (lg Submit), plus **`min-w-[72px]`** (md) / **`min-w-[88px]`** (Submit).
    The prior `px-2`/`px-3` under-padded by ~8px/side (buttons rendered ~16px too narrow).
  - **Submit label** `text-subtitle1` (16/20) → **`text-lg font-semibold`** (16/24/610) = Figma
    `lg-label` (its 24px line-height, not subtitle1's 20px).
  - **Step-1 Next copy** "Next: Sessions" → **"Next: Session Selection"** (verbatim). Step-2
    "Next: Add-ons", Step-3 "Next: Review", "Submit Registration", and the four stepper labels
    ("Attendee Info / Sessions / Add-ons / Review") already matched.
  - **Phantom 3px band borders (visual bug fixed):** `border-solid` sets a style on **all four**
    sides, but the project ships no Tailwind `border-width:0` reset, so the unset sides fell back to
    the CSS default `medium` (3px) and rendered faint borders on the top/left/right of the header,
    stepper band, and footer. Added `border-x-0`/`border-t-0`/`border-b-0` so each band shows only
    its single 1px `divider-default`. (Same missing-reset root cause behind the earlier
    "border needs explicit `border-solid`" gotcha.)
- **Step 1 — Attendee Info (frame `1069:968`) — measured → token (verified in-browser via
  `getComputedStyle` @ 1440px):** the content begins directly with the ticket section — **no
  page/step title** (the shell no longer renders one for Step 1). "Select Ticket Type" =
  `text-subtitle1` (16/20/610); "Attendee Information" = `text-h3` (24/28/630). Field labels
  `text-sm font-medium` (12/16/570); inputs `h-11` (44px) `px-3 py-2.5`, 1px `border-neutral-muted`,
  `rounded-md` (6px), `bg-surface-l0`, value/placeholder `text-lg font-regular` (16/24),
  `placeholder:text-neutral-quiet`. Cards `p-5`/`rounded-md`/`bg-surface-l1`/`gap-3`; name+price
  `text-subtitle1`; description + perks `text-sm font-regular text-neutral-muted`; perk-row gap
  12px, icon→text gap 8px. Layout: ticket row `grid-cols-3 gap-4`; section gaps 32/16/32; form rows
  `gap-5` (20) × cols `gap-6` (24). Card = **288px exactly**, pixel-stable across all selections (D20).
  - **Discrepancies (no exact token — recorded, not silently rounded):** (1) perk icon = Figma's
    FontAwesome-6 solid **`circle-check`** (node `1089:985`), inlined as an exact SVG (viewBox
    `0 0 16 16`, `fill=currentColor`); its Figma fill is **black with no bound colour variable** →
    mapped to `text-neutral` (nearest), explicitly **not** teal/green. (2) "✓ Selected" badge type is
    **11px/14** (`body/xs`) — no token → arbitrary `text-[11px] leading-[14px] font-medium`; the ✓ is a
    literal U+2713 glyph in the text (not an icon); nested 5+4 / 3px padding → `px-[9px] py-[3px]`. (3)
    card dual drop-shadow has no token → arbitrary two-layer `shadow-[…]`. (4) the card's visible edge
    is an **inset box-shadow ring** (D20), not a border, so it contributes 0px to the 288.
  - **Full Name / Email placeholders** ("Enter your full name" / "…email address") are not shown in
    the frame (it shows sample filled values) — chosen to match the other fields' "Enter your …"
    pattern (judgment call).
- **Step 2 — Session Selection (frame `1072:912`, width 1440) — measured → token (Dev Mode MCP,
  geometry from node metadata):** content is a 1200px column (shell `px-30`); `gap-6` (24px) between
  title → day tabs → counter → grid; title at content-y 40 (= shell `py-10`). **Title** "Select
  Sessions" `text-h3` (24/28/630), owned by `StepSessions` (shell `h1` stays sr-only, D21-style).
  **Day tabs (D23):** container `inline-flex gap-1 rounded-[10px] bg-surface-l2 p-1`; tab
  `h-8 rounded-lg px-5 py-2 text-[13px] leading-[normal]`; active `bg-brand-emphasis-rest` (#264D4F)
  - `text-inverse` + semibold, inactive transparent + `text-neutral-muted` + medium. **Counter**
    "{n} session(s) selected" `text-sm font-medium text-neutral-muted`. **Grid** `grid-cols-2 gap-4`;
    card **592×162** (`min-h-[162px]`), `p-4`, `rounded-md`, uniform `gap-2` (8px) between its six
    children (top row → title → speaker → time → capacity bar → spots) — content fills 162 exactly.
    Card edge = **inset box-shadow ring** (D20 pattern) 1px `border-neutral-muted` / selected 2px
    `border-brand-emphasis`, + the same two-layer drop shadow as the Step 1 cards; selected bg
    `bg-brand-subtle-rest` (#EEF6F7). **Checkbox** 16×16 `rounded-[2px]`, unchecked ring 1px
    `border-neutral-emphasis` (#5C6970) on `bg-surface-l0`, checked `bg-brand-emphasis-rest` + the
    inlined Figma check SVG (viewBox `0 0 10 7`) in `text-inverse`. Text: title `text-subtitle1`
    (16/20/610) `text-neutral`; speaker `text-sm font-regular text-neutral-muted`; time
    `text-[11px] leading-[14px] font-regular text-neutral-quiet` (wall-clock, D4). **Track badges**
    `rounded-full px-[5px] py-[3px] text-[11px] leading-[14px] font-medium uppercase`: `main`
    `bg-neutral-subtle-rest` / `text-neutral-muted`, `frontend` & `devops` `bg-accent-muted-rest` /
    `text-accent-emphasis`, `backend` `bg-info-muted-rest` / `text-info-emphasis`. **Capacity bar**
    `h-[6px] rounded-[3px] bg-surface-l2` track + fill (width = `registered / capacity`), toned per
    D25: low `bg-brand-emphasis-rest`, medium `bg-warning-bold-rest`, high `bg-accent-bold-rest`, full
    `bg-danger-emphasis-rest`; spots label toned `text-brand-emphasis` / `text-warning` /
    `text-accent-emphasis` / `text-danger-emphasis`. **Full/disabled** (`s2`, `s9`, D24): `bg-surface-l2`,
    title/speaker/time → `text-neutral-disabled`, no checkbox, native `:disabled` (badge + bar keep
    their color).
  * **Discrepancies (no exact token — recorded, not silently rounded):** (1) **11px/14 type** (time,
    spots, badge) → arbitrary `text-[11px] leading-[14px]` (nearest token `text-sm` is 12/16). (2)
    **card drop shadow** (two-layer rgba) → arbitrary `shadow-[…]`, no shadow token — as with the
    Step 1 cards. (3) radii **3px / 2px / 10px** → `rounded-[3px]` / `rounded-[2px]` / `rounded-[10px]`
    (scale has no 2/3/10; tab uses `rounded-lg` = 8, exact). (4) **track `main` text** frame = gray[700]
    #5C6970 → **`text-neutral-muted`** (rgba(0,0,0,0.6)), nearest semantic (no gray[700] _text_ token) —
    recorded 1-shade approximation. (5) **high-fill spots label** frame = orange[700] #A13B02 →
    **`text-accent-emphasis`** (orange[600] #C94A03); **low-fill label** frame = teal[700] #264D4F →
    **`text-brand-emphasis`** (teal[800] #1E3C3E) — nearest semantic text tokens. (6) **Figma
    variable-name vs. our-token mismatch:** the frame's `bg/brand/muted/rest` = #EEF6F7 maps by
    **measured hex** to **our** `bg-brand-subtle-rest` (our `bg-brand-muted-rest` is #CBE5E6) — matched
    by value, not by the Figma variable's label. (7) **fill-tone thresholds** (D25) are an inferred
    band mapping, not a discrete Figma token.
- **Step 3 — Add-ons (frames `1073:899` = Workshops-tab state, `1149:565` = Merchandise-tab state,
  width 1440) — measured → token (Dev Mode MCP, cross-verified by two independent extractors):**
  content is the shell `px-30` band split two-column: **Add-ons List** (788px, left) + **Order
  Summary** sidebar (380px, right, `x=940`), 32px gap; both at content-y 40 (`py-10`). **Title**
  "Select Add-ons" `text-h3` (24/28), owned by `StepAddons` (shell `h1` stays sr-only). **Category
  tabs (D27):** identical control to Step 2's day tabs — container `inline-flex gap-1 rounded-[10px]
bg-surface-l2 p-1`, tab `h-8 rounded-lg px-5 py-2 text-[13px] leading-[normal]`, active
  `bg-brand-emphasis-rest text-inverse` semibold / inactive transparent `text-neutral-muted` medium;
  order **Workshops · Meal Packages · Merchandise**. **Workshop card (D28, `1073:935`/`1073:942`):**
  `w-full p-4 rounded-md gap-2`, inset box-shadow ring (rest 1px `border-neutral-muted` / selected
  2px `border-brand-emphasis`) + the shared two-layer drop shadow; selected bg `bg-brand-subtle-rest`.
  Header name `text-subtitle1 text-neutral` + price `text-subtitle1 text-brand-emphasis`; description
  `text-sm font-regular text-neutral-muted`; time+date `text-[11px] leading-[14px] font-regular
text-neutral-quiet`; capacity "{n} spots remaining" same type, plain (no bar). Full = white card +
  "Sold Out" `text-[11px] leading-[14px] font-semibold text-neutral-quiet`. **Order Summary (D29,
  `1149:626`):** `bg-surface-l1 p-6 rounded-md` 1px `border-neutral-muted`; title `text-subtitle1`;
  rows `text-sm font-regular text-neutral-muted` "{name} × {qty}" + right price; discount line
  `text-brand-emphasis`; `divider-muted` 1px rule; Total `text-sm font-medium text-neutral`.
  **Merch card (D30/D32, `1172:588/609/640`) — shipped in PR B, verified in-browser @1440px via
  `getComputedStyle`:** static `role=group` container `w-full flex-col items-start gap-2 p-4
rounded-md` (6px), inset ring + shared two-layer drop shadow (rest 1px `border-neutral-muted` /
  **added (qty≥1) 1px `border-brand-emphasis`** — 1px, not the family's 2px) + `bg-brand-subtle-rest`
  (#EEF6F7) when added. Header name **+ price both `text-subtitle1 text-neutral`** (neutral, not teal);
  **price shows no cents** (`${price}` → "$35"). Description `text-sm font-regular text-neutral-muted`.
  Controls row `flex items-center gap-4`: optional **Size `<select>`** (`appearance-none` styled box,
  `px-3 py-1.5 rounded-[6px]` 1px `border-neutral-muted`, value `text-sm font-medium text-neutral` /
  "Select" placeholder `text-neutral-quiet`, ▾ chevron `text-[10px]`) + **Qty stepper** (−/count/+, 28px
  `size-7 bg-surface-l2 rounded-[6px]` keys with 12×2 / 12×12 SVG glyphs, count `text-md font-semibold
leading-[14px]`, "max N" `text-[10px] text-neutral-quiet`). **Added footer** "✓ Added to order"
  `text-[11px] font-semibold text-success`. **Shipping banner (D30/D32, `1220:2186`)** sits **above** the
  card list: `flex items-start gap-3 p-4 rounded-lg` (8px) 1px `border-info-opacity` `bg-info-subtle-rest`,
  `circle-info` SVG (exact Figma path, node `9338:42922`) `size-5 text-info`, bold "Shipping Information"
  `text-subtitle2 text-neutral` + verbatim README body `text-md font-regular text-neutral`.
  - **Discrepancies (no exact token — recorded, not silently rounded):** (1) **13px tab type** →
    `text-[13px] leading-[normal]` (as Step 2). (2) **11px/10px type** (time, capacity, "Sold Out",
    "✓ Added", "max N") → arbitrary `text-[11px] leading-[14px]` / `text-[10px]` (nearest token
    `text-sm` = 12/16). (3) **radii 10px/8px** → `rounded-[10px]` / `rounded-lg`; cards `rounded-md`
    (6px). (4) **card fill #EEF6F7** — Figma variable labels it `brand/muted/rest` but the measured
    hex maps to **our `bg-brand-subtle-rest`** (matched by value, as in Step 2). (5) **order-summary
    row sizes** in the mock are inconsistent (12/13/11px) → normalized to `text-sm` (D29). (6) **two-
    layer card drop shadow** → arbitrary `shadow-[…]`, reusing the Step 1/2 literal. (7) **workshop
    price + discount teal** — the frame measures teal[700] #264D4F but `text-brand-emphasis` renders
    teal[800] #1E3C3E (confirmed in-browser via `getComputedStyle`); it is the nearest semantic _text_
    token — the **same** 1-shade approximation already recorded for Step 2's low-fill label, applied
    consistently.
- **Step 4 — Review & Submit (frame `1074:897`, width 1440) — measured → token (Dev Mode MCP, two
  independent extractions reconciled; D35):** content is the shell `px-30` band, **single column**
  (no sidebar). `StepReview` renders a `flex flex-col gap-6` (24px) column: visible title
  **"Review Your Registration"** `text-h3` (24/28, owned by `StepReview` as `<h2>`; shell `<h1>` now
  sr-only on all steps) → four cards. **Every card** = `bg-surface-l1`, 1px `border-neutral-muted`
  `border-solid`, `rounded-md` (6px), `p-5` (20px); the three **summary cards** are `flex-col gap-3`
  (12px), the **Pricing card** `flex-col gap-2` (8px). **Card heading** `text-subtitle1 text-neutral`
  (16/20/610 — `text-subtitle1` already bakes `font-semibold`, so no extra weight class). **Header
  row** (summary cards) `flex items-center justify-between`; the **Edit link** is a `<button>` styled
  as a link — text "Edit → Step {1,2,3}" (U+2192 arrow, one space each side), `text-sm font-semibold`
  `underline` `text-brand` (see discrepancy 2). **Summary rows** `flex w-full items-start justify-between
gap-4`, label `text-sm font-regular text-neutral-muted` (left) + value `text-sm font-regular
text-neutral text-right` (right). Attendee rows: Name / Email / Phone / Company / Job Title / Ticket
  Type (value `{ticket} ($299)` — no cents) + conditional Shipping Address (D35g); empty value → "—".
  Sessions rows: left `formatDateTime(start)` "Nov 15, 9:00 AM" (start-only, wall-clock D4) + right
  title. Add-ons rows: left category "Workshop/Meal/Merchandise" + right `{name} ($price)` (+ merch
  `, {size} × {qty}`, D35e). Empty sessions/add-ons → muted "No … selected." **Pricing card** (reuses
  `useOrderSummary` + `formatCurrency`, D26): heading "Pricing Summary" `text-subtitle1`; line rows
  `flex justify-between text-sm font-regular text-neutral-muted` (label **and** amount muted) with
  `formatCurrency` (cents) — ticket "{name} Ticket", add-ons `{name}` (+ `× {qty}` only when qty>1,
  D35f); discount row (only when `workshopDiscount > 0`) "Workshop discount (VIP 10%)" / "-$14.90"
  `text-[11px] leading-[14px] text-brand-emphasis`; `divider-muted` rule as
  `<div class="h-px w-full bg-[var(--divider-muted)]" />` (reused from `OrderSummaryPanel`); Grand
  Total row "Grand Total" / value `text-sm font-medium text-neutral`. **No aggregate Subtotal row**
  (D35b). Footer (Back + "Submit Registration") is shell-owned — `StepReview` renders no footer; the
  submit handler is a later PR (D34).
  - **Discrepancies (no exact token / label-vs-hex — recorded, not silently rounded):** (1) **discount
    row 11px/14** → arbitrary `text-[11px] leading-[14px]` (smallest token `text-sm` = 12/16;
    intentionally 1px smaller than Step 3's `text-sm` discount). (2) **Edit-link `#3a7679`** (teal[500]
    = `--bg-brand-emphasis-active`) has **no semantic _text_ token** → nearest is **`text-brand`**
    (#2e5e60), a recorded 1-shade approximation; the extractors' first guess (`text-brand` == #3a7679)
    was wrong — `--text-brand-default` is #2e5e60, verified in `src/css/colors.scss` and to be
    re-confirmed in-browser via `getComputedStyle`. Figma var mislabeled
    `components/button/primary-link/text/rest`. (3) **no-cents parenthetical prices** in the summary
    cards (`($299)`, `($149)`) vs `formatCurrency` (cents) in the Pricing card — a deliberate
    formatting split, matching the frame and the Step-1 ticket-card convention.
- **Step 4 — error state (frame `1076:936` "Review – Attendee (Error)", D36) — measured → token
  (Dev Mode `get_variable_defs`):** a section with any submit-time error renders its card border
  **`border-danger-emphasis`** (`#c71a1a`, 1px solid, replacing `border-neutral-muted`) and its
  heading **`text-danger`** (`#c71a1a`, replacing `text-neutral`); a failing field row shows its
  value as `text-sm font-regular text-danger` **"— (required)"** (empty) / **"— (required for
  merchandise)"** (empty shipping). Card bg/radius/padding are unchanged (`bg-surface-l1`, 6px,
  `p-5`) and valid rows keep `text-neutral-muted`/`text-neutral`; the Edit link stays `text-brand`.
  `FormField`'s existing error styling (`border-danger-emphasis` input + `text-sm text-danger`
  message) already matches these tokens. No new discrepancies (all values map exactly).
- **Step 4 — full error state (frame `1076:904` "Validation Error State", D37) — measured → token
  (Dev Mode `get_metadata` + `get_variable_defs` + a subagent `get_design_context` pass):** parent of
  `1076:936`; adds two affordances D36 missed. **Stepper errored step** (`1101:1071`): 32px circle
  **`bg-danger-emphasis-rest`** (#c71a1a) `rounded-full` with a white **"!" glyph** — inlined SVG,
  viewBox `0 0 32 32`, two `currentColor` rects (stem `M15 10H17V18H15V10Z`, dot `M15 20H17V22H15V20Z`)
  — and a `text-[13px] leading-[normal] font-semibold text-danger` label. **Error banner**
  (`1076:931`, x=120/shell band, w=1200): `bg-danger-muted-rest` (#fce4e4) + 1px `border-danger-muted`
  (#f6b7b7) + `rounded-md` (6px) + `p-4` + `flex-col gap-2`; heading `text-sm font-medium text-danger`
  (12/16/570) "Please fix the following errors before submitting"; items `text-sm font-regular
text-danger` (12/16/485), each a literal "• Step {N}: {msg}" (bullet is text, not a marker).
  **Disabled Submit** (`1083:2506`): the enabled `#fb7429`/`bg-accent-emphasis-rest` button at **50%
  opacity** (not a distinct disabled colour), `disabled:cursor-not-allowed`. **Reconciliation
  (verified in-browser):** Quasar's global `visibility.sass` sets `[disabled] { opacity: .6
!important }`, which overrode a plain `disabled:opacity-50`; matched the frame's 50% with
  **`disabled:!opacity-50`** (UnoCSS important → higher specificity + `!important` beats the
  framework global). All hexes map exactly (the only new discrepancy is this documented Quasar
  opacity override; the 13px label + rounded-md=6px were already recorded).
- **Figma frames:** Step 1 `1069:968` · Step 2 `1072:912` · Step 3 `1073:899` (Workshops) &
  `1149:565` (Merchandise) · Step 4 `1074:897` · **Success State `1075:903`** · review sub-frames
  incl. `Review – Attendee (Error)` `1076:936` and the full **`Validation Error State` `1076:904`**
  (stepper error + error banner + disabled submit, D37) · **`Shipping Address — States Reference`
  `1203:587`** (FormField optional/required/error + focus, D38/D39). _No Meal-Packages-tab frame and
  no workshop-conflict frame exist — see D31 spec-gap fills._
- **Placeholder-copy discrepancy (recorded):** the Success frame shows "WebDev Summit 2025 /
  TechConf 2025 / John / john@example.com" while the mock event is "WebDev Summit 2028". Event name,
  attendee name, and email are rendered **dynamically from state**; the "2025/TechConf" strings are
  Figma placeholders, not literal copy. The confirmation number is generated at runtime.
- **Plugin gotcha:** `quasar.config.js` `framework.plugins` is currently `[]`. If Notify/Dialog are
  used for affordances they **must** be registered there or they silently no-op.
- **`ShippingBanner` icon-on-top bug → `flex-nowrap` (frame `1220:2186`).** The banner (icon +
  title/body column) rendered with the **icon stacked above** the text, not to its left: Quasar's
  core `.flex` rule forces `flex-wrap: wrap` (the [[quasar-flex-ua-defaults-layout]] gotcha), so the
  wide body paragraph wrapped the whole column below the icon. Fixed by adding **`flex-nowrap`** to
  the row (+ `min-w-0` on the column so the paragraph wraps internally). Verified in-browser: the
  container is now `flex-wrap: nowrap`, icon and content share the top edge, icon left of content —
  matching `1220:2186`.
- **Font-weight verification (user-requested check; no code change).** The input label
  (`FormField`, `text-sm font-medium`) and the stepper labels (`WizardStepper`: current/errored
  `font-semibold`, completed `font-medium`, upcoming `font-regular`) were re-checked against Figma.
  Every element maps to the **correct weight tier**; the only divergences are inherent token
  quantization — Figma's `body/sm/medium` label is weight **550** and the stepper uses **unbound raw
  Inter styles** (600 / 500 / 400), while the design system exposes only `485/570/610/630`. The
  chosen tokens (`font-medium` 570, `font-semibold` 610, `font-regular` 485) are the nearest and
  correct; no closer token exists, so nothing changed.

---

## 5. Acceptance criteria → test map

Legend: **PF** = pure-function Vitest (no mount) · **SFC** = component test (`@vue/test-utils` +
`installQuasarPlugin()`) · **VIS** = visual/manual via `agent-browser` on `:9001` vs Figma.

### 5.1 Step 1 — Attendee Info

- **AC-1.1** Given Step 1 loads, When rendered, Then Full Name, Email, Phone, Company, Job Title
  inputs and an **optional** Shipping Address input are shown.
- **AC-1.2** Given three ticket cards (General $299 / VIP $599 / Student $99) from `event`, When one
  is clicked, Then exactly one is selected (single-select).
- **AC-1.3** Given the VIP card, When rendered, Then its perks include "10% off workshops"; General
  and Student do not.
- **AC-1.4** Given prices 299/599/99, When cards render, Then each shows `$299.00` / `$599.00` /
  `$99.00`.
- **AC-1.5** Given nothing touched, When Step 1 displays, Then **no** inline validation errors show.
- **AC-1.6** Given merch is selected in Step 3, When returning to Step 1, Then Shipping Address is
  required and can show an error indicator (Step 1 error caused by a Step 3 condition).
- **AC-1.7** Given all merch removed, When state recomputes, Then Shipping Address reverts to
  optional **live** (non-sticky).

| AC  | Test                                                                                             | Kind     |
| --- | ------------------------------------------------------------------------------------------------ | -------- |
| 1.1 | `StepAttendee.spec.js` → "renders attendee fields + optional shipping"                           | SFC      |
| 1.2 | `StepAttendee.spec.js` → "ticket selection is single-select"                                     | SFC      |
| 1.3 | `StepAttendee.spec.js` → "VIP card shows 10% off workshops perk"                                 | SFC      |
| 1.4 | `pricing.test.js` → "formatCurrency 299/599/99 → \$299.00/\$599.00/\$99.00"                      | PF       |
| 1.5 | `StepAttendee.spec.js` → "no inline errors before first submit"                                  | SFC      |
| 1.6 | `validation.test.js` → "shipping required when merch present" + `StepAttendee.spec.js` indicator | PF + SFC |
| 1.7 | `validation.test.js` → "shipping optional when no merch (non-sticky)"                            | PF       |

### 5.2 Step 2 — Session Selection

- **AC-2.1** Given 12 sessions, When rendered, Then they group into exactly two day headings —
  Nov 15 (s1–s6) and Nov 16 (s7–s12) — using a **wall-clock** day key.
- **AC-2.2** Given each session, When a card renders, Then it shows title, speaker, time range,
  track badge, and remaining spots.
- **AC-2.3** Given `s2` (120/120) and `s9` (90/90), When rendered, Then they are the **only** two
  shown as Full/disabled and are not selectable.
- **AC-2.4** Given registered/capacity, When computed, Then remaining spots: `s1`=13, `s3`=22,
  `s11`=51 (`s2`=0, `s9`=0).
- **AC-2.5** Given a session time, When rendered, Then the range is **wall-clock** (e.g. `s6`
  "3:30 PM – 5:00 PM" for 15:30–17:00Z), not shifted by viewer offset.
- **AC-2.6** Given free selection, When co-selecting `s4`+`s5` (or `s11`+`s12`), Then Step 2 imposes
  **no** conflict gate (deferred to Step 4).
- **AC-2.7** Given ticket type, When selecting sessions, Then session access is **not** gated by
  ticket (all tickets get all sessions).

| AC  | Test                                                                            | Kind |
| --- | ------------------------------------------------------------------------------- | ---- |
| 2.1 | `datetime.test.js` → "dayGroupKey groups s1–s6=2028-11-15, s7–s12=2028-11-16"   | PF   |
| 2.2 | `StepSessions.spec.js` → "card shows title/speaker/time/track/spots"            | SFC  |
| 2.3 | `capacity.test.js` → "isFull true only for s2 & s9"                             | PF   |
| 2.4 | `capacity.test.js` → "remainingSpots s1=13, s3=22, s11=51"                      | PF   |
| 2.5 | `datetime.test.js` → "formatTimeRange(s6)='3:30 PM – 5:00 PM' (no local shift)" | PF   |
| 2.6 | `StepSessions.spec.js` → "co-selecting s4 and s5 allowed"                       | SFC  |
| 2.7 | `StepSessions.spec.js` → "no ticket-based session gating"                       | SFC  |

### 5.3 Step 3 — Add-ons

- **AC-3.1** Given the addons, When rendered, Then three sections in order: **Workshops** (ws1, ws2),
  **Meal Packages** (meal1, meal2), **Merchandise** (merch1–4).
- **AC-3.2** Given `ws2` (25/25), When rendered, Then it is Full/unavailable regardless of session
  selection.
- **AC-3.3** Given `s11` **or** `s12` selected in Step 2, When Step 3 renders, Then `ws1` is
  unavailable due to a session conflict; the message names the conflicting session.
- **AC-3.4** Given only `s10` selected (touches `ws1` at 14:00Z), When Step 3 renders, Then `ws1`
  stays available (touch ≠ conflict).
- **AC-3.5** Given no conflicting session, When `ws1` (22/30) renders, Then it is selectable and
  shows 8 remaining.
- **AC-3.6** Given `merch1` (sizes S–XXL, max 3 **total**), When added, Then a size selector + a
  quantity control capped at total 3 are shown.
- **AC-3.7** Given `merch4` (sizes 13/15/16", max 1), When added, Then a size selector is shown and
  quantity is capped at 1.
- **AC-3.8** Given `merch2` (max 5) / `merch3` (max 2), no sizes, When added, Then a quantity control
  (no size selector) capped at 5 / 2.
- **AC-3.9** Given any merch added, When rendered, Then the shipping banner shows the **exact** README
  copy.
- **AC-3.10** Given no merch, When rendered, Then no banner.
- **AC-3.11** Given selections change, When the running total renders, Then it updates live (ticket +
  each add-on line − VIP workshop discount = total), currency-formatted per **D42** (whole dollars
  show no cents, e.g. `$149`; genuinely fractional amounts — the VIP discount `-$14.90`, discounted
  totals `$733.10` — keep 2-decimal cents).
- **AC-3.12** Given the Meal Packages tab (no Figma frame — D31a/D41), When rendered, Then both meal
  packages (meal1, meal2) show in mock order with name, description, and price, styled by reusing the
  `WorkshopCard` toggle treatment.
- **AC-3.13** Given a meal card, When clicked, Then it toggles in/out of `selectedMealIds` (independent
  multi-select — both packages can be added at once), reflects `aria-checked`, and the running total
  updates live.

| AC   | Test                                                                                                  | Kind     |
| ---- | ----------------------------------------------------------------------------------------------------- | -------- |
| 3.1  | `StepAddons.spec.js` → "groups workshop/meal/merch in order"                                          | SFC      |
| 3.2  | `capacity.test.js` → "isFull(ws2) true, isFull(ws1) false"                                            | PF       |
| 3.3  | `conflicts.test.js` → "ws1 conflicts with s11 and s12; message names session"                         | PF + SFC |
| 3.4  | `conflicts.test.js` → "ws1 not conflicting with s10 (touch 14:00Z)"                                   | PF       |
| 3.5  | `capacity.test.js` → "remainingSpots(ws1)=8"                                                          | PF       |
| 3.6  | `StepAddons.spec.js` → "merch1 size selector + qty capped total 3"                                    | SFC      |
| 3.7  | `StepAddons.spec.js` → "merch4 sizes + qty capped 1"                                                  | SFC      |
| 3.8  | `StepAddons.spec.js` → "merch2/merch3 qty-only capped 5/2"                                            | SFC      |
| 3.9  | `StepAddons.spec.js` → "shipping banner exact text when merch added"                                  | SFC      |
| 3.10 | `StepAddons.spec.js` → "no banner when no merch"                                                      | SFC      |
| 3.11 | `useOrderSummary.test.js` + `StepAddons.spec.js` → "running total recomputes live"                    | PF + SFC |
| 3.12 | `MealCard.spec.js` + `StepAddons.spec.js` → "lists both meal packages in order …"                     | SFC      |
| 3.13 | `StepAddons.spec.js` → "toggles a meal on/off" + "both together"; `MealCard.spec.js` → "emits toggle" | SFC      |

### 5.4 Step 4 — Review & Submit

- **AC-4.1** Given Steps 1–3, When Step 4 renders, Then a readable grouped summary (attendee, ticket,
  sessions, add-ons) is shown.
- **AC-4.2** Given selections, When the breakdown renders, Then every line (its per-line subtotal) +
  the VIP workshop discount + a grand total, currency-formatted per **D42** (whole dollars show no
  cents; the fractional discount/total keep 2-decimal cents). Per Figma `1074:897` there is **no
  aggregate Subtotal row** (D35b) — README's "subtotals" is read as the per-line amounts.
- **AC-4.3** Given each section, When rendered, Then an **Edit** control jumps to the matching step;
  state is preserved.
- **AC-4.4** Given Submit, When validation runs, Then **all** steps validate at once (unified).
- **AC-4.5** Given failures, When rendered, Then each failing step is indicated and jumpable;
  session↔workshop conflicts flag **Step 3**, missing-shipping-when-merch flags **Step 1**.
- **AC-4.6** Given a **stale** conflict (ws1 selected, then s11 added via back-nav), When Submit runs,
  Then ws1 is **kept** and reported as a submit-time conflict (not auto-removed).
- **AC-4.7** Given all valid, When Submit succeeds, Then the terminal success screen renders (D15).
- **AC-4.8** Given async submit in-flight, When pending, Then a pending state shows and re-submits are
  prevented.
- **AC-4.9** Given two selected sessions that overlap (`s4`+`s5` / `s11`+`s12`), When Submit runs, Then
  the conflict is reported and attributed to **Step 2** (README §2.2 — deferred to submit, flags the
  owning step; complements AC-2.6/D33's free-select, D34c). `errorStepKeys` orders steps in wizard
  order (`sessions` before `addons`).

| AC  | Test                                                                                            | Kind     |
| --- | ----------------------------------------------------------------------------------------------- | -------- |
| 4.1 | `StepReview.spec.js` → "renders full grouped summary"                                           | SFC      |
| 4.2 | `useOrderSummary.test.js` → "itemized lines + grand total"                                      | PF + SFC |
| 4.3 | `StepReview.spec.js` → "Edit buttons navigate to steps 1–3, state preserved"                    | SFC      |
| 4.4 | `validation.test.js` → "validateAll aggregates across steps"                                    | PF       |
| 4.5 | `validation.test.js` → "conflict→step3, shipping→step1" + `StepReview.spec.js` indicators       | PF + SFC |
| 4.6 | `validation.test.js` → "stale ws1 conflict kept + reported at submit"                           | PF       |
| 4.7 | `SuccessScreen.spec.js` + `IndexPage.spec.js` → "shows the success screen after a valid submit" | SFC      |
| 4.8 | `IndexPage.spec.js` → "prevents a double-submit while a submit is in flight"                    | SFC      |
| 4.9 | `validation.test.js` → "session↔session conflict flags Step 2; wizard-ordered steps"            | PF       |

### 5.5 Cross-cutting — Navigation / State

- **AC-N-1** Given the stepper, When navigating, Then movement is **free/non-linear** (any step
  reachable without passing validation).
- **AC-N-2** Given data in Steps 1 & 3, When navigating forward then back, Then all state survives.
- **AC-N-3** Given no Pinia, When inspected, Then a single `useRegistration` instance is
  provided at root and injected by steps.

| AC  | Test                                                                   | Kind |
| --- | ---------------------------------------------------------------------- | ---- |
| N-1 | `Wizard.spec.js` → "stepper allows free navigation"                    | SFC  |
| N-2 | `useRegistration.test.js` → "state persists across step changes"       | PF   |
| N-3 | `useRegistration.test.js` → "single reactive store via provide/inject" | PF   |

### 5.6 Cross-cutting — Time & Timezone

- **AC-T-1** Given `Z` timestamps that mean wall-clock, When formatted, Then times render wall-clock;
  `ws2` (18:30Z) stays on **Nov 15**, not pushed to Nov 16 by a +8 offset.
- **AC-T-2** Given the day-group key, When computed for all 12 sessions, Then keys use the wall-clock
  date only (s1–s6 → Nov 15, s7–s12 → Nov 16).
- **AC-T-3** Given a range, When formatted, Then "h:mm AM/PM – h:mm AM/PM" wall-clock (e.g. `s10`
  "1:00 PM – 2:00 PM", `ws1` "2:00 PM – 5:00 PM").

| AC  | Test                                                                | Kind |
| --- | ------------------------------------------------------------------- | ---- |
| T-1 | `datetime.test.js` → "ws2 stays Nov 15 15:30–18:30, no local shift" | PF   |
| T-2 | `datetime.test.js` → "dayGroupKey wall-clock for all sessions"      | PF   |
| T-3 | `datetime.test.js` → "formatTimeRange s10 & ws1 wall-clock"         | PF   |

### 5.7 Cross-cutting — Pricing / Discount

Rate = **0.10** (derived constant, D11). Discount applies to **workshops only**.

- **AC-P-1** Given `formatCurrency`, When called, Then two decimals + separators, e.g.
  `formatCurrency(1234.5) === '$1,234.50'`.
- **AC-P-2** Given VIP + `ws1` ($149), When the summary computes, Then workshop discount = **$14.90**
  and ws1 net = **$134.10**.
- **AC-P-3** Given the discount, When computed, Then it applies **only** over selected workshops
  (`ws2` is full → never contributes).
- **AC-P-4** Given VIP, When meals/merch/ticket price, Then **no** discount (meal1 stays $45; ticket
  stays $599).
- **AC-P-5** Given General or Student + `ws1`, When computed, Then discount = $0.00, ws1 = $149.00.
- **AC-P-6** Given VIP + `ws1` then ticket switched to General (via Edit), When recomputed, Then the
  discount vanishes instantly: **$733.10** (599+149−14.90) → **$448.00** (299+149).
- **AC-P-7** Given a full cart (ticket + `ws1` $149 + `meal1` $45 + `merch1`×2 $70): General
  subtotal **$563.00** (discount $0); same cart as VIP **$848.10** (863 − 14.90).

| AC  | Test                                                                   | Kind |
| --- | ---------------------------------------------------------------------- | ---- |
| P-1 | `pricing.test.js` → "formatCurrency two-decimals + separators"         | PF   |
| P-2 | `pricing.test.js` → "workshopDiscount(VIP, ws1)=14.90; net 134.10"     | PF   |
| P-3 | `useOrderSummary.test.js` → "discount only over selected workshops"    | PF   |
| P-4 | `pricing.test.js` → "no discount on meals/merch/ticket"                | PF   |
| P-5 | `pricing.test.js` → "General/Student → discount 0"                     | PF   |
| P-6 | `useOrderSummary.test.js` → "ticket switch recomputes 733.10 → 448.00" | PF   |
| P-7 | `useOrderSummary.test.js` → "full-cart VIP 848.10 / General 563.00"    | PF   |

_Supporting primitive:_ `round2` (cents rounding that keeps P-1/P-2 exact against binary
float drift, e.g. `149 * 0.1`) is unit-tested in
`pricing.test.js → "round2 rounds binary-float drift to whole cents"`.

### 5.8 Cross-cutting — Conflict detection

- **AC-C-1** Given `intervalsOverlap`, When intervals strictly overlap, Then true; touching endpoints
  → false.
- **AC-C-2** Given `detectConflicts`, When run, Then `s4`↔`s5` and `s11`↔`s12` are live conflicts;
  `s2`↔`s3` and `s8`↔`s9` are conflict pairs but **decoyed** (`s2`,`s9` full → not co-selectable).
- **AC-C-3** Given `ws1` vs sessions, When checked, Then conflicts with `s11` & `s12`, not `s10`
  (touch at 14:00Z).
- **AC-C-4** Given `ws2` (full) overlapping `s6`, When checked, Then `ws2` is unselectable so no live
  conflict arises.
- **AC-C-5** Given a detected conflict, When surfaced, Then attributed to Step 3 and names the
  conflicting session.
- **AC-C-6** Given a non-timed add-on (meal/merch, no time slot), When conflict-checked against any
  selected session, Then it never conflicts.

| AC  | Test                                                                     | Kind |
| --- | ------------------------------------------------------------------------ | ---- |
| C-1 | `conflicts.test.js` → "intervalsOverlap strict vs touching"              | PF   |
| C-2 | `conflicts.test.js` → "flags s4/s5, s11/s12; decoys s2/s3, s8/s9"        | PF   |
| C-3 | `conflicts.test.js` → "ws1 vs s10/s11/s12"                               | PF   |
| C-4 | `conflicts.test.js` → "ws2 full: no live conflict"                       | PF   |
| C-5 | conflict **message** copy — deferred to the Step 3 conflict-UI PR (i18n) | SFC  |
| C-6 | `conflicts.test.js` → "non-timed add-ons never conflict"                 | PF   |

### 5.9 Cross-cutting — Capacity

- **AC-Cap-1** Given `isFull = registered >= capacity`, When applied to sessions, Then true only for
  `s2` and `s9`.
- **AC-Cap-2** Given add-ons, When applied, Then true only for `ws2`; meals/merch have no capacity
  (always available).
- **AC-Cap-3** Given `remainingSpots`, When computed, Then `s1`=13, `s3`=22, `s11`=51, `ws1`=8,
  `s2`=0, `s9`=0.
- **AC-Cap-4** Given a full item, When rendered, Then disabled and cannot be added to state.

| AC    | Test                                                                                  | Kind |
| ----- | ------------------------------------------------------------------------------------- | ---- |
| Cap-1 | `capacity.test.js` → "isFull sessions: only s2,s9"                                    | PF   |
| Cap-2 | `capacity.test.js` → "isFull addons: only ws2; meals/merch uncapped"                  | PF   |
| Cap-3 | `capacity.test.js` → "remainingSpots spot values"                                     | PF   |
| Cap-4 | `StepSessions.spec.js` / `StepAddons.spec.js` → "full item disabled + not selectable" | SFC  |

### 5.10 Cross-cutting — Validation

- **AC-V-1** Given required fields (name, email, phone, company, jobTitle), When empty at submit,
  Then each errors.
- **AC-V-2** Given email, When `isValidEmail` runs, Then `a@b.com` valid; `abc`, `a@`, `a@b` invalid.
- **AC-V-3** Given phone (**lenient**), When `isValidPhone` runs, Then "+1 415 555 0100",
  "(415) 555-0100", "4155550100" pass; "abc", "12" fail.
- **AC-V-4** Given shipping conditional, When any merch selected, Then required; when none, optional
  (recomputed live).
- **AC-V-5** Given "reward early, punish late", When the first submit fails, Then touched fields
  re-validate live thereafter; before the first submit, no field re-validates on input.
- **AC-V-6** Given `validateAll(state)`, When run, Then it returns a per-step error map.

| AC  | Test                                                                                                      | Kind     |
| --- | --------------------------------------------------------------------------------------------------------- | -------- |
| V-1 | `validation.test.js` → "required fields error when empty"                                                 | PF       |
| V-2 | `validation.test.js` → "isValidEmail table"                                                               | PF       |
| V-3 | `validation.test.js` → "isValidPhone lenient table"                                                       | PF       |
| V-4 | `validation.test.js` → "shipping conditional on merch"                                                    | PF       |
| V-5 | `useValidation.test.js` + `StepAttendee.spec.js` → "no live validation pre-submit; live after first fail" | PF + SFC |
| V-6 | `validation.test.js` → "validateAll returns per-step error map"                                           | PF       |

### 5.11 Cross-cutting — Submission / Success

- **AC-S-1** Given the async facade, When data is requested, Then loading states are exercisable
  (session list shows loading before resolve).
- **AC-S-2** Given a valid submit, When it resolves, Then the success screen renders with a generated
  confirmation number and personalized thank-you (name + email from state).
- **AC-S-3** Given an invalid submit, When it runs, Then no success screen; error navigation offered.
- **AC-S-4** Given pending fetch/submit, When in-flight, Then no double-submit and no partial state
  corruption.

| AC  | Test                                                                                                                                                                       | Kind     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| S-1 | `facade.test.js` → "fetchSessions/fetchAddons resolve async" + `Wizard.spec.js` loading                                                                                    | PF + SFC |
| S-2 | `facade.test.js` → confirmation-number format + echo (primitive) · `SuccessScreen.spec.js` + `IndexPage.spec.js` → "success screen w/ confirmation # + dynamic name/email" | PF + SFC |
| S-3 | `IndexPage.spec.js` → "failed submit reveals errors, never reaches the network (no success screen)"                                                                        | SFC      |
| S-4 | `IndexPage.spec.js` → "prevents a double-submit while a submit is in flight"                                                                                               | SFC      |

---

## 6. Task checklist (Phase 2–4)

Each task names the spec rule / decision it satisfies. Checked as completed with its commit.

### Phase 2 — Foundation

- [x] `feat(data)` JSDoc typedefs + mock normalizers; **async facade** (D1). Parse ISO once at the edge.
- [x] `feat(utils)` currency formatter (D5) + wall-clock date-range & day-key helpers (D4).
- [x] `feat(logic)` pure interval-overlap + conflict detection (D6) — derived from data, not the file.
      **`capacity.js` (isFull/remainingSpots) landed here too** — the conflict decoy tests need it
      to filter full sessions (s2/s9), so the two pure logic modules ship together.
- [x] `test(logic)` overlap edge cases: `s10`+`s11` touch = no conflict; `s4`+`s5`, `s11`+`s12`
      conflict; `ws1` vs `s10` (no) / `s11` (yes); one containment case (AC-C-*).
- [x] `feat(state)` `useRegistration` composable, provide/inject, survives free nav (D2).
- [x] `feat(shell)` wizard layout + free-navigation stepper (D13).
- [x] `docs(plan)` record state / timezone / stepper decisions.

### Phase 3 — Steps

- [x] `feat(attendee)` form fields, no inline validation (AC-1.1, AC-1.5); shipping optional here.
- [x] `feat(attendee)` ticket cards, prices/perks from data (AC-1.2–1.4).
- [x] `feat(sessions)` grouped-by-day (day tabs, D23), capacity states + "Sold Out" (D24), remaining
      spots + fill-tone bar (D25), track badges (AC-2.\*, D12).
- [x] `feat(addons)` grouped by category via segmented tabs in order Workshops/Meals/Merch (AC-3.1, D27). _(Tabs + order land in PR A; Meals/Merch cards fill in later PRs.)_
- [x] `feat(addons)` disable workshops conflicting with selected sessions (AC-3.3–3.5, D9, D31b) — **PR A**.
- [x] `feat(addons)` meal-package selection cards, reuse `WorkshopCard` toggle treatment (AC-3.12/3.13, D31a, D41) — **PR C**.
- [x] `feat(addons)` merch size + quantity, top-level max (AC-3.6–3.8, D16, D30, D32) — **PR B**.
- [x] `feat(addons)` shipping banner, verbatim copy (AC-3.9–3.10, D30, D32) — **PR B**.
- [x] `feat(pricing)` `useOrderSummary` computed totals + VIP workshop-only discount (D3, D11, D26, AC-P-*).
- [x] `test(pricing)` VIP discount ($14.90/$134.10), quantity totals, ticket-switch recompute (AC-P-*).
- [x] `feat(addons)` live order-summary panel (AC-3.11, D29) — **PR A**.
- [x] `feat(validation)` **pure logic** — `validation.js` predicates (`isValidEmail`/`isValidPhone`
      lenient/`isPresent`/`hasMerchSelected`) + `validateAttendee` + conflict-error helpers +
      `validateAll` per-step error map + `errorStepKeys`/`isValid`, co-located tests (D7–D10, D34;
      AC-V-1..4/6, AC-4.4–4.6, AC-1.6/1.7, AC-C-5) — **PR (pure logic first, D34)**.
- [x] `feat(review)` grouped summary + edit navigation, state preserved (AC-4.1, AC-4.3, D35) — **PR 2**.
- [x] `feat(review)` itemized pricing breakdown (AC-4.2, D35) — **PR 2**.
- [x] `feat(validation)` wire `useValidation` ("reward early, punish late", D7, AC-V-5) + submit
      gate over `validateAll` + `FormField` errors (D36) — **PR 3**. _(double-submit guard moves to
      the async-submit PR, D36h.)_
- [x] `feat(validation)` step error indicators (red Review section cards + inline field/conflict
      markers, frame `1076:936`; **stepper red "!" step + "Please fix…" error banner + disabled
      Submit**, frame `1076:904`, D37) + jump-to-step via the Edit links; Step 1 error from the Step 3
      merch condition (AC-4.5, AC-4.9, AC-1.6, D9, D36/D37) — **PR 3**.
- [x] `feat(review)` async `submitRegistration` + pending + double-submit guard + terminal success
      screen, "Back to Home" (D15, AC-4.7/4.8, AC-S-2/S-4, D36h, D40) — **PR (this change)**.
- [x] `docs(plan)` record pricing & validation decisions. _(Substance landed **inline** with each
      feature PR per `CLAUDE.md` §2 — pricing D26 (#12) / D42 (#19); validation D34 (#15) / D36–D37
      (#17) / D38–D40 (#18) — not as a standalone docs commit, so no landing ever ticked this box;
      reconciled here.)_

### Phase 4 — Fidelity & polish

- [ ] `style(fidelity)` spacing/typography/interactive states to Figma; `-rest`/`-hover`/`-active`
      pairs; disabled/error/active; zero hex. (May split into 2–3 area-scoped commits.)
- [ ] `feat(ux)` micro-interactions + loading/disabled affordances (skeletons off the facade). If
      Notify/Dialog used, register them in `quasar.config.js` `framework.plugins`.
- [ ] `feat(responsive)` adapt at `tablet 768` / `desktop 1024`.
- [ ] `feat(i18n)` extract UI copy behind `vue-i18n` `en` locale (D14).

---

## 7. Spec gaps & Figma-blocked items

Resolve each from the named Figma frame during that step's **Specify** phase; record the resolution
here. None is silently hardcoded.

| Item                                                                                  | Blocked on                                               | Note                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Track badge styles (main/frontend/backend/devops)                                     | Step 2 frame `1072:912`                                  | **Resolved (Step 2):** main→`neutral-subtle`, frontend & devops→`accent-muted`, backend→`info-muted` (§4, D23). frontend ≡ devops — the frame duplicates orange.                                                                                                                                                                                                                                                                 |
| Discount display shape (separate `−$14.90` line vs struck-through per-workshop price) | Step 3 `1149:565` / Step 4 `1074:897`                    | **Resolved (Step 3):** a **separate** order-summary line "Workshop discount (VIP 10%)" / "-$14.90" in `text-brand-emphasis` teal (frame node `1073:964`), not a struck-through per-workshop price (D29).                                                                                                                                                                                                                         |
| Merch qty + size interaction (one picker + size vs per-size rows summing to max)      | Step 3 `1149:565`                                        | **Resolved (Step 3):** **one** size dropdown + **one** total-quantity stepper (−/n/+) with a "max N" hint per card (frame `1172:588`) — confirms the `{ size, quantity }` shape (D16/D26/D30), not per-size rows.                                                                                                                                                                                                                |
| `merch4` max-1 control (qty stepper stuck at 1 vs add/remove toggle)                  | Step 3 `1149:565`                                        | **Resolved (Step 3):** same qty stepper as every merch card, `+` disabled at the `maxQuantity` (1 for merch4); "max 1" hint (frame `1172:640`, D30). AC-3.7.                                                                                                                                                                                                                                                                     |
| Remaining-spots label ("13 spots left" vs "13/500")                                   | Step 2 `1072:912`                                        | Number tested (AC-2.4). **Resolved (Step 2):** "{n} spots left"; full → "Sold Out" (frame copy vs README "full", D24).                                                                                                                                                                                                                                                                                                           |
| **Meal Packages card** design (no Figma frame exists — meals are only a tab label)    | _no frame_ — Dev Mode scan of the page found none        | **Resolved (D31a/D41):** `MealCard` reuses the `WorkshopCard` toggle treatment wholesale, minus the time/capacity/conflict rows (header name + teal price + description + selectable ring); plain multi-select into `selectedMealIds`, no full/conflict guard. Verified in-browser byte-identical to `WorkshopCard`. Reviewer-flag: teal price + cents (inherited from workshops) vs neutral/no-cents (merch) — one-line change. |
| **Workshop time-conflict / unavailable state** (not drawn in Figma)                   | _no frame_ — only available + full workshop states drawn | **Spec-gap fill (D31b):** conflicting workshop is non-selectable with a status line naming the session ("Unavailable — overlaps {session}") in `text-warning`; a **stale** conflict on an already-selected workshop keeps it (D10).                                                                                                                                                                                              |
| Success-screen dynamic content (confirmation-number format, exact copy)               | Success `1075:903`                                       | **Resolved (D40):** name (first-name)/email/tier/event rendered dynamically; 2025/TechConf are placeholders (§4); confirmation = literal "Confirmation #" + facade's `WDS-XXXXXXXX`.                                                                                                                                                                                                                                             |
| Stepper + step-error-badge visuals                                                    | Wizard shell + `Review – Attendee (Error)` `1076:936`    | Free-nav decided (D13); error-badge look from Figma.                                                                                                                                                                                                                                                                                                                                                                             |
| **UX polish — scrollbar gutter / loading skeletons / step transition** (no frames)    | _no frame_ — Phase-4 `feat(ux)`                          | **Spec-gap fill (D43):** (a) `html { scrollbar-gutter: stable }` removes the cross-step horizontal shift; (b) content-shaped `q-skeleton` loaders replace the bare spinner in Steps 1–3; (c) `<Transition mode="out-in">` opacity fade on step swap. Headless overlay scrollbars can't reproduce the shift — verified via computed `scrollbar-gutter` + no-regression.                                                           |

---

## 8. Verification & gates

**Definition of done** for any change:

1. **Gates green:** `yarn check` (ESLint + Prettier) and `yarn test:unit:ci` pass.
2. **Business logic traces to ACs:** every §5 PF/SFC test exists and passes; each maps to a criterion.
3. **Visual parity:** `agent-browser` drives the app on `:9001` and each step is compared against its
   Figma frame (§4).
4. **Manual end-to-end walks:**
   - **Killer sequence** (AC-P-6): VIP → add `ws1` → Review → Edit → switch to General → the workshop
     discount vanishes instantly (733.10 → 448.00).
   - **Stale-conflict walk** (AC-4.6): select `ws1` → back to Step 2 → add `s11` → Submit surfaces a
     kept-selection conflict naming `s11`, attributed to Step 3.
   - **Shipping cross-step** (AC-1.6/1.7): add merch → Step 1 shows shipping required → remove merch →
     requirement clears live.
5. **Constraints honored:** plain JS only; UnoCSS tokens only (no hex); README unedited; this file
   kept in sync as tasks complete.
6. **Human review passed:** the commit is on a branch, opened as a PR against `main`, its judgment
   calls surfaced per the PR template, and a human approves + merges it. The agent never
   self-approves or self-merges. It confirms approval/merge by _pulling_ state on its next turn
   (`gh pr view <n> --json state,mergedAt,reviewDecision`; `git fetch` cross-check) and ingests any
   change-requests via `gh pr view <n> --comments` / `gh api` (review comments live in GitHub's
   API, not git), then pushes fixes to the same branch. Logged in §9.

_Toolchain note:_ the repo needs Node 22.17 / yarn 4.6 while the shell defaults to Node 20 / yarn
1.22 — prefix commands with the nvm + corepack prelude before running `yarn check` / `yarn test:unit`.

---

## 9. Review log (human review gate — §2.6)

Per-PR record of the human `review` gate — one row per merged PR (a PR is the review unit,
sized to ~20 min of senior review; §2.6). "Approved/merged" is set only by a human — the
agent never self-approves.

| PR                                                                                | Theme / branch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Reviewer | Status                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- |
| [#6](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/6)   | `feat/foundation-pure-logic` — pure business-logic foundation (data facade, pricing, datetime, conflicts, capacity + tests)                                                                                                                                                                                                                                                                                                                                                                                                                     | ll298lee | **Merged** (2026-07-09) |
| [#7](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/7)   | `feat/wizard-shell-state` — wizard shell (header/stepper/content/footer) + `useRegistration` store, free-nav stepper                                                                                                                                                                                                                                                                                                                                                                                                                            | ll298lee | **Merged**              |
| [#8](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/8)   | `chore/figma-dev-mode-mcp` — switch Figma read to official Dev Mode MCP + `figma-design-to-code` skill (D18)                                                                                                                                                                                                                                                                                                                                                                                                                                    | ll298lee | **Merged**              |
| [#9](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/9)   | `fix/shell-devmode-reaudit` — shell re-verified against Dev Mode MCP: real N-emblem + stepper check SVGs, 13px labels, exact button padding/copy, phantom-border fix                                                                                                                                                                                                                                                                                                                                                                            | ll298lee | **Merged** (2026-07-10) |
| [#10](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/10) | `feat/step-1-attendee-info` — Step 1 Attendee Info: ticket cards (single-select, circle-check perks, stable-height selection) + attendee form; + code-comment policy (§1.7)                                                                                                                                                                                                                                                                                                                                                                     | ll298lee | **Merged** (2026-07-10) |
| [#11](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/11) | `feat/step-2-session-selection` — Step 2 Session Selection: day-tab switcher (D23), session cards with track badges, capacity fill-tone bar + "Sold Out" full state (D24/D25), free multi-select                                                                                                                                                                                                                                                                                                                                                | ll298lee | **Merged** (2026-07-10) |
| [#12](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/12) | `feat/step-3-order-summary` — pure `useOrderSummary` pricing engine: computed ticket/workshop/meal/merch lines, VIP workshop-only discount, subtotal/grand total + tests (D3, D11, D26; AC-P-\*, AC-4.2, AC-3.11)                                                                                                                                                                                                                                                                                                                               | ll298lee | **Merged** (2026-07-10) |
| [#13](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/13) | `feat/step-3-addons-workshops` — Step 3 UI part 1: scaffold (title, category tabs, two-column layout), `WorkshopCard` (available/selected/full/conflict), `OrderSummaryPanel` (live total + discount line) (D27–D31; AC-3.1/3.2/3.3/3.4/3.5/3.11)                                                                                                                                                                                                                                                                                               | ll298lee | **Merged** (2026-07-10) |
| [#14](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/14) | `feat/step-3-merch-banner` — Step 3 UI part 2: `MerchCard` (size dropdown + qty stepper capped at `maxQuantity`, added state) + shipping banner (verbatim README copy) (D30, D16; AC-3.6/3.7/3.8/3.9/3.10)                                                                                                                                                                                                                                                                                                                                      | ll298lee | **Merged** (2026-07-10) |
| [#15](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/15) | `feat/step-4-validation-logic` — Step 4 PR 1: pure submit-time validation logic (`validation.js` predicates + `validateAll` per-step error map) + tests; ticket-required + session/workshop-conflict attribution spec-gap fills (D34; AC-V-1..4/6, AC-4.4–4.6, AC-1.6/1.7)                                                                                                                                                                                                                                                                      | ll298lee | **Merged** (2026-07-10) |
| [#16](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/16) | `feat/step-4-review-ui` — Step 4 PR 2: Review UI — single-column grouped summary (Attendee/Sessions/Add-ons) + itemized `PricingSummaryCard` (line items, VIP discount, Grand Total, no aggregate subtotal) + per-section Edit → jump-to-step; `formatDateTime` helper; shell `<h1>` sr-only for all steps (D35; AC-4.1/4.2/4.3)                                                                                                                                                                                                                | ll298lee | **Merged** (2026-07-10) |
| [#17](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/17) | `feat/step-4-submit-validation` — Step 4 PR 3: submit-time validation wiring — `useValidation` composable (submitted-gated live errors, reward-early/punish-late) + submit gate + Review error display (red section cards + "— (required)" markers + conflict rows, frame `1076:936`) + Step-1 `FormField` errors + error navigation via Edit links; **+ D37** stepper error indicator (red "!" step) + "Please fix the following errors" banner + disabled Submit (frame `1076:904`) (D36/D37; AC-4.4/4.5/4.6/4.9, AC-V-5, AC-1.6/1.7, AC-C-5) | ll298lee | **Merged** (2026-07-10) |
| [#18](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/18) | `feat/step-4-success-screen` — Step 4 PR 4 (final): async `submitRegistration` + pending state + double-submit guard + terminal `SuccessScreen` ("Back to Home" resets to pristine Step 1), frame `1075:903` (D40; AC-4.7/4.8, AC-S-2/S-4)                                                                                                                                                                                                                                                                                                      | ll298lee | **Merged** (2026-07-10) |
| [#19](https://github.com/ll298lee/nitra-fe-event-registration-assignment/pull/19) | `feat/step-3-meal-packages` — Step 3 Meal Packages: `MealCard` reusing the `WorkshopCard` toggle treatment minus time/capacity/conflict rows (D31a/D41); + `fix(pricing)` whole-dollar prices drop `.00` unless genuinely fractional (D42, supersedes D5) (D41/D42; AC-3.12/3.13, AC-P-\*)                                                                                                                                                                                                                                                      | ll298lee | **Merged** (2026-07-10) |
