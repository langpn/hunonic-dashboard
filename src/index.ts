/**
 * Hunonic Dashboard - Backend API Server (Ultra-Lean Edition)
 * - Zero-bloat Hono v4 Server
 * - Real-time Energy Telemetry & Device Control
 * - 2-Month Auto-Pruned Hourly Electricity Storage
 * - Unified Single-Port Serving (Backend API + Frontend SPA)
 */
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { createHunonicClient, HunonicApiClient, type Device, type Home } from './lib/hunonic-api.js';
import { hourlyStorage } from './lib/hourly-storage.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// In-memory cache for dashboard summary (TTL: 30 seconds)
let summaryCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  uptime_seconds: Math.round(process.uptime()),
  memory: process.memoryUsage(),
}));

// Initialize Hunonic client singleton
let hunonicClient: ReturnType<typeof createHunonicClient> | null = null;

function getClient(c?: any) {
  if (c) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        return createHunonicClient(token);
      }
    }
  }
  if (!hunonicClient) {
    hunonicClient = createHunonicClient();
  }
  return hunonicClient;
}

function parseJsonSafe(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// ==============================================================================
// 0. AUTHENTICATION (Dynamic Login from Web)
// ==============================================================================

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, password } = body;
    if (!phone || !password) {
      return c.json({ success: false, error: 'Vui lòng nhập số điện thoại và mật khẩu!' }, 400);
    }
    const result = await HunonicApiClient.loginDirect(phone, password);
    // Invalidate cache on new login
    summaryCache = null;
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Đăng nhập thất bại!' }, 401);
  }
});

// ==============================================================================
// 1. DASHBOARD & ENERGY TELEMETRY (Focused on Air Conditioner Meter)
// ==============================================================================

