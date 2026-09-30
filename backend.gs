/**
 * ============================================================================
 *  SaveIQ — AI Savings Goal Tracker
 *  Google Apps Script backend (backend.gs)
 * ----------------------------------------------------------------------------
 *  Responsibilities
 *    · Goal tracking        addGoal / getAllGoals / updateGoal / deleteGoal
 *    · Financial analytics  getDashboardStats / compute_
 *    · Deadline analysis    getAlerts / dailyAuditTrigger
 *    · AI communication     getAIInsights  ->  Groq Cloud (llama-3.3-70b)
 *    · Notifications        sendDeadlineEmail  ->  Gmail
 *    · Automation           installDailyTrigger / removeDailyTrigger
 *
 *  SETUP
 *    1. Paste this file into Code.gs of a new script.google.com project.
 *    2. Paste index.html into an HTML file named exactly  Index  (Index.html).
 *    3. Project Settings > Script properties -> add  GROQ_API_KEY = gsk_...
 *    4. Run  setup()  once (creates the Goals sheet + daily trigger).
 *    5. Deploy > New deployment > Web app > Execute as "Me", Access "Anyone".
 * ============================================================================
 */

/* ----------------------------- configuration ----------------------------- */
var SHEET_NAME = 'Goals';
var MODEL      = 'llama-3.3-70b-versatile';
var API_URL    = 'https://api.groq.com/openai/v1/chat/completions';
var HEADERS    = [
  'ID', 'Goal Name', 'Target Amount', 'Saved Amount', 'Deadline',
  'Purpose', 'Created At', 'Email', 'Alert Sent', 'Deposits'
];
var ALERT_WINDOW_DAYS = 7;   // send a reminder when the deadline is this close

/* ------------------------------- web app --------------------------------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('SaveIQ — AI Savings Goal Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** One-time bootstrap: sheet, headers, trigger, permissions. */
function setup() {
  var sheet = getSheet_();
  installDailyTrigger();
  log_('SaveIQ setup complete. Sheet "' + SHEET_NAME + '" ready with ' + sheet.getLastRow() + ' row(s).');
  return 'Setup complete';
}

/* --------------------------------- sheet --------------------------------- */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#10b981').setFontColor('#04261b');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 220);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowToGoal_(row) {
  var deposits = [];
  try { deposits = row[9] ? JSON.parse(row[9]) : []; } catch (e) { deposits = []; }
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    target: Number(row[2]) || 0,
    saved: Number(row[3]) || 0,
    deadline: row[4] ? Utilities.formatDate(new Date(row[4]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
    purpose: String(row[5] || 'Other'),
    createdAt: row[6] ? new Date(row[6]).toISOString() : new Date().toISOString(),
    email: String(row[7] || ''),
    alertSent: String(row[8]).toUpperCase() === 'TRUE',
    deposits: deposits,
    insight: null
  };
}

function readAll_() {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .filter(function (r) { return r[0]; })
    .map(rowToGoal_);
}

function findRow_(id) {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function goalToRow_(g) {
  return [
    g.id, g.name, Number(g.target) || 0, Number(g.saved) || 0, g.deadline || '',
    g.purpose || 'Other', g.createdAt || new Date().toISOString(), g.email || '',
    g.alertSent ? 'TRUE' : 'FALSE', JSON.stringify(g.deposits || [])
  ];
}

/* --------------------------------- CRUD ---------------------------------- */
/**
 * Create a savings goal.
 * @param {Object} goal {name,target,saved,deadline,purpose,email}
 * @return {Object} the stored goal
 */
function addGoal(goal) {
  var sheet = getSheet_();
  var now = new Date().toISOString();
  var saved = Number(goal.saved) || 0;
  var record = {
    id: 'G' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 9000 + 1000),
    name: String(goal.name || 'Untitled goal'),
    target: Number(goal.target) || 0,
    saved: saved,
    deadline: deadlineISO_(goal.deadline),
    purpose: goal.purpose || 'Other',
    createdAt: now,
    email: goal.email || '',
    alertSent: false,
    deposits: saved > 0 ? [{ at: now, amount: saved }] : [],
    insight: null
  };
  sheet.appendRow(goalToRow_(record));
  log_('addGoal: ' + record.name + ' (' + record.id + ')');
  return record;
}

