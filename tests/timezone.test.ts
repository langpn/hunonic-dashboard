import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVnTimeParts } from '../src/lib/sqlite-db.js';

describe('Vietnam Timezone (GMT+7) Engine Tests', () => {
  it('should correctly format date and hour across all midnight shift edge cases', () => {
    // 1. Midnight: 00:05 AM in Vietnam (UTC: 17:05 previous day)
    const t0 = new Date('2026-10-16T17:05:00.000Z');
    const p0 = getVnTimeParts(t0);
    assert.equal(p0.dateStr, '2026-10-17', 'Midnight 00:05 AM must be 2026-10-17');
    assert.equal(p0.hour, 0, 'Hour must be 0');

    // 2. Early morning: 02:19 AM in Vietnam (the screenshot time, UTC: 19:19 previous day)
    const t1 = new Date('2026-10-16T19:19:00.000Z');
    const p1 = getVnTimeParts(t1);
    assert.equal(p1.dateStr, '2026-10-17', '02:19 AM must be 2026-10-17');
    assert.equal(p1.hour, 2, 'Hour must be 2');

    // 3. Right before UTC rollover: 06:59 AM in Vietnam (UTC: 23:59 previous day)
    const t2 = new Date('2026-10-16T23:59:00.000Z');
    const p2 = getVnTimeParts(t2);
    assert.equal(p2.dateStr, '2026-10-17', '06:59 AM must be 2026-10-17');
    assert.equal(p2.hour, 6, 'Hour must be 6');

    // 4. Exact UTC rollover: 07:00 AM in Vietnam (UTC: 00:00 same day)
    const t3 = new Date('2026-10-17T00:00:00.000Z');
    const p3 = getVnTimeParts(t3);
    assert.equal(p3.dateStr, '2026-10-17', '07:00 AM must be 2026-10-17');
    assert.equal(p3.hour, 7, 'Hour must be 7');

    // 5. Late night: 23:59 PM in Vietnam (UTC: 16:59 same day)
    const t4 = new Date('2026-10-17T16:59:00.000Z');
    const p4 = getVnTimeParts(t4);
    assert.equal(p4.dateStr, '2026-10-17', '23:59 PM must be 2026-10-17');
    assert.equal(p4.hour, 23, 'Hour must be 23');
  });

  it('should prevent UTC shift from corrupting daily array in frontend simulation', () => {
    // Simulating the month daily data returned from Cloud Hunonic
    const cloudDailyData = [
      { date: '2026-10-15', kwh: 2.77 },
      { date: '2026-10-16', kwh: 3.64 },
      { date: '2026-10-17', kwh: 0.48 },
    ];

    // Simulated time: 02:19 AM on Oct 17
    const simulatedDate = new Date('2026-10-16T19:19:00.000Z');
    
    // OLD BUGGY WAY: toISOString() evaluated to 2026-10-16
    const buggyTodayStr = simulatedDate.toISOString().slice(0, 10);
    assert.equal(buggyTodayStr, '2026-10-16', 'Proves old bug: toISOString shifted to yesterday');

    // NEW FIXED WAY: using getVnTimeParts
    const fixedTodayStr = getVnTimeParts(simulatedDate).dateStr;
    assert.equal(fixedTodayStr, '2026-10-17', 'Fixed way returns today correctly');

    // Verifying syncedDailyData behavior:
    const liveTodayKwh = 0.33; // early morning energy for Oct 17
    
    // Applying the sync algorithm with fixedTodayStr:
    const synced = cloudDailyData.map((d) => {
      if (d.date === fixedTodayStr) {
        return { ...d, kwh: Math.max(d.kwh, liveTodayKwh) };
      }
      return d;
    });

    const day16 = synced.find(d => d.date === '2026-10-16');
    const day17 = synced.find(d => d.date === '2026-10-17');

    assert.equal(day16?.kwh, 3.64, 'Day 16 must remain untouched at 3.64 kWh');
    assert.equal(day17?.kwh, 0.48, 'Day 17 must be at least 0.48 kWh');
  });
});
