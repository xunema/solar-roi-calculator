# Project Requirements Document: SolarCalc PH — Solar ROI & Battery Calculator

> **Version:** 1.4.0
> **Date:** 2026-03-16
> **Source:** `250915 SOLAR ROI .xlsx` spreadsheet + `Solar_ROI_App_PRD_v2.md`
> **Status:** Draft

---

## 1. Executive Summary

**SolarCalc PH** is a Progressive Web App (PWA) that allows Philippine homeowners, business owners, and solar sales reps to calculate solar photovoltaic and battery storage return-on-investment in real time — entirely offline, with zero backend dependencies.

**Tagline:** *"Know your payback before you pay."*

The app digitizes and extends the logic from the "250915 SOLAR ROI" spreadsheet, which models three scenarios (Solar Only, Battery Only, Combined) with configurable inputs for electricity rates, operating schedules, system sizing, battery storage, and loan financing.

---

## 2. Problem Statement

The existing Excel spreadsheet (`250915 SOLAR ROI .xlsx`) provides a powerful ROI model but has significant limitations:

- **Not mobile-friendly** — sales reps can't use it on-site with clients
- **No offline capability** — requires Excel or a compatible app
- **No guided onboarding** — users must understand which cells to edit ("ONLY ENCODE IN THE BLUE")
- **No input validation** — users can enter invalid data without warning
- **No contextual help** — tooltips and explanations are absent
- **Single-scenario view** — the spreadsheet calculates Solar, Battery, and Combined, but the UX is not intuitive
- **No sun hours reference** — users don't know their location's peak sun hours
- **No cost projection visibility** — users can't see their current annual electricity costs

---

## 3. Goals & Success Criteria

| Goal | Success Metric |
|------|---------------|
| Mobile-first PWA installable on Android and iOS | Lighthouse PWA audit ≥ 90 |
| Works fully offline after first load | Passes Chrome DevTools offline test |
| Real-time KPI calculation on every input change | All 10+ KPI cards update instantly |
| Guided onboarding for non-technical users | Modal with 4 slides explaining blended rate, annual usage |
| Accessible to all users | Lighthouse Accessibility audit ≥ 90 |
| No backend, no build pipeline, static hosting | Deploys to GitHub Pages with zero server costs |
| Theme customization | Night/Day mode toggle functional |
| Layout control | Phone/Desktop toggle works across breakpoints |

---

## 4. Scope

### 4.1 In Scope (V1.1)

- **Section 1 — Status Quo:** 
  - Electricity rate (₱/kWh)
  - Operating schedule (weeks/year, days/week)
  - Daily energy consumption (kWh) for cost projection
  - **Projected Annual Cost** — computed from rate × consumption × operating days
  - **Annual Bill** — optional overwrite of projected cost for reverse-calc
- **Section 2 — PhotoVoltaic System:** Capacity (kW), peak sun hours with reference links, price per kW, misc infrastructure costs, battery price per kWh
- **Section 3 — Battery Storage:** Nighttime load (kW), nighttime duration (hours), auto-calculated battery kWh and extra solar requirement
- **Section 4 — Financing:** Loan principal, annual interest rate, loan term (months), standard amortization formula
- **Sun Hours Calculator:** Modal tool to estimate peak sun hours by region/location
- **KPI Dashboard:** Total CAPEX, Projected Annual Cost, Annual Savings, Simple ROI %, Payback Years, Monthly Savings, Monthly Amortization, Net Monthly Cash Flow, Total Interest Paid
- **PWA Features:** Service worker, manifest, offline caching, Add to Home Screen
- **Onboarding Modal:** 4-slide guide explaining blended rate, annual usage, and defaults
- **Tooltip System:** Contextual help on every input field with external resource links
- **Responsive Design:** Mobile (< 768px), Tablet (768–1023px), Desktop (≥ 1024px)
- **Theme Toggle:** Night/Day mode with system preference detection
- **Layout Toggle:** Phone (vertical/single-column) vs Desktop (sidebar) layout override

### 4.2 Out of Scope (V1.1)

- GEOP rate comparison logic (present in spreadsheet Sheet "GEOP" but deferred)
- PDF export
- User accounts / login / cross-session persistence
- Backend API or database
- Multi-language / i18n
- Charts or graphs
- Net metering / feed-in tariff calculations
- Excess energy sold calculations (present in spreadsheet but deferred)

---

## 5. Section-by-Section Explanation

Each of the four sections builds on the previous one. Together they answer: **"What am I paying now, what will solar cost, do I need a battery, and how do I finance it?"**

---

### 5.1 Section 1 — Status Quo: "How much electricity are you consuming and paying for?"

**Purpose:** Establish the user's current electricity cost baseline. This is the number that solar savings are measured against — if you don't know what you're paying now, you can't calculate what you'll save.

**The core question:** *How many kWh do you consume, and at what price?*

#### User Story
A homeowner or business owner opens the app. They may know their electricity rate, or they may only have a Meralco bill total. The Status Quo section supports both paths:

**Path A — "I know my consumption":**
1. Enter **electricity rate** (₱/kWh) — the blended rate from their bill
2. Enter **average daily consumption** (kWh/day) — how much power they use per day
3. Enter **operating schedule** — how many weeks/year and days/week
4. The app computes: daily kWh → **annual kWh** → **annual cost** → **monthly cost**

**Path B — "I just know my bill total":**
1. Enter **electricity rate** (₱/kWh)
2. Enter **annual bill** (₱) directly — the app reverse-calculates daily consumption

#### Electricity Rate Benchmarks

| Type | Typical Blended Rate | Notes |
|------|---------------------|-------|
| **Residential** (Meralco) | ₱11–₱13/kWh | Higher per-kWh due to lifeline subsidies, universal charge |
| **Commercial** (Meralco) | ₱9–₱11/kWh | Lower per-kWh but higher absolute bills |
| **Industrial** | ₱7–₱9/kWh | Bulk rates, demand charges separate |
| **Provincial utilities** | ₱8–₱15/kWh | Varies widely by electric cooperative |

> **How to calculate your blended rate:** Total Bill Amount ÷ Total kWh Consumed. Do NOT use just the "Generation Charge" line — that's only one component. The blended rate includes transmission, distribution, metering, universal charges, and VAT.

**Default:** ₱15/kWh (commercial baseline; residential rates typically ₱15–₱20/kWh).

#### Consumption Chain

The key insight is that the user enters **daily** consumption, and the app builds up to annual:

```
Daily Consumption (kWh/day)
  × Operating Days/Year (weeks × days/week)
  = Annual Consumption (kWh/year)           ← new computed field
  × Electricity Rate (₱/kWh)
  = Annual Cost (₱/year)
  ÷ 12
  = Monthly Cost (₱/month)
```

**Example — Small residential:**
```
30 kWh/day × 364 days = 10,920 kWh/year × ₱12/kWh = ₱131,040/year = ₱10,920/month
```

**Example — Medium commercial:**
```
500 kWh/day × 300 days = 150,000 kWh/year × ₱10/kWh = ₱1,500,000/year = ₱125,000/month
```

**Example — Large commercial (from spreadsheet):**
```
1,200 kWh/day × 300 days = 360,000 kWh/year × ₱11/kWh = ₱3,960,000/year = ₱330,000/month
```

#### Annual Bill Override

If the user enters an `annualBill` value, it **overrides** the computed annual cost and the app **reverse-calculates** daily consumption:

```
dailyConsumption = annualBill / (electricityRate × operatingDaysPerYear)
annualConsumptionKWh = annualBill / electricityRate
```

A visual badge indicates the value is user-overwritten (not computed).

---

### 5.2 Section 2 — PhotoVoltaic System: "How big a solar system, and what will it cost?"

**Purpose:** Size the PV system and calculate its energy output and equipment cost. This is the "engine" — how many kilowatts of solar capacity, how many hours of effective sun, and what the panels will produce.

**The core question:** *How much solar energy will my system generate each day and year?*

#### Key Inputs
- **PV Capacity (kW)** — the "engine size" of the solar plant for direct daytime use. Rule of thumb: 1 kW needs ~10 m² of unshaded roof.
- **Peak Sun Hours/day** — effective full-power output hours (see Section 7 for PSH calculator). Philippine default: 4.0 hours.
- **Price per kW** — total installed cost per kilowatt of solar capacity. Suggested default: ₱80,000/kW residential, ₱50,000/kW commercial. Users can adjust based on actual quotes.
- **Misc Infrastructure** — roof waterproofing, structural reinforcement, rewiring, net-metering fees.

#### Generation & Savings Chain
```
PV Capacity (kW) × Peak Sun Hours (hrs/day)
  = Daily Generation (kWh/day)
  × Electricity Rate (₱/kWh)
  = Daily Savings (₱/day)                    ← shown in Section 2 results
  × Operating Days/Year
  = Annual Savings (₱/year)                  ← shown in Dashboard
```

