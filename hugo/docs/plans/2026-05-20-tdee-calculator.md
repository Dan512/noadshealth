# TDEE Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a browser-based TDEE / daily calorie calculator at `/calculators/tdee/` that mirrors the existing BMI calc's pattern, shows BMR + maintenance + cut + bulk targets, and includes an HTML popover note for the sex input.

**Architecture:** Same three-file pattern as the BMI calc — markdown content (`content/calculators/tdee.md`) + custom Hugo layout (`layouts/calculators/tdee.html`) + small vanilla JS file (`assets/js/tdee.js`). Math runs entirely client-side. A small CSS block in `assets/css/main.css` styles the new popover trigger and surface. No new dependencies.

**Tech Stack:** Hugo (static site generator), vanilla JavaScript (no framework), Hugo's resource pipeline for JS minification + fingerprinting, native HTML `popover` attribute.

**Reference design:** [docs/plans/2026-05-20-tdee-calculator-design.md](2026-05-20-tdee-calculator-design.md)

**Reference precedent files (to mirror):**
- `content/calculators/bmi.md`
- `layouts/calculators/bmi.html`
- `assets/js/bmi.js` (read this before Task 3 to match style)
- `assets/css/main.css` (BMI-related blocks around lines 265–310)

---

## Task 1: Page scaffold — content markdown + layout shell

**Goal:** Get a TDEE page loading in Hugo with the title, lede, and an empty (not-yet-functional) form. No JS logic yet; we just want the page route to exist.

**Files:**
- Create: `content/calculators/tdee.md`
- Create: `layouts/calculators/tdee.html`

**Step 1.1: Create the markdown content file**

Path: `content/calculators/tdee.md`

```markdown
---
title: "TDEE Calculator"
description: "Estimate your daily calorie needs — maintenance, cutting, or bulking. Runs in your browser, your inputs never leave your device."
date: 2026-05-20
layout: "tdee"
---

## What TDEE actually is

TDEE — Total Daily Energy Expenditure — is roughly how many calories you burn in a day, all in: resting metabolism plus everything you do on top of it. It's an estimate, not a precise number. Two people with the same age, sex, height, and weight can have TDEEs that differ by a few hundred calories.

## Why most people overestimate activity level

The single most common mistake when using a TDEE calculator is overestimating activity level. "Moderately active" doesn't mean you go to the gym sometimes — it means three to five real training sessions a week, on top of a day that isn't otherwise sedentary. If you sit at a desk all day and lift three times a week, you're probably closer to "lightly active" than "moderately active." When in doubt, pick the lower tier.

## What to do with the result

The maintenance number is your starting point. If your weight stays roughly flat for two to three weeks while eating that many calories, the estimate is close enough. If you're gaining or losing, adjust by 100–200 kcal/day and check again.

The cut and bulk targets are exactly that — *targets,* meaning what you eat, not what you burn. They use modest percentages (−20% for cutting, +10% for bulking) that work for most people. More aggressive deficits exist but tend to backfire below ~1,500 kcal/day for women or ~1,800 for men.

## When to recompute

Recompute when your weight changes by roughly 10 lb (5 kg) in either direction, or when you switch goals. TDEE scales with body mass, so the number you got at 200 lb isn't right at 180 lb anymore.

## A note on this calculator

This is general guidance, not medical advice. If you have a condition (thyroid, diabetes, eating-disorder history, pregnancy, post-surgical) or you're taking medication that affects metabolism or appetite, talk to a qualified professional before changing your intake meaningfully.
```

**Step 1.2: Create the layout file (shell only)**

Path: `layouts/calculators/tdee.html`

