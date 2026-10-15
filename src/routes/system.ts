import { Hono } from 'hono';
import { sqliteEnergy } from '../lib/sqlite-db.js';

export const systemRouter = new Hono();

// ==============================================================================
// SYSTEM DIAGNOSTICS & RETENTION PRUNING
// ==============================================================================

systemRouter.get('/api/system/status', (c) => {
  return c.json({
    success: true,
    data: {
      uptime: Math.round(process.uptime()),
      diagnostics: sqliteEnergy.getDiagnostics(),
    },
  });
});

systemRouter.post('/api/system/prune', (c) => {
  try {
    const result = sqliteEnergy.autoPrune(30);
    return c.json({
      success: true,
      message: `Pruning completed: removed ${result.prunedCount} samples`,
      data: result,
      diagnostics: sqliteEnergy.getDiagnostics(),
    });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