> **Tooltip on Annual Savings KPI:** "Savings Per Day × Operating Weeks/Year × Operating Days/Week"

#### Cost Chain
```
PV Capacity (kW) × Price per kW (₱/kW)
  = PV Equipment Cost (₱)
  + Misc Infrastructure (₱)
  = Total PV CAPEX (₱)                      ← feeds into Dashboard Total CAPEX
```

> **Total CAPEX** in the Dashboard = PV System CAPEX (Section 2) + Battery Storage cost (Section 3). The CAPEX KPI card links back to Section 2.

---

### 5.3 Section 3 — Battery Storage: "Do I need batteries for nighttime power?"

**Purpose:** Calculate battery requirements for nighttime operation. Solar panels only produce during the day — if the user needs power at night (security, aircon, refrigeration), they need battery storage. This section also shows how much of the PV system must be **allocated** to charging the batteries, and whether that allocation is sufficient.

**The core question:** *How many kWh of battery do I need, how much solar do I allocate to charge it, and is that enough?*

#### Key Inputs
- **Battery Price per kWh** — unit cost for battery storage capacity. Suggested default: ₱30,000/kWh residential, ₱12,000/kWh commercial. Users can adjust based on actual quotes.
- **Battery Capacity (kWh)** — the size of the battery system you want to install. Can be entered manually or calculated from nighttime load needs.
- **PV for Battery (kW)** — how many kW of PV capacity the user dedicates to charging the battery. This is additional capacity on top of the Section 2 PV Capacity.
- **Nighttime kWh/Hr** — average power consumption per hour during nighttime (optional, for reference calculation). Note: This is measured in kW (kilowatts), which is equivalent to kWh/hr (kilowatt-hours per hour).
- **Nighttime Duration (hours)** — how many hours after sunset battery power is needed (optional, for reference calculation)

#### Battery Cost Chain
```
Battery Capacity (kWh) × Battery Price per kWh (₱/kWh)
  = Battery Cost (₱)
```

#### Battery Charge Percentage
```
PV for Battery (kW) × Peak Sun Hours (hrs/day)
  = Daily Charge Capacity (kWh)

Battery Charge % = (Daily Charge Capacity / Battery Capacity kWh) × 100
```

This tells the user: **"Your allocated solar can charge {batteryChargePercent}% of the battery per day."**

- **100% or more** — fully charged every day (green indicator)
- **50–99%** — partially charged; battery won't last the full nighttime duration (yellow indicator)
- **Below 50%** — significantly under-allocated; consider adding more solar or reducing battery size (red indicator)

#### Extra PV Cost for Battery Charging
```
PV for Battery (kW) × Price per kW (₱/kW, from Section 2)
  = Extra PV Cost for Battery Charging (₱)
```

This cost is added to the **Total PV CAPEX** shown in Section 2 results.

#### Reference: Required Battery Calculation (Optional)
```
Nighttime kWh/Hr × Duration (hours)
  = Reference Required Battery (kWh)
```

This calculation provides a reference/suggestion for battery sizing but does not auto-populate the Battery Capacity field. Users can use this as guidance when deciding on their actual battery size.

> **Note:** Battery Capacity = 0 means "no battery needed." The Section 3 Results panel will show a friendly message: *"No battery configured — battery capacity is zero."*

---

### 5.4 Section 4 — Financing: "How do I pay for it?"

**Purpose:** Model loan financing for the solar investment. Many buyers finance 40–100% of the system cost. This section shows the true cost of borrowing.

**The core question:** *What's my monthly payment, and does solar still save me money after the loan payment?*

#### Key Inputs
- **Loan Principal (₱)** — how much of the total system cost is being financed
- **Annual Interest Rate (%)** — the bank's annual rate (Philippine typical: 8–12%)
- **Loan Term (months)** — repayment period (typical: 60 months = 5 years)

#### Financing Chain
```
Standard Annuity Formula:
  Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
  where P = principal, r = monthly rate, n = months

Monthly Payment × Loan Term = Total Loan Cost
Total Loan Cost - Principal = Total Interest Paid

Monthly Savings (from solar) - Monthly Payment = Net Monthly Cash Flow
```

If loan principal is 0 or empty:
- **Section 4 Results panel is hidden entirely**
- A **"Cash purchase — no financing"** message displays instead of loan calculations
- No financing KPIs appear in the Results Dashboard

If loan principal > 0:
- Section 4 Results panel shows loan details (Monthly Payment, Total Loan Cost, Total Interest)
- Financing KPIs appear in the Results Dashboard

If the net monthly cash flow is positive, the solar system pays for itself even during the loan period. If negative, the user is paying more per month than they save until the loan is paid off.

---

### 5.5 The Narrative — Putting It All Together

After all four sections are filled in and the Dashboard KPIs are computed, the app generates a **plain-language narrative** that strings every number into a coherent story. The narrative presents the analysis as a Problem → Hypothesis → Evidence → Verdict flow that the user can read top-to-bottom or share with a decision-maker.

#### Structure

**Part 1 — The Problem: Your Current Electricity Costs**

> You are paying **₱{electricityRate}/kWh** for electricity. At **{dailyEnergyConsumptionKWh} kWh/day** over **{operatingDaysPerYear} operating days/year**, you consume **{annualConsumptionKWh} kWh/year**, costing you **₱{projectedAnnualCost}/year** (or **₱{projectedMonthlyCost}/month**).

If `annualBill` was entered as an override, note:
> *(Your actual annual bill of ₱{annualBill} was used instead of the projected cost.)*

**Part 2 — The Hypothesis: What If You Installed Solar?**

> A **{solarCapacityKW} kW PhotoVoltaic system** at **{peakSunHoursPerDay} peak sun hours/day** would generate **{dailyGenerationKWh} kWh/day**, saving you **₱{dailySavings}/day** on electricity.
>
> The PV equipment costs **₱{pvSystemCost}** plus **₱{miscInfraCosts}** in infrastructure, for a total PV investment of **₱{totalPVCapex}**.

**Part 3 — Battery Storage (if applicable)**

If `batteryCapacityKWh > 0`:

> You've configured **{batteryCapacityKWh} kWh** of battery storage, costing **₱{batteryCost}**.
>
> To charge these batteries, you've allocated **{pvForBatteryKW} kW** of solar capacity dedicated to battery charging — bringing your total PV to **{totalSolarKW} kW**. The extra panels add **₱{extraSolarCost}** to the system cost.
>
> With **{peakSunHoursPerDay} peak sun hours/day**, your allocated PV can generate **{dailyChargeCapacityKWh} kWh/day** for battery charging — that's **{batteryChargePercent}%** of your battery capacity charged per day.

If no battery needed:
> No battery storage configured — your facility operates with solar only during daylight hours.

**Part 4 — The Investment: Total CAPEX**

> Your total capital expenditure is **₱{totalCapex}**, covering the PV system (Section 2) and battery storage (Section 3).

**Part 5 — The Return: Savings & ROI**

> Over **{operatingDaysPerYear} operating days/year**, your daily savings of **₱{dailySavings}** add up to **₱{annualSavings}/year** in reduced electricity costs (or **₱{monthlySavings}/month**).
>
> This gives you a **Simple ROI of {simpleROI}%** — meaning you recover **{simpleROI}%** of your investment each year. The inverse of this tells us your **Payback Period: {paybackYears} years** — the time until the system has fully paid for itself.

**Part 6 — Financing (if applicable)**

If `loanPrincipal > 0`:

> If you finance **₱{loanPrincipal}** at **{annualInterestRate}%** over **{loanTermMonths} months**, your monthly payment is **₱{monthlyAmortization}**. Over the loan term, you'll pay **₱{totalLoanCost}** total, of which **₱{totalInterestPaid}** is interest.
>
> After deducting the loan payment from your monthly savings: **₱{monthlySavings} - ₱{monthlyAmortization} = ₱{netMonthlyCashFlow}/month** net cash flow.

If `netMonthlyCashFlow >= 0`:
> **The solar system pays for itself even during the loan period.**

If `netMonthlyCashFlow < 0`:
> **During the loan period, you pay ₱{abs(netMonthlyCashFlow)}/month more than you save.** After the loan is paid off in {paybackYears} years, you keep the full ₱{monthlySavings}/month as pure savings.

If no financing:
> **Cash purchase — no financing costs.** Your full monthly savings of ₱{monthlySavings} go straight to recovering your investment.

**Part 7 — The Verdict**

A one-line summary with conditional tone based on ROI color:

