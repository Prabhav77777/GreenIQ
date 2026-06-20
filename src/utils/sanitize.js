/**
 * Input Validation & Sanitization Module
 * 
 * Validates and sanitizes all user inputs before they enter the calculation engine.
 * Prevents XSS, injection, and ensures data integrity.
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize a string input — strips HTML/script tags
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Validate and coerce a number input within a range
 * @param {*} input - Raw input
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} fallback - Default value if invalid
 * @returns {number} Validated number
 */
export function sanitizeNumber(input, min = 0, max = Infinity, fallback = 0) {
  if (input === null || input === undefined || input === '') return fallback;
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate that a value is one of allowed options
 * @param {string} input - Raw input
 * @param {string[]} allowedValues - Array of allowed values
 * @param {string} fallback - Default value if not in allowed list
 * @returns {string} Validated value
 */
export function sanitizeEnum(input, allowedValues, fallback) {
  const sanitized = sanitizeString(String(input || ''));
  return allowedValues.includes(sanitized) ? sanitized : fallback;
}

/**
 * Validate complete calculator form inputs
 * Returns sanitized inputs + any validation errors
 * @param {object} rawInputs - Raw form data
 * @returns {{ inputs: object, errors: string[] }}
 */
export function validateCalculatorInputs(rawInputs) {
  const errors = [];
  const validTransportModes = [
    'bicycle', 'metro', 'bus', 'train', 'two_wheeler',
    'auto_rickshaw', 'shared_cab', 'car_petrol', 'car_diesel'
  ];
  const validDietTypes = [
    'vegan', 'vegetarian', 'eggetarian', 'non_veg_moderate', 'non_veg_heavy'
  ];
  const validShoppingLevels = ['low', 'average', 'high', 'very_high'];
  const validCookingFuels = ['lpg', 'png', 'electric', 'biomass'];

  const inputs = {
    transportMode: sanitizeEnum(rawInputs.transportMode, validTransportModes, 'bus'),
    dailyDistanceKm: sanitizeNumber(rawInputs.dailyDistanceKm, 0, 500, 0),
    commuteDaysPerWeek: sanitizeNumber(rawInputs.commuteDaysPerWeek, 0, 7, 5),
    state: sanitizeString(rawInputs.state || 'DL'),
    monthlyKwh: sanitizeNumber(rawInputs.monthlyKwh, 0, 10000, 0),
    monthlyBillINR: sanitizeNumber(rawInputs.monthlyBillINR, 0, 100000, 0),
    dietType: sanitizeEnum(rawInputs.dietType, validDietTypes, 'vegetarian'),
    domesticFlightsPerYear: sanitizeNumber(rawInputs.domesticFlightsPerYear, 0, 100, 0),
    longTrainTripsPerYear: sanitizeNumber(rawInputs.longTrainTripsPerYear, 0, 100, 0),
    acHoursPerDay: sanitizeNumber(rawInputs.acHoursPerDay, 0, 24, 0),
    shoppingLevel: sanitizeEnum(rawInputs.shoppingLevel, validShoppingLevels, 'average'),
    cookingFuel: sanitizeEnum(rawInputs.cookingFuel, validCookingFuels, 'lpg')
  };

  if (!rawInputs.state) {
    errors.push('Please select your state');
  }

  return { inputs, errors };
}
