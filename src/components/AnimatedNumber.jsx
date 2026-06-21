import React, { useState, useEffect } from 'react';

/**
 * Animated count-up number display with easing.
 * Respects the user's `prefers-reduced-motion` accessibility setting.
 *
 * @param {object}  props
 * @param {number}  props.value    - Target numeric value to animate to
 * @param {number}  [props.duration=1200] - Animation duration in milliseconds
 * @param {number}  [props.decimals=2]    - Number of decimal places to display
 * @returns {JSX.Element}
 */
export function AnimatedNumber({ value, duration = 1200, decimals = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

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
      const current = easedProgress * end;

      setDisplayValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, decimals, prefersReducedMotion]);

  return (
    <span>
      {displayValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
    </span>
  );
}