- **Green (ROI ≥ 15%):** "Strong investment. Your {solarCapacityKW} kW system pays for itself in {paybackYears} years with {simpleROI}% annual returns."
- **Yellow (ROI 8–14.9%):** "Moderate investment. Payback in {paybackYears} years at {simpleROI}% annual returns — consider optimizing system size or reducing costs."
- **Red (ROI < 8%):** "Marginal investment at current assumptions. Review your electricity rate, system sizing, or pricing to improve returns."

#### Display

- Rendered as a scrollable text panel below the Dashboard (or as a toggleable "Show Narrative" section)
- All peso values use `formatPeso()`, percentages use `formatPercent()`, years use `formatYears()`
- Each paragraph references the source section — tapping the section name scrolls to it
- Narrative updates in real time as inputs change (same reactive pipeline as Dashboard KPIs)
- A "Copy to Clipboard" button lets users share the narrative as plain text

---

### 5.6 Quick Presets

Quick Presets allow users to load pre-configured scenarios with a single click. These presets serve as **benchmarks** — users can start from a realistic scenario and adjust to match their specific situation.

#### 🏠 Residential Preset — 5kW @ ₱80,000/kW

**Target User:** Homeowner with typical Meralco residential service

**Subtext:** 30 kWh/day • ₱20/kWh • Night: AC, fridge, fans (1.5kW)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Daily Consumption** | 30 kWh/day | Typical home with AC, refrigerator, appliances |
| **Operating Schedule** | 7 days/week, 52 weeks/year | Home occupied daily |
| **Electricity Rate** | ₱20/kWh | Meralco residential blended rate |
| **Solar System Size** | 5 kW | Typical residential rooftop installation |
| **Solar Price** | ₱80,000/kW | **The "Entry-Level" Reality** — includes residential overhead |
| **Battery Price** | ₱30,000/kWh | Consumer-grade LFP (wall-mounted units) |
| **Battery Capacity** | 12 kWh | 1.5 kW × 8 hours = 12 kWh for typical nighttime needs |
| **PV for Battery** | 3 kW | 12 kWh ÷ 4 peak sun hours = 3 kW needed to fully charge |
| **Nighttime kWh/Hr** | 1.5 kWh/hr | Aircon (0.75-1.5 kW) + Fridge (0.05-0.1 kW) + Fans/Routers (0.1 kW) |
| **Nighttime Duration** | 8 hours | 10pm - 6am typical usage |
| **Misc Costs** | ₱50,000 | Permits, inspection, small job overhead |
| **Loan Principal** | ₱250,000 | Partial financing (~50% of system cost) |
| **Interest Rate** | 8% | Typical personal/home improvement loan |

**The Residential "Entry Tax" — Why ₱80k/kW?**

Residential buyers face a **70–100% price premium** compared to commercial buyers due to:

1. **Soft Costs Barrier** — Permitting, engineering, and logistics costs are nearly the same for a small house as for a small warehouse. On a per-kW basis, this creates a steep "entry tax" for residential systems.

2. **Volume Barrier** — Small-scale buyers cannot access Tier 1 factory-direct pricing or volume logistics discounts. Residential buyers pay retail markup on every component.

3. **High Labor-to-Watt Ratio** — A 5kW residential system requires nearly the same crew and labor hours as a 20kW commercial system, but spread over fewer kW.

4. **Individual Permitting** — Each residential system requires customized structural assessment, individual net-metering applications, and bespoke mounting solutions.

5. **All-In Cost** — The ₱80k/kW rate includes the "Residential Overhead": labor, permitting, engineering, and installation complexity.

6. **Battery Inclusion** — This rate assumes a standard Hybrid LFP setup (5–10 kWh) to cover the 1.5 kW nighttime load.

**ROI Reality:** Expect 7–9 year payback due to higher per-kW costs, though this improves significantly if you can negotiate better pricing or qualify for incentives.

---

#### 🏢 Commercial Preset — 100kW @ ₱50,000/kW

**Target User:** Business with 100 office employees

**Subtext:** 100 kWh/day • ₱15/kWh • 100 employees • Night: 15kW

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Daily Consumption** | 100 kWh/day | 100 employees × 1 kWh/person/day (computers, AC, lighting, equipment) |
| **Operating Schedule** | 5 days/week, 52 weeks/year | Standard business operations |
| **Electricity Rate** | ₱15/kWh | Meralco commercial blended rate (lower than residential) |
| **Solar System Size** | 100 kW | Medium commercial rooftop or ground-mount installation |
| **Solar Price** | ₱50,000/kW | **The "Volume Advantage"** — sharp pricing territory |
| **Battery Price** | ₱12,000/kWh | Industrial LFP racks (48V or high voltage) — cheaper per kWh than residential wall units |
| **Battery Capacity** | 180 kWh | 15 kW × 12 hours = 180 kWh for nighttime operations |
| **PV for Battery** | 45 kW | 180 kWh ÷ 4 peak sun hours = 45 kW needed to fully charge |
| **Nighttime kWh/Hr** | 15 kWh/hr | Security lights (0.5 kW) + Servers/Network (1 kW) + Refrigeration (2 kW) + CCTV + Emergency lighting |
| **Nighttime Duration** | 12 hours | 6pm - 6am business closure |
| **Misc Costs** | ₱500,000 | Commercial permitting, engineering, net metering |
| **Loan Principal** | ₱2,500,000 | Partial financing (~50% of system cost) |
| **Interest Rate** | 10% | Typical commercial equipment financing |

**The Commercial "Volume Advantage" — Why ₱50k/kW?**

At 100kW+, the system enters **"Sharp Pricing" territory** with significant advantages:

1. **Economies of Scale** — Bulk panel purchasing, standardized mounting systems, and efficient crew deployment spread fixed costs over many kW.

2. **Procurement Power** — Ability to "bid out" multi-million PHP setups forces installers to work on thinner margins. Buyers can negotiate factory-direct or Tier 1 distributor pricing.

3. **Streamlined Logistics** — Single delivery, single crew, single permitting process for the entire system reduces per-kW overhead.

4. **Industrial-Grade Equipment** — Commercial systems use rack-mounted inverters and standardized BOS (balance of system) components that are cheaper per Watt than residential equivalents.

5. **Battery Scaling** — The ₱12k/kWh rate reflects industrial-grade LFP racks (48V or high voltage) which are dramatically cheaper per kWh than residential wall-mounted units. A 180 kWh commercial battery costs less than 6× a 5 kWh residential battery.

6. **ROI Acceleration** — The lower cost per kW (₱50k vs ₱80k) directly results in significantly faster ROI: **typically 3–4 years for commercial vs. 7–9 years for residential**.

**The Volume Threshold:** Most installers offer meaningful price breaks at 20kW, 50kW, and 100kW tiers. The 100kW preset represents the "sweet spot" where pricing becomes highly competitive.

---

#### 🔋 Battery Only Preset

**Target User:** Existing solar owner adding battery storage

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Solar System Size** | 0 kW | Existing system — adding only battery |
| **Battery Price** | ₱25,000/kWh | Mid-range between residential and commercial |
| **Battery Capacity** | 50 kWh | 5 kW × 10 hours = 50 kWh backup capacity |
| **PV for Battery** | 12.5 kW | 50 kWh ÷ 4 peak sun hours = 12.5 kW needed to fully charge |
| **Nighttime kWh/Hr** | 5 kWh/hr | Moderate backup load (essential circuits only) — for reference only |
| **Nighttime Duration** | 10 hours | Evening + early morning backup — for reference only |

---

#### 📋 Spreadsheet Preset

**Target User:** User validating against original Excel model

| Parameter | Value | Source |
|-----------|-------|--------|
| **Daily Consumption** | 1,200 kWh/day | Spreadsheet assumption |
| **Operating Schedule** | 6 days/week, 50 weeks/year (= 300 days) | Spreadsheet K5-K6 |
| **Electricity Rate** | ₱11/kWh | Spreadsheet K4 |
| **Solar System Size** | 300 kW | Spreadsheet K13 (daytime use only) |
| **Solar Price** | ₱40,000/kW | Spreadsheet K8 |
| **Battery Price** | ₱5,000/kWh | Spreadsheet K9 (LFP bulk pricing) |
| **Battery Capacity** | 0 kWh | Spreadsheet has no battery storage calculations |
| **PV for Battery** | 0 kW | Spreadsheet has no battery storage calculations |
| **Misc Costs** | ₱2,000,000 | Spreadsheet K10 |
| **Loan Principal** | ₱14,000,000 | Spreadsheet S6 |
| **Interest Rate** | 12% | Spreadsheet V5 |

---

#### Pricing Benchmark Philosophy

