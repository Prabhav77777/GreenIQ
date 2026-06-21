import React, { useState, useEffect } from 'react';
import { generateTips, getFallbackTips } from '../engine/tipGenerator.js';
import { formatNumber } from '../utils/formatters.js';
import { Typewriter } from '../components/Typewriter.jsx';
import { LeafIllustration } from '../components/Icons.jsx';

/**
 * Tips page — the "Reduce" pillar.
 * Fetches AI-generated personalised tips for the user's footprint profile
 * and falls back to deterministic tips if the API is unavailable.
 * Closes the Reduce → Track loop with a clear CTA at the bottom.
 *
 * @param {object}      props
 * @param {object|null} props.result  - Latest calculated footprint result
 * @param {Function}    props.setPage - Navigation callback
 * @returns {JSX.Element}
 */
export function Tips({ result, setPage }) {
  const [tips, setTips] = useState(() => result ? getFallbackTips(result) : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
          Ranked by potential impact — small changes can make a big difference.
          Based on your specific footprint of {result.totalTonnes} tonnes CO₂e/year.
        </p>
      </div>

      <div className="tips__grid">
        {loading && (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div className="skeleton skeleton--circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton--title" style={{ marginBottom: 'var(--space-2)' }} />
                    <div className="skeleton skeleton--text" style={{ marginBottom: 'var(--space-1)' }} />
                    <div className="skeleton skeleton--text" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tips && tips.map((tip, i) => (
          <div key={i} className="card tip-card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
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

      {/* Reduce → Track CTA: closes the three-pillar loop */}
      {!loading && tips && (
        <div
          className="card"
          style={{
            marginTop: 'var(--space-8)',
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--color-primary-50)',
            border: '1.5px solid var(--color-primary-200)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }} aria-hidden="true">📈</div>
          <h2 className="card__title" style={{ marginBottom: 'var(--space-2)' }}>Ready to See Your Progress?</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
            Every calculation is automatically saved. Head to the Track page to see how your
            footprint changes as you adopt these tips over time.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => setPage('tracking')}>
              Track My Progress →
            </button>
            <button className="btn btn--secondary" onClick={() => setPage('calculator')}>
              🔄 Recalculate
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
