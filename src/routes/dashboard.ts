import { Hono } from 'hono';
import { getClient, getDaemonClient, parseJsonSafe, handleAuthError, summaryCache, setSummaryCache, CACHE_TTL_MS } from '../lib/app-context.js';
import { sqliteEnergy, getVnTimeParts } from '../lib/sqlite-db.js';

export const dashboardRouter = new Hono();

// Helper to get client with automatic daemon fallback if bearer token is stale/revoked
async function resolveClient(c: any) {
  let client = getClient(c);
  if (c?.req.header('Authorization')) {
    try {
      // Validate the token against Hunonic Cloud
      await client.getHomes();
      return client;
    } catch (err) {
      console.warn('Dashboard router: Bearer token rejected by Hunonic Cloud, auto-falling back to daemon client...');
      return getDaemonClient();
    }
  }
  return client;
}

// ==============================================================================
// 1. DASHBOARD SUMMARY (Primary telemetry, current month & day)
// ==============================================================================

dashboardRouter.get('/api/dashboard/summary', async (c) => {
  try {
    const now = Date.now();
    const forceRefresh = c.req.query('refresh') === 'true';

    // Parse requested year, month, device_id, and home_id
    const reqYear = c.req.query('year') ? parseInt(c.req.query('year')!) : new Date().getFullYear();
    const reqMonth = c.req.query('month') ? parseInt(c.req.query('month')!) : (new Date().getMonth() + 1);
    const targetDeviceId = c.req.query('device_id');
    const targetRootId = c.req.query('root_id');
    const cacheKey = `${reqYear}-${reqMonth}-${targetDeviceId || 'default'}`;

    if (!forceRefresh && summaryCache && summaryCache.key === cacheKey && (now - summaryCache.timestamp < CACHE_TTL_MS)) {
      return c.json({ success: true, data: summaryCache.data, cached: true });
    }

    const client = await resolveClient(c);
    
    // 1. Fetch homes
    const homes = await client.getHomes();
    const targetHomeId = c.req.query('home_id');
    const home = (targetHomeId ? homes.find((h: any) => String(h.id) === String(targetHomeId)) : null) || homes[0] || { id: '966357', name: 'Nhà của Lang', timezone: 'GMT+07:00' };
    
    // 2. Fetch devices
    const devices = await client.getDevicesByHome(home.id);
    const electricMeters = devices.filter((d: any) => 
      d.root_type === 'elmeter' || d.root_type === 'ekmeter' || d.root_type === 'atmwifi'
    );
    
    // 3. Process active electric meter
    let monthData = null;
    let electricityRate = null;
    let todayKwh = 0;
    let currentPowerW = 0;
    let driftDetected = false;
    let driftDiff = 0;
    
    const activeMeter = (targetDeviceId ? electricMeters.find((m: any) => String(m.id) === String(targetDeviceId)) : null) ||
                        (targetRootId ? electricMeters.find((m: any) => m.root_id === targetRootId) : null) ||
                        electricMeters[0];

    if (activeMeter) {
      const dataExtra = parseJsonSafe(activeMeter.data_extra);
      currentPowerW = dataExtra.power_current || 0;

      // Scale powerW if transmitted in deci-watts (> 1300W exceeds 1240W physical capability of Mitsu 13YZP)
      if (currentPowerW > 1300) {
        currentPowerW = Math.round(currentPowerW / 10);
      }

      // Record sample to local SQLite storage
      if (currentPowerW >= 0) {
        sqliteEnergy.recordFluctuatingPower(currentPowerW);
      }

      try {
        monthData = await client.getMonthConsumption(activeMeter.root_id, reqYear, reqMonth);
      } catch (e) {
        console.warn(`Failed to fetch month consumption data for ${reqMonth}/${reqYear}:`, e);
      }

      try {
        const rates = await client.getElectricityRate(activeMeter.root_id);
        electricityRate = rates[0] || null;
      } catch (e) {
        console.warn('Failed to fetch rate:', e);
      }

      // Calculate today's kWh from Cloud
      const { dateStr: todayStr } = getVnTimeParts();
      if (monthData && Array.isArray(monthData.graph_data)) {
        const todayPoint = monthData.graph_data.find((d: any) => d.label === todayStr);
        if (todayPoint) {
          todayKwh = todayPoint.value || 0;
        } else if (monthData.graph_data.length > 0) {
          const nonZero = monthData.graph_data.filter((d: any) => d.value > 0);
          if (nonZero.length > 0) {
            todayKwh = nonZero[nonZero.length - 1].value;
          }
        }
      }

      // Check for local vs cloud drift before reconciliation
      const localHourlyBefore = sqliteEnergy.getHourlyForDate(todayStr);
      const localTotalBefore = parseFloat(localHourlyBefore.reduce((sum, r) => sum + r.kwh, 0).toFixed(3));
      driftDiff = parseFloat((todayKwh - localTotalBefore).toFixed(3));

      // Smart reconciliation: Seed today's confirmed Cloud energy into SQLite if SQLite is behind
      if (todayKwh > 0 && (driftDiff > 0.05 || localTotalBefore < todayKwh * 0.90)) {
        sqliteEnergy.reconcileCloudDailyKwh(todayStr, todayKwh);
        driftDetected = true;
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

    const { dateStr: todayDateStr } = getVnTimeParts();
    const hourlyData = sqliteEnergy.getHourlyForDate(todayDateStr);

    const responseData = {
      home: {
        id: home.id,
        name: home.name,
        timezone: home.timezone,
      },
      electricMeters: electricMeters.map((m: any) => {
        const dataExtra = parseJsonSafe(m.data_extra);
        const rootExtra = parseJsonSafe(m.root_extra);
        return {
          id: String(m.id),
          name: m.name,
          root_id: m.root_id,
          root_type: m.root_type,
          room_name: m.room_name || 'Chưa xếp phòng',
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
      allDevices: devices.map((d: any) => ({
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
        daily_data: monthData.graph_data.map((d: any) => ({
          date: d.label,
          kwh: d.value,
          solar: d.solar || 0,
        })),
      } : null,
      electricityRate: {
        price: ratePrice,
        group_name: rateGroup,
      },
      active_device_id: activeMeter ? String(activeMeter.id) : null,
      drift_status: {
        detected: driftDetected,
        diff_kwh: driftDiff > 0 ? driftDiff : 0,
        message: 'Dữ liệu đo cục bộ bị lệch so với Cloud Hunonic. Hệ thống đã tự động hiệu chỉnh và cập nhật lại chuẩn xác!',
      },
      storage_diagnostics: sqliteEnergy.getDiagnostics(),
    };

    setSummaryCache({
      data: responseData,
      timestamp: now,
      key: cacheKey,
    });

    return c.json({ success: true, data: responseData });
  } catch (error) {
    const err = handleAuthError(error, c);
    return c.json(err.response, err.status);
  }
});

// ==============================================================================
// 2. DASHBOARD HISTORY (Yearly / Custom Range / Daily 24H Breakdown)
// ==============================================================================

dashboardRouter.get('/api/dashboard/history', async (c) => {
  try {
    const type = c.req.query('type') || 'year';
    const targetDeviceId = c.req.query('device_id');
    const targetRootId = c.req.query('root_id');
    const client = await resolveClient(c);
    const devices = await client.getDevicesByHome();
    const meter = (targetDeviceId ? devices.find((d: any) => String(d.id) === String(targetDeviceId)) : null) ||
                  (targetRootId ? devices.find((d: any) => d.root_id === targetRootId) : null) ||
                  devices.find((d: any) => d.root_type === 'elmeter' || d.root_type === 'ekmeter' || d.root_type === 'atmwifi');
    if (!meter) {
      return c.json({ success: false, error: 'Không tìm thấy công tơ điện!' }, 404);
    }

    if (type === 'year') {
      const year = c.req.query('year') ? parseInt(c.req.query('year')!) : new Date().getFullYear();
      const yearData = await client.getYearlyConsumption(meter.root_id, year);
      return c.json({ success: true, data: yearData });
    }

    if (type === 'custom') {
      const start = c.req.query('start');
      const end = c.req.query('end');
      if (!start || !end) {
        return c.json({ success: false, error: 'Cần ngày bắt đầu (start) và ngày kết thúc (end)!' }, 400);
      }
      const customData = await client.getGraphData({
        type: '2',
        root_id: meter.root_id,
        time_start: start,
        time_end: end,
        year: start.slice(0, 4),
      });
      return c.json({ success: true, data: customData });
    }

    if (type === 'day') {
      const { dateStr: defaultVnDate } = getVnTimeParts();
      const date = c.req.query('date') || defaultVnDate;

      // 1. Check verified daily total from Hunonic Cloud API
      let cloudTotalKwh = 0;
      try {
        const cloudRes = await client.getGraphData({
          type: '0',
          root_id: meter.root_id,
          time_start: date,
          time_end: date,
          year: date.slice(0, 4),
        });
        cloudTotalKwh = cloudRes.total_power || (cloudRes.graph_data?.[0]?.value ?? 0);
      } catch (e) {
        console.warn(`Failed to fetch cloud day data for ${date}:`, e);
      }

      // 2. Reconcile energy into SQLite so the 24-hour chart matches reality 100%
      if (cloudTotalKwh > 0) {
        sqliteEnergy.reconcileCloudDailyKwh(date, cloudTotalKwh);
      }

      // 3. Read the 24 hourly buckets
      const hourly = sqliteEnergy.getHourlyForDate(date);
      const localTotalKwh = parseFloat(hourly.reduce((sum, r) => sum + r.kwh, 0).toFixed(3));
      const finalTotalKwh = localTotalKwh > 0 ? localTotalKwh : cloudTotalKwh;
      const peakRecord = hourly.reduce((max, r) => (r.avg_power_w > max.avg_power_w ? r : max), hourly[0] || { hour: 0, avg_power_w: 0 });

      return c.json({
        success: true,
        data: {
          date,
          total_kwh: finalTotalKwh,
          peak_hour: peakRecord ? peakRecord.hour : 0,
          peak_power_w: peakRecord ? peakRecord.avg_power_w : 0,
          is_from_cloud: cloudTotalKwh > 0 && localTotalKwh < cloudTotalKwh * 0.95,
          hourly,
        },
      });
    }

    return c.json({ success: false, error: 'Loại truy vấn không hợp lệ' }, 400);
  } catch (error) {
    const err = handleAuthError(error, c);
    return c.json(err.response, err.status);
  }
});

// ==============================================================================
// 3. HOURLY DATA QUERY (Standalone date endpoint)
// ==============================================================================

dashboardRouter.get('/api/dashboard/hourly', (c) => {
  try {
    const { dateStr: defaultVnDate } = getVnTimeParts();
    const date = c.req.query('date') || defaultVnDate;
    const records = sqliteEnergy.getHourlyForDate(date);

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
