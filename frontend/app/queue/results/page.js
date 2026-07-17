'use client';
import { useState } from 'react';
import { runSimulation } from '@/lib/api';

export default function Simulator() {
  const [form, setForm] = useState({
    model: 'M/M/1',
    arrival: '',
    service: '',
    distribution: 'Uniform',
    serviceMin: '',
    serviceMax: '',
    serviceMean: '',
    serviceVariance: '',
  });
  const [data, setData] = useState([]);
  const [poissonData, setPoissonData] = useState([]);
  const [error, setError] = useState('');

  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const calculatePoisson = (k, lambda) =>
    (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);

  const runSim = async () => {
    setError('');
    if (!form.arrival) {
      alert('Please fill in arrival rate (λ)');
      return;
    }

    // Generate Poisson CDF Lookup Table for display
    const lambda = parseFloat(form.arrival);
    const lookup = [];
    let cumulative = 0;
    let kCount = 0;
    // Show up to 15 rows or until 0.99999 in the UI table
    while (cumulative < 0.99999 && kCount < 15) {
      const p = calculatePoisson(kCount, lambda);
      const lookupValue = cumulative;
      cumulative += p;
      lookup.push({
        k: kCount,
        px: p.toFixed(5),
        cum: cumulative.toFixed(5),
        lookup: lookupValue.toFixed(5),
      });
      kCount++;
    }
    setPoissonData(lookup);

    try {
      const result = await runSimulation(form);
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  };

  // Calculations for Performance measures
  const totalSimTime = data.length > 0 ? data[data.length - 1].endTime : 0;
  const avgWait =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.waitTime, 0) / data.length
        ).toFixed(4)
      : 0;
  const avgService =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.serviceTime, 0) / data.length
        ).toFixed(4)
      : 0;
  const utilization =
    data.length > 0 && totalSimTime > 0
      ? (
          (data.reduce((acc, curr) => acc + curr.serviceTime, 0) /
            totalSimTime) *
          100
        ).toFixed(2)
      : 0;

  const PerformanceCard = ({ title, value, subtext, color, icon }) => (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '24px',
        padding: '25px',
        border: `1px solid ${color}33`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <span
          style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}
        >
          {title}
        </span>
        <span style={{ fontSize: '20px', color: color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{subtext}</div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: '#020617',
        minHeight: '100vh',
        padding: '40px',
        color: '#cbd5e1',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#0b1120',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #1e293b',
          maxWidth: '850px',
          margin: '0 auto 40px',
        }}
      >
        <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '30px' }}>
          🧪 Sequential K Simulator
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px',
          }}
        >
          <div>
            <label style={{ fontSize: '12px', color: '#64748b' }}>
              QUEUEING MODEL
            </label>
            <select
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
              }}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            >
              <option value='M/M/1'>M/M/1 (Exponential Service)</option>
              <option value='M/G/1'>M/G/1 (General Service)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#64748b' }}>
              ARRIVAL RATE (λ)
            </label>
            <input
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
              }}
              value={form.arrival}
              onChange={(e) => setForm({ ...form, arrival: e.target.value })}
              placeholder='e.g. 2.5'
            />
          </div>

          {form.model === 'M/M/1' ? (
            <div>
              <label style={{ fontSize: '12px', color: '#64748b' }}>
                SERVICE RATE (μ)
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: 'white',
                }}
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder='e.g. 8.0'
              />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>
                  DISTRIBUTION
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                  }}
                  value={form.distribution}
                  onChange={(e) =>
                    setForm({ ...form, distribution: e.target.value })
                  }
                >
                  <option value='Uniform'>Uniform</option>
                  <option value='Normal'>Normal</option>
                </select>
              </div>
              {form.distribution === 'Uniform' ? (
                <>
                  <input
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                    placeholder='Min (a)'
                    value={form.serviceMin}
                    onChange={(e) =>
                      setForm({ ...form, serviceMin: e.target.value })
                    }
                  />
                  <input
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                    placeholder='Max (b)'
                    value={form.serviceMax}
                    onChange={(e) =>
                      setForm({ ...form, serviceMax: e.target.value })
                    }
                  />
                </>
              ) : (
                <>
                  <input
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                    placeholder='Mean (μ)'
                    value={form.serviceMean}
                    onChange={(e) =>
                      setForm({ ...form, serviceMean: e.target.value })
                    }
                  />
                  <input
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: 'white',
                    }}
                    placeholder='Variance (σ²)'
                    value={form.serviceVariance}
                    onChange={(e) =>
                      setForm({ ...form, serviceVariance: e.target.value })
                    }
                  />
                </>
              )}
            </>
          )}
        </div>

        <button
          onClick={runSim}
          style={{
            width: '100%',
            marginTop: '35px',
            padding: '18px',
            borderRadius: '15px',
            backgroundColor: '#0d9488',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ▶ GENERATE SIMULATION (UNTIL P ≥ 0.99999)
        </button>
      </div>

      {data.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              backgroundColor: '#0b1120',
              borderRadius: '24px',
              padding: '35px',
              border: '1px solid #1e293b',
              marginBottom: '40px',
            }}
          >
            <h2
              style={{ color: 'white', fontSize: '22px', marginBottom: '25px' }}
            >
              📋 Simulation Trace Table (Sequential K)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #1e293b',
                      textAlign: 'left',
                      color: '#94a3b8',
                    }}
                  >
                    <th style={{ padding: '15px' }}>S.No</th>
                    <th style={{ padding: '15px' }}>K (Inter-Arrival)</th>
                    <th style={{ padding: '15px' }}>P(X ≤ K)</th>
                    <th style={{ padding: '15px' }}>Arrival Time</th>
                    <th style={{ padding: '15px' }}>Service Time</th>
                    <th style={{ padding: '15px' }}>Start Time</th>
                    <th style={{ padding: '15px' }}>End Time</th>
                    <th style={{ padding: '15px' }}>Wait Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.sNo}
                      style={{ borderBottom: '1px solid #1e293b' }}
                    >
                      <td style={{ padding: '15px', color: '#2dd4bf' }}>
                        {r.sNo}
                      </td>
                      <td
                        style={{
                          padding: '15px',
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        {r.noOfMinK}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {r.cumulativeProb.toFixed(5)}
                      </td>
                      <td style={{ padding: '15px' }}>{r.arrivalTime}</td>
                      <td style={{ padding: '15px', color: '#a855f7' }}>
                        {r.serviceTime}
                      </td>
                      <td style={{ padding: '15px' }}>{r.startTime}</td>
                      <td style={{ padding: '15px' }}>{r.endTime}</td>
                      <td style={{ padding: '15px', color: '#f43f5e' }}>
                        {r.waitTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            <PerformanceCard
              title='Avg Wait Time'
              value={`${avgWait} min`}
              subtext='Average queue delay'
              color='#ec4899'
              icon='⏳'
            />
            <PerformanceCard
              title='Server Utilization'
              value={`${utilization}%`}
              subtext='Percentage busy'
              color='#8b5cf6'
              icon='📊'
            />
            <PerformanceCard
              title='Total Customers'
              value={data.length}
              subtext='Until 5-nines probability'
              color='#2dd4bf'
              icon='👥'
            />
          </div>
        </div>
      )}
    </div>
  );
}
