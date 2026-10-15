/**
 * Native C++ SQLite Storage Engine using Node 22+ 'node:sqlite'
 * Zero npm dependencies, microsecond queries, persistent storage.
 * Handles:
 * - Real-time energy telemetry integration
 * - Hourly power buckets
 * - 60-day auto-retention cleanup
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface HourlyBucketRecord {
  hour: number;          // 0 - 23
  kwh: number;           // Accumulated kWh
  avg_power_w: number;   // Average Wattage
  min_power_w: number;   // Minimum Wattage
  max_power_w: number;   // Peak Wattage
  samples_count: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'energy.sqlite');

class SqliteEnergyEngine {
  private db: DatabaseSync;
  private lastPruneTime: number = 0;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = new DatabaseSync(DB_FILE);
    this.initTables();
    this.autoPrune();
  }

  private initTables() {
    // Enable WAL mode for high concurrency & speed
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS hourly_buckets (
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        kwh REAL DEFAULT 0,
        avg_power_w REAL DEFAULT 0,
        min_power_w REAL DEFAULT 0,
        max_power_w REAL DEFAULT 0,
        samples_count INTEGER DEFAULT 0,
        last_w REAL DEFAULT 0,
        last_time INTEGER DEFAULT 0,
        PRIMARY KEY (date, hour)
      );

      CREATE INDEX IF NOT EXISTS idx_hourly_date ON hourly_buckets (date);
    `);
  }

  /**
   * Trapezoidal energy integration into SQLite bucket
   */
  public recordFluctuatingPower(currentPowerW: number): void {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const nowMs = now.getTime();
    const safeW = Math.max(0, currentPowerW);

    // Get current bucket
    const selectStmt = this.db.prepare(
      'SELECT * FROM hourly_buckets WHERE date = ? AND hour = ?'
    );
    const existing = selectStmt.get(dateStr, hour) as any;

    if (!existing) {
      // First sample of the hour
      const insertStmt = this.db.prepare(`
        INSERT INTO hourly_buckets (date, hour, kwh, avg_power_w, min_power_w, max_power_w, samples_count, last_w, last_time)
        VALUES (?, ?, 0, ?, ?, ?, 1, ?, ?)
      `);
      insertStmt.run(dateStr, hour, safeW, safeW, safeW, safeW, nowMs);
    } else {
      // Calculate trapezoidal energy delta
      const deltaSeconds = Math.min(600, Math.max(1, (nowMs - (existing.last_time || nowMs)) / 1000));
      const avgIntervalW = (existing.last_w + safeW) / 2;
      const addedKwh = (avgIntervalW * deltaSeconds) / (3600 * 1000);

      const newKwh = parseFloat(((existing.kwh || 0) + addedKwh).toFixed(4));
      const newMin = Math.min(existing.min_power_w || safeW, safeW);
      const newMax = Math.max(existing.max_power_w || safeW, safeW);
      const newSamples = (existing.samples_count || 0) + 1;
      const newAvg = Math.round(((existing.avg_power_w || safeW) * existing.samples_count + safeW) / newSamples);

      const updateStmt = this.db.prepare(`
        UPDATE hourly_buckets
        SET kwh = ?, avg_power_w = ?, min_power_w = ?, max_power_w = ?, samples_count = ?, last_w = ?, last_time = ?
        WHERE date = ? AND hour = ?
      `);
      updateStmt.run(newKwh, newAvg, newMin, newMax, newSamples, safeW, nowMs, dateStr, hour);
    }

    // Auto-prune periodically (every 12 hours)
    if (Date.now() - this.lastPruneTime > 12 * 60 * 60 * 1000) {
      this.autoPrune();
    }
  }

  /**
   * Get 24 hourly buckets for any date
   */
  public getHourlyForDate(dateStr: string): HourlyBucketRecord[] {
    const stmt = this.db.prepare(
      'SELECT hour, kwh, avg_power_w, min_power_w, max_power_w, samples_count FROM hourly_buckets WHERE date = ? ORDER BY hour ASC'
    );
    const rows = stmt.all(dateStr) as any[];

    const rowsMap = new Map<number, HourlyBucketRecord>();
    for (const r of rows) {
      rowsMap.set(r.hour, {
        hour: r.hour,
        kwh: parseFloat((r.kwh || 0).toFixed(3)),
        avg_power_w: r.avg_power_w || 0,
        min_power_w: r.min_power_w || 0,
        max_power_w: r.max_power_w || 0,
        samples_count: r.samples_count || 0,
      });
    }

    return Array.from({ length: 24 }, (_, h) => {
      return (
        rowsMap.get(h) || {
          hour: h,
          kwh: 0,
          avg_power_w: 0,
          min_power_w: 0,
          max_power_w: 0,
          samples_count: 0,
        }
      );
    });
  }

  /**
   * Auto-prune records older than 60 days
   */
  public autoPrune(days = 60): { prunedCount: number } {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const deleteStmt = this.db.prepare('DELETE FROM hourly_buckets WHERE date < ?');
      const result = deleteStmt.run(cutoffDate) as any;
      this.lastPruneTime = Date.now();
      return { prunedCount: result?.changes || 0 };
    } catch {
      return { prunedCount: 0 };
    }
  }

  /**
   * Database diagnostics
   */
  public getDiagnostics() {
    const mem = process.memoryUsage();
    let count = 0;
    let minDate = 'N/A';
    let maxDate = 'N/A';

    try {
      const stats = this.db.prepare('SELECT COUNT(*) as cnt, MIN(date) as min_d, MAX(date) as max_d FROM hourly_buckets').get() as any;
      count = stats?.cnt || 0;
      minDate = stats?.min_d || 'N/A';
      maxDate = stats?.max_d || 'N/A';
    } catch {}

    const fileSizeKb = fs.existsSync(DB_FILE) ? Math.round(fs.statSync(DB_FILE).size / 1024) : 0;

    return {
      engine: 'Native C++ SQLite3 (node:sqlite WAL)',
      total_hourly_buckets: count,
      retention_policy: '60 days (2 months)',
      oldest_date: minDate,
      newest_date: maxDate,
      database_size_kb: fileSizeKb,
      memory: {
        heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        rss_mb: (mem.rss / 1024 / 1024).toFixed(1),
      },
    };
  }
}

export const sqliteEnergy = new SqliteEnergyEngine();
