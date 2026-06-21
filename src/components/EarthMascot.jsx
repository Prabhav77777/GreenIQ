import React from 'react';
import { getEarthMood } from '../engine/earthMood.js';

export function EarthMascot({ result, inputs, compact = false }) {
  const state = getEarthMood(result, inputs);
  const hasHeat = state.factors.includes('fossil-fuel cooking');
  const hasSmog = state.factors.includes('high-emission transport') ||
    state.factors.includes('coal-heavy electricity');
  const hasDiet = state.factors.includes('high-impact diet');

  return (
    <figure
      className={`earth-mascot earth-mascot--${state.mood} ${compact ? 'earth-mascot--compact' : ''}`}
      role="img"
      aria-label={state.ariaLabel}
    >
      <div className="earth-mascot__stage">
        {state.mood === 'happy' && <span className="earth-mascot__sparkles" aria-hidden="true">✦ · ✧</span>}
        {hasSmog && <span className="earth-mascot__smog earth-mascot__smog--left" aria-hidden="true" />}
        {hasSmog && <span className="earth-mascot__smog earth-mascot__smog--right" aria-hidden="true" />}
        {hasHeat && <span className="earth-mascot__steam" aria-hidden="true">〰 〰</span>}
        <svg viewBox="0 0 240 250" className="earth-mascot__svg" aria-hidden="true">
          <defs>
            <radialGradient id="earth-ocean" cx="35%" cy="25%">
              <stop offset="0%" stopColor="var(--earth-ocean-light)" />
              <stop offset="75%" stopColor="var(--earth-ocean)" />
              <stop offset="100%" stopColor="var(--earth-ocean-shadow)" />
            </radialGradient>
            <linearGradient id="earth-heat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--earth-heat)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--earth-heat)" stopOpacity="0.62" />
            </linearGradient>
          </defs>
          <g className="earth-mascot__character">
            <path className="earth-mascot__limb" d="M50 120 Q20 126 18 98" />
            <path className="earth-mascot__limb earth-mascot__arm-wave" d="M190 120 Q219 105 224 77" />
            <path className="earth-mascot__limb" d="M88 200 Q82 225 70 232" />
            <path className="earth-mascot__limb" d="M151 200 Q158 225 172 232" />
            <ellipse className="earth-mascot__shoe" cx="62" cy="235" rx="20" ry="9" />
            <ellipse className="earth-mascot__shoe" cx="181" cy="235" rx="20" ry="9" />
            <circle cx="120" cy="125" r="80" fill="url(#earth-ocean)" className="earth-mascot__globe" />
            <path className="earth-mascot__land" d="M69 73 Q85 52 105 55 L112 72 103 91 80 96 64 86Z" />
            <path className="earth-mascot__land" d="M137 55 Q166 58 180 80 L168 96 151 91 143 76Z" />
            <path className="earth-mascot__land" d="M99 132 Q121 113 145 121 L163 143 151 172 132 190 111 173 106 151 88 143Z" />
            {hasHeat && <circle cx="120" cy="125" r="80" fill="url(#earth-heat)" />}
            <g className="earth-mascot__face">
              <ellipse className="earth-mascot__eye" cx="92" cy="116" rx="7" ry={state.mood === 'stressed' ? 4 : 10} />
              <ellipse className="earth-mascot__eye" cx="148" cy="116" rx="7" ry={state.mood === 'stressed' ? 4 : 10} />
              {state.mood === 'happy' ? (
                <path className="earth-mascot__mouth" d="M94 145 Q120 170 147 143" />
              ) : (
                <path className="earth-mascot__mouth" d="M98 157 Q120 136 143 157" />
              )}
            </g>
            {state.mood === 'stressed' && <path className="earth-mascot__sweat" d="M174 103 Q187 120 174 130 Q161 120 174 103Z" />}
          </g>
        </svg>
        {hasDiet && <span className="earth-mascot__wilt" aria-hidden="true">🥀</span>}
      </div>
      <figcaption>
        <strong>{state.label}</strong>
        <span>Earth health {state.healthScore}/100</span>
      </figcaption>
    </figure>
  );
}
