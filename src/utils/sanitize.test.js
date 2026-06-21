import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeEnum,
  sanitizeTransportModes,
  validateCalculatorInputs
} from './sanitize.js';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('');
  });

  it('strips event handlers', () => {
    expect(sanitizeString('<img onerror="alert(1)">')).toBe('');
  });

  it('returns empty for non-string input', () => {
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('preserves valid text', () => {
    expect(sanitizeString('Karnataka')).toBe('Karnataka');
  });

  it('handles SQL injection attempts', () => {
    const result = sanitizeString("'; DROP TABLE users; --");
    expect(result).not.toContain('<');
    expect(typeof result).toBe('string');
  });
});

describe('sanitizeNumber', () => {
  it('returns valid number within range', () => {
    expect(sanitizeNumber(10, 0, 100)).toBe(10);
  });

  it('clamps to minimum', () => {
    expect(sanitizeNumber(-5, 0, 100)).toBe(0);
  });

  it('clamps to maximum', () => {
    expect(sanitizeNumber(200, 0, 100)).toBe(100);
  });

  it('returns fallback for NaN', () => {
    expect(sanitizeNumber('abc', 0, 100, 50)).toBe(50);
  });

  it('returns fallback for Infinity', () => {
    expect(sanitizeNumber(Infinity, 0, 100, 0)).toBe(0);
  });

  it('handles string numbers', () => {
    expect(sanitizeNumber('42', 0, 100)).toBe(42);
  });

  it('handles null/undefined', () => {
    expect(sanitizeNumber(null, 0, 100, 5)).toBe(5);
    expect(sanitizeNumber(undefined, 0, 100, 5)).toBe(5);
  });
});

describe('sanitizeEnum', () => {
  const allowed = ['low', 'medium', 'high'];

  it('returns value when in allowed list', () => {
    expect(sanitizeEnum('medium', allowed, 'low')).toBe('medium');
  });

  it('returns fallback for invalid value', () => {
    expect(sanitizeEnum('extreme', allowed, 'low')).toBe('low');
  });

  it('returns fallback for empty input', () => {
    expect(sanitizeEnum('', allowed, 'low')).toBe('low');
  });

  it('handles null/undefined', () => {
    expect(sanitizeEnum(null, allowed, 'low')).toBe('low');
    expect(sanitizeEnum(undefined, allowed, 'low')).toBe('low');
  });
});

describe('validateCalculatorInputs', () => {
  it('sanitizes all fields', () => {
    const raw = {
      transportMode: 'car_petrol',
      dailyDistanceKm: '15',
      commuteDaysPerWeek: 5,
      state: 'KA',
      monthlyKwh: 200,
      monthlyBillINR: 0,
      dietType: 'vegetarian',
      domesticFlightsPerYear: 1,
      longTrainTripsPerYear: 2,
      acHoursPerDay: 4,
      shoppingLevel: 'average',
      cookingFuel: 'lpg'
    };
    const { inputs, errors } = validateCalculatorInputs(raw);
    expect(inputs.transportMode).toBe('car_petrol');
    expect(inputs.dailyDistanceKm).toBe(15);
    expect(errors.length).toBe(0);
  });

  it('falls back to defaults for invalid transport mode', () => {
    const raw = { transportMode: '<script>evil</script>' };
    const { inputs } = validateCalculatorInputs(raw);
    expect(inputs.transportMode).toBe('bus');
  });

  it('clamps out-of-range numbers', () => {
    const raw = { dailyDistanceKm: 9999, acHoursPerDay: 48, state: 'DL' };
    const { inputs } = validateCalculatorInputs(raw);
    expect(inputs.dailyDistanceKm).toBe(500);
    expect(inputs.acHoursPerDay).toBe(24);
  });

  it('adds error for missing state', () => {
    const raw = { state: '' };
    const { errors } = validateCalculatorInputs(raw);
    expect(errors).toContain('Please select your state');
  });

  it('sanitizes multi-mode transport entries and rejects invalid modes', () => {
    const { inputs } = validateCalculatorInputs({
      state: 'KA',
      transportModes: [
        { modeId: 'metro', dailyDistanceKm: '12', daysPerWeek: 5 },
        { modeId: '<script>bad</script>', dailyDistanceKm: 9999, daysPerWeek: 99 },
        { modeId: 'car_petrol', dailyDistanceKm: -5, daysPerWeek: 2 }
      ]
    });
    expect(inputs.transportModes).toEqual([
      { modeId: 'metro', dailyDistanceKm: 12, daysPerWeek: 5 },
      { modeId: 'car_petrol', dailyDistanceKm: 0, daysPerWeek: 2 }
    ]);
  });

  it('falls back to a legacy transport entry when no valid array remains', () => {
    const { inputs } = validateCalculatorInputs({
      state: 'DL',
      transportMode: 'bus',
      dailyDistanceKm: 7,
      commuteDaysPerWeek: 3,
      transportModes: [{ modeId: 'spaceship', dailyDistanceKm: 20 }]
    });
    expect(inputs.transportModes).toEqual([
      { modeId: 'bus', dailyDistanceKm: 7, daysPerWeek: 3 }
    ]);
  });
});

describe('sanitizeTransportModes', () => {
  it('deduplicates modes and clamps usage fields', () => {
    expect(sanitizeTransportModes([
      { modeId: 'metro', dailyDistanceKm: 10, daysPerWeek: 5 },
      { modeId: 'metro', dailyDistanceKm: 20, daysPerWeek: 7 },
      { modeId: 'bus', dailyDistanceKm: 800, daysPerWeek: -1 }
    ], ['metro', 'bus'])).toEqual([
      { modeId: 'metro', dailyDistanceKm: 10, daysPerWeek: 5 },
      { modeId: 'bus', dailyDistanceKm: 500, daysPerWeek: 0 }
    ]);
  });
});
