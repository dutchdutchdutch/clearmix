/**
 * Clearmix Calculator - Two Screen Mode
 *
 * Screen 1: Mixing (Reconstitution)
 * Screen 2: Dosing (Self-administration)
 *
 * The variant config (presets, units, copy) is read from the
 * `<script id="variant-config" type="application/json">` data island
 * injected by the template. All internal dose math is in mcg; mg display
 * units are converted at the input/display boundary.
 */

console.log('🧪 Clearmix calculator loaded');

// ================================================================
// VARIANT CONFIG (from data island)
// ================================================================

function readVariantConfig() {
    const el = document.getElementById('variant-config');
    if (!el) {
        console.warn('No #variant-config data island found; falling back to defaults.');
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (err) {
        console.error('Failed to parse variant-config JSON', err);
        return null;
    }
}

const VARIANT = readVariantConfig() || {
    dose_default_unit: 'mcg',
    dose_supported_units: ['mcg'],
    dose_input_range: [50, 1000],
};

// ================================================================
// UNIT CONVERSION
// ================================================================

const mgToMcg = (v) => v * 1000;
const mcgToMg = (v) => v / 1000;

/** Format mg with leading zero (`0.25`, `0.50`). Strips trailing-zero noise
 *  beyond two decimals (e.g., 1 -> "1.00"). */
function formatMg(v) {
    if (v === null || v === undefined || isNaN(v)) return '';
    return Number(v).toFixed(2);
}

/** Convert a value in `unit` ("mg" or "mcg") to canonical mcg. */
function toCanonicalMcg(value, unit) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return unit === 'mg' ? mgToMcg(value) : Number(value);
}

/** Convert a canonical mcg value into `unit` ("mg" or "mcg"). */
function fromCanonicalMcg(mcg, unit) {
    if (mcg === null || mcg === undefined || isNaN(mcg)) return null;
    return unit === 'mg' ? mcgToMg(mcg) : mcg;
}

// ================================================================
// STATE
// ================================================================

const state = {
    // Mixing screen
    vialMg: 10,
    diluentMl: 2.0,
    mixingSyringeMl: 1.0,
    mixingSyringeUnits: 100,

    // Dosing screen — dose is canonical in mcg internally regardless of UI unit
    doseMcg: null,
    doseUnit: VARIANT.dose_default_unit,    // current display unit
    dosingSyringeMl: 0.5,
    dosingSyringeUnits: 50,

    // Derived
    concentrationMcgPerMl: null,
    doseMl: null,
    doseUnits: null,
    numDoses: null,

    // UI state
    currentScreen: 'mixing',

    // Validation state
    validationErrors: {
        water: false,
        dose: false
    }
};

// ================================================================
// INPUT CONSTRAINTS
// ================================================================

// Water/vial constraints are physical (mL/mg) and shared across variants.
// Dose constraints derive from the variant's input range, expressed in
// the variant's default unit, then canonicalized to mcg for validation.
const CONSTRAINTS = {
    water: { min: 0.5, max: 10, unit: 'mL' },
    vial:  { min: 0.1, commonMin: 5, commonMax: 10, max: 30, unit: 'mg' },
    dose:  (() => {
        const [lo, hi] = VARIANT.dose_input_range || [50, 1000];
        const unit = VARIANT.dose_default_unit || 'mcg';
        const minMcg = toCanonicalMcg(lo, unit);
        const maxMcg = toCanonicalMcg(hi, unit);
        // 50% of max as a soft "common-dose" caution threshold (parity with
        // the previous default of 500 mcg out of a 1000 mcg max).
        const cautionMcg = Math.round(maxMcg * 0.5);
        return {
            min: minMcg,
            max: maxMcg,
            cautionThreshold: cautionMcg,
            unit: 'mcg',
        };
    })(),
};


// ================================================================
// VALIDATION FUNCTIONS
// ================================================================

function setWaterVolume(vol) {
    state.diluentMl = vol;
    state.validationErrors.water = false;
    updateMixingUI();
}

