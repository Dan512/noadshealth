/* noadshealth BMI calculator — purely client-side. No network calls. */

(function () {
  'use strict';

  const form = document.getElementById('bmi-form');
  if (!form) return;

  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const heightLabel = document.getElementById('height-label');
  const weightLabel = document.getElementById('weight-label');
  const resultEl = document.getElementById('bmi-result');
  const categoryEl = document.getElementById('bmi-category');

  const MESSAGES = {
    empty: 'Enter your height and weight to see your BMI.',
    needHeight: 'Add your height.',
    needWeight: 'Add your weight.',
    implausible: "That can't be right — did you mix metric and imperial?"
  };

  function currentUnit() {
    const checked = form.querySelector('input[name="unit"]:checked');
    return checked ? checked.value : 'metric';
  }

  function updateUnitLabels() {
    const unit = currentUnit();
    if (unit === 'metric') {
      heightLabel.textContent = 'Height (cm)';
      weightLabel.textContent = 'Weight (kg)';
      heightInput.placeholder = 'e.g. 175';
      weightInput.placeholder = 'e.g. 70';
      heightInput.min = 50;  heightInput.max = 250;
      weightInput.min = 20;  weightInput.max = 300;
    } else {
      heightLabel.textContent = 'Height (in)';
      weightLabel.textContent = 'Weight (lbs)';
      heightInput.placeholder = 'e.g. 70';
      weightInput.placeholder = 'e.g. 155';
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
        ? (h / 2.54)        // cm → in
        : (h * 2.54)        // in → cm
      ).toFixed(1);
    }
    if (isFinite(w) && w > 0) {
      weightInput.value = (fromUnit === 'metric'
        ? (w * 2.20462)     // kg → lbs
        : (w / 2.20462)     // lbs → kg
      ).toFixed(1);
    }
  }

  function calcBMI(height, weight, unit) {
    if (!isFinite(height) || !isFinite(weight) || height <= 0 || weight <= 0) return null;
    if (unit === 'metric') {
      const m = height / 100;
      return weight / (m * m);
    }
    // imperial: lbs / in^2 * 703
    return (weight / (height * height)) * 703;
  }

  function categorize(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function render() {
    const hRaw = heightInput.value.trim();
    const wRaw = weightInput.value.trim();
    const h = parseFloat(hRaw);
    const w = parseFloat(wRaw);
    const hasH = hRaw !== '' && isFinite(h) && h > 0;
    const hasW = wRaw !== '' && isFinite(w) && w > 0;

    function showEmpty(msg) {
      resultEl.textContent = '—';
      resultEl.classList.add('is-empty');
      categoryEl.textContent = msg;
    }

    if (!hasH && !hasW) { showEmpty(MESSAGES.empty); return; }
    if (!hasH)          { showEmpty(MESSAGES.needHeight); return; }
    if (!hasW)          { showEmpty(MESSAGES.needWeight); return; }

    const bmi = calcBMI(h, w, currentUnit());
    if (bmi === null || bmi < 10 || bmi > 80) {
      showEmpty(MESSAGES.implausible);
      return;
    }
    resultEl.classList.remove('is-empty');
    resultEl.textContent = bmi.toFixed(1);
    categoryEl.textContent = categorize(bmi);
  }

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
  heightInput.addEventListener('input', render);
  weightInput.addEventListener('input', render);

  updateUnitLabels();
  render();

  // Expose for tests / console fiddling.
  window.NoAds = window.NoAds || {};
  window.NoAds.calcBMI = calcBMI;
  window.NoAds.categorizeBMI = categorize;
})();
