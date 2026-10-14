/**
 * Hunonic Dashboard - Backend API Server
 * Self-hosted dashboard for Hunonic electric meter data
 */
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { createHunonicClient, type Device, type Home } from './lib/hunonic-api.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// In-memory cache for dashboard summary (TTL: 60 seconds)
let summaryCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ==========================================
// HUNONIC API PROXY ROUTES
// ==========================================

let hunonicClient: ReturnType<typeof createHunonicClient> | null = null;

function getClient() {
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

// Get all homes
app.get('/api/homes', async (c) => {
  try {
    const client = getClient();
    const homes = await client.getHomes();
    return c.json({ success: true, data: homes });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Get devices for a home
app.get('/api/homes/:homeId/devices', async (c) => {
  try {
    const homeId = c.req.param('homeId');
    const client = getClient();
    const devices = await client.getDevicesByHome(homeId);
    return c.json({ success: true, data: devices });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Get electric meter devices
app.get('/api/devices/electric-meters', async (c) => {
  try {
    const client = getClient();
    const devices = await client.getDevicesByHome();
    const electricMeters = devices.filter(d => 
      d.root_type === 'elmeter' || d.root_type === 'ekmeter' || d.root_type === 'atmwifi'
    );
    return c.json({ success: true, data: electricMeters });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Get consumption graph data
app.post('/api/devices/:rootId/consumption', async (c) => {
  try {
    const rootId = c.req.param('rootId');
    const body = await c.req.json();
    
    const { type, time_start, time_end, year, month } = body;
    if (!type || !time_start || !time_end || !year) {
      return c.json({ success: false, error: 'Missing required fields: type, time_start, time_end, year' }, 400);
    }

    const client = getClient();
    const data = await client.getGraphData({
      type,
      root_id: rootId,
      time_start,
      time_end,
      year,
      month,
    });
    
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Get summary stats for dashboard
app.get('/api/dashboard/summary', async (c) => {
  try {
    // Check in-memory cache first
    const now = Date.now();
    const forceRefresh = c.req.query('refresh') === 'true';
    if (!forceRefresh && summaryCache && (now - summaryCache.timestamp < CACHE_TTL_MS)) {
      return c.json({ success: true, data: summaryCache.data, cached: true });
    }

    const client = getClient();
    
    // 1. Get home info
    const homes = await client.getHomes();
    const home = homes[0] || { id: '966357', name: 'Nhà của Lang', timezone: 'GMT+07:00' };
    
    // 2. Get devices
    const devices = await client.getDevicesByHome(home.id);
    const electricMeters = devices.filter(d => 
      d.root_type === 'elmeter' || d.root_type === 'ekmeter' || d.root_type === 'atmwifi'
    );
    
    // 3. Get consumption data for the first meter
    let monthData = null;
    let electricityRate = null;
    let todayKwh = 0;
    let currentPowerW = 0;
    
    if (electricMeters.length > 0) {
      const meter = electricMeters[0];
      const dataExtra = parseJsonSafe(meter.data_extra);
      currentPowerW = dataExtra.power_current || 0;

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

      // Calculate today's kWh from graph_data or power_cache
      const todayStr = new Date().toISOString().slice(0, 10);
      if (monthData && Array.isArray(monthData.graph_data)) {
        const todayPoint = monthData.graph_data.find(d => d.label === todayStr);
        if (todayPoint) {
          todayKwh = todayPoint.value || 0;
        } else if (monthData.graph_data.length > 0) {
          // Latest recorded day
          const lastPoint = monthData.graph_data[monthData.graph_data.length - 1];
          todayKwh = lastPoint.value || 0;
        }
      }
    }

    // Safely extract electricity rate price and group
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
          data_extra: JSON.stringify(dataExtra),
          root_extra: JSON.stringify(rootExtra),
        };
      }),
      today: {
        kwh: todayKwh,
        power_current_w: currentPowerW,
        cost_estimated: Math.round(todayKwh * parseFloat(ratePrice)),
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

// Serve frontend static files
app.use('/*', serveStatic({ root: './frontend/dist' }));
app.get('*', serveStatic({ path: './frontend/dist/index.html' }));

// Export for serverless
export default {
  fetch: app.fetch,
  port: parseInt(process.env.PORT || '3000'),
};

// For Node.js standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const { serve } = await import('@hono/node-server');
  const port = parseInt(process.env.PORT || '3000');
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`✅ Server running at http://localhost:${port}`);
}