function validateWaterVolume(value) {
    const { min, max } = CONSTRAINTS.water;

    hideAlert('water-alert-error');
    hideAlert('water-alert-info');

    if (value === null || value === undefined || isNaN(value)) {
        return { valid: false, correctedValue: null, alertType: null, message: null };
    }

    if (value < min) {
        showAlert('water-alert-error', `Water volume must be at least ${min} mL. Setting to ${min} mL.`);
        state.validationErrors.water = true;
        return { valid: false, correctedValue: min, alertType: 'error', message: `Water volume must be at least ${min} mL.` };
    }

    if (value > max) {
        showAlert('water-alert-info', `${max} mL is the maximum Clearmix supports. Setting to ${max} mL.`);
        state.validationErrors.water = false;
        return { valid: true, correctedValue: max, alertType: 'info', message: `Maximum is ${max} mL.` };
    }

    state.validationErrors.water = false;
    return { valid: true, correctedValue: value, alertType: null, message: null };
}

/**
 * Validate a dose value expressed in canonical mcg.
 */
function validateDoseMcg(valueMcg) {
    const { cautionThreshold, max } = CONSTRAINTS.dose;
    const displayUnit = state.doseUnit;
    const fmt = (mcg) => {
        const v = fromCanonicalMcg(mcg, displayUnit);
        return displayUnit === 'mg' ? `${formatMg(v)} mg` : `${Math.round(v)} mcg`;
    };

    hideAlert('dose-alert-info');
    hideAlert('dose-alert-warning');

    if (valueMcg === null || valueMcg === undefined || isNaN(valueMcg) || valueMcg <= 0) {
        state.validationErrors.dose = false;
        return { valid: true, correctedValue: null, alertType: null, message: null };
    }

    if (valueMcg > max) {
        showAlert('dose-alert-info',
            `🏥 Clearmix supports doses up to ${fmt(max)}. For higher amounts, please consult your prescriber.`);
        state.validationErrors.dose = false;
        return { valid: true, correctedValue: max, alertType: 'info', message: `Maximum supported is ${fmt(max)}.` };
    }

    if (valueMcg > cautionThreshold) {
        showAlert('dose-alert-info',
            `💡 Most common doses are up to ${fmt(cautionThreshold)}. Double-check your prescription if unsure.`);
        state.validationErrors.dose = false;
        return { valid: true, correctedValue: null, alertType: 'info', message: 'Check prescription reminder' };
    }

    state.validationErrors.dose = false;
    return { valid: true, correctedValue: null, alertType: null, message: null };
}

function validateVialAmount(value) {
    const { min, commonMin, commonMax, max } = CONSTRAINTS.vial;
    hideAlert('vial-alert-error');
    hideAlert('vial-alert-info');

    if (value === null || value === undefined || isNaN(value)) {
        return { valid: false, correctedValue: null, alertType: null, message: null };
    }
    const v = Number(value);

    if (v <= 0) {
        showAlert('vial-alert-error', `Vial amount must be a positive number.`);
        return { valid: false, correctedValue: null, alertType: 'error', message: 'Non-positive vial amount' };
    }

    if (v > max) {
        showAlert('vial-alert-error', `Maximum supported vial amount is ${max} mg. Resetting to ${max} mg.`);
        return { valid: false, correctedValue: max, alertType: 'error', message: 'Exceeded max vial amount' };
    }

    if (v > commonMax) {
        showAlert('vial-alert-info', `Vial amount ${v} mg is above the typical ${commonMin}-${commonMax} mg range. Please double-check your prescription.`);
        return { valid: true, correctedValue: v, alertType: 'info', message: 'Above common range' };
    }

    return { valid: true, correctedValue: v, alertType: null, message: null };
}

function showAlert(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('inline-alert--visible');
    }
}

function hideAlert(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = '';
        el.classList.remove('inline-alert--visible');
    }
}


// ================================================================
// CALCULATIONS
// ================================================================

function calculateMixing() {
    if (!state.vialMg || !state.diluentMl) return null;

    const vialMcg = state.vialMg * 1000;
    state.concentrationMcgPerMl = vialMcg / state.diluentMl;

    return {
        concentrationMcgPerMl: state.concentrationMcgPerMl,
        concentrationMgPerMl: state.vialMg / state.diluentMl
    };
}

