import React, { useState, useCallback, useMemo } from 'react';
import { useLocalStorage, useFootprintHistory, useTheme } from './hooks/useAppState.js';
import { calculateFootprint } from './engine/calculator.js';
import { generateTips, getFallbackTips } from './engine/tipGenerator.js';
import { validateCalculatorInputs } from './utils/sanitize.js';
import { formatNumber, formatCO2, formatDate, formatChange } from './utils/formatters.js';
import { TRANSPORT_MODES } from './data/transportModes.js';
import { INDIAN_STATES, getState } from './data/indianStates.js';
import { DIET_PROFILES } from './data/dietProfiles.js';
import { BENCHMARKS } from './data/nationalAverages.js';
import { getDisplayEquivalents } from './engine/equivalents.js';
import { getUnlockedBadges, getAllBadges } from './engine/badges.js';
import { renderShareCard, downloadCanvasAsPNG } from './utils/shareCard.js';
import { INDIA_MAP_PATHS } from './data/indiaMapPaths.js';

// Chart.js setup
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, ChartTooltip, Legend,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Filler
);

/* ============================================================================
 * HELPER COMPONENTS
 * ========================================================================== */

// Feature 1: Animated Number Count-Up (easing-based, respects prefers-reduced-motion)
function AnimatedNumber({ value, duration = 1200, decimals = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = 0;
    const end = Number(value);
    if (isNaN(end)) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutQuad easing curve: t * (2 - t)
      const easedProgress = progress * (2 - progress);
      const current = start + easedProgress * (end - start);
      
      setDisplayValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, decimals, prefersReducedMotion]);

  return <span>{displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

// Feature 10: Typewriter Effect Reveal for Tips (respects prefers-reduced-motion, fully accessible)
function Typewriter({ text, speed = 10 }) {
  const [displayedText, setDisplayedText] = useState('');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const indexRef = useRef(0);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(text);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      indexRef.current += 1;
      // Slice from the source text instead of appending one char at a time —
      // self-correcting even if this tick fires more than once for the same index.
      setDisplayedText(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, prefersReducedMotion]);

  return (
    <>
      {/* Screen readers read the full text instantly */}
      <span className="sr-only">{text}</span>
      {/* Visual representation is hidden from screen readers */}
      <span aria-hidden="true">{displayedText}</span>
    </>
  );
}

// Feature 2: Relatable Equivalents Inline SVG Icons
const ICONS = {
  tree: (
    <svg viewBox="0 0 24 24" width="24" height="24" className="equiv-card__icon-svg" aria-hidden="true">
      <path d="M12 2L4 12h3v8h10v-8h3L12 2z" fill="currentColor" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="24" height="24" className="equiv-card__icon-svg" aria-hidden="true">
      <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 20c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-4H7V4h10v13z" fill="currentColor" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" width="24" height="24" className="equiv-card__icon-svg" aria-hidden="true">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.27-4h11.46L19 11H5z" fill="currentColor" />
    </svg>
  )
};