> **These are benchmark prices.** If users can get better deals through negotiation, volume purchasing, or government incentives, their **ROI will increase** (payback period shortens).
>
> The presets represent **realistic market rates** in the Philippines as of 2026:
> - Residential prices reflect consumer-grade equipment and smaller installer margins
> - Commercial prices reflect industrial procurement and economies of scale
>
> Users should treat these as starting points and adjust to their actual quotes.

---

## 6. Data Model

### 6.1 Input Fields

| Field | Type | Default | Unit | Validation | Section | Spreadsheet Cell(s) |
|-------|------|---------|------|------------|---------|---------------------|
| `electricityRate` | number | 20.00 | ₱/kWh | > 0, max 100 | 1 | K4 (COST PER KW = 11) |
| `operatingWeeksPerYear` | number | 52 | weeks | 1–52, integer | 1 | K5 (50) |
| `operatingDaysPerWeek` | number | 7 | days | 1–7, integer | 1 | K6 (6) |
| `dailyEnergyConsumptionKWh` | number | 10 | kWh | ≥ 0 | 1 | — |
| `projectedAnnualCost` | number | computed | ₱ | computed, overwritable | 1 | — |
| `annualBill` | number | null | ₱ | ≥ 0 or null | 1 | O5 (5,000,000) |
| `solarCapacityKW` | number | 1 | kW | > 0, max 100,000 | 2 | K13 (300) |
| `peakSunHoursPerDay` | number | 4.0 | hours | 0.5–8, step 0.1 | 2 | K7 (4) |
| `solarPricePerKW` | number | 60,000 | ₱/kW | > 0 | 2 | K8 (40,000) |
| `miscInfraCosts` | number | 30,000 | ₱ | ≥ 0 | 2 | K10 (2,000,000) |
| `batteryPricePerKWh` | number | 30,000 | ₱/kWh | > 0 | 3 | K9 (5,000) |
| `batteryCapacityKWh` | number | 5 | kWh | ≥ 0 | 3 | — |
| `pvForBatteryKW` | number | 1 | kW | ≥ 0 | 3 | — |
| `nighttimeLoadKW` | number | 1 | kW | ≥ 0 | 3 | — |
| `nighttimeDurationHours` | number | 10 | hours | ≥ 0, max 24 | 3 | — |
| `loanPrincipal` | number | 0 | ₱ | ≥ 0 | 4 | S6 (14,000,000) |
| `annualInterestRate` | number | 0 | % | 0–100 | 4 | V5 (12%) |
| `loanTermMonths` | number | 60 | months | 1–360, integer | 4 | S5 (60) |

### 6.2 Computed Fields

| Field | Formula | Unit | Section |
|-------|---------|------|---------|
| `operatingDaysPerYear` | `operatingWeeksPerYear × operatingDaysPerWeek` | days | 1 |
| `annualConsumptionKWh` | `dailyEnergyConsumptionKWh × operatingDaysPerYear` | kWh | 1 |
| `projectedAnnualCost` | `annualConsumptionKWh × electricityRate` | ₱ | 1 |
| `projectedMonthlyCost` | `projectedAnnualCost / 12` | ₱ | 1 |
| `pvSystemCost` | `solarCapacityKW × solarPricePerKW` | ₱ | 2 |
| `totalPVCapex` | `pvSystemCost + miscInfraCosts` | ₱ | 2 |
| `dailyGenerationKWh` | `solarCapacityKW × peakSunHoursPerDay` | kWh | 2 |
| `dailySavings` | `dailyGenerationKWh × electricityRate` | ₱/day | 2 |
| `annualGenerationKWh` | `totalSolarKW × peakSunHoursPerDay × operatingDaysPerYear` | kWh | 2 |
| `pvTotalCapacityKW` | `solarCapacityKW + pvForBatteryKW` | kW | 2 |
| `requiredBatteryKWh` | `nighttimeLoadKW × nighttimeDurationHours` | kWh | 3 |
| `batteryCost` | `batteryCapacityKWh × batteryPricePerKWh` | ₱ | 3 |
| `dailyChargeCapacityKWh` | `pvForBatteryKW × peakSunHoursPerDay` | kWh | 3 |
| `batteryChargePercent` | `IF batteryCapacityKWh > 0 THEN (dailyChargeCapacityKWh / batteryCapacityKWh) × 100 ELSE 0` — shows what % of battery can be charged per day with allocated PV | % | 3 |
| `extraSolarCost` | `pvForBatteryKW × solarPricePerKW` | ₱ | 3 |
| `totalSolarKW` | `solarCapacityKW + pvForBatteryKW` | kW | — |
| `totalCapex` | `totalPVCapex + batteryCost + extraSolarCost` — Total investment = PV System (Section 2) + Battery Storage (Section 3) + Extra PV for Battery (Section 3) | ₱ | Dashboard |
| `annualSavings` | `annualGenerationKWh × electricityRate` — tooltip: `dailySavings × operatingDaysPerYear` | ₱ | Dashboard |
| `simpleROI` | `IF totalCapex > 0 THEN (annualSavings / totalCapex) × 100 ELSE 0` — Annual Savings ÷ Total CAPEX. Measures what % of investment is recovered each year. Higher = faster recovery. | % | Dashboard |
| `paybackYears` | `IF annualSavings > 0 THEN totalCapex / annualSavings ELSE Infinity` — the inverse of ROI: how many years until CAPEX is fully recovered. | years | Dashboard |
| `monthlyAmortization` | Standard annuity formula (see Section 5.4 Financing) | ₱/month | 4 |
| `totalLoanCost` | `monthlyAmortization × loanTermMonths` | ₱ | 4 |
| `totalInterestPaid` | `totalLoanCost - loanPrincipal` | ₱ | 4 |
| `monthlySavings` | `annualSavings / 12` — note: this is Annual Savings divided by 12 months, not a direct calculation from daily savings × 30 | ₱/month | Dashboard |
| `netMonthlyCashFlow` | `monthlySavings - monthlyAmortization` | ₱/month | Dashboard |

### 6.3 Section Results Panels

Each section displays its own inline results panel below its inputs. These give the user immediate feedback within the section context before they scroll to the main dashboard.

#### Section 1 — Status Quo Results

```
┌─────────────────────────────────────────────┐
│  YOUR CURRENT ELECTRICITY COSTS             │
│                                             │
│  Operating Days/Year      364 days          │
│  Annual Consumption       18,200 kWh/yr     │
│  Projected Annual Cost    ₱182,000.00 /yr   │
│  Projected Monthly Cost   ₱15,166.67 /mo    │
│                                             │
│  [Annual Bill: ₱_____ (optional override)]  │
└─────────────────────────────────────────────┘
```

**Formulas:**
```
operatingDaysPerYear  = operatingWeeksPerYear × operatingDaysPerWeek
annualConsumptionKWh  = dailyEnergyConsumptionKWh × operatingDaysPerYear
projectedAnnualCost   = annualConsumptionKWh × electricityRate
projectedMonthlyCost  = projectedAnnualCost / 12
```

**Reverse Calculation:** When user enters `annualBill` without `dailyEnergyConsumptionKWh`, the system calculates backwards:
```
dailyEnergyConsumptionKWh = annualBill / (electricityRate × operatingDaysPerYear)
```

When `annualBill` is entered, it overrides `projectedAnnualCost` and `projectedMonthlyCost` is recalculated from the override. A visual indicator (badge or icon) shows the value is user-overwritten.

#### Section 2 — PhotoVoltaic System Results

```
┌─────────────────────────────────────────────┐
│  PV SYSTEM OUTPUT                           │
│                                             │
│  PV Total Capacity        13.0 kW           │  ← NEW: shows total including battery PV
│  PV Equipment Cost        ₱300,000.00       │
│  Total PV CAPEX           ₱300,000.00       │
│  Daily Generation         40.0 kWh/day      │
│  Daily Savings            ₱400.00 /day      │
│  Annual Generation        14,600 kWh/yr     │
└─────────────────────────────────────────────┘
```

> **Dashboard link:** Total PV CAPEX feeds into the Dashboard's **Total CAPEX** KPI. Total CAPEX = PV System cost (Section 2) + Battery Storage cost (Section 3) + Extra PV for Battery (Section 3). Tapping the Total CAPEX KPI card scrolls back to Section 2.

**Formulas:**
```
pvTotalCapacityKW   = solarCapacityKW + pvForBatteryKW
pvSystemCost        = solarCapacityKW × solarPricePerKW
totalPVCapex        = pvSystemCost + miscInfraCosts
dailyGenerationKWh  = solarCapacityKW × peakSunHoursPerDay
dailySavings        = dailyGenerationKWh × electricityRate
annualGenerationKWh = totalSolarKW × peakSunHoursPerDay × operatingDaysPerYear
```