```html
{{ define "main" }}
<article class="article calc-page">
  <header class="article-header">
    <h1 class="article-title">{{ .Title }}</h1>
    {{ with .Description }}<p class="article-lede">{{ . }}</p>{{ end }}
  </header>

  <section class="calc">
    <form id="tdee-form" class="calc-form" autocomplete="off" novalidate>
      <fieldset class="calc-units">
        <legend>Units</legend>
        <label class="radio-label">
          <input type="radio" name="unit" value="metric" checked>
          Metric (cm / kg)
        </label>
        <label class="radio-label">
          <input type="radio" name="unit" value="imperial">
          Imperial (in / lbs)
        </label>
      </fieldset>

      <div class="field">
        <label for="age">Age</label>
        <input type="number" id="age" inputmode="numeric" min="14" max="100" step="1" placeholder="e.g. 35">
      </div>

      <fieldset class="calc-sex">
        <legend>
          Sex
          <small class="form-hint">
            Used in the Mifflin–St Jeor formula.
            <button type="button" class="info-btn" popovertarget="sex-note" aria-label="More about the sex field">Note</button>
          </small>
        </legend>
        <label class="radio-label">
          <input type="radio" name="sex" value="male" checked>
          Male
        </label>
        <label class="radio-label">
          <input type="radio" name="sex" value="female">
          Female
        </label>
      </fieldset>

      <div class="field">
        <label for="height" id="height-label">Height (cm)</label>
        <input type="number" id="height" inputmode="decimal" min="0" step="0.1" placeholder="e.g. 175">
      </div>

      <div class="field">
        <label for="weight" id="weight-label">Weight (kg)</label>
        <input type="number" id="weight" inputmode="decimal" min="0" step="0.1" placeholder="e.g. 75">
      </div>

      <div class="field">
        <label for="activity">Activity level</label>
        <select id="activity">
          <option value="1.2">Sedentary — desk job, almost no exercise (×1.2)</option>
          <option value="1.375">Lightly active — light exercise 1–3 days/week (×1.375)</option>
          <option value="1.55" selected>Moderately active — moderate exercise 3–5 days/week (×1.55)</option>
          <option value="1.725">Very active — hard exercise 6–7 days/week (×1.725)</option>
          <option value="1.9">Extra active — hard exercise daily + physical job (×1.9)</option>
        </select>
      </div>
    </form>

    <div class="calc-result calc-result-tdee" aria-live="polite">
      <div class="calc-row">
        <span class="calc-label">BMR (resting)</span>
        <span class="calc-value" id="bmr-result">—</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">Maintenance (TDEE)</span>
        <span class="calc-value" id="tdee-result">—</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">Cut target (−20%)</span>
        <span class="calc-value" id="cut-result">—</span>
        <span class="calc-note">≈ 0.5–1 lb/week loss</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">Bulk target (+10%)</span>
        <span class="calc-value" id="bulk-result">—</span>
        <span class="calc-note">≈ 0.25–0.5 lb/week gain</span>
      </div>
      <p class="calc-result-prompt" id="tdee-prompt">Fill in all fields to see your numbers.</p>
    </div>

    <div id="sex-note" popover class="info-popover">
      <p>If you're non-binary or transgender, pick whichever better matches the body composition the formula should model — trans people on HRT often track closer to their post-transition numbers.</p>
      <button type="button" class="info-popover-close" popovertarget="sex-note" popovertargetaction="hide">Got it</button>
    </div>

    <div class="calc-disclaimer">
      <h2>About TDEE</h2>
      <p>TDEE is a starting estimate, not a prescription. Eat at the maintenance target for two to three weeks and watch what the scale does — adjust from there. Most calorie calculators (this one included) overestimate slightly for sedentary office workers and underestimate slightly for people with physical jobs. Don't treat these numbers as more precise than they are.</p>
    </div>
  </section>

  <div class="article-body">
    {{ .Content }}
  </div>
</article>
{{ end }}

{{ define "extraScripts" }}
  {{- $tdee := resources.Get "js/tdee.js" | resources.Minify | resources.Fingerprint -}}
  <script src="{{ $tdee.RelPermalink }}" integrity="{{ $tdee.Data.Integrity }}" defer></script>
{{ end }}
```

