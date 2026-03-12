##### **Our System is:**

Single-stage open queueing system with one server or multi-server at the Front Desk. Patients arrive, wait if the server is busy, receive service, and depart.



#### **1. System Parameters**



##### Input Parameters (to be set by user):



* λ (lambda) = Arrival rate (patients per minute), derived from interarrival time distribution
* μ (mu) = 1 / E\[S], Service rate at Front Desk (patients per minute)
* σ²A = Variance of interarrival time (for G/G/1)
* σ²S = Variance of front desk service time (for M/G/1 and G/G/1)



##### State Variables (tracked during simulation):



* Q(t) = Number of patients in Front Desk queue at time t
* S(t) = Status of Front Desk server (0 = idle, 1 = busy)
* System size = Q(t) + S(t)



##### Performance Measures (outputs):



* Wq = Lq / λ — Average waiting time in queue at Front Desk
* W = Wq + (1/μ) — Average total time spent at Front Desk
* Lq = Formula depends on model — Average queue length at Front Desk
* L = λ · W — Average number of patients in the system
* ρ = λ / μ — Utilization of Front Desk server
* Throughput = Total departures / 120 minutes



##### **M/M/1**

* ρ = λ / μ, stability requires ρ < 1
* Lq = ρ² / (1 − ρ)
* Wq = Lq / λ
* W = Wq + (1/μ)
* L = λ · W



##### **M/G/1**

* ρ = λ / μ, stability requires ρ < 1
* Pollaczek–Khinchine Formula:
* Lq = (ρ² + λ² · σ²s) / (2(1 − ρ))
* Wq = Lq / λ
* W = Wq + (1/μ)
* L = λ · W



##### **G/G/1**

* ρ = λ / μ, stability requires ρ < 1
* Kingman's Approximation:
* Wq ≈ ((1-ρ)/ρ) \* ((CA² + CS²)/2) \* (1/μ)
* Lq = λ · Wq
* W = Wq + (1/μ)
* L = λ · W
