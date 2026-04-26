"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Cylinder, Text } from "@react-three/drei";
import * as THREE from "three";

// ── 1. TRUE EMPIRICAL SAMPLING (Bootstrapping) ─────────────────────────────
import labData from "../../data/labData.json";

const serviceTimeBucket = labData.map((row) =>
  Math.max(1, Math.round(row.serviceDuration)),
);
const arrivalGapBucket = [];
for (let i = 1; i < labData.length; i++) {
  const gap = Math.round(labData[i].arrivalTick - labData[i - 1].arrivalTick);
  arrivalGapBucket.push(gap > 0 ? gap : 1);
}

const getEmpiricalArrivalGap = () => {
  const randomIndex = Math.floor(Math.random() * arrivalGapBucket.length);
  return arrivalGapBucket[randomIndex];
};

const getEmpiricalServiceTime = () => {
  const randomIndex = Math.floor(Math.random() * serviceTimeBucket.length);
  return serviceTimeBucket[randomIndex];
};

// ── 2. 3D COMPONENTS ──────────────────────────────────────────────────────
function StylizedPerson({ targetPosition, id, color, label }) {
  const groupRef = useRef();
  const target = new THREE.Vector3(...targetPosition);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.lerp(target, 0.08);
    }
  });

  return (
    <group ref={groupRef} position={[targetPosition[0], targetPosition[1], 10]}>
      <Cylinder args={[0.3, 0.3, 0.8, 16]} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Sphere args={[0.25, 16, 16]} position={[0, 1.0, 0]} castShadow>
        <meshStandardMaterial color="#fcd34d" />
      </Sphere>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
      >
        {label || `P-${id}`}
      </Text>
    </group>
  );
}

function ReceptionDesk({ position, deskNumber }) {
  return (
    <group position={position}>
      <Box args={[3, 1.2, 1.2]} position={[0, 0.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#00d4ff" metalness={0.2} roughness={0.8} />
      </Box>
      <Box args={[0.8, 0.5, 0.1]} position={[0, 1.45, -0.2]} castShadow>
        <meshStandardMaterial color="#111" />
      </Box>
      <Text position={[0, 0.6, 0.65]} fontSize={0.3} color="white">
        Desk {deskNumber}
      </Text>
      <StylizedPerson
        targetPosition={[0, 0, -1.2]}
        id={`S${deskNumber}`}
        color="#10b981"
        label="Staff"
      />
    </group>
  );
}

function LabScene({ queue, servers, departing, serverCount }) {
  const deskSpacing = 3.5;
  const startX = -((serverCount - 1) * deskSpacing) / 2;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 8]} intensity={1} castShadow />
      <OrbitControls makeDefault minDistance={5} maxDistance={25} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#1e2d45" />
      </mesh>

      <mesh position={[0, 3, -6]} receiveShadow>
        <boxGeometry args={[40, 6, 0.5]} />
        <meshStandardMaterial color="#0d1322" />
      </mesh>

      <Text
        position={[0, 4.5, -5.7]}
        fontSize={1}
        color="#00d4ff"
        fontStyle="italic"
      >
        Dr. Essa Laboratory
      </Text>

      <group position={[10, 0, -5.5]}>
        <Box args={[0.2, 3.0, 0.2]} position={[-1, 1.5, 0]}>
          <meshStandardMaterial color="#4b5563" />
        </Box>
        <Box args={[0.2, 3.0, 0.2]} position={[1, 1.5, 0]}>
          <meshStandardMaterial color="#4b5563" />
        </Box>
        <Box args={[2.2, 0.2, 0.2]} position={[0, 3.1, 0]}>
          <meshStandardMaterial color="#4b5563" />
        </Box>
        <Text position={[0, 3.6, 0]} fontSize={0.5} color="#ef4444">
          EXIT
        </Text>
      </group>

      {Array.from({ length: serverCount }).map((_, i) => (
        <ReceptionDesk
          key={`desk-${i}`}
          position={[startX + i * deskSpacing, 0, -3]}
          deskNumber={i + 1}
        />
      ))}

      {servers.map((patient, i) => {
        if (!patient) return null;
        return (
          <StylizedPerson
            key={`serv-${patient.id}`}
            targetPosition={[startX + i * deskSpacing, 0, -1.5]}
            id={patient.id}
            color="#f59e0b"
          />
        );
      })}

      {queue.map((patient, index) => {
        const zPosition = 1 + index * 1.5;
        return (
          <StylizedPerson
            key={patient.id}
            targetPosition={[0, 0, zPosition]}
            id={patient.id}
            color="#3b82f6"
          />
        );
      })}

      {departing.map((patient) => (
        <StylizedPerson
          key={`dep-${patient.id}`}
          targetPosition={[10, 0, -4]}
          id={patient.id}
          color="#6b7280"
        />
      ))}
    </>
  );
}

