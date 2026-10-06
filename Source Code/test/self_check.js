const assert = require('assert');
const path = require('path');
const {
    app,
    db,
    assessScreening,
    validateViolationPayload,
    calculateViolationTotal,
    normalizeViolations
} = require('../server.js');

async function runCheck() {
    console.log('Running CVPRMS self-check test suite...');

    // 1. Violations calculation & normalization
    const normalized = normalizeViolations(["No Driver's License", "No Helmet / Seatbelt"]);
    assert.strictEqual(normalized.length, 2, 'Should normalize list to 2 items');
    const total = calculateViolationTotal(["No Driver's License", "No Helmet / Seatbelt"]);
    assert.strictEqual(total, 2500, 'Expected total fine of 2500');

    // 2. Screening blacklist logic
    const plateAlarmSpace = assessScreening({ plateNumber: 'ABC 1234' });
    assert.strictEqual(plateAlarmSpace.status, 'alarm', 'Plate with space ABC 1234 must trigger alarm');

    const plateAlarmDash = assessScreening({ plateNumber: 'ABC-1234' });
    assert.strictEqual(plateAlarmDash.status, 'alarm', 'Plate with dash ABC-1234 must trigger alarm');

    const driverAlarmCaps = assessScreening({ driverName: 'JUAN DELA CRUZ' });
    assert.strictEqual(driverAlarmCaps.status, 'alarm', 'Driver JUAN DELA CRUZ (uppercase) must trigger alarm');

    const driverAlarmTitle = assessScreening({ driverName: 'Juan Dela Cruz' });
    assert.strictEqual(driverAlarmTitle.status, 'alarm', 'Driver Juan Dela Cruz (title) must trigger alarm');

    const clearScreening = assessScreening({ plateNumber: 'XYZ 0000', driverName: 'Maria Clara', licenseNumber: 'A01-00-000000' });
    assert.strictEqual(clearScreening.status, 'clear', 'Clean driver/plate must return clear status');

    // 3. Validation Rules
    // Empty payload
    const emptyValidation = validateViolationPayload({});
    assert.strictEqual(emptyValidation.isValid, false, 'Empty payload must fail validation');
    assert(emptyValidation.errors.length >= 5, 'Must report missing required fields');

    // Unlicensed driver without N/A - Unlicensed license number
    const unlicensedWrongLicense = validateViolationPayload({
        driver_name: 'Test Driver',
        license_number: 'N01-11-111111',
        plate_number: 'ABC 1234',
        violation_types: ["No Driver's License"],
        fine_amount: 1500,
        officer_id: 'PNP-4491',
        id_type: 'Passport',
        id_number: 'P1234567A'
    });
    assert.strictEqual(unlicensedWrongLicense.isValid, false, 'Unlicensed must require N/A - Unlicensed');

    // Valid unlicensed driver
    const unlicensedValid = validateViolationPayload({
        driver_name: 'Test Driver',
        license_number: 'N/A - Unlicensed',
        plate_number: 'ABC 1234',
        violation_types: ["No Driver's License"],
        fine_amount: 1500,
        officer_id: 'PNP-4491',
        id_type: 'Passport',
        id_number: 'P1234567A'
    });
    assert.strictEqual(unlicensedValid.isValid, true, 'Valid unlicensed driver should pass');

    // Impounded vehicle disposition requires impound slip
    const impoundedNoSlip = validateViolationPayload({
        driver_name: 'Test Driver',
        license_number: 'N01-11-111111',
        plate_number: 'ABC 1234',
        vehicle_disposition: 'Impounded',
        violation_types: ["No Helmet / Seatbelt"],
        fine_amount: 1000,
        officer_id: 'PNP-4491'
    });
    assert.strictEqual(impoundedNoSlip.isValid, false, 'Impounded vehicle without slip must fail');

    // 4. Server Endpoints Verification
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        // Summary endpoint
        const summaryRes = await fetch(`${baseUrl}/api/reports/summary`);
        assert.strictEqual(summaryRes.status, 200);
        const summaryData = await summaryRes.json();
        assert.strictEqual(summaryData.success, true);
        assert(typeof summaryData.data.unsettled_records === 'number', 'Summary should report numerical unsettled_records');

        // Config endpoint
        const configRes = await fetch(`${baseUrl}/api/config`);
        assert.strictEqual(configRes.status, 200);
        const configData = await configRes.json();
        assert.strictEqual(configData.success, true);
        assert(configData.data.station_name, 'Station name must be present');
    } finally {
        server.close();
    }

    console.log('ALL SELF-CHECK ASSERTIONS PASSED SUCCESSFULLY!');
}

runCheck().catch((err) => {
    console.error('Self-check failed:', err);
    process.exit(1);
});
