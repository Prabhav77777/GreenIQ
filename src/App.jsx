import React, { useState, useCallback } from 'react';
import { useLocalStorage, useFootprintHistory, useTheme } from './hooks/useAppState.js';
import { Nav } from './components/Nav.jsx';
import { Landing } from './pages/Landing.jsx';
import { Calculator } from './pages/Calculator.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tracking } from './pages/Tracking.jsx';
import { Tips } from './pages/Tips.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

/**
 * App component - main entry point and page orchestrator.
 * Renders Nav and switches between Landing, Calculator, Dashboard, Tracking, and Tips.
 *
 * @returns {JSX.Element}
 */
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
