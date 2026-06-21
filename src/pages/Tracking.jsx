import React from 'react';
import { Line } from 'react-chartjs-2';
import { formatDate, formatCO2, formatChange } from '../utils/formatters.js';
import { GrowthTreeIllustration } from '../components/Icons.jsx';

/**
 * Tracking page — the "Track" pillar.
 * Displays a trend line chart and history table for all saved footprint entries.
 *
 * @param {object}   props
 * @param {Array}    props.entries - All historical footprint entry objects
 * @param {number}   props.streak  - Number of calculation entries in the current month
 * @param {Function} props.setPage - Navigation callback
 * @returns {JSX.Element}
 */
export function Tracking({ entries, streak, setPage }) {
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
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
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
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card__header">
          <h2 className="card__title">Footprint Trend</h2>
        </div>
        <div style={{ height: '300px' }} role="img" aria-label="Line chart showing carbon footprint trend over time">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>

      {/* History table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Entry History</h2>
          <span className="badge badge--info">{entries.length} entries</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
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
