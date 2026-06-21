import { describe, expect, it } from 'vitest';
import { getEarthMood } from './earthMood.js';

function makeResult(overrides = {}) {
  return {
    totalTonnes: 1,
    comparison: { indiaAvg: 1.9 },
    transport: { value: 100 },
    electricity: { value: 300, gridFactor: 0.5 },
    diet: { value: 260 },
    lifestyle: { cookingKgCO2: 200 },
    ...overrides
  };
}

describe('getEarthMood', () => {
  it('returns a neutral accessible state when there is no data', () => {
    expect(getEarthMood(null)).toEqual({
      healthScore: 50,
      mood: 'neutral',
      label: 'waiting for footprint data',
      factors: [],
      ariaLabel: 'Earth mascot: waiting for footprint data'
    });
  });

  it('maps a very low footprint to a happy healthy Earth', () => {
    const mood = getEarthMood(makeResult({ totalTonnes: 0.5 }), { cookingFuel: 'electric' });
    expect(mood.mood).toBe('happy');
    expect(mood.healthScore).toBeGreaterThan(65);
    expect(mood.factors).toEqual([]);
  });

  it('maps a very high footprint to a stressed Earth', () => {
    const mood = getEarthMood(makeResult({ totalTonnes: 5.5 }));
    expect(mood.mood).toBe('stressed');
    expect(mood.healthScore).toBe(0);
  });

  it('combines specific problem factors', () => {
    const mood = getEarthMood(makeResult({
      totalTonnes: 4,
      transport: { value: 900 },
      electricity: { value: 1200, gridFactor: 0.9 },
      diet: { value: 580 },
      lifestyle: { cookingKgCO2: 350 }
    }), {
      cookingFuel: 'lpg',
      transportModes: [{ modeId: 'car_petrol' }, { modeId: 'metro' }]
    });
    expect(mood.factors).toEqual([
      'fossil-fuel cooking',
      'high-emission transport',
      'coal-heavy electricity',
      'high-impact diet'
    ]);
    expect(mood.ariaLabel).toContain('high-emission transport');
  });

  it('recognizes legacy single-mode transport input', () => {
    const mood = getEarthMood(makeResult({ transport: { value: 500 } }), {
      transportMode: 'car_diesel'
    });
    expect(mood.factors).toContain('high-emission transport');
  });
});
