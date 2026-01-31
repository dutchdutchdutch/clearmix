/**
 * Clearmix Calculator - Two Screen Mode
 * 
 * Screen 1: Mixing (Reconstitution)
 * Screen 2: Dosing (Self-administration)
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
        min: 0.5,
        max: 10,
        unit: 'mL'
    },
    dose: {
        min: 1,
        cautionThreshold: 500,  // Friendly reminder
        max: 1000,              // Maximum supported dose
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
 * Set the water volume directly (e.g. from presets)
 * @param {number} vol - Volume in mL
 */
function setWaterVolume(vol) {
    state.diluentMl = vol;
    state.validationErrors.water = false;
    updateMixingUI();
}

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
    const { cautionThreshold, max } = CONSTRAINTS.dose;

    // Clear previous alerts
    hideAlert('dose-alert-info');
    hideAlert('dose-alert-warning');

    if (value === null || value === undefined || isNaN(value) || value <= 0) {
        state.validationErrors.dose = false;
        return { valid: true, correctedValue: null, alertType: null, message: null };
    }

    // Over maximum - reset to max with friendly message
    if (value > max) {
        showAlert('dose-alert-info', `🏥 Clearmix supports doses up to ${max} mcg. For higher amounts, please consult your prescriber for detailed instructions.`);
        state.validationErrors.dose = false;
        return {
            valid: true,
            correctedValue: max,
            alertType: 'info',
            message: `Maximum supported is ${max} mcg.`
        };
    }

    // Caution threshold (above 500 mcg) - Yellow info
    if (value > cautionThreshold) {
        showAlert('dose-alert-info', `💡 Most common peptide doses are up to ${cautionThreshold} mcg. Double-check your prescription if unsure.`);
        state.validationErrors.dose = false;
        return {
            valid: true,
            correctedValue: null,
            alertType: 'info',
            message: 'Check prescription reminder'
        };
    }

    // Valid, no warnings
    state.validationErrors.dose = false;
    return { valid: true, correctedValue: null, alertType: null, message: null };
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
    // Round to 0.1 unit precision (e.g., 2.5 units)
    state.doseUnits = Math.round(state.doseMl * 1000) / 10;
    state.numDoses = Math.floor((state.vialMg * 1000) / state.doseMcg);

    // Practical rounding to 0.001 mL (3 decimal places)
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

    // Update mixing instructions (if elements exist - some were removed in layout restructure)
    const mixDrawWaterEl = document.getElementById('mix-draw-water');
    const mixSyringeSizeEl = document.getElementById('mix-syringe-size');

    if (mixDrawWaterEl) {
        mixDrawWaterEl.textContent = state.diluentMl.toFixed(1) + ' mL';
    }
    if (mixSyringeSizeEl) {
        mixSyringeSizeEl.textContent = state.mixingSyringeMl + ' mL';
    }

    // Update concentration display
    // Update concentration display (Step 4 secondary text)
    const concMg = result.concentrationMgPerMl;
    const concMcg = Math.round(result.concentrationMcgPerMl);

    // Format: 10.0 mg/mL (or 10,000 mcg/mL)
    const concText = `${concMg.toFixed(1)} mg/mL (or ${concMcg.toLocaleString()} mcg/mL)`;
    const finalConcEl = document.getElementById('final-concentration-text');
    if (finalConcEl) {
        finalConcEl.textContent = concText;
    }

    // Update water meter - this is the primary display now
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

    // Update meter title with units-based display
    document.getElementById('water-meter-draw').textContent = drawsInfo.displayText;

    // Update syringe info
    document.getElementById('water-meter-syringe-label').textContent = syringeMl + ' mL';
    document.getElementById('water-meter-total-units').textContent = totalUnits;

    // --- VISUAL INSTRUCTIONS RENDERER ---
    // --- VISUAL INSTRUCTIONS RENDERER ---
    const visualContainer = document.getElementById('visual-draw-container');

    if (visualContainer) {
        renderSyringeVisual(visualContainer, state.diluentMl, state.mixingSyringeMl, state.mixingSyringeUnits);
    }
}

