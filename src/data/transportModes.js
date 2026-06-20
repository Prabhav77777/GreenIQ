/**
 * Indian Transport Modes
 * Emission factors in gCO2 per passenger-kilometer
 * 
 * Sources:
 * - Shakti Foundation vehicle emission studies
 * - TERI / DMRC carbon savings reports
 * - IEA / UIC for railways (~11.5 gCO2/pkm)
 * - ARAI vehicle type-approval data
 * - DEFRA/IPCC for aviation (adapted for India)
 */
export const TRANSPORT_MODES = [
  {
    id: 'bicycle',
    label: 'Bicycle / Walking',
    icon: '🚶',
    factor: 0,
    description: 'Zero emission transport',
    source: 'N/A'
  },
  {
    id: 'metro',
    label: 'Metro / Local Train',
    icon: '🚇',
    factor: 18,
    description: 'Electric, high occupancy',
    source: 'DMRC/TERI – saves ~32.4 gCO2/pkm vs road'
  },
  {
    id: 'bus',
    label: 'Public Bus',
    icon: '🚌',
    factor: 16,
    description: '~40-50 passengers, shared',
    source: 'Shakti Foundation / IISc studies'
  },
  {
    id: 'train',
    label: 'Indian Railways',
    icon: '🚂',
    factor: 12,
    description: 'Electric/diesel mix, high occupancy',
    source: 'IEA/UIC – 11.5 gCO2/pkm'
  },
  {
    id: 'two_wheeler',
    label: 'Two-Wheeler',
    icon: '🛵',
    factor: 37,
    description: 'Motorcycle / scooter (110-150cc)',
    source: 'Shakti Foundation / CATF'
  },
  {
    id: 'auto_rickshaw',
    label: 'Auto-Rickshaw',
    icon: '🛺',
    factor: 38,
    description: 'CNG 3-wheeler, avg 2.6 passengers',
    source: 'ResearchGate, sapub.org'
  },
  {
    id: 'shared_cab',
    label: 'Shared Cab / Pool',
    icon: '🚕',
    factor: 70,
    description: 'Ride-hailing with 2-3 passengers',
    source: 'Derived from car data'
  },
  {
    id: 'car_petrol',
    label: 'Car (Petrol)',
    icon: '🚗',
    factor: 120,
    description: 'Small hatchback/sedan, ~1.5 occupancy',
    source: 'Shakti Foundation / IEA'
  },
  {
    id: 'car_diesel',
    label: 'Car (Diesel)',
    icon: '🚙',
    factor: 100,
    description: 'Better fuel economy, ~1.5 occupancy',
    source: 'Shakti Foundation'
  }
];

/**
 * Get transport mode by ID
 * @param {string} id - Transport mode identifier
 * @returns {object|undefined} Transport mode object
 */
export function getTransportMode(id) {
  return TRANSPORT_MODES.find(mode => mode.id === id);
}
