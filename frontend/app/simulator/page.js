'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const MODELS = [
  { value: 'MM1', label: 'M/M/1' },
  { value: 'MG1', label: 'M/G/1 ' },
];

export default function SimulatorPage() {
  const router = useRouter();

  const [model, setModel] = useState('MM1');
  const [interArrival, setInterArrival] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [serviceDist, setServiceDist] = useState('Uniform');
  const [uniMin, setUniMin] = useState('');
  const [uniMax, setUniMax] = useState('');
  const [normalMean, setNormalMean] = useState('');
  const [normalVariance, setNormalVariance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isG = model === 'MG1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // SimulatorController's SimulationRequest fields are all typed as
      // `string` and parsed server-side with double.TryParse, so every
      // value below is sent as a raw string (NOT a JS number) — sending
      // a JSON number for a `string` property would fail to deserialize.
      const payload = {
        model: isG ? 'M/G/1' : 'M/M/1', // must match req.Model checks exactly
        arrival: interArrival,
        service: isG ? '' : serviceTime,
        distribution: isG ? serviceDist : '',
        serviceMin: isG && serviceDist === 'Uniform' ? uniMin : '',
        serviceMax: isG && serviceDist === 'Uniform' ? uniMax : '',
        serviceMean: isG && serviceDist === 'Normal' ? normalMean : '',
        serviceVariance: isG && serviceDist === 'Normal' ? normalVariance : '',
        // No customer count is sent — SimulatorController derives the
        // number of trace-table rows itself from the Poisson lookup table.
      };

      // SimulatorController has [Route("api/[controller]")] on
      // "SimulatorController", so the route is /api/Simulator/run.
      const res = await fetch(`${API_BASE}/api/Simulator/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Simulation failed');
      }

      // The backend currently returns a bare array of trace-table rows
      // (SNo, CumulativeProb, NoOfMinK, ArrivalTime, ServiceTime, ...),
      // not an object with { rows, performance, numberOfServers, ... }.
      // The results page still expects the richer shape and will need to
      // be updated separately to consume this.
      const result = await res.json();
      sessionStorage.setItem('simulationResult', JSON.stringify(result));
      sessionStorage.setItem('simulationRequest', JSON.stringify(payload));
      router.push('/simulator/results');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setModel('MM1');
    setInterArrival('');
    setServiceTime('');
    setServiceDist('Uniform');
    setUniMin('');
    setUniMax('');
    setNormalMean('');
    setNormalVariance('');
    setError(null);
  };

  return (
    <div className='form-container'>
      <div className='form-header'>
        <h1 className='form-title'>🧪 Simulator</h1>
        <p className='form-subtitle'>
          Configure your queueing model parameters to run a discrete-event
          simulation
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── MODEL ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>📐</span>Simulation Model
          </h2>
          <div className='form-group'>
            <label className='form-label'>Select Model</label>
            <select
              className='form-select'
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='divider' />

        {/* ── ARRIVAL ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>📍</span>Arrival Parameters
          </h2>
          <div className='form-group'>
            <label className='form-label'>
              Arrival Rate λ (customers per minute)
            </label>
            <input
              type='number'
              min='0.01'
              step='any'
              required
              className='form-input'
              placeholder='e.g. 2.65'
              value={interArrival}
              onChange={(e) => setInterArrival(e.target.value)}
            />
          </div>
        </div>

        <div className='divider' />

        {/* ── SERVICE ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>🏥</span>Service Parameters
          </h2>

          {/* Exponential — M/M models */}
          {!isG && (
            <div className='form-group'>
              <label className='form-label'>
                Service Rate μ (customers per minute)
              </label>
              <input
                type='number'
                min='0.01'
                step='any'
                required
                className='form-input'
                placeholder='e.g. 7.45'
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
              />
            </div>
          )}

          {/* General — M/G models */}
          {isG && (
            <>
              <div className='form-group'>
                <label className='form-label'>Service Distribution</label>
                <select
                  className='form-select'
                  value={serviceDist}
                  onChange={(e) => setServiceDist(e.target.value)}
                >
                  <option value='Uniform'>Uniform</option>
                  <option value='Normal'>Normal</option>
                </select>
              </div>

              {serviceDist === 'Uniform' && (
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>Minimum a (minutes)</label>
                    <input
                      type='number'
                      min='0'
                      step='any'
                      required
                      className='form-input'
                      placeholder='e.g. 1'
                      value={uniMin}
                      onChange={(e) => setUniMin(e.target.value)}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Maximum b (minutes)</label>
                    <input
                      type='number'
                      min='0'
                      step='any'
                      required
                      className='form-input'
                      placeholder='e.g. 10'
                      value={uniMax}
                      onChange={(e) => setUniMax(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {serviceDist === 'Normal' && (
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>
                      Mean Service Time (minutes)
                    </label>
                    <input
                      type='number'
                      min='0.01'
                      step='any'
                      required
                      className='form-input'
                      placeholder='e.g. 5'
                      value={normalMean}
                      onChange={(e) => setNormalMean(e.target.value)}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Variance (min²)</label>
                    <input
                      type='number'
                      min='0.01'
                      step='any'
                      required
                      className='form-input'
                      placeholder='e.g. 2'
                      value={normalVariance}
                      onChange={(e) => setNormalVariance(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className='sim-inline-error'>
            <div className='error-alert' style={{ maxWidth: '100%' }}>
              <div className='error-icon'>⚠️</div>
              <div className='error-content'>
                <div className='error-title'>Simulation Error</div>
                <div className='error-message'>{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className='form-actions'>
          <button type='submit' className='btn-submit' disabled={loading}>
            {loading ? '⏳ Simulating...' : '🧪 Run Simulation'}
          </button>
          <button type='button' className='btn-reset' onClick={handleReset}>
            ↻ Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