function calculateDosing() {
    if (!state.concentrationMcgPerMl || !state.doseMcg) return null;

    state.doseMl = state.doseMcg / state.concentrationMcgPerMl;
    state.doseUnits = Math.round(state.doseMl * 1000) / 10;
    state.numDoses = Math.floor((state.vialMg * 1000) / state.doseMcg);

    const doseMlPractical = Math.round(state.doseMl * 1000) / 1000;

    return {
        doseMl: state.doseMl,
        doseMlPractical,
        doseUnits: state.doseUnits,
        numDoses: state.numDoses
    };
}


// ================================================================
// UI UPDATES - MIXING SCREEN
// ================================================================

function updateMixingUI() {
    const result = calculateMixing();
    if (!result) return;

    const mixDrawWaterEl = document.getElementById('mix-draw-water');
    const mixSyringeSizeEl = document.getElementById('mix-syringe-size');

    if (mixDrawWaterEl) mixDrawWaterEl.textContent = state.diluentMl.toFixed(1) + ' mL';
    if (mixSyringeSizeEl) mixSyringeSizeEl.textContent = state.mixingSyringeMl + ' mL';

    const concMg = result.concentrationMgPerMl;
    const concMcg = Math.round(result.concentrationMcgPerMl);

    const concText = `${concMg.toFixed(1)} mg/mL (or ${concMcg.toLocaleString()} mcg/mL)`;
    const finalConcEl = document.getElementById('final-concentration-text');
    if (finalConcEl) finalConcEl.textContent = concText;

    updateWaterMeter();
}

function updateWaterMeter() {
    const totalUnits = state.mixingSyringeUnits;
    const waterMl = state.diluentMl;
    const syringeMl = state.mixingSyringeMl;

    const drawsInfo = calculateDrawsNeeded(waterMl, syringeMl);

    document.getElementById('water-meter-draw').textContent = drawsInfo.displayText;

    document.getElementById('water-meter-syringe-label').textContent = syringeMl + ' mL';
    document.getElementById('water-meter-total-units').textContent = totalUnits;

    const visualContainer = document.getElementById('visual-draw-container');
    if (visualContainer) {
        renderSyringeVisual(visualContainer, state.diluentMl, state.mixingSyringeMl, state.mixingSyringeUnits);
    }
}

function calculateDrawsNeeded(targetMl, syringeMl) {
    const targetUnits = Math.round(targetMl * 100);
    const syringeUnits = Math.round(syringeMl * 100);

    if (targetMl <= syringeMl) {
        return {
            needsMultiple: false,
            totalUnits: targetUnits,
            displayText: `${targetUnits} units`,
            fullDraws: 1,
            partialUnits: 0,
            refillMessage: ''
        };
    }

    const fullDraws = Math.floor(targetUnits / syringeUnits);
    const partialUnits = targetUnits % syringeUnits;

    let refillMessage;
    if (partialUnits === 0) {
        refillMessage = fullDraws === 1
            ? "Fill up once with a full syringe"
            : `Fill up ${fullDraws} times with a full syringe`;
    } else {
        refillMessage = fullDraws === 1
            ? `Fill up once with a full syringe, then draw ${partialUnits} units`
            : `Fill up ${fullDraws} times with a full syringe, then draw ${partialUnits} units`;
    }

    return {
        needsMultiple: true,
        totalUnits: targetUnits,
        displayText: `${targetUnits} units`,
        fullDraws,
        partialUnits,
        refillMessage
    };
}


// ================================================================
// UI UPDATES - DOSING SCREEN
// ================================================================

