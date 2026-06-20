/**
 * Indian Diet Profiles
 * Annual CO2e emissions by diet type
 * 
 * Sources:
 * - ResearchGate / CGIAR Indian diet emission studies
 * - EAI (Energy Alternatives India)
 * - IJCRT study: non-veg dishes ~2.38x carbon footprint of veg
 * - CGIAR: mutton meal = ~1.8x GHG of vegetarian meal
 * 
 * Note: Indian dietary guidelines have among the lowest carbon footprints
 * globally. ~87% of food emissions come from production.
 */
export const DIET_PROFILES = [
  {
    id: 'vegan',
    label: 'Vegan',
    icon: '🌱',
    annualKgCO2: 190,
    description: 'No animal products',
    context: 'Lowest dietary footprint'
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    icon: '🥗',
    annualKgCO2: 260,
    description: 'Lacto-vegetarian with dairy & paneer',
    context: 'Typical Indian vegetarian diet'
  },
  {
    id: 'eggetarian',
    label: 'Eggetarian',
    icon: '🥚',
    annualKgCO2: 300,
    description: 'Vegetarian + eggs',
    context: 'Common in South India'
  },
  {
    id: 'non_veg_moderate',
    label: 'Non-Veg (Moderate)',
    icon: '🍗',
    annualKgCO2: 410,
    description: 'Chicken/fish 2-3 times per week',
    context: 'Most common non-veg pattern'
  },
  {
    id: 'non_veg_heavy',
    label: 'Non-Veg (Heavy)',
    icon: '🥩',
    annualKgCO2: 580,
    description: 'Daily meat including mutton/beef',
    context: 'Highest dietary footprint'
  }
];

/**
 * Get diet profile by ID
 * @param {string} id - Diet profile identifier
 * @returns {object|undefined} Diet profile object
 */
export function getDietProfile(id) {
  return DIET_PROFILES.find(diet => diet.id === id);
}
