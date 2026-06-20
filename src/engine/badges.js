/**
 * Achievement Badge System
 *
 * Deterministic badge logic — given the same inputs, the same badges always unlock.
 * Badges are derived purely from calculator inputs, not from LLM output.
 */

/**
 * @typedef {object} Badge
 * @property {string} id - Unique identifier
 * @property {string} icon - Emoji icon
 * @property {string} title - Display title
 * @property {string} description - How it was earned
 */

/**
 * All available badges with their unlock conditions.
 * Each condition is a pure function of the user inputs.
 */
const BADGE_DEFINITIONS = [
  {
    id: 'cyclist',
    icon: '🚲',
    title: 'Cyclist',
    description: 'Commutes by bicycle or walking',
    condition: (inputs) => inputs.transportMode === 'bicycle'
  },
  {
    id: 'transit_pro',
    icon: '🚇',
    title: 'Transit Pro',
    description: 'Uses public transport for daily commute',
    condition: (inputs) => ['metro', 'bus', 'train'].includes(inputs.transportMode)
  },
  {
    id: 'plant_based',
    icon: '🌱',
    title: 'Plant-Based',
    description: 'Follows a vegan diet',
    condition: (inputs) => inputs.dietType === 'vegan'
  },
  {
    id: 'veggie_champion',
    icon: '🥗',
    title: 'Veggie Champion',
    description: 'Follows a vegetarian diet',
    condition: (inputs) => inputs.dietType === 'vegetarian'
  },
  {
    id: 'grounded',
    icon: '🌍',
    title: 'Grounded',
    description: 'Takes zero domestic flights per year',
    condition: (inputs) => (Number(inputs.domesticFlightsPerYear) || 0) === 0
  },
  {
    id: 'cool_headed',
    icon: '❄️',
    title: 'Cool-Headed',
    description: 'Uses AC 2 hours/day or less',
    condition: (inputs) => (Number(inputs.acHoursPerDay) || 0) <= 2
  },
  {
    id: 'minimalist',
    icon: '🧘',
    title: 'Minimalist',
    description: 'Keeps shopping habits minimal',
    condition: (inputs) => inputs.shoppingLevel === 'low'
  },
  {
    id: 'clean_cook',
    icon: '⚡',
    title: 'Clean Cook',
    description: 'Cooks with induction/electric — zero direct emissions',
    condition: (inputs) => inputs.cookingFuel === 'electric'
  },
  {
    id: 'green_grid',
    icon: '🌿',
    title: 'Green Grid',
    description: 'Lives in a state with low-carbon electricity',
    condition: (inputs) => {
      const lowCarbonStates = ['HP', 'SK', 'AR', 'UK', 'LA', 'MN', 'ML', 'MZ', 'NL', 'KA', 'KL', 'JK'];
      return lowCarbonStates.includes(inputs.state);
    }
  },
  {
    id: 'short_commute',
    icon: '🏡',
    title: 'Neighborhood Hero',
    description: 'Commutes less than 5 km each way',
    condition: (inputs) => (Number(inputs.dailyDistanceKm) || 0) <= 5 && (Number(inputs.dailyDistanceKm) || 0) > 0
  }
];

/**
 * Calculate which badges a user has unlocked based on their inputs.
 * Deterministic: same inputs → same badges.
 *
 * @param {object} inputs - Validated calculator inputs
 * @returns {Badge[]} Array of unlocked badge objects (without the condition function)
 */
export function getUnlockedBadges(inputs) {
  if (!inputs || typeof inputs !== 'object') return [];

  return BADGE_DEFINITIONS
    .filter(badge => {
      try {
        return badge.condition(inputs);
      } catch {
        return false;
      }
    })
    .map(({ id, icon, title, description }) => ({ id, icon, title, description }));
}

/**
 * Get all available badge definitions (without condition functions).
 * Useful for displaying a "locked" state.
 *
 * @returns {Array<{ id: string, icon: string, title: string, description: string }>}
 */
export function getAllBadges() {
  return BADGE_DEFINITIONS.map(({ id, icon, title, description }) => ({ id, icon, title, description }));
}
