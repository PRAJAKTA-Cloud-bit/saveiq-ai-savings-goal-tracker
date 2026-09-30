# 💰 SaveIQ — AI Savings Goal Tracker

> An AI-powered personal finance application that helps users create savings goals, track financial progress,
> generate personalised financial recommendations with **Groq AI (Llama 3.3 70B)**, and automate deadline
> reminders through the **Gmail** service.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-F55036)
![License](https://img.shields.io/badge/License-MIT-10b981)

---

## 📸 Screenshots

| Dashboard | Goals |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Goals](screenshots/goals.png) |

| AI Insights | Mobile |
|---|---|
| ![AI Insights](screenshots/ai-insights.png) | ![Mobile dashboard](screenshots/mobile-dashboard.png) |

| Mobile goals | Mobile new-goal sheet |
|---|---|
| ![Mobile goals](screenshots/mobile-goals.png) | ![New goal](screenshots/mobile-new-goal.png) |

---

## 📌 What is SaveIQ?

SaveIQ is a personal finance management system built to help users **create savings goals**, **track financial
progress**, and **improve saving discipline** through intelligent recommendations and automation.

It ships as **one self-contained HTML file** — no build step, no npm install, no framework — and runs in two modes:

| Mode | Storage | AI | Email |
|---|---|---|---|
| **Standalone** (open `index.html`) | Browser `localStorage` | Groq via direct API, or built-in local engine | `mailto:` draft |
| **Google Apps Script** (deploy as Web App) | **Google Sheets** | Groq via `UrlFetchApp` (key stays server-side) | **Gmail** (automated) |

The app **detects its environment automatically** — paste the same file into Apps Script alongside `backend.gs`
and it switches to Sheets + Gmail + the daily audit trigger with no code changes.

---

## ✨ Features

### 🎯 Savings Goal Management
- Create goals with **Goal Name, Target Amount, Initial Savings, Deadline, Purpose and Alert Email**
- **17 purpose categories** with dedicated icons and tailored AI advice (Emergency Fund, Laptop, Vacation,
  Education, Vehicle, Home, Wedding, Investment, Health, Gift/Festival…)
- **Live preview** while creating a goal — see starting progress, remaining amount, timeline and required daily pace
  *before* you save it
- Full CRUD: create, edit, add contributions, delete — with confirmation dialogs on destructive actions
- Search, status filters and 5 sort orders

### 📊 Financial Discipline Dashboard
Six live analytics KPIs, computed by `getDashboardStats()`:

| Metric | Description |
|---|---|
| **Total Goals** | Every goal being tracked |
| **Total Saved** | Combined savings across all goals |
| **Total Target** | Combined goal value |
| **Active Goals** | Currently in progress |
| **Completed Goals** | Fully funded |
| **Overdue Goals** | Past deadline and incomplete |

Plus:
- **Overall progress ring** and **Savings Health Score** (0–100) per goal and portfolio-wide
- **Cumulative savings area chart** (hand-drawn SVG, 90-day timeline built from real deposit history)
- **Per-goal progress bars** with completion percentage
- **Savings momentum** — observed saving pace vs. required pace, and a projected completion date
- **Deadline reminders panel** — every goal that is overdue, due within 7 days, or projected to miss

### 🤖 AI Financial Recommendations
`getAIInsights()` builds a structured prompt from the goal's real numbers — target, saved, remaining, deadline,
days remaining, purpose, completion %, observed pace, required pace and health score — then asks
**Groq Cloud (`llama-3.3-70b-versatile`)** for a four-section response:

1. **Savings Progress Assessment** — where you actually stand, using your numbers
2. **Budgeting Plan** — concrete INR amounts per day/week, automation and windfall strategy
3. **Smart Tips** — purpose-specific advice (11 tailored tip sets)
4. **Motivation** — contextual encouragement based on progress band

**Three-tier resilience** so insights *always* work:

```
Tier 1  Google Apps Script → Groq (key server-side, no CORS)     ← deployed mode
Tier 2  Browser → Groq API directly (key in localStorage)        ← standalone + key
Tier 3  Built-in SaveIQ Smart Local engine (deterministic, offline) ← always available
```

If Tier 2 fails (bad key, quota, offline) the app transparently falls back to Tier 3 and tells you why.

### 🔔 Automation, Alerts & Notifications
- **`dailyAuditTrigger()`** — a Google Apps Script time-driven trigger that runs every day at 08:00, scans every
  goal, and evaluates deadline proximity, completion status, remaining balance and alert eligibility
- **Gmail deadline reminders** containing the goal summary, progress %, remaining amount, days remaining,
  recommended daily/weekly saving and deadline messaging
- **One reminder per deadline cycle** — `Alert Sent` is tracked to prevent spam
- **In-app "Run daily audit"** button so you can demo the whole automation flow without waiting for the trigger
- In Apps Script mode emails send automatically; standalone mode opens a pre-filled mail draft