> **Annual Savings tooltip:** Annual Savings = Daily Savings × Operating Days/Year (i.e., `dailySavings × operatingWeeksPerYear × operatingDaysPerWeek`). This connects Section 2's per-day output to the Dashboard's annual figure.

#### Section 3 — Battery Storage Results

```
┌─────────────────────────────────────────────┐
│  BATTERY STORAGE                            │
│                                             │
│  Battery Capacity         40.0 kWh          │  ← User input (not auto-calculated)
│  Battery Cost             ₱480,000.00       │  ← batteryCapacityKWh × batteryPricePerKWh
│  PV for Battery           10.0 kW           │  ← User input for dedicated charging
│  Extra PV Cost            ₱300,000.00       │  ← pvForBatteryKW × solarPricePerKW
│  Daily Charge Capacity    40.0 kWh/day      │  ← pvForBatteryKW × peakSunHoursPerDay
│  Battery Charge %         100.0% ✓          │  ← (dailyChargeCapacity / batteryCapacity) × 100
│                                             │
│  ── Reference Calculation ──                │
│  Required Battery (Ref)   40.0 kWh          │  ← nighttimeLoadKW × nighttimeDurationHours
└─────────────────────────────────────────────┘
```

**Battery Charge %** shows how much of the battery the allocated solar can fill each day:
- **≥ 100%** — green checkmark, fully charged daily
- **50–99%** — yellow warning, partial charge only
- **< 50%** — red alert, significantly under-allocated

If batteryCapacityKWh is 0, show: **"No battery configured — battery capacity is zero."**

**Formulas:**
```
INPUT FIELDS (Section 3):
batteryCapacityKWh       = User input (default 0, can use requiredBatteryKWh as reference)
pvForBatteryKW           = User input (default 0, can be calculated from battery capacity needs)
batteryPricePerKWh       = User input (suggested: ₱30,000 residential, ₱12,000 commercial)

COMPUTED VALUES:
batteryCost              = batteryCapacityKWh × batteryPricePerKWh
extraSolarCost           = pvForBatteryKW × solarPricePerKW
dailyChargeCapacityKWh   = pvForBatteryKW × peakSunHoursPerDay
batteryChargePercent     = IF batteryCapacityKWh > 0 THEN (dailyChargeCapacityKWh / batteryCapacityKWh) × 100 ELSE 0

REFERENCE CALCULATION (for guidance only):
requiredBatteryKWh       = nighttimeLoadKW × nighttimeDurationHours
```

#### Section 4 — Financing Results

When `loanPrincipal > 0`:
```
┌─────────────────────────────────────────────┐
│  LOAN SUMMARY                               │
│                                             │
│  Monthly Amortization     ₱311,422.27 /mo   │
│  Total Loan Cost          ₱18,685,336.06    │
│  Total Interest Paid      ₱4,685,336.06     │
└─────────────────────────────────────────────┘
```

When `loanPrincipal = 0` or empty:
- **Section 4 Results panel is hidden**
- A "💰 Cash Purchase — No Financing" message displays instead:
```
┌─────────────────────────────────────────────┐
│  💰 Cash Purchase — No Financing            │
│                                             │
│  No loan costs. Your full monthly savings   │
│  go straight to recovering your investment. │
└─────────────────────────────────────────────┘
```

### 6.4 Spreadsheet Verification (from "250915 SOLAR ROI .xlsx")

The spreadsheet models three scenarios with these results:

| Scenario | CAPEX | Annual Savings | Simple ROI | Payback |
|----------|-------|---------------|------------|---------|
| **A. Solar Only** (300 kW, 4h/day, 300 days) | ₱14,000,000 | ₱3,600,000 | 25.7%/yr | ~3.89 yr |
| **B. Battery Only** (400 kWh LFP, +1h/day) | ₱3,200,000 | ₱900,000 | 28.1%/yr | ~3.56 yr |
| **C. Combined** (Solar + Battery) | ₱17,200,000 | ₱4,500,000 | 26.2%/yr | ~3.82 yr |

Loan example from spreadsheet: ₱14,000,000 principal @ 12% annual over 60 months = ₱311,422.27/month, total payable ₱18,685,336.06, interest ₱4,685,336.06.

---

## 7. Peak Sun Hours (PSH) Calculator & Reference

### 6.1 Purpose
Help users determine their location's peak sun hours without external research. Accessible as a dedicated reference page (`sunhours.html`) linked from the Peak Sun Hours input field in Section 2.

### 6.2 What is a Peak Sun Hour?

A Peak Sun Hour (PSH) is **not** a literal count of daylight hours. It is a measurement of solar *energy intensity*:

> **1 PSH = 1 hour of sunlight at 1,000 W/m² (Standard Test Condition)**

Example: 500 W/m² for 2 hours in the morning = 1 PSH.

The raw geographic average for the Philippines is **4.5–5.5 hours** depending on region, but **4.0 hours** is the standard conservative baseline used by Philippine solar installers to account for:
- Cloud cover and rainy seasons (Habagat monsoon)
- Panel degradation over time
- Wiring and inverter losses
- Temperature derating

### 6.3 PSH Formula

**Basic formula:**
```
PSH = Total Daily Solar Insolation (Wh/m²) / 1,000 W/m²
```

Since 1,000 Wh = 1 kWh, if a database gives insolation in kWh/m²/day, **PSH equals that number directly**.

**Rigorous definition (integral form):**
```
PSH = ∫(sunrise to sunset) G(t) / G_STC dt

Where:
  G(t)   = actual solar irradiance at time t (W/m²)
  G_STC  = standard reference irradiance (1,000 W/m²)
```

### 6.4 In-App Calculator

The app includes a modal calculator accessible from the Peak Sun Hours field via a "Calculate PSH" button.

#### Input Fields

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `region` | select | "Metro Manila" | Philippine regions: NCR, CAR, Region I-XII, NIR, BARMM |
| `cityMunicipality` | select | dynamic | Populated based on region selection |
| `roofOrientation` | select | "South" | South, Southeast, Southwest, East, West, North |
| `roofTiltAngle` | select | "Latitude" | Flat (0-10°), Standard (10-20°), Latitude-matched, Steep (30-45°) |
| `latitude` | number | auto | Auto-populated from city; user can override |

#### Base PSH by Region (annual average)

| Region | Base PSH | Approx. Latitude | Cities Reference |
|--------|----------|------------------|------------------|
| Metro Manila (NCR) | 4.0 | 14.6° N | Manila, Quezon City, Makati |
| Region I (Ilocos) | 4.5 | 17.6° N | Laoag, Vigan, Dagupan |
| Region II (Cagayan Valley) | 4.3 | 17.5° N | Tuguegarao, Santiago |
| Region III (Central Luzon) | 4.4 | 15.5° N | Angeles, Olongapo, Cabanatuan |
| Region IV-A (Calabarzon) | 4.0 | 14.1° N | Calamba, Batangas City, Lipa |
| Region IV-B (Mimaropa) | 4.2 | 12.0° N | Puerto Princesa, Calapan |
| Region V (Bicol) | 3.9 | 13.4° N | Legazpi, Naga, Iriga |
| Region VI (Western Visayas) | 4.1 | 10.7° N | Iloilo City, Bacolod |
| Region VII (Central Visayas) | 4.2 | 10.3° N | Cebu City, Dumaguete |
| Region VIII (Eastern Visayas) | 4.0 | 11.0° N | Tacloban, Ormoc |
| Region IX (Zamboanga Peninsula) | 4.3 | 7.8° N | Zamboanga City, Dipolog |
| Region X (Northern Mindanao) | 4.1 | 8.5° N | Cagayan de Oro, Iligan |
| Region XI (Davao) | 4.2 | 7.1° N | Davao City, Tagum |
| Region XII (Soccsksargen) | 4.3 | 6.5° N | General Santos, Koronadal |
| Region XIII (Caraga) | 3.9 | 8.9° N | Butuan, Surigao |
| Cordillera (CAR) | 4.0 | 16.4° N | Baguio, Benguet |
| Negros Island Region | 4.1 | 9.6° N | Dumaguete, Bacolod |
| BARMM | 4.4 | 7.0° N | Cotabato City, Marawi |

#### Orientation Adjustment

Because the Philippines is north of the equator (4°–21° N), panels should face **South** for maximum yield.

| Orientation | Adjustment | Notes |
|-------------|-----------|-------|
| South | +0.0 hrs | Optimal for Northern Hemisphere |
| Southeast | -0.2 hrs | Slight morning bias |
| Southwest | -0.2 hrs | Slight afternoon bias |
| East | -0.4 hrs | Morning sun only |
| West | -0.4 hrs | Afternoon sun only |
| North | -0.6 hrs | Worst case; avoid if possible |

#### Tilt Angle

