/**
 * GreenIQ Carbon Footprint Calculator Engine
 * 
 * Deterministic, pure-function calculation engine.
 * All math is based on real-world emission factors — no AI/LLM involvement.
 * Same inputs always produce the same outputs.
 * 
 * Formulas:
 * - Transport: (factor_gCO2_per_km × daily_km × 2 × commute_days/week × 52) / 1000 = kgCO2/year
 * - Electricity: monthly_kWh × gridFactor × 12 = kgCO2/year
 * - Diet: annualKgCO2 from diet profile lookup
 * - Flights: flights × avg_distance × 2 × 255 gCO2/km / 1000 = kgCO2/year (with RF)
 * - Lifestyle: AC + shopping + cooking fuel
 */

import { getTransportMode } from '../data/transportModes.js';
import { getGridFactor } from '../data/indianStates.js';
import { getDietProfile } from '../data/dietProfiles.js';
import { getFootprintCategory } from '../data/nationalAverages.js';
import {
  INDIA_AVG_PER_CAPITA,
  GLOBAL_AVG_PER_CAPITA,
  INDIA_POPULATION,
  AVG_ELECTRICITY_RATE,
  AVG_DOMESTIC_FLIGHT_DISTANCE,
  WEEKS_PER_YEAR
} from '../data/emissionFactors.js';

/**
 * Calculate transport emissions
 * Formula: factor (gCO2/km) × distance (km/day) × 2 (round-trip) × days/week × 52 weeks / 1000
 * @param {string} modeId - Transport mode identifier
 * @param {number} dailyDistanceKm - One-way daily commute distance in km
 * @param {number} daysPerWeek - Number of commute days per week (1-7)
 * @returns {{ value: number, mode: string, factor: number, dailyKm: number, daysPerWeek: number }}
 */
function calculateSingleTransport(modeId, dailyDistanceKm, daysPerWeek) {
  const mode = getTransportMode(modeId);
  if (!mode) {
    return { value: 0, mode: 'unknown', factor: 0, dailyKm: 0, daysPerWeek: 0 };
  }

  const distKm = Math.max(0, Number(dailyDistanceKm) || 0);
  const days = Math.min(7, Math.max(0, Number(daysPerWeek) || 0));

  // Round-trip × weeks per year, convert gCO2 to kgCO2
  const annualKgCO2 = (mode.factor * distKm * 2 * days * WEEKS_PER_YEAR) / 1000;

  return {
    value: Math.round(annualKgCO2 * 10) / 10,
    mode: mode.label,
    factor: mode.factor,
    dailyKm: distKm,
    daysPerWeek: days
  };
}

export function calculateTransport(modeOrModes, dailyDistanceKm, daysPerWeek) {
  if (!Array.isArray(modeOrModes)) {
    return calculateSingleTransport(modeOrModes, dailyDistanceKm, daysPerWeek);
  }

  const modes = modeOrModes
    .map(item => calculateSingleTransport(
      item.modeId ?? item.mode,
      item.dailyDistanceKm ?? item.distanceKm,
      item.daysPerWeek ?? item.commuteDaysPerWeek ?? daysPerWeek
    ))
    .filter(item => item.mode !== 'unknown');

  return {
    value: Math.round(modes.reduce((sum, mode) => sum + mode.value, 0) * 10) / 10,
    mode: modes.length > 1 ? 'Multiple modes' : (modes[0]?.mode || 'unknown'),
    factor: null,
    dailyKm: modes.reduce((sum, mode) => sum + mode.dailyKm, 0),
    daysPerWeek: null,
    modes
  };
}

/**
 * Calculate electricity emissions
 * Formula: monthly_kWh × gridFactor × 12
 * If bill in INR provided: bill / avg_rate_per_kWh = kWh
 * @param {string} stateId - State code for grid factor lookup
 * @param {number} monthlyKwh - Monthly electricity consumption in kWh (0 if using bill)
 * @param {number} monthlyBillINR - Monthly electricity bill in INR (0 if using kWh)
 * @returns {{ value: number, state: string, gridFactor: number, monthlyKwh: number }}
 */
