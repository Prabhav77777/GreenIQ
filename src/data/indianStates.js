/**
 * Indian States — Grid Emission Factors
 * 
 * Estimated kgCO2/kWh by state based on energy mix analysis.
 * Source: CEA CO2 Baseline Database V20.0/V21.0 + state energy mix.
 * 
 * Note: India has a unified national grid, so these are estimates based
 * on each state's generation/procurement mix. The CEA national weighted
 * average is 0.727 kgCO2/kWh (V20.0, FY 2023-24).
 */
export const INDIAN_STATES = [
  { id: 'AP', name: 'Andhra Pradesh', gridFactor: 0.70, category: 'medium' },
  { id: 'AR', name: 'Arunachal Pradesh', gridFactor: 0.40, category: 'low' },
  { id: 'AS', name: 'Assam', gridFactor: 0.75, category: 'medium-high' },
  { id: 'BR', name: 'Bihar', gridFactor: 0.90, category: 'high' },
  { id: 'CG', name: 'Chhattisgarh', gridFactor: 0.97, category: 'very-high' },
  { id: 'GA', name: 'Goa', gridFactor: 0.72, category: 'medium' },
  { id: 'GJ', name: 'Gujarat', gridFactor: 0.70, category: 'medium' },
  { id: 'HR', name: 'Haryana', gridFactor: 0.80, category: 'medium-high' },
  { id: 'HP', name: 'Himachal Pradesh', gridFactor: 0.30, category: 'very-low' },
  { id: 'JH', name: 'Jharkhand', gridFactor: 0.97, category: 'very-high' },
  { id: 'KA', name: 'Karnataka', gridFactor: 0.50, category: 'low' },
  { id: 'KL', name: 'Kerala', gridFactor: 0.55, category: 'low' },
  { id: 'MP', name: 'Madhya Pradesh', gridFactor: 0.85, category: 'high' },
  { id: 'MH', name: 'Maharashtra', gridFactor: 0.75, category: 'medium-high' },
  { id: 'MN', name: 'Manipur', gridFactor: 0.45, category: 'low' },
  { id: 'ML', name: 'Meghalaya', gridFactor: 0.45, category: 'low' },
  { id: 'MZ', name: 'Mizoram', gridFactor: 0.45, category: 'low' },
  { id: 'NL', name: 'Nagaland', gridFactor: 0.50, category: 'low' },
  { id: 'OD', name: 'Odisha', gridFactor: 0.88, category: 'high' },
  { id: 'PB', name: 'Punjab', gridFactor: 0.75, category: 'medium-high' },
  { id: 'RJ', name: 'Rajasthan', gridFactor: 0.65, category: 'medium' },
  { id: 'SK', name: 'Sikkim', gridFactor: 0.30, category: 'very-low' },
  { id: 'TN', name: 'Tamil Nadu', gridFactor: 0.60, category: 'medium-low' },
  { id: 'TS', name: 'Telangana', gridFactor: 0.75, category: 'medium-high' },
  { id: 'TR', name: 'Tripura', gridFactor: 0.65, category: 'medium' },
  { id: 'UP', name: 'Uttar Pradesh', gridFactor: 0.85, category: 'high' },
  { id: 'UK', name: 'Uttarakhand', gridFactor: 0.40, category: 'low' },
  { id: 'WB', name: 'West Bengal', gridFactor: 0.90, category: 'high' },
  // Union Territories
  { id: 'AN', name: 'Andaman & Nicobar', gridFactor: 0.80, category: 'medium-high' },
  { id: 'CH', name: 'Chandigarh', gridFactor: 0.75, category: 'medium-high' },
  { id: 'DN', name: 'Dadra & Nagar Haveli', gridFactor: 0.72, category: 'medium' },
  { id: 'DD', name: 'Daman & Diu', gridFactor: 0.72, category: 'medium' },
  { id: 'DL', name: 'Delhi', gridFactor: 0.80, category: 'medium-high' },
  { id: 'JK', name: 'Jammu & Kashmir', gridFactor: 0.45, category: 'low' },
  { id: 'LA', name: 'Ladakh', gridFactor: 0.40, category: 'low' },
  { id: 'LD', name: 'Lakshadweep', gridFactor: 0.85, category: 'high' },
  { id: 'PY', name: 'Puducherry', gridFactor: 0.65, category: 'medium' }
];

/**
 * Get state by ID
 * @param {string} id - State code (e.g., 'KA')
 * @returns {object|undefined} State object
 */
export function getState(id) {
  return INDIAN_STATES.find(state => state.id === id);
}

/**
 * Get grid emission factor for a state
 * Falls back to national average if state not found
 * @param {string} stateId - State code
 * @returns {number} Grid factor in kgCO2/kWh
 */
export function getGridFactor(stateId) {
  const state = getState(stateId);
  return state ? state.gridFactor : 0.73;
}
