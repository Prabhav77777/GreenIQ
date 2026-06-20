/**
 * National & City-wise Benchmark Data
 * Used for comparison visualizations in the dashboard.
 * 
 * Sources:
 * - IEA (national averages)
 * - IISc Bangalore / APN-GCR (city-wise GHG inventories)
 * - Down to Earth, The Hindu (supplementary)
 */

/** Per capita CO2 benchmarks (tonnes CO2e/year) */
export const BENCHMARKS = {
  india: {
    label: 'India Average',
    value: 1.9,
    source: 'IEA 2023'
  },
  global: {
    label: 'Global Average',
    value: 4.7,
    source: 'IEA 2023'
  },
  parisTarget: {
    label: '2°C Target',
    value: 2.1,
    source: 'IPCC AR6 — per capita budget for 2°C pathway'
  },
  indiaUrban: {
    label: 'India Urban',
    value: 2.3,
    source: 'Household survey estimates'
  },
  indiaRural: {
    label: 'India Rural',
    value: 1.1,
    source: 'Household survey estimates'
  }
};

/** City-wise per capita estimates (tonnes CO2e/year) */
export const CITY_BENCHMARKS = [
  { city: 'Delhi', value: 2.8, source: 'Estimated from total GHG inventory' },
  { city: 'Chennai', value: 4.79, source: 'IISc/APN-GCR research' },
  { city: 'Kolkata', value: 3.29, source: 'IISc/APN-GCR research' },
  { city: 'Mumbai', value: 1.6, source: 'Estimated from total GHG inventory' },
  { city: 'Bangalore', value: 1.8, source: 'Estimated from total GHG inventory' },
  { city: 'Hyderabad', value: 2.0, source: 'Estimated from total GHG inventory' }
];

/** Footprint category thresholds (tonnes CO2e/year) */
export const FOOTPRINT_CATEGORIES = [
  { id: 'low', label: 'Low', maxValue: 1.5, color: 'var(--color-success)', badgeClass: 'badge--low', description: 'Below India average — great job!' },
  { id: 'moderate', label: 'Moderate', maxValue: 3.0, color: 'var(--color-warning)', badgeClass: 'badge--moderate', description: 'Near India average' },
  { id: 'high', label: 'High', maxValue: 5.0, color: 'var(--color-danger)', badgeClass: 'badge--high', description: 'Above India average' },
  { id: 'very-high', label: 'Very High', maxValue: Infinity, color: 'var(--color-danger)', badgeClass: 'badge--very-high', description: 'Significantly above average' }
];

/**
 * Get footprint category for a given value
 * @param {number} tonnes - Annual CO2e in tonnes
 * @returns {object} Category object
 */
export function getFootprintCategory(tonnes) {
  return FOOTPRINT_CATEGORIES.find(cat => tonnes <= cat.maxValue) || FOOTPRINT_CATEGORIES[FOOTPRINT_CATEGORIES.length - 1];
}
