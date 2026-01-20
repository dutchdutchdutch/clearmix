/**
 * Clearmix Validation Tests
 * 
 * In-page tests for input validation logic.
 * Run by calling runValidationTests() in the browser console.
 */

// ================================================================
// TEST FRAMEWORK
// ================================================================

const TestResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function test(name, fn) {
    try {
        fn();
        TestResults.passed++;
        TestResults.tests.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (error) {
        TestResults.failed++;
        TestResults.tests.push({ name, status: 'FAIL', error: error.message });
        console.error(`❌ FAIL: ${name}`);
        console.error(`   ${error.message}`);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} Expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`${message} Expected true, got ${value}`);
    }
}

function assertFalse(value, message = '') {
    if (value) {
        throw new Error(`${message} Expected false, got ${value}`);
    }
}


// ================================================================
// WATER VOLUME VALIDATION TESTS
// ================================================================

function testWaterVolumeValidation() {
    console.log('\n📋 WATER VOLUME VALIDATION TESTS');
    console.log('='.repeat(40));

    // Test: Valid value within range
    test('Water: 2 mL is valid', () => {
        const result = validateWaterVolume(2);
        assertTrue(result.valid, 'Should be valid');
        assertEqual(result.correctedValue, 2, 'Should not be corrected');
        assertEqual(result.alertType, null, 'Should have no alert');
    });

    // Test: Minimum boundary (1 mL)
    test('Water: 1 mL is valid (minimum)', () => {
        const result = validateWaterVolume(1);
        assertTrue(result.valid, 'Min value should be valid');
        assertEqual(result.correctedValue, 1);
    });

    // Test: Maximum boundary (10 mL)
    test('Water: 10 mL is valid (maximum)', () => {
        const result = validateWaterVolume(10);
        assertTrue(result.valid, 'Max value should be valid');
        assertEqual(result.correctedValue, 10);
    });

    // Test: Below minimum
    test('Water: 0.5 mL is corrected to 1 mL', () => {
        const result = validateWaterVolume(0.5);
        assertFalse(result.valid, 'Should be invalid');
        assertEqual(result.correctedValue, 1, 'Should correct to min');
        assertEqual(result.alertType, 'error');
    });

    // Test: Negative value
    test('Water: -1 mL is corrected to 1 mL', () => {
        const result = validateWaterVolume(-1);
        assertFalse(result.valid);
        assertEqual(result.correctedValue, 1, 'Negative should correct to min');
        assertEqual(result.alertType, 'error');
    });

    // Test: Zero
    test('Water: 0 mL is corrected to 1 mL', () => {
        const result = validateWaterVolume(0);
        assertFalse(result.valid);
        assertEqual(result.correctedValue, 1);
    });

    // Test: Above maximum
    test('Water: 11 mL is corrected to 10 mL', () => {
        const result = validateWaterVolume(11);
        assertTrue(result.valid, 'Should still be valid (info only)');
        assertEqual(result.correctedValue, 10, 'Should correct to max');
        assertEqual(result.alertType, 'info');
    });

    // Test: Way above maximum
    test('Water: 50 mL is corrected to 10 mL', () => {
        const result = validateWaterVolume(50);
        assertEqual(result.correctedValue, 10);
        assertEqual(result.alertType, 'info');
    });
}


// ================================================================
// DOSE VALIDATION TESTS
// ================================================================

function testDoseValidation() {
    console.log('\n📋 DOSE VALIDATION TESTS');
    console.log('='.repeat(40));

    // Test: Normal dose
    test('Dose: 250 mcg is valid (no warnings)', () => {
        const result = validateDose(250);
        assertTrue(result.valid);
        assertEqual(result.alertType, null, 'Should have no warning');
    });

    // Test: At caution threshold
    test('Dose: 500 mcg is valid (no warning)', () => {
        const result = validateDose(500);
        assertTrue(result.valid);
        assertEqual(result.alertType, null, 'Exactly 500 should not warn');
    });

    // Test: Just above caution threshold
    test('Dose: 501 mcg shows info alert', () => {
        const result = validateDose(501);
        assertTrue(result.valid, 'Should still be valid');
        assertEqual(result.alertType, 'info', 'Should show info alert');
    });

    // Test: At warning threshold
    test('Dose: 1000 mcg shows info alert', () => {
        const result = validateDose(1000);
        assertTrue(result.valid);
        assertEqual(result.alertType, 'info', 'Exactly 1000 should show info');
    });

    // Test: Above warning threshold
    test('Dose: 1001 mcg shows warning alert', () => {
        const result = validateDose(1001);
        assertTrue(result.valid, 'Should still be valid');
        assertEqual(result.alertType, 'warning', 'Should show high dose warning');
    });

    // Test: Very high dose
    test('Dose: 5000 mcg shows warning alert', () => {
        const result = validateDose(5000);
        assertTrue(result.valid);
        assertEqual(result.alertType, 'warning');
    });

    // Test: Zero dose
    test('Dose: 0 mcg has no alert', () => {
        const result = validateDose(0);
        assertEqual(result.alertType, null);
    });

    // Test: Null dose
    test('Dose: null has no alert', () => {
        const result = validateDose(null);
        assertEqual(result.alertType, null);
    });
}


