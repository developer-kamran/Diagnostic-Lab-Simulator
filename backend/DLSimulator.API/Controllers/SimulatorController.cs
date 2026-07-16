using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DLSimulator.API.Controllers
{
    public class SimulationRequest
    {
        public string Model { get; set; } = string.Empty;
        public string Arrival { get; set; } = string.Empty;

        // M/M/1
        public string Service { get; set; } = string.Empty;

        // M/G/1 - which sub-distribution to use: "Uniform" or "Normal"
        public string Distribution { get; set; } = string.Empty;

        // M/G/1 - Uniform Distribution
        public string ServiceMin { get; set; } = string.Empty;
        public string ServiceMax { get; set; } = string.Empty;

        // M/G/1 - Normal Distribution
        public string ServiceMean { get; set; } = string.Empty;     // μ
        public string ServiceVariance { get; set; } = string.Empty; // σ²

        public string Customers { get; set; } = string.Empty;
    }

    public class SimulationResponse
    {
        public List<SimulationRow> TraceTable { get; set; } = new();
    }

    public class SimulationRow
    {
        public int SNo { get; set; }
        public double CumulativeProb { get; set; }
        public double CumProbLookup { get; set; }
        public int NoOfMinK { get; set; }
        public int InterArrival { get; set; }
        public int ArrivalTime { get; set; }
        public int ServiceTime { get; set; }
        public int StartTime { get; set; }
        public int EndTime { get; set; }
        public int Turnaround { get; set; }
        public int WaitTime { get; set; }
        public int Response { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SimulatorController : ControllerBase
    {
        private readonly Random _random = new Random();

        private double Factorial(int f)
        {
            if (f == 0)
                return 1;

            double res = 1;

            for (int i = 1; i <= f; i++)
                res *= i;

            return res;
        }

        // Box-Muller transform: turns two U(0,1) samples into one N(0,1) sample
        private double NextStandardNormal()
        {
            double u1 = 1.0 - _random.NextDouble(); // (0,1] to avoid log(0)
            double u2 = _random.NextDouble();

            return Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
        }

        [HttpPost("run")]
        public IActionResult Run([FromBody] SimulationRequest req)
        {
            if (!double.TryParse(req.Arrival, out double lambda) ||
                !int.TryParse(req.Customers, out int count))
            {
                return BadRequest("Invalid Input");
            }

            double mu = 0;
            double a = 0;
            double b = 0;
            double normalMean = 0;
            double normalStdDev = 0;

            // Defaults to "Uniform" for backward compatibility with existing clients
            string distribution = string.IsNullOrWhiteSpace(req.Distribution)
                ? "Uniform"
                : req.Distribution;

            if (req.Model == "M/M/1")
            {
                if (!double.TryParse(req.Service, out mu))
                    return BadRequest("Invalid Service Rate.");
            }
            else if (req.Model == "M/G/1")
            {
                if (distribution == "Normal")
                {
                    if (!double.TryParse(req.ServiceMean, out normalMean))
                        return BadRequest("Invalid Service Mean (μ).");

                    if (!double.TryParse(req.ServiceVariance, out double normalVariance))
                        return BadRequest("Invalid Service Variance (σ²).");

                    if (normalVariance <= 0)
                        return BadRequest("Service Variance (σ²) must be greater than 0.");

                    if (normalMean <= 0)
                        return BadRequest("Service Mean (μ) must be greater than 0.");

                    normalStdDev = Math.Sqrt(normalVariance);
                }
                else
                {
                    if (!double.TryParse(req.ServiceMin, out a) ||
                        !double.TryParse(req.ServiceMax, out b))
                    {
                        return BadRequest("Invalid Service Time Range.");
                    }

                    if (a >= b)
                        return BadRequest("Service Min must be less than Service Max.");
                }
            }

            // Generate Poisson Lookup Table
            var lookupTable = new List<(double low, double high, int k)>();

            double cumProb = 0;

            for (int k = 0; k < 20; k++)
            {
                double p = (Math.Pow(lambda, k) * Math.Exp(-lambda)) / Factorial(k);

                lookupTable.Add((cumProb, cumProb + p, k));

                cumProb += p;
            }

            var rows = new List<SimulationRow>();

            int lastArrival = 0;
            int lastEnd = 0;

            for (int i = 1; i <= count; i++)
            {
                // Random number for arrival
                double rArrival = _random.NextDouble();

                // Find the appropriate k value from lookup table
                int k = 0;
                for (int j = 0; j < lookupTable.Count; j++)
                {
                    if (rArrival >= lookupTable[j].low && rArrival < lookupTable[j].high)
                    {
                        k = lookupTable[j].k;
                        break;
                    }
                }

                // If no match found (shouldn't happen with proper table), assign the last k
                if (rArrival >= lookupTable[lookupTable.Count - 1].high)
                {
                    k = lookupTable[lookupTable.Count - 1].k;
                }

                int interArrival = (i == 1) ? 0 : k;

                int arrivalTime = lastArrival + interArrival;

                int serviceTime;

                if (req.Model == "M/G/1")
                {
                    if (distribution == "Normal")
                    {
                        // Normal Distribution: value = μ + Z * σ, Z ~ N(0,1) via Box-Muller
                        double z = NextStandardNormal();

                        double value = normalMean + (z * normalStdDev);

                        serviceTime = (int)Math.Round(value);

                        // Service time cannot be negative or zero
                        serviceTime = Math.Max(1, serviceTime);
                    }
                    else
                    {
                        // Uniform Distribution
                        double U = _random.NextDouble();

                        double value = a + (b - a) * U;

                        serviceTime = (int)Math.Round(value);

                        // Clamp value inside range
                        serviceTime = Math.Max((int)a, Math.Min((int)b, serviceTime));
                    }
                }
                else
                {
                    // Exponential Distribution
                    serviceTime = (int)(-mu * Math.Log(1 - _random.NextDouble())) + 1;
                }

                int startTime = Math.Max(arrivalTime, lastEnd);

                int endTime = startTime + serviceTime;

                // Get the cumulative probability values for the matched k
                double cumProbLow = 0;
                double cumProbHigh = 0;
                for (int j = 0; j < lookupTable.Count; j++)
                {
                    if (lookupTable[j].k == k)
                    {
                        cumProbLow = lookupTable[j].low;
                        cumProbHigh = lookupTable[j].high;
                        break;
                    }
                }

                rows.Add(new SimulationRow
                {
                    SNo = i,
                    CumulativeProb = Math.Round(cumProbHigh, 5),
                    CumProbLookup = Math.Round(cumProbLow, 5),
                    NoOfMinK = k,
                    InterArrival = interArrival,
                    ArrivalTime = arrivalTime,
                    ServiceTime = serviceTime,
                    StartTime = startTime,
                    EndTime = endTime,
                    Turnaround = endTime - arrivalTime,
                    WaitTime = startTime - arrivalTime,
                    Response = startTime - arrivalTime
                });

                lastArrival = arrivalTime;
                lastEnd = endTime;
            }

            return Ok(rows);
        }
    }
}