**Step 1.3: Run hugo server and verify the page exists**

Run from the Hugo project root:
```
hugo server
```

Open: `http://localhost:1313/calculators/tdee/`

Expected:
- Page loads with title "TDEE Calculator" and the lede text
- Form fields render: units, age, sex (with "Note" button), height, weight, activity
- Result panel shows the four labeled rows with em-dashes and the prompt text
- Markdown explainer renders below the calc
- Browser console shows one error: `assets/js/tdee.js` doesn't exist yet — that's expected, we create it in Task 3.

If the page 404s, double-check `layout: "tdee"` in the front matter and that the layout file is named exactly `tdee.html` inside `layouts/calculators/`.

**Commit checkpoint:** "feat(calc): TDEE page scaffold — markdown + layout shell"

---

## Task 2: Popover CSS

**Goal:** Style the "Note" button as a small subdued inline trigger, and the popover surface as a clean small dialog. Done before the JS so we can already verify the popover open/close behavior with no logic interference.

**Files:**
- Modify: `assets/css/main.css` — add a new block, don't modify existing `.calc-*` rules

**Step 2.1: Find the right insertion point in main.css**

Look for the existing `.article-byline a` block (added in the byline work). The new popover styles go immediately after it, in the same "small UI bits" neighborhood — keeps related additions colocated.

**Step 2.2: Add the new CSS block**

```css
/* ---- info-btn + popover (used by calc forms) ---- */
.info-btn {
  display: inline-block;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0 8px;
  font-size: 0.7rem;
  line-height: 1.6;
  color: var(--text-muted);
  cursor: pointer;
  margin-left: 6px;
  vertical-align: baseline;
}
.info-btn:hover,
.info-btn:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.info-popover {
  max-width: 420px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 8px);
  background: var(--bg);
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.5;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.info-popover::backdrop {
  background: rgba(0, 0, 0, 0.25);
}
.info-popover p {
  margin: 0 0 12px;
}
.info-popover-close {
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  font-size: 0.85rem;
  cursor: pointer;
}
.info-popover-close:hover,
.info-popover-close:focus-visible {
  filter: brightness(1.1);
  outline: none;
}

/* Result panel for the TDEE-style stacked rows */
.calc-result-tdee {
  display: grid;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}
.calc-result-tdee .calc-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  column-gap: 16px;
}
.calc-result-tdee .calc-label {
  color: var(--text-muted);
}
.calc-result-tdee .calc-value {
  font-weight: 600;
  font-size: 1.1rem;
}
.calc-result-tdee .calc-note {
  grid-column: 1 / -1;
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: -4px;
}
.calc-result-tdee .calc-result-prompt {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}
.calc-result-tdee.is-ready .calc-result-prompt {
  display: none;
}
```

Notes on the design choices:
- `var(--radius-md, 8px)` falls back to 8px if the project doesn't define that radius var. Check `main.css` for what radius vars exist — if there's already a `--radius-md` or similar, use the existing name verbatim. If radius is only `--radius-pill`, just hardcode `8px` for the popover.
- The result-panel layout uses CSS grid for clean alignment of label/value pairs, and `tabular-nums` keeps the digits in straight columns when values change.

**Step 2.3: Verify popover open/close works**

Refresh `http://localhost:1313/calculators/tdee/`. Click the "Note" button next to the sex field. Expected:
- Popover appears centered, with a subtle dark backdrop
- Click outside the popover → it dismisses
- Open again, press Esc → it dismisses
- Open again, click "Got it" → it dismisses
- Tab through the form — the "Note" button is reachable by keyboard; Enter opens the popover; Esc closes it; focus returns to the button

**Step 2.4: Verify the result-panel layout looks right**

The four result rows should be neatly stacked with labels on the left and em-dashes on the right. The "≈ 0.5–1 lb/week loss" / "≈ 0.25–0.5 lb/week gain" notes appear below the cut/bulk rows in smaller muted text. The "Fill in all fields…" prompt is visible at the bottom.

