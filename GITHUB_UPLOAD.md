# 🚀 Upload SaveIQ to GitHub

Exact, copy-paste steps to publish this project as a GitHub repository.

---

## 0. What you'll upload

```
SaveIQ/
├── index.html            ← the whole application
├── backend.gs            ← Google Apps Script backend
├── README.md
├── SETUP_GUIDE.md
├── GITHUB_UPLOAD.md
├── LICENSE
├── .gitignore
├── package.json
├── test/engine.test.cjs
└── assets/logo.svg
```

---

## Option 1 — Command line (recommended)

### 1.1 Make sure Git is configured

```bash
git --version
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### 1.2 Create the repository on GitHub

1. Go to **<https://github.com/new>**
2. **Repository name:** `saveiq-ai-savings-goal-tracker`
3. **Description:** `AI-powered savings goal tracker — HTML5/CSS3/JS + Google Apps Script + Groq AI + Gmail automation`
4. Choose **Public** (or Private)
5. ⚠️ **Do NOT** tick *Add a README file*, *Add .gitignore*, or *Choose a license* — you already have them
6. Click **Create repository**

### 1.3 Push your files

Open a terminal **inside the SaveIQ folder** (the one containing `index.html`) and run:

```bash
git init
git add .
git commit -m "feat: SaveIQ - AI Savings Goal Tracker v2.0"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/saveiq-ai-savings-goal-tracker.git
git push -u origin main
```

Replace `<YOUR-USERNAME>` with your GitHub username.

> **Authentication:** GitHub no longer accepts account passwords over HTTPS. Use a
> **Personal Access Token** (<https://github.com/settings/tokens> → *Generate new token (classic)* →
> scope `repo`) as the password when prompted. Or use the GitHub CLI (`gh auth login`), or SSH.

### 1.4 Later changes

```bash
git add .
git commit -m "fix: correct EMI rounding"
git push
```

---

## Option 2 — GitHub web upload (no Git installed)

1. Open your new repository
2. Click **Add file → Upload files**
3. Drag in `index.html`, `backend.gs`, `README.md`, `SETUP_GUIDE.md`, `LICENSE`, `.gitignore`, `package.json`
4. Commit message: `feat: initial SaveIQ release` → **Commit changes**
5. Recreate folders (`assets/`, `test/`) by opening them and using **Add file → Upload files** there,
   or use **Add file → Create new file** and type `assets/logo.svg` as the path (the folder is created
   automatically from the `/`)

> ⚠️ Hidden files like `.gitignore` may not appear in your OS file browser. With the command line they are
> included by `git add .` automatically.

---

## Option 3 — GitHub CLI

```bash
gh auth login
gh repo create saveiq-ai-savings-goal-tracker --public --source=. --remote=origin --push
```

That creates the repo and pushes in one command.

---

## 🔐 Before you push — security checklist

- [ ] **No real API key in any file.** The only `gsk_` matches should be the placeholder in `index.html`,
      the fake value in `test/engine.test.cjs`, and the docs below — never a live key.
- [ ] The Groq key lives in **Apps Script → Project Settings → Script properties**, never in source.
- [ ] `.gitignore` present and excludes `.env`, `*.key`, `node_modules/`, `*.log`
- [ ] `node_modules/` not committed (run the test suite locally only)
- [ ] No personal email addresses hard-coded in the source

Verify quickly:

```bash
grep -rn "gsk_" . --exclude-dir=node_modules --exclude-dir=.git
```

Expected output — these three only, and nothing else:

```
./index.html:          placeholder="gsk_…"            ← UI placeholder
./test/engine.test.cjs: 'gsk_test_key_123'            ← fake value used by a test
./GITHUB_UPLOAD.md:    documentation references
```

If you see a key that starts `gsk_` and looks like a real 50+ character token, **do not push** — revoke it
at <https://console.groq.com/keys> and move it to Script Properties.

---

## 📸 Recommended repo polish

**Add screenshots** so the README looks complete:

1. Take these four screenshots:
   - Dashboard with demo data (desktop)
   - AI Insights output
   - Goals page (mobile)
   - New-goal modal (mobile)
2. Save them into `screenshots/`
3. Insert near the top of `README.md`:

```markdown
## 📸 Screenshots

| Dashboard | AI Insights |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Insights](screenshots/insights.png) |

| Goals (mobile) | New Goal (mobile) |
|---|---|
| ![Goals](screenshots/mobile-goals.png) | ![New goal](screenshots/mobile-new-goal.png) |
```

**Add GitHub topics** (repo → ⚙️ next to *About*):
`fintech` `savings-goal-tracker` `google-apps-script` `groq` `llama` `html5` `javascript`
`personal-finance` `ai` `google-sheets` `gmail-automation`

**Add a live demo link** — deploy the Apps Script Web App (see `SETUP_GUIDE.md`) and paste the URL into the
repo's *Website* field.

---

## ✅ Post-push verification

```bash
git log --oneline          # your commit is there
git remote -v              # origin points at your repo
git status                 # "nothing to commit, working tree clean"
```

Then open the repo page and confirm:

- README renders with badges and architecture diagram
- `index.html` is present at the repo root
- Clicking `index.html` → **Raw** → *Save as* gives a working app that opens by double-click

---

## 🏷️ Suggested commit message convention

| Prefix | Use |
|---|---|
| `feat:` | new feature |
| `fix:` | bug fix |
| `docs:` | documentation only |
| `style:` | formatting, no logic change |
| `refactor:` | restructure without behaviour change |
| `test:` | test additions/changes |
| `chore:` | tooling, deps |

Example: `feat: add CSV export for goal history`

---

<p align="center"><strong>SaveIQ — AI Savings Goal Tracker</strong></p>
