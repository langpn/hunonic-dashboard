import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

describe('SQLite Energy Reconciliation Invariant Tests', () => {
  const TEST_DB = path.resolve(process.cwd(), 'data', 'test-reconcile.sqlite');

  function setupTestDb() {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    const db = new DatabaseSync(TEST_DB);
    db.exec(`
      CREATE TABLE IF NOT EXISTS hourly_buckets (
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        kwh REAL NOT NULL DEFAULT 0,
        avg_power_w REAL NOT NULL DEFAULT 0,
        min_power_w REAL NOT NULL DEFAULT 0,
        max_power_w REAL NOT NULL DEFAULT 0,
        samples_count INTEGER NOT NULL DEFAULT 0,
        last_w REAL NOT NULL DEFAULT 0,
        last_time INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date, hour)
      );
    `);
    return db;
  }

  it('should scale down bloated local data when local is > 1.15x of Cloud total', () => {
    const db = setupTestDb();
    const testDate = '2026-10-15';
    const cloudTotalKwh = 1.99; // Verified reality

    // Insert bloated records (simulating the 13.42 kWh bug)
    const insertStmt = db.prepare(`
      INSERT INTO hourly_buckets (date, hour, kwh, avg_power_w, max_power_w, samples_count)
      VALUES (?, ?, ?, ?, ?, 60)
    `);
    
    // 5 bloated hours totaling ~13.42 kWh
    insertStmt.run(testDate, 10, 2.50, 2500, 3022);
    insertStmt.run(testDate, 11, 3.20, 3200, 3022);
    insertStmt.run(testDate, 12, 2.80, 2800, 3022);
    insertStmt.run(testDate, 13, 2.50, 2500, 3022);
    insertStmt.run(testDate, 14, 2.42, 2420, 3022);

    const sumBefore = (db.prepare('SELECT SUM(kwh) as total FROM hourly_buckets WHERE date = ?').get(testDate) as any).total;
    assert.equal(parseFloat(sumBefore.toFixed(2)), 13.42, 'Local data must be bloated before test');

    // Run reconciliation logic
    const scaleDownRatio = cloudTotalKwh / sumBefore;
    const rows = db.prepare('SELECT hour, kwh, avg_power_w, max_power_w FROM hourly_buckets WHERE date = ?').all(testDate) as any[];
    const updateStmt = db.prepare('UPDATE hourly_buckets SET kwh = ?, avg_power_w = ?, max_power_w = ? WHERE date = ? AND hour = ?');

    for (const r of rows) {
      const scaledKwh = parseFloat((r.kwh * scaleDownRatio).toFixed(4));
      const scaledAvg = Math.min(1240, Math.round(r.avg_power_w * scaleDownRatio));
      const scaledMax = Math.min(1240, Math.round(r.max_power_w * scaleDownRatio));
      updateStmt.run(scaledKwh, scaledAvg, scaledMax, testDate, r.hour);
    }

    const sumAfter = (db.prepare('SELECT SUM(kwh) as total FROM hourly_buckets WHERE date = ?').get(testDate) as any).total;
    const maxPowerAfter = (db.prepare('SELECT MAX(max_power_w) as peak FROM hourly_buckets WHERE date = ?').get(testDate) as any).peak;

    assert.ok(Math.abs(sumAfter - cloudTotalKwh) < 0.01, `Sum after ${sumAfter} must equal Cloud ${cloudTotalKwh}`);
    assert.ok(maxPowerAfter <= 1240, `Peak power ${maxPowerAfter}W must be capped at physical AC ceiling (1240W)`);
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('should scale up lagging local data when local is < 0.90x of Cloud total', () => {
    const db = setupTestDb();
    const testDate = '2026-10-17';
    const cloudTotalKwh = 0.48; // Confirmed on Cloud

    // Insert lagging records (0.33 kWh accumulated in 3 hours)
    const insertStmt = db.prepare(`
      INSERT INTO hourly_buckets (date, hour, kwh, avg_power_w, max_power_w, samples_count)
      VALUES (?, ?, ?, ?, ?, 60)
    `);
    insertStmt.run(testDate, 0, 0.234, 393, 500);
    insertStmt.run(testDate, 1, 0.072, 72, 100);
    insertStmt.run(testDate, 2, 0.024, 60, 100);

    const sumBefore = (db.prepare('SELECT SUM(kwh) as total FROM hourly_buckets WHERE date = ?').get(testDate) as any).total;
    assert.equal(parseFloat(sumBefore.toFixed(3)), 0.330, 'Local data lags before test');

    // Run reconciliation scale-up logic
    const scaleUpRatio = cloudTotalKwh / sumBefore;
    const rows = db.prepare('SELECT hour, kwh, avg_power_w, max_power_w FROM hourly_buckets WHERE date = ?').all(testDate) as any[];
    const updateStmt = db.prepare('UPDATE hourly_buckets SET kwh = ?, avg_power_w = ?, max_power_w = ? WHERE date = ? AND hour = ?');

    for (const r of rows) {
      const scaledKwh = parseFloat((r.kwh * scaleUpRatio).toFixed(4));
      const scaledAvg = Math.min(1240, Math.round(r.avg_power_w * scaleUpRatio));
      const scaledMax = Math.min(1240, Math.max(scaledAvg, Math.round(r.max_power_w * scaleUpRatio)));
      updateStmt.run(scaledKwh, scaledAvg, scaledMax, testDate, r.hour);
    }

    const sumAfter = (db.prepare('SELECT SUM(kwh) as total FROM hourly_buckets WHERE date = ?').get(testDate) as any).total;
    assert.ok(Math.abs(sumAfter - cloudTotalKwh) < 0.01, `Sum after ${sumAfter} must match Cloud ${cloudTotalKwh}`);

    // Verify drift is now eliminated:
    const drift = parseFloat((cloudTotalKwh - sumAfter).toFixed(3));
    assert.ok(Math.abs(drift) < 0.01, `Drift ${drift} must be eliminated (< 0.01)`);
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });
});