export function calculateElectricity(stateId, monthlyKwh = 0, monthlyBillINR = 0) {
  const gridFactor = getGridFactor(stateId);

  // Convert bill to kWh if bill provided and kWh not
  let kwh = Math.max(0, Number(monthlyKwh) || 0);
  if (kwh === 0 && monthlyBillINR > 0) {
    kwh = Math.max(0, Number(monthlyBillINR)) / AVG_ELECTRICITY_RATE;
  }

  const annualKgCO2 = kwh * gridFactor * 12;

  return {
    value: Math.round(annualKgCO2 * 10) / 10,
    state: stateId,
    gridFactor,
    monthlyKwh: Math.round(kwh * 10) / 10
  };
}

/**
 * Calculate diet emissions
 * Direct lookup from diet profile
 * @param {string} dietId - Diet profile identifier
 * @returns {{ value: number, type: string }}
 */
export function calculateDiet(dietId) {
  const profile = getDietProfile(dietId);
  if (!profile) {
    return { value: 260, type: 'Vegetarian' }; // Default to Indian vegetarian
  }

  return {
    value: profile.annualKgCO2,
    type: profile.label
  };
}

/**
 * Calculate flight and long-distance travel emissions
 * Flights: flights × avg_distance × 2 (round-trip) × 255 gCO2/km (with radiative forcing) / 1000
 * Train: trips × 800km × 2 × 12 gCO2/km / 1000
 * @param {number} domesticFlightsPerYear - Number of domestic round-trip flights
 * @param {number} longTrainTripsPerYear - Number of long-distance train trips
 * @returns {{ value: number, flights: number, trainTrips: number }}
 */
export function calculateFlights(domesticFlightsPerYear = 0, longTrainTripsPerYear = 0) {
  const flights = Math.max(0, Math.round(Number(domesticFlightsPerYear) || 0));
  const trainTrips = Math.max(0, Math.round(Number(longTrainTripsPerYear) || 0));

  // Flights: round-trip × avg distance × emission factor with radiative forcing (~1.9x)
  const flightKgCO2 = (flights * AVG_DOMESTIC_FLIGHT_DISTANCE * 2 * 255) / 1000;

  // Long-distance train: avg ~800km one-way × 12 gCO2/km × 2 (round-trip)
  const trainKgCO2 = (trainTrips * 800 * 2 * 12) / 1000;

  return {
    value: Math.round((flightKgCO2 + trainKgCO2) * 10) / 10,
    flights,
    trainTrips
  };
}

/**
 * Calculate lifestyle emissions (AC + shopping/consumer goods + cooking fuel)
 * AC: hours/day × 0.85 kgCO2/hour × 6 summer months × 30 days/month
 * Shopping: monthly kgCO2 × 12
 * Cooking: annual kgCO2 by fuel type
 * @param {number} acHoursPerDay - Average AC usage hours per day (summer)
 * @param {string} shoppingLevel - 'low' | 'average' | 'high' | 'very_high'
 * @param {string} cookingFuel - 'lpg' | 'png' | 'electric' | 'biomass'
 * @returns {{ value: number, acKgCO2: number, shoppingKgCO2: number, cookingKgCO2: number }}
 */