/** @return {Array<Object>} every stored goal */
function getAllGoals() {
  return readAll_();
}

/**
 * Patch an existing goal.
 * @param {string} id
 * @param {Object} patch partial goal fields
 */
function updateGoal(id, patch) {
  var row = findRow_(id);
  if (row < 0) throw new Error('Goal not found: ' + id);
  var sheet = getSheet_();
  var existing = rowToGoal_(sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0]);
  var merged = {
    id: existing.id,
    name: patch.name !== undefined ? patch.name : existing.name,
    target: patch.target !== undefined ? Number(patch.target) : existing.target,
    saved: patch.saved !== undefined ? Number(patch.saved) : existing.saved,
    deadline: patch.deadline !== undefined ? patch.deadline : existing.deadline,
    purpose: patch.purpose !== undefined ? patch.purpose : existing.purpose,
    createdAt: existing.createdAt,
    email: patch.email !== undefined ? patch.email : existing.email,
    alertSent: patch.alertSent !== undefined ? !!patch.alertSent : existing.alertSent,
    deposits: patch.deposits !== undefined ? patch.deposits : existing.deposits,
    insight: existing.insight
  };
  sheet.getRange(row, 1, 1, HEADERS.length).setValues([goalToRow_(merged)]);
  log_('updateGoal: ' + merged.name + ' -> saved ' + merged.saved);
  return merged;
}

/**
 * Add a contribution to a goal.
 * @param {string} id
 * @param {number} amount
 */
function updateSavings(id, amount) {
  var goals = readAll_();
  for (var i = 0; i < goals.length; i++) {
    if (goals[i].id === id) {
      var g = goals[i];
      var deposits = (g.deposits || []).concat([{ at: new Date().toISOString(), amount: Number(amount) || 0 }]);
      return updateGoal(id, { saved: (Number(g.saved) || 0) + (Number(amount) || 0), deposits: deposits, alertSent: false });
    }
  }
  throw new Error('Goal not found: ' + id);
}

/** @param {string} id */
function deleteGoal(id) {
  var row = findRow_(id);
  if (row < 0) throw new Error('Goal not found: ' + id);
  getSheet_().deleteRow(row);
  log_('deleteGoal: ' + id);
  return true;
}

/** Replace the whole dataset (used by import / reset / demo seed). */
function replaceAllGoals(list) {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, HEADERS.length).clearContent();
  var rows = (list || []).map(function (g) {
    return goalToRow_({
      id: g.id, name: g.name, target: Number(g.target) || 0, saved: Number(g.saved) || 0,
      deadline: deadlineISO_(g.deadline), purpose: g.purpose || 'Other',
      createdAt: g.createdAt || new Date().toISOString(), email: g.email || '',
      alertSent: !!g.alertSent, deposits: g.deposits || []
    });
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  return true;
}

function deadlineISO_(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/* ------------------------------- analytics -------------------------------- */
function compute_(g) {
  var target = Number(g.target) || 0;
  var saved = Number(g.saved) || 0;
  var remaining = Math.max(0, target - saved);
  var progress = target > 0 ? Math.min(100, Math.max(0, (saved / target) * 100)) : 0;
  var daysLeft = null;
  if (g.deadline) daysLeft = Math.round((new Date(g.deadline + 'T00:00:00') - startOfToday_()) / 86400000);
  var status = 'active';
  if (target > 0 && saved >= target) status = 'completed';
  else if (daysLeft !== null && daysLeft < 0) status = 'overdue';
  // A required pace only exists when there is a future deadline.
  var hasFuture = daysLeft !== null && daysLeft > 0;
  var perDay = (remaining > 0 && hasFuture) ? remaining / daysLeft : 0;
  return {
    target: target, saved: saved, remaining: remaining, progress: progress,
    daysLeft: daysLeft, status: status, perDay: perDay, perWeek: perDay * 7,
    dueSoon: status === 'active' && daysLeft !== null && daysLeft <= ALERT_WINDOW_DAYS
  };
}

function startOfToday_() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * @return {Object} dashboard statistics for every stored goal
 */
function getDashboardStats() {
  var goals = readAll_();
  var s = { total: goals.length, saved: 0, target: 0, active: 0, completed: 0, overdue: 0, atRisk: 0, dueSoon: 0, weekly: 0 };
  goals.forEach(function (g) {
    var m = compute_(g);
    s.saved += m.saved;
    s.target += m.target;
    if (m.status === 'completed') s.completed++;
    else if (m.status === 'overdue') { s.overdue++; s.atRisk++; }
    else { s.active++; s.weekly += m.perWeek; if (m.dueSoon) s.dueSoon++; }
  });
  s.progress = s.target > 0 ? Math.min(100, (s.saved / s.target) * 100) : 0;
  s.remaining = Math.max(0, s.target - s.saved);
  return s;
}

/**
 * @return {Array<Object>} goals needing attention, overdue first
 */
function getAlerts() {
  var out = [];
  readAll_().forEach(function (g) {
    var m = compute_(g);
    if (m.status === 'overdue') out.push({ goal: g, metrics: m, level: 'overdue' });
    else if (m.status === 'active' && m.dueSoon) out.push({ goal: g, metrics: m, level: 'soon' });
  });
  return out.sort(function (a, b) { return (a.metrics.daysLeft || 0) - (b.metrics.daysLeft || 0); });
}

/* ---------------------------------- AI ------------------------------------ */
function getApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!key) throw new Error('GROQ_API_KEY is not set. Add it under Project Settings > Script properties.');
  return key;
}

