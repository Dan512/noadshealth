# TDEE / daily calorie calculator — design

**Date:** 2026-05-20
**Status:** Approved
**Site:** noadshealth.com (Hugo project at `~/Documents/Dan/noadsdude/noadsfitness/hugo/`)

## Goal

Add a second browser-based fitness calculator alongside the existing BMI calc. Computes daily calorie targets (BMR, maintenance / TDEE, cut, bulk) from the standard inputs. Mirrors the BMI calc's pattern, voice, and privacy framing — all math runs client-side, no inputs ever leave the device.

## Scope decisions (settled during brainstorming)

| Decision | Value |
|---|---|
| Output scope | Standard — BMR + TDEE + single cut target + single bulk target |
| Cut/bulk math | Percentage-based (×0.80 cut, ×1.10 bulk) — not fixed kcal deltas |
| Result layout | Four numbers stacked vertically in a single column |
| BMR formula | Mifflin–St Jeor |
| Activity tiers | Five standard tiers (1.2 / 1.375 / 1.55 / 1.725 / 1.9) |
| Sex input | Radio Male/Female + a popover "Note" explaining how non-binary / trans readers should pick |
| Units | Metric / Imperial toggle, matches BMI calc behavior |
| Layout pattern | BMI-clone — same structure, classes, JS pattern, page-bundle-style placement |

## Files added

```
content/calculators/tdee.md            — page content with explainer prose
layouts/calculators/tdee.html          — form + result UI (mirrors layouts/calculators/bmi.html)
assets/js/tdee.js                      — live calculation (mirrors assets/js/bmi.js)
```

Plus a small additive block in `assets/css/main.css` for the `.info-btn` and `.info-popover` styles. No existing CSS classes are modified.

## UI structure

Mirrors `bmi.html` exactly:

1. `<header class="article-header">` — title and lede from front matter
2. `<section class="calc">` — form + result panel + small "About TDEE" disclaimer
3. `<div class="article-body">` — markdown explainer rendered from `tdee.md`

### Form fields (in order)

| Field | Element | Notes |
|---|---|---|
| Units | radio (metric / imperial) | Same labels & values as BMI calc |
| Age | `<input type="number">` | min 14, max 100, step 1 |
| Sex | radio (male / female) inside `<fieldset>` | Legend includes "Note" popover button (see below) |
| Height | `<input type="number">` | Step 0.1; label switches "Height (cm)" ↔ "Height (in)" |
| Weight | `<input type="number">` | Step 0.1; label switches "Weight (kg)" ↔ "Weight (lb)" |
| Activity level | `<select>` | 5 options, each with the multiplier in parentheses |

### Sex-input "Note" popover

Markup (uses the native HTML `popover` attribute — supported in all modern browsers as of 2024):

```html
<fieldset class="calc-sex">
  <legend>
    Sex
    <small>Used in the Mifflin–St Jeor formula.
      <button type="button" class="info-btn" popovertarget="sex-note" aria-label="More about the sex field">Note</button>
    </small>
  </legend>
  <label class="radio-label"><input type="radio" name="sex" value="male" checked> Male</label>
  <label class="radio-label"><input type="radio" name="sex" value="female"> Female</label>
</fieldset>

<div id="sex-note" popover class="info-popover">
  <p>If you're non-binary or transgender, pick whichever better matches the body composition the formula should model — trans people on HRT often track closer to their post-transition numbers.</p>
  <button type="button" class="info-popover-close" popovertarget="sex-note" popovertargetaction="hide">Got it</button>
</div>
```

Behavior: clicking/tapping "Note" opens the popover (centered, with a subtle backdrop). Esc, outside click, or "Got it" dismisses. Fully keyboard accessible. No JS required for open/close.

### Activity level options

```
Sedentary — desk job, almost no exercise (×1.2)
Lightly active — light exercise 1–3 days/week (×1.375)
Moderately active — moderate exercise 3–5 days/week (×1.55)
Very active — hard exercise 6–7 days/week (×1.725)
Extra active — hard exercise daily + physical job (×1.9)
```

