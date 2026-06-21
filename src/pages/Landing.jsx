import React from 'react';

/**
 * Landing page — the hero entry point that introduces GreenIQ's three pillars:
 * Understand, Track, and Reduce.
 *
 * @param {object}   props
 * @param {Function} props.setPage - Navigation callback
 * @returns {JSX.Element}
 */
export function Landing({ setPage }) {
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
            <div className="hero__stat-label">States &amp; UTs covered</div>
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
          Built for PromptWars Hackathon Challenge 3: Carbon Footprint Awareness Platform by PRABHAV AGRAWAL •{' '}
          <span className="footer__link">Data sources: CEA, TERI, IPCC, IEA</span>
        </p>
      </footer>
    </main>
  );
}