function buildPrompt_(g) {
  var m = compute_(g);
  var inr = function (n) { return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); };
  return [
    'You are SaveIQ, an expert personal-finance coach for Indian savers. Analyse this savings goal and reply in GitHub-flavoured markdown.',
    '',
    'GOAL DATA',
    '- Goal name: ' + g.name,
    '- Purpose: ' + (g.purpose || 'Other'),
    '- Target amount: ' + inr(m.target) + ' (INR)',
    '- Amount saved so far: ' + inr(m.saved) + ' (INR)',
    '- Remaining balance: ' + inr(m.remaining) + ' (INR)',
    '- Deadline: ' + (g.deadline || 'not set'),
    '- Days remaining: ' + (m.daysLeft === null ? 'no deadline' : m.daysLeft),
    '- Completion: ' + m.progress.toFixed(1) + '%',
    '- Status: ' + m.status,
    '- Required pace to hit the deadline: ' + inr(m.perDay) + ' per day',
    '',
    'Reply with EXACTLY these four markdown headings and nothing else:',
    '## Savings Progress Assessment   (2-3 sentences using the real numbers)',
    '## Budgeting Plan   (4-5 bullet points with concrete INR amounts)',
    '## Smart Tips   (3-4 bullet points tailored to the "' + (g.purpose || 'Other') + '" purpose)',
    '## Motivation   (1-2 warm, specific sentences)',
    '',
    'Rules: use INR amounts, be specific and practical, no preamble, no closing remarks, no disclaimers.'
  ].join('\n');
}

/**
 * Generate AI financial recommendations for one goal via Groq Cloud.
 * @param {Object} goal
 * @return {string} markdown insight text
 */
function getAIInsights(goal) {
  var prompt = buildPrompt_(goal);
  var response = UrlFetchApp.fetch(API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getApiKey_() },
    payload: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: 'You are SaveIQ, an expert personal finance coach. Always answer in well-structured markdown using the exact requested headings.' },
        { role: 'user', content: prompt }
      ]
    }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code !== 200) {
    var msg = 'Groq request failed (HTTP ' + code + ')';
    try { var err = JSON.parse(body); if (err.error && err.error.message) msg = err.error.message; } catch (e) { }
    throw new Error(msg);
  }
  var data = JSON.parse(body);
  var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!text) throw new Error('Groq returned an empty response');
  log_('getAIInsights: generated for ' + goal.name);
  return text;
}

/* ------------------------------ automation -------------------------------- */
/**
 * Daily audit trigger.
 * Scans every goal, evaluates deadline proximity and savings completion, then
 * emails a personalised reminder for any goal that is overdue or due soon.
 * Install with installDailyTrigger(); it runs unattended every day.
 */
