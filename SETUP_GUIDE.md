# 🛠️ SaveIQ — Setup Guide

Complete, copy-paste walkthrough for both run modes. Follow **Part A** for the 10-second local demo,
or **Part B** for the full Google Sheets + Gmail + automation deployment.

---

## Part A — Standalone mode (no setup)

**What you need:** a web browser. That's it.

1. Download **`index.html`**
2. Double-click the file (or drag it into Chrome / Firefox / Edge)

The app opens with full styling and functionality. Goals are stored in your browser's `localStorage`.

**To enable live AI (optional):**

1. Get a free key at <https://console.groq.com/keys>
2. In the app, go to **Settings → Groq AI Configuration → Groq API key**
3. Paste the key → **Save settings** → **Test connection**
4. The sidebar status changes from *"AI: Smart local mode"* to *"AI: Groq · llama-3.3-70b-versatile"*

> Without a key the app runs the built-in **SaveIQ Smart Local engine** — a deterministic analyser that produces
> the same four-section structure using your real numbers. Everything else works identically.

**Load sample data:** Settings → **Load demo goals** creates 6 realistic goals so you can explore the dashboard,
charts, filters and AI insights immediately.

---

## Part B — Google Apps Script deployment

This gives you **Google Sheets storage + automated Gmail reminders + a daily audit trigger**.

### Prerequisites checklist

| Requirement | Link |
|---|---|
| Google account with Apps Script access | <https://script.google.com> |
| Google Sheets (created automatically by `setup()`) | <https://sheets.google.com> |
| Groq API key | <https://console.groq.com> |
| Code editor / browser | VS Code, Chrome |
| Git (only if publishing to GitHub) | <https://github.com> |

---

### Step 1 — Create the Apps Script project

1. Go to **<https://script.google.com>**
2. Click **New project**
3. Rename it **SaveIQ** (click *Untitled project* in the top-left)

---

### Step 2 — Add the backend file