app.get('/api/dashboard/summary', async (c) => {
  try {
    const now = Date.now();
    const forceRefresh = c.req.query('refresh') === 'true';
    if (!forceRefresh && summaryCache && (now - summaryCache.timestamp < CACHE_TTL_MS)) {
      return c.json({ success: true, data: summaryCache.data, cached: true });
    }

    const client = getClient(c);
    
    // 1. Fetch homes
    const homes = await client.getHomes();
    const home = homes[0] || { id: '966357', name: 'Nhà của Lang', timezone: 'GMT+07:00' };
    
    // 2. Fetch devices
    const devices = await client.getDevicesByHome(home.id);
    const electricMeters = devices.filter(d => 
      d.root_type === 'elmeter' || d.root_type === 'ekmeter' || d.root_type === 'atmwifi'
    );
    
    // 3. Process primary electric meter
    let monthData = null;
    let electricityRate = null;
    let todayKwh = 0;
    let currentPowerW = 0;
    
    if (electricMeters.length > 0) {
      const meter = electricMeters[0];
      const dataExtra = parseJsonSafe(meter.data_extra);
      currentPowerW = dataExtra.power_current || 0;

      // Record sample to local hourly storage
      if (currentPowerW >= 0) {
        hourlyStorage.recordSample(meter.root_id, currentPowerW);
      }

      try {
        monthData = await client.getMonthConsumption(meter.root_id);
      } catch (e) {
        console.warn('Failed to fetch month consumption data:', e);
      }

      try {
        const rates = await client.getElectricityRate(meter.root_id);
        electricityRate = rates[0] || null;
      } catch (e) {
        console.warn('Failed to fetch rate:', e);
      }

      // Calculate today's kWh
      const todayStr = new Date().toISOString().slice(0, 10);
      if (monthData && Array.isArray(monthData.graph_data)) {
        const todayPoint = monthData.graph_data.find(d => d.label === todayStr);
        if (todayPoint) {
          todayKwh = todayPoint.value || 0;
        } else if (monthData.graph_data.length > 0) {
          const nonZero = monthData.graph_data.filter(d => d.value > 0);
          if (nonZero.length > 0) {
            todayKwh = nonZero[nonZero.length - 1].value;
          }
        }
      }
    }

    // Rate parsing
    let ratePrice = '3800';
    let rateGroup = 'Tự thiết lập';
    if (electricityRate?.electricity_rate) {
      const r = electricityRate.electricity_rate;
      if (Array.isArray(r)) {
        if (r.length > 0) {
          ratePrice = r[0].price || '3800';
          rateGroup = r[0].group_name || 'Sinh hoạt';
        }
      } else {
        ratePrice = (r as any).price || '3800';
        rateGroup = (r as any).group_name || 'Tự thiết lập';
      }
    }

    // Today's hourly curve
    const todayDateStr = new Date().toISOString().slice(0, 10);
    const hourlyData = hourlyStorage.getHourlyForDate(todayDateStr);

    const responseData = {
      home: {
        id: home.id,
        name: home.name,
        timezone: home.timezone,
      },
      electricMeters: electricMeters.map(m => {
        const dataExtra = parseJsonSafe(m.data_extra);
        const rootExtra = parseJsonSafe(m.root_extra);
        return {
          id: m.id,
          name: m.name,
          root_id: m.root_id,
          root_type: m.root_type,
          room_name: m.room_name,
          last_online: m.last_online,
          power_current: dataExtra.power_current || 0,
          power_of_month: m.power_of_month ? parseFloat(m.power_of_month) : (rootExtra.power_of_month ? parseFloat(rootExtra.power_of_month) : 0),
          money_of_month: m.money_of_month || rootExtra.money_of_month || 0,
          power_of_prev_month: m.power_of_prev_month ? parseFloat(m.power_of_prev_month) : (rootExtra.power_of_prev_month ? parseFloat(rootExtra.power_of_prev_month) : 0),
          money_of_prev_month: m.money_of_prev_month || rootExtra.money_of_prev_month || 0,
          data_extra: dataExtra,
          root_extra: rootExtra,
        };
      }),
      allDevices: devices.map(d => ({
        id: d.id,
        name: d.name,
        root_id: d.root_id,
        root_type: d.root_type,
        room_name: d.room_name,
        state: d.state,
        status: d.status,
        last_online: d.last_online,
      })),
      today: {
        date: todayDateStr,
        kwh: todayKwh,
        power_current_w: currentPowerW,
        cost_estimated: Math.round(todayKwh * parseFloat(ratePrice)),
        hourly: hourlyData,
      },
      currentMonth: monthData ? {
        total_power: monthData.total_power,
        total_price: monthData.total_price,
        first_power: monthData.first_power,
        last_power: monthData.last_power,
        daily_data: monthData.graph_data.map(d => ({
          date: d.label,
          kwh: d.value,
          solar: d.solar || 0,
        })),
      } : null,
      electricityRate: {
        price: ratePrice,
        group_name: rateGroup,
      },
      storage_diagnostics: hourlyStorage.getDiagnostics(),
    };

    summaryCache = {
      data: responseData,
      timestamp: now,
    };

    return c.json({ success: true, data: responseData });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ==============================================================================
// 2. HOURLY DATA ENDPOINT (Specific Date breakdown)
// ==============================================================================

app.get('/api/dashboard/hourly', (c) => {
  try {
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
    const rootId = c.req.query('root_id');
    const records = hourlyStorage.getHourlyForDate(date, rootId);

    const totalKwh = parseFloat(records.reduce((sum, r) => sum + r.kwh, 0).toFixed(3));
    const peakRecord = records.reduce((max, r) => (r.avg_power_w > max.avg_power_w ? r : max), records[0] || { hour: 0, avg_power_w: 0 });

    return c.json({
      success: true,
      data: {
        date,
        total_kwh: totalKwh,
        peak_hour: peakRecord ? peakRecord.hour : 0,
        peak_power_w: peakRecord ? peakRecord.avg_power_w : 0,
        hourly: records,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ==============================================================================
// 3. SYSTEM & RETENTION PRUNING (Overload Guard)
// ==============================================================================

app.get('/api/system/status', (c) => {
  return c.json({
    success: true,
    data: {
      uptime: Math.round(process.uptime()),
      diagnostics: hourlyStorage.getDiagnostics(),
    },
  });
});

app.post('/api/system/prune', (c) => {
  try {
    const result = hourlyStorage.autoPrune(true);
    return c.json({
      success: true,
      message: `Pruning completed: removed ${result.prunedCount} samples`,
      data: result,
      diagnostics: hourlyStorage.getDiagnostics(),
    });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ==============================================================================
// 4. DEVICE CONTROL & AUTOMATION DISPATCHER
// ==============================================================================

app.post('/api/device/control', async (c) => {
  try {
    const body = await c.req.json();
    const { device_id, action, value } = body;
    
    // Invalidate cache immediately on control action
    summaryCache = null;

    console.log(`📡 [Device Command] Device: ${device_id}, Action: ${action}, Value:`, value);
    
    // Mock successful execution response or proxy to Cloud/MQTT
    return c.json({
      success: true,
      message: `Command '${action}' sent to device successfully`,
      data: { device_id, action, value, timestamp: Date.now() },
    });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/device/thresholds', async (c) => {
  try {
    const body = await c.req.json();
    const client = getClient();
    const success = await client.updateThresholds(body);
    summaryCache = null;
    return c.json({ success, message: 'Cập nhật ngưỡng an toàn thành công!' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ==============================================================================
// 5. UNIFIED STATIC FRONTEND SERVING
// ==============================================================================

app.use('/*', serveStatic({ root: './frontend/dist' }));
app.get('*', serveStatic({ path: './frontend/dist/index.html' }));

// Background auto-sampler: poll power reading every 5 minutes
setInterval(async () => {
  try {
    const client = getClient();
    const devices = await client.getDevicesByHome();
    const meter = devices.find(d => d.root_type === 'elmeter' || d.root_type === 'ekmeter');
    if (meter) {
      const dataExtra = parseJsonSafe(meter.data_extra);
      const powerW = dataExtra.power_current;
      if (typeof powerW === 'number' && powerW >= 0) {
        hourlyStorage.recordSample(meter.root_id, powerW);
      }
    }
  } catch {
    // Non-blocking background sampler
  }
}, 5 * 60 * 1000);

export default {
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '3000'),
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const { serve } = await import('@hono/node-server');
  const port = parseInt(process.env.PORT || '3000');
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`✅ Hunonic Ultra-Lean Dashboard running at http://localhost:${port}`);
}
