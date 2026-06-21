const CAR_MODES = new Set([
  'car_petrol',
  'car_diesel',
  'two_wheeler',
  'shared_cab',
  'auto_rickshaw'
]);

function getModeIds(inputs = {}) {
  if (Array.isArray(inputs.transportModes)) {
    return inputs.transportModes.map(mode => mode.modeId ?? mode.mode);
  }
  return inputs.transportMode ? [inputs.transportMode] : [];
}

export function getEarthMood(result, inputs = {}) {
  if (!result) {
    return {
      healthScore: 50,
      mood: 'neutral',
      label: 'waiting for footprint data',
      factors: [],
      ariaLabel: 'Earth mascot: waiting for footprint data'
    };
  }

  const ratioToIndia = result.totalTonnes / (result.comparison?.indiaAvg || 1.9);
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (ratioToIndia * 45))));
  const mood = healthScore >= 65 ? 'happy' : healthScore >= 35 ? 'concerned' : 'stressed';
  const factors = [];

  if (['lpg', 'png', 'biomass'].includes(inputs.cookingFuel) && result.lifestyle?.cookingKgCO2 >= 280) {
    factors.push('fossil-fuel cooking');
  }

  const hasCarReliance = getModeIds(inputs).some(modeId => CAR_MODES.has(modeId));
  if (hasCarReliance && result.transport?.value >= 300) {
    factors.push('high-emission transport');
  }

  if (result.electricity?.gridFactor >= 0.85 && result.electricity?.value >= 600) {
    factors.push('coal-heavy electricity');
  }

  if (result.diet?.value >= 450) {
    factors.push('high-impact diet');
  }

  const label = mood === 'happy' ? 'healthy and happy' : mood === 'concerned' ? 'concerned' : 'stressed';
  const causeText = factors.length > 0 ? `, primarily due to ${factors.join(', ')}` : '';

  return {
    healthScore,
    mood,
    label,
    factors,
    ariaLabel: `Earth mascot: ${label}${causeText}`
  };
}
