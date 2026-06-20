import { describe, it, expect } from 'vitest';
import { getFallbackTips } from './tipGenerator.js';

const mockFootprintResult = {
  categories: [
    { id: 'transport', label: 'Transport', value: 800, percent: 35 },
    { id: 'electricity', label: 'Electricity', value: 600, percent: 26 },
    { id: 'diet', label: 'Diet', value: 260, percent: 11 },
    { id: 'flights', label: 'Travel', value: 350, percent: 15 },
    { id: 'lifestyle', label: 'Lifestyle', value: 300, percent: 13 }
  ],
  totalTonnes: 2.31,
  comparison: { indiaAvg: 1.9, globalAvg: 4.7 }
};

describe('getFallbackTips', () => {
  it('returns an array of tips', () => {
    const tips = getFallbackTips(mockFootprintResult);
    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);
  });

  it('each tip has required fields', () => {
    const tips = getFallbackTips(mockFootprintResult);
    for (const tip of tips) {
      expect(tip).toHaveProperty('title');
      expect(tip).toHaveProperty('description');
      expect(tip).toHaveProperty('estimatedSavingsKg');
      expect(tip).toHaveProperty('effort');
      expect(tip).toHaveProperty('category');
      expect(typeof tip.title).toBe('string');
      expect(typeof tip.estimatedSavingsKg).toBe('number');
    }
  });

  it('tips are sorted by estimated savings descending', () => {
    const tips = getFallbackTips(mockFootprintResult);
    for (let i = 1; i < tips.length; i++) {
      expect(tips[i - 1].estimatedSavingsKg).toBeGreaterThanOrEqual(tips[i].estimatedSavingsKg);
    }
  });

  it('prioritizes tips from highest-emission category', () => {
    const tips = getFallbackTips(mockFootprintResult);
    const transportTips = tips.filter(t => t.category === 'Transport');
    expect(transportTips.length).toBeGreaterThan(0);
  });

  it('returns empty array for null input', () => {
    expect(getFallbackTips(null)).toEqual([]);
  });

  it('returns empty array for missing categories', () => {
    expect(getFallbackTips({})).toEqual([]);
  });

  it('has no duplicate tips', () => {
    const tips = getFallbackTips(mockFootprintResult);
    const titles = tips.map(t => t.title);
    expect(titles.length).toBe(new Set(titles).size);
  });
});