export function calculateLifestyle(acHoursPerDay = 0, shoppingLevel = 'average', cookingFuel = 'lpg') {
  const acHours = Math.max(0, Math.min(24, Number(acHoursPerDay) || 0));

  // AC: 0.85 kgCO2/hour (1.5 ton moderate efficiency × Indian grid), ~6 summer months
  const acKgCO2 = acHours * 0.85 * 6 * 30;

  // Shopping/consumer goods (monthly kgCO2)
  const shoppingFactors = {
    low: 15,        // ~₹180/year — minimal shopping
    average: 50,    // ~₹600/year — typical urban
    high: 100,      // ~₹1,200/year — frequent shopping
    very_high: 200  // ~₹2,400/year — luxury/frequent
  };
  const shoppingMonthly = shoppingFactors[shoppingLevel] || shoppingFactors.average;
  const shoppingKgCO2 = shoppingMonthly * 12;

  // Cooking fuel (annual kgCO2)
  const cookingFactors = {
    lpg: 350,       // ~1 cylinder/month × ~29 kgCO2/cylinder
    png: 280,       // Piped natural gas, slightly cleaner
    electric: 200,  // Induction cooking, depends on grid
    biomass: 450    // Wood/dung, less efficient combustion
  };
  const cookingKgCO2 = cookingFactors[cookingFuel] || cookingFactors.lpg;

  return {
    value: Math.round((acKgCO2 + shoppingKgCO2 + cookingKgCO2) * 10) / 10,
    acKgCO2: Math.round(acKgCO2 * 10) / 10,
    shoppingKgCO2: Math.round(shoppingKgCO2 * 10) / 10,
    cookingKgCO2: Math.round(cookingKgCO2 * 10) / 10
  };
}

/**
 * Calculate complete carbon footprint
 * Aggregates all category calculations into a unified result.
 * @param {object} inputs - All user inputs
 * @returns {object} Complete footprint breakdown
 */
export function calculateFootprint(inputs) {
  const transport = calculateTransport(
    inputs.transportModes || inputs.transportMode,
    inputs.dailyDistanceKm,
    inputs.commuteDaysPerWeek
  );

  const electricity = calculateElectricity(
    inputs.state,
    inputs.monthlyKwh,
    inputs.monthlyBillINR
  );

  const diet = calculateDiet(inputs.dietType);

  const flights = calculateFlights(
    inputs.domesticFlightsPerYear,
    inputs.longTrainTripsPerYear
  );

  const lifestyle = calculateLifestyle(
    inputs.acHoursPerDay,
    inputs.shoppingLevel,
    inputs.cookingFuel
  );

  // Total in kgCO2/year
  const totalKg = transport.value + electricity.value + diet.value + flights.value + lifestyle.value;

  // Convert to tonnes for display
  const totalTonnes = Math.round((totalKg / 1000) * 100) / 100;

  // Comparisons
  const vsIndiaAvg = Math.round(((totalTonnes / INDIA_AVG_PER_CAPITA) * 100) - 100);
  const vsGlobalAvg = Math.round(((totalTonnes / GLOBAL_AVG_PER_CAPITA) * 100) - 100);

  // "If everyone did this" — India's total if all citizens had this footprint (in Gt)
  const ifEveryoneTonnes = (totalTonnes * INDIA_POPULATION) / 1_000_000_000;

  // Category classification
  const category = getFootprintCategory(totalTonnes);

  // Category breakdown with percentages
  const categories = [
    { id: 'transport', label: 'Transport', icon: '🚗', value: transport.value, color: 'var(--chart-transport)' },
    { id: 'electricity', label: 'Electricity', icon: '⚡', value: electricity.value, color: 'var(--chart-electricity)' },
    { id: 'diet', label: 'Diet', icon: '🍽️', value: diet.value, color: 'var(--chart-diet)' },
    { id: 'flights', label: 'Travel', icon: '✈️', value: flights.value, color: 'var(--chart-flights)' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🏠', value: lifestyle.value, color: 'var(--chart-lifestyle)' }
  ].map(cat => ({
    ...cat,
    percent: totalKg > 0 ? Math.round((cat.value / totalKg) * 100) : 0,
    tonnes: Math.round((cat.value / 1000) * 100) / 100
  }));

  return {
    transport,
    electricity,
    diet,
    flights,
    lifestyle,
    totalKg: Math.round(totalKg * 10) / 10,
    totalTonnes,
    categories,
    comparison: {
      vsIndiaAvg,
      vsGlobalAvg,
      indiaAvg: INDIA_AVG_PER_CAPITA,
      globalAvg: GLOBAL_AVG_PER_CAPITA,
      ifEveryoneGt: Math.round(ifEveryoneTonnes * 100) / 100
    },
    category,
    timestamp: new Date().toISOString()
  };
}
