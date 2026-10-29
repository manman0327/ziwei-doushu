import assert from 'node:assert/strict';
import { normalizeKnownBirth, parseClockPart } from '../../lib/ziwei/normalize-birth';

const base = { year: 2024, month: 1, day: 1, clockHour: 12, clockMinute: 0, gender: 'female' as const };
const date = (v: ReturnType<typeof normalizeKnownBirth>) => [v.year, v.month, v.day];

assert.equal(parseClockPart('', 23), null);
assert.equal(parseClockPart(' ', 23), null);
assert.equal(parseClockPart('1.5', 23), null);
assert.equal(parseClockPart('24', 23), null);
assert.equal(parseClockPart('0', 23), 0);
assert.equal(parseClockPart('05', 59), 5);
assert.throws(() => normalizeKnownBirth({ ...base, month: 2, day: 30 }), RangeError);
assert.throws(() => normalizeKnownBirth({ ...base, clockHour: 24 }), RangeError);
assert.throws(() => normalizeKnownBirth({ ...base, longitude: NaN }), RangeError);
assert.throws(() => normalizeKnownBirth({ ...base, utcOffsetMinutes: 900 }), RangeError);

// Late Zi-hour rolls across year/month boundaries, retaining the original input.
const yearEnd = normalizeKnownBirth({ ...base, month: 12, day: 31, clockHour: 23, clockMinute: 30 });
assert.deepEqual(date(yearEnd), [2025, 1, 1]);
assert.equal(yearEnd.origInput?.day, 31);
assert.equal(yearEnd.origInput?.clockHour, 23);
assert.deepEqual(date(normalizeKnownBirth({ ...base, month: 2, day: 28, clockHour: 23 })), [2024, 2, 29]);
assert.deepEqual(date(normalizeKnownBirth({ ...base, month: 2, day: 29, clockHour: 23 })), [2024, 3, 1]);
assert.deepEqual(date(normalizeKnownBirth({ ...base, clockHour: 23, lateZishi: 'current-day' })), [2024, 1, 1]);

// Longitude correction takes 00:30 to the previous day's Hai-hour.
const previous = normalizeKnownBirth({ ...base, clockHour: 0, clockMinute: 30, longitude: 90 });
assert.deepEqual(date(previous), [2023, 12, 31]);
assert.equal(previous.hour, 11);
// Eastward correction crosses midnight into the next month.
const next = normalizeKnownBirth({ ...base, month: 1, day: 31, clockHour: 23, clockMinute: 30, longitude: 150 });
assert.deepEqual(date(next), [2024, 2, 1]);

// EOT in February moves 01:05 back into Zi-hour at the standard meridian.
assert.equal(normalizeKnownBirth({ ...base, month: 2, day: 11, clockHour: 1, clockMinute: 5, longitude: 120 }).hour, 0);
assert.equal(normalizeKnownBirth({ ...base, month: 2, day: 11, clockHour: 1, clockMinute: 5 }).hour, 1);
// An overseas standard offset avoids applying Beijing's central meridian.
assert.equal(normalizeKnownBirth({ ...base, longitude: -74, utcOffsetMinutes: -300 }).hour, 6);
console.log('✓ Birth normalization boundary regression passed');
