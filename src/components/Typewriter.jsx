import React, { useState, useEffect, useRef } from 'react';

/**
 * Typewriter animation component that reveals text character by character.
 * Screen readers receive the full text immediately via a visually-hidden element.
 * Respects `prefers-reduced-motion` — shows full text instantly when enabled.
 *
 * @param {object} props
 * @param {string} props.text          - Text content to animate
 * @param {number} [props.speed=10]    - Milliseconds between each character reveal
 * @returns {JSX.Element}
 */
export function Typewriter({ text, speed = 10 }) {
  const [displayedText, setDisplayedText] = useState('');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const indexRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(text);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      indexRef.current += 1;
      // Slice from source text for self-correction if tick fires multiple times
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
      {/* Visual typewriter animation is hidden from screen readers */}
      <span aria-hidden="true">{displayedText}</span>
    </>
  );
}