function dailyAuditTrigger() {
  var goals = readAll_();
  var sent = 0, checked = 0, skipped = 0;

  goals.forEach(function (g) {
    checked++;
    var m = compute_(g);
    if (m.status === 'completed') { skipped++; return; }
    if (m.status === 'overdue' || m.dueSoon) {
      if (!g.email) { skipped++; log_('audit: no email for "' + g.name + '" — skipped'); return; }
      if (g.alertSent && m.status !== 'overdue') { skipped++; return; }  // one reminder per deadline cycle
      sendDeadlineEmail(g.email, buildSubject_(g, m), buildBody_(g, m));
      updateGoal(g.id, { alertSent: true });
      sent++;
    }
  });

  var summary = 'dailyAuditTrigger: checked ' + checked + ', reminders sent ' + sent + ', skipped ' + skipped;
  log_(summary);
  return summary;
}

function buildSubject_(g, m) {
  if (m.daysLeft !== null && m.daysLeft < 0) return 'SaveIQ: "' + g.name + '" is ' + Math.abs(m.daysLeft) + ' days overdue';
  if (m.daysLeft === 0) return 'SaveIQ: "' + g.name + '" is due today';
  return 'SaveIQ: "' + g.name + '" — ' + m.daysLeft + ' days left, ' + inr_(m.remaining) + ' to go';
}

function buildBody_(g, m) {
  return [
    'Hello,',
    '',
    'This is your SaveIQ daily savings audit for "' + g.name + '".',
    '',
    'GOAL SUMMARY',
    '  Purpose            : ' + (g.purpose || 'Other'),
    '  Target amount      : ' + inr_(m.target),
    '  Saved so far       : ' + inr_(m.saved),
    '  Progress           : ' + m.progress.toFixed(1) + '%',
    '  Remaining balance  : ' + inr_(m.remaining),
    '  Deadline           : ' + g.deadline,
    '  Days remaining     : ' + (m.daysLeft === null ? 'not set' : (m.daysLeft < 0 ? Math.abs(m.daysLeft) + ' days overdue' : m.daysLeft + ' days')),
    '',
    'RECOMMENDED SAVING TARGET',
    '  Per day            : ' + (m.perDay > 0 ? inr_(m.perDay) : 'not applicable (no future deadline)'),
    '  Per week           : ' + (m.perWeek > 0 ? inr_(m.perWeek) : 'not applicable (no future deadline)'),
    '',
    (m.daysLeft !== null && m.daysLeft < 0
      ? 'Your deadline has passed and the goal is still incomplete. Reset the deadline in SaveIQ to a realistic date and restart with the weekly amount above.'
      : 'Your deadline is approaching. A contribution of ' + inr_(m.perWeek) + ' this week keeps the goal on schedule.'),
    '',
    'Open SaveIQ to add a contribution and stay on track.',
    '',
    '— SaveIQ · AI Savings Goal Tracker'
  ].join('\n');
}

function inr_(n) { return 'INR ' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }

/**
 * Send one email through the Gmail service.
 * @param {string} email   recipient
 * @param {string} subject
 * @param {string} body    plain text
 */
function sendDeadlineEmail(email, subject, body) {
  var payload = {
    to: email,
    subject: subject,
    body: body,
    name: 'SaveIQ · AI Savings Goal Tracker'
  };
  // Try the advanced Gmail service, fall back to the built-in MailApp.
  try {
    if (typeof Gmail !== 'undefined' && Gmail.Users && Gmail.Users.Messages) {
      var raw = [
        'To: ' + email,
        'Subject: ' + subject,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body
      ].join('\r\n');
      Gmail.Users.Messages.send({ raw: Utilities.base64EncodeWebSafe(raw).replace(/=+$/, '') }, 'me');
    } else {
      MailApp.sendEmail(payload);
    }
  } catch (e) {
    MailApp.sendEmail(payload);
  }
  log_('email sent to ' + email + ' :: ' + subject);
  return true;
}

/** Install (or re-install) the daily audit trigger at 08:00 local time. */
function installDailyTrigger() {
  removeDailyTrigger();
  ScriptApp.newTrigger('dailyAuditTrigger').timeBased().atHour(8).everyDays(1).create();
  log_('daily trigger installed for 08:00');
  return true;
}

/** Remove every dailyAuditTrigger scheduled for this project. */
function removeDailyTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyAuditTrigger') { ScriptApp.deleteTrigger(t); removed++; }
  });
  return removed;
}

/** Convenience: run the audit now from the Apps Script editor. */
function runAuditNow() { return dailyAuditTrigger(); }

/* -------------------------------- logging -------------------------------- */
function log_(msg) {
  try { console.log('[SaveIQ] ' + msg); } catch (e) { }
}
