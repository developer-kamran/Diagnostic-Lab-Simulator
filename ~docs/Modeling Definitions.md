#### Types of Distribution:



1. ##### **The Exponential Distribution (Memoryless Process)**

This is the most fundamental example. It is used when arrivals are completely random, independent of each other and on constant rate (a Poisson process). In the context of queuing theory and stochastic processes, the statistical distribution of the time between consecutive arrivals is most commonly modeled by the Exponential Distribution. 



The Exponential distribution has only one parameter (λ). This single number has to control both the average and the spread simultaneously. You cannot tune them separately.



**Context:** Customers walking into a store, phone calls arriving at a switchboard, or packets hitting a web server.



**Key Property (Memoryless):** The probability of an arrival in the next minute is always the same, regardless of how long it has been since the last arrival.



**Real-World Example:** Random Customer Arrivals.



**Scenario:** A bank branch during a slow period.



**Observation:** If the last customer arrived 2 minutes ago, the probability that the next customer arrives in the next 30 seconds is exactly the same as it was right after the previous customer left.



##### **2. The Deterministic Distribution (Constant Time) (Uniform)**

This is the simplest distribution. The time between arrivals is fixed and never changes.



**Context**: Automated assembly lines, perfectly scheduled public transport, or machines spitting out parts at a constant rate.



**Real-World Example:** Train Arrivals (Scheduled).



**Scenario:** A subway system where trains arrive exactly every 5 minutes during rush hour.



**Observation:** If you just miss a train, the inter-arrival time to the next one is deterministically 5 minutes (ignoring delays).



##### **3. The Erlang Distribution (The "Stage" Process)**

This is used when the arrival process is not completely random but requires a series of "stages" or phases to occur before the next arrival appears.



**Context:** Customer service where a new customer cannot arrive until the previous one has passed through a series of checks, or more complex arrival patterns than pure randomness.



**Key Feature:** It is the distribution of the sum of $k$ independent exponential random variables.



**Real-World Example:** Inspection Process.



**Scenario:** In a factory, a quality control officer must complete a 3-step checklist before signaling for the next product to be sent down the conveyor belt. The time for each step is random (exponential), so the total time between arrivals is Erlang-distributed.



###### *Note:*

When a model says "General Distribution," it is essentially an "all of the above" or "none of the above" category. It signifies that you are not locking yourself into a specific mathematical formula (like Exponential or Deterministic).



Instead, you are defining the arrivals solely by their statistical moments:



**A known Mean:** The average time between arrivals (e.g., "on average, one customer arrives every 5 minutes").

**A known Variance:** A measure of how much those arrival times spread out from the average (e.g., "sometimes they arrive 1 second apart, sometimes 10 minutes apart").



#### **Kendall's Notation (A/S/c/K/N/D):** 

The most common simplified version is A/S/c.



**A (Arrival Process):** Describes the statistical distribution of the time between consecutive arrivals (inter-arrival time).



**M (Markovian):** Exponential inter-arrival times (Poisson arrival process). This implies memory lessness.



**D (Deterministic):** Constant inter-arrival times (e.g., exactly one customer every 5 seconds).



**G (General):** Inter-arrival times follow a general distribution with a known mean and variance, but no specific form is assumed.



**S (Service Process):** Describes the statistical distribution of the time it takes to serve a customer.



**M (Markovian):** Exponential service times (memoryless).



**D (Deterministic):** Constant service times.



**G (General):** Service times follow a general distribution with a known mean and variance.



**c (Number of Servers):** The number of parallel service channels (e.g., 1, 2, ...).



**1:** Single server.



**∞:** Infinite servers (self-service).



**K (System Capacity):** The maximum number of customers allowed in the system (queue + service). If omitted, it's assumed to be infinite.



**N (Population Size):** The size of the source population from which customers arrive. If omitted, it's assumed to be infinite.



**D (Queueing Discipline):** The order in which customers are served. The most common is FIFO (First-In, First-Out), also known as FCFS. If omitted, FIFO is assumed.



#### **Performance Metrics:**

To analyze these models, we calculate a set of standard performance metrics. We'll use these formulas throughout the explanation.



**λ(Lambda):** Mean arrival rate (e.g., customers per second).



**μ(Mu):** Mean service rate per server (e.g., customers served per second). Therefore, the mean service time is 1/ μ​.



**ρ(Rho):** Utilization factor or traffic intensity. The proportion of time the server is busy. For a stable system, ρ<1.

Formula (for a single server, c=1): ρ=μ/λ	



**L:** Average number of customers in the system (those in the queue plus those being served).



**Lq:** Average number of customers in the queue (waiting to be served).



**W:** Average time a customer spends in the system (waiting time + service time).



**Wq:** Average time a customer spends in the queue (waiting time only).



A fundamental relationship, known as Little's Law, connects these metrics: L= λW. It is valid for almost all stable queueing systems.



#### **The Queuing Models**



##### **A. M/M/1 Model (Memoryless/Memoryless/1 server)**



M = Markovian (exponential) interarrival times



M = Markovian (exponential) service times



1 = Single server per queue

###### 

###### Mathematical Formulation:



Interarrival times ~ Exponential(λ) - completely random arrivals



Service times ~ Exponential(μ) - completely random service durations



This is the simplest mathematically and has closed-form solutions:



Utilization: ρ = λ/μ (must be < 1 for stability)



Average queue length: **𝐿𝑞** **= ρ**² **/ (1−ρ)​**



##### **B. M/G/1 Model (Memoryless/General/1 server)**



M = Markovian (exponential) interarrival times



G = General distribution for service times (any distribution)



1 = Single server per queue



###### Mathematical Formulation:



Interarrival times ~ Exponential(λ)



Service times ~ Any distribution (e.g., Normal, Uniform, Deterministic)



More complex but more realistic - uses Pollaczek-Khinchine formula:



Average queue length: **𝐿𝑞 ​= (λ**² **σ**² **+ ρ**²**) / (2(1-ρ))**



##### **C. G/G/1 Model (General/General/1 server)**



G = General distribution for interarrival times



G = General distribution for service times



1 = Single server per queue



###### Mathematical Formulation:



Interarrival times ~ Any distribution



Service times ~ Any distribution



Most general and realistic, but no closed-form solutions - must be simulated



Average queue length: **𝐿𝑞 ​= ρ**²**(1 + Cs**²**)(Ca**² **+ ρ**²**Cs**²**)**



where **Ca**² **= σa**² **/ (1/λ)**² **(arrival CV)**

&nbsp;     **Cs**² **= σs**² **/ (1/μ)**² **(service CV)**



**σa²** = variance of interarrival times, **σs²** = variance of service times





