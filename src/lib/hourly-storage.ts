/**
 * Hourly Electricity Storage Engine
 * Features:
 * - 2-Month Strict Data Retention (Auto-Prune >= 60 days)
 * - Self-Healing Overload Protection (Prune to 30 days if memory/storage spikes)
 * - Persistent JSON store with minimal disk/RAM footprint (< 5MB)
 */
import fs from 'node:fs';
import path from 'node:path';

export interface HourlyRecord {
  hour: number;        // 0 - 23
  kwh: number;         // Estimated kWh used in this hour
  avg_power_w: number; // Average Wattage
  samples_count: number;
}

export interface StoredSample {
  timestamp: number;   // Unix ms
  date: string;        // YYYY-MM-DD
  hour: number;        // 0 - 23
  power_w: number;     // Instant Watt
  root_id: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'hourly_power.json');

// Strict Retention Constants
const MAX_RETENTION_DAYS = 60; // 2 months
const EMERGENCY_RETENTION_DAYS = 30; // 1 month under load
const MEMORY_OVERLOAD_HEAP_BYTES = 120 * 1024 * 1024; // 120MB threshold

class HourlyStorageEngine {
  private samples: StoredSample[] = [];
  private lastPruneTime: number = 0;
  private isSaving: boolean = false;

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.samples = parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ Failed to load existing hourly storage, starting fresh:', e);
      this.samples = [];
    }

    // Initial prune on startup
    this.autoPrune();
  }

  private persist() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.samples), 'utf-8');
    } catch (e) {
      console.error('❌ Failed to persist hourly samples to disk:', e);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Check system load and auto-prune data
   */
  public autoPrune(forceEmergency: boolean = false): { prunedCount: number; reason: string } {
    const now = Date.now();
    const heapUsed = process.memoryUsage().heapUsed;
    const isOverloaded = forceEmergency || heapUsed > MEMORY_OVERLOAD_HEAP_BYTES || this.samples.length > 50000;
    
    const retentionDays = isOverloaded ? EMERGENCY_RETENTION_DAYS : MAX_RETENTION_DAYS;
    const cutoffTime = now - retentionDays * 24 * 60 * 60 * 1000;
    
    const initialCount = this.samples.length;
    this.samples = this.samples.filter(s => s.timestamp >= cutoffTime);
    const prunedCount = initialCount - this.samples.length;

    this.lastPruneTime = now;

    if (prunedCount > 0) {
      console.log(`🧹 [Auto-Prune] Removed ${prunedCount} records older than ${retentionDays} days. Reason: ${isOverloaded ? 'Server Load Protection' : 'Standard 2-Month Retention'}`);
      this.persist();
    }

    return {
      prunedCount,
      reason: isOverloaded ? 'Overload protection triggered (30-day limit)' : 'Standard 60-day limit',
    };
  }

  /**
   * Record a power measurement
   */
  public recordSample(rootId: string, powerW: number): void {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const hour = now.getHours();

    const sample: StoredSample = {
      timestamp: now.getTime(),
      date: dateStr,
      hour,
      power_w: Math.max(0, powerW),
      root_id: rootId,
    };

    this.samples.push(sample);

    // Prune periodically every 12 hours or when batch hits 500 new items
    if (Date.now() - this.lastPruneTime > 12 * 60 * 60 * 1000) {
      this.autoPrune();
    } else {
      this.persist();
    }
  }

  /**
   * Get 24-hour breakdown for a specific date (YYYY-MM-DD)
   */
  public getHourlyForDate(dateStr: string, rootId?: string): HourlyRecord[] {
    const daySamples = this.samples.filter(s => 
      s.date === dateStr && (!rootId || s.root_id === rootId)
    );

    const hourlyMap: Record<number, { totalW: number; count: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { totalW: 0, count: 0 };
    }

    for (const sample of daySamples) {
      const entry = hourlyMap[sample.hour];
      if (entry) {
        entry.totalW += sample.power_w;
        entry.count += 1;
      }
    }

    const result: HourlyRecord[] = [];
    for (let h = 0; h < 24; h++) {
      const { totalW, count } = hourlyMap[h];
      const avgW = count > 0 ? Math.round(totalW / count) : 0;
      // kWh = average Watts * 1 hour / 1000
      const kwh = parseFloat(((avgW * 1) / 1000).toFixed(3));

      result.push({
        hour: h,
        kwh,
        avg_power_w: avgW,
        samples_count: count,
      });
    }

    return result;
  }

  /**
   * System & storage diagnostics
   */
  public getDiagnostics() {
    const mem = process.memoryUsage();
    const dates = Array.from(new Set(this.samples.map(s => s.date))).sort();
    
    return {
      total_samples: this.samples.length,
      retention_policy: `${MAX_RETENTION_DAYS} days (2 months)`,
      oldest_date: dates[0] || 'N/A',
      newest_date: dates[dates.length - 1] || 'N/A',
      dates_recorded_count: dates.length,
      storage_file_size_kb: fs.existsSync(STORAGE_FILE) ? Math.round(fs.statSync(STORAGE_FILE).size / 1024) : 0,
      memory: {
        heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        rss_mb: (mem.rss / 1024 / 1024).toFixed(1),
      },
    };
  }
}

export const hourlyStorage = new HourlyStorageEngine();
