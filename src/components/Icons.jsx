import React from 'react';

/**
 * Inline SVG icon map for the relatable equivalents row (Feature 2).
 * Keys correspond to equivalent IDs returned by `getDisplayEquivalents`.
 *
 * @type {Record<string, JSX.Element>}
 */
export const ICONS = {
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

/**
 * Leaf SVG illustration used for empty states on the Dashboard and Tips pages.
 * Decorative — hidden from assistive technologies via `aria-hidden`.
 *
 * @returns {JSX.Element}
 */
export function LeafIllustration() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="80"
      height="80"
      className="empty-state__svg"
      aria-hidden="true"
      style={{ margin: '0 auto var(--space-4) auto' }}
    >
      <path d="M50,90 C50,90 20,60 20,40 C20,20 40,15 50,35 C60,15 80,20 80,40 C80,60 50,90 50,90 Z" fill="none" stroke="var(--color-primary-500)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50,35 L50,90" stroke="var(--color-primary-500)" strokeWidth="3" />
      <path d="M50,50 C55,45 65,45 70,48" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50,65 C55,60 65,60 70,63" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50,57 C45,52 35,52 30,55" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50,72 C45,67 35,67 30,70" fill="none" stroke="var(--color-primary-400)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Growth tree SVG illustration used for the empty state on the Tracking page.
 * Decorative — hidden from assistive technologies via `aria-hidden`.
 *
 * @returns {JSX.Element}
 */
export function GrowthTreeIllustration() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="80"
      height="80"
      className="empty-state__svg"
      aria-hidden="true"
      style={{ margin: '0 auto var(--space-4) auto' }}
    >
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
}
