/**
 * Clearmix Calculator - Two Screen Mode
 * 
 * Screen 1: Mixing (Reconstitution)
 * Screen 2: Dosing
 */

console.log('🧪 Clearmix calculator loaded');

// ================================================================
// STATE
// ================================================================

const state = {
    // Mixing screen
    vialMg: 10,
    diluentMl: 2.0,
    mixingSyringeMl: 1.0,
    mixingSyringeUnits: 100,

    // Dosing screen
    doseMcg: null,
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

const CONSTRAINTS = {
    water: {
        min: 1,
        max: 10,
        unit: 'mL'
    },
    dose: {
        min: 1,
        cautionThreshold: 500,  // Friendly reminder
        warningThreshold: 1000, // High dose warning
        unit: 'mcg'
    },
    vial: {
        min: 0.1,          // smallest allowed entry (prevent zero)
        commonMin: 5,      // typical lower bound
        commonMax: 10,     // typical upper bound
        max: 30,           // absolute maximum supported
        unit: 'mg'
    }
};


// ================================================================
// VALIDATION FUNCTIONS
// ================================================================

/**
 * Validate water volume input
 * @param {number} value - The entered water volume
 * @returns {object} - { valid, correctedValue, alertType, message }
 */
function validateWaterVolume(value) {
    const { min, max } = CONSTRAINTS.water;

    // Clear previous alerts
    hideAlert('water-alert-error');
    hideAlert('water-alert-info');

    if (value === null || value === undefined || isNaN(value)) {
        return { valid: false, correctedValue: null, alertType: null, message: null };
    }

    // Under minimum (negative or less than 1)
    if (value < min) {
        showAlert('water-alert-error', `Water volume must be at least ${min} mL. Setting to ${min} mL.`);
        state.validationErrors.water = true;
        return {
            valid: false,
            correctedValue: min,
            alertType: 'error',
            message: `Water volume must be at least ${min} mL.`
        };
    }

    // Over maximum
    if (value > max) {
        showAlert('water-alert-info', `${max} mL is the maximum Clearmix supports. Setting to ${max} mL.`);
        state.validationErrors.water = false; // Info, not error - calculations can proceed
        return {
            valid: true,
            correctedValue: max,
            alertType: 'info',
            message: `Maximum is ${max} mL.`
        };
    }

    // Valid
    state.validationErrors.water = false;
    return { valid: true, correctedValue: value, alertType: null, message: null };
}

/**
 * Validate dose input
 * @param {number} value - The entered dose in mcg
 * @returns {object} - { valid, alertType, message }
 */
function validateDose(value) {
    const { cautionThreshold, warningThreshold } = CONSTRAINTS.dose;

    // Clear previous alerts
    hideAlert('dose-alert-info');
    hideAlert('dose-alert-warning');

    if (value === null || value === undefined || isNaN(value) || value <= 0) {
        state.validationErrors.dose = false;
        return { valid: true, alertType: null, message: null };
    }

    // High dose warning (above 1000 mcg) - Orange warning
    if (value > warningThreshold) {
        showAlert('dose-alert-warning', `⚠️ ${value} mcg is a high dosage for those new to self-administering peptides. Please verify with your prescriber.`);
        state.validationErrors.dose = false; // Warning only, calculations proceed
        return {
            valid: true,
            alertType: 'warning',
            message: 'High dosage warning'
        };
    }

    // Caution threshold (above 500 mcg) - Yellow info
    if (value > cautionThreshold) {
        showAlert('dose-alert-info', `💡 Most common peptide doses are up to ${cautionThreshold} mcg. Double-check your prescription if unsure.`);
        state.validationErrors.dose = false;
        return {
            valid: true,
            alertType: 'info',
            message: 'Check prescription reminder'
        };
    }

    // Valid, no warnings
    state.validationErrors.dose = false;
    return { valid: true, alertType: null, message: null };
}

/**
 * Validate the amount of peptide in the vial (mg).
 * Rules:
 *   - No zero or negative values.
 *   - 5‑10 mg is the common range – valid with no alert.
 *   - >10 mg up to 30 mg → info alert asking user to double‑check.
 *   - >30 mg → error alert, clamp to 30 mg (expert/industrial use).
 */
function validateVialAmount(value) {
    const { min, commonMin, commonMax, max } = CONSTRAINTS.vial;
    hideAlert('vial-alert-error');
    hideAlert('vial-alert-info');

    if (value === null || value === undefined || isNaN(value)) {
        return { valid: false, correctedValue: null, alertType: null, message: null };
    }
    const v = Number(value);

    // Non-positive check
    if (v <= 0) {
        showAlert('vial-alert-error', `Vial amount must be a positive number.`);
        return { valid: false, correctedValue: null, alertType: 'error', message: 'Non‑positive vial amount' };
    }

    // Absolute max check
    if (v > max) {
        showAlert('vial-alert-error', `Maximum supported vial amount is ${max} mg. Resetting to ${max} mg.`);
        return { valid: false, correctedValue: max, alertType: 'error', message: 'Exceeded max vial amount' };
    }

    // Common range check (above 10mg)
    if (v > commonMax) {
        showAlert('vial-alert-info', `Vial amount ${v} mg is above the typical 5‑10 mg range. Please double‑check your prescription.`);
        return { valid: true, correctedValue: v, alertType: 'info', message: 'Above common range' };
    }

    // Within common range (5-10mg) or small usage (0.1-5mg) - no alerts
    return { valid: true, correctedValue: v, alertType: null, message: null };
}

/**
 * Show an inline alert
 */
function showAlert(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('inline-alert--visible');
    }
}

