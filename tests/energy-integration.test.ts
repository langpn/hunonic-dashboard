import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Energy Integration & Deci-Watt Calibration Tests', () => {
  function calibrateRawPower(rawW: number): number {
    // Hunonic Cloud sends values > 1300 as deci-watts (0.1W)
    if (rawW > 1300) {
      return Math.round(rawW / 10);
    }
    return rawW;
  }

  it('should accurately calibrate deci-watt readings to real physical wattage', () => {
    // 1. Standby / Micro-modulation
    assert.equal(calibrateRawPower(22), 22, '22W standby should remain 22W');
    assert.equal(calibrateRawPower(180), 180, '180W ECO should remain 180W');

    // 2. High values transmitted as deci-watts
    assert.equal(calibrateRawPower(1883), 188, 'Raw 1883 should calibrate to 188W');
    assert.equal(calibrateRawPower(3022), 302, 'Raw 3022 should calibrate to 302W');
    assert.equal(calibrateRawPower(5125), 513, 'Raw 5125 should calibrate to 513W');
    assert.equal(calibrateRawPower(12400), 1240, 'Raw 12400 should calibrate to 1240W physical peak');
  });

  it('should accurately calculate electrical current (Amperes) matching Mitsu 13YZP LCD', () => {
    function calculateCurrent(powerW: number, configuredMaxA: number = 5.7): number {
      if (powerW <= 0) return 0.0;
      if (powerW <= 48) return 0.1;

      const loadRatio = Math.min(1.0, powerW / 1240);
      const powerFactor = 0.76 + (loadRatio * 0.22); // 0.76 at light modulation, up to 0.98 at max load
      const activeCur = powerW / (230.0 * powerFactor);
      return parseFloat(Math.min(configuredMaxA, Math.max(0.1, activeCur)).toFixed(2));
    }

    // Standby: ~0.1A
    assert.equal(calculateCurrent(22), 0.1, 'Standby current must be 0.1A');

    // Light ECO cooling: ~188W -> ~1.05A - 1.10A
    const ecoCurrent = calculateCurrent(188);
    assert.ok(ecoCurrent >= 0.95 && ecoCurrent <= 1.20, `ECO current ${ecoCurrent}A must be between 0.95A and 1.20A`);

    // Nominal cooling: ~600W -> ~2.8A - 3.1A
    const normCurrent = calculateCurrent(600);
    assert.ok(normCurrent >= 2.6 && normCurrent <= 3.3, `Nominal current ${normCurrent}A must be ~3.0A`);

    // Max peak capability: 1240W -> 5.5A - 5.7A (Never exceed configured 5.7A)
    const peakCurrent = calculateCurrent(1240);
    assert.ok(peakCurrent <= 5.7, `Peak current ${peakCurrent}A must not exceed 5.7A max`);
  });

  it('should integrate trapezoidal power correctly into energy (kWh)', () => {
    // 1000W running continuously for 1 hour (3600 seconds) = exactly 1.000 kWh
    const powerW = 1000;
    const deltaSeconds = 3600;
    const energyKwh = parseFloat(((powerW * deltaSeconds) / (3600 * 1000)).toFixed(4));
    assert.equal(energyKwh, 1.0, '1000W for 1h must equal 1.000 kWh');

    // 180W running for 15 seconds sample
    const sampleEnergy = (180 * 15) / (3600 * 1000); // 0.00075 kWh
    assert.equal(parseFloat(sampleEnergy.toFixed(6)), 0.00075);
  });
});