function updateDosingUI() {
    document.getElementById('dose-vial-mg').textContent = state.vialMg;
    document.getElementById('dose-water-ml').textContent = state.diluentMl;
    // Concentration is shown in the variant's natural unit: mg/mL for GLP-1, mcg/mL for default.
    const concEl = document.getElementById('dose-concentration');
    if (VARIANT.dose_default_unit === 'mg') {
        const concMgPerMl = state.vialMg / state.diluentMl;
        concEl.textContent = concMgPerMl.toFixed(2);
    } else {
        concEl.textContent = Math.round(state.concentrationMcgPerMl);
    }

    const result = calculateDosing();
    if (!result) {
        document.getElementById('dosing-result').style.display = 'none';
        return;
    }

    document.getElementById('dosing-result').style.display = 'block';
    const mlAsInt = Math.round(result.doseMlPractical * 1000);
    const formattedMl = mlAsInt % 10 === 0
        ? result.doseMlPractical.toFixed(2)
        : result.doseMlPractical.toFixed(3);
    document.getElementById('result-dose-ml').textContent = formattedMl;

    const formattedUnits = Number.isInteger(result.doseUnits)
        ? result.doseUnits.toString()
        : result.doseUnits.toFixed(1);
    document.getElementById('result-dose-units').textContent = formattedUnits;

    // Display dose summary in current display unit.
    const displayDose = fromCanonicalMcg(state.doseMcg, state.doseUnit);
    const formattedDose = state.doseUnit === 'mg' ? formatMg(displayDose) : Math.round(displayDose);
    document.getElementById('summary-dose').textContent = formattedDose;
    const summaryUnitEl = document.getElementById('summary-dose-unit');
    if (summaryUnitEl) summaryUnitEl.textContent = state.doseUnit;

    document.getElementById('result-num-doses').textContent = result.numDoses;

    updateSyringeMeter(result);

    if (typeof ClearmixAnalytics !== 'undefined') {
        ClearmixAnalytics.resultsViewed({
            concentration: state.concentrationMcgPerMl,
            dose_ml: result.doseMlPractical,
            num_doses: result.numDoses
        });
    }
}


// ================================================================
// SYRINGE METER VISUALIZATION
// ================================================================

function updateSyringeMeter(result) {
    const container = document.getElementById('dose-visual-container');
    if (container) {
        renderSyringeVisual(container, result.doseMlPractical, state.dosingSyringeMl, state.dosingSyringeUnits);
    }

    const labelEl = document.getElementById('dose-meter-syringe-label');
    const unitsEl = document.getElementById('dose-meter-total-units');

    if (labelEl) labelEl.textContent = state.dosingSyringeMl + ' mL';
    if (unitsEl) unitsEl.textContent = state.dosingSyringeUnits;
}


// ================================================================
// SCREEN NAVIGATION
// ================================================================

function showScreen(screenName) {
    state.currentScreen = screenName;

    document.getElementById('mixing-screen').style.display = screenName === 'mixing' ? 'block' : 'none';
    document.getElementById('dosing-screen').style.display = screenName === 'dosing' ? 'block' : 'none';

    document.getElementById('mode-mixing-btn').classList.toggle('mode-btn--active', screenName === 'mixing');
    document.getElementById('mode-dosing-btn').classList.toggle('mode-btn--active', screenName === 'dosing');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (screenName === 'dosing') {
        calculateMixing();
        updateDosingUI();
    }
}


// ================================================================
// EVENT HANDLERS
// ================================================================

function initModeNav() {
    document.getElementById('mode-mixing-btn').addEventListener('click', () => showScreen('mixing'));
    document.getElementById('mode-dosing-btn').addEventListener('click', () => showScreen('dosing'));
    document.getElementById('go-to-dosing-btn').addEventListener('click', () => showScreen('dosing'));
    document.getElementById('back-to-mixing-btn').addEventListener('click', () => showScreen('mixing'));
    document.getElementById('edit-mixing-btn').addEventListener('click', () => showScreen('mixing'));
}

