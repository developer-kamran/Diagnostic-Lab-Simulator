'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GENERAL_DISTS,
  MODEL_LABELS,
  MODEL_DESCRIPTIONS,
} from '@/lib/constants';
import { calculateQueue } from '@/lib/api';

export default function QueueForm({ modelType }) {
  const router = useRouter();

  const isMM1 = modelType === 'MM1';
  const isMG1 = modelType === 'MG1';
  const isGG1 = modelType === 'GG1';

  // ── State ──────────────────────────────────────────────────────────────────
  const [arrivalDist, setArrivalDist] = useState('Uniform');
  const [serviceDist, setServiceDist] = useState('Uniform');

  const [arrivalMean, setArrivalMean] = useState('');
  const [arrivalVariance, setArrivalVariance] = useState('');
  const [arrivalMin, setArrivalMin] = useState('');
  const [arrivalMax, setArrivalMax] = useState('');

  const [serviceMean, setServiceMean] = useState('');
  const [serviceVariance, setServiceVariance] = useState('');
  const [serviceMin, setServiceMin] = useState('');
  const [serviceMax, setServiceMax] = useState('');

  const [servers, setServers] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Build payload ──────────────────────────────────────────────────────────
  const num = (v) => (v === '' ? undefined : parseFloat(v));

  const buildPayload = () => {
    const resolvedArrivalDist = isMM1 || isMG1 ? 'Exponential' : arrivalDist;
    const resolvedServiceDist = isMM1 ? 'Exponential' : serviceDist;

    return {
      modelType: modelType,
      arrivalDistribution: resolvedArrivalDist,
      arrivalMean:
        resolvedArrivalDist !== 'Uniform' ? num(arrivalMean) : undefined,
      arrivalVariance:
        resolvedArrivalDist === 'Normal' || resolvedArrivalDist === 'Gamma'
          ? num(arrivalVariance)
          : undefined,
      arrivalMin:
        resolvedArrivalDist === 'Uniform' ? num(arrivalMin) : undefined,
      arrivalMax:
        resolvedArrivalDist === 'Uniform' ? num(arrivalMax) : undefined,

      serviceDistribution: resolvedServiceDist,
      serviceMean:
        resolvedServiceDist !== 'Uniform' ? num(serviceMean) : undefined,
      serviceVariance:
        resolvedServiceDist === 'Normal' || resolvedServiceDist === 'Gamma'
          ? num(serviceVariance)
          : undefined,
      serviceMin:
        resolvedServiceDist === 'Uniform' ? num(serviceMin) : undefined,
      serviceMax:
        resolvedServiceDist === 'Uniform' ? num(serviceMax) : undefined,

      numberOfServers: parseInt(servers) || 1,
      simulationDuration: 120,
    };
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await calculateQueue(buildPayload());

      // If unstable, show error inline — do NOT navigate away
      if (!result.isStable) {
        setError(
          result.stabilityMessage ||
            `System is unstable (ρ = ${result.rho?.toFixed(4)} ≥ 1). Reduce arrival rate or add more servers.`,
        );
        return;
      }

      sessionStorage.setItem('queueResult', JSON.stringify(result));
      sessionStorage.setItem('queueModelType', modelType);
      router.push('/queue/results');
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please check your inputs.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setArrivalMean('');
    setArrivalVariance('');
    setArrivalMin('');
    setArrivalMax('');
    setServiceMean('');
    setServiceVariance('');
    setServiceMin('');
    setServiceMax('');
    setServers('1');
    setError(null);
    setArrivalDist('Uniform');
    setServiceDist('Uniform');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className='form-container'>
      {/* Header */}
      <div className='form-header'>
        <h1 className='form-title'>⚗️ Queue Model Simulator</h1>
        <p className='form-subtitle'>
          {MODEL_LABELS[modelType]} — {MODEL_DESCRIPTIONS[modelType]}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── ARRIVAL DISTRIBUTION ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>📍</span>
            Arrival Distribution
          </h2>

          {/* M/M/1 and M/G/1 — Exponential, just mean */}
          {(isMM1 || isMG1) && (
            <div className='form-group'>
              <label className='form-label'>
                Mean Interarrival Time (minutes)
              </label>
              <input
                type='number'
                className='form-input'
                min='0.01'
                step='any'
                placeholder='Enter mean interarrival time'
                value={arrivalMean}
                onChange={(e) => setArrivalMean(e.target.value)}
                required
              />
            </div>
          )}

          {/* G/G/1 — general distribution */}
          {isGG1 && (
            <>
              <div className='form-group'>
                <label className='form-label'>Distribution Type</label>
                <select
                  className='form-select'
                  value={arrivalDist}
                  onChange={(e) => setArrivalDist(e.target.value)}
                >
                  {GENERAL_DISTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Uniform inputs */}
              <div
                className={
                  arrivalDist === 'Uniform'
                    ? 'toggle-section'
                    : 'hidden-section'
                }
              >
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>Minimum (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0'
                      step='any'
                      placeholder='Enter minimum value'
                      value={arrivalMin}
                      onChange={(e) => setArrivalMin(e.target.value)}
                      required={arrivalDist === 'Uniform'}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Maximum (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0'
                      step='any'
                      placeholder='Enter maximum value'
                      value={arrivalMax}
                      onChange={(e) => setArrivalMax(e.target.value)}
                      required={arrivalDist === 'Uniform'}
                    />
                  </div>
                </div>
              </div>

              {/* Normal / Gamma inputs */}
              <div
                className={
                  arrivalDist !== 'Uniform'
                    ? 'toggle-section'
                    : 'hidden-section'
                }
              >
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>Mean (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0.01'
                      step='any'
                      placeholder='Enter mean'
                      value={arrivalMean}
                      onChange={(e) => setArrivalMean(e.target.value)}
                      required={arrivalDist !== 'Uniform'}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Variance (min²)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0.01'
                      step='any'
                      placeholder='Enter variance'
                      value={arrivalVariance}
                      onChange={(e) => setArrivalVariance(e.target.value)}
                      required={arrivalDist !== 'Uniform'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className='divider'></div>

        {/* ── FRONT DESK SERVICE ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>🏥</span>
            Front Desk Service
          </h2>

          {/* M/M/1 — Exponential, just mean */}
          {isMM1 && (
            <div className='form-group'>
              <label className='form-label'>Mean Service Time (minutes)</label>
              <input
                type='number'
                min='0.01'
                step='any'
                className='form-input'
                placeholder='Enter mean service time'
                value={serviceMean}
                onChange={(e) => setServiceMean(e.target.value)}
                required
              />
            </div>
          )}

          {/* M/G/1 and G/G/1 — general distribution */}
          {(isMG1 || isGG1) && (
            <>
              <div className='form-group'>
                <label className='form-label'>Distribution Type</label>
                <select
                  className='form-select'
                  value={serviceDist}
                  onChange={(e) => setServiceDist(e.target.value)}
                >
                  {GENERAL_DISTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Uniform inputs */}
              <div
                className={
                  serviceDist === 'Uniform'
                    ? 'toggle-section'
                    : 'hidden-section'
                }
              >
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>Minimum (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0'
                      step='any'
                      placeholder='Enter minimum value'
                      value={serviceMin}
                      onChange={(e) => setServiceMin(e.target.value)}
                      required={serviceDist === 'Uniform'}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Maximum (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0'
                      step='any'
                      placeholder='Enter maximum value'
                      value={serviceMax}
                      onChange={(e) => setServiceMax(e.target.value)}
                      required={serviceDist === 'Uniform'}
                    />
                  </div>
                </div>
              </div>

              {/* Normal / Gamma inputs */}
              <div
                className={
                  serviceDist !== 'Uniform'
                    ? 'toggle-section'
                    : 'hidden-section'
                }
              >
                <div className='form-row'>
                  <div className='form-group'>
                    <label className='form-label'>Mean (minutes)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0.01'
                      step='any'
                      placeholder='Enter mean'
                      value={serviceMean}
                      onChange={(e) => setServiceMean(e.target.value)}
                      required={serviceDist !== 'Uniform'}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Variance (min²)</label>
                    <input
                      type='number'
                      className='form-input'
                      min='0.01'
                      step='any'
                      placeholder='Enter variance'
                      value={serviceVariance}
                      onChange={(e) => setServiceVariance(e.target.value)}
                      required={serviceDist !== 'Uniform'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className='divider'></div>

        {/* ── NUMBER OF SERVERS ── */}
        <div className='form-section'>
          <h2 className='section-title'>
            <span className='section-icon'>👥</span>
            Server Configuration
          </h2>
          <div className='form-group'>
            <label className='form-label'>Number of Servers (c)</label>
            <input
              type='number'
              min='1'
              step='1'
              className='form-input'
              placeholder='1'
              value={servers}
              onChange={(e) => setServers(e.target.value)}
              required
            />
            {!isMM1 && parseInt(servers) > 1 && (
              <span className='validation-error' style={{ color: '#f59e0b' }}>
                ⚠ Approximation formula used for c &gt; 1 on{' '}
                {MODEL_LABELS[modelType]}
              </span>
            )}
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div
            className='error-container'
            style={{ minHeight: 'auto', padding: '0', marginBottom: '1.5rem' }}
          >
            <div className='error-alert' style={{ maxWidth: '100%' }}>
              <div className='error-icon'>⚠️</div>
              <div className='error-content'>
                <div className='error-title'>System Error</div>
                <div className='error-message'>{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className='form-actions'>
          <button type='submit' className='btn-submit' disabled={loading}>
            {loading ? '⏳ Calculating...' : '🚀 Calculate Results'}
          </button>
          <button type='button' className='btn-reset' onClick={handleReset}>
            ↻ Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
