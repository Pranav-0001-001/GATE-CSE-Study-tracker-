/* ==========================================================================
   GATETrack — Analytics (simple)
   --------------------------------------------------------------------------
   CONNECT YOUR OWN DATA
   Before this script runs, expose one object:

     window.GATETrackData = {
       sessions: [ { date: "2026-09-18", minutes: 90, subject: "Algorithms" } ],
       habits:   [ { date: "2026-09-18", completed: 4, total: 5 } ],
       syllabus: { "Algorithms": { done: 12, total: 20 } },
       checkins: [ { date: "2026-09-18", mood: "🙂", note: "..." } ]
     };

   Or have api.js return the same shape from window.API.getAnalyticsData().
   Or store it in localStorage under gatetrack_sessions / gatetrack_habits /
   gatetrack_syllabus / gatetrack_checkins.

   Nothing found → the page shows clean empty states, not fake numbers.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

  function hrs(minutes) {
    if (!minutes) return "0h";
    const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  function decHrs(minutes) { return Math.round((minutes / 60) * 10) / 10; }
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

  /* ---------------- Data layer (no sample fallback) ---------------- */
  function readStore() {
    const direct = window.GATETrackData ||
      (window.API && typeof window.API.getAnalyticsData === "function" && window.API.getAnalyticsData()) ||
      null;
    if (direct) return direct;

    try {
      const ls = (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; };
      const sessions = ls("gatetrack_sessions") || ls("sessions");
      const habits = ls("gatetrack_habits") || ls("habitLogs");
      const syllabus = ls("gatetrack_syllabus") || ls("syllabusProgress");
      const checkins = ls("gatetrack_checkins") || ls("checkins");
      if (sessions || habits || syllabus || checkins) return { sessions, habits, syllabus, checkins };
    } catch (e) { /* storage unavailable */ }

    return { sessions: [], habits: [], syllabus: {}, checkins: [] };
  }

  function normalise(raw) {
    const sessions = (raw.sessions || []).map(s => ({
      date: String(s.date).slice(0, 10),
      minutes: Number(s.minutes ?? s.duration ?? 0),
      subject: s.subject || s.topic || "Unassigned"
    })).filter(s => s.minutes > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.date));

    const habits = (raw.habits || []).map(h => ({
      date: String(h.date).slice(0, 10),
      completed: Number(h.completed ?? 0),
      total: Number(h.total ?? 0) || 1
    })).filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h.date));

    const syllabus = {};
    Object.entries(raw.syllabus || {}).forEach(([name, v]) => {
      syllabus[name] = { done: Number(v.done ?? v.completed ?? 0), total: Number(v.total ?? v.topics ?? 0) || 1 };
    });

    const checkins = (raw.checkins || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return { sessions, habits, syllabus, checkins };
  }

  const DATA = normalise(readStore());
  const hasAnyData = DATA.sessions.length || DATA.habits.length || Object.keys(DATA.syllabus).length || DATA.checkins.length;

  const byDay = new Map();
  DATA.sessions.forEach(s => {
    const row = byDay.get(s.date) || { minutes: 0, sessions: 0, subjects: {} };
    row.minutes += s.minutes; row.sessions += 1;
    row.subjects[s.subject] = (row.subjects[s.subject] || 0) + s.minutes;
    byDay.set(s.date, row);
  });
  const habitByDay = new Map(DATA.habits.map(h => [h.date, h]));

  function last7() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today(), -i), k = key(d);
      const s = byDay.get(k) || { minutes: 0, sessions: 0, subjects: {} };
      out.push({ date: k, d, minutes: s.minutes, sessions: s.sessions, subjects: s.subjects });
    }
    return out;
  }

  function streak() {
    let n = 0, d = today();
    if (!(byDay.get(key(d)) || {}).minutes) d = addDays(d, -1);
    while ((byDay.get(key(d)) || {}).minutes > 0) { n++; d = addDays(d, -1); }
    return n;
  }

  function syllabusTotals() {
    let done = 0, total = 0;
    Object.values(DATA.syllabus).forEach(v => { done += v.done; total += v.total; });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function todayHabit() {
    const h = habitByDay.get(key(today()));
    return h && h.total ? Math.round((h.completed / h.total) * 100) : 0;
  }

  /* ---------------- Render ---------------- */

  function renderHeadline() {
    const el = $("ga-headline-text");
    if (!hasAnyData) {
      el.innerHTML = "Log your first study session on the <b>Study Timer</b> and your progress will start showing up here.";
      $("ga-headline-icon").textContent = "👋";
      return;
    }
    const week = last7();
    const active = week.filter(x => x.minutes > 0).length;
    const total = sum(week, x => x.minutes);
    const s = streak();

    let text, icon;
    if (total === 0) {
      text = "No study sessions logged this week yet. Start one on the Study Timer.";
      icon = "🕒";
    } else if (s >= 3) {
      text = `You're on a <b>${s}-day streak</b> and studied <b>${hrs(total)}</b> this week. Keep it going.`;
      icon = "🔥";
    } else if (active >= 5) {
      text = `Solid week — you studied on <b>${active} of the last 7 days</b>, totalling <b>${hrs(total)}</b>.`;
      icon = "📈";
    } else {
      text = `You studied <b>${hrs(total)}</b> across <b>${active} of the last 7 days</b>. A short session today keeps the streak alive.`;
      icon = "💪";
    }
    el.innerHTML = text;
    $("ga-headline-icon").textContent = icon;
  }

  function renderStats() {
    const week = last7();
    const total = sum(week, x => x.minutes);
    const active = week.filter(x => x.minutes > 0).length;
    const syl = syllabusTotals();

    $("ga-stat-week").textContent = hrs(total);
    $("ga-stat-week-sub").textContent = active ? `Across ${active} of 7 days` : "No sessions this week";

    $("ga-stat-streak").textContent = streak() + " days";
    $("ga-stat-streak-sub").textContent = streak() > 0 ? "Keep it going" : "Start today";

    $("ga-stat-syllabus").textContent = syl.total ? syl.pct + "%" : "—";
    $("ga-stat-syllabus-sub").textContent = syl.total ? `${syl.done} of ${syl.total} topics` : "Add topics on Syllabus page";

    const habitPct = todayHabit();
    $("ga-stat-habit").textContent = habitPct ? habitPct + "%" : "—";
    $("ga-stat-habit-sub").textContent = habitByDay.has(key(today())) ? "Today's habits" : "No habits logged today";
  }

  function renderWeekChart() {
    const host = $("ga-week-chart");
    const week = last7();
    host.innerHTML = "";

    if (!sum(week, x => x.minutes)) {
      host.innerHTML = `<div class="ga-empty"><b>Nothing logged this week</b>Your last 7 days will appear here as soon as you complete a study session.</div>`;
      return;
    }

    const max = Math.max(...week.map(x => x.minutes), 1);
    const row = document.createElement("div");
    row.className = "ga-week";
    week.forEach(x => {
      const col = document.createElement("div");
      col.className = "ga-week-col";
      const bar = document.createElement("div");
      bar.className = "ga-week-bar" + (x.minutes === 0 ? " empty" : x.minutes === max ? " best" : "");
      bar.style.height = Math.max(3, (x.minutes / max) * 100) + "%";
      const label = document.createElement("span");
      label.className = "ga-week-hrs";
      label.textContent = x.minutes ? decHrs(x.minutes) + "h" : "";
      const day = document.createElement("span");
      day.className = "ga-week-day";
      day.textContent = x.d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
      col.append(label, bar, day);
      row.appendChild(col);
    });
    host.appendChild(row);
  }

  function renderSubjects() {
    const host = $("ga-subjects");
    const entries = Object.entries(DATA.syllabus);
    host.innerHTML = "";

    if (!entries.length) {
      host.innerHTML = `<div class="ga-empty"><b>No subjects tracked yet</b>Add your GATE subjects on the Syllabus page to see coverage here.</div>`;
      return;
    }

    entries
      .map(([name, v]) => ({ name, pct: Math.round((v.done / v.total) * 100), done: v.done, total: v.total }))
      .sort((a, b) => b.pct - a.pct)
      .forEach(r => {
        const row = document.createElement("div");
        row.className = "ga-subject";
        row.innerHTML = `
          <div class="ga-subject-top">
            <span class="ga-subject-name">${r.name}</span>
            <span class="ga-subject-pct">${r.pct}%</span>
          </div>
          <div class="ga-subject-bar"><i style="width:${r.pct}%"></i></div>`;
        host.appendChild(row);
      });
  }

  function renderCheckins() {
    const host = $("ga-checkins");
    host.innerHTML = "";

    if (!DATA.checkins.length) {
      host.innerHTML = `<div class="ga-empty"><b>No reflections yet</b>Write a line after each session — it's the fastest way to spot patterns later.</div>`;
      return;
    }

    DATA.checkins.slice(0, 6).forEach(c => {
      const d = parse(String(c.date).slice(0, 10));
      const row = document.createElement("div");
      row.className = "ga-checkin";
      row.innerHTML = `
        <div class="ga-checkin-date">${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
        <div class="ga-checkin-note">${c.note || "—"}</div>
        <div class="ga-checkin-mood">${c.mood || ""}</div>`;
      host.appendChild(row);
    });
  }

  function init() {
    renderHeadline();
    renderStats();
    renderWeekChart();
    renderSubjects();
    renderCheckins();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
