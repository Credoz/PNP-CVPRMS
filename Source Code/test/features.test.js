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

test('assessScreening flags blacklisted/stolen vehicles or wanted persons as ALARM', () => {
  const result = assessScreening({
    licenseNumber: 'N01-12-345678',
    plateNumber: 'ABC-1234',
    driverName: 'Juan Dela Cruz'
  });

  assert.equal(result.status, 'alarm');
  assert.equal(result.status_label, 'ALARM / HPG WANTED');
  assert.ok(Array.isArray(result.flags));
});

test('assessScreening flags expired licenses or registrations as WARNING', () => {
  const result = assessScreening({
    licenseNumber: 'N01-99-EXPIRED',
    plateNumber: 'NDB-5555',
    driverName: 'Regular Driver'
  });

  assert.equal(result.status, 'warning');
  assert.equal(result.status_label, 'WARNING / REPEAT OFFENDER');
  assert.ok(Array.isArray(result.flags));
});

test('assessScreening handles unlicensed drivers (N/A - Unlicensed) without false license alerts', () => {
  const result = assessScreening({
    licenseNumber: 'N/A - Unlicensed',
    plateNumber: 'XYZ-1111',
    driverName: 'Non Flagged Driver'
  });

  assert.equal(result.status, 'clear');
  assert.equal(result.status_label, 'CLEAR');
  assert.match(result.flags[0], /No screening alerts/i);
});

test('validateViolationPayload requires alternative ID when driver is unlicensed', () => {
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

  const invalidLicensed = {
    ...licensedPayload,
    license_number: 'N/A - Unlicensed'
  };
  const invalidResult = validateViolationPayload(invalidLicensed);
  assert.equal(invalidResult.isValid, false);
});

test('validateViolationPayload supports fine discretion override', () => {
  const payloadWithOverride = {
    driver_name: 'Pedro Penduko',
    license_number: 'N01-11-223344',
    plate_number: 'NDB-1234',
    violation_type: 'Over-speeding',
    fine_amount: 500, // Statutory is 1200, officer discretion is 500
    fine_override: 1,
    officer_id: 'PNP-OFFICER-005'
  };

  const result = validateViolationPayload(payloadWithOverride);
  assert.equal(result.isValid, true);
});

test('validateViolationPayload requires impound receipt when vehicle disposition is Impounded', () => {
  const impoundWithoutSlip = {
    driver_name: 'Juan Tamad',
    license_number: 'N01-33-445566',
    plate_number: 'TAK-9876',
    violation_type: 'Driving Under the Influence (DUI)',
    fine_amount: 5000,
    vehicle_disposition: 'Impounded',
    officer_id: 'PNP-OFFICER-007'
  };

  const invalid = validateViolationPayload(impoundWithoutSlip);
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.some(e => e.includes('Impound Receipt / Towing Slip Number is required')));

  const impoundWithSlip = {
    ...impoundWithoutSlip,
    impound_receipt_no: 'IMP-2026-0099'
  };
  const valid = validateViolationPayload(impoundWithSlip);
  assert.equal(valid.isValid, true);
});

test('PATCH /api/violations/:id/status updates settlement state and rejects invalid values', async () => {
  const http = require('http');
  const { app, db } = require('../server.js');

  const server = app.listen(0);
  const port = server.address().port;

  try {
    // Insert dummy record
    const insertId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO violations (driver_name, license_number, plate_number, violation_type, fine_amount, officer_id, date_recorded)
         VALUES ('Test Status Driver', 'N01-00-111222', 'TEST-123', 'Over-speeding', 1200, 'PNP-TEST', '2026-09-24 10:00:00')`,
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    function patchStatus(id, status) {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ payment_status: status });
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: `/api/violations/${id}/status`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }

    // Valid update
    const res1 = await patchStatus(insertId, 'Settled / Paid at Treasury');
    assert.equal(res1.status, 200);
    assert.equal(res1.body.payment_status, 'Settled / Paid at Treasury');

    // Invalid update
    const res2 = await patchStatus(insertId, 'Invalid Status');
    assert.equal(res2.status, 400);
    assert.equal(res2.body.success, false);

    // Clean up
    await new Promise((resolve) => db.run('DELETE FROM violations WHERE id = ?', [insertId], resolve));
  } finally {
    server.close();
  }
});