**Rule of thumb:** Optimal tilt angle ≈ your latitude for year-round production.

```
Optimal Tilt = Latitude ± 5°

For Metro Manila (14.6° N):
  Year-round optimal: 15°
  Dry season (Nov-Apr): Latitude - 15° = ~0° (flatter)
  Wet season (May-Oct): Latitude + 15° = ~30° (steeper, sheds rain)
```

| Tilt Category | Angle Range | PSH Adjustment | Best For |
|---------------|------------|----------------|----------|
| Flat | 0–10° | -0.1 hrs | Flat roofs, easier install |
| Standard | 10–20° | +0.0 hrs | Most Philippine roofs |
| Latitude-matched | Latitude ± 5° | +0.1 hrs | Optimal year-round |
| Steep | 30–45° | -0.2 hrs | Rain shedding, typhoon areas |

#### Calculated Output

```
Estimated PSH = Base PSH (from region)
              + Orientation Adjustment
              + Tilt Adjustment

Example: Cebu City, South-facing, Latitude-matched tilt
  = 4.2 + 0.0 + 0.1
  = 4.3 PSH
```

Modal shows a "Use this value" button that populates the Section 2 `peakSunHoursPerDay` field.

### 6.5 Dedicated Reference Page (`sunhours.html`)

A separate static page linked from the PSH tooltip and modal, containing:

1. **What is PSH** — full explanation with the bell-curve concept
2. **Basic & rigorous formulas** — simplified and integral forms
3. **Extraterrestrial Radiation formula** (latitude-based theoretical maximum):
   ```
   H₀ = (24 × 60 / π) × G_sc × d_r × (ω_s × sin(φ) × sin(δ) + cos(φ) × cos(δ) × sin(ω_s))

   Where:
     φ      = Latitude (radians)
     G_sc   = Solar constant (1,367 W/m²)
     d_r    = Inverse relative Earth-Sun distance (varies by day of year)
     δ      = Solar declination (Earth's tilt, varies by day)
     ω_s    = Sunset hour angle = arccos(-tan(φ) × tan(δ))
   ```
   Note: For Philippines (~13–15° N), this gives 9–10 theoretical PSH — actual ground-level is 4–5 PSH due to atmosphere and weather.

4. **Hargreaves-Samani practical model** (latitude + temperature):
   ```
   R_s = k_Rs × √(T_max - T_min) × H₀

   Where:
     R_s    = Actual solar radiation (ground-level PSH)
     H₀     = Extraterrestrial radiation (from latitude formula)
     T_max  = Daily maximum temperature
     T_min  = Daily minimum temperature
     k_Rs   = 0.16 (inland) or 0.19 (coastal Philippines)
   ```

5. **Why satellite data beats formulas** — Habagat/Amihan seasonal variation, 20-year satellite averages

6. **Optimal tilt angle formula:**
   ```
   Year-round: Tilt ≈ Latitude
   Summer optimization: Tilt = Latitude - 15°
   Winter optimization: Tilt = Latitude + 15°
   ```
   All panels in the Philippines should face **South** (toward the equator from the Northern Hemisphere).

7. **External PSH data sources** (with instructions):

| Source | URL | How to Use |
|--------|-----|-----------|
| **Global Solar Atlas** (World Bank) | globalsolaratlas.info | Search location → read GHI (kWh/m²/day) = PSH |
| **NREL PVWatts Calculator** | pvwatts.nrel.gov | Enter address → "Solar Radiation (kWh/m²/day)" month-by-month |
| **Solargis Philippines** | solargis.com/maps-and-gis-data/download/philippines | High-res solar radiation maps |

### 6.6 Peak Sun Hours Tooltip (in Section 2)

The tooltip on the `peakSunHoursPerDay` field displays:

```
Peak Sun Hours (PSH) = equivalent hours of full sun (1,000 W/m²) per day.
Philippine average: 4.0–4.5 hours/day (conservative baseline).
Raw geographic potential: 4.5–5.5 hours/day.

Using 4.0 hrs accounts for clouds, rain, panel losses, and degradation.

[Calculate PSH] → opens in-app calculator modal
[Learn More]    → opens sunhours.html reference page

Data sources:
  Global Solar Atlas: globalsolaratlas.info
  NREL PVWatts: pvwatts.nrel.gov
```

---

## 8. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Markup | HTML5 semantic elements | PWA baseline, no build step |
| Styling | Tailwind CSS via CDN | Rapid responsive layout, no build step |
| Logic | Vanilla JavaScript (ES2022 modules) | Zero dependencies, offline-first |
| PWA | `manifest.json` + `sw.js` | Offline caching, installability |
| State | Single reactive `state` object with `Proxy`-based change detection | Real-time recalc on every input |
| Icons | Inline SVG or emoji fallback | No icon font dependency |
| Theming | CSS custom properties + class-based dark mode | Toggle between light/dark themes |

**Not using:** React, Vue, npm, any backend/API.

---

## 9. File Structure

```
solarcalc-ph/
├── index.html              # Single page app shell
├── sunhours.html           # Peak Sun Hours reference page (standalone)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── css/
│   ├── custom.css          # Custom overrides
│   └── themes.css          # Light/dark theme variables
├── js/
│   ├── app.js              # Entry point: init state, bind events, render
│   ├── state.js            # Reactive state object + Proxy watcher
│   ├── calc.js             # Pure calculation functions (no DOM)
│   ├── ui.js               # DOM manipulation, rendering, tooltips
│   ├── onboarding.js       # Modal/guide logic
│   ├── themes.js           # Theme toggle (night/day)
│   ├── layout.js           # Phone/Desktop layout toggle
│   ├── sunhours.js         # Sun hours calculator logic
│   └── format.js           # Currency/number formatting helpers
├── data/
│   └── philippine-sun-hours.json  # Region/city sun hours data
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── tests/
│   └── calc.test.js        # Unit tests (console.assert)
└── README.md
```

---

## 10. UI Requirements

### 9.1 Layout

#### Default Responsive Behavior
- **Mobile (< 768px):** Single column, collapsible accordion sections, sticky bottom KPI sheet
- **Tablet (768–1023px):** Single column, wider inputs, KPI below form
- **Desktop (≥ 1024px):** Two-column — inputs (60%) left, KPI dashboard sticky sidebar (40%) right

#### Manual Layout Toggle
Users can override the default layout with a toggle in the header:

| Toggle State | Behavior |
|--------------|----------|
| **Phone** 📱 | Forces single-column vertical layout regardless of screen width |
| **Desktop** 🖥️ | Forces two-column sidebar layout (if screen permits) or maximized single column |
| **Auto** (default) | Follows responsive breakpoints above |

**Implementation:** The layout toggle sets a `data-layout` attribute on the body/container:
```html
<body data-layout="auto">  <!-- auto | phone | desktop -->
```

CSS responds to this attribute:
```css
/* Phone mode - always stacked */
[data-layout="phone"] .kpi-sidebar { position: relative; }

/* Desktop mode - side by side */
[data-layout="desktop"] .kpi-sidebar { position: sticky; }
```

### 9.2 Results Dashboard

The Results Dashboard is the main summary view. Each KPI references back to the section it derives from, so users can trace any number back to its source inputs.

| # | KPI | Format | Source Section | Color Coding |
|---|-----|--------|---------------|-------------|
| 1 | Projected Annual Cost | ₱ #,###,### /yr | Section 1: Status Quo | Red (current cost baseline) |
| 2 | Projected Monthly Cost | ₱ #,###,### /mo | Section 1: Status Quo | Red (current cost baseline) |
| 3 | Total CAPEX | ₱ #,###,### | Section 2 + 3: PV + Battery | — |
| 4 | Annual Generation | #,### kWh/yr | Section 2: PV System | — |
| 5 | Annual Savings | ₱ #,###,### /yr | Section 1 rate × Section 2 generation | Green if > 0 |
| 6 | Simple ROI | ##.#% /yr | CAPEX vs Savings | Green ≥ 15%, Yellow 8–14.9%, Red < 8% |
| 7 | Payback Period | #.# years | CAPEX vs Savings | Green ≤ 5, Yellow 5.1–8, Red > 8 |
| 8 | Monthly Savings | ₱ #,###,### /mo | Annual Savings ÷ 12 | — |
| 9 | Monthly Amortization | ₱ #,###,### /mo | Section 4: Financing | Show only if loan > 0 |
| 10 | Net Monthly Cash Flow | ₱ #,###,### /mo | Savings − Amortization | Green if +, Red if −. Show only if loan > 0 |
| 11 | Total Interest Paid | ₱ #,###,### | Section 4: Financing | Show only if loan > 0 |

**Dashboard-to-Section Navigation:** Each KPI card is tappable/clickable. Tapping a KPI scrolls to and briefly highlights the source section, so users can adjust the relevant inputs directly.

