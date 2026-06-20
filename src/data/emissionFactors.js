/**
 * GreenIQ Emission Factors Reference
 * 
 * Central repository of all emission factor constants used in calculations.
 * All factors include source citations for transparency and verification.
 * 
 * Sources:
 * - CEA CO2 Baseline Database V20.0/V21.0 (India grid factors)
 * - IPCC AR6 (transport, aviation)
 * - Shakti Foundation / TERI (India-specific transport)
 * - DEFRA/BEIS (cross-referenced)
 * - ResearchGate, CGIAR (Indian diet studies)
 */

/** @constant {number} India national grid emission factor (kgCO2/kWh) — CEA V20.0, FY 2023-24 */
export const GRID_FACTOR_NATIONAL = 0.73;

/** @constant {number} Global average per capita CO2 (tonnes/year) — IEA 2023 */
export const GLOBAL_AVG_PER_CAPITA = 4.7;

/** @constant {number} India average per capita CO2 (tonnes/year) — IEA 2023 */
export const INDIA_AVG_PER_CAPITA = 1.9;

/** @constant {number} India population (approximate, for multiplier calc) */
export const INDIA_POPULATION = 1_420_000_000;

/** @constant {number} Average electricity rate in India (INR/kWh) for bill-to-kWh conversion */
export const AVG_ELECTRICITY_RATE = 8;

/** @constant {number} Days in a year */
export const DAYS_PER_YEAR = 365;

/** @constant {number} Weeks in a year */
export const WEEKS_PER_YEAR = 52;

/** @constant {number} Average domestic flight distance in India (km, one-way) — e.g. Delhi-Mumbai ~1,400km */
export const AVG_DOMESTIC_FLIGHT_DISTANCE = 1400;