/**
 * Hide an inline alert
 */
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
    state.doseUnits = Math.round(state.doseMl * 100);
    state.numDoses = Math.floor((state.vialMg * 1000) / state.doseMcg);

    // Practical rounding
    const doseMlPractical = Math.round(state.doseMl * 100) / 100;

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

    // Update mixing instructions
    document.getElementById('mix-draw-water').textContent = state.diluentMl.toFixed(1) + ' mL';
    document.getElementById('mix-syringe-size').textContent = state.mixingSyringeMl + ' mL';

    // Update concentration display
    document.getElementById('mix-concentration').textContent = Math.round(result.concentrationMcgPerMl);
    document.getElementById('mix-concentration-mg').textContent = result.concentrationMgPerMl.toFixed(1);

    // Update water meter
    updateWaterMeter();
}

function updateWaterMeter() {
    const totalUnits = state.mixingSyringeUnits;
    const waterMl = state.diluentMl;
    const syringeMl = state.mixingSyringeMl;

    // Calculate fill percentage (cap at 100%)
    const fillPercent = Math.min((waterMl / syringeMl) * 100, 100);

    // Calculate draws needed
    const drawsInfo = calculateDrawsNeeded(waterMl, syringeMl);

    // Update meter title with draws info
    document.getElementById('water-meter-draw').textContent = drawsInfo.displayText;

    // Update fill bar and marker
    document.getElementById('water-meter-fill').style.width = fillPercent + '%';
    document.getElementById('water-meter-marker').style.left = Math.min(fillPercent, 100) + '%';

    // Update syringe info
    document.getElementById('water-meter-syringe-label').textContent = syringeMl + ' mL';
    document.getElementById('water-meter-total-units').textContent = totalUnits;

    // Show/hide multiple draws warning
    const infoEl = document.getElementById('water-meter-draws-info');
    if (infoEl) {
        if (drawsInfo.needsMultiple) {
            infoEl.textContent = drawsInfo.instruction;
            infoEl.style.display = 'block';
        } else {
            infoEl.style.display = 'none';
        }
    }

    // Generate scale ticks for water meter
    generateWaterMeterScale(totalUnits);
}

/**
 * Calculate how many draws are needed and provide a simple recommendation
 */
