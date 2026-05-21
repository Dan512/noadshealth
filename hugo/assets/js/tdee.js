/* noadshealth TDEE calculator — purely client-side. No network calls. */

(function () {
  'use strict';

  const form = document.getElementById('tdee-form');
  if (!form) return;

  const ageInput = document.getElementById('age');
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const activitySelect = document.getElementById('activity');
  const heightLabel = document.getElementById('height-label');
  const weightLabel = document.getElementById('weight-label');
  const bmrEl = document.getElementById('bmr-result');
  const tdeeEl = document.getElementById('tdee-result');
  const cutEl = document.getElementById('cut-result');
  const bulkEl = document.getElementById('bulk-result');
  const promptEl = document.getElementById('tdee-prompt');
  const resultEl = document.querySelector('.calc-result-tdee');
  const rows = resultEl ? resultEl.querySelectorAll('.calc-row') : [];

  const LB_TO_KG = 0.45359237;
  const IN_TO_CM = 2.54;

  // Prompt strings shown under the result rows when no number is displayed.
  const MESSAGES = {
    empty: 'Fill in all fields to see your numbers.',
    implausible: "These numbers look off — double-check height/weight and units."
  };

  // BMR bounds (kcal/day) — catches mixed-units mistakes and other comically off
  // inputs. A 30y male 175cm 50kg → ~1430; a 30y female 150cm 40kg → ~1080.
  // Anything below 700 or above 3500 means the inputs aren't from a typical adult.
  const BMR_MIN = 700;
  const BMR_MAX = 3500;

  function currentUnit() {
    const checked = form.querySelector('input[name="unit"]:checked');
    return checked ? checked.value : 'metric';
  }

  function currentSex() {
    const checked = form.querySelector('input[name="sex"]:checked');
    return checked ? checked.value : 'male';
  }

  function updateUnitLabels() {
    const unit = currentUnit();
    if (unit === 'metric') {
      heightLabel.textContent = 'Height (cm)';
      weightLabel.textContent = 'Weight (kg)';
      heightInput.placeholder = 'e.g. 175';
      weightInput.placeholder = 'e.g. 75';
      heightInput.min = 50;  heightInput.max = 250;
      weightInput.min = 20;  weightInput.max = 300;
    } else {
      heightLabel.textContent = 'Height (in)';
      weightLabel.textContent = 'Weight (lbs)';
      heightInput.placeholder = 'e.g. 69';
      weightInput.placeholder = 'e.g. 165';
      heightInput.min = 20;  heightInput.max = 100;
      weightInput.min = 40;  weightInput.max = 700;
    }
  }

  function convertValues(fromUnit, toUnit) {
    if (fromUnit === toUnit) return;
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);
    if (isFinite(h) && h > 0) {
      heightInput.value = (fromUnit === 'metric'
        ? (h / IN_TO_CM)        // cm → in
        : (h * IN_TO_CM)        // in → cm
      ).toFixed(1);
    }
    if (isFinite(w) && w > 0) {
      weightInput.value = (fromUnit === 'metric'
        ? (w / LB_TO_KG)        // kg → lbs
        : (w * LB_TO_KG)        // lbs → kg
      ).toFixed(1);
    }
  }

  function toMetric(unit, heightVal, weightVal) {
    if (unit === 'imperial') {
      return { cm: heightVal * IN_TO_CM, kg: weightVal * LB_TO_KG };
    }
    return { cm: heightVal, kg: weightVal };
  }

  function calcBMR(sex, kg, cm, age) {
    const base = 10 * kg + 6.25 * cm - 5 * age;
    return sex === 'female' ? base - 161 : base + 5;
  }

  function formatKcal(n) {
    return Math.round(n).toLocaleString() + ' kcal/day';
  }

  // `reason` is optional: pass 'implausible' when the bounds-check fails so the
  // prompt explains why the result is hidden. Omit it for plain missing input.
  function showEmpty(reason) {
    bmrEl.textContent = '—';
    tdeeEl.textContent = '—';
    cutEl.textContent = '—';
    bulkEl.textContent = '—';
    if (resultEl) resultEl.classList.remove('is-ready');
    rows.forEach(function (row) { row.setAttribute('aria-hidden', 'true'); });
    if (promptEl) {
      promptEl.textContent = reason === 'implausible' ? MESSAGES.implausible : MESSAGES.empty;
    }
  }

  function showReady(bmr, tdee, cut, bulk) {
    bmrEl.textContent = formatKcal(bmr);
    tdeeEl.textContent = formatKcal(tdee);
    cutEl.textContent = formatKcal(cut);
    bulkEl.textContent = formatKcal(bulk);
    if (resultEl) resultEl.classList.add('is-ready');
    rows.forEach(function (row) { row.removeAttribute('aria-hidden'); });
  }

  function render() {
    const age = parseFloat(ageInput.value);
    const heightRaw = parseFloat(heightInput.value);
    const weightRaw = parseFloat(weightInput.value);
    const mult = parseFloat(activitySelect.value);

    if (
      !isFinite(age) || age <= 0 ||
      !isFinite(heightRaw) || heightRaw <= 0 ||
      !isFinite(weightRaw) || weightRaw <= 0 ||
      !isFinite(mult) || mult <= 0
    ) {
      showEmpty();
      return;
    }

    const unit = currentUnit();
    const sex = currentSex();
    const metric = toMetric(unit, heightRaw, weightRaw);
    const bmr = calcBMR(sex, metric.kg, metric.cm, age);

    // Implausibility guard — catches mixed-units mistakes (e.g. 5000 lb where
    // 165 lb was meant). Mirrors bmi.js's BMI 10–80 band check.
    if (bmr < BMR_MIN || bmr > BMR_MAX) {
      showEmpty('implausible');
      return;
    }

    const tdee = bmr * mult;
    showReady(bmr, tdee, tdee * 0.80, tdee * 1.10);
  }

  // Unit toggle: convert the typed values to the new unit BEFORE updating labels
  // and re-rendering. Tracking `lastUnit` lets us know which direction to convert.
  let lastUnit = currentUnit();
  form.querySelectorAll('input[name="unit"]').forEach(function (el) {
    el.addEventListener('change', function () {
      const newUnit = currentUnit();
      convertValues(lastUnit, newUnit);
      lastUnit = newUnit;
      updateUnitLabels();
      render();
    });
  });

  // Generic listeners for every other field. The unit-radio change events also
  // bubble here, but by the time they arrive `convertValues` has already run
  // and `lastUnit === newUnit`, so the convertValues call inside the dedicated
  // listener is a no-op on re-entry.
  form.addEventListener('input', render);
  form.addEventListener('change', render);

  updateUnitLabels();
  render();

  // Expose for tests / console fiddling.
  window.NoAds = window.NoAds || {};
  window.NoAds.calcBMR = calcBMR;
  window.NoAds.calcTDEE = function (sex, kg, cm, age, mult) {
    return calcBMR(sex, kg, cm, age) * mult;
  };
})();