### 🎨 UI / UX
- **Dark glassmorphism** fintech design system (CSS custom properties, gradient mesh background, glass panels)
- **Mobile-first responsive** — desktop sidebar → phone bottom tab bar, 2-col → 3-col → 6-col KPI grid
- Animated count-up KPIs, progress-bar shimmer, skeleton loaders while AI thinks, modal scale-in, toast notifications
- Custom modal dialogs (never `window.confirm`/`alert`), Esc-to-close, focus rings, ARIA labels,
  `prefers-reduced-motion` support
- **Indian number formatting** — `₹1,50,000` and compact `₹3L` / `₹1.2Cr`
- Empty states, inline field validation, live goal previews, quick-amount chips
- Data management: JSON export / import, demo data, full reset

---

## 🚀 Quick Start

### Option A — Standalone (10 seconds, no setup)

1. Download **`index.html`**
2. **Double-click it** — that's it

Works offline. Data is stored in your browser. No Python, no server, no `static/` folder required.

> 💡 Optional: click **Settings** → paste a free [Groq API key](https://console.groq.com/keys) to enable live
> Llama-3.3-70B insights. Without a key you get the built-in deterministic Smart Local engine.

### Option B — Full stack (Google Sheets + Gmail + automation)

Follow **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for the complete step-by-step walkthrough:

```
script.google.com → new project
  ├── Code.gs      ← paste backend.gs
  ├── Index.html   ← paste index.html   (the HTML file must be named "Index")
  ├── Script properties → GROQ_API_KEY = gsk_...
  ├── Run setup()        (creates the Goals sheet + daily trigger)
  └── Deploy → Web app → Execute as "Me", Access "Anyone"
```

---

## 🏗️ Technical Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND  ·  index.html  (HTML5 + CSS3 + vanilla JavaScript)    │
│                                                                  │
│   Goal Creation Form   Dashboard Analytics   AI Insights         │
│   Goal Cards           Progress Bars         Action Buttons       │
│                                                                  │
│   Storage adapter  ──►  google.script.run  OR  localStorage      │
└───────────────────────────────┬──────────────────────────────────┘
                                │  google.script.run (Apps Script mode)
┌───────────────────────────────▼──────────────────────────────────┐
│  BACKEND  ·  backend.gs  (Google Apps Script)                    │
│                                                                  │
│   addGoal()  getAllGoals()  updateSavings()  deleteGoal()        │
│   getDashboardStats()        financial calculations              │
│   getAIInsights()    ──►     prompt construction                 │
│   dailyAuditTrigger()        deadline analysis                   │
│   sendDeadlineEmail()        notification handling               │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
     ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
     │  Google   │     │  Groq Cloud │    │   Gmail     │
     │  Sheets   │     │ Llama 3.3   │    │  Service    │
     │ (database)│     │    70B      │    │  (alerts)   │
     └───────────┘     └─────────────┘    └─────────────┘
```

**Data flow — AI insights**

```
Goal Data → Prompt Construction → Groq API Request → Llama-3.3-70B
          → AI Financial Response → Formatted for Dashboard
```

**Data flow — automated alerts**

```
Daily Audit Trigger → Goal Evaluation → Deadline Detection
                    → Alert Condition Validation → Gmail Notification
```

---

## 🗄️ Database Schema (Google Sheets → `Goals`)

| Column | Type | Description |
|---|---|---|
| `ID` | string | Unique goal id (`G…`) |
| `Goal Name` | string | Goal title |
| `Target Amount` | number | Amount to save |
| `Saved Amount` | number | Amount saved so far |
| `Deadline` | date | Target completion date |
| `Purpose` | string | Goal category |
| `Created At` | datetime | Creation timestamp |
| `Email` | string | Alert recipient |
| `Alert Sent` | boolean | Reminder already delivered |
| `Deposits` | JSON | Contribution history `[{at, amount}]` |

> The `Deposits` column powers the cumulative savings chart and observed-pace calculation.
> It is omitted gracefully if you use the 9-column subset from the original specification.

---

## 🧮 Financial Calculation Logic

| Calculation | Formula |
|---|---|
| Completion % | `saved ÷ target × 100`, clamped 0–100 |
| Remaining Amount | `max(0, target − saved)` |
| Days Left | `deadline − today` (in days) |
| Status | `completed` if `saved ≥ target`, else `overdue` if `daysLeft < 0`, else `active` |
| Required Daily Pace | `remaining ÷ max(1, daysLeft)` |
| Required Weekly Pace | `required daily × 7` |
| Observed Pace | `total deposited ÷ max(7, days since first deposit)` |
| Projected Completion | `today + remaining ÷ observed pace` |
| On Track | `status === 'completed'` **or** `projectedDays ≤ daysLeft` |
| Savings Health | `0.45 × progress + 0.30 × pace ratio + 0.10 × time buffer + 0.15 × consistency` |

---

## 🧪 Testing

The repo ships a headless functional test suite that boots `index.html` in a real DOM (jsdom) and exercises
the whole engine — calculations, CRUD, rendering, validation and flows.

```bash
cd saveiq
npm install          # installs jsdom (dev dependency only)
npm test
```

Expected output:

```
  PASS 114   FAIL 0
```

Coverage includes:

- ✅ Boot and render with zero uncaught JS errors
- ✅ Financial core — progress, remaining, days left, per-day/per-week pace, status transitions,
  zero-target divide-by-zero guard, `dueSoon` boundary at 7 days
- ✅ Indian currency formatting
- ✅ CRUD — `addGoal`, `getAllGoals`, `updateSavings`, `deleteGoal`
- ✅ Dashboard analytics — totals, active/completed/overdue counts, health score
- ✅ Daily audit trigger — overdue detection, sorting, completed-goal exclusion
- ✅ Local AI engine — all four sections, real INR figures, goal name interpolation
- ✅ UI interactions — view switching, filtering, sorting, modal open/validate/submit, live preview
- ✅ Settings persistence, Groq mode switching, data management
- ✅ Delete flow integrity

---

## 📁 Project Structure

```
SaveIQ/
├── index.html            # ⭐ The entire application (HTML + CSS + JS, self-contained)
├── backend.gs            # Google Apps Script backend (Sheets CRUD, Groq AI, Gmail, triggers)
├── README.md             # This file
├── SETUP_GUIDE.md        # Full step-by-step deployment walkthrough
├── GITHUB_UPLOAD.md      # Exact git commands to publish this repo
├── LICENSE               # MIT
├── .gitignore
├── package.json          # Test harness metadata (dev only)
├── test/
│   └── engine.test.cjs   # Headless functional test suite (114 assertions)
├── assets/
│   ├── logo.svg
│   └── architecture.svg
└── screenshots/          # UI screenshots referenced by the README
```

> **Why one file?** The original specification listed `Index.html` + `styles.css` + `script.js`. Shipping a single
> self-contained `index.html` means the app opens correctly by double-click (separate files break under `file://`
> because relative asset paths are not resolved by Flask/Jinja templating) **and** still drops straight into a
> Google Apps Script project as the `Index` HTML file. Everything is documented and sectioned inside the file.