/**
 * Calculate how many draws are needed and provide accurate, user-friendly instructions
 * @param {number} targetMl - Total water volume needed in mL
 * @param {number} syringeMl - Syringe capacity in mL
 * @returns {object} - Draw information with unit-based display
 */
function calculateDrawsNeeded(targetMl, syringeMl) {
    // Convert to units (1 mL = 100 units)
    const targetUnits = Math.round(targetMl * 100);
    const syringeUnits = Math.round(syringeMl * 100);

    if (targetMl <= syringeMl) {
        // Single draw fits in syringe
        return {
            needsMultiple: false,
            totalUnits: targetUnits,
            displayText: `${targetUnits} units`,
            fullDraws: 1,
            partialUnits: 0,
            refillMessage: ''
        };
    }

    // Calculate full draws and remainder
    const fullDraws = Math.floor(targetUnits / syringeUnits);
    const partialUnits = targetUnits % syringeUnits;

    // Create accurate, friendly message
    let refillMessage;

    if (partialUnits === 0) {
        // Exact multiple - all full draws
        if (fullDraws === 1) {
            refillMessage = "Fill up once with a full syringe";
        } else {
            refillMessage = `Fill up ${fullDraws} times with a full syringe`;
        }
    } else {
        // Has partial draw at the end
        if (fullDraws === 1) {
            refillMessage = `Fill up once with a full syringe, then draw ${partialUnits} units`;
        } else {
            refillMessage = `Fill up ${fullDraws} times with a full syringe, then draw ${partialUnits} units`;
        }
    }

    return {
        needsMultiple: true,
        totalUnits: targetUnits,
        displayText: `${targetUnits} units`,
        fullDraws: fullDraws,
        partialUnits: partialUnits,
        refillMessage: refillMessage
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
    // Format mL: show 0.025 or 0.05 (not 0.050)
    // Use integer comparison to avoid floating-point precision issues
    const mlAsInt = Math.round(result.doseMlPractical * 1000);
    const formattedMl = mlAsInt % 10 === 0
        ? result.doseMlPractical.toFixed(2)
        : result.doseMlPractical.toFixed(3);
    document.getElementById('result-dose-ml').textContent = formattedMl;
    // Format units: show 2.5 or 5 (not 5.0)
    const formattedUnits = Number.isInteger(result.doseUnits) ? result.doseUnits.toString() : result.doseUnits.toFixed(1);
    document.getElementById('result-dose-units').textContent = formattedUnits;
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
    // 1. Render Visual
    const container = document.getElementById('dose-visual-container');
    if (container) {
        renderSyringeVisual(container, result.doseMlPractical, state.dosingSyringeMl, state.dosingSyringeUnits);
    }

    // 2. Update Info Text
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
            if (customField) customField.focus();
        } else {
            customInput.style.display = 'none';
            setWaterVolume(parseFloat(val));
        }
    });

    if (customField) {
        customField.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const validation = validateWaterVolume(val);

            // Only update state if valid or purely typing
            // (We handle validation errors visually via validation result)
            if (!isNaN(val)) {
                state.diluentMl = val;
            }

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

function initDoseInput() {
    const doseInput = document.getElementById('dose-mcg');
    doseInput.addEventListener('input', (e) => {
        const enteredValue = parseFloat(e.target.value);

        // Validate and show appropriate alerts
        const validation = validateDose(enteredValue);

        // If there's a correctedValue (e.g., max exceeded), reset the input
        if (validation.correctedValue !== null && validation.correctedValue !== undefined) {
            e.target.value = validation.correctedValue;
            state.doseMcg = validation.correctedValue;
        } else {
            state.doseMcg = enteredValue || null;
        }

        updateDosingUI();
    });
}


// ================================================================
// SHARED VISUAL RENDERER
// ================================================================

/**
 * Renders a visual syringe meter into the specified container.
 * @param {HTMLElement} container - The container element (grid).
 * @param {number} targetMl - The amount to draw in mL.
 * @param {number} syringeMl - The syringe capacity in mL.
 * @param {number} syringeTotalUnits - The syringe capacity in Units (e.g. 100).
 */
function renderSyringeVisual(container, targetMl, syringeMl, syringeTotalUnits) {
    if (!container) return;

    container.innerHTML = ''; // Clear previous
    container.style.display = 'block'; // Ensure container is visible (grid is now internal)
    // container.style.display = 'grid'; // REMOVED - using inner wrapper instead

    // Create inner grid wrapper with padding for breathing room
    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'grid';
    gridWrapper.style.gridTemplateColumns = 'auto 1fr';
    gridWrapper.style.gap = '0.75rem 1rem';
    gridWrapper.style.alignItems = 'center';
    gridWrapper.style.width = '100%';
    gridWrapper.style.padding = '0 1.5rem'; // Padding for Option A
    gridWrapper.style.boxSizing = 'border-box';

    container.appendChild(gridWrapper);

    // Helper to create a Grid Row
    const createGridRow = (multiplierText, fillPercent, labelText = null) => {
        // Col 1: Multiplier
        const multiEl = document.createElement('div');
        multiEl.className = 'grid-multiplier';
        multiEl.textContent = multiplierText || '';
        gridWrapper.appendChild(multiEl);

        // Col 2: Syringe Content
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

        // Label (optional)
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

    // Calculate draws needed
    const drawsInfo = calculateDrawsNeeded(targetMl, syringeMl);

    // Render Rows
    if (!drawsInfo.needsMultiple) {
        const singleFillPercent = (targetMl / syringeMl) * 100;
        createGridRow('', singleFillPercent, null);
    } else {
        // Multiple Draws
        if (drawsInfo.fullDraws > 0) {
            createGridRow(`${drawsInfo.fullDraws} ×`, 100);
        }
        if (drawsInfo.partialUnits > 0) {
            const partialFillPercent = (drawsInfo.partialUnits / syringeTotalUnits) * 100;
            createGridRow('+', partialFillPercent, `${drawsInfo.partialUnits} units`);
        }
    }

    // Render Scale Axis Row
    const emptyCell = document.createElement('div');
    gridWrapper.appendChild(emptyCell);

    const scaleRow = document.createElement('div');
    scaleRow.className = 'grid-scale-row';

    // Scale configuration based on syringe size
    // For 30/50 units: tick every unit, label every 5
    // For 100 units: tick every 10, minor every 5
    const isSmallSyringe = syringeTotalUnits <= 50;

    // Helper to create a positioned label with appropriate alignment
    const createLabel = (value, position, isFirst, isLast) => {
        const tick = document.createElement('div');
        tick.className = 'scale-tick-label';
        tick.style.left = `${position}%`;
        tick.textContent = value;

        // Adjust alignment for edge labels to prevent clipping
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
        // Granular scale for 0.3mL (30 units) and 0.5mL (50 units)
        // Tick mark for every unit, labels at multiples of 5
        for (let i = 0; i <= syringeTotalUnits; i++) {
            const position = (i / syringeTotalUnits) * 100;

            if (i % 5 === 0) {
                // Major tick with label (every 5 units)
                const isFirst = (i === 0);
                const isLast = (i === syringeTotalUnits);
                const tick = createLabel(i, position, isFirst, isLast);
                scaleRow.appendChild(tick);
            } else {
                // Minor tick (every unit between labels)
                const minor = document.createElement('div');
                minor.className = 'scale-tick-minor';
                minor.style.left = `${position}%`;
                scaleRow.appendChild(minor);
            }
        }
    } else {
        // Standard scale for 1mL (100 units): labels every 10, minors every 5
        const tickStep = 10;
        for (let i = 0; i <= syringeTotalUnits; i += tickStep) {
            // Major Tick
            const position = (i / syringeTotalUnits) * 100;
            const isFirst = (i === 0);
            const isLast = (i === syringeTotalUnits);
            const tick = createLabel(i, position, isFirst, isLast);
            scaleRow.appendChild(tick);

            // Minor Tick (Halfway)
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
