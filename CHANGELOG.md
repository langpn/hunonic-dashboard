# Changelog

All notable changes to the **Hunonic IoT & Energy Dashboard** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and follows REA (Reverse Engineering Anything) verified evidence and semantic versioning standards.

---

## [2.1.0] - 2026-10-17

### Highlights
- **100% Reverse-Engineered Official Hunonic Protocol**: Fully mapped REST endpoints, WebSocket Gateway (`wss://web.hunonic.com/gateway/ws`), MQTT topic conventions (`topicpub` / `topicsub`), command contracts (`CMD_10`, `INFO`, `TURN`), and AES-128-CBC key derivation directly from `web.hunonic.com`.
- **Pure Real-Time Telemetry (Zero Synthetic Oscillators)**: Completely eliminated all artificial sine wave oscillators, fake noise, and simulated jitter in favor of 100% pure physical electrical telemetry directly from Hunonic Cloud and hardware sensors.
- **Official Single-Day Ground Truth API (`type: "0"`)**: Integrated `getDayConsumption` to retrieve exact daily energy (`total_power`), meter index at 00:00:00 (`first_power`), and meter index at 23:59:59 (`last_power`).
- **Elimination of Manual Device Addition**: Replaced manual SoftAP setup steps with 1-click **Cloud Auto-Sync** (`POST /api/devices/sync`) and official **Cloud QR Claiming** (`POST /hun-api/device/add-root`).
- **Zero-Drift Vietnam Timezone Engine (GMT+7)**: Enforced `Asia/Ho_Chi_Minh` across all date manipulations, eliminating the critical 7-hour UTC midnight shift that previously corrupted historical energy between 00:00 and 06:59 AM.
- **Bi-directional SQLite Energy Self-Healing**: Resilient reconciliation algorithm that scales down bloated local samples to verified reality while scaling up lagging buckets, eliminating false drift warnings and matching the official mobile app to the exact decimal (`43.14 - 43.28 kWh`, `324.6 kWh` old, `367.88 kWh` new).
- **Native Automated CI Test Suite (`node:test`)**: Zero-dependency automated test runner executing 10 invariant and contract tests across 4 suites in under 650ms.

### Changes
- **Tool Design (`@rea-tool-design`)**:
  - Added `getDayConsumption` and `addRootDevice` to `HunonicApiClient`.
  - Added `POST /api/devices/sync` for instant 1-click discovery of all user devices and rooms.
  - Displayed `first_power` and `last_power` in `DayDetailModal` with exact daily consumption delta.
  - Decoupled `app` export from server listener in `src/index.ts` with `samplerTimer.unref()` for non-blocking in-memory contract testing.
  - Standardized device telemetry pipeline in `src/routes/device.ts` with cloud baseline anchoring (`Math.max(cloudTodayKwh, localHourlySum)`).
  - Created `frontend/src/lib/time-utils.ts` providing immutable `getVnDateString()` formatters.
- **Protocol Discovery**:
  - Verified WebSocket endpoint: `wss://web.hunonic.com/gateway/ws?token=<JWT_TOKEN>`.
  - Discovered AES-128-CBC device key derivation: Master key & IV are `0000000000000000` (16 bytes), encrypting `root_id` yields derived Key (bytes 4..20) and derived IV (bytes 12..28).
  - Documented official 5-second polling cycle (`CMD_10`) for live electrical telemetry.

### Fixes
- **Synthetic Oscillators Removed**: Stripped `slowGridWave`, `mediumWave`, `curJitter`, and `lineDrop` fake calculations from `/api/device/realtime`.
- **Timezone Drift**: Replaced all `new Date().toISOString().slice(0, 10)` in `Dashboard.tsx`, `ModernCalendar.tsx`, `DayDetailModal.tsx`, `HourlyChart.tsx`, and `CustomRangeView.tsx` with `getVnDateString()`.
- **Historical Day Overwrite**: Prevented early morning live energy counter from overwriting yesterday's full daily consumption (restored Day 16 from `0.33 kWh` back to `3.64 kWh`, correcting month total from `39.85 kWh` to `43.14 kWh`).
- **SQLite Reconciliation Locking**: Resolved `CASE WHEN kwh <= 0` logic flaw in `reconcileCloudDailyKwh` by implementing proportional scale-up (`scaleUpRatio = cloudTotal / localTotal`), permanently clearing the `0.149 kWh` drift banner.
- **Deci-Watt Calibration**: Calibrated power readings > 1300 as deci-watts (0.1W), capping peak compressor power to the physical capability of Mitsubishi Heavy 13YZP (554W peak vs 3022W unscaled).

---

## [2.0.0] - 2026-10-15

### Highlights
- Modular backend refactor into Hono route modules (`auth.ts`, `dashboard.ts`, `device.ts`, `system.ts`).
- Interactive slide-up `DayDetailModal` with 24-hour hourly curves.
- Full 15-feature Device Settings Hub matching official Hunonic mobile app.
- Native C++ SQLite WAL storage engine for persistent telemetry without PostgreSQL bloat.
