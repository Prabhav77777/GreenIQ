import React, { useState } from 'react';

/** @type {Array<{ id: string, label: string, icon: string }>} */
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'calculator', label: 'Calculate', icon: '🧮' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'tracking', label: 'Track', icon: '📈' },
  { id: 'tips', label: 'Tips', icon: '💡' }
];

/**
 * Top navigation bar with responsive mobile menu and dark/light theme toggle.
 *
 * @param {object}   props
 * @param {string}   props.currentPage  - Active page identifier
 * @param {Function} props.setPage      - Page change callback
 * @param {string}   props.theme        - Current theme: 'light' | 'dark'
 * @param {Function} props.toggleTheme  - Theme toggle callback
 * @returns {JSX.Element}
 */
export function Nav({ currentPage, setPage, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        {NAV_ITEMS.map(item => (
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
