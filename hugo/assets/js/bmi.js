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
    } else {
      heightLabel.textContent = 'Height (in)';
      weightLabel.textContent = 'Weight (lbs)';
      heightInput.placeholder = 'e.g. 70';
      weightInput.placeholder = 'e.g. 155';
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
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);
    const bmi = calcBMI(h, w, currentUnit());
    if (bmi === null) {
      resultEl.textContent = '—';
      categoryEl.textContent = 'Enter your height and weight above';
      return;
    }
    resultEl.textContent = bmi.toFixed(1);
    categoryEl.textContent = categorize(bmi);
  }

  form.querySelectorAll('input[name="unit"]').forEach(function (el) {
    el.addEventListener('change', function () {
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
