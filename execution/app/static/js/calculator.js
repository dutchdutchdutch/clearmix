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
    currentScreen: 'mixing'
};


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
            state.vialMg = parseFloat(customField.value) || null;
        } else {
            customInput.style.display = 'none';
            state.vialMg = parseFloat(value);
        }
        updateMixingUI();
    });

    customField.addEventListener('input', (e) => {
        state.vialMg = parseFloat(e.target.value) || null;
        updateMixingUI();
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
            state.diluentMl = parseFloat(customField.value) || null;
        } else {
            customInput.style.display = 'none';
            state.diluentMl = parseFloat(value);
        }
        updateMixingUI();
    });

    customField.addEventListener('input', (e) => {
        state.diluentMl = parseFloat(e.target.value) || null;
        updateMixingUI();
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
        state.doseMcg = parseFloat(e.target.value) || null;
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
