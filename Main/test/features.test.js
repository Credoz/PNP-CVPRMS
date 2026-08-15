const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateViolationTotal,
  generateTicketNumber,
  assessScreening
} = require('../server.js');

test('calculateViolationTotal adds multiple violation fees from the local schedule', () => {
  const violations = [
    'No Driver\'s License',
    'Expired Vehicle Registration',
    'No Helmet / Seatbelt'
  ];

  const total = calculateViolationTotal(violations);
  assert.equal(total, 4000);
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
