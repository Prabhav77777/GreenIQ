
/**
 * Achievement Badge System
 *
 * #Business-Intent
 * Encourage sustainable behaviour through gamification.
 *
 * @level-one-validation
 * ✓ Deterministic unlock logic
 * ✓ No AI dependency
 * ✓ Consistent badge assignment
 *
 * @risk-area
 * Badge thresholds may require tuning as user base grows.
 *
 * #What
 * Awards achievements based on sustainable choices.
 *
 * #Scope-Of-Improvement
 * - Progressive badge levels
 * - Seasonal challenges
 * - Community achievements
 */
/**
 * All available badges with their unlock conditions.
 * Each condition is a pure function of the user inputs.
 */
function getTransportModes(inputs) {
  if (Array.isArray(inputs.transportModes)) {
    return inputs.transportModes.map(mode => mode.modeId ?? mode.mode);
  }
  return inputs.transportMode ? [inputs.transportMode] : [];
}

function getShortestCommute(inputs) {
  if (Array.isArray(inputs.transportModes)) {
    const distances = inputs.transportModes
      .map(mode => Number(mode.dailyDistanceKm ?? mode.distanceKm) || 0)
      .filter(distance => distance > 0);
    return distances.length > 0 ? Math.min(...distances) : 0;
  }
  return Number(inputs.dailyDistanceKm) || 0;
}

const BADGE_DEFINITIONS = [
  {
    id: 'cyclist',
    icon: '🚲',
    title: 'Cyclist',
    description: 'Commutes by bicycle or walking',
    condition: (inputs) => getTransportModes(inputs).includes('bicycle')
  },
  {
    id: 'transit_pro',
    icon: '🚇',
    title: 'Transit Pro',
    description: 'Uses public transport for daily commute',
    condition: (inputs) => getTransportModes(inputs).some(mode => ['metro', 'bus', 'train'].includes(mode))
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
    condition: (inputs) => getShortestCommute(inputs) <= 5 && getShortestCommute(inputs) > 0
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