// ── 3. MAIN APPLICATION & GENERATIVE ENGINE ───────────────────────────────
export default function SimulatorApp() {
  const [activePage, setActivePage] = useState("setup");
  const [serverCount, setServerCount] = useState(1);
  const [isRunning, setIsRunning] = useState(false);

  const [queue, setQueue] = useState([]);
  const [servers, setServers] = useState([null]);
  const [departing, setDeparting] = useState([]);
  const [logs, setLogs] = useState([]);

  const engineState = useRef({
    time: 0,
    patientCounter: 1,
    nextArrivalTime: 0,
    queue: [],
    servers: [null],
    departing: [],
  });

  const addLog = (msg, type = "info") => {
    let colorClass = "text-gray-400";
    if (type === "arrival") colorClass = "text-blue-400";
    if (type === "service") colorClass = "text-amber-400";
    if (type === "depart") colorClass = "text-emerald-400";

    setLogs((prev) =>
      [
        <span key={Math.random()} className={colorClass}>
          [{`Min ${engineState.current.time}`}] {msg}
        </span>,
        ...prev,
      ].slice(0, 50),
    );
  };

  const handleStartSimulation = () => {
    setIsRunning(true);
    setActivePage("simulation");
    setQueue([]);
    setServers(Array(serverCount).fill(null));
    setDeparting([]);
    setLogs([]);

    engineState.current = {
      time: 0,
      patientCounter: 1,
      nextArrivalTime: getEmpiricalArrivalGap(),
      queue: [],
      servers: Array(serverCount).fill(null),
      departing: [],
    };
  };

  useEffect(() => {
    let interval;
    if (isRunning && activePage === "simulation") {
      if (engineState.current.time === 0)
        addLog("Simulation Started (Empirical Mode)", "info");

      interval = setInterval(() => {
        const state = engineState.current;
        state.time += 1;

        state.departing = state.departing.filter(
          (p) => state.time < p.exitTime,
        );

        state.servers.forEach((patient, index) => {
          if (patient && state.time >= patient.serviceEndTime) {
            const timeInSystem = state.time - patient.arrivalTime;
            addLog(
              `Patient P-${patient.id} departed. Total time in lab: ${timeInSystem} mins.`,
              "depart",
            );
            state.departing.push({ ...patient, exitTime: state.time + 3 });
            state.servers[index] = null;
          }
        });

        if (state.time === state.nextArrivalTime) {
          const newPatient = {
            id: state.patientCounter++,
            arrivalTime: state.time,
          };
          state.queue.push(newPatient);
          addLog(
            `Patient P-${newPatient.id} arrived. Queue length: ${state.queue.length}`,
            "arrival",
          );
          state.nextArrivalTime = state.time + getEmpiricalArrivalGap();
        }

        state.servers.forEach((patient, index) => {
          if (!patient && state.queue.length > 0) {
            const nextPatient = state.queue.shift();
            const waitTime = state.time - nextPatient.arrivalTime;
            const generatedServiceTime = getEmpiricalServiceTime();
            nextPatient.serviceEndTime = state.time + generatedServiceTime;
            addLog(
              `Patient P-${nextPatient.id} moving to Desk ${index + 1}. Waited in line: ${waitTime} mins.`,
              "service",
            );
            state.servers[index] = nextPatient;
          }
        });

        setQueue([...state.queue]);
        setServers([...state.servers]);
        setDeparting([...state.departing]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activePage]);

  // ── PAGE 1: SETUP DASHBOARD ──────────────────────────────────────────────
  if (activePage === "setup") {
    const deskOptions = [
      { value: 1, label: "1", sublabel: "Baseline" },
      { value: 2, label: "2", sublabel: "Optimised" },
      { value: 3, label: "3", sublabel: "Maximum" },
    ];

    const flowSteps = [
      { icon: "↓", label: "Patient arrives", color: "blue" },
      { icon: "⏳", label: "Joins queue", color: "gray" },
      { icon: "→", label: "Called to desk", color: "amber" },
      { icon: "✓", label: "Served & departs", color: "teal" },
    ];

    const flowColors = {
      blue: { bg: "#e6f1fb", color: "#185fa5" },
      gray: { bg: "#f1efe8", color: "#5f5e5a" },
      amber: { bg: "#faeeda", color: "#633806" },
      teal: { bg: "#e1f5ee", color: "#0f6e56" },
    };

    return (
      <div
        className="flex flex-col text-white overflow-hidden"
        style={{
          minHeight: "calc(100vh - 4rem)",
          background: "#0a0e1a",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            borderBottom: "1px solid #1a2540",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#070b14",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "#4b6080",
                textTransform: "uppercase",
              }}
            >
              Simulation — Dr. Essa Laboratory
            </span>
          </div>
          <span
            style={{ fontSize: 11, color: "#253450", letterSpacing: "0.1em" }}
          >
            G/G/c · Bootstrapped · v2.0
          </span>
        </div>

        <div
          style={{
            flex: 1,
            padding: "2.5rem 2rem",
            maxWidth: 960,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Hero header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p
              style={{
                fontSize: 11,
                color: "#4b6080",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Discrete-event queue simulation
            </p>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                color: "#e2eaf8",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Essa Lab
              <br />
              <span style={{ color: "#00b4d8" }}>Queue Simulator</span>
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#4b6080",
                lineHeight: 1.7,
                maxWidth: 480,
                marginTop: 4,
              }}
            >
              Non-parametric bootstrapping engine. Samples directly from 400
              historical patient records — no fitted distributions, no
              assumptions.
            </p>
          </div>

          {/* Flow strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              background: "#1a2540",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #1a2540",
            }}
          >
            {flowSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  background: "#0d1424",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: flowColors[step.color].bg,
                    color: flowColors[step.color].color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    flexShrink: 0,
                    fontFamily: "sans-serif",
                  }}
                >
                  {step.icon}
                </div>
                <span
                  style={{ fontSize: 11, color: "#7a90b0", lineHeight: 1.4 }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
            }}
          >
            {/* Left: Stats */}
            <div
              style={{
                background: "#0d1424",
                border: "1px solid #1a2540",
                borderRadius: 12,
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #1a2540",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#00b4d8",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "#4b6080",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Empirical dataset
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Mean inter-arrival (λ)",
                    value: "5.85 min",
                    accent: "#00b4d8",
                  },
                  {
                    label: "Arrival variance (Cₐ²)",
                    value: "1.54",
                    accent: "#00b4d8",
                  },
                  {
                    label: "Mean service time (μ)",
                    value: "3.86 min",
                    accent: "#f59e0b",
                  },
                  {
                    label: "Service variance (Cs²)",
                    value: "0.19",
                    accent: "#f59e0b",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#070b14",
                      border: "1px solid #1a2540",
                      borderRadius: 8,
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#4b6080",
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: stat.accent,
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#070b14",
                  border: "1px solid #1a2540",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "#4b6080" }}>
                  Historical records analysed
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#e2eaf8" }}
                >
                  400 patients
                </span>
              </div>
            </div>

            {/* Right: Architecture */}
            <div
              style={{
                background: "#0d1424",
                border: "1px solid #1a2540",
                borderRadius: 12,
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #1a2540",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "#4b6080",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Architecture
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}
              >
                {[
                  {
                    label: "Mathematical model",
                    name: "True G/G/c queue",
                    desc: "General arrivals + general service. No forced parametric curve.",
                    accent: "#00b4d8",
                  },
                  {
                    label: "Generation strategy",
                    name: "Empirical bootstrapping",
                    desc: "Randomly resamples historical buckets — preserves real-world anomalies.",
                    accent: "#10b981",
                  },
                  {
                    label: "Time scale",
                    name: "1 second = 1 minute",
                    desc: "Simulation clock compresses real operational time for fast analysis.",
                    accent: "#f59e0b",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#070b14",
                      borderLeft: `3px solid ${item.accent}`,
                      borderRadius: "0 8px 8px 0",
                      padding: "0.85rem 1rem",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#4b6080",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#e2eaf8",
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4b6080",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div
            style={{
              background: "#0d1424",
              border: "1px solid #1a2540",
              borderRadius: 12,
              padding: "1.5rem",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#4b6080",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Active front desks
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {deskOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setServerCount(opt.value)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "10px 24px",
                      borderRadius: 8,
                      border:
                        serverCount === opt.value
                          ? "2px solid #00b4d8"
                          : "1px solid #1a2540",
                      background:
                        serverCount === opt.value
                          ? "rgba(0,180,216,0.08)"
                          : "#070b14",
                      color: serverCount === opt.value ? "#00b4d8" : "#4b6080",
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 10, letterSpacing: "0.05em" }}>
                      {opt.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartSimulation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#00b4d8",
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "12px 28px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.05em",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: "9px solid #000",
                  display: "inline-block",
                }}
              />
              Initialize Environment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PAGE 2: 3D SIMULATION VISUALIZER ─────────────────────────────────────
  return (
    <div
      className="relative flex flex-col text-white"
      style={{
        height: "calc(100vh - 4rem)",
        background: "#070b14",
        fontFamily: "'IBM Plex Mono', monospace",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "0.75rem 1.5rem",
          background: "#0d1424",
          borderBottom: "1px solid #1a2540",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => {
              setIsRunning(false);
              setActivePage("setup");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#4b6080",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e2eaf8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4b6080")}
          >
            ← Setup
          </button>
          <div style={{ width: 1, height: 16, background: "#1a2540" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isRunning ? "#22c55e" : "#f59e0b",
                boxShadow: isRunning ? "0 0 6px #22c55e" : "0 0 6px #f59e0b",
              }}
            />
            <span style={{ fontSize: 12, color: "#7a90b0" }}>
              Empirical Execution · {serverCount} Server
              {serverCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 18px",
            borderRadius: 6,
            border: "1px solid",
            borderColor: isRunning ? "#7f1d1d" : "#1a3a2a",
            background: isRunning
              ? "rgba(127,29,29,0.2)"
              : "rgba(26,58,42,0.3)",
            color: isRunning ? "#f87171" : "#4ade80",
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            fontWeight: 700,
            transition: "all 0.15s",
          }}
        >
          {isRunning ? "⏸ Pause" : "▶ Resume"}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 3D Canvas */}
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            background: "#050810",
          }}
        >
          <Canvas shadows camera={{ position: [0, 8, 12], fov: 45 }}>
            <Suspense fallback={null}>
              <LabScene
                queue={queue}
                servers={servers}
                departing={departing}
                serverCount={serverCount}
              />
            </Suspense>
          </Canvas>

          {/* Live counters overlay */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            {[
              { label: "In Queue", value: queue.length, color: "#3b82f6" },
              {
                label: "Being Served",
                value: servers.filter(Boolean).length,
                color: "#f59e0b",
              },
              { label: "Departing", value: departing.length, color: "#10b981" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(7,11,20,0.85)",
                  border: "1px solid #1a2540",
                  borderLeft: `3px solid ${stat.color}`,
                  borderRadius: "0 6px 6px 0",
                  padding: "6px 12px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#4b6080",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: stat.color,
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log panel */}
        <div
          style={{
            width: 360,
            background: "#0d1424",
            borderLeft: "1px solid #1a2540",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #1a2540",
              background: "#070b14",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00b4d8",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "#4b6080",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Event Log
            </span>
          </div>

          {/* Legend */}
          <div
            style={{
              padding: "0.6rem 1rem",
              borderBottom: "1px solid #1a2540",
              display: "flex",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {[
              { color: "#3b82f6", label: "Arrival" },
              { color: "#f59e0b", label: "Service" },
              { color: "#10b981", label: "Depart" },
            ].map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: item.color,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: "#4b6080",
                    letterSpacing: "0.08em",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {logs.length === 0 && (
              <div
                style={{
                  color: "#253450",
                  fontSize: 11,
                  textAlign: "center",
                  paddingTop: 40,
                  fontStyle: "italic",
                }}
              >
                Waiting for first event...
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid #0d1424",
                  paddingBottom: 6,
                  wordBreak: "break-words",
                  lineHeight: 1.5,
                  fontSize: 11,
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

