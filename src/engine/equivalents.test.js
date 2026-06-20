import { describe, it, expect } from 'vitest';
import {
  calculateEquivalents,
  getDisplayEquivalents,
  KG_CO2_PER_SMARTPHONE_CHARGE,
  KG_CO2_PER_TREE_PER_YEAR,
  KG_CO2_PER_KM_DRIVEN,
  KG_CO2_PER_PLASTIC_BOTTLE,
  KG_CO2_PER_STREAMING_HOUR,
  KG_CO2_PER_DOMESTIC_FLIGHT
} from './equivalents.js';

describe('calculateEquivalents', () => {
  it('calculates smartphone charges correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.smartphoneCharges).toBe(Math.round(1000 / KG_CO2_PER_SMARTPHONE_CHARGE));
  });

  it('calculates trees needed correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.treesNeeded).toBeCloseTo(1000 / KG_CO2_PER_TREE_PER_YEAR, 0);
  });

  it('calculates km driven correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.kmDriven).toBe(Math.round(1000 / KG_CO2_PER_KM_DRIVEN));
  });

  it('calculates plastic bottles correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.plasticBottles).toBe(Math.round(1000 / KG_CO2_PER_PLASTIC_BOTTLE));
  });

  it('calculates streaming hours correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.streamingHours).toBe(Math.round(1000 / KG_CO2_PER_STREAMING_HOUR));
  });

  it('calculates domestic flights correctly', () => {
    const result = calculateEquivalents(1000);
    expect(result.domesticFlights).toBeCloseTo(1000 / KG_CO2_PER_DOMESTIC_FLIGHT, 0);
  });

  it('handles zero input', () => {
    const result = calculateEquivalents(0);
    expect(result.smartphoneCharges).toBe(0);
    expect(result.treesNeeded).toBe(0);
    expect(result.kmDriven).toBe(0);
  });

  it('handles negative input', () => {
    const result = calculateEquivalents(-500);
    expect(result.smartphoneCharges).toBe(0);
  });

  it('handles NaN input', () => {
    const result = calculateEquivalents(NaN);
    expect(result.treesNeeded).toBe(0);
  });

  it('returns all required fields', () => {
    const result = calculateEquivalents(2000);
    expect(result).toHaveProperty('smartphoneCharges');
    expect(result).toHaveProperty('treesNeeded');
    expect(result).toHaveProperty('kmDriven');
    expect(result).toHaveProperty('plasticBottles');
    expect(result).toHaveProperty('streamingHours');
    expect(result).toHaveProperty('domesticFlights');
  });

  it('is deterministic — same input gives same output', () => {
    const a = calculateEquivalents(1500);
    const b = calculateEquivalents(1500);
    expect(a).toEqual(b);
  });
});

describe('getDisplayEquivalents', () => {
  it('returns exactly 3 items', () => {
    const result = getDisplayEquivalents(2000);
    expect(result).toHaveLength(3);
  });

  it('each item has required display fields', () => {
    const result = getDisplayEquivalents(2000);
    for (const item of result) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('ariaLabel');
      expect(typeof item.ariaLabel).toBe('string');
      expect(item.ariaLabel.length).toBeGreaterThan(0);
    }
  });

  it('handles zero input', () => {
    const result = getDisplayEquivalents(0);
    expect(result).toHaveLength(3);
  });
});
