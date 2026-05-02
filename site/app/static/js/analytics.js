/**
 * Clearmix Analytics Module
 * Wrapper for Google Analytics event tracking
 * 
 * Events defined per PRD EPIC 1:
 * - session_start (automatic via GA)
 * - goal_selected
 * - inputs_validated
 * - results_viewed
 * - step_cards_viewed
 * - flow_completed
 * - edit_inputs_from_results
 * - guardrail_triggered
 * - guardrail_action_taken
 * - recalc_completed
 */

const ClearmixAnalytics = {
    // Session ID for grouping events
    sessionId: null,

    init() {
        this.sessionId = this.getOrCreateSessionId();
        console.log('📊 Clearmix Analytics initialized, session:', this.sessionId);
    },

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('clearmix_session_id');
        if (!sessionId) {
            sessionId = 'cm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('clearmix_session_id', sessionId);
        }
        return sessionId;
    },

    // Core tracking function
    track(eventName, params = {}) {
        if (typeof trackEvent === 'function') {
            trackEvent(eventName, {
                session_id: this.sessionId,
                ...params
            });
        }
    },

    // ===== Funnel Events =====

    goalSelected(goalType) {
        // goalType: 'dose_first' | 'doses_per_vial'
        this.track('goal_selected', { goal_type: goalType });
    },

    inputsValidated(inputs) {
        // inputs: { vial_mg, diluent_ml, dose_mg?, num_doses?, syringe_type }
        this.track('inputs_validated', {
            has_vial_mg: !!inputs.vial_mg,
            has_diluent: !!inputs.diluent_ml,
            has_dose: !!inputs.dose_mg,
            has_num_doses: !!inputs.num_doses,
            syringe_type: inputs.syringe_type
        });
    },

    resultsViewed(results) {
        // results: { concentration, dose_ml, num_doses }
        this.track('results_viewed', {
            concentration: results.concentration,
            dose_ml: results.dose_ml,
            num_doses: results.num_doses
        });
    },

    stepCardsViewed() {
        this.track('step_cards_viewed');
    },

    flowCompleted() {
        this.track('flow_completed');
    },

    // ===== Action Events =====

    editInputsFromResults() {
        this.track('edit_inputs_from_results');
    },

    guardrailTriggered(guardrailType) {
        // guardrailType: 'capacity_exceeded' | 'syringe_too_small' | 'outlier_concentration'
        this.track('guardrail_triggered', { guardrail_type: guardrailType });
    },

    guardrailActionTaken(action) {
        // action: 'applied_fix' | 'dismissed' | 'changed_input'
        this.track('guardrail_action_taken', { action: action });
    },

    recalcCompleted(actualDiluent) {
        this.track('recalc_completed', { actual_diluent_ml: actualDiluent });
    },

    // ===== Utility Events =====

    copyValue(valueType) {
        // valueType: 'concentration' | 'dose_ml' | 'dose_units'
        this.track('copy_value_clicked', { value_type: valueType });
    },

    tooltipOpened(tooltipId) {
        this.track('help_tooltip_opened', { tooltip_id: tooltipId });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ClearmixAnalytics.init();
});