**Commit checkpoint:** "feat(calc): popover + result-panel styles"

---

## Task 3: TDEE calculation JS

**Goal:** Wire up the form to compute and display BMR / TDEE / cut / bulk live as the user types. Match the patterns in `assets/js/bmi.js` — read that file first.

**Files:**
- Create: `assets/js/tdee.js`

**Step 3.1: Read the existing `bmi.js` to match style**

Before writing, open `assets/js/bmi.js`. Match its conventions for:
- How units are read (radio group)
- How input listeners are wired up
- How conversion (in→cm, lb→kg) is done
- How invalid/empty states are signaled (likely toggling a class on the result container, setting em-dashes)
- Whether it uses `addEventListener` per element or event delegation

The TDEE JS should feel like a sibling of BMI, not a foreign import.

**Step 3.2: Create `assets/js/tdee.js`**

```javascript
(function () {
  'use strict';

  const form = document.getElementById('tdee-form');
  if (!form) return;

  const els = {
    age: document.getElementById('age'),
    height: document.getElementById('height'),
    weight: document.getElementById('weight'),
    activity: document.getElementById('activity'),
    heightLabel: document.getElementById('height-label'),
    weightLabel: document.getElementById('weight-label'),
    bmr: document.getElementById('bmr-result'),
    tdee: document.getElementById('tdee-result'),
    cut: document.getElementById('cut-result'),
    bulk: document.getElementById('bulk-result'),
    result: document.querySelector('.calc-result-tdee'),
  };

  const LB_TO_KG = 0.45359237;
  const IN_TO_CM = 2.54;

  function readUnit() {
    const checked = form.querySelector('input[name="unit"]:checked');
    return checked ? checked.value : 'metric';
  }

  function readSex() {
    const checked = form.querySelector('input[name="sex"]:checked');
    return checked ? checked.value : 'male';
  }

  function toMetric(unit, heightVal, weightVal) {
    if (unit === 'imperial') {
      return {
        cm: heightVal * IN_TO_CM,
        kg: weightVal * LB_TO_KG,
      };
    }
    return { cm: heightVal, kg: weightVal };
  }

  function computeBMR(sex, kg, cm, age) {
    // Mifflin–St Jeor
    const base = 10 * kg + 6.25 * cm - 5 * age;
    return sex === 'female' ? base - 161 : base + 5;
  }

  function format(n) {
    return Math.round(n).toLocaleString();
  }

  function updateUnitLabels(unit) {
    if (unit === 'imperial') {
      els.heightLabel.textContent = 'Height (in)';
      els.weightLabel.textContent = 'Weight (lbs)';
    } else {
      els.heightLabel.textContent = 'Height (cm)';
      els.weightLabel.textContent = 'Weight (kg)';
    }
  }

  function setEmpty() {
    els.bmr.textContent = '—';
    els.tdee.textContent = '—';
    els.cut.textContent = '—';
    els.bulk.textContent = '—';
    els.result.classList.remove('is-ready');
  }

  function calculate() {
    const unit = readUnit();
    const sex = readSex();
    const age = parseFloat(els.age.value);
    const heightRaw = parseFloat(els.height.value);
    const weightRaw = parseFloat(els.weight.value);
    const mult = parseFloat(els.activity.value);

    updateUnitLabels(unit);

    if (
      !Number.isFinite(age) || age <= 0 ||
      !Number.isFinite(heightRaw) || heightRaw <= 0 ||
      !Number.isFinite(weightRaw) || weightRaw <= 0 ||
      !Number.isFinite(mult) || mult <= 0
    ) {
      setEmpty();
      return;
    }

    const { cm, kg } = toMetric(unit, heightRaw, weightRaw);
    const bmr = computeBMR(sex, kg, cm, age);
    const tdee = bmr * mult;
    const cut = tdee * 0.80;
    const bulk = tdee * 1.10;

    els.bmr.textContent = format(bmr) + ' kcal/day';
    els.tdee.textContent = format(tdee) + ' kcal/day';
    els.cut.textContent = format(cut) + ' kcal/day';
    els.bulk.textContent = format(bulk) + ' kcal/day';
    els.result.classList.add('is-ready');
  }

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);

  // Initial pass — sets unit labels and empty state.
  calculate();
})();
```

