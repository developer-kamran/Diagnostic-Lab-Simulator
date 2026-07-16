'use client';
import { useState } from 'react';
import { runSimulation } from '@/lib/api';

export default function Simulator() {
  const [form, setForm] = useState({
    model: 'M/M/1',
    arrival: '',
    service: '', // μ - only used for M/M/1
    customers: '',
    distribution: 'Uniform', // 'Uniform' or 'Normal' - only used for M/G/1
    serviceMin: '', // 'a' parameter for M/G/1 Uniform
    serviceMax: '', // 'b' parameter for M/G/1 Uniform
    serviceMean: '', // 'μ' parameter for M/G/1 Normal
    serviceVariance: '', // 'σ²' parameter for M/G/1 Normal
  });
  const [data, setData] = useState([]);
  const [poissonData, setPoissonData] = useState([]);
  const [error, setError] = useState('');

  // Mathematical helper for Poisson
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const calculatePoisson = (k, lambda) =>
    (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);

  const runSim = async () => {
    setError('');

    // Basic validation
    if (!form.arrival || !form.customers) {
      alert('Please fill in arrival rate and number of customers');
      return;
    }

    // Model-specific validation
    if (form.model === 'M/M/1') {
      if (!form.service) {
        alert('Please enter service rate (μ) for M/M/1 model');
        return;
      }
      if (parseFloat(form.service) <= 0) {
        alert('Service rate (μ) must be greater than 0');
        return;
      }
    } else if (form.model === 'M/G/1') {
      if (form.distribution === 'Uniform') {
        if (!form.serviceMin || !form.serviceMax) {
          alert(
            'Please enter both minimum (a) and maximum (b) service times for M/G/1',
          );
          return;
        }
        const min = parseFloat(form.serviceMin);
        const max = parseFloat(form.serviceMax);
        if (min >= max) {
          alert(
            'Minimum service time (a) must be less than maximum service time (b)',
          );
          return;
        }
        if (min < 0) {
          alert('Minimum service time cannot be negative');
          return;
        }
      } else if (form.distribution === 'Normal') {
        if (!form.serviceMean || !form.serviceVariance) {
          alert(
            'Please enter both mean (μ) and variance (σ²) for the Normal distribution',
          );
          return;
        }
        const mean = parseFloat(form.serviceMean);
        const variance = parseFloat(form.serviceVariance);
        if (mean <= 0) {
          alert('Service mean (μ) must be greater than 0');
          return;
        }
        if (variance <= 0) {
          alert('Service variance (σ²) must be greater than 0');
          return;
        }
      }
    }

    // Generate Poisson CDF Lookup Table Data
    const lambda = parseFloat(form.arrival);
    const lookup = [];
    let cumulative = 0;
    for (let k = 0; k <= 12; k++) {
      const p = calculatePoisson(k, lambda);
      const lookupValue = cumulative;
      cumulative += p;
      lookup.push({
        k,
        px: p.toFixed(5),
        cum: cumulative.toFixed(5),
        lookup: lookupValue.toFixed(5),
      });
    }
    setPoissonData(lookup);

    try {
      const result = await runSimulation(form);
      setData(result);
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please check your inputs.',
      );
    }
  };

  const totalSimTime = data.length > 0 ? data[data.length - 1].endTime : 0;
  const avgInterarrival =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.interArrival, 0) /
          (data.length - 1 || 1)
        ).toFixed(4)
      : 0;
  const avgService =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.serviceTime, 0) / data.length
        ).toFixed(4)
      : 0;
  const avgWait =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.waitTime, 0) / data.length
        ).toFixed(4)
      : 0;
  const avgTurnaround =
    data.length > 0
      ? (
          data.reduce((acc, curr) => acc + curr.turnaround, 0) / data.length
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
  const Lq =
    data.length > 0 && totalSimTime > 0
      ? (
          data.reduce((acc, curr) => acc + curr.waitTime, 0) / totalSimTime
        ).toFixed(4)
      : 0;
  const L =
    data.length > 0 && totalSimTime > 0
      ? (
          data.reduce((acc, curr) => acc + curr.turnaround, 0) / totalSimTime
        ).toFixed(4)
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
      <div
        style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: color,
          marginBottom: '5px',
        }}
      >
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
      {/* 1. INPUT FORM */}
      <div
        style={{
          backgroundColor: '#0b1120',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #1e293b',
          maxWidth: '850px',
          margin: '0 auto 40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: '28px',
            marginBottom: '30px',
            fontWeight: 'bold',
          }}
        >
          🧪 Simulation Setup
        </h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px',
          }}
        >
          <div>
            <label
              style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}
            >
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
                marginTop: '8px',
              }}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            >
              <option value='M/M/1'>M/M/1</option>
              <option value='M/G/1'>M/G/1</option>
            </select>
          </div>
          <div>
            <label
              style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}
            >
              INTER-ARRIVAL TIME (λ)
            </label>
            <input
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
                marginTop: '8px',
              }}
              placeholder='e.g. 2.65'
              value={form.arrival}
              onChange={(e) => setForm({ ...form, arrival: e.target.value })}
            />
          </div>

          {/* M/M/1 Specific Input - Only show when M/M/1 is selected */}
          {form.model === 'M/M/1' && (
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 'bold',
                }}
              >
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
                  marginTop: '8px',
                }}
                placeholder='e.g. 7.45'
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              />
              <div
                style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}
              >
                Service rate parameter (μ) for exponential distribution
              </div>
            </div>
          )}

          {/* M/G/1 Specific Inputs - Only show when M/G/1 is selected */}
          {form.model === 'M/G/1' && (
            <>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 'bold',
                  }}
                >
                  SERVICE TIME DISTRIBUTION
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    marginTop: '8px',
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

              {/* Placeholder cell to keep the 2-column grid aligned */}
              <div />

              {form.distribution === 'Uniform' ? (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 'bold',
                      }}
                    >
                      MIN SERVICE TIME (a)
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        marginTop: '8px',
                      }}
                      placeholder='e.g. 3.0'
                      value={form.serviceMin}
                      onChange={(e) =>
                        setForm({ ...form, serviceMin: e.target.value })
                      }
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '5px',
                      }}
                    >
                      Minimum service time parameter (a)
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 'bold',
                      }}
                    >
                      MAX SERVICE TIME (b)
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        marginTop: '8px',
                      }}
                      placeholder='e.g. 12.0'
                      value={form.serviceMax}
                      onChange={(e) =>
                        setForm({ ...form, serviceMax: e.target.value })
                      }
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '5px',
                      }}
                    >
                      Maximum service time parameter (b)
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 'bold',
                      }}
                    >
                      MEAN SERVICE TIME (μ)
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        marginTop: '8px',
                      }}
                      placeholder='e.g. 8.0'
                      value={form.serviceMean}
                      onChange={(e) =>
                        setForm({ ...form, serviceMean: e.target.value })
                      }
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '5px',
                      }}
                    >
                      Mean service time parameter (μ)
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 'bold',
                      }}
                    >
                      VARIANCE (σ²)
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        marginTop: '8px',
                      }}
                      placeholder='e.g. 2.5'
                      value={form.serviceVariance}
                      onChange={(e) =>
                        setForm({ ...form, serviceVariance: e.target.value })
                      }
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '5px',
                      }}
                    >
                      Variance parameter (σ²) — standard deviation is √(σ²)
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <label
            style={{
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 'bold',
            }}
          >
            NUMBER OF CUSTOMERS
          </label>
          <input
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: 'white',
              marginTop: '8px',
            }}
            placeholder='e.g. 10'
            value={form.customers}
            onChange={(e) => setForm({ ...form, customers: e.target.value })}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#7f1d1d',
              borderRadius: '12px',
              color: '#fca5a5',
              border: '1px solid #991b1b',
            }}
          >
            ❌ {error}
          </div>
        )}

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
          ▶ RUN SIMULATION
        </button>

        {/* Show model-specific formula hint */}
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#94a3b8',
          }}
        >
          {form.model === 'M/M/1' ? (
            <div>
              <strong>Formula:</strong> Service Time = -μ × ln(1 - R), where R
              is a random number between 0 and 1
            </div>
          ) : form.distribution === 'Uniform' ? (
            <div>
              <strong>Formula:</strong> Service Time = a + (b-a) × U, where U is
              a random number between 0 and 1
            </div>
          ) : (
            <div>
              <strong>Formula:</strong> Service Time = μ + Z × σ, where Z is a
              standard normal random variable (Box-Muller transform) and σ =
              √(σ²)
            </div>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* TRACE TABLE SECTION */}
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
              📋 Simulation Trace Table
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #1e293b',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '15px' }}>S.No</th>
                    <th style={{ padding: '15px' }}>Cumulative Prob</th>
                    <th style={{ padding: '15px' }}>Lookup</th>
                    <th style={{ padding: '15px' }}>Min (K)</th>
                    <th style={{ padding: '15px', color: 'white' }}>
                      Inter Arrival
                    </th>
                    <th style={{ padding: '15px' }}>Arrival Time</th>
                    <th style={{ padding: '15px', color: '#a855f7' }}>
                      Service Time
                    </th>
                    <th style={{ padding: '15px' }}>Start Time</th>
                    <th style={{ padding: '15px' }}>End Time</th>
                    <th style={{ padding: '15px' }}>Turnaround</th>
                    <th style={{ padding: '15px', color: '#f43f5e' }}>
                      Wait Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.sNo}
                      style={{ borderBottom: '1px solid #1e293b' }}
                    >
                      <td
                        style={{
                          padding: '15px',
                          color: '#2dd4bf',
                          fontWeight: 'bold',
                        }}
                      >
                        {r.sNo}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {r.cumulativeProb.toFixed(5)}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {r.cumProbLookup.toFixed(5)}
                      </td>
                      <td style={{ padding: '15px' }}>{r.noOfMinK}</td>
                      <td
                        style={{
                          padding: '15px',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {r.interArrival}
                      </td>
                      <td style={{ padding: '15px' }}>{r.arrivalTime}</td>
                      <td
                        style={{
                          padding: '15px',
                          color: '#a855f7',
                          fontWeight: 'bold',
                        }}
                      >
                        {r.serviceTime}
                      </td>
                      <td style={{ padding: '15px' }}>{r.startTime}</td>
                      <td
                        style={{
                          padding: '15px',
                          fontWeight: 'bold',
                          color: '#e2e8f0',
                        }}
                      >
                        {r.endTime}
                      </td>
                      <td style={{ padding: '15px' }}>{r.turnaround}</td>
                      <td
                        style={{
                          padding: '15px',
                          color: '#f43f5e',
                          fontWeight: 'bold',
                        }}
                      >
                        {r.waitTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GANTT CHART SECTION */}
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
              style={{ color: 'white', fontSize: '22px', marginBottom: '30px' }}
            >
              📊 Gantt Chart{' '}
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                — total simulation time: {totalSimTime} min
              </span>
            </h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {data.map((r, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
                >
                  <span
                    style={{
                      width: '40px',
                      fontSize: '14px',
                      color: '#94a3b8',
                      fontWeight: 'bold',
                    }}
                  >
                    C{r.sNo}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '24px',
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        height: '100%',
                        left: `${(r.startTime / totalSimTime) * 100}%`,
                        width: `${(r.serviceTime / totalSimTime) * 100}%`,
                        backgroundColor: [
                          '#2dd4bf',
                          '#a855f7',
                          '#6366f1',
                          '#f59e0b',
                          '#ec4899',
                        ][i % 5],
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {r.serviceTime}m
                    </div>
                  </div>
                  <span
                    style={{
                      width: '40px',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    {r.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE MEASURES SECTION */}
          <div
            style={{
              backgroundColor: '#0b1120',
              borderRadius: '24px',
              padding: '35px',
              border: '1px solid #1e293b',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#2dd4bf22',
                  padding: '10px',
                  borderRadius: '12px',
                }}
              >
                📈
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: '22px', margin: 0 }}>
                  Performance Measures
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {form.model} Simulation Results
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              <PerformanceCard
                title='Avg Interarrival Time'
                value={`${avgInterarrival} min`}
                subtext='Average time between consecutive arrivals'
                color='#6366f1'
                icon='🔄'
              />
              <PerformanceCard
                title='Avg Service Time'
                value={`${avgService} min`}
                subtext='Average time server spends on each customer'
                color='#a855f7'
                icon='⏱️'
              />
              <PerformanceCard
                title='Avg Wait Time'
                value={`${avgWait} min`}
                subtext='Average time a customer waits in queue'
                color='#ec4899'
                icon='⏳'
              />
              <PerformanceCard
                title='Avg Response Time'
                value={`${avgWait} min`}
                subtext='Average time from arrival until service begins'
                color='#f59e0b'
                icon='🕒'
              />
              <PerformanceCard
                title='Avg Turnaround Time'
                value={`${avgTurnaround} min`}
                subtext='Average total time in system (wait + service)'
                color='#10b981'
                icon='📉'
              />
              <PerformanceCard
                title='Avg Queue Length (Lq)'
                value={Lq}
                subtext='Average number of customers waiting in queue'
                color='#f43f5e'
                icon='👥'
              />
              <PerformanceCard
                title='Avg Number in System (L)'
                value={L}
                subtext='Average number of customers in the system'
                color='#3b82f6'
                icon='🏢'
              />
              <PerformanceCard
                title='Server Utilization (ρ)'
                value={`${utilization}%`}
                subtext='Fraction of time the server was busy'
                color='#8b5cf6'
                icon='📊'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