function initVialPresets() {
    const vialPresets = document.getElementById('vial-presets');
    const customInput = document.getElementById('custom-vial-input');
    const customField = document.getElementById('vial-mg-custom');

    vialPresets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        vialPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
        btn.classList.add('preset-btn--active');

        const value = btn.dataset.value;
        if (value === 'custom') {
            customInput.style.display = 'flex';
            customField.focus();
            const entered = parseFloat(customField.value);
            const validation = validateVialAmount(entered);
            state.vialMg = validation.correctedValue || null;
        } else {
            customInput.style.display = 'none';
            hideAlert('vial-alert-error');
            hideAlert('vial-alert-info');
            state.vialMg = parseFloat(value);
        }
        updateMixingUI();
    });

    customField.addEventListener('input', (e) => {
        const entered = parseFloat(e.target.value);
        const validation = validateVialAmount(entered);

        if (validation.correctedValue !== null && validation.correctedValue !== entered) {
            e.target.value = validation.correctedValue;
            state.vialMg = validation.correctedValue;
        } else {
            state.vialMg = entered || null;
        }

        if (validation.alertType === 'error') {
            e.target.classList.add('input--error');
        } else {
            e.target.classList.remove('input--error');
        }

        updateMixingUI();
    });

    customField.addEventListener('blur', (e) => {
        const entered = parseFloat(e.target.value);
        const validation = validateVialAmount(entered);

        if (validation.correctedValue !== null && validation.correctedValue !== entered) {
            e.target.value = validation.correctedValue;
            state.vialMg = validation.correctedValue;
            updateMixingUI();
        }
    });
}

function initWaterPresets() {
    const container = document.getElementById('water-presets');
    const customInput = document.getElementById('custom-water-input');
    const customField = document.getElementById('diluent-ml-custom');

    if (!container) return;

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        container.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
        btn.classList.add('preset-btn--active');

        const val = btn.dataset.value;

        if (val === 'custom') {
            customInput.style.display = 'flex';
            if (customField) {
                customField.focus();
                const currentVal = parseFloat(customField.value);
                if (!isNaN(currentVal)) {
                    state.diluentMl = currentVal;
                    updateMixingUI();
                }
            }
        } else {
            customInput.style.display = 'none';
            setWaterVolume(parseFloat(val));
        }
    });

    if (customField) {
        customField.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const validation = validateWaterVolume(val);

            if (!isNaN(val)) state.diluentMl = val;

            if (validation.alertType === 'error') {
                e.target.classList.add('input--error');
            } else {
                e.target.classList.remove('input--error');
            }
            updateMixingUI();
        });
    }
}

function initMixingSyringePresets() {
    const presets = document.getElementById('mixing-syringe-presets');
    const customInput = document.getElementById('custom-mixing-syringe-input');
    const customField = document.getElementById('mixing-syringe-custom');

    presets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        presets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
        btn.classList.add('preset-btn--active');

        const value = btn.dataset.value;
        if (value === 'custom') {
            customInput.style.display = 'flex';
            customField.focus();
            state.mixingSyringeMl = parseFloat(customField.value) || 1.0;
            state.mixingSyringeUnits = Math.round(state.mixingSyringeMl * 100);
        } else {
            customInput.style.display = 'none';
            state.mixingSyringeMl = parseFloat(value);
            state.mixingSyringeUnits = parseInt(btn.dataset.units) || Math.round(state.mixingSyringeMl * 100);
        }
        updateMixingUI();
    });

    if (customField) {
        customField.addEventListener('input', (e) => {
            state.mixingSyringeMl = parseFloat(e.target.value) || 1.0;
            state.mixingSyringeUnits = Math.round(state.mixingSyringeMl * 100);
            updateMixingUI();
        });
    }
}

function initDosingSyringePresets() {
    const presets = document.getElementById('dosing-syringe-presets');

    presets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        presets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
        btn.classList.add('preset-btn--active');
        state.dosingSyringeMl = parseFloat(btn.dataset.value);
        state.dosingSyringeUnits = parseInt(btn.dataset.units);
        updateDosingUI();
    });
}

function setDoseFromInput(displayValue) {
    if (isNaN(displayValue) || displayValue === null || displayValue === '') {
        state.doseMcg = null;
    } else {
        state.doseMcg = toCanonicalMcg(displayValue, state.doseUnit);
    }
    validateDoseMcg(state.doseMcg);
    updateDosingUI();
}

function initDoseInput() {
    const doseInput = document.getElementById('dose-mcg');
    doseInput.addEventListener('input', (e) => {
        const enteredValue = parseFloat(e.target.value);
        setDoseFromInput(enteredValue);
    });
}

