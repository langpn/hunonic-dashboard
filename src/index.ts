import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getClient, parseJsonSafe } from './lib/app-context.js';
import { sqliteEnergy } from './lib/sqlite-db.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { deviceRouter } from './routes/device.js';
import { systemRouter } from './routes/system.js';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', cors());

// Health Check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  architecture: 'Option B: Hybrid Cloud Ground-Truth + Unpaywalled 24h Hourly Engine',
  timestamp: new Date().toISOString(),
  uptime_seconds: Math.round(process.uptime()),
  memory: process.memoryUsage(),
}));

// Mount Modular Routes
app.route('/', authRouter);
app.route('/', dashboardRouter);
app.route('/', deviceRouter);
app.route('/', systemRouter);

// Unified Static Frontend Serving
app.use('/*', serveStatic({ root: './frontend/dist' }));
app.get('*', serveStatic({ path: './frontend/dist/index.html' }));

// Background auto-sampler: integrate fluctuating power into SQLite every 15s (Zero Waste)
const samplerTimer = setInterval(async () => {
  try {
    const client = getClient();
    const devices = await client.getDevicesByHome();
    const meter = devices.find((d: any) => d.root_type === 'elmeter' || d.root_type === 'ekmeter');
    if (meter) {
      const dataExtra = parseJsonSafe(meter.data_extra);
      let powerW = dataExtra.power_current;
      if (typeof powerW === 'number' && powerW >= 0) {
        if (powerW > 1300) powerW = Math.round(powerW / 10);
        sqliteEnergy.recordFluctuatingPower(powerW);
      }
    }
  } catch {
    // Non-blocking background sampler
  }
}, 15 * 1000);
if (samplerTimer.unref) samplerTimer.unref();

const isTest = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));
const port = parseInt(process.env.PORT || '3000', 10);

if (!isTest) {
  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`⚡ Hunonic Studio Server (Option B Hybrid) running at http://localhost:${info.port}`);
  });
}

export { app };
export default {
  fetch: app.fetch,
  port,
};
