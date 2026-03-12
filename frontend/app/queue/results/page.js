'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MODEL_LABELS } from '@/lib/constants';

// Helper function to format time values (alternative version)
function formatTime(minutes) {
  if (minutes == null) return '—';

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // If remaining minutes has a fractional part
    if (Math.abs(remainingMinutes - Math.round(remainingMinutes)) < 0.01) {
      // It's essentially a whole number
      const roundedMinutes = Math.round(remainingMinutes);
      if (roundedMinutes === 0) {
        return `${hours} hours`;
      } else {
        return `${hours} hours ${roundedMinutes} min`;
      }
    } else {
      // Show fractional minutes with 1 decimal
      return `${hours} hours ${remainingMinutes.toFixed(1)} min`;
    }
  }
  // Show 2 decimal places for minutes under 60
  return `${minutes.toFixed(2)} min`;
}

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const [modelType, setModelType] = useState('MM1');

  useEffect(() => {
    try {
      const r = sessionStorage.getItem('queueResult');
      const m = sessionStorage.getItem('queueModelType');
      if (r) setResult(JSON.parse(r));
      if (m) setModelType(m);
    } catch {
      /* ignore */
    }
  }, []);

  const modelPath = (modelType || 'MM1').toLowerCase();

  // ── No result ──────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className='error-container'>
        <div className='error-alert'>
          <div className='error-icon'>⚠️</div>
          <div className='error-content'>
            <div className='error-title'>System Error</div>
            <div className='error-message'>
              No simulation results found. Please run a calculation first.
            </div>
            <div className='error-actions'>
              <Link href='/' className='error-btn'>
                🏠 Back to Home
              </Link>
              <Link href='/queue/mm1' className='error-btn primary'>
                🔄 Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Format helpers ─────────────────────────────────────────────────────────
  const f2 = (v) => (v != null ? v.toFixed(2) : '—');
  const f4 = (v) => (v != null ? v.toFixed(4) : '—');
  const fPct = (v) => (v != null ? `${(v * 100).toFixed(2)}%` : '—');

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <div className='results-container'>
      {/* Header */}
      <div className='results-header'>
        <h1 className='results-title'>📊 Simulation Results</h1>
        <p className='results-subtitle'>
          {MODEL_LABELS[result.modelType] || result.modelType} Queue
          {' · '}
          {result.numberOfServers} Server{result.numberOfServers > 1 ? 's' : ''}
          {result.numberOfServers > 1 && result.modelType !== 'MM1' && (
            <span
              style={{
                color: '#f59e0b',
                fontSize: '0.85rem',
                marginLeft: '0.5rem',
              }}
            >
              (approximation)
            </span>
          )}
        </p>
      </div>

      {/* Front Desk Metric Card — single card, full width */}
      <div className='metrics-grid' style={{ gridTemplateColumns: '1fr' }}>
        <div className='metric-card'>
          <div className='metric-icon'>🏥</div>
          <div className='metric-title'>Front Desk Metrics</div>
          <table className='metrics-table'>
            <tbody>
              <tr>
                <th>Wq (Avg Wait in Queue)</th>
                <td>{formatTime(result.wq)}</td>
              </tr>
              <tr>
                <th>W (Avg Total Time)</th>
                <td>{formatTime(result.w)}</td>
              </tr>
              <tr>
                <th>Lq (Avg Queue Length)</th>
                <td>{f4(result.lq)}</td>
              </tr>
              <tr>
                <th>L (Avg Total Customers)</th>
                <td>{f4(result.l)}</td>
              </tr>
              <tr>
                <th>ρ (Utilization)</th>
                <td>{fPct(result.rho)}</td>
              </tr>
              <tr>
                <th>Idle Time (Server)</th>
                <td>{fPct(result.idleTime)}</td>
              </tr>
              <tr>
                <th>λ (Arrival Rate)</th>
                <td>{f4(result.lambda)} pat/min</td>
              </tr>
              <tr>
                <th>μ (Service Rate)</th>
                <td>{f4(result.mu)} pat/min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Throughput */}
      <div className='throughput-section'>
        <div className='throughput-icon'>⚡</div>
        <div className='throughput-label'>Lab Throughput</div>
        <div className='throughput-value'>{f2(result.throughput)}</div>
        <div className='throughput-unit'>Expected Patients in 2 Hours</div>
      </div>

      {/* Action Buttons */}
      <div className='action-buttons'>
        <Link href='/' className='btn-custom'>
          🏠 Back to Home
        </Link>
        <Link href={`/queue/${modelPath}`} className='btn-custom primary'>
          🔄 New Simulation
        </Link>
      </div>
    </div>
  );
}
