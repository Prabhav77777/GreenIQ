import React, { useState, useCallback } from 'react';
import { calculateFootprint } from '../engine/calculator.js';
import { validateCalculatorInputs } from '../utils/sanitize.js';
import { TRANSPORT_MODES } from '../data/transportModes.js';
import { INDIAN_STATES, getState } from '../data/indianStates.js';
import { DIET_PROFILES } from '../data/dietProfiles.js';
import { INDIA_MAP_PATHS } from '../data/indiaMapPaths.js';

const STATE_CODES = Object.keys(INDIA_MAP_PATHS);

/** @type {Array<{ id: string, title: string, description: string }>} */
const STEPS = [
  { id: 'transport', title: '🚗 Daily Commute', description: 'How do you get around every day?' },
  { id: 'electricity', title: '⚡ Electricity', description: 'Your home electricity usage' },
  { id: 'diet', title: '🍽️ Diet', description: 'What does your typical diet look like?' },
  { id: 'travel', title: '✈️ Travel', description: 'Long-distance travel frequency (optional)' },
  { id: 'lifestyle', title: '🏠 Lifestyle', description: 'A few more habits' }
];

/**
 * Multi-step calculator form that collects all user inputs and calculates
 * the complete annual carbon footprint upon submission.
 *
 * @param {object}   props
 * @param {Function} props.onComplete - Callback invoked with (result, inputs) after calculation
 * @returns {JSX.Element}
 */
export function Calculator({ onComplete }) {
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
                          aria-label={`${mode.label}: ${mode.factor === 0 ? 'Zero emissions' : `${mode.factor} g CO2 per kilometer`}`}
                        />
                        <span className="radio-card__icon" aria-hidden="true">{mode.icon}</span>
                        <span className="radio-card__label">{mode.label}</span>
                        <span className="radio-card__desc">
                          {mode.factor === 0 ? 'Zero emissions' : `${mode.factor} g CO₂/km`} — {mode.description}
                        </span>
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
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
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
                        const activeTabCode = formData.state || STATE_CODES[0];
                        const tabIndex = stateCode === activeTabCode ? 0 : -1;

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
                            tabIndex={tabIndex}
                            role="button"
                            aria-pressed={isSelected}
                            aria-label={`${pathInfo.label} (${factor} kg CO2/kWh)`}
                            data-state={stateCode}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                updateField('state', stateCode);
                              } else if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
                                e.preventDefault();
                                const currentIndex = STATE_CODES.indexOf(stateCode);
                                const nextIndex = (currentIndex + 1) % STATE_CODES.length;
                                const nextState = STATE_CODES[nextIndex];
                                const el = document.querySelector(`[data-state="${nextState}"]`);
                                if (el) el.focus();
                              } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
                                e.preventDefault();
                                const currentIndex = STATE_CODES.indexOf(stateCode);
                                const prevIndex = (currentIndex - 1 + STATE_CODES.length) % STATE_CODES.length;
                                const prevState = STATE_CODES[prevIndex];
                                const el = document.querySelector(`[data-state="${prevState}"]`);
                                if (el) el.focus();
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
                      <option key={s.id} value={s.id}>{s.name} ({s.gridFactor} kg CO₂/kWh)</option>
                    ))}
                  </select>
                  {errors.state && <div className="form-error" id="state-error" role="alert">{errors.state}</div>}
                  <div className="form-hint" id="state-hint">Used to determine your electricity grid's carbon intensity. Select state by clicking the map or dropdown.</div>
                </div>
                <div className="form-group">
                  <label className="form-label" id="elec-type-label">Enter electricity as:</label>
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="elec-type-label" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
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
                      <input type="radio" name="dietType" value={diet.id} checked={formData.dietType === diet.id} onChange={e => updateField('dietType', e.target.value)} aria-label={`${diet.label}: ${diet.description} (~${diet.annualKgCO2} kg CO2e per year)`} />
                      <span className="radio-card__icon" aria-hidden="true">{diet.icon}</span>
                      <span className="radio-card__label">{diet.label}</span>
                      <span className="radio-card__desc">{diet.description} (~{diet.annualKgCO2} kg CO₂e/yr)</span>
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
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="shopping-label" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
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
                  <div className="radio-card-group" role="radiogroup" aria-labelledby="cooking-label" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { id: 'lpg', icon: '🔥', label: 'LPG Cylinder', desc: 'Avg cylinder usage (~350 kg CO₂e/yr)' },
                      { id: 'png', icon: '🏠', label: 'Piped Gas (PNG)', desc: 'Piped natural gas (~280 kg CO₂e/yr)' },
                      { id: 'electric', icon: '⚡', label: 'Induction/Electric', desc: 'Electric cooking (~200 kg CO₂e/yr)' },
                      { id: 'biomass', icon: '🪵', label: 'Wood/Biomass', desc: 'Traditional wood/dung (~450 kg CO₂e/yr)' }
                    ].map(opt => (
                      <label key={opt.id} className={`radio-card ${formData.cookingFuel === opt.id ? 'radio-card--selected' : ''}`}>
                        <input type="radio" name="cookingFuel" value={opt.id} checked={formData.cookingFuel === opt.id} onChange={e => updateField('cookingFuel', e.target.value)} aria-label={opt.label} />
                        <span className="radio-card__icon" aria-hidden="true">{opt.icon}</span>
                        <span className="radio-card__label">{opt.label}</span>
                        <span className="radio-card__desc">{opt.desc}</span>
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
