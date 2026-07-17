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

    // NOTE: Customer count is no longer taken from the client.
    // The number of trace-table rows is now derived from the Poisson
    // lookup table itself (it grows until cumulative probability
    // reaches ~0.99999, i.e. "5 nines"). This field is kept only so
    // older clients that still send it won't break deserialization;
    // it is ignored by the simulation.
    public string Customers { get; set; } = string.Empty;
}

public class SimulationRow
{
    // Property names below are chosen to match what the results page
    // (page.js) reads off each row: row.customerNo, row.lookupCumProbability,
    // row.cumProbability, row.interArrival, row.arrivalTime, row.serviceTime,
    // row.startTime, row.endTime, row.turnaroundTime, row.waitTime,
    // row.responseTime. ASP.NET Core's default System.Text.Json output uses
    // camelCase, so PascalCase here becomes camelCase in the JSON response.
    public int CustomerNo { get; set; }
    public double CumProbability { get; set; }
    public double LookupCumProbability { get; set; }
    public int NoOfMinK { get; set; }
    public int InterArrival { get; set; }
    public int ArrivalTime { get; set; }
    public int ServiceTime { get; set; }
    public int StartTime { get; set; }
    public int EndTime { get; set; }
    public int TurnaroundTime { get; set; }
    public int WaitTime { get; set; }
    public int ResponseTime { get; set; }
}

public class PerformanceMeasures
{
    public double AvgInterArrivalTime { get; set; }
    public double AvgServiceTime { get; set; }
    public double AvgWaitTime { get; set; }
    public double AvgResponseTime { get; set; }
    public double AvgTurnaroundTime { get; set; }
    public double AvgQueueLength { get; set; }     // Lq
    public double AvgNumberInSystem { get; set; }  // L
    public double OverallUtilization { get; set; } // % busy time
}

public class SimulationResponse
{
    public string ModelType { get; set; } = string.Empty;
    public List<SimulationRow> Rows { get; set; } = new();
    public PerformanceMeasures Performance { get; set; } = new();
}

[ApiController]
[Route("api/[controller]")]
public class SimulatorController : ControllerBase
{
    private readonly Random _random = new Random();

    // Cumulative probability threshold ("5 nines") at which the Poisson
    // lookup table is considered to cover essentially all mass. Once the
    // running cumulative probability reaches this value, k stops growing.
    private const double CumulativeProbThreshold = 0.99999;

    // Safety cap so a pathological lambda (e.g. extremely large) can't spin
    // the table-building loop forever.
    private const int MaxK = 1000;

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
        if (!double.TryParse(req.Arrival, out double lambda))
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

        // Generate the Poisson lookup table. k starts at 0 and increases
        // 1, 2, 3, ... one row at a time. The table keeps growing until the
        // running cumulative probability reaches ~0.99999 ("5 nines"), at
        // which point essentially all of the probability mass has been
        // accounted for and there's no meaningful reason to add another k.
        //
        // The size of this table now ALSO defines the total number of
        // customers simulated: each k becomes exactly one customer/row,
        // in order, so there is no separate "Customers" input anymore.
        var lookupTable = new List<(double low, double high, int k)>();

        double cumProb = 0;

        for (int k = 0; k < MaxK; k++)
        {
            double p = (Math.Pow(lambda, k) * Math.Exp(-lambda)) / Factorial(k);

            double low = cumProb;
            double high = cumProb + p;

            lookupTable.Add((low, high, k));

            cumProb = high;

            if (cumProb >= CumulativeProbThreshold)
                break;
        }

        int count = lookupTable.Count;

        var rows = new List<SimulationRow>();

        int lastArrival = 0;
        int lastEnd = 0;

        for (int i = 1; i <= count; i++)
        {
            // k is taken directly and sequentially from the lookup table
            // (0, 1, 2, 3, ...) for row i — no random draw is used to pick it.
            var entry = lookupTable[i - 1];
            int k = entry.k;

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

            rows.Add(new SimulationRow
            {
                CustomerNo = i,
                CumProbability = Math.Round(entry.high, 8),
                LookupCumProbability = Math.Round(entry.low, 8),
                NoOfMinK = k,
                InterArrival = interArrival,
                ArrivalTime = arrivalTime,
                ServiceTime = serviceTime,
                StartTime = startTime,
                EndTime = endTime,
                TurnaroundTime = endTime - arrivalTime,
                WaitTime = startTime - arrivalTime,
                ResponseTime = startTime - arrivalTime
            });

            lastArrival = arrivalTime;
            lastEnd = endTime;
        }

        var performance = ComputePerformanceMeasures(rows);

        var response = new SimulationResponse
        {
            ModelType = req.Model,
            Rows = rows,
            Performance = performance
        };

        return Ok(response);
    }

    // Computes the trace-table-wide averages and single-server (M/M/1 or
    // M/G/1, c = 1) queueing measures shown on the results page. All
    // formulas are derived straight from the simulated rows, not from the
    // theoretical model, since this is an empirical/discrete-event
    // simulation rather than a closed-form calculation.
    private PerformanceMeasures ComputePerformanceMeasures(List<SimulationRow> rows)
    {
        var perf = new PerformanceMeasures();

        if (rows.Count == 0)
            return perf;

        // Customer 1's InterArrival is always 0 by convention (no previous
        // customer to measure against), so it's excluded from the average.
        var interArrivalsAfterFirst = rows.Skip(1).Select(r => (double)r.InterArrival).ToList();
        perf.AvgInterArrivalTime = interArrivalsAfterFirst.Count > 0
            ? interArrivalsAfterFirst.Average()
            : 0;

        perf.AvgServiceTime = rows.Average(r => (double)r.ServiceTime);
        perf.AvgWaitTime = rows.Average(r => (double)r.WaitTime);
        perf.AvgResponseTime = rows.Average(r => (double)r.ResponseTime);
        perf.AvgTurnaroundTime = rows.Average(r => (double)r.TurnaroundTime);

        // Little's Law: L = λ * W, Lq = λ * Wq, using the simulation's own
        // empirical arrival rate λ = 1 / AvgInterArrivalTime.
        if (perf.AvgInterArrivalTime > 0)
        {
            double lambdaEffective = 1.0 / perf.AvgInterArrivalTime;
            perf.AvgNumberInSystem = lambdaEffective * perf.AvgTurnaroundTime;
            perf.AvgQueueLength = lambdaEffective * perf.AvgWaitTime;
        }

        // Utilization = total busy (service) time / total elapsed time.
        int lastEndTime = rows[rows.Count - 1].EndTime;
        double totalServiceTime = rows.Sum(r => (double)r.ServiceTime);
        perf.OverallUtilization = lastEndTime > 0
            ? Math.Round((totalServiceTime / lastEndTime) * 100.0, 2)
            : 0;

        perf.AvgInterArrivalTime = Math.Round(perf.AvgInterArrivalTime, 4);
        perf.AvgServiceTime = Math.Round(perf.AvgServiceTime, 4);
        perf.AvgWaitTime = Math.Round(perf.AvgWaitTime, 4);
        perf.AvgResponseTime = Math.Round(perf.AvgResponseTime, 4);
        perf.AvgTurnaroundTime = Math.Round(perf.AvgTurnaroundTime, 4);
        perf.AvgQueueLength = Math.Round(perf.AvgQueueLength, 4);
        perf.AvgNumberInSystem = Math.Round(perf.AvgNumberInSystem, 4);

        return perf;
    }
}
}