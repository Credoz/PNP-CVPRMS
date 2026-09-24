const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateViolationTotal,
  generateTicketNumber,
  assessScreening,
  validateViolationPayload,
  OFFENSE_SCHEDULE
} = require('../server.js');

test('calculateViolationTotal adds multiple violation fees from the local schedule', () => {
  const violations = [
    'No Driver\'s License',
    'Expired Vehicle Registration',
    'No Helmet / Seatbelt'
  ];

  const total = calculateViolationTotal(violations);
  assert.equal(total, 3700);
});

test('calculateViolationTotal supports expanded Philippine traffic violations', () => {
  const violations = [
    'Failure to Carry Driver\'s License / OR-CR',
    'Disregarding Traffic Signs (DTS) / Red Light Violation',
    'Distracted Driving (RA 10913 - Mobile Device Use)',
    'Illegal Parking / Obstruction',
    'Unified Vehicular Volume Reduction Program (Number Coding)',
    'Reckless Driving / Counterflow (Illegal Overtaking)',
    'Over-speeding',
    'Defective Equipment / Smoke Belching'
  ];

  const total = calculateViolationTotal(violations);
  // 1000 + 1000 + 5000 + 1000 + 500 + 3000 + 1200 + 1500 = 14200
  assert.equal(total, 14200);
});

test('generateTicketNumber creates a unique citation identifier', () => {
  const ticket = generateTicketNumber();
  assert.match(ticket, /^PNP-\d{8}-[A-Z0-9]{6}$/);
});

test('assessScreening flags blacklisted vehicles or expired registrations', () => {
  const result = assessScreening({
    licenseNumber: 'N01-12-345678',
    plateNumber: 'ABC-1234',
    driverName: 'Juan Dela Cruz'
  });

  assert.equal(result.status, 'warning');
  assert.ok(Array.isArray(result.flags));
});

test('assessScreening handles unlicensed drivers (N/A - Unlicensed) without false license alerts', () => {
  const result = assessScreening({
    licenseNumber: 'N/A - Unlicensed',
    plateNumber: 'XYZ-1111',
    driverName: 'Non Flagged Driver'
  });

  assert.equal(result.status, 'clear');
  assert.match(result.flags[0], /No screening alerts/i);
});

test('validateViolationPayload requires alternative ID when driver is unlicensed', () => {
  // Case 1: Unlicensed driver missing alternative ID
  const invalidPayload = {
    driver_name: 'Maria Santos',
    license_number: 'N/A - Unlicensed',
    plate_number: 'NDB-5678',
    violation_type: "No Driver's License",
    fine_amount: 1500,
    officer_id: 'PNP-OFFICER-001'
  };

  const invalidResult = validateViolationPayload(invalidPayload);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.some(e => e.includes('Alternative ID type')));

  // Case 2: Unlicensed driver with valid alternative ID
  const validPayload = {
    ...invalidPayload,
    id_type: 'Philippine National ID',
    id_number: '1234-5678-9012-3456'
  };

  const validResult = validateViolationPayload(validPayload);
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.errors.length, 0);
});

test('validateViolationPayload requires valid license number when driver is licensed', () => {
  const licensedPayload = {
    driver_name: 'Carlos Yulo',
    license_number: 'N02-99-887766',
    plate_number: 'ABC-9999',
    violation_type: 'Over-speeding',
    fine_amount: 1200,
    officer_id: 'PNP-OFFICER-002'
  };

  const result = validateViolationPayload(licensedPayload);
  assert.equal(result.isValid, true);

  // If licensed driver provides N/A - Unlicensed, it should be rejected
  const invalidLicensed = {
    ...licensedPayload,
    license_number: 'N/A - Unlicensed'
  };
  const invalidResult = validateViolationPayload(invalidLicensed);
  assert.equal(invalidResult.isValid, false);
});