function calculateDrawsNeeded(targetMl, syringeMl) {
    if (targetMl <= syringeMl) {
        // Single draw fits in syringe
        return {
            needsMultiple: false,
            displayText: targetMl.toFixed(1) + ' mL',
            instruction: ''
        };
    }

    // Need multiple draws
    const fullDraws = Math.floor(targetMl / syringeMl);
    const remainder = Math.round((targetMl - (fullDraws * syringeMl)) * 100) / 100;

    let instruction;
    if (remainder === 0) {
        // Exact multiple (e.g., 2 mL with 0.5 mL syringe = 4 full draws)
        instruction = `${fullDraws} × ${syringeMl} mL`;
    } else {
        // Has remainder (e.g., 2 mL with 0.3 mL syringe = 6 × 0.3 + 0.2)
        instruction = `${fullDraws} × ${syringeMl} mL + 1 × ${remainder.toFixed(1)} mL`;
    }

    return {
        needsMultiple: true,
        displayText: targetMl.toFixed(1) + ' mL total',
        instruction: instruction
    };
}

function generateWaterMeterScale(totalUnits) {
    const scaleContainer = document.getElementById('water-meter-scale');
    scaleContainer.innerHTML = '';

    // Determine tick interval based on total units
    let majorInterval, minorInterval;

    if (totalUnits <= 50) {
        majorInterval = 10;
        minorInterval = 5;
    } else if (totalUnits <= 100) {
        majorInterval = 20;
        minorInterval = 10;
    } else {
        majorInterval = 50;
        minorInterval = 25;
    }

    // Generate ticks
    for (let i = 0; i <= totalUnits; i += minorInterval) {
        const isMajor = i % majorInterval === 0;
        const tick = document.createElement('div');
        tick.className = 'syringe-meter__tick' + (isMajor ? ' syringe-meter__tick--major' : '');

        tick.innerHTML = `
            <div class="syringe-meter__tick-line"></div>
            ${isMajor ? `<span class="syringe-meter__tick-label">${i}</span>` : ''}
        `;

        scaleContainer.appendChild(tick);
    }
}


// ================================================================
// UI UPDATES - DOSING SCREEN
// ================================================================

function updateDosingUI() {
    // Update the "Your Mixed Vial" summary
    document.getElementById('dose-vial-mg').textContent = state.vialMg;
    document.getElementById('dose-water-ml').textContent = state.diluentMl;
    document.getElementById('dose-concentration').textContent = Math.round(state.concentrationMcgPerMl);

    const result = calculateDosing();
    if (!result) {
        document.getElementById('dosing-result').style.display = 'none';
        return;
    }

    // Show and update results
    document.getElementById('dosing-result').style.display = 'block';
    document.getElementById('result-dose-ml').textContent = result.doseMlPractical.toFixed(2);
    document.getElementById('result-dose-units').textContent = result.doseUnits;
    document.getElementById('summary-dose').textContent = state.doseMcg;
    document.getElementById('result-num-doses').textContent = result.numDoses;

    // Update syringe meter
    updateSyringeMeter(result);

    // Analytics
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
    const totalUnits = state.dosingSyringeUnits;
    const fillUnits = result.doseUnits;
    const fillPercent = Math.min((fillUnits / totalUnits) * 100, 100);

    // Update meter title
    document.getElementById('meter-dose').textContent = state.doseMcg;
    document.getElementById('meter-draw-line').textContent = fillUnits + ' units';

    // Update fill bar and marker
    document.getElementById('meter-fill').style.width = fillPercent + '%';
    document.getElementById('meter-marker').style.left = fillPercent + '%';

    // Update syringe info
    document.getElementById('meter-syringe-label').textContent = state.dosingSyringeMl + ' mL';
    document.getElementById('meter-total-units').textContent = totalUnits;

    // Generate scale ticks
    generateMeterScale(totalUnits);
}

