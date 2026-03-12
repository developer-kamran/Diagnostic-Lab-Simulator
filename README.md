# ⚗️ DL Simulator — Dr. Essa Laboratory

A discrete-event **queueing model simulator** built for the Dr. Essa Diagnostic Laboratory. Models patient flow at the front desk during peak hours (9:00 AM – 11:00 AM) using analytical queueing theory formulas.

## 📸 Overview

The system allows users to configure queueing parameters and instantly compute performance metrics such as average waiting time, queue length, server utilization, idle time, and lab throughput — for three queueing models with multi-server support.

---

## 🧮 Supported Models

| Model     | Arrival     | Service     | Multi-Server                |
| --------- | ----------- | ----------- | --------------------------- |
| **M/M/1** | Exponential | Exponential | ✅ Exact (Erlang-C)         |
| **M/G/1** | Exponential | General     | ✅ Cosmetatos Approximation |
| **G/G/1** | General     | General     | ✅ Extended Kingman (Whitt) |

### Supported General Distributions (G)

- **Uniform** — parameterized by Minimum and Maximum
- **Normal** — parameterized by Mean and Variance
- **Gamma** — parameterized by Mean and Variance

---

## 📊 Performance Metrics Calculated

- **λ** — Arrival rate (patients/min)
- **μ** — Service rate (patients/min)
- **ρ** — Server utilization
- **Idle Time** — (fraction of time server is idle)
- **Lq** — Average number of patients waiting in queue
- **L** — Average number of patients in the system
- **Wq** — Average waiting time in queue (minutes)
- **W** — Average total time in system (minutes)
- **Throughput** — Expected patients served in 120 minutes

---

## ⚙️ Prerequisites

Make sure you have the following installed on your system before running the project:

- **[.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)** — required to build and run the backend API. You can verify your installation by running `dotnet --version` in your terminal.
- **[Node.js](https://nodejs.org/)** (v18 or higher) — required for the Next.js frontend
- **npm** (comes with Node.js)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/diagnostic-lab-simulator.git
cd diagnostic-lab-simulator
```

### 2. Run the Backend (ASP.NET Core API)

```bash
cd backend/DLSimulator.API
dotnet run
```

The API will start at `http://localhost:5000`.
Swagger UI is available at `http://localhost:5000/swagger`.

### 3. Run the Frontend (Next.js)

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`.

---

## 🔌 API Endpoint

### `POST /api/queue/calculate`

**Request Body Example (M/M/1):**

```json
{
  "modelType": 0, // 0 = MM1, 1 = MG1, 2 = GG1
  "arrivalDistribution": 0, // 0 = Exponential
  "arrivalMean": 5,
  "serviceDistribution": 0, // 0 = Exponential
  "serviceMean": 3,
  "numberOfServers": 1,
  "simulationDuration": 120
}
```

**Request Body Example (G/G/1 with Uniform):**

```json
{
  "modelType": 0, // 0 = MM1, 1 = MG1, 2 = GG1
  "arrivalDistribution": 1, // 1 = Uniform, 2 = Normal, 3 = Gamma
  "arrivalMin": 2,
  "arrivalMax": 8,
  "serviceDistribution": 1, // 1 = Uniform, 2 = Normal, 3 = Gamma
  "serviceMean": 4,
  "serviceVariance": 2,
  "numberOfServers": 2,
  "simulationDuration": 120
}
```

**Response:**

```json
{
  "modelType": 0, // 0 = MM1, 1 = MG1, 2 = GG1
  "numberOfServers": 1,
  "lambda": 0.2,
  "mu": 0.3333,
  "rho": 0.6,
  "idleTime": 0.4,
  "lq": 0.9,
  "l": 1.5,
  "wq": 4.5,
  "w": 7.5,
  "throughput": 24.0,
  "isStable": true,
  "stabilityMessage": null
}
```

---

## 🛠️ Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Backend  | C# ASP.NET Core 8 Web API |
| Frontend | Next.js 14, Tailwind CSS  |

---

## 📄 License

This project was developed for academic purposes as part of CSSE-607 — Modeling and Simulation.
