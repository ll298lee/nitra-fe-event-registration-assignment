## Getting Started

```bash
yarn
yarn dev    # starts dev server at http://localhost:9000
yarn build  # production build
```

> **Requirements:** Node 22.17.0 (other 22.x versions should work), yarn >= 4.6.0

You are free to install additional dependencies (e.g. date-fns, lodash-es) — please document each choice in your `PLAN.md` (see [Submission](#submission) below).

---

## Step Details

### Step 1 — Attendee Info

**Fields:**

| Field            | Type  | Validation                                                                 |
| ---------------- | ----- | -------------------------------------------------------------------------- |
| Full Name        | text  | required                                                                   |
| Email            | email | required, valid email format                                               |
| Phone            | tel   | required, valid phone format                                               |
| Company          | text  | required                                                                   |
| Job Title        | text  | required                                                                   |
| Shipping Address | text  | optional — becomes **required** when any merchandise is selected in Step 3 |

**Ticket Type Selection:**

Display three ticket cards. Only one can be selected at a time.

| Ticket  | Price | Perks                                                             |
| ------- | ----- | ----------------------------------------------------------------- |
| General | $299  | All sessions, keynotes, lunch                                     |
| VIP     | $599  | General + VIP lounge, speaker meet & greet, **10% off workshops** |
| Student | $99   | All sessions, keynotes                                            |

> No inline validation on this step — all validation runs at Step 4 submit time.

### Step 2 — Session Selection

**Data source:** `src/mocks/sessions.js`

1. **Group by date** — display sessions organized by day (Nov 15 / Nov 16).
2. **Time-conflict detection** — users may freely select any available sessions. Time-conflict validation is deferred to Step 4 submit time. If conflicts are detected, the relevant step should be indicated with errors.
3. **Capacity check** — sessions where `registered >= capacity` are shown as **full** (disabled).
4. Each session card should display: title, speaker, time range, track badge, remaining spots.

### Step 3 — Add-ons

**Data source:** `src/mocks/addons.js`

1. **Group by category** — display in sections: Workshops / Meal Packages / Merchandise.
2. **Workshop time conflicts** — workshops have time slots. If a workshop overlaps with any session selected in Step 2, mark it as unavailable.
3. **Merchandise options** — some items have `sizes` (size selector) and `maxQuantity` (quantity picker).
4. **Shipping banner** — when any merchandise item is added, display an info banner: _"Merchandise items will be shipped to your address one week before the conference. Please ensure your shipping address in Step 1 is correct."_
5. **Running total** — display a live-updating order summary with ticket price, selected add-ons, VIP discount (10% off workshops), and total.
6. **Currency formatting** — all prices shown as `$X,XXX.XX` format.

### Step 4 — Review & Submit

1. **Summary display** — show all selections from Steps 1–3 in a readable format.
2. **Itemized pricing** — line-by-line breakdown with subtotals and grand total.
3. **Edit buttons** — each section has an "Edit" link/button to jump back to the corresponding step.
4. **Unified validation** — on submit, validate **all fields across all steps** at once.
5. **Error navigation** — if validation fails, clearly indicate which step(s) have errors and allow the user to jump to that step.
6. **Success state** — after successful submission, show a confirmation screen with a summary.

---

## Design Tokens

This project uses the Nitra semantic design token system. All tokens are available as CSS variables and UnoCSS utility classes.

**UnoCSS shortcuts (preferred):**

```html
<div class="text-neutral bg-surface-l1 border border-neutral-muted">...</div>
```

| Category   | Example Shortcuts                                          |
| ---------- | ---------------------------------------------------------- |
| Text       | `text-neutral`, `text-danger`, `text-brand`                |
| Background | `bg-surface-l0`, `bg-brand-emphasis-rest`                  |
| Border     | `border-neutral-muted`, `border-danger-emphasis`           |
| Divider    | `divider-default`, `divider-emphasis`                      |
| Typography | `text-h1` to `text-h4`, `text-subtitle1`, `text-subtitle2` |

> Refer to `src/unocss/semantic.js` for the full list. **Do not hardcode hex color values** — always use the provided tokens.

---

## Submission

Please refer to the **Official Interview Doc** sent to you by HR for the full submission requirements (expected effort, deadline, `PLAN.md` spec, commit history, AI usage notes, and how to deliver). That document is the authoritative source — if anything here conflicts, follow the Official Doc.
