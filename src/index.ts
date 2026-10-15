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
setInterval(async () => {
  try {
    const client = getClient();
    const devices = await client.getDevicesByHome();
    const meter = devices.find((d: any) => d.root_type === 'elmeter' || d.root_type === 'ekmeter');
    if (meter) {
      const dataExtra = parseJsonSafe(meter.data_extra);
      const powerW = dataExtra.power_current;
      if (typeof powerW === 'number' && powerW >= 0) {
        sqliteEnergy.recordFluctuatingPower(powerW);
      }
    }
  } catch {
    // Non-blocking background sampler
  }
}, 15 * 1000);

const port = parseInt(process.env.PORT || '3000', 10);
serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`⚡ Hunonic Studio Server running at http://localhost:${info.port}`);
});

export default {
  fetch: app.fetch,
  port,
};