function initDoseSuggestions() {
    const suggestions = document.getElementById('dose-suggestions');
    if (!suggestions) return;
    const doseInput = document.getElementById('dose-mcg');

    suggestions.addEventListener('click', (e) => {
        const chip = e.target.closest('.dose-suggestions__chip');
        if (!chip) return;

        const num = parseFloat(chip.dataset.value);
        // Suggestion values are stored in the variant's default unit.
        state.doseMcg = toCanonicalMcg(num, VARIANT.dose_default_unit);
        // Reflect canonical mcg back into the input in the *current* unit.
        const display = fromCanonicalMcg(state.doseMcg, state.doseUnit);
        doseInput.value = state.doseUnit === 'mg' ? formatMg(display) : Math.round(display);
        validateDoseMcg(state.doseMcg);
        updateDosingUI();
    });
}

function initDoseUnitToggle() {
    const toggle = document.getElementById('dose-unit-toggle');
    if (!toggle) return;
    const doseInput = document.getElementById('dose-mcg');
    const suffixEl = document.getElementById('dose-unit-suffix');

    toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.dose-unit-toggle__btn');
        if (!btn) return;

        const newUnit = btn.dataset.unit;
        if (newUnit === state.doseUnit) return;

        toggle.querySelectorAll('.dose-unit-toggle__btn').forEach(b => {
            b.classList.remove('dose-unit-toggle__btn--active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('dose-unit-toggle__btn--active');
        btn.setAttribute('aria-selected', 'true');

        state.doseUnit = newUnit;
        if (suffixEl) suffixEl.textContent = newUnit;

        // Re-render the input value in the new unit without losing canonical dose.
        if (state.doseMcg !== null && !isNaN(state.doseMcg)) {
            const display = fromCanonicalMcg(state.doseMcg, newUnit);
            doseInput.value = newUnit === 'mg' ? formatMg(display) : Math.round(display);
        }

        // Adjust input min/max/step for the new unit.
        const [lo, hi] = VARIANT.dose_input_range || [50, 1000];
        const inputMin = newUnit === VARIANT.dose_default_unit ? lo : fromCanonicalMcg(toCanonicalMcg(lo, VARIANT.dose_default_unit), newUnit);
        const inputMax = newUnit === VARIANT.dose_default_unit ? hi : fromCanonicalMcg(toCanonicalMcg(hi, VARIANT.dose_default_unit), newUnit);
        doseInput.min = inputMin;
        doseInput.max = inputMax;
        doseInput.step = newUnit === 'mg' ? 0.05 : 50;

        updateDosingUI();
    });
}


// ================================================================
// SHARED VISUAL RENDERER
// ================================================================

function renderSyringeVisual(container, targetMl, syringeMl, syringeTotalUnits) {
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'block';

    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'grid';
    gridWrapper.style.gridTemplateColumns = 'auto 1fr';
    gridWrapper.style.gap = '0.75rem 1rem';
    gridWrapper.style.alignItems = 'center';
    gridWrapper.style.width = '100%';
    gridWrapper.style.padding = '0 1.5rem';
    gridWrapper.style.boxSizing = 'border-box';

    container.appendChild(gridWrapper);

    const createGridRow = (multiplierText, fillPercent, labelText = null) => {
        const multiEl = document.createElement('div');
        multiEl.className = 'grid-multiplier';
        multiEl.textContent = multiplierText || '';
        gridWrapper.appendChild(multiEl);

        const syringeArea = document.createElement('div');
        syringeArea.className = 'grid-syringe-area';

        const syringe = document.createElement('div');
        syringe.className = 'mini-syringe';
        if (fillPercent >= 100) {
            syringe.classList.add('mini-syringe--full');
        } else {
            syringe.style.setProperty('--fill', `${fillPercent}%`);
        }
        syringeArea.appendChild(syringe);

        if (labelText) {
            const label = document.createElement('div');
            label.className = 'mini-syringe-label';
            label.textContent = labelText;
            syringeArea.appendChild(label);
            syringeArea.style.height = 'auto';
            syringe.style.height = '32px';
        }

        gridWrapper.appendChild(syringeArea);
    };

    const drawsInfo = calculateDrawsNeeded(targetMl, syringeMl);

    if (!drawsInfo.needsMultiple) {
        const singleFillPercent = (targetMl / syringeMl) * 100;
        createGridRow('', singleFillPercent, null);
    } else {
        if (drawsInfo.fullDraws > 0) {
            createGridRow(`${drawsInfo.fullDraws} ×`, 100);
        }
        if (drawsInfo.partialUnits > 0) {
            const partialFillPercent = (drawsInfo.partialUnits / syringeTotalUnits) * 100;
            createGridRow('+', partialFillPercent, `${drawsInfo.partialUnits} units`);
        }
    }

    const emptyCell = document.createElement('div');
    gridWrapper.appendChild(emptyCell);

    const scaleRow = document.createElement('div');
    scaleRow.className = 'grid-scale-row';

    const isSmallSyringe = syringeTotalUnits <= 50;

    const createLabel = (value, position, isFirst, isLast) => {
        const tick = document.createElement('div');
        tick.className = 'scale-tick-label';
        tick.style.left = `${position}%`;
        tick.textContent = value;

        if (isFirst) {
            tick.style.transform = 'translateX(0)';
            tick.style.left = '0';
        } else if (isLast) {
            tick.style.transform = 'translateX(-100%)';
            tick.style.left = '100%';
        }
        return tick;
    };

    if (isSmallSyringe) {
        for (let i = 0; i <= syringeTotalUnits; i++) {
            const position = (i / syringeTotalUnits) * 100;

            if (i % 5 === 0) {
                const isFirst = (i === 0);
                const isLast = (i === syringeTotalUnits);
                const tick = createLabel(i, position, isFirst, isLast);
                scaleRow.appendChild(tick);
            } else {
                const minor = document.createElement('div');
                minor.className = 'scale-tick-minor';
                minor.style.left = `${position}%`;
                scaleRow.appendChild(minor);
            }
        }
    } else {
        const tickStep = 10;
        for (let i = 0; i <= syringeTotalUnits; i += tickStep) {
            const position = (i / syringeTotalUnits) * 100;
            const isFirst = (i === 0);
            const isLast = (i === syringeTotalUnits);
            const tick = createLabel(i, position, isFirst, isLast);
            scaleRow.appendChild(tick);

            if (i + 5 <= syringeTotalUnits) {
                const minor = document.createElement('div');
                minor.className = 'scale-tick-minor';
                minor.style.left = `${((i + 5) / syringeTotalUnits) * 100}%`;
                scaleRow.appendChild(minor);
            }
        }
    }
    gridWrapper.appendChild(scaleRow);
}


// ================================================================
// INITIALIZATION
// ================================================================

function syncStateFromDOM() {
    const activeVialBtn = document.querySelector('#vial-presets .preset-btn--active');
    if (activeVialBtn) state.vialMg = parseFloat(activeVialBtn.dataset.value);

    const activeWaterBtn = document.querySelector('#water-presets .preset-btn--active');
    if (activeWaterBtn) state.diluentMl = parseFloat(activeWaterBtn.dataset.value);

    const activeMixSyringeBtn = document.querySelector('#mixing-syringe-presets .preset-btn--active');
    if (activeMixSyringeBtn) {
        state.mixingSyringeMl = parseFloat(activeMixSyringeBtn.dataset.value);
        state.mixingSyringeUnits = parseInt(activeMixSyringeBtn.dataset.units);
    }

    const activeDoseSyringeBtn = document.querySelector('#dosing-syringe-presets .preset-btn--active');
    if (activeDoseSyringeBtn) {
        state.dosingSyringeMl = parseFloat(activeDoseSyringeBtn.dataset.value);
        state.dosingSyringeUnits = parseInt(activeDoseSyringeBtn.dataset.units);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initModeNav();
    initVialPresets();
    initWaterPresets();
    initMixingSyringePresets();
    initDosingSyringePresets();
    initDoseInput();
    initDoseSuggestions();
    initDoseUnitToggle();

    syncStateFromDOM();
    updateMixingUI();

    console.log('✅ Two-screen calculator initialized');
});

// Expose helpers for tests / debugging.
if (typeof window !== 'undefined') {
    window.Clearmix = {
        mgToMcg, mcgToMg, formatMg, toCanonicalMcg, fromCanonicalMcg, VARIANT
    };
}
