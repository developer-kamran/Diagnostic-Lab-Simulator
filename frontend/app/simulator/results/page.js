'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const GANTT_COLORS = [
  '#00d4ff',
  '#a855f7',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#84cc16',
];

export default function SimulatorResultsPage() {
  const [result, setResult] = useState(null);
  const [request, setRequest] = useState(null);
  const ganttRef = useRef(null);

  useEffect(() => {
    const r = sessionStorage.getItem('simulationResult');
    const q = sessionStorage.getItem('simulationRequest');
    if (r) setResult(JSON.parse(r));
    if (q) setRequest(JSON.parse(q));
  }, []);

  useEffect(() => {
    if (!result || !ganttRef.current) return;
    const canvas = ganttRef.current;
    const ctx = canvas.getContext('2d');
    const rows = result.rows;
    const maxTime = Math.max(...rows.map((r) => r.endTime)) + 2;

    // Layout: extra room above the bar (tick numbers + start–end label)
    // and below the bar (service-time label).
    const ROW_H = 34; // height of the actual bar row
    const TOP_GAP = 44; // space above the bar row for ticks + start-end label
    const BOTTOM_GAP = 26; // space below the bar row for the service-time label
    const PAD_L = 60;
    const PAD_T = TOP_GAP;
    const PAD_B = 16;
    const W = canvas.width - PAD_L - 16;
    const H = ROW_H + BOTTOM_GAP;

    canvas.height = PAD_T + H + PAD_B;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = W / maxTime;
    const tickCount = Math.min(10, maxTime);
    const tickStep = Math.max(1, Math.ceil(maxTime / tickCount));

    // grid + time-axis labels (drawn near the very top, out of the way of
    // the per-customer start/end labels that sit just above each bar)
    ctx.strokeStyle = '#1e2a3a';
    ctx.fillStyle = '#4b5563';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let t = 0; t <= maxTime; t += tickStep) {
      const x = PAD_L + t * scaleX;
      ctx.beginPath();
      ctx.moveTo(x, PAD_T);
      ctx.lineTo(x, PAD_T + ROW_H);
      ctx.stroke();
      ctx.fillText(t, x, 14);
    }

    // server row label + background stripe
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(PAD_L, PAD_T, W, ROW_H);
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Server', PAD_L - 6, PAD_T + ROW_H / 2 + 4);

    // customer bars — width is driven by the actual start/end times
    // reported by the simulation, not by serviceTime alone, so the bar
    // always lines up with when the server was really busy.
    rows.forEach((row) => {
      const start = row.startTime;
      const end = row.endTime;
      const x = PAD_L + start * scaleX;
      const w = Math.max(1, (end - start) * scaleX);
      const y = PAD_T + 3;
      const barH = ROW_H - 6;
      const col = GANTT_COLORS[0];
      const cx = x + w / 2;

      // bar
      ctx.fillStyle = col + '2a';
      ctx.fillRect(x, y, w, barH);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, barH);

      // customer number inside the bar, if there's room
      ctx.textAlign = 'center';
      if (w > 16) {
        ctx.fillStyle = col;
        ctx.font = '9px monospace';
        ctx.fillText(`C${row.customerNo}`, cx, y + barH / 2 + 3);
      }

      // start–end time, just above the bar
      ctx.fillStyle = '#d1d5db';
      ctx.font = '9px monospace';
      ctx.fillText(`${f2(start)}–${f2(end)}`, cx, PAD_T - 6);

      // service time the server spent on this customer, just below the bar
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.fillText(`ST: ${f2(row.serviceTime)}`, cx, PAD_T + ROW_H + 14);
    });
  }, [result]);

  const f2 = (v) => (v == null ? '—' : Number(v).toFixed(2));
  const f4 = (v) => (v == null ? '—' : Number(v).toFixed(6));

  if (!result) {
    return (
      <div className='error-container'>
        <div className='error-alert' style={{ maxWidth: '100%' }}>
          <div className='error-icon'>⚠️</div>
          <div className='error-content'>
            <div className='error-title'>No Simulation Data</div>
            <div className='error-message'>Please run a simulation first.</div>
            <div className='error-actions'>
              <Link href='/simulator' className='error-btn primary'>
                🧪 Run Simulation
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SimulatorController's SimulationResponse is { modelType, rows, performance }
  // — there's no numberOfServers field since this is single-server only.
  const { rows, performance: perf, modelType } = result;

  const perfCards = [
    {
      label: 'Avg Inter-Arrival Time',
      value: f2(perf.avgInterArrivalTime) + ' min',
      color: 'var(--accent)',
      icon: '🔄',
    },
    {
      label: 'Avg Service Time',
      value: f2(perf.avgServiceTime) + ' min',
      color: '#10b981',
      icon: '⏱️',
    },
    {
      label: 'Avg Wait Time',
      value: f2(perf.avgWaitTime) + ' min',
      color: '#f59e0b',
      icon: '⏳',
    },
    {
      label: 'Avg Response Time',
      value: f2(perf.avgResponseTime) + ' min',
      color: '#a855f7',
      icon: '🕒',
    },
    {
      label: 'Avg Turnaround Time',
      value: f2(perf.avgTurnaroundTime) + ' min',
      color: '#ec4899',
      icon: '📉',
    },
    {
      label: 'Avg Queue Length (Lq)',
      value: f2(perf.avgQueueLength),
      color: '#ef4444',
      icon: '👥',
    },
    {
      label: 'Avg Number in System (L)',
      value: f2(perf.avgNumberInSystem),
      color: '#3b82f6',
      icon: '🏢',
    },
    {
      label: 'Overall Server Utilization',
      value: f2(perf.overallUtilization) + ' %',
      color: '#8b5cf6',
      icon: '📊',
    },
  ];

  return (
    <div className='sim-results-page'>
      {/* Header */}
      <div className='results-header'>
        <h1 className='results-title'>🧪 Simulation Results</h1>
        <p className='results-subtitle'>
          {modelType} Model — 1 Server — {rows.length} Customers
        </p>
      </div>

      {/* Table */}
      <div className='sim-section'>
        <h2 className='sim-section-title'>📋 Simulation Trace Table</h2>
        <div className='sim-table-wrap'>
          <table className='sim-table'>
            <thead>
              <tr>
                <th className='sim-th'>C#</th>
                <th className='sim-th'>Lookup Cum. Prob.</th>
                <th className='sim-th'>Cum. Prob.</th>
                <th className='sim-th'>Inter-Arrival</th>
                <th className='sim-th sim-th-arrival'>Arrival Time</th>
                <th className='sim-th sim-th-service'>Service Time</th>
                <th className='sim-th'>Start Time</th>
                <th className='sim-th'>End Time</th>
                <th className='sim-th'>Turnaround</th>
                <th className='sim-th'>Wait Time</th>
                <th className='sim-th'>Response</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'sim-tr-even' : 'sim-tr-odd'}
                >
                  <td className='sim-td sim-td-no'>{row.customerNo}</td>
                  <td className='sim-td'>{f4(row.lookupCumProbability)}</td>
                  <td className='sim-td'>{f4(row.cumProbability)}</td>
                  <td className='sim-td'>{row.interArrival}</td>
                  <td className='sim-td sim-td-arrival'>{row.arrivalTime}</td>
                  <td className='sim-td sim-td-service'>{row.serviceTime}</td>
                  <td className='sim-td'>{f2(row.startTime)}</td>
                  <td className='sim-td'>{f2(row.endTime)}</td>
                  <td className='sim-td'>{f2(row.turnaroundTime)}</td>
                  <td className='sim-td'>{f2(row.waitTime)}</td>
                  <td className='sim-td'>{f2(row.responseTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className='sim-section'>
        <h2 className='sim-section-title'>
          📊 Gantt Chart
          <span className='sim-gantt-subtitle'> — Customer Timeline</span>
        </h2>
        <div className='sim-gantt-wrap'>
          <canvas ref={ganttRef} width={860} className='sim-gantt-canvas' />
          <div className='sim-gantt-legend'>
            <div className='sim-legend-item'>
              <div
                className='sim-legend-dot'
                style={{ background: GANTT_COLORS[0] }}
              />
              <span className='sim-legend-label'>Server</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Measures */}
      <div className='sim-section'>
        <h2 className='sim-section-title'>📈 Performance Measures</h2>
        <div className='sim-perf-grid'>
          {perfCards.map((card, i) => (
            <div
              key={i}
              className='sim-perf-card'
              style={{ borderColor: card.color + '44' }}
            >
              <div className='sim-perf-card-header'>
                <span className='sim-perf-label'>{card.label}</span>
                <span className='sim-perf-icon'>{card.icon}</span>
              </div>
              <div className='sim-perf-value' style={{ color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className='action-buttons'>
        <Link href='/simulator' className='btn-custom primary'>
          🔄 New Simulation
        </Link>
        <Link href='/' className='btn-custom'>
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
