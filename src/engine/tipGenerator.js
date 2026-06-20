/**
 * GreenIQ Tip Generator
 * 
 * Generates personalized carbon reduction tips.
 * Two modes:
 * 1. LLM-powered (Gemini API) — rich, contextual, natural-language tips
 * 2. Fallback — curated static tips matched to user's highest-emission categories
 * 
 * The math/calculation is NEVER done by the LLM — only the natural language.
 */

/**
 * Curated fallback tips organized by category
 * Each tip: title, description, estimatedSavingsKg, effort, category
 */
const FALLBACK_TIPS = {
  transport: [
    {
      title: 'Switch to public transport for your commute',
      description: 'Taking the bus or metro instead of driving can reduce your transport emissions by 60-80%. Many Indian cities are expanding metro networks — check if yours has a route near you.',
      estimatedSavingsKg: 500,
      effort: 'Medium',
      category: 'Transport'
    },
    {
      title: 'Try carpooling or ride-sharing',
      description: 'Sharing your car ride with 2-3 colleagues can cut per-person transport emissions by 50-65%. Apps like Quick Ride and BlaBlaCar operate in most Indian cities.',
      estimatedSavingsKg: 350,
      effort: 'Easy',
      category: 'Transport'
    },
    {
      title: 'Consider a two-wheeler for short commutes',
      description: 'If you drive a car solo for short distances (<10 km), a two-wheeler emits roughly 70% less CO2 per km. Electric scooters are even better.',
      estimatedSavingsKg: 400,
      effort: 'Medium',
      category: 'Transport'
    },
    {
      title: 'Work from home when possible',
      description: 'Even 2 days of remote work per week eliminates 40% of your commute emissions. Discuss hybrid options with your employer.',
      estimatedSavingsKg: 250,
      effort: 'Easy',
      category: 'Transport'
    }
  ],
  electricity: [
    {
      title: 'Switch to a 5-star rated AC',
      description: 'A 5-star AC consumes 30-40% less electricity than a 2-3 star model. Set your thermostat to 24-26°C for optimal comfort with lower emissions.',
      estimatedSavingsKg: 300,
      effort: 'Hard',
      category: 'Electricity'
    },
    {
      title: 'Replace old appliances with energy-efficient ones',
      description: 'BEE 5-star rated refrigerators, fans, and washing machines can collectively save 200-400 kWh per year.',
      estimatedSavingsKg: 200,
      effort: 'Medium',
      category: 'Electricity'
    },
    {
      title: 'Install rooftop solar panels',
      description: 'With PM-SURYA Ghar scheme subsidies, rooftop solar has become affordable. A 3 kW system can offset 60-80% of average household electricity.',
      estimatedSavingsKg: 800,
      effort: 'Hard',
      category: 'Electricity'
    },
    {
      title: 'Use natural ventilation and fans before AC',
      description: 'Cross-ventilation and ceiling fans use 50x less energy than AC. Reserve AC for peak summer afternoons only.',
      estimatedSavingsKg: 250,
      effort: 'Easy',
      category: 'Electricity'
    }
  ],
  diet: [
    {
      title: 'Adopt more plant-based meals',
      description: 'India has a rich tradition of vegetarian cuisine. Even reducing meat by 2 meals per week can save 50-100 kgCO2e annually. Try regional specialties like sambar-rice, chole, or dal makhani.',
      estimatedSavingsKg: 80,
      effort: 'Easy',
      category: 'Diet'
    },
    {
      title: 'Choose chicken over mutton',
      description: 'Mutton produces nearly 2x the emissions of chicken per kg. Switching from mutton to chicken for half your meat meals saves significant CO2.',
      estimatedSavingsKg: 60,
      effort: 'Easy',
      category: 'Diet'
    },
    {
      title: 'Reduce food waste',
      description: 'India wastes ~68 million tonnes of food annually. Planning meals, using leftovers creatively, and proper storage can reduce your food footprint by 10-15%.',
      estimatedSavingsKg: 40,
      effort: 'Easy',
      category: 'Diet'
    }
  ],
  flights: [
    {
      title: 'Take trains for distances under 800 km',
      description: 'Indian Railways emits only 12 gCO2/pkm vs 255 gCO2/pkm for flights. Delhi-Jaipur, Mumbai-Pune, Chennai-Bangalore — trains are competitive on time and 20x better for climate.',
      estimatedSavingsKg: 340,
      effort: 'Medium',
      category: 'Travel'
    },
    {
      title: 'Consolidate trips and prefer direct flights',
      description: 'Takeoff and landing are the most fuel-intensive parts. Non-stop flights emit 20-30% less than connecting flights for the same route.',
      estimatedSavingsKg: 150,
      effort: 'Easy',
      category: 'Travel'
    }
  ],
  lifestyle: [
    {
      title: 'Switch to induction cooking',
      description: 'Induction cooktops are 80-90% energy efficient vs 40% for LPG. They\'re faster, cheaper to run, and produce zero direct kitchen emissions.',
      estimatedSavingsKg: 150,
      effort: 'Medium',
      category: 'Lifestyle'
    },
    {
      title: 'Practice mindful shopping',
      description: 'Fast fashion and frequent online shopping have hidden carbon costs. Buying fewer, quality items and choosing local products can halve your consumer goods footprint.',
      estimatedSavingsKg: 300,
      effort: 'Easy',
      category: 'Lifestyle'
    },
    {
      title: 'Set AC thermostat to 24°C or higher',
      description: 'Every degree below 24°C increases AC energy consumption by 6%. Setting to 24-26°C with a fan for circulation saves 30-40% on AC electricity.',
      estimatedSavingsKg: 200,
      effort: 'Easy',
      category: 'Lifestyle'
    }
  ]
};