### 9.3 Design System

#### Light Theme (Default)
- **Primary color:** `#0f766e` (teal-700)
- **Background:** `#f9fafb` (gray-50)
- **Card background:** `#ffffff`
- **Text primary:** `#111827` (gray-900)
- **Text secondary:** `#6b7280` (gray-500)
- **Border:** `#e5e7eb` (gray-200)

#### Dark Theme (Night Mode) — High Contrast
- **Primary color:** `#14b8a6` (teal-500)
- **Background:** `#0f172a` (slate-900)
- **Card background:** `#1e293b` (slate-800)
- **Text primary:** `#f8fafc` (slate-50) — brightest for headings
- **Text secondary/labels:** `#e2e8f0` (slate-200) — high contrast for labels
- **Text muted:** `#94a3b8` (slate-400) — for less important text
- **Border:** `#475569` (slate-600) — visible but not harsh

**Accessibility Requirement:** All text in dark mode must meet WCAG AA contrast ratio (4.5:1 minimum). Labels and input text use `#e2e8f0` on `#1e293b` background (contrast ratio ~11:1).

#### Common
- **Font:** Inter via Google Fonts, fallback system-ui
- **KPI values:** 28px bold (desktop), 22px (mobile)
- **Border radius:** `rounded-xl` cards, `rounded-lg` inputs

### 9.4 Theme Toggle

Location: Header bar, right side

```
☀️ / 🌙  [Toggle Switch]
```

**Behavior:**
- Click toggles between light and dark themes
- Icon changes: ☀️ for light mode, 🌙 for dark mode
- Preference saved to `localStorage`
- On load, checks:
  1. Saved preference in `localStorage`
  2. System preference via `prefers-color-scheme`
  3. Defaults to light mode

**Implementation:**
```javascript
// Apply theme by setting class on html element
html.classList.toggle('dark', isDarkMode);
```

```css
/* Tailwind dark mode classes */
.dark .card { @apply bg-slate-800 border-slate-700; }
```

---

## 11. Accessibility Requirements

- All inputs have associated `<label>` elements
- Tooltips use `role="tooltip"` and `aria-describedby`
- KPI color coding supplemented with text labels
- Modal uses `<dialog>` with focus trapping
- Minimum touch target: 44×44px
- Keyboard navigation through all inputs
- `prefers-reduced-motion` support
- Theme respects `prefers-color-scheme` media query
- Layout toggle has clear visual state

---

## 12. Milestones & Deliverables

Development is organized into 6 milestones. Each milestone produces a reviewable, testable deliverable. **You should review and test at the end of each milestone before proceeding.**

---

### Milestone 1: Calculation Engine (MVP Foundation)
> **Goal:** All math works correctly with no UI. Verifiable via command line.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 1.1 | `calc.js` — pure calculation functions | All formulas from Section 5.2 implemented |
| 1.2 | `tests/calc.test.js` — unit tests | `node tests/calc.test.js` passes all assertions |
| 1.3 | `format.js` — currency/number formatting | `formatCurrency(146000)` → `"₱146,000.00"` |
| 1.4 | `state.js` — reactive state with Proxy | Changing any field triggers registered callback |

**Review checklist:**
- [ ] `node tests/calc.test.js` — all pass
- [ ] Basic payback: 10kW, ₱10/kWh, 4 PSH, 365 days → CAPEX ₱300,000, Payback ~2.05yr
- [ ] Amortization: ₱14M, 12%, 60mo → ₱311,422.27/mo
- [ ] Division-by-zero guards work (0 savings → Infinity payback)
- [ ] Projected monthly cost = annual cost / 12

---

### Milestone 2: Core UI + Section Forms (MVP Usable)
> **Goal:** All 4 sections render with inputs. Each section shows its own inline results panel. Results Dashboard aggregates all KPIs. Real-time recalculation on every input change.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 2.1 | `index.html` shell + Tailwind CDN + `manifest.json` | Opens in browser with header and empty sections |
| 2.2 | Section 1 — Status Quo form + **Section 1 Results** | Rate, schedule, daily consumption inputs; inline annual + monthly cost |
| 2.3 | Section 2 — PhotoVoltaic System form + **Section 2 Results** | PV inputs; inline PV cost, daily/annual generation |
| 2.4 | Section 3 — Battery Storage form + **Section 3 Results** | Battery inputs; inline battery kWh, cost, extra PV needed |
| 2.5 | Section 4 — Financing form + **Section 4 Results** | Loan inputs; inline amortization, total cost, interest |
| 2.6 | Results Dashboard with section references | All 11 KPIs display; tapping KPI scrolls to source section |

**Review checklist:**
- [ ] All 18 input fields render with correct labels, defaults, and units
- [ ] Each section shows its own results panel that updates in real time
- [ ] Results Dashboard shows all 11 KPIs
- [ ] Tapping a KPI card scrolls to the source section
- [ ] Projected Annual Cost AND Monthly Cost display in Section 1 results
- [ ] Annual Bill override updates both annual and monthly projections
- [ ] Battery section shows "No battery needed" when load/duration = 0
- [ ] Financing section shows "Cash purchase" when loan = 0
- [ ] No console errors

---

### Milestone 3: Tooltips, Onboarding & Sun Hours
> **Goal:** Contextual help system complete. New users can self-onboard. Sun hours calculator eliminates guesswork.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 3.1 | Tooltip system | Click ❓ → tooltip appears with help text; click away closes |
| 3.2 | Onboarding modal (4 slides) | "Guide" button opens modal; ESC/click-outside closes; focuses first input on dismiss |
| 3.3 | Sun hours calculator modal | Region/city dropdown → outputs peak sun hours; "Use this value" populates Section 2 |
| 3.4 | External reference links in tooltips | Peak sun hours tooltip includes NREL, PVWatts links |

**Review checklist:**
- [ ] All 16 fields have working tooltips with correct copy
- [ ] Only one tooltip open at a time
- [ ] Onboarding modal shows on first visit (sessionStorage flag)
- [ ] All 4 onboarding slides display correctly
- [ ] Sun hours calculator returns reasonable values for all regions
- [ ] Sun hours "Use this value" populates the input and closes modal
- [ ] External links open in new tab

---

### Milestone 4: PWA, Themes & Layout
> **Goal:** App is installable, works offline, and supports night/day mode and layout preferences.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 4.1 | `sw.js` — service worker + offline caching | App loads after going offline |
| 4.2 | Night/Day theme toggle | Toggle switches themes; preference persists in localStorage; respects system preference |
| 4.3 | Phone/Desktop layout toggle | 3-state toggle (Auto/Phone/Desktop) in header; layout changes immediately |
| 4.4 | `themes.css` — light and dark theme variables | All colors, borders, backgrounds adapt to theme |

**Review checklist:**
- [ ] PWA installs on Android Chrome ("Add to Home Screen")
- [ ] PWA installs on iOS Safari
- [ ] App works fully offline after first load
- [ ] Theme toggle switches between light/dark
- [ ] Theme persists across page reloads
- [ ] System `prefers-color-scheme` detected on first load
- [ ] Layout toggle works at all screen widths
- [ ] Desktop mode on small screen shows maximized single column

---

### Milestone 5: Polish & Accessibility (Release Candidate)
> **Goal:** Production-ready. Passes Lighthouse audits. All edge cases handled.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 5.1 | Responsive polish | Visual check at 375px (iPhone SE), 768px (iPad), 1024px+ |
| 5.2 | KPI conditional coloring | ROI/Payback/CashFlow colors match spec thresholds |
| 5.3 | Edge case handling | All scenarios from Section 12 handled gracefully |
| 5.4 | Accessibility audit | Tab order, labels, ARIA roles, focus trapping, touch targets |

**Review checklist:**
- [ ] Lighthouse PWA audit ≥ 90
- [ ] Lighthouse Accessibility audit ≥ 90
- [ ] KPI colors: ROI Green ≥ 15%, Yellow 8–14.9%, Red < 8%
- [ ] KPI colors: Payback Green ≤ 5yr, Yellow 5.1–8yr, Red > 8yr
- [ ] "Did you mean 12%?" hint when rate < 1
- [ ] "Loan exceeds system cost" warning when loan > CAPEX
- [ ] Keyboard navigation through all inputs in section order
- [ ] No console errors on any interaction path
- [ ] `prefers-reduced-motion` disables transitions

---

### Milestone 6: Narrative Summary (Story Mode)
> **Goal:** All computed data is woven into a plain-language narrative that tells the user's solar ROI story from problem to verdict. Readable, shareable, and updates in real time.

