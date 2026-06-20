import { describe, it, expect } from 'vitest';
import { buildCardConfig } from './shareCard.js';

const mockData = {
  totalTonnes: 2.5,
  categoryLabel: 'Moderate',
  categories: [
    { label: 'Transport', percent: 35, icon: '🚗' },
    { label: 'Electricity', percent: 25, icon: '⚡' },
    { label: 'Diet', percent: 15, icon: '🍽️' },
    { label: 'Travel', percent: 15, icon: '✈️' },
    { label: 'Lifestyle', percent: 10, icon: '🏠' }
  ]
};

describe('buildCardConfig', () => {
  it('returns valid config for valid data', () => {
    const config = buildCardConfig(mockData);
    expect(config).not.toBeNull();
    expect(config.value).toBe('2.5');
    expect(config.categoryLabel).toBe('Moderate');
  });

  it('uses correct color scheme for Low category', () => {
    const config = buildCardConfig({ ...mockData, categoryLabel: 'Low' });
    expect(config.colors.primary).toBe('#22c55e');
  });

  it('uses correct color scheme for High category', () => {
    const config = buildCardConfig({ ...mockData, categoryLabel: 'High' });
    expect(config.colors.primary).toBe('#ef4444');
  });

  it('uses correct color scheme for Very High category', () => {
    const config = buildCardConfig({ ...mockData, categoryLabel: 'Very High' });
    expect(config.colors.primary).toBe('#dc2626');
  });

  it('falls back to Moderate colors for unknown category', () => {
    const config = buildCardConfig({ ...mockData, categoryLabel: 'Unknown' });
    expect(config.colors.primary).toBe('#f59e0b');
  });

  it('limits categories to 5', () => {
    const manyCategories = Array.from({ length: 10 }, (_, i) => ({
      label: `Cat ${i}`, percent: 10, icon: '📊'
    }));
    const config = buildCardConfig({ ...mockData, categories: manyCategories });
    expect(config.categories).toHaveLength(5);
  });

  it('returns null for null input', () => {
    expect(buildCardConfig(null)).toBeNull();
  });

  it('returns null for missing totalTonnes', () => {
    expect(buildCardConfig({ categoryLabel: 'Low' })).toBeNull();
  });

  it('returns null for non-number totalTonnes', () => {
    expect(buildCardConfig({ totalTonnes: 'abc' })).toBeNull();
  });

  it('handles empty categories array', () => {
    const config = buildCardConfig({ ...mockData, categories: [] });
    expect(config.categories).toHaveLength(0);
  });

  it('includes required display fields', () => {
    const config = buildCardConfig(mockData);
    expect(config).toHaveProperty('width');
    expect(config).toHaveProperty('height');
    expect(config).toHaveProperty('title');
    expect(config).toHaveProperty('unit');
    expect(config).toHaveProperty('footer');
    expect(config).toHaveProperty('colors');
    expect(config.title).toBe('GreenIQ');
  });

  it('is deterministic', () => {
    const a = buildCardConfig(mockData);
    const b = buildCardConfig(mockData);
    expect(a).toEqual(b);
  });
});