/**
 * Get personalized fallback tips based on footprint results
 * Tips are ranked by estimated savings (highest first)
 * @param {object} footprintResult - Result from calculateFootprint
 * @returns {Array} Sorted array of tip objects
 */
export function getFallbackTips(footprintResult) {
  if (!footprintResult || !footprintResult.categories) return [];

  // Sort categories by emission value (highest first)
  const sorted = [...footprintResult.categories].sort((a, b) => b.value - a.value);

  const tips = [];
  const seenTitles = new Set();

  // Pick tips from highest-emission categories first
  for (const cat of sorted) {
    const categoryTips = FALLBACK_TIPS[cat.id] || [];
    for (const tip of categoryTips) {
      if (!seenTitles.has(tip.title)) {
        seenTitles.add(tip.title);
        tips.push({ ...tip });
      }
    }
  }

  // Sort all collected tips by estimated savings (highest first)
  tips.sort((a, b) => b.estimatedSavingsKg - a.estimatedSavingsKg);

  return tips;
}

/**
 * Generate tips using Gemini API (LLM-powered)
 * Falls back to curated tips if API is unavailable
 * @param {object} footprintResult - Result from calculateFootprint
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<Array>} Array of tip objects
 */
export async function generateTips(footprintResult, apiKey) {
  if (!apiKey) {
    return getFallbackTips(footprintResult);
  }

  try {
    const prompt = buildPrompt(footprintResult);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.warn('Gemini API error, falling back to curated tips');
      return getFallbackTips(footprintResult);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return getFallbackTips(footprintResult);
    }

    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getFallbackTips(footprintResult);
    }

    // Validate and sanitize each tip
    return parsed.map((tip) => ({
      title: String(tip.title || 'Tip'),
      description: String(tip.description || ''),
      estimatedSavingsKg: Number(tip.estimatedSavingsKg) || 0,
      effort: ['Easy', 'Medium', 'Hard'].includes(tip.effort) ? tip.effort : 'Medium',
      category: String(tip.category || 'General')
    })).slice(0, 8);

  } catch (error) {
    console.warn('Tip generation failed, using fallback:', error.message);
    return getFallbackTips(footprintResult);
  }
}

/**
 * Build the prompt for Gemini API
 * @param {object} result - Footprint calculation result
 * @returns {string} Formatted prompt
 */
function buildPrompt(result) {
  const categories = result.categories
    .map(c => `- ${c.label}: ${c.value} kgCO2/year (${c.percent}% of total)`)
    .join('\n');

  return `You are GreenIQ, an AI carbon footprint advisor specialized in the Indian context.

A user in India has the following annual carbon footprint:
Total: ${result.totalTonnes} tonnes CO2e/year
${categories}

India average: ${result.comparison.indiaAvg} tonnes/year
Global average: ${result.comparison.globalAvg} tonnes/year

Generate exactly 6 personalized, actionable tips to reduce their carbon footprint.
Focus on their highest-emission categories first.
Make tips specific to the Indian context (mention Indian alternatives, schemes, local solutions).

Return a JSON array of objects with these fields:
- title (string, max 60 chars)
- description (string, 2-3 sentences, actionable and specific)
- estimatedSavingsKg (number, realistic annual kgCO2 savings)
- effort (string: "Easy", "Medium", or "Hard")
- category (string: "Transport", "Electricity", "Diet", "Travel", or "Lifestyle")

Sort by estimatedSavingsKg descending. Be realistic with savings estimates.`;
}
