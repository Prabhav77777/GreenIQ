/**
 * GreenIQ Tip Generator
 * 
 * Generates personalized carbon reduction tips.
 * Two modes:
 * 1. LLM-powered (Grok API) — rich, contextual, natural-language tips
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
  const tips = [];
  const seenTitles = new Set();

  let categories = footprintResult && footprintResult.categories
    ? footprintResult.categories
    : null;

  // Fallback to all categories if footprint result or categories are missing
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    categories = [
      { id: 'transport', value: 1 },
      { id: 'electricity', value: 1 },
      { id: 'diet', value: 1 },
      { id: 'flights', value: 1 },
      { id: 'lifestyle', value: 1 }
    ];
  }

  // Sort categories by emission value (highest first)
  const sorted = [...categories].sort((a, b) => (b.value || 0) - (a.value || 0));

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
 * Clean and parse JSON response from Grok API
 * Handles markdown wrappers (```json ... ```) and object wrappers (e.g. { "tips": [...] })
 * @param {string} text - Raw model response
 * @returns {Array|object|null} Parsed JSON or null
 */
function parseGrokResponse(text) {
  if (!text) return null;

  let cleanText = text.trim();

  // Strip markdown code block markers if present
  if (cleanText.includes('```')) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleanText = match[1].trim();
    }
  }

  // Look for JSON arrays or objects
  const firstBracket = cleanText.indexOf('[');
  const firstBrace = cleanText.indexOf('{');
  
  let jsonStart = -1;
  let jsonEnd = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    jsonStart = firstBracket;
    jsonEnd = cleanText.lastIndexOf(']');
  } else if (firstBrace !== -1) {
    jsonStart = firstBrace;
    jsonEnd = cleanText.lastIndexOf('}');
  }

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      // Find the first field that contains an array and return it
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          return parsed[key];
        }
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse clean JSON:', error.message);
  }

  return null;
}

/**
 * Generate tips using Grok API (LLM-powered)
 * Falls back to curated tips if API is unavailable or fails
 * @param {object} footprintResult - Result from calculateFootprint
 * @param {string} apiKey - Grok API key
 * @returns {Promise<Array>} Array of tip objects
 */
export async function generateTips(footprintResult, apiKey) {
  const cleanKey = apiKey && typeof apiKey === 'string' 
    ? apiKey.trim() 
    : '';

  // Handle common blank placeholder/null values from environment builders
  if (!cleanKey || cleanKey === 'undefined' || cleanKey === 'null' || cleanKey === 'your_api_key_here') {
    return getFallbackTips(footprintResult);
  }

  try {
    const prompt = buildPrompt(footprintResult);
    let response;

    // Try Grok-2 first
    try {
      response = await fetch(
        'https://api.x.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          },
          body: JSON.stringify({
            model: 'grok-2',
            messages: [
              {
                role: 'system',
                content: 'You are GreenIQ, an AI carbon footprint advisor specialized in the Indian context.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        }
      );
    } catch (e) {
      console.warn('Grok-2 request failed, trying grok-beta:', e.message);
    }

    // Fallback to grok-beta if grok-2 is not OK or connection failed
    if (!response || !response.ok) {
      console.warn('Grok-2 failed or unavailable, trying grok-beta...');
      response = await fetch(
        'https://api.x.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content: 'You are GreenIQ, an AI carbon footprint advisor specialized in the Indian context.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        }
      );
    }

    if (!response || !response.ok) {
      console.warn('Grok API error (both grok-2 and grok-beta), falling back to curated tips');
      return getFallbackTips(footprintResult);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      console.warn('Empty response text from Grok API, falling back to curated tips');
      return getFallbackTips(footprintResult);
    }

    const parsed = parseGrokResponse(text);

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      console.warn('Failed to parse Grok response as a valid array, falling back to curated tips');
      return getFallbackTips(footprintResult);
    }

    // Validate and sanitize each tip with flexible property fallbacks
    return parsed.map((tip) => {
      const title = tip.title || tip.Title || tip.name || tip.Name || 'Tip';
      const description = tip.description || tip.Description || tip.desc || tip.Desc || '';
      const estimatedSavingsKg = tip.estimatedSavingsKg || tip.estimated_savings_kg || tip.savings || tip.Savings || 0;
      const effort = tip.effort || tip.Effort || 'Medium';
      const category = tip.category || tip.Category || 'General';

      return {
        title: String(title),
        description: String(description),
        estimatedSavingsKg: Number(estimatedSavingsKg) || 0,
        effort: ['Easy', 'Medium', 'Hard'].includes(effort) ? effort : 'Medium',
        category: String(category)
      };
    }).slice(0, 8);

  } catch (error) {
    console.warn('Tip generation failed, using fallback:', error.message);
    return getFallbackTips(footprintResult);
  }
}

/**
 * Build the prompt for Grok API
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

Return a JSON object containing a "tips" array of objects with these fields:
- title (string, max 60 chars)
- description (string, 2-3 sentences, actionable and specific)
- estimatedSavingsKg (number, realistic annual kgCO2 savings)
- effort (string: "Easy", "Medium", or "Hard")
- category (string: "Transport", "Electricity", "Diet", "Travel", or "Lifestyle")

Sort the tips inside the array by estimatedSavingsKg descending. Be realistic with savings estimates.`;
}

