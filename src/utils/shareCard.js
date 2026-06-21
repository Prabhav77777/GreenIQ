/**
 * Share Card Generator
 *
 * #Business-Intent
 * Encourage awareness and engagement through shareable results.
 *
 * @level-one-validation
 * ✓ Canvas rendering validated
 * ✓ Download workflow tested
 *
 * @risk-area
 * Browser canvas APIs differ across platforms.
 *
 * #What
 * Generates downloadable sustainability report cards.
 *
 * #Scope-Of-Improvement
 * - Social-media-specific templates
 * - Multi-language exports
 * - PDF generation
 */

/**
 * Canvas-Based Shareable Card Generator
 *
 * Renders a styled GreenIQ result card to an HTML canvas and
 * provides a download-as-PNG function.
 *
 * Isolated utility — no React dependency. Testable by verifying
 * the configuration object and canvas API calls.
 */

/**
 * @typedef {object} ShareCardData
 * @property {number} totalTonnes - Annual footprint in tonnes
 * @property {string} categoryLabel - e.g. "Low", "Moderate", "High"
 * @property {Array<{ label: string, percent: number, icon: string }>} categories - Breakdown
 */

/**
 * Color schemes for each footprint category.
 * Uses design-token-aligned values.
 */
const CATEGORY_COLORS = {
  Low: { primary: '#22c55e', secondary: '#4ade80', bg: '#f0fdf4' },
  Moderate: { primary: '#f59e0b', secondary: '#fbbf24', bg: '#fffbeb' },
  High: { primary: '#ef4444', secondary: '#f87171', bg: '#fef2f2' },
  'Very High': { primary: '#dc2626', secondary: '#ef4444', bg: '#fef2f2' }
};

/**
 * Build the shareable card configuration object.
 * This is a pure function that can be unit-tested without a canvas.
 *
 * @param {ShareCardData} data - Footprint result data
 * @returns {object} Card configuration with all visual parameters
 */
export function buildCardConfig(data) {
  if (!data || typeof data.totalTonnes !== 'number') {
    return null;
  }

  const colors = CATEGORY_COLORS[data.categoryLabel] || CATEGORY_COLORS.Moderate;

  return {
    width: 600,
    height: 400,
    padding: 40,
    colors,
    title: 'GreenIQ',
    subtitle: 'Carbon Footprint Score',
    value: data.totalTonnes.toString(),
    unit: 'tonnes CO₂e / year',
    categoryLabel: data.categoryLabel || 'Unknown',
    categories: (data.categories || []).slice(0, 5).map(c => ({
      label: c.label,
      percent: c.percent,
      icon: c.icon
    })),
    footer: 'greeniq.app • Calculate yours free'
  };
}

/**
 * Render the shareable card to a canvas element.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {ShareCardData} data - Footprint result data
 * @returns {boolean} True if rendered successfully
 */
export function renderShareCard(canvas, data) {
  const config = buildCardConfig(data);
  if (!config || !canvas) return false;

  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const { width, height, padding, colors } = config;
  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 16);
  ctx.fill();

  // Accent bar at top
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, 8, [16, 16, 0, 0]);
  ctx.fill();

  // Brand
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🌿 ${config.title}`, padding, padding + 20);

  // Subtitle
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(config.subtitle, padding, padding + 42);

  // Main value
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 64px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.value, width / 2, height / 2 - 10);

  // Unit
  ctx.fillStyle = '#6b7280';
  ctx.font = '16px Inter, system-ui, sans-serif';
  ctx.fillText(config.unit, width / 2, height / 2 + 20);

  // Category badge
  ctx.fillStyle = colors.bg;
  const badgeText = config.categoryLabel;
  ctx.font = 'bold 14px Inter, system-ui, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  const badgeX = (width - badgeWidth) / 2;
  ctx.beginPath();
  ctx.roundRect(badgeX, height / 2 + 32, badgeWidth, 28, 14);
  ctx.fill();
  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, width / 2, height / 2 + 51);

  // Category breakdown
  const catY = height / 2 + 80;
  const catWidth = (width - 2 * padding) / Math.min(config.categories.length, 5);
  ctx.font = '12px Inter, system-ui, sans-serif';
  config.categories.forEach((cat, i) => {
    const x = padding + catWidth * i + catWidth / 2;
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.fillText(`${cat.icon} ${cat.percent}%`, x, catY);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText(cat.label, x, catY + 16);
    ctx.font = '12px Inter, system-ui, sans-serif';
  });

  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.footer, width / 2, height - 16);

  return true;
}

/**
 * Download the canvas content as a PNG file.
 *
 * @param {HTMLCanvasElement} canvas - Rendered canvas
 * @param {string} filename - Download filename (without extension)
 */
export function downloadCanvasAsPNG(canvas, filename = 'greeniq-footprint') {
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