---

## ⚙️ Configuration

### Groq API key

Get a free key at **<https://console.groq.com/keys>**, then either:

- **Standalone:** Settings → Groq API key → Save (stored in `localStorage`)
- **Apps Script:** Project Settings → **Script properties** → `GROQ_API_KEY = gsk_...` (never in source)

> 🔒 **Never commit your API key.** `backend.gs` reads it from Script Properties; `.gitignore` already excludes `.env`.

### Available models

| Model | Notes |
|---|---|
| `llama-3.3-70b-versatile` | **Default** — best quality/latency balance |
| `llama-3.1-8b-instant` | Fastest, cheapest |
| `openai/gpt-oss-120b` | Large open model |
| `gemma2-9b-it` | Lightweight alternative |

### Automation

```javascript
installDailyTrigger();   // schedule dailyAuditTrigger() at 08:00
removeDailyTrigger();    // remove all audit triggers
runAuditNow();           // run the audit immediately
```

---

## 🖥️ System Requirements

**Hardware** — Intel Core i5 (8th gen+) / AMD Ryzen 5 · 8 GB RAM (16 GB recommended) · 256 GB SSD · 10 Mbps+
internet (20 Mbps recommended for deployments).

**Software** — Windows 10/11, macOS Monterey+, or Ubuntu 20.04+ · latest Chrome / Firefox / Edge ·
VS Code (recommended) · Git · *(only needed for the test suite)* Node.js 18+.

---

## 📋 Project Workflow → Deliverables

| Epic | Deliverable | Status |
|---|---|---|
| **1. Environment & Architecture** | Apps Script project, Groq key, architecture, project structure | ✅ |
| **2. Core Savings Functionality** | `Goals` sheet schema, `addGoal` / `getAllGoals` / `updateSavings` / `deleteGoal`, `getDashboardStats` | ✅ |
| **3. Backend & AI Logic** | Groq integration, `getAIInsights`, prompt construction, financial analysis layer | ✅ |
| **4. Frontend Development** | UI design, responsive dashboard, dynamic goal interactions, analytics rendering | ✅ |
| **5. Automation, Alerts & Validation** | `dailyAuditTrigger`, Gmail alerts, calculation validation, end-to-end testing | ✅ |
| **6. Deployment** | Deployment prep, Web App deployment, production testing, trigger validation | ✅ |

---

## 🔐 Security

- API keys live in **Apps Script Script Properties** (server-side) or browser `localStorage` — never in source
- In Apps Script mode the browser never sees the API key; all Groq calls are proxied by `UrlFetchApp`
- `.gitignore` excludes `.env`, `*.key` and credential files
- All user input is HTML-escaped before rendering (no XSS)
- Destructive actions require an explicit confirmation dialog
- SaveIQ provides **educational savings guidance only** and is not licensed financial advice

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Run `npm test` in `saveiq/` before committing
4. Commit: `git commit -m "feat: add my feature"`
5. Push and open a Pull Request

---

## 📄 License

Released under the **MIT License** — see [LICENSE](LICENSE).

---

<p align="center">
  <strong>SaveIQ — AI Savings Goal Tracker</strong><br/>
  <em>Strengthen financial discipline with intelligent, automated savings management.</em>
</p>