// Feature 5: Empty-State Clean Inline SVGs
const LeafIllustration = () => (
  <svg viewBox="0 0 100 100" width="80" height="80" className="empty-state__svg" aria-hidden="true" style={{ margin: '0 auto var(--space-4) auto' }}>
    <path d="M50,90 C50,90 20,60 20,40 C20,20 40,15 50,35 C60,15 80,20 80,40 C80,60 50,90 50,90 Z" fill="none" stroke="var(--color-primary-500)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50,35 L50,90" stroke="var(--color-primary-500)" strokeWidth="3" />
    <path d="M50,50 C55,45 65,45 70,48" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50,65 C55,60 65,60 70,63" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50,57 C45,52 35,52 30,55" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50,72 C45,67 35,67 30,70" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const GrowthTreeIllustration = () => (
  <svg viewBox="0 0 100 100" width="80" height="80" className="empty-state__svg" aria-hidden="true" style={{ margin: '0 auto var(--space-4) auto' }}>
    <path d="M50,90 L50,40" stroke="var(--color-primary-600)" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M50,70 C60,65 70,65 75,55" fill="none" stroke="var(--color-primary-500)" strokeWidth="3" strokeLinecap="round" />
    <path d="M50,60 C40,55 30,55 25,45" fill="none" stroke="var(--color-primary-500)" strokeWidth="3" strokeLinecap="round" />
    <path d="M50,50 C60,45 65,40 70,35" fill="none" stroke="var(--color-primary-500)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="75" cy="55" r="5" fill="var(--color-primary-400)" />
    <circle cx="25" cy="45" r="5" fill="var(--color-primary-400)" />
    <circle cx="70" cy="35" r="5" fill="var(--color-primary-400)" />
    <circle cx="50" cy="35" r="7" fill="var(--color-primary-500)" />
    <line x1="20" y1="90" x2="80" y2="90" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ============================================================================
 * NAVIGATION
 * ========================================================================== */
function Nav({ currentPage, setPage, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'calculator', label: 'Calculate', icon: '🧮' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tracking', label: 'Track', icon: '📈' },
    { id: 'tips', label: 'Tips', icon: '💡' }
  ];

  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <button
        className="nav__brand"
        onClick={() => setPage('home')}
        aria-label="GreenIQ Home"
      >
        <span className="nav__brand-icon" aria-hidden="true">🌿</span>
        GreenIQ
      </button>

      <button
        className="nav__mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <div className={`nav__links ${mobileOpen ? 'nav__links--open' : ''}`} role="menubar">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav__link ${currentPage === item.id ? 'nav__link--active' : ''}`}
            onClick={() => { setPage(item.id); setMobileOpen(false); }}
            role="menuitem"
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      <div className="nav__actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

/* ============================================================================
 * LANDING PAGE
 * ========================================================================== */
function Landing({ setPage }) {
  return (
    <main className="landing" id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__badge" aria-label="India-focused carbon calculator">
          🇮🇳 Made for India
        </div>
        <h1 id="hero-title" className="hero__title">
          Know Your <span className="hero__title-accent">Carbon Footprint</span>
        </h1>
        <p className="hero__subtitle">
          GreenIQ helps you understand, track, and reduce your carbon emissions with
          personalized insights tuned to the Indian context — from auto-rickshaws to
          state-wise electricity grids.
        </p>
        <div className="hero__cta">
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setPage('calculator')}
          >
            Calculate My Footprint →
          </button>
          <button
            className="btn btn--secondary btn--lg"
            onClick={() => setPage('dashboard')}
          >
            View Dashboard
          </button>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <div className="hero__stat-value">1.9 t</div>
            <div className="hero__stat-label">India per capita avg</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-value">4.7 t</div>
            <div className="hero__stat-label">Global per capita avg</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-value">37</div>
            <div className="hero__stat-label">States & UTs covered</div>
          </div>
        </div>
      </section>

      <section className="features" aria-labelledby="features-title">
        <div className="features__header">
          <h2 id="features-title" className="features__title">Three Pillars of Change</h2>
          <p className="features__subtitle">
            A complete solution aligned with the challenge: understand, track, and reduce.
          </p>
        </div>
        <div className="features__grid">
          <article className="feature-card" aria-labelledby="feature-understand">
            <div className="feature-card__icon feature-card__icon--understand" aria-hidden="true">📊</div>
            <h3 id="feature-understand" className="feature-card__title">Understand</h3>
            <p className="feature-card__description">
              See your carbon footprint broken down by category — transport, electricity,
              diet, travel, lifestyle — with clear visualizations and comparisons to
              national and global averages.
            </p>
          </article>
          <article className="feature-card" aria-labelledby="feature-track">
            <div className="feature-card__icon feature-card__icon--track" aria-hidden="true">📈</div>
            <h3 id="feature-track" className="feature-card__title">Track</h3>
            <p className="feature-card__description">
              Log your footprint over time and see trends. Track progress with monthly
              streaks, entry history, and visualize how your habits change week over week.
            </p>
          </article>
          <article className="feature-card" aria-labelledby="feature-reduce">
            <div className="feature-card__icon feature-card__icon--reduce" aria-hidden="true">💡</div>
            <h3 id="feature-reduce" className="feature-card__title">Reduce</h3>
            <p className="feature-card__description">
              Get personalized, actionable tips ranked by impact and effort — specific
              to your profile and the Indian context. Powered by AI for natural-language
              advice, with reliable math underneath.
            </p>
          </article>
        </div>
      </section>

      <section className="india-context" aria-labelledby="india-title">
        <div className="india-context__inner">
          <h2 id="india-title" className="india-context__title">Built for India</h2>
          <p className="india-context__description">
            Most carbon calculators are US/EU-centric. GreenIQ is different —
            designed from the ground up for Indian lifestyles, transport, diets, and energy grids.
          </p>
          <div className="india-context__tags" role="list" aria-label="India-specific features">
            {[
              'Auto-Rickshaw', 'Two-Wheeler', 'Metro', 'Indian Railways',
              'State-wise Grid Factors', 'Vegetarian / Non-Veg Diets',
              'LPG / PNG Cooking', 'PM-SURYA Ghar', 'INR Bill Conversion'
            ].map(tag => (
              <span key={tag} className="india-context__tag" role="listitem">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer" role="contentinfo">
        <p className="footer__text">
          Built for PromptWars Hackathon • Challenge 3: Carbon Footprint Awareness Platform by PRABHAV AGRAWAL •{' '}
          <span className="footer__link">Data sources: CEA, TERI, IPCC, IEA</span>
        </p>
      </footer>
    </main>
  );
}

/* ============================================================================
 * CALCULATOR (Multi-Step Form)
 * ========================================================================== */
const STEPS = [
  { id: 'transport', title: '🚗 Daily Commute', description: 'How do you get around every day?' },
  { id: 'electricity', title: '⚡ Electricity', description: 'Your home electricity usage' },
  { id: 'diet', title: '🍽️ Diet', description: 'What does your typical diet look like?' },
  { id: 'travel', title: '✈️ Travel', description: 'Long-distance travel frequency (optional)' },
  { id: 'lifestyle', title: '🏠 Lifestyle', description: 'A few more habits' }
];

function Calculator({ onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    transportMode: 'two_wheeler',
    dailyDistanceKm: '',
    commuteDaysPerWeek: 5,
    state: '',
    monthlyKwh: '',
    monthlyBillINR: '',
    electricityInputType: 'bill',
    dietType: 'vegetarian',
    domesticFlightsPerYear: 0,
    longTrainTripsPerYear: 0,
    acHoursPerDay: '',
    shoppingLevel: 'average',
    cookingFuel: 'lpg'
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validateStep = useCallback(() => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.dailyDistanceKm && formData.transportMode !== 'bicycle') {
        newErrors.dailyDistanceKm = 'Please enter your daily commute distance';
      }
    }
    if (step === 1) {
      if (!formData.state) {
        newErrors.state = 'Please select your state';
      }
      if (formData.electricityInputType === 'bill' && !formData.monthlyBillINR) {
        newErrors.monthlyBillINR = 'Please enter your monthly electricity bill';
      }
      if (formData.electricityInputType === 'kwh' && !formData.monthlyKwh) {
        newErrors.monthlyKwh = 'Please enter your monthly kWh usage';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (step < STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        // Submit
        const { inputs } = validateCalculatorInputs({
          ...formData,
          dailyDistanceKm: Number(formData.dailyDistanceKm) || 0,
          monthlyKwh: formData.electricityInputType === 'kwh' ? Number(formData.monthlyKwh) || 0 : 0,
          monthlyBillINR: formData.electricityInputType === 'bill' ? Number(formData.monthlyBillINR) || 0 : 0,
          acHoursPerDay: Number(formData.acHoursPerDay) || 0
        });
        const result = calculateFootprint(inputs);
        onComplete(result, inputs);
      }
    }
  }, [step, validateStep, formData, onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  return (
    <main className="calculator" id="main-content">
      <div className="calculator__header">
        <h1 className="calculator__title">Calculate Your Footprint</h1>
        <p className="calculator__subtitle">Answer a few quick questions — it takes under 2 minutes</p>
      </div>

      <div className="calculator__progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        <div className="step-progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className="step-progress__step">
              <div
                className={`step-progress__dot ${i === step ? 'step-progress__dot--active' : ''} ${i < step ? 'step-progress__dot--completed' : ''}`}
                aria-label={`Step ${i + 1}: ${s.title}${i < step ? ' (completed)' : i === step ? ' (current)' : ''}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-progress__line ${i < step ? 'step-progress__line--completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="calculator__form" role="form" aria-label="Carbon footprint calculator">
        <div className="calculator__step" key={step}>
          <h2 className="calculator__step-title">{STEPS[step].title}</h2>
          <p className="calculator__step-desc">{STEPS[step].description}</p>

          <div className="calculator__fields">
            {step === 0 && (
              <>
                <div className="form-group">
                  <label className="form-label" id="transport-label">How do you commute?</label>
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="transport-label">
                    {TRANSPORT_MODES.map(mode => (
                      <label key={mode.id} className={`radio-card ${formData.transportMode === mode.id ? 'radio-card--selected' : ''}`}>
                        <input
                          type="radio"
                          name="transportMode"
                          value={mode.id}
                          checked={formData.transportMode === mode.id}
                          onChange={e => updateField('transportMode', e.target.value)}
                          aria-label={mode.label}
                        />
                        <span className="radio-card__icon" aria-hidden="true">{mode.icon}</span>
                        <span className="radio-card__label">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.transportMode !== 'bicycle' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="dailyDistance">
                        One-way distance (km)<span className="form-label__required" aria-label="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="dailyDistance"
                        className={`form-input ${errors.dailyDistanceKm ? 'form-input--error' : ''}`}
                        placeholder="e.g. 15"
                        min="0"
                        max="500"
                        value={formData.dailyDistanceKm}
                        onChange={e => updateField('dailyDistanceKm', e.target.value)}
                        aria-describedby={errors.dailyDistanceKm ? 'distance-error' : 'distance-hint'}
                        aria-invalid={!!errors.dailyDistanceKm}
                      />
                      {errors.dailyDistanceKm && (
                        <div className="form-error" id="distance-error" role="alert">{errors.dailyDistanceKm}</div>
                      )}
                      <div className="form-hint" id="distance-hint">One-way distance from home to work/school</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="commuteDays">Commute days per week</label>
                      <select
                        id="commuteDays"
                        className="form-input form-select"
                        value={formData.commuteDaysPerWeek}
                        onChange={e => updateField('commuteDaysPerWeek', Number(e.target.value))}
                      >
                        {[1,2,3,4,5,6,7].map(d => (
                          <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="state">
                    Your state<span className="form-label__required" aria-label="required">*</span>
                  </label>
                  
                  {/* Interactive India Map */}
                  <div className="india-map-container">
                    <svg viewBox="0 0 612 696" className="india-map-svg" role="group" aria-label="Interactive India Map for State Selection">
                      {Object.entries(INDIA_MAP_PATHS).map(([stateCode, pathInfo]) => {
                        const stateData = getState(stateCode);
                        const factor = stateData ? stateData.gridFactor : 0.73;
                        
                        // Dynamic color-coding based on grid factor (0.30 - 0.97)
                        const min = 0.30;
                        const max = 0.97;
                        const ratio = Math.max(0, Math.min(1, (factor - min) / (max - min)));
                        // HSL: 120 hue (green) down to 0 hue (red)
                        const hue = (1 - ratio) * 120;
                        const fill = `hsl(${hue}, 65%, 45%)`;
                        
                        const isSelected = formData.state === stateCode;
                        
                        return (
                          <path
                            key={stateCode}
                            d={pathInfo.d}
                            fill={isSelected ? 'var(--color-primary-600)' : fill}
                            stroke={isSelected ? '#ffffff' : 'var(--color-bg)'}
                            strokeWidth={isSelected ? 2 : 1}
                            className={`india-map-state ${isSelected ? 'india-map-state--selected' : ''}`}
                            onClick={() => updateField('state', stateCode)}
                            style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                            aria-label={`${pathInfo.label} (${factor} kg CO2/kWh)`}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                updateField('state', stateCode);
                              }
                            }}
                          >
                            <title>{pathInfo.label}: {factor} kg CO2/kWh</title>
                          </path>
                        );
                      })}
                    </svg>
                  </div>
                  
                  <select
                    id="state"
                    className={`form-input form-select ${errors.state ? 'form-input--error' : ''}`}
                    value={formData.state}
                    onChange={e => updateField('state', e.target.value)}
                    aria-invalid={!!errors.state}
                    aria-describedby={errors.state ? 'state-error' : 'state-hint'}
                    style={{ marginTop: 'var(--space-4)' }}
                  >
                    <option value="">Select your state...</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.state && <div className="form-error" id="state-error" role="alert">{errors.state}</div>}
                  <div className="form-hint" id="state-hint">Used to determine your electricity grid's carbon intensity. Select state by clicking the map or dropdown.</div>
                </div>
                <div className="form-group">
                  <label className="form-label" id="elec-type-label">Enter electricity as:</label>
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="elec-type-label" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    <label className={`radio-card ${formData.electricityInputType === 'bill' ? 'radio-card--selected' : ''}`}>
                      <input type="radio" name="elecType" value="bill" checked={formData.electricityInputType === 'bill'} onChange={e => updateField('electricityInputType', e.target.value)} aria-label="Monthly bill in rupees" />
                      <span className="radio-card__icon" aria-hidden="true">💰</span>
                      <span className="radio-card__label">Monthly Bill (₹)</span>
                    </label>
                    <label className={`radio-card ${formData.electricityInputType === 'kwh' ? 'radio-card--selected' : ''}`}>
                      <input type="radio" name="elecType" value="kwh" checked={formData.electricityInputType === 'kwh'} onChange={e => updateField('electricityInputType', e.target.value)} aria-label="Monthly units in kWh" />
                      <span className="radio-card__icon" aria-hidden="true">⚡</span>
                      <span className="radio-card__label">Monthly kWh</span>
                    </label>
                  </div>
                </div>
                {formData.electricityInputType === 'bill' ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="monthlyBill">Monthly electricity bill (₹)<span className="form-label__required" aria-label="required">*</span></label>
                    <input type="number" id="monthlyBill" className={`form-input ${errors.monthlyBillINR ? 'form-input--error' : ''}`} placeholder="e.g. 1500" min="0" value={formData.monthlyBillINR} onChange={e => updateField('monthlyBillINR', e.target.value)} aria-invalid={!!errors.monthlyBillINR} />
                    {errors.monthlyBillINR && <div className="form-error" role="alert">{errors.monthlyBillINR}</div>}
                    <div className="form-hint">We'll convert this to kWh using an average rate of ₹8/kWh</div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="monthlyKwh">Monthly usage (kWh)<span className="form-label__required" aria-label="required">*</span></label>
                    <input type="number" id="monthlyKwh" className={`form-input ${errors.monthlyKwh ? 'form-input--error' : ''}`} placeholder="e.g. 200" min="0" value={formData.monthlyKwh} onChange={e => updateField('monthlyKwh', e.target.value)} aria-invalid={!!errors.monthlyKwh} />
                    {errors.monthlyKwh && <div className="form-error" role="alert">{errors.monthlyKwh}</div>}
                    <div className="form-hint">Check your electricity bill for units consumed</div>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <div className="form-group">
                <label className="form-label" id="diet-label">What best describes your diet?</label>
                <div className="radio-card-group" role="radiogroup" aria-labelledby="diet-label">
                  {DIET_PROFILES.map(diet => (
                    <label key={diet.id} className={`radio-card ${formData.dietType === diet.id ? 'radio-card--selected' : ''}`}>
                      <input type="radio" name="dietType" value={diet.id} checked={formData.dietType === diet.id} onChange={e => updateField('dietType', e.target.value)} aria-label={`${diet.label}: ${diet.description}`} />
                      <span className="radio-card__icon" aria-hidden="true">{diet.icon}</span>
                      <span className="radio-card__label">{diet.label}</span>
                      <span className="radio-card__desc">{diet.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="flights">Domestic flights per year (round-trip)</label>
                  <input type="number" id="flights" className="form-input" placeholder="0" min="0" max="100" value={formData.domesticFlightsPerYear} onChange={e => updateField('domesticFlightsPerYear', Number(e.target.value) || 0)} />
                  <div className="form-hint">Count each round-trip as 1 flight</div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="trainTrips">Long-distance train trips per year</label>
                  <input type="number" id="trainTrips" className="form-input" placeholder="0" min="0" max="100" value={formData.longTrainTripsPerYear} onChange={e => updateField('longTrainTripsPerYear', Number(e.target.value) || 0)} />
                  <div className="form-hint">Trips over 500 km (e.g. Delhi-Mumbai)</div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="acHours">AC usage (hours/day in summer)</label>
                  <input type="number" id="acHours" className="form-input" placeholder="0" min="0" max="24" value={formData.acHoursPerDay} onChange={e => updateField('acHoursPerDay', e.target.value)} />
                  <div className="form-hint">Average hours per day during summer months</div>
                </div>
                <div className="form-group">
                  <label className="form-label" id="shopping-label">Shopping habits</label>
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="shopping-label" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    {[
                      { id: 'low', icon: '🌿', label: 'Minimal', desc: 'Buy rarely' },
                      { id: 'average', icon: '🛒', label: 'Average', desc: 'Normal shopping' },
                      { id: 'high', icon: '🛍️', label: 'Frequent', desc: 'Regular online orders' },
                      { id: 'very_high', icon: '💎', label: 'Heavy', desc: 'Frequent luxury buys' }
                    ].map(opt => (
                      <label key={opt.id} className={`radio-card ${formData.shoppingLevel === opt.id ? 'radio-card--selected' : ''}`}>
                        <input type="radio" name="shoppingLevel" value={opt.id} checked={formData.shoppingLevel === opt.id} onChange={e => updateField('shoppingLevel', e.target.value)} aria-label={`${opt.label}: ${opt.desc}`} />
                        <span className="radio-card__icon" aria-hidden="true">{opt.icon}</span>
                        <span className="radio-card__label">{opt.label}</span>
                        <span className="radio-card__desc">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" id="cooking-label">Primary cooking fuel</label>
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="cooking-label" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    {[
                      { id: 'lpg', icon: '🔥', label: 'LPG Cylinder' },
                      { id: 'png', icon: '🏠', label: 'Piped Gas (PNG)' },
                      { id: 'electric', icon: '⚡', label: 'Induction/Electric' },
                      { id: 'biomass', icon: '🪵', label: 'Wood/Biomass' }
                    ].map(opt => (
                      <label key={opt.id} className={`radio-card ${formData.cookingFuel === opt.id ? 'radio-card--selected' : ''}`}>
                        <input type="radio" name="cookingFuel" value={opt.id} checked={formData.cookingFuel === opt.id} onChange={e => updateField('cookingFuel', e.target.value)} aria-label={opt.label} />
                        <span className="radio-card__icon" aria-hidden="true">{opt.icon}</span>
                        <span className="radio-card__label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="calculator__actions">
            {step > 0 ? (
              <button className="btn btn--ghost" onClick={handleBack} aria-label="Go to previous step">
                ← Back
              </button>
            ) : <div />}
            <button className="btn btn--primary" onClick={handleNext}>
              {step < STEPS.length - 1 ? 'Next →' : 'Calculate My Footprint 🌍'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================================
 * DASHBOARD — "Understand"
 * ========================================================================== */
function Dashboard({ result, latestInputs, setPage }) {
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
  const unlockedBadges = useMemo(() => {
    return latestInputs ? getUnlockedBadges(latestInputs) : [];
  }, [latestInputs]);

  const allBadges = getAllBadges();

  // Feature 2: Display Equivalents
  const equivalents = useMemo(() => {
    return getDisplayEquivalents(result.totalKg);
  }, [result.totalKg]);

  const chartColors = ['#f59e0b', '#0ea5e9', '#22c55e', '#ef4444', '#8b5cf6'];
  const doughnutData = {
    labels: result.categories.map(c => c.label),
    datasets: [{
      data: result.categories.map(c => c.value),
      backgroundColor: chartColors,
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
          <p style={{color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)'}}>
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

      {/* Hero stat card with color-shifting result theme (Feature 3) */}
      <div className="card card--highlight dashboard__hero animate-fade-in-up">
        {/* Feature 4: Animated radial/arc gauge */}
        <div className="gauge-container">
          <svg viewBox="0 0 200 120" className="gauge-svg" role="img" aria-label={`Footprint gauge: ${result.totalTonnes} tonnes, category is ${result.category.label}`}>
            {/* Background Track */}
            <path
              d="M20,100 A80,80 0 0,1 180,100"
              fill="none"
              stroke="var(--gauge-track)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored Gauge Indicator */}
            {/* pathLength of 180 deg arc is pi * R = 3.14159 * 80 = 251.3 */}
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
        <p style={{marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)'}}>
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

      <div className="dashboard__grid">
        {/* Doughnut Chart */}
        <div className="card animate-fade-in-up" style={{animationDelay: '0.1s', opacity: 0}}>
          <div className="card__header">
            <h2 className="card__title">Breakdown by Category</h2>
          </div>
          <div className="chart-container chart-container--doughnut" role="img" aria-label={`Carbon footprint breakdown: ${result.categories.map(c => `${c.label} ${c.percent}%`).join(', ')}`}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={{marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)'}}>
            {result.categories.map((cat, i) => (
              <div key={cat.id} className="category-card">
                <div className="category-card__icon" style={{background: `${chartColors[i]}20`}}>
                  <span aria-hidden="true">{cat.icon}</span>
                </div>
                <div className="category-card__info">
                  <div className="category-card__name">{cat.label}</div>
                  <div style={{fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)'}}>{formatCO2(cat.value)}</div>
                </div>
                <div className="category-card__percent">{cat.percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="card animate-fade-in-up" style={{animationDelay: '0.2s', opacity: 0}}>
          <div className="card__header">
            <h2 className="card__title">How You Compare</h2>
          </div>
          <div style={{height: '280px'}} role="img" aria-label={`Comparison: You ${result.totalTonnes}t, India avg ${BENCHMARKS.india.value}t, Global avg ${BENCHMARKS.global.value}t`}>
            <Bar data={comparisonData} options={comparisonOptions} />
          </div>
        </div>
      </div>

      {/* Feature 8: Before/After comparison simulator */}
      <div className="card animate-fade-in-up" style={{animationDelay: '0.25s', opacity: 0, marginBottom: 'var(--space-6)'}}>
        <div className="card__header">
          <h2 className="card__title">🌱 What-If Scenario Simulation</h2>
          <span className="badge badge--info">Interactive Simulator</span>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
          Toggle hypothetical habits to see how much you could reduce your footprint in real-time.
        </p>
        
        <div className="simulation-container">
          <div className="simulation-controls">
            <label className="sim-control">
              <input
                type="checkbox"
                checked={whatIf.commutePublic}
                onChange={e => setWhatIf(prev => ({ ...prev, commutePublic: e.target.checked }))}
                className="sim-checkbox"
              />
              <span className="sim-label">
                <strong>🚇 Switch Commute to Metro</strong>
                <span className="sim-desc">Swap personal car/bike daily commute for public transit</span>
              </span>
            </label>
            
            <label className="sim-control">
              <input
                type="checkbox"
                checked={whatIf.dietVeg}
                onChange={e => setWhatIf(prev => ({ ...prev, dietVeg: e.target.checked }))}
                className="sim-checkbox"
              />
              <span className="sim-label">
                <strong>🥗 Switch to Vegetarian Diet</strong>
                <span className="sim-desc">Reduce food carbon intensity by eating plant-based/veg</span>
              </span>
            </label>
            
            <label className="sim-control">
              <input
                type="checkbox"
                checked={whatIf.acReduce}
                onChange={e => setWhatIf(prev => ({ ...prev, acReduce: e.target.checked }))}
                className="sim-checkbox"
              />
              <span className="sim-label">
                <strong>❄️ Reduce AC Usage by 50%</strong>
                <span className="sim-desc">Cut down air conditioning hours during summer</span>
              </span>
            </label>
            
            <label className="sim-control">
              <input
                type="checkbox"
                checked={whatIf.cookingElectric}
                onChange={e => setWhatIf(prev => ({ ...prev, cookingElectric: e.target.checked }))}
                className="sim-checkbox"
              />
              <span className="sim-label">
                <strong>⚡ Switch Cooking to Induction</strong>
                <span className="sim-desc">Use electric induction cooking instead of LPG cylinders</span>
              </span>
            </label>
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
      <div className="card animate-fade-in-up" style={{animationDelay: '0.3s', opacity: 0, marginBottom: 'var(--space-6)'}}>
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
      <div className="card animate-fade-in-up" style={{animationDelay: '0.35s', opacity: 0, textAlign: 'center', padding: 'var(--space-8)'}}>
        <h2 className="card__title" style={{marginBottom: 'var(--space-2)'}}>🌍 If Everyone in India Lived Like You</h2>
        <p style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)'}}>
          India's total emissions would be
        </p>
        <div className="stat__value" style={{fontSize: 'var(--font-size-3xl)'}}>
          <AnimatedNumber value={result.comparison.ifEveryoneGt} decimals={2} /> Gt CO₂
        </div>
        <p style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)'}}>
          India currently emits ~3.4 Gt CO₂/year
        </p>
      </div>

      {/* Shareable Results Card */}
      <div className="card animate-fade-in-up" style={{animationDelay: '0.4s', opacity: 0}}>
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
                  categories: result.categories.map(c => ({
                    label: c.label,
                    percent: c.percent,
                    icon: c.icon
                  }))
                };
                const success = renderShareCard(canvas, shareData);
                if (success) {
                  downloadCanvasAsPNG(canvas, `greeniq-score-${result.totalTonnes}t`);
                }
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

/* ============================================================================
 * TRACKING PAGE — "Track"
 * ========================================================================== */
function Tracking({ entries, streak, setPage }) {
  if (entries.length === 0) {
    return (
      <main className="tracking" id="main-content">
        <div className="empty-state">
          <GrowthTreeIllustration />
          <h2 className="empty-state__title">Start Tracking Your Progress</h2>
          <p className="empty-state__description">
            Calculate your footprint and it will be saved here automatically.
            Track how your habits change over time.
          </p>
          <button className="btn btn--primary" onClick={() => setPage('calculator')}>
            Calculate Now →
          </button>
        </div>
      </main>
    );
  }

  // Trend chart data (most recent 10 entries, reversed for chronological order)
  const chartEntries = entries.slice(0, 10).reverse();
  const trendData = {
    labels: chartEntries.map(e => formatDate(e.timestamp)),
    datasets: [{
      label: 'Total CO₂ (tonnes)',
      data: chartEntries.map(e => e.result.totalTonnes),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#22c55e'
    }]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.raw} tonnes CO₂e` } }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { callback: v => `${v} t` },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false }, ticks: { maxRotation: 45 } }
    }
  };

  return (
    <main className="tracking" id="main-content">
      <div className="tracking__header">
        <div>
          <h1 className="tracking__title">Track Your Progress</h1>
          <p style={{color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)'}}>
            See how your carbon footprint changes over time
          </p>
        </div>
        {streak > 0 && (
          <div className="tracking__streak" aria-label={`${streak} entries this month`}>
            🔥 {streak} entr{streak === 1 ? 'y' : 'ies'} this month
          </div>
        )}
      </div>

      {/* Trend chart */}
      <div className="card" style={{marginBottom: 'var(--space-6)'}}>
        <div className="card__header">
          <h2 className="card__title">Footprint Trend</h2>
        </div>
        <div style={{height: '300px'}} role="img" aria-label="Line chart showing carbon footprint trend over time">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>

      {/* History table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Entry History</h2>
          <span className="badge badge--info">{entries.length} entries</span>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table className="history-table" aria-label="Footprint history entries">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Transport</th>
                <th scope="col">Electricity</th>
                <th scope="col">Diet</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 20).map((entry, i) => {
                const prev = entries[i + 1];
                const change = prev
                  ? Math.round(((entry.result.totalTonnes - prev.result.totalTonnes) / prev.result.totalTonnes) * 100)
                  : null;
                const changeInfo = change !== null ? formatChange(change) : null;
                return (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.timestamp)}</td>
                    <td><strong>{entry.result.totalTonnes} t</strong></td>
                    <td>{formatCO2(entry.result.transport.value)}</td>
                    <td>{formatCO2(entry.result.electricity.value)}</td>
                    <td>{formatCO2(entry.result.diet.value)}</td>
                    <td>
                      {changeInfo ? (
                        <span className={`history-table__change--${changeInfo.direction === 'up' ? 'up' : changeInfo.direction === 'down' ? 'down' : ''}`}>
                          {changeInfo.text}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

/* ============================================================================
 * TIPS PAGE — "Reduce"
 * ========================================================================== */
function Tips({ result, setPage }) {
  const [tips, setTips] = useState(() => result ? getFallbackTips(result) : null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!result) return;
    setLoading(true);
    const apiKey = import.meta.env.VITE_GROK_API_KEY || '';
    generateTips(result, apiKey)
      .then(setTips)
      .finally(() => setLoading(false));
  }, [result]);

  if (!result) {
    return (
      <main className="tips" id="main-content">
        <div className="empty-state">
          <LeafIllustration />
          <h2 className="empty-state__title">Get Personalized Tips</h2>
          <p className="empty-state__description">
            Calculate your footprint first to receive tips tailored to your profile.
          </p>
          <button className="btn btn--primary" onClick={() => setPage('calculator')}>
            Calculate Now →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="tips" id="main-content">
      <div className="tips__header">
        <h1 className="tips__title">💡 Your Personalized Tips</h1>
        <p className="tips__subtitle">
          Ranked by potential impact — small changes can make a big difference. Based on your specific footprint of {result.totalTonnes} tonnes CO₂e/year.
        </p>
      </div>

      <div className="tips__grid">
        {loading && (
          <>
            {[1,2,3,4].map(i => (
              <div key={i} className="card">
                <div style={{display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start'}}>
                  <div className="skeleton skeleton--circle" style={{width: 32, height: 32, flexShrink: 0}} />
                  <div style={{flex: 1}}>
                    <div className="skeleton skeleton--title" style={{marginBottom: 'var(--space-2)'}} />
                    <div className="skeleton skeleton--text" style={{marginBottom: 'var(--space-1)'}} />
                    <div className="skeleton skeleton--text" style={{width: '70%'}} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tips && tips.map((tip, i) => (
          <div key={i} className="card tip-card animate-fade-in-up" style={{animationDelay: `${i * 0.05}s`, opacity: 0}}>
            <div className="tip-card__rank" aria-label={`Tip ${i + 1}`}>{i + 1}</div>
            <div className="tip-card__content">
              <h3 className="tip-card__title"><Typewriter text={tip.title} speed={15} /></h3>
              <p className="tip-card__description"><Typewriter text={tip.description} speed={8} /></p>
              <div className="tip-card__meta">
                <span className="tip-card__impact" aria-label={`Saves ${tip.estimatedSavingsKg} kg CO2 per year`}>
                  🌱 ~{formatNumber(tip.estimatedSavingsKg, 0)} kg/yr saved
                </span>
                <span className="tip-card__effort" aria-label={`Effort: ${tip.effort}`}>
                  {tip.effort === 'Easy' ? '🟢' : tip.effort === 'Medium' ? '🟡' : '🔴'} {tip.effort}
                </span>
                <span className="tip-card__category">{tip.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/* ============================================================================
 * ERROR BOUNDARY
 * ========================================================================== */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" role="alert">
          <div className="empty-state__icon">⚠️</div>
          <h2 className="empty-state__title">Something went wrong</h2>
          <p className="empty-state__description">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn btn--primary" onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================================
 * APP ROOT
 * ========================================================================== */
export default function App() {
  const [page, setPage] = useState('home');
  const { theme, toggleTheme } = useTheme();
  const [latestResult, setLatestResult] = useLocalStorage('greeniq_latest_result', null);
  const [latestInputs, setLatestInputs] = useLocalStorage('greeniq_latest_inputs', null);
  const { entries, addEntry, getStreak } = useFootprintHistory();
  const [toast, setToast] = useState(null);

  const handleCalculationComplete = useCallback((result, inputs) => {
    setLatestResult(result);
    setLatestInputs(inputs);
    addEntry(result, inputs);
    setPage('dashboard');
    setToast('✅ Footprint calculated and saved!');
    setTimeout(() => setToast(null), 3500);
  }, [setLatestResult, setLatestInputs, addEntry]);

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Nav
        currentPage={page}
        setPage={setPage}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {page === 'home' && <Landing setPage={setPage} />}
      {page === 'calculator' && <Calculator onComplete={handleCalculationComplete} />}
      {page === 'dashboard' && <Dashboard result={latestResult} latestInputs={latestInputs} setPage={setPage} />}
      {page === 'tracking' && <Tracking entries={entries} streak={getStreak()} setPage={setPage} />}
      {page === 'tips' && <Tips result={latestResult} setPage={setPage} />}

      {toast && (
        <div className="toast toast--success" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </ErrorBoundary>
  );
}
