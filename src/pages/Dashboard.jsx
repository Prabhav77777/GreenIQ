/**
 * Dashboard Experience Layer
 *
 * #Business-Intent
 * Transform raw footprint calculations into understandable insights.
 *
 * @level-one-validation
 * ✓ Data visualization verified
 * ✓ Benchmark comparisons validated
 * ✓ Share-card generation tested
 *
 * @risk-area
 * Large datasets may impact rendering performance.
 *
 * #What
 * Displays footprint analysis, achievements,
 * comparisons and actionable insights.
 *
 * #Scope-Of-Improvement
 * - Historical trends
 * - Personalized analytics
 * - Goal tracking
 */

import React, { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { calculateFootprint } from '../engine/calculator.js';
import { getDisplayEquivalents } from '../engine/equivalents.js';
import { getUnlockedBadges, getAllBadges } from '../engine/badges.js';
import { renderShareCard, downloadCanvasAsPNG } from '../utils/shareCard.js';
import { formatCO2, formatNumber } from '../utils/formatters.js';
import { BENCHMARKS } from '../data/nationalAverages.js';
import { AnimatedNumber } from '../components/AnimatedNumber.jsx';
import { EarthMascot } from '../components/EarthMascot.jsx';
import { LeafIllustration, ICONS } from '../components/Icons.jsx';
import {
     Chart as ChartJS,
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     BarElement,
     ArcElement,
     Title,
     Tooltip,
     Legend,
   } from 'chart.js';

   ChartJS.register(
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     BarElement,
     ArcElement,
     Title,
     Tooltip,
     Legend
   );

/** Chart colour palette used for category breakdown */
const CHART_COLORS = ['#f59e0b', '#0ea5e9', '#22c55e', '#ef4444', '#8b5cf6'];

/**
 * Dashboard page — the "Understand" pillar.
 * Shows the footprint gauge, category breakdown, comparison chart,
 * what-if simulator, badges, and share card.
 *
 * @param {object}      props
 * @param {object|null} props.result       - Latest calculated footprint result
 * @param {object|null} props.latestInputs - Raw inputs from the last calculation
 * @param {Function}    props.setPage      - Navigation callback
 * @returns {JSX.Element}
 */
export function Dashboard({ result, latestInputs, setPage }) {
  if (!result) {
    return (
      <main className="dashboard" id="main-content">
        <div className="empty-state">
          <LeafIllustration />
          <h2 className="empty-state__title">No footprint data yet</h2>
          <p className="empty-state__description">
            Calculate your carbon footprint first to see your personalized dashboard.
          </p>
          <button className="btn btn--primary" onClick={() => setPage('calculator')}>
            Calculate Now →
          </button>
        </div>
      </main>
    );
  }

  // Feature 8: Before/After Scenario Toggles
  const [whatIf, setWhatIf] = useState({
    commutePublic: false,
    dietVeg: false,
    acReduce: false,
    cookingElectric: false
  });

  const projectedInputs = useMemo(() => {
    if (!latestInputs) return null;
    const inputs = { ...latestInputs };
    if (whatIf.commutePublic) {
      if (['car_petrol', 'car_diesel', 'two_wheeler', 'shared_cab', 'auto_rickshaw'].includes(inputs.transportMode)) {
        inputs.transportMode = 'metro';
      }
    }
    if (whatIf.dietVeg) {
      if (['non_veg_heavy', 'non_veg_moderate', 'eggetarian'].includes(inputs.dietType)) {
        inputs.dietType = 'vegetarian';
      }
    }
    if (whatIf.acReduce) {
      inputs.acHoursPerDay = Math.max(0, Number(inputs.acHoursPerDay) / 2);
    }
    if (whatIf.cookingElectric) {
      inputs.cookingFuel = 'electric';
    }
    return inputs;
  }, [latestInputs, whatIf]);

  const projectedResult = useMemo(() => {
    if (!projectedInputs) return null;
    return calculateFootprint(projectedInputs);
  }, [projectedInputs]);

  // Feature 9: Achievement Badges
  const unlockedBadges = useMemo(() => latestInputs ? getUnlockedBadges(latestInputs) : [], [latestInputs]);
  const allBadges = getAllBadges();

  // Feature 2: Display Equivalents
  const equivalents = useMemo(() => getDisplayEquivalents(result.totalKg), [result.totalKg]);

  const doughnutData = {
    labels: result.categories.map(c => c.label),
    datasets: [{
      data: result.categories.map(c => c.value),
      backgroundColor: CHART_COLORS,
      borderColor: 'transparent',
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatCO2(ctx.raw)} (${result.categories[ctx.dataIndex].percent}%)`
        }
      }
    },
    cutout: '65%'
  };

  const maxBarValue = Math.max(result.totalTonnes, BENCHMARKS.global.value) * 1.1;

  const comparisonData = {
    labels: ['You', 'India Avg', 'Global Avg', '2°C Target'],
    datasets: [{
      data: [result.totalTonnes, BENCHMARKS.india.value, BENCHMARKS.global.value, BENCHMARKS.parisTarget.value],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#0ea5e9'],
      borderRadius: 8,
      barThickness: 40
    }]
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: maxBarValue,
        ticks: { callback: v => `${v} t` },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <main className="dashboard" id="main-content" data-category={result.category.id}>
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Your Carbon Footprint</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            Understand your impact on the environment
          </p>
        </div>
        <div className="dashboard__actions">
          <button className="btn btn--secondary btn--sm" onClick={() => setPage('tips')}>
            💡 Get Tips
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setPage('calculator')}>
            🔄 Recalculate
          </button>
        </div>
      </div>

      {/* Hero stat card with colour-shifting result theme (Feature 3) */}
      <div className="card card--highlight dashboard__hero animate-fade-in-up">
        {/* Feature 4: Animated radial/arc gauge */}
        <div className="gauge-container">
          <svg viewBox="0 0 200 120" className="gauge-svg" role="img" aria-label={`Footprint gauge: ${result.totalTonnes} tonnes, category is ${result.category.label}`}>
            <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="var(--gauge-track)" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M20,100 A80,80 0 0,1 180,100"
              fill="none"
              stroke="var(--result-accent)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="251.3"
              strokeDashoffset={251.3 - (251.3 * Math.min(100, Math.max(0, (result.totalTonnes / 10) * 100))) / 100}
              className="gauge-path"
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-value"><AnimatedNumber value={result.totalTonnes} decimals={2} /></span>
            <span className="gauge-unit">tonnes CO₂e</span>
          </div>
        </div>

        <span className={`badge ${result.category.badgeClass}`}>
          {result.category.label} — {result.category.description}
        </span>
        <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          {result.comparison.vsIndiaAvg >= 0
            ? `${result.comparison.vsIndiaAvg}% above India's average`
            : `${Math.abs(result.comparison.vsIndiaAvg)}% below India's average`}
          {' • '}
          {result.comparison.vsGlobalAvg >= 0
            ? `${result.comparison.vsGlobalAvg}% above global average`
            : `${Math.abs(result.comparison.vsGlobalAvg)}% below global average`}
        </p>

        {/* Feature 2: Relatable Real-World Equivalents Row */}
        <div className="equiv-row" style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', width: '100%', flexWrap: 'wrap' }}>
          {equivalents.map(eq => (
            <div key={eq.id} className="equiv-card" aria-label={eq.ariaLabel}>
              <div className="equiv-card__icon">{ICONS[eq.icon]}</div>
              <div className="equiv-card__value">{eq.value}</div>
              <div className="equiv-card__label">{eq.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard__grid dashboard__grid--three">
        {/* Earth Mascot Card */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card__header" style={{ width: '100%' }}>
            <h2 className="card__title">Earth Mascot Status</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
            <EarthMascot result={result} inputs={latestInputs} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="card__header">
            <h2 className="card__title">Breakdown by Category</h2>
          </div>
          <div className="chart-container chart-container--doughnut" role="img" aria-label={`Carbon footprint breakdown: ${result.categories.map(c => `${c.label} ${c.percent}%`).join(', ')}`}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {result.categories.map((cat, i) => (
              <div key={cat.id} className="category-card">
                <div className="category-card__icon" style={{ background: `${CHART_COLORS[i]}20` }}>
                  <span aria-hidden="true">{cat.icon}</span>
                </div>
                <div className="category-card__info">
                  <div className="category-card__name">{cat.label}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{formatCO2(cat.value)}</div>
                </div>
                <div className="category-card__percent">{cat.percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="card__header">
            <h2 className="card__title">How You Compare</h2>
          </div>
          <div style={{ height: '280px' }} role="img" aria-label={`Comparison: You ${result.totalTonnes}t, India avg ${BENCHMARKS.india.value}t, Global avg ${BENCHMARKS.global.value}t`}>
            <Bar data={comparisonData} options={comparisonOptions} />
          </div>
        </div>
      </div>

      {/* Feature 8: Before/After comparison simulator */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0, marginBottom: 'var(--space-6)' }}>
        <div className="card__header">
          <h2 className="card__title">🌱 What-If Scenario Simulation</h2>
          <span className="badge badge--info">Interactive Simulator</span>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
          Toggle hypothetical habits to see how much you could reduce your footprint in real-time.
        </p>

        <div className="simulation-container">
          <div className="simulation-controls">
            {[
              { key: 'commutePublic', icon: '🚇', label: 'Switch Commute to Metro', desc: 'Swap personal car/bike daily commute for public transit' },
              { key: 'dietVeg', icon: '🥗', label: 'Switch to Vegetarian Diet', desc: 'Reduce food carbon intensity by eating plant-based/veg' },
              { key: 'acReduce', icon: '❄️', label: 'Reduce AC Usage by 50%', desc: 'Cut down air conditioning hours during summer' },
              { key: 'cookingElectric', icon: '⚡', label: 'Switch Cooking to Induction', desc: 'Use electric induction cooking instead of LPG cylinders' }
            ].map(({ key, icon, label, desc }) => (
              <label key={key} className="sim-control">
                <input
                  type="checkbox"
                  checked={whatIf[key]}
                  onChange={e => setWhatIf(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sim-checkbox"
                />
                <span className="sim-label">
                  <strong>{icon} {label}</strong>
                  <span className="sim-desc">{desc}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="simulation-results">
            <div className="sim-result-box">
              <div className="sim-result-label">Current Footprint</div>
              <div className="sim-result-value">{result.totalTonnes} t</div>
            </div>
            <div className="sim-result-arrow">→</div>
            <div className="sim-result-box sim-result-box--projected">
              <div className="sim-result-label">Projected Footprint</div>
              <div className="sim-result-value" style={{ color: 'var(--color-primary-500)' }}>
                {projectedResult ? projectedResult.totalTonnes : result.totalTonnes} t
              </div>
            </div>
            <div className="sim-savings-badge">
              🎉 Potential Savings: <strong>{Math.max(0, Math.round((result.totalTonnes - (projectedResult ? projectedResult.totalTonnes : result.totalTonnes)) * 100) / 100)} tonnes CO₂e/yr</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 9: Achievement Badges */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, marginBottom: 'var(--space-6)' }}>
        <div className="card__header">
          <h2 className="card__title">🏆 GreenIQ Achievement Badges</h2>
          <span className="badge badge--info">{unlockedBadges.length} unlocked</span>
        </div>
        <div className="badges-row">
          {allBadges.map(badge => {
            const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                className={`badge-card ${isUnlocked ? 'badge-card--unlocked' : 'badge-card--locked'}`}
                title={badge.description}
                aria-label={`${badge.title} badge: ${isUnlocked ? 'Unlocked' : 'Locked'} - ${badge.description}`}
              >
                <div className="badge-card__icon">{badge.icon}</div>
                <div className="badge-card__title">{badge.title}</div>
                <div className="badge-card__status">{isUnlocked ? 'Unlocked ✓' : 'Locked 🔒'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* If everyone did this */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0, textAlign: 'center', padding: 'var(--space-8)' }}>
        <h2 className="card__title" style={{ marginBottom: 'var(--space-2)' }}>🌍 If Everyone in India Lived Like You</h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          India's total emissions would be
        </p>
        <div className="stat__value" style={{ fontSize: 'var(--font-size-3xl)' }}>
          <AnimatedNumber value={result.comparison.ifEveryoneGt} decimals={2} /> Gt CO₂
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          India currently emits ~3.4 Gt CO₂/year
        </p>
      </div>

      {/* Shareable Results Card */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
        <div className="card__header">
          <h2 className="card__title">📤 Share Your Results</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
                const text = `🌿 My GreenIQ Carbon Footprint: ${result.totalTonnes} tonnes CO₂e/year\n\n` +
                  result.categories.map(c => `${c.icon} ${c.label}: ${formatCO2(c.value)} (${c.percent}%)`).join('\n') +
                  `\n\n${result.comparison.vsIndiaAvg >= 0
                    ? `📊 ${result.comparison.vsIndiaAvg}% above`
                    : `📊 ${Math.abs(result.comparison.vsIndiaAvg)}% below`} India's avg (${BENCHMARKS.india.value}t)\n` +
                  `🌍 ${Math.abs(result.comparison.vsGlobalAvg)}% ${result.comparison.vsGlobalAvg >= 0 ? 'above' : 'below'} global avg (${BENCHMARKS.global.value}t)\n\n` +
                  `Calculate yours at GreenIQ! #CarbonFootprint #ClimateAction`;
                navigator.clipboard.writeText(text).then(() => {
                  const btn = document.getElementById('share-btn-text');
                  if (btn) { btn.textContent = 'Copied! ✓'; setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000); }
                }).catch(() => {});
              }}
              aria-label="Copy results to clipboard"
            >
              <span id="share-btn-text">Copy to Clipboard</span>
            </button>

            {/* Feature 6: Share Score Card PNG Image download */}
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                const canvas = document.createElement('canvas');
                const shareData = {
                  totalTonnes: result.totalTonnes,
                  categoryLabel: result.category.label,
                  categories: result.categories.map(c => ({ label: c.label, percent: c.percent, icon: c.icon }))
                };
                const success = renderShareCard(canvas, shareData);
                if (success) downloadCanvasAsPNG(canvas, `greeniq-score-${result.totalTonnes}t`);
              }}
              aria-label="Download footprint score card as PNG image"
            >
              📥 Download Image
            </button>
          </div>
        </div>
        <div className="share-card" role="img" aria-label={`Shareable card showing ${result.totalTonnes} tonnes CO₂ per year`}>
          <div className="share-card__brand">🌿 GreenIQ</div>
          <div className="share-card__value">{result.totalTonnes}</div>
          <div className="share-card__unit">tonnes CO₂e / year</div>
          <div className="share-card__categories">
            {result.categories.map(cat => (
              <div key={cat.id} className="share-card__category">
                <div className="share-card__category-value">{cat.percent}%</div>
                <div className="share-card__category-label">{cat.icon} {cat.label}</div>
              </div>
            ))}
          </div>
          <div className="share-card__footer">
            {result.comparison.vsIndiaAvg >= 0
              ? `${result.comparison.vsIndiaAvg}% above India average`
              : `${Math.abs(result.comparison.vsIndiaAvg)}% below India average`}
            {' • '}
            Calculated with GreenIQ
          </div>
        </div>
      </div>
    </main>
  );
}
