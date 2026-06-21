import { describe, it, expect } from 'vitest';
import {
  calculateTransport,
  calculateElectricity,
  calculateDiet,
  calculateFlights,
  calculateLifestyle,
  calculateFootprint
} from './calculator.js';

describe('calculateTransport', () => {
  it('returns zero emissions for bicycle/walking', () => {
    const result = calculateTransport('bicycle', 10, 5);
    expect(result.value).toBe(0);
  });

  it('calculates metro emissions correctly', () => {
    // 18 gCO2/km × 10km × 2 (round-trip) × 5 days × 52 weeks / 1000
    const result = calculateTransport('metro', 10, 5);
    const expected = (18 * 10 * 2 * 5 * 52) / 1000;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('calculates car petrol emissions correctly', () => {
    const result = calculateTransport('car_petrol', 15, 6);
    const expected = (120 * 15 * 2 * 6 * 52) / 1000;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('handles zero distance', () => {
    const result = calculateTransport('car_petrol', 0, 5);
    expect(result.value).toBe(0);
  });

  it('handles zero days', () => {
    const result = calculateTransport('car_petrol', 10, 0);
    expect(result.value).toBe(0);
  });

  it('handles unknown transport mode', () => {
    const result = calculateTransport('hovercraft', 10, 5);
    expect(result.value).toBe(0);
    expect(result.mode).toBe('unknown');
  });

  it('clamps days to max 7', () => {
    const result = calculateTransport('bus', 5, 10);
    expect(result.daysPerWeek).toBe(7);
  });

  it('handles negative distance gracefully', () => {
    const result = calculateTransport('bus', -5, 5);
    expect(result.value).toBe(0);
  });

  it('handles NaN inputs', () => {
    const result = calculateTransport('bus', NaN, NaN);
    expect(result.value).toBe(0);
  });

  it('handles auto-rickshaw correctly', () => {
    const result = calculateTransport('auto_rickshaw', 5, 6);
    const expected = (38 * 5 * 2 * 6 * 52) / 1000;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('sums emissions across multiple transport modes', () => {
    const result = calculateTransport([
      { modeId: 'metro', dailyDistanceKm: 10, daysPerWeek: 5 },
      { modeId: 'car_petrol', dailyDistanceKm: 3, daysPerWeek: 2 },
      { modeId: 'bicycle', dailyDistanceKm: 2, daysPerWeek: 5 }
    ]);
    const expectedMetro = (18 * 10 * 2 * 5 * 52) / 1000;
    const expectedCar = (120 * 3 * 2 * 2 * 52) / 1000;
    expect(result.value).toBeCloseTo(expectedMetro + expectedCar, 1);
    expect(result.modes).toHaveLength(3);
    expect(result.mode).toBe('Multiple modes');
  });

  it('keeps legacy single-mode calculations backward compatible', () => {
    const legacy = calculateTransport('bus', 8, 4);
    const multi = calculateTransport([{ modeId: 'bus', dailyDistanceKm: 8, daysPerWeek: 4 }]);
    expect(multi.value).toBe(legacy.value);
  });
});

describe('calculateElectricity', () => {
  it('calculates with kWh input', () => {
    const result = calculateElectricity('XX', 200, 0);
    const expected = 200 * 0.73 * 12; // XX falls back to national avg
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('uses state-specific grid factor', () => {
    const result = calculateElectricity('KA', 200, 0);
    const expected = 200 * 0.50 * 12;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('converts bill to kWh when kWh is zero', () => {
    const result = calculateElectricity('DL', 0, 1600);
    expect(result.monthlyKwh).toBeCloseTo(200, 0);
  });

  it('prefers kWh over bill when both provided', () => {
    const result = calculateElectricity('DL', 300, 1600);
    expect(result.monthlyKwh).toBeCloseTo(300, 0);
  });

  it('handles zero inputs', () => {
    const result = calculateElectricity('DL', 0, 0);
    expect(result.value).toBe(0);
  });

  it('falls back to national average for unknown state', () => {
    const result = calculateElectricity('ZZ', 100, 0);
    expect(result.gridFactor).toBeCloseTo(0.73, 2);
  });

  it('handles negative values', () => {
    const result = calculateElectricity('DL', -100, 0);
    expect(result.value).toBe(0);
  });
});

describe('calculateDiet', () => {
  it('returns correct value for vegetarian', () => {
    const result = calculateDiet('vegetarian');
    expect(result.value).toBe(260);
    expect(result.type).toBe('Vegetarian');
  });

  it('returns correct value for vegan', () => {
    const result = calculateDiet('vegan');
    expect(result.value).toBe(190);
  });

  it('returns correct value for non-veg heavy', () => {
    const result = calculateDiet('non_veg_heavy');
    expect(result.value).toBe(580);
  });

  it('defaults to vegetarian for unknown diet', () => {
    const result = calculateDiet('unknown_diet');
    expect(result.value).toBe(260);
  });
});

describe('calculateFlights', () => {
  it('calculates domestic flight emissions', () => {
    const result = calculateFlights(2, 0);
    const expected = (2 * 1400 * 2 * 255) / 1000;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('includes train trip emissions', () => {
    const result = calculateFlights(0, 4);
    const expected = (4 * 800 * 2 * 12) / 1000;
    expect(result.value).toBeCloseTo(expected, 0);
  });

  it('handles zero flights', () => {
    const result = calculateFlights(0, 0);
    expect(result.value).toBe(0);
  });

  it('handles negative values', () => {
    const result = calculateFlights(-2, -1);
    expect(result.value).toBe(0);
  });
});

describe('calculateLifestyle', () => {
  it('calculates AC emissions', () => {
    const result = calculateLifestyle(8, 'low', 'lpg');
    const acExpected = 8 * 0.85 * 6 * 30;
    expect(result.acKgCO2).toBeCloseTo(acExpected, 0);
  });

  it('calculates shopping emissions', () => {
    const result = calculateLifestyle(0, 'high', 'lpg');
    expect(result.shoppingKgCO2).toBe(1200);
  });

  it('includes cooking fuel emissions', () => {
    const resultLpg = calculateLifestyle(0, 'low', 'lpg');
    expect(resultLpg.cookingKgCO2).toBe(350);

    const resultElectric = calculateLifestyle(0, 'low', 'electric');
    expect(resultElectric.cookingKgCO2).toBe(200);
  });

  it('handles zero AC hours', () => {
    const result = calculateLifestyle(0, 'low', 'lpg');
    expect(result.acKgCO2).toBe(0);
  });

  it('clamps AC to 24 hours max', () => {
    const result = calculateLifestyle(30, 'low', 'lpg');
    expect(result.acKgCO2).toBeCloseTo(24 * 0.85 * 6 * 30, 0);
  });

  it('defaults shopping to average for unknown level', () => {
    const result = calculateLifestyle(0, 'unknown', 'lpg');
    expect(result.shoppingKgCO2).toBe(600);
  });
});

describe('calculateFootprint (integration)', () => {
  const sampleInputs = {
    transportMode: 'two_wheeler',
    dailyDistanceKm: 10,
    commuteDaysPerWeek: 5,
    state: 'KA',
    monthlyKwh: 150,
    monthlyBillINR: 0,
    dietType: 'vegetarian',
    domesticFlightsPerYear: 1,
    longTrainTripsPerYear: 2,
    acHoursPerDay: 4,
    shoppingLevel: 'average',
    cookingFuel: 'lpg'
  };

  it('returns all required fields', () => {
    const result = calculateFootprint(sampleInputs);
    expect(result).toHaveProperty('transport');
    expect(result).toHaveProperty('electricity');
    expect(result).toHaveProperty('diet');
    expect(result).toHaveProperty('flights');
    expect(result).toHaveProperty('lifestyle');
    expect(result).toHaveProperty('totalKg');
    expect(result).toHaveProperty('totalTonnes');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('timestamp');
  });

  it('total equals sum of categories', () => {
    const result = calculateFootprint(sampleInputs);
    const sum = result.transport.value + result.electricity.value +
                result.diet.value + result.flights.value + result.lifestyle.value;
    expect(result.totalKg).toBeCloseTo(sum, 0);
  });

  it('category percentages sum to ~100', () => {
    const result = calculateFootprint(sampleInputs);
    const percentSum = result.categories.reduce((s, cat) => s + cat.percent, 0);
    expect(percentSum).toBeGreaterThanOrEqual(98);
    expect(percentSum).toBeLessThanOrEqual(102);
  });

  it('comparison values are reasonable', () => {
    const result = calculateFootprint(sampleInputs);
    expect(result.comparison.indiaAvg).toBe(1.9);
    expect(result.comparison.globalAvg).toBe(4.7);
    expect(typeof result.comparison.vsIndiaAvg).toBe('number');
    expect(typeof result.comparison.vsGlobalAvg).toBe('number');
  });

  it('assigns correct category', () => {
    const result = calculateFootprint(sampleInputs);
    expect(result.category).toHaveProperty('id');
    expect(result.category).toHaveProperty('label');
  });

  it('has valid timestamp', () => {
    const result = calculateFootprint(sampleInputs);
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('handles all-zero inputs gracefully', () => {
    const zeroInputs = {
      transportMode: 'bicycle',
      dailyDistanceKm: 0,
      commuteDaysPerWeek: 0,
      state: 'KA',
      monthlyKwh: 0,
      monthlyBillINR: 0,
      dietType: 'vegan',
      domesticFlightsPerYear: 0,
      longTrainTripsPerYear: 0,
      acHoursPerDay: 0,
      shoppingLevel: 'low',
      cookingFuel: 'electric'
    };
    const result = calculateFootprint(zeroInputs);
    expect(result.totalTonnes).toBeGreaterThanOrEqual(0);
    // Should still have diet + shopping + cooking
    expect(result.totalKg).toBeGreaterThan(0);
  });

  it('uses per-mode distances in the complete footprint', () => {
    const result = calculateFootprint({
      ...sampleInputs,
      transportModes: [
        { modeId: 'metro', dailyDistanceKm: 12, daysPerWeek: 5 },
        { modeId: 'car_petrol', dailyDistanceKm: 2, daysPerWeek: 1 }
      ]
    });
    expect(result.transport.modes).toHaveLength(2);
    expect(result.transport.value).toBeGreaterThan(0);
  });
});