// ================================================================
// CALCULATION TESTS
// ================================================================

function testCalculations() {
    console.log('\n📋 CALCULATION TESTS');
    console.log('='.repeat(40));

    // Test: Concentration calculation
    test('Concentration: 10 mg / 2 mL = 5000 mcg/mL', () => {
        state.vialMg = 10;
        state.diluentMl = 2;
        const result = calculateMixing();
        assertEqual(result.concentrationMcgPerMl, 5000);
    });

    test('Concentration: 5 mg / 1 mL = 5000 mcg/mL', () => {
        state.vialMg = 5;
        state.diluentMl = 1;
        const result = calculateMixing();
        assertEqual(result.concentrationMcgPerMl, 5000);
    });

    test('Concentration: 10 mg / 5 mL = 2000 mcg/mL', () => {
        state.vialMg = 10;
        state.diluentMl = 5;
        const result = calculateMixing();
        assertEqual(result.concentrationMcgPerMl, 2000);
    });

    // Test: Dose calculation
    test('Dose: 250 mcg at 5000 mcg/mL = 0.05 mL = 5 units', () => {
        state.vialMg = 10;
        state.diluentMl = 2;
        calculateMixing();
        state.doseMcg = 250;
        const result = calculateDosing();
        assertEqual(result.doseMlPractical, 0.05);
        assertEqual(result.doseUnits, 5);
    });

    test('Dose: 500 mcg at 5000 mcg/mL = 0.1 mL = 10 units', () => {
        state.vialMg = 10;
        state.diluentMl = 2;
        calculateMixing();
        state.doseMcg = 500;
        const result = calculateDosing();
        assertEqual(result.doseMlPractical, 0.1);
        assertEqual(result.doseUnits, 10);
    });

    // Test: Doses per vial
    test('Doses per vial: 10000 mcg / 250 mcg = 40 doses', () => {
        state.vialMg = 10;
        state.diluentMl = 2;
        calculateMixing();
        state.doseMcg = 250;
        const result = calculateDosing();
        assertEqual(result.numDoses, 40);
    });
}


// ================================================================
// MULTI-DRAW CALCULATION TESTS
// ================================================================

function testMultiDrawCalculation() {
    console.log('\n📋 MULTI-DRAW CALCULATION TESTS');
    console.log('='.repeat(40));

    // Test: Single draw fits
    test('Draw: 2 mL water on 3 mL syringe = single draw', () => {
        const result = calculateDrawsNeeded(2, 3);
        assertFalse(result.needsMultiple);
        assertEqual(result.displayText, '2.0 mL');
    });

    // Test: Exact multiple
    test('Draw: 2 mL water on 0.5 mL syringe = 4 × 0.5 mL', () => {
        const result = calculateDrawsNeeded(2, 0.5);
        assertTrue(result.needsMultiple);
        assertEqual(result.instruction, '4 × 0.5 mL');
    });

    // Test: With remainder
    test('Draw: 2 mL water on 0.3 mL syringe = 6 × 0.3 mL + 1 × 0.2 mL', () => {
        const result = calculateDrawsNeeded(2, 0.3);
        assertTrue(result.needsMultiple);
        assertEqual(result.instruction, '6 × 0.3 mL + 1 × 0.2 mL');
    });

    // Test: Edge case - exactly equal
    test('Draw: 1 mL water on 1 mL syringe = single draw', () => {
        const result = calculateDrawsNeeded(1, 1);
        assertFalse(result.needsMultiple);
    });
}


// ================================================================
// RUN ALL TESTS
// ================================================================

function runValidationTests() {
    console.log('🧪 CLEARMIX VALIDATION TESTS');
    console.log('='.repeat(50));

    // Reset results
    TestResults.passed = 0;
    TestResults.failed = 0;
    TestResults.tests = [];

    // Run test suites
    testWaterVolumeValidation();
    testDoseValidation();
    testCalculations();
    testMultiDrawCalculation();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 RESULTS: ${TestResults.passed} passed, ${TestResults.failed} failed`);
    console.log('='.repeat(50));

    if (TestResults.failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️ Some tests failed. See details above.');
    }

    return TestResults;
}

// Export for use
if (typeof window !== 'undefined') {
    window.runValidationTests = runValidationTests;
}

console.log('📦 Test suite loaded. Run runValidationTests() to execute tests.');
