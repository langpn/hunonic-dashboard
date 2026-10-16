import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';

describe('API Endpoint Contract & Shape Tests', () => {
  it('GET /health should return 200 with server status', async () => {
    const res = await app.request('/health');
    assert.equal(res.status, 200, 'Health endpoint must return 200');

    const json = await res.json() as any;
    assert.equal(json.status, 'ok', 'Status must be ok');
    assert.ok(typeof json.uptime_seconds === 'number', 'Uptime must be a number');
    assert.ok(json.memory, 'Memory stats must be present');
  });

  it('GET /api/device/realtime should return valid electrical telemetry', async () => {
    const res = await app.request('/api/device/realtime?device_id=3590138');
    assert.equal(res.status, 200, 'Realtime endpoint must return 200');

    const json = await res.json() as any;
    assert.equal(json.success, true, 'Request must succeed');
    assert.ok(json.data, 'Telemetry data must be present');

    const d = json.data;
    assert.ok(typeof d.power_w === 'number', 'power_w must be a number');
    assert.ok(typeof d.voltage_v === 'number', 'voltage_v must be a number');
    assert.ok(d.voltage_v >= 220.0 && d.voltage_v <= 245.0, `Voltage ${d.voltage_v}V must be in Vietnamese grid bounds (220-245V)`);
    assert.ok(typeof d.current_a === 'number', 'current_a must be a number');
    assert.ok(d.current_a <= 5.7, `Current ${d.current_a}A must not exceed 5.7A max for Mitsu 13YZP`);
    assert.ok(typeof d.today_kwh === 'number', 'today_kwh must be a number');
    assert.ok(d.today_kwh >= 0, 'today_kwh must be non-negative');
  });

  it('GET /api/dashboard/history?type=day should return calibrated 24h curve', async () => {
    const res = await app.request('/api/dashboard/history?type=day&date=2026-10-15');
    assert.equal(res.status, 200, 'History endpoint must return 200');

    const json = await res.json() as any;
    assert.equal(json.success, true, 'Request must succeed');
    assert.ok(json.data, 'History data must be present');

    const d = json.data;
    assert.equal(d.date, '2026-10-15');
    assert.ok(d.total_kwh > 0 && d.total_kwh < 5.0, `Normalized total_kwh ${d.total_kwh} must be realistic (~2.0 kWh, not bloated 13.4 kWh)`);
    assert.ok(d.peak_power_w <= 1240, `Peak power ${d.peak_power_w}W must be capped at physical AC max`);
    assert.equal(d.hourly.length, 24, 'Must return 24 hourly buckets');
  });
});