### Result panel

```
BMR (resting):          1,720 kcal/day
Maintenance (TDEE):     2,420 kcal/day
Cut target (−20%):      1,936 kcal/day   ≈ 0.5–1 lb/week loss
Bulk target (+10%):     2,662 kcal/day   ≈ 0.25–0.5 lb/week gain
```

- Stacked vertically; numbers right-aligned, monospaced; locale-formatted commas.
- `aria-live="polite"` on the result container so screen readers announce updates.
- Cut and bulk rows get a small, muted descriptor line under the kcal number giving an approximate weight-change range (uses "≈" and a range — avoids "X kcal = Y lb" pseudo-precision).
- Empty / invalid state: result rows show `—`, descriptor reads "Fill in all fields to see your numbers."

## Calculation logic

All math in `tdee.js`. Inputs converted to metric internally, regardless of unit selection.

```
Mifflin–St Jeor BMR:
  male:    10 × kg + 6.25 × cm − 5 × age + 5
  female:  10 × kg + 6.25 × cm − 5 × age − 161

TDEE        = BMR × activityMultiplier
Cut target  = round(TDEE × 0.80)
Bulk target = round(TDEE × 1.10)
```

Conversions:
- `kg  = lb × 0.45359237`
- `cm  = in × 2.54`

Updates fire on `input` events (live). If any required field is empty, NaN, or ≤ 0, the result panel shows the empty state — no partial calculation.

## Markdown explainer (`tdee.md` body)

Below the calc — Dan-voice content, ~250–400 words, covering:
- What TDEE is (one short paragraph)
- Why most people overestimate their activity level (the most useful single sentence in the whole page)
- When to recompute (every ~10 lb of weight change, or after a goal change)
- Honest caveats: this is a starting point, not a prescription; watch what the scale and the mirror do over 2–3 weeks and adjust
- That a "cut target" is a target *for what you eat,* not for what you burn

## Calculators listing page

`/calculators/` (`content/calculators/_index.md`) already exists and presumably lists all section pages via the default `list.html` layout. The new TDEE calc gets picked up automatically. No template changes expected — verify after build.

## Testing / verification

Manual checks against the running site (`hugo server`):

1. **Known case (metric):** 30 y/o male, 175 cm, 75 kg, moderately active → BMR ≈ 1,674; TDEE ≈ 2,594; Cut ≈ 2,075; Bulk ≈ 2,854.
2. **Known case (imperial):** Same person as 30 y/o male, 5'9" (69 in), 165 lb, moderately active → same numbers as above (within rounding).
3. **Unit toggle mid-entry:** Start in metric, fill in cm/kg, switch to imperial — labels update, internal calc stays correct (the form doesn't auto-convert visible field values; that's intentional, matches BMI calc behavior).
4. **Empty-state behavior:** Clear any required field → result panel shows `—` and the prompt text.
5. **Popover keyboard:** Tab to "Note" button → Enter opens popover → Esc closes. Mouse: click outside popover → dismisses.
6. **Popover mobile:** On touch, tap "Note" → opens, tap outside → light-dismisses.
7. **Calculators index:** `/calculators/` page lists both BMI and TDEE entries.
8. **Privacy claim:** Network tab in devtools — confirm no requests fire when typing in the form (all client-side).

## Error handling

- Numeric inputs out of range or non-positive → field gets `aria-invalid="true"`, result panel shows empty state.
- Doesn't block typing — the user can keep editing without seeing error messages flash.
- No server requests, no failure modes beyond invalid input.

## Out of scope (explicitly excluded)

- Macro breakdown (protein / carbs / fat targets) — separate calc, deferred
- Goal-rate slider — picked single fixed percentages instead per brainstorm decision
- Multiple cut variants (mild + aggressive) — picked single cut per brainstorm decision
- BMR-only formulas other than Mifflin–St Jeor (Harris-Benedict, Katch-McArdle) — Mifflin is the modern consensus
- Save / share / URL state — calculators are intentionally ephemeral, no persistence