**Step 3.3: Verify it works — known case 1 (metric)**

Reload `http://localhost:1313/calculators/tdee/`. Enter:
- Units: Metric
- Age: 30
- Sex: Male
- Height: 175
- Weight: 75
- Activity: Moderately active (×1.55)

Expected result (rounded to nearest whole kcal):
- BMR: **1,674 kcal/day** (10 × 75 + 6.25 × 175 − 5 × 30 + 5 = 1673.75)
- Maintenance (TDEE): **2,594 kcal/day** (1673.75 × 1.55)
- Cut (−20%): **2,075 kcal/day**
- Bulk (+10%): **2,854 kcal/day**

If numbers are off by 1 due to rounding, that's fine. If they're off by hundreds, check the formula signs (the female branch subtracts 161; male adds 5 — easy to flip).

**Step 3.4: Verify known case 2 (imperial)**

Same person, expressed imperially:
- Units: Imperial
- Age: 30
- Sex: Male
- Height: 68.9 (≈ 175 cm)
- Weight: 165.3 (≈ 75 kg)
- Activity: Moderately active

Expected: same numbers as Step 3.3, within ±2 kcal due to conversion rounding.

If the result panel shows em-dashes after switching to imperial, check that the unit labels updated and that the form's `input` event is firing on the unit radios.

**Step 3.5: Verify the empty / invalid state**

Clear the age field. Result panel should snap back to em-dashes and the "Fill in all fields…" prompt should reappear.

Set age to 0 or a negative number. Same — em-dashes and prompt.

**Commit checkpoint:** "feat(calc): TDEE calculation logic"

---

## Task 4: Mobile-narrow sanity pass + listing verification

**Goal:** Eye-test the new calc on a narrow viewport, and confirm the calculators index picks up the new entry automatically.

**Step 4.1: Resize browser to ~400px wide**

Or use devtools device emulation (iPhone SE, etc.). Verify:
- Form fields stack vertically with no horizontal overflow
- "Note" button sits cleanly next to the sex hint text and wraps gracefully
- Popover opens centered, fits within viewport with margins
- Result rows stay readable; the small "≈ 0.5–1 lb/week" notes don't crowd the kcal values

If anything overflows, the typical fix is adding `max-width: 100%` to a wrapper or relaxing a `min-width` on the form fieldsets.

**Step 4.2: Verify the calculators listing**

Open `http://localhost:1313/calculators/`. Expected: both BMI Calculator and TDEE Calculator appear in the list. If TDEE isn't there, check `content/calculators/tdee.md` exists and has a non-empty front matter `title`.

**Step 4.3: Network-tab privacy check**

Open devtools → Network tab → reload `/calculators/tdee/`. Type into the form. Confirm zero network requests fire while typing (all math is client-side, no analytics, no remote calls). The only requests should be the initial HTML + CSS + JS loads on page load.

**Commit checkpoint:** "feat(calc): TDEE — final layout polish and listing verification"

---

## Out of scope (do not implement)

- Macros / protein target outputs — that's a separate calculator
- A slider for picking deficit aggressiveness — design committed to fixed −20% / +10%
- Multiple cut variants (mild + aggressive) — single cut only
- Persisting inputs to localStorage / URL — calculators are intentionally ephemeral
- Charts / projections / graphs — keep it numeric

---

## Files touched (final state)

```
content/calculators/tdee.md            (new)
layouts/calculators/tdee.html          (new)
assets/js/tdee.js                      (new)
assets/css/main.css                    (modified — append-only block)
```