| Phase | Deliverable | Acceptance Criteria |
|-------|-------------|---------------------|
| 6.1 | Narrative data assembly | A `generateNarrative(inputs, results)` function in `calc.js` or new `narrative.js` returns structured text blocks from all computed fields |
| 6.2 | Narrative UI panel | Scrollable text panel below Dashboard (or toggle "Show Narrative"); all values formatted with `formatPeso()`, `formatPercent()`, `formatYears()` |
| 6.3 | Conditional sections | Battery section hidden when no battery; Financing section hidden when cash purchase; Verdict tone matches ROI color |
| 6.4 | Section back-references | Tapping a section name in the narrative scrolls to the source input section |
| 6.5 | Copy to Clipboard | "Copy" button exports narrative as formatted plain text |
| 6.6 | Real-time updates | Narrative re-renders on every input change via the same reactive state pipeline |

**Review checklist:**
- [ ] Narrative displays all 7 parts (Problem, Hypothesis, Battery, CAPEX, Return, Financing, Verdict)
- [ ] Battery paragraph hidden when nighttimeLoadKW = 0
- [ ] Financing paragraph hidden when loanPrincipal = 0
- [ ] Verdict text and tone match ROI color thresholds (green/yellow/red)
- [ ] All peso values formatted correctly (₱ with commas)
- [ ] Narrative updates instantly when any input changes
- [ ] "Copy to Clipboard" produces clean plain text
- [ ] Section names in narrative are tappable and scroll to source section
- [ ] Narrative reads coherently for: residential no-battery, commercial with battery, financed vs cash

---

## 13. Edge Cases

| Scenario | Behavior |
|----------|----------|
| All fields at default | KPIs compute normally |
| Empty input | Treat as 0; show "Required" hint for mandatory fields |
| Nighttime load & duration = 0 | "No battery needed" message |
| Loan > CAPEX | Warning: "Loan exceeds system cost" (non-blocking) |
| Rate entered as 0.12 instead of 12 | Hint: "Did you mean 12%?" |
| Division by zero | Return Infinity or 0 per formula; display "—" for Infinity |
| Annual bill overwrites projected cost | Visual indicator that value is user-overwritten |
| Sun hours calculator no selection | Default to national average (4.0 hrs) |
| Theme toggle during onboarding | Immediate theme change, no modal close |
| Layout toggle on small screen | Desktop mode shows maximized single column |

---

## 14. Testing Checklist

- [ ] `node tests/calc.test.js` — all assertions pass
- [ ] PWA installs on Android Chrome
- [ ] PWA installs on iOS Safari
- [ ] App works fully offline after first load
- [ ] All 18 input fields render with correct labels, defaults, tooltips
- [ ] All 11 KPI cards in Results Dashboard render and update in real time
- [ ] Each section displays its own inline results panel
- [ ] KPI cards navigate to source section on tap/click
- [ ] Projected Annual Cost AND Monthly Cost calculate correctly from daily consumption
- [ ] Annual Bill overwrite functions correctly (updates both annual and monthly)
- [ ] Sun hours calculator opens and returns valid values
- [ ] Peak sun hours tooltip shows external links
- [ ] Theme toggle switches between light/dark modes
- [ ] Theme preference persists across reloads
- [ ] Layout toggle switches between phone/desktop modes
- [ ] Responsive layout correct at 375px, 768px, 1024px+
- [ ] Onboarding modal opens/closes properly
- [ ] No console errors
- [ ] Lighthouse PWA ≥ 90
- [ ] Lighthouse Accessibility ≥ 90

---

## Changelog

### v1.4.0 (2026-03-16) — Battery Section Restructure
- **Major Restructure:** Battery Storage section (Section 3) reorganized with new input fields
  - **Moved:** `batteryPricePerKWh` from Section 2 to Section 3 (now a battery-specific input)
  - **Added:** `batteryCapacityKWh` input field — user-defined battery size (not auto-calculated from load)
  - **Added:** `pvForBatteryKW` input field — dedicated PV capacity for battery charging
  - **Added:** `dailyChargeCapacityKWh` computed field — shows how much the allocated PV can charge per day
  - **Updated:** `batteryChargePercent` formula now uses user inputs: `(pvForBatteryKW × peakSunHours) / batteryCapacityKWh × 100`
  - **Updated:** `batteryCost` formula now uses user input: `batteryCapacityKWh × batteryPricePerKWh`
  - **Updated:** `extraSolarCost` formula: `pvForBatteryKW × solarPricePerKW` (replaces calculated extraSolarForBatteryKW)
  - **Reference only:** Nighttime kWh/Hr and Nighttime Duration now provide guidance for battery sizing but don't auto-populate Battery Capacity
- **Updated:** Section 2 Results now shows **PV Total Capacity** (`solarCapacityKW + pvForBatteryKW`) as first line
- **Updated:** Pricing philosophy — Solar Price/kW and Battery Price/kWh are now **editable defaults** (suggestions, not locked values)
- **Updated:** Residential preset defaults — 5 kWh/day consumption, 7 days/week operation, 12 kWh battery, 3 kW PV for battery, ₱15/kWh electricity rate (uses app default)
- **Updated:** Commercial preset defaults — 100 kWh/day consumption (100 employees × 1 kWh/person), 5 days/week operation, 180 kWh battery, 45 kW PV for battery, ₱15/kWh electricity rate (uses app default)
- **Removed:** Preset-specific electricity rates (₱20/kWh residential, ₱15/kWh commercial) — both now use the app default ₱15/kWh with guidance for users to adjust based on actual bills
- **Updated:** Input field count from 16 to 18 (added batteryCapacityKWh and pvForBatteryKW)
- **Updated:** Narrative (Story Mode) Part 3 to reflect new battery input structure
- **Updated:** All preset tables to include new battery fields with calculated examples
- **Updated:** PRD version to 1.4.0

### v1.3.0 (2026-03-16)
- **Added:** Section 5 "Section-by-Section Explanation" — detailed walkthrough of all 4 input sections with user stories, formulas, and examples
- **Added:** `annualConsumptionKWh` computed field — daily kWh × operating days/year (consumption chain)
- **Added:** `dailySavings` computed field — daily generation × electricity rate (savings chain in Section 2)
- **Added:** PV System → CAPEX linkage: Total CAPEX = PV System (Section 2) + Battery Storage (Section 3)
- **Added:** Annual Savings tooltip explanation: dailySavings × operatingDaysPerYear
- **Added:** Simple ROI and Payback clarity: ROI = Annual Savings ÷ CAPEX; Payback = inverse of ROI
- **Added:** Monthly Savings note: Annual Savings ÷ 12
- **Added:** Electricity rate benchmarks table (Residential ₱11–13, Commercial ₱9–11, Industrial ₱7–9)
- **Expanded:** Section 7 PSH Calculator into comprehensive reference (formulas, theory, data sources)
- **Added:** `sunhours.html` standalone reference page with PSH explanation, latitude formulas, tilt angle guidance, regional data, and external data source links
- **Added:** Section 5.5 "The Narrative" — 7-part plain-language story mode (Problem → Hypothesis → Evidence → Verdict)
- **Added:** Milestone 6 "Narrative Summary (Story Mode)" with review checklist
- **Added:** Battery solar allocation % — shows what percentage of battery can be charged by allocated solar
- **Updated:** Development milestones from 5 to 6
- **Updated:** PRD version to 1.3.0

### v1.2.0 (2026-03-16)
- **Renamed:** "Solar System" → "PhotoVoltaic System" throughout all documents
- **Added:** Per-section inline results panels (each section shows its own computed outputs)
- **Added:** Projected Monthly Cost (`projectedAnnualCost / 12`) alongside annual cost
- **Added:** Results Dashboard KPI-to-section navigation (tap KPI → scroll to source section)
- **Added:** Intermediate computed fields: `pvSystemCost`, `totalPVCapex`, `dailyGenerationKWh`, `batteryCost`
- **Updated:** Results Dashboard expanded from 9 to 11 KPIs with source section references
- **Updated:** Computed fields table now includes Section column for traceability

### v1.1.0 (2026-03-16)
- **Added:** Projected Annual Cost calculation in Status Quo section
- **Added:** Daily Energy Consumption input field
- **Added:** Sun Hours Per Day Calculator with Philippine region data
- **Added:** Peak sun hours tooltip with external reference links (Google Project Sunroof, NREL)
- **Added:** Night/Day theme toggle with system preference detection
- **Added:** Phone/Desktop layout toggle for manual layout control
- **Moved:** Dark mode from "Out of Scope" to "In Scope"
- **Updated:** File structure to include `themes.js`, `layout.js`, `sunhours.js`, and `philippine-sun-hours.json`
- **Updated:** KPI Dashboard to include Projected Annual Cost
- **Updated:** Implementation phases to include new features
