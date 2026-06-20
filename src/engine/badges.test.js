import { describe, it, expect } from 'vitest';
import { getUnlockedBadges, getAllBadges } from './badges.js';

const baseInputs = {
  transportMode: 'car_petrol',
  dailyDistanceKm: 15,
  commuteDaysPerWeek: 5,
  state: 'DL',
  monthlyKwh: 200,
  monthlyBillINR: 0,
  dietType: 'non_veg_moderate',
  domesticFlightsPerYear: 2,
  longTrainTripsPerYear: 1,
  acHoursPerDay: 6,
  shoppingLevel: 'average',
  cookingFuel: 'lpg'
};

describe('getUnlockedBadges', () => {
  it('returns empty for typical high-footprint user', () => {
    const badges = getUnlockedBadges(baseInputs);
    const ids = badges.map(b => b.id);
    expect(ids).not.toContain('cyclist');
    expect(ids).not.toContain('plant_based');
    expect(ids).not.toContain('grounded');
  });

  it('unlocks cyclist badge for bicycle commute', () => {
    const badges = getUnlockedBadges({ ...baseInputs, transportMode: 'bicycle' });
    expect(badges.some(b => b.id === 'cyclist')).toBe(true);
  });

  it('unlocks transit_pro for metro commute', () => {
    const badges = getUnlockedBadges({ ...baseInputs, transportMode: 'metro' });
    expect(badges.some(b => b.id === 'transit_pro')).toBe(true);
  });

  it('unlocks transit_pro for bus commute', () => {
    const badges = getUnlockedBadges({ ...baseInputs, transportMode: 'bus' });
    expect(badges.some(b => b.id === 'transit_pro')).toBe(true);
  });

  it('unlocks plant_based for vegan diet', () => {
    const badges = getUnlockedBadges({ ...baseInputs, dietType: 'vegan' });
    expect(badges.some(b => b.id === 'plant_based')).toBe(true);
  });

  it('unlocks veggie_champion for vegetarian diet', () => {
    const badges = getUnlockedBadges({ ...baseInputs, dietType: 'vegetarian' });
    expect(badges.some(b => b.id === 'veggie_champion')).toBe(true);
  });

  it('unlocks grounded for zero flights', () => {
    const badges = getUnlockedBadges({ ...baseInputs, domesticFlightsPerYear: 0 });
    expect(badges.some(b => b.id === 'grounded')).toBe(true);
  });

  it('unlocks cool_headed for low AC usage', () => {
    const badges = getUnlockedBadges({ ...baseInputs, acHoursPerDay: 1 });
    expect(badges.some(b => b.id === 'cool_headed')).toBe(true);
  });

  it('unlocks minimalist for low shopping', () => {
    const badges = getUnlockedBadges({ ...baseInputs, shoppingLevel: 'low' });
    expect(badges.some(b => b.id === 'minimalist')).toBe(true);
  });

  it('unlocks clean_cook for electric cooking', () => {
    const badges = getUnlockedBadges({ ...baseInputs, cookingFuel: 'electric' });
    expect(badges.some(b => b.id === 'clean_cook')).toBe(true);
  });

  it('unlocks green_grid for Karnataka', () => {
    const badges = getUnlockedBadges({ ...baseInputs, state: 'KA' });
    expect(badges.some(b => b.id === 'green_grid')).toBe(true);
  });

  it('unlocks short_commute for 3km distance', () => {
    const badges = getUnlockedBadges({ ...baseInputs, dailyDistanceKm: 3 });
    expect(badges.some(b => b.id === 'short_commute')).toBe(true);
  });

  it('does not unlock short_commute for 0km (no commute)', () => {
    const badges = getUnlockedBadges({ ...baseInputs, dailyDistanceKm: 0 });
    expect(badges.some(b => b.id === 'short_commute')).toBe(false);
  });

  it('can unlock multiple badges at once', () => {
    const greenInputs = {
      ...baseInputs,
      transportMode: 'bicycle',
      dietType: 'vegan',
      domesticFlightsPerYear: 0,
      acHoursPerDay: 0,
      shoppingLevel: 'low',
      cookingFuel: 'electric',
      state: 'KA'
    };
    const badges = getUnlockedBadges(greenInputs);
    expect(badges.length).toBeGreaterThanOrEqual(5);
  });

  it('returns empty array for null input', () => {
    expect(getUnlockedBadges(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(getUnlockedBadges(undefined)).toEqual([]);
  });

  it('each badge has required fields', () => {
    const badges = getUnlockedBadges({ ...baseInputs, transportMode: 'bicycle', dietType: 'vegan' });
    for (const badge of badges) {
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('title');
      expect(badge).toHaveProperty('description');
      expect(badge).not.toHaveProperty('condition'); // condition should be stripped
    }
  });

  it('is deterministic', () => {
    const a = getUnlockedBadges({ ...baseInputs, transportMode: 'metro' });
    const b = getUnlockedBadges({ ...baseInputs, transportMode: 'metro' });
    expect(a).toEqual(b);
  });
});

describe('getAllBadges', () => {
  it('returns all badge definitions', () => {
    const all = getAllBadges();
    expect(all.length).toBeGreaterThanOrEqual(8);
  });

  it('does not include condition functions', () => {
    const all = getAllBadges();
    for (const badge of all) {
      expect(badge).not.toHaveProperty('condition');
    }
  });
});