function generateMeterScale(totalUnits) {
    const scaleContainer = document.getElementById('meter-scale');
    scaleContainer.innerHTML = '';

    // Determine tick interval based on syringe size
    let majorInterval = 10;
    let minorInterval = 5;

    if (totalUnits === 30) {
        majorInterval = 5;
        minorInterval = 1;
    }

    // Generate ticks
    for (let i = 0; i <= totalUnits; i += minorInterval) {
        const isMajor = i % majorInterval === 0;
        const tick = document.createElement('div');
        tick.className = 'syringe-meter__tick' + (isMajor ? ' syringe-meter__tick--major' : '');

        tick.innerHTML = `
            <div class="syringe-meter__tick-line"></div>
            ${isMajor ? `<span class="syringe-meter__tick-label">${i}</span>` : ''}
        `;

        scaleContainer.appendChild(tick);
    }
}


// ================================================================
// SCREEN NAVIGATION
// ================================================================

function showScreen(screenName) {
    state.currentScreen = screenName;

    // Toggle screens
    document.getElementById('mixing-screen').style.display = screenName === 'mixing' ? 'block' : 'none';
    document.getElementById('dosing-screen').style.display = screenName === 'dosing' ? 'block' : 'none';

    // Update nav buttons
    document.getElementById('mode-mixing-btn').classList.toggle('mode-btn--active', screenName === 'mixing');
    document.getElementById('mode-dosing-btn').classList.toggle('mode-btn--active', screenName === 'dosing');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update dosing screen with latest mixing data
    if (screenName === 'dosing') {
        calculateMixing(); // Ensure concentration is calculated
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
            // Preset values are safe, clear alerts
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

        // Add/remove error style
        if (validation.alertType === 'error') {
            e.target.classList.add('input--error');
        } else {
            e.target.classList.remove('input--error');
        }

        updateMixingUI();
    });

    // Validate on blur
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
    const waterPresets = document.getElementById('water-presets');
    const customInput = document.getElementById('custom-water-input');
    const customField = document.getElementById('diluent-ml-custom');

    waterPresets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;

        waterPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
        btn.classList.add('preset-btn--active');

        const value = btn.dataset.value;
        if (value === 'custom') {
            customInput.style.display = 'flex';
            customField.focus();
            // Validate current value
            const enteredValue = parseFloat(customField.value);
            const validation = validateWaterVolume(enteredValue);
            state.diluentMl = validation.correctedValue || null;
        } else {
            customInput.style.display = 'none';
            // Preset values are always valid, clear alerts
            hideAlert('water-alert-error');
            hideAlert('water-alert-info');
            state.diluentMl = parseFloat(value);
        }
        updateMixingUI();
    });

    customField.addEventListener('input', (e) => {
        const enteredValue = parseFloat(e.target.value);
        const validation = validateWaterVolume(enteredValue);

        if (validation.correctedValue !== null && validation.correctedValue !== enteredValue) {
            // Value was corrected - update the input field
            e.target.value = validation.correctedValue;
            state.diluentMl = validation.correctedValue;
        } else {
            state.diluentMl = enteredValue || null;
        }

        // Add/remove error class on input
        if (validation.alertType === 'error') {
            e.target.classList.add('input--error');
        } else {
            e.target.classList.remove('input--error');
        }

        updateMixingUI();
    });

    // Also validate on blur (when leaving field)
    customField.addEventListener('blur', (e) => {
        const enteredValue = parseFloat(e.target.value);
        const validation = validateWaterVolume(enteredValue);

        if (validation.correctedValue !== null && validation.correctedValue !== enteredValue) {
            e.target.value = validation.correctedValue;
            state.diluentMl = validation.correctedValue;
            updateMixingUI();
        }
    });
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

function initDoseInput() {
    const doseInput = document.getElementById('dose-mcg');
    doseInput.addEventListener('input', (e) => {
        const enteredValue = parseFloat(e.target.value);
        state.doseMcg = enteredValue || null;

        // Validate and show appropriate alerts
        validateDose(enteredValue);

        updateDosingUI();
    });
}


// ================================================================
// INITIALIZATION
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    initModeNav();
    initVialPresets();
    initWaterPresets();
    initMixingSyringePresets();
    initDosingSyringePresets();
    initDoseInput();

    // Initial UI update
    updateMixingUI();

    console.log('✅ Two-screen calculator initialized');
});
