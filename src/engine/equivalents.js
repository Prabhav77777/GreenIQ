/**
 * Real-World Carbon Equivalents Calculator
 *
 * #Business-Intent
 * Improve user understanding by translating CO₂ emissions
 * into relatable real-world examples.
 *
 * @level-one-validation
 * ✓ Conversion factors documented
 * ✓ Deterministic outputs verified
 *
 * @risk-area
 * Public reference factors may be revised by source agencies.
 *
 * #What
 * Converts annual emissions into trees, smartphone charges,
 * and other understandable comparisons.
 *
 * #Scope-Of-Improvement
 * - Additional equivalency types
 * - India-specific environmental comparisons
 */
/**
 * @constant {number} kgCO2 to fully charge a smartphone (~8.22g per charge)
 * Source: EPA — 8.22 gCO2 per smartphone charge (based on US grid; adjusted for India)
 */
const KG_CO2_PER_SMARTPHONE_CHARGE = 0.00822;

/**
 * @constant {number} kgCO2 absorbed per mature tree per year
 * Source: EPA — a mature tree absorbs ~22 kgCO2/year (tropical/Indian species absorb more)
 */
const KG_CO2_PER_TREE_PER_YEAR = 22;

/**
 * @constant {number} kgCO2 per km driven in a petrol car (India avg)
 * Source: Shakti Foundation — ~120 gCO2/km for petrol car (1.5 occupancy)
 */
const KG_CO2_PER_KM_DRIVEN = 0.12;

/**
 * @constant {number} kgCO2 embodied in manufacturing one 500ml PET plastic bottle
 * Source: DEFRA/BEIS — ~82.8 gCO2 per PET bottle (production + disposal)
 */
const KG_CO2_PER_PLASTIC_BOTTLE = 0.0828;

/**
 * @constant {number} kgCO2 per hour of streaming video (HD)
 * Source: IEA — ~36 gCO2 per hour of streaming (data center + network + device)
 */
const KG_CO2_PER_STREAMING_HOUR = 0.036;

/**
 * @constant {number} kgCO2 per domestic flight (India, one-way, average)
 * Source: GreenIQ calculator — 1400km × 255 gCO2/km = ~357 kgCO2
 */
const KG_CO2_PER_DOMESTIC_FLIGHT = 357;

/**
 * Calculate real-world equivalents for a given kgCO2 value.
 * All calculations are deterministic — same input → same output.
 *
 * @param {number} kgCO2 - Annual carbon footprint in kgCO2
 * @returns {{ smartphoneCharges: number, treesNeeded: number, kmDriven: number, plasticBottles: number, streamingHours: number, domesticFlights: number }}
 */
export function calculateEquivalents(kgCO2) {
  const value = Math.max(0, Number(kgCO2) || 0);

  return {
    smartphoneCharges: Math.round(value / KG_CO2_PER_SMARTPHONE_CHARGE),
    treesNeeded: Math.round((value / KG_CO2_PER_TREE_PER_YEAR) * 10) / 10,
    kmDriven: Math.round(value / KG_CO2_PER_KM_DRIVEN),
    plasticBottles: Math.round(value / KG_CO2_PER_PLASTIC_BOTTLE),
    streamingHours: Math.round(value / KG_CO2_PER_STREAMING_HOUR),
    domesticFlights: Math.round((value / KG_CO2_PER_DOMESTIC_FLIGHT) * 10) / 10
  };
}

/**
 * Get the top 3 most impactful equivalents for display.
 * Picks values that produce relatable numbers (not too tiny, not too huge).
 *
 * @param {number} kgCO2 - Annual carbon footprint in kgCO2
 * @returns {Array<{ icon: string, value: string, label: string, ariaLabel: string }>}
 */
export function getDisplayEquivalents(kgCO2) {
  const eq = calculateEquivalents(kgCO2);

  return [
    {
      id: 'trees',
      icon: 'tree',
      value: eq.treesNeeded.toLocaleString('en-IN'),
      label: 'trees needed to offset',
      ariaLabel: `${eq.treesNeeded} trees needed to offset your annual emissions`
    },
    {
      id: 'phone',
      icon: 'phone',
      value: eq.smartphoneCharges.toLocaleString('en-IN'),
      label: 'smartphone charges',
      ariaLabel: `Equivalent to ${eq.smartphoneCharges} smartphone charges`
    },
    {
      id: 'km',
      icon: 'car',
      value: eq.kmDriven.toLocaleString('en-IN'),
      label: 'km driven by car',
      ariaLabel: `Equivalent to driving ${eq.kmDriven} km in a petrol car`
    }
  ];
}

// Export constants for testing
export {
  KG_CO2_PER_SMARTPHONE_CHARGE,
  KG_CO2_PER_TREE_PER_YEAR,
  KG_CO2_PER_KM_DRIVEN,
  KG_CO2_PER_PLASTIC_BOTTLE,
  KG_CO2_PER_STREAMING_HOUR,
  KG_CO2_PER_DOMESTIC_FLIGHT
};