1. In the left panel you'll see `Code.gs`
2. Select all of its contents and **replace** them with the full contents of **`backend.gs`** from this repo
3. Rename `Code.gs` → keep the name `Code.gs` (the filename doesn't matter; the functions do)

This file provides:

```
addGoal()               getAllGoals()          updateGoal()
updateSavings()         deleteGoal()           replaceAllGoals()
getDashboardStats()     getAlerts()            getAIInsights()
dailyAuditTrigger()     sendDeadlineEmail()    installDailyTrigger()
setup()                 doGet()
```

---

### Step 3 — Add the frontend file (⚠️ name matters)

1. Click the **+** next to *Files* → choose **HTML**
2. Name it exactly **`Index`** → it becomes `Index.html`
3. Delete the placeholder content and paste the **entire contents of `index.html`** from this repo
4. Save (`Ctrl/Cmd + S`)

> The HTML file **must** be called `Index` — `doGet()` serves it via
> `HtmlService.createHtmlOutputFromFile('Index')`.

---

### Step 4 — Enable the Google services

In the Apps Script editor left panel → **Services** (**+**) → add:

| Service | Identifier | Why |
|---|---|---|
| **Google Sheets API** | `Sheets` | *(optional)* advanced sheet access |
| **Gmail API** | `Gmail` | advanced Gmail sending |

`backend.gs` already calls `SpreadsheetApp` and `MailApp`, which need **no** service registration.
Registering the advanced services is optional — `sendDeadlineEmail()` uses Gmail when available and
automatically falls back to `MailApp` otherwise.

---

### Step 5 — Configure the Groq API key

**Never hard-code the key in source.** Store it as a script property:

1. **Project Settings** (⚙️ gear icon, left panel)
2. Scroll to **Script properties** → **Add script property**
3. Property: `GROQ_API_KEY` · Value: `gsk_your_key_here`
4. **Save script properties**

`backend.gs` reads it with:

```javascript
PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY')
```

**Reference — the Groq endpoint used**

```javascript
const MODEL   = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
```

---

### Step 6 — Run `setup()` once

1. In the editor's function dropdown select **`setup`**
2. Click **▶ Run**
3. **Authorize** when prompted:
   - *Review permissions* → choose your account
   - *Advanced* → *Go to SaveIQ (unsafe)* → **Allow**
   - Grant: Sheets access, Gmail send, trigger management
4. Check **Execution log** — you should see:
   `SaveIQ setup complete. Sheet "Goals" ready with 1 row(s).`

What `setup()` did:

- Created (or reused) a spreadsheet sheet named **`Goals`** with the 10 required columns
- Styled and froze the header row
- Installed the **daily audit trigger** at 08:00

> `setup()` works even with no spreadsheet bound to the project — Apps Script creates a container
> automatically on first `appendRow`. To use an existing spreadsheet instead, open it and choose
> **Extensions → Apps Script** before pasting the files.

---

### Step 7 — Deploy as a Web App

1. Click **Deploy** → **New deployment**
2. Click the ⚙️ next to *Select type* → choose **Web app**
3. Configure:

| Setting | Value |
|---|---|
| Description | `SaveIQ v2.0` |
| **Execute as** | **Me** *(required — Gmail must send from your account)* |
| **Who has access** | **Anyone** *(or "Anyone with Google account")* |

4. Click **Deploy** → authorize again if prompted
5. Copy the **Web app URL**:
   `https://script.google.com/macros/s/AKfycb.../exec`

Open that URL — SaveIQ loads and now runs in **Google Sheets mode**. The sidebar will read
**"Storage: Google Sheets"**.

---

### Step 8 — Verify the deployment

| Check | How |
|---|---|
| Sheet created | Open the linked spreadsheet → sheet **Goals** with headers |
| Goal creation | Create a goal in the web app → row appears in the sheet |
| Persistence | Reload the web app → goal is still there |
| Savings update | Add savings → `Saved Amount` cell updates |
| Dashboard analytics | KPIs show non-zero totals |
| AI insights | Select goal → **Generate AI insights** → four sections appear |
| Email alert | **Run daily audit** → confirm → reminder email arrives |
| Trigger installed | Apps Script **Triggers** (⏰) → `dailyAuditTrigger` → Daily, 8am–9am |

---

### Step 9 — Redeploying after changes

Apps Script serves the **last deployed version**, not your saved edits:

1. **Deploy** → **Manage deployments**
2. Select the active deployment → **Edit** (✏️)
3. Version → **New version** → **Deploy**

> The Web app URL stays the same, so no re-sharing needed.

---

### Step 10 — Testing the automation manually

From the Apps Script editor:

```javascript
dailyAuditTrigger()   // scan all goals, email anything overdue or due soon
getAlerts()           // inspect which goals qualify
getDashboardStats()   // inspect the computed analytics object
runAuditNow()         // alias for dailyAuditTrigger()
removeDailyTrigger()  // stop the automation
installDailyTrigger() // re-enable it
```

In the web app, the **Run daily audit** button (top bar) exercises the same logic client-side and shows the
results as a toast — useful for demos without waiting for 08:00.

---

## 📧 Email alert format

Automated reminders contain:

```
Subject: SaveIQ: "Bali Vacation" — 5 days left, INR 69,000 to go

GOAL SUMMARY
  Purpose            : Vacation Plan
  Target amount      : INR 90,000
  Saved so far       : INR 21,000
  Progress           : 23.3%
  Remaining balance  : INR 69,000
  Deadline           : 2026-10-05
  Days remaining     : 5

RECOMMENDED SAVING TARGET
  Per day            : INR 13,800
  Per week           : INR 96,600
```

`Alert Sent` is set to `TRUE` after delivery so a goal receives **one reminder per deadline cycle**
(an overdue goal is re-alerted, since it has genuinely failed its deadline).

---

## 🧪 Running the test suite

```bash
cd saveiq
npm install
npm test
```

`test/engine.test.cjs` loads `index.html` into jsdom and runs **114 assertions** across boot, financial
calculations, Indian currency formatting, CRUD, analytics, the audit trigger, the local AI engine,
UI interactions, settings and the delete flow. Expected: `PASS 80  FAIL 0`.

---

## ❓ Troubleshooting

| Symptom | Cause & fix |
|---|---|
| **Page renders unstyled (white, Times font)** | You opened an HTML file that references external `style.css` / `script.js`. Use the single-file `index.html` from this repo — CSS and JS are inlined. |
| `GROQ_API_KEY is not set` | Add the Script Property (Step 5) and re-run. |
| `Script function not found: doGet` | The HTML file isn't named exactly **`Index`**, or `doGet()` is missing from `Code.gs`. |
| Groq `401` / `Invalid API key` | Key is wrong or revoked — regenerate at <https://console.groq.com/keys>. |
| Groq `429` | Free-tier rate limit. The app automatically falls back to the **Smart Local engine** and tells you. |
| Emails not arriving | Check spam; confirm **Execute as: Me**; confirm the goal has an email; run `dailyAuditTrigger()` manually and read the execution log. |
| Trigger not firing | Apps Script triggers are best-effort and can be delayed. Verify under **Triggers**; re-run `installDailyTrigger()`. |
| Sheet empty after creating a goal | You have two deployments/groups. Check which spreadsheet the script is bound to. |
| Browser CORS error on AI insights | Only applies in standalone mode. Use an Apps Script deployment (server-side proxy), or the local engine. |

---

## 🔒 Security notes

- `GROQ_API_KEY` lives in **Script Properties** — never in source, never in the client bundle
- In Apps Script mode all Groq traffic is proxied server-side, so the key never reaches the browser
- `.gitignore` excludes `.env`, `*.key` and credential files
- All rendered user input is HTML-escaped (no XSS)
- Destructive operations require an explicit confirmation dialog
- SaveIQ provides **educational guidance only**; it is not licensed financial advice

---

<p align="center"><strong>SaveIQ — AI Savings Goal Tracker</strong></p>
