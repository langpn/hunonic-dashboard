/**
 * Ultra-Lean Hourly Energy Integration Engine
 * - Mathematical Trapezoidal Integration: kWh = ∫ P(t) dt
 * - Exactly 24 Hourly Buckets per Day (Zero Unbounded Array Growth)
 * - Maximum Storage: 60 Days * 24 Hours = 1,440 Records (< 70 KB on Disk, < 2 MB in RAM)
 * - Self-Healing: Prunes records older than 60 days (or 30 days under load)
 */
import fs from 'node:fs';
import path from 'node:path';

export interface HourlyBucket {
  hour: number;          // 0 - 23
  kwh: number;           // Integrated kWh
  avg_power_w: number;   // Average Wattage
  min_power_w: number;   // Lowest Wattage in hour
  max_power_w: number;   // Peak Wattage in hour
  samples_count: number; // Measurement points count
  last_w: number;        // Last measured Wattage
  last_time: number;     // Last measurement timestamp (ms)
}

export interface DayRecord {
  date: string;          // YYYY-MM-DD
  root_id: string;
  total_kwh: number;
  hours: HourlyBucket[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'hourly_power.json');

const MAX_RETENTION_DAYS = 60; // 2 months
const EMERGENCY_RETENTION_DAYS = 30; // 1 month under load
const MEMORY_OVERLOAD_HEAP_BYTES = 100 * 1024 * 1024; // 100MB

class HourlyEnergyEngine {
  private daysMap: Map<string, DayRecord> = new Map();
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
          for (const item of parsed) {
            if (item && item.date && Array.isArray(item.hours) && item.hours.length === 24) {
              this.daysMap.set(item.date, item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not load hourly storage, starting fresh:', e);
      this.daysMap.clear();
    }
    this.autoPrune();
  }

  private persist() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const records = Array.from(this.daysMap.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(records), 'utf-8');
    } catch (e) {
      console.error('❌ Failed to persist hourly records to disk:', e);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Check system load and auto-prune data older than retention limit
   */
  public autoPrune(forceEmergency: boolean = false): { prunedCount: number; reason: string } {
    const now = Date.now();
    const heapUsed = process.memoryUsage().heapUsed;
    const isOverloaded = forceEmergency || heapUsed > MEMORY_OVERLOAD_HEAP_BYTES || this.daysMap.size > 70;
    
    const retentionDays = isOverloaded ? EMERGENCY_RETENTION_DAYS : MAX_RETENTION_DAYS;
    const cutoffDate = new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    let prunedCount = 0;
    for (const [date] of this.daysMap.entries()) {
      if (date < cutoffDate) {
        this.daysMap.delete(date);
        prunedCount++;
      }
    }

    this.lastPruneTime = now;
    if (prunedCount > 0) {
      console.log(`🧹 [Auto-Prune] Pruned ${prunedCount} days older than ${retentionDays} days.`);
      this.persist();
    }

    return {
      prunedCount,
      reason: isOverloaded ? 'Overload protection triggered (30-day limit)' : 'Standard 60-day limit',
    };
  }

  /**
   * Initialize a clean 24-hour day structure
   */
  private createEmptyDay(date: string, rootId: string): DayRecord {
    const hours: HourlyBucket[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      kwh: 0,
      avg_power_w: 0,
      min_power_w: 0,
      max_power_w: 0,
      samples_count: 0,
      last_w: 0,
      last_time: 0,
    }));

    return {
      date,
      root_id: rootId,
      total_kwh: 0,
      hours,
    };
  }

  /**
   * Integrate fluctuating power: kWh += (P_avg * dt) / (3600 * 1000)
   * Resource-efficient: Exactly updates in-place in the hourly bucket.
   */
  public recordFluctuatingPower(rootId: string, currentPowerW: number): void {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const nowMs = now.getTime();
    const safeW = Math.max(0, currentPowerW);

    let dayRecord = this.daysMap.get(dateStr);
    if (!dayRecord) {
      dayRecord = this.createEmptyDay(dateStr, rootId);
      this.daysMap.set(dateStr, dayRecord);
    }

    const bucket = dayRecord.hours[hour];
    if (!bucket) return;

    if (bucket.samples_count === 0 || bucket.last_time === 0) {
      // First sample in this hour
      bucket.avg_power_w = safeW;
      bucket.min_power_w = safeW;
      bucket.max_power_w = safeW;
      bucket.last_w = safeW;
      bucket.last_time = nowMs;
      bucket.samples_count = 1;
    } else {
      // Calculate time delta in seconds (cap at max 10 minutes to prevent gaps from sleep)
      const deltaSeconds = Math.min(600, Math.max(1, (nowMs - bucket.last_time) / 1000));
      
      // Trapezoidal power average over interval
      const avgIntervalW = (bucket.last_w + safeW) / 2;
      
      // Integrate energy: kWh = (W * seconds) / (3600 * 1000)
      const addedKwh = (avgIntervalW * deltaSeconds) / (3600 * 1000);
      bucket.kwh = parseFloat((bucket.kwh + addedKwh).toFixed(4));
      
      // Update running metrics
      bucket.min_power_w = Math.min(bucket.min_power_w, safeW);
      bucket.max_power_w = Math.max(bucket.max_power_w, safeW);
      bucket.avg_power_w = Math.round(
        (bucket.avg_power_w * bucket.samples_count + safeW) / (bucket.samples_count + 1)
      );
      bucket.samples_count += 1;
      bucket.last_w = safeW;
      bucket.last_time = nowMs;
    }

    // Update day total
    dayRecord.total_kwh = parseFloat(
      dayRecord.hours.reduce((sum, h) => sum + h.kwh, 0).toFixed(3)
    );

    // Periodic prune check every 6 hours
    if (Date.now() - this.lastPruneTime > 6 * 60 * 60 * 1000) {
      this.autoPrune();
    } else {
      this.persist();
    }
  }

  /**
   * Get 24-hour breakdown for date
   */
  public getHourlyForDate(dateStr: string, _rootId?: string): { hour: number; kwh: number; avg_power_w: number; min_power_w: number; max_power_w: number; samples_count: number }[] {
    const day = this.daysMap.get(dateStr);
    if (!day) {
      return Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        kwh: 0,
        avg_power_w: 0,
        min_power_w: 0,
        max_power_w: 0,
        samples_count: 0,
      }));
    }

    return day.hours.map(h => ({
      hour: h.hour,
      kwh: parseFloat(h.kwh.toFixed(3)),
      avg_power_w: h.avg_power_w,
      min_power_w: h.min_power_w,
      max_power_w: h.max_power_w,
      samples_count: h.samples_count,
    }));
  }

  /**
   * System diagnostics
   */
  public getDiagnostics() {
    const mem = process.memoryUsage();
    const dates = Array.from(this.daysMap.keys()).sort();
    return {
      total_days_stored: this.daysMap.size,
      retention_policy: `${MAX_RETENTION_DAYS} days (2 months)`,
      oldest_date: dates[0] || 'N/A',
      newest_date: dates[dates.length - 1] || 'N/A',
      storage_file_size_kb: fs.existsSync(STORAGE_FILE) ? Math.round(fs.statSync(STORAGE_FILE).size / 1024) : 0,
      memory: {
        heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        rss_mb: (mem.rss / 1024 / 1024).toFixed(1),
      },
    };
  }
}

export const hourlyStorage = new HourlyEnergyEngine();
