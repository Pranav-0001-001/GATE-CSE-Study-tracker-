/**
 * GATETrack - Dashboard Controller
 */

// Shared Quick Timer State (stored in localStorage for state preservation across refreshes)
let quickTimer = {
  running: false,
  paused: false,
  targetSeconds: 45 * 60,
  remainingSeconds: 45 * 60,
  startRemaining: 45 * 60,
  startTime: null,
  timeStudiedSeconds: 0,
  intervalId: null,
  subjectId: null,
  topicId: null
};

document.addEventListener('DOMContentLoaded', async () => {
  setGreeting();
  await loadDashboardData();
  await initQuickTimer();
  await checkDailyCheckin();
});

/**
 * Dynamic Greeting based on current local hour
 */
function setGreeting() {
  const hour = new Date().getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';

  const user = API.getUser();
  const userName = user && user.name ? user.name.split(' ')[0] : 'Student';

  const titleEl = document.getElementById('dashboard-greeting');
  if (titleEl) {
    titleEl.textContent = `Good ${timeOfDay}, ${userName} 👋`;
  }
}

/**
 * Fetch and populate core metrics, checklist, recent sessions, and insights
 */
async function loadDashboardData() {
  try {
    // 1. Study Sessions Stats
    const statsPromise = API.request('/api/study-sessions/stats');
    // 2. Syllabus Progress
    const syllabusPromise = API.request('/api/syllabus/progress');
    // 3. Habits with today's status
    const habitsPromise = API.request('/api/habits');
    // 4. Recent Study Sessions (last 5)
    const recentSessionsPromise = API.request('/api/study-sessions?filter=all');
    // 5. Analytics Insights
    const overviewPromise = API.request('/api/analytics/overview');

    const [stats, syllabus, habitsData, sessionsData, overviewData] = await Promise.all([
      statsPromise,
      syllabusPromise,
      habitsPromise,
      recentSessionsPromise,
      overviewPromise
    ]);

    // Populate Top 4 Metric Cards
    document.getElementById('metric-today-time').textContent = API.formatHoursMinutes(stats.todaySeconds);
    document.getElementById('metric-syllabus-progress').textContent = `${syllabus.percentage}%`;
    document.getElementById('metric-current-streak').textContent = `🔥 ${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`;
    document.getElementById('metric-habit-completion').textContent = `${habitsData.summary.percentageToday}%`;

    // Populate Today's Habits Checklist
    renderTodayHabits(habitsData.habits);

    // Populate Recent Study Sessions
    renderRecentSessions(sessionsData.sessions.slice(0, 5));

    // Populate Improvement Insights
    renderInsights(overviewData.insights);

    // Populate Subjects in Quick Timer Dropdown
    await populateSubjectsDropdown();

  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    API.showToast('Could not load all dashboard data.', 'error');
  }
}

/**
 * Render Today's Habit Checklist
 */
function renderTodayHabits(habits) {
  const container = document.getElementById('dashboard-habits-list');
  if (!container) return;

  if (!habits || habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
        <div class="empty-state-title" style="font-size: 1rem;">No habits added yet</div>
        <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 0.75rem;">Build consistency with daily GATE study habits.</div>
        <a href="habits.html" class="btn btn-sm btn-primary">Create Habits</a>
      </div>
    `;
    return;
  }

  container.innerHTML = habits.map(h => `
    <div class="checklist-item ${h.is_completed_today ? 'completed' : ''}" data-id="${h.id}">
      <div class="checklist-info">
        <input type="checkbox" class="checklist-checkbox habit-toggle" data-id="${h.id}" ${h.is_completed_today ? 'checked' : ''} />
        <span class="checklist-icon">${h.icon || '🎯'}</span>
        <div>
          <div class="checklist-title">${escapeHTML(h.name)}</div>
          <div class="text-xs text-muted">${escapeHTML(h.target || '')}</div>
        </div>
      </div>
      <div class="checklist-streak">
        🔥 ${h.currentStreak}d
      </div>
    </div>
  `).join('');

  // Attach toggle listeners
  container.querySelectorAll('.habit-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      const habitId = e.target.getAttribute('data-id');
      try {
        const res = await API.request(`/api/habits/${habitId}/toggle`, { method: 'POST' });
        API.showToast(res.message);
        
        // Update metric card
        document.getElementById('metric-habit-completion').textContent = `${res.summary.percentageToday}%`;
        
        // Reload habits to refresh streaks
        const habitsData = await API.request('/api/habits');
        renderTodayHabits(habitsData.habits);

        // Check if new badges were unlocked
        if (res.unlockedBadges && res.unlockedBadges.length > 0) {
          res.unlockedBadges.forEach(b => {
            API.showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success');
          });
        }
      } catch (err) {
        API.showToast('Failed to toggle habit', 'error');
        e.target.checked = !e.target.checked;
      }
    });
  });
}

/**
 * Render Recent Study Sessions
 */
function renderRecentSessions(sessions) {
  const container = document.getElementById('dashboard-recent-sessions');
  if (!container) return;

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">⏱️</div>
        <div class="empty-state-title" style="font-size: 1rem;">No study sessions yet</div>
        <div class="empty-state-desc" style="font-size: 0.8rem;">Use the quick timer to log your first study session.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = sessions.map(s => {
    const dateObj = new Date(s.started_at);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return `
      <div class="session-item">
        <div>
          <div class="session-subject">${escapeHTML(s.subject_name || 'GATE CSE')}</div>
          <div class="session-topic">${escapeHTML(s.topic_name || 'General Study')}</div>
          <div class="text-xs text-muted">${dateStr} at ${timeStr}</div>
        </div>
        <div class="session-duration">
          ${API.formatHoursMinutes(s.duration_seconds)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Insights
 */
function renderInsights(insights) {
  const container = document.getElementById('dashboard-insights');
  if (!container) return;

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div class="text-sm text-muted">Insights will appear here as you log study sessions.</div>`;
    return;
  }

  container.innerHTML = insights.slice(0, 3).map(ins => `
    <div class="insight-card">
      <div class="insight-icon">${ins.icon || '💡'}</div>
      <div>
        <div class="insight-title">${escapeHTML(ins.title)}</div>
        <div class="insight-body">${escapeHTML(ins.message)}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Populate Subjects & Topics Selectors
 */
let cachedSubjects = [];
async function populateSubjectsDropdown() {
  try {
    const data = await API.request('/api/syllabus');
    cachedSubjects = data.subjects || [];

    const subjectSelect = document.getElementById('quick-timer-subject');
    const topicSelect = document.getElementById('quick-timer-topic');

    if (!subjectSelect) return;

    subjectSelect.innerHTML = `<option value="">Select Subject...</option>` +
      cachedSubjects.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');

    subjectSelect.addEventListener('change', () => {
      const selectedId = parseInt(subjectSelect.value, 10);
      quickTimer.subjectId = selectedId || null;
      saveTimerState();

      if (!topicSelect) return;

      const subj = cachedSubjects.find(s => s.id === selectedId);
      if (subj && subj.topics) {
        topicSelect.innerHTML = `<option value="">Select Topic...</option>` +
          subj.topics.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
        topicSelect.disabled = false;
      } else {
        topicSelect.innerHTML = `<option value="">Select Subject first</option>`;
        topicSelect.disabled = true;
      }
    });

    if (topicSelect) {
      topicSelect.addEventListener('change', () => {
        quickTimer.topicId = parseInt(topicSelect.value, 10) || null;
        saveTimerState();
      });
    }

    // Restore saved selections if any
    restoreTimerState();
  } catch (err) {
    console.error('Failed to populate subjects:', err);
  }
}

/**
 * Quick Timer Logic (Adjustable Countdown)
 */
function initQuickTimer() {
  const startBtn = document.getElementById('quick-timer-start');
  const pauseBtn = document.getElementById('quick-timer-pause');
  const resumeBtn = document.getElementById('quick-timer-resume');
  const finishBtn = document.getElementById('quick-timer-finish');
  const resetBtn = document.getElementById('quick-timer-reset');

  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resumeBtn) resumeBtn.addEventListener('click', resumeTimer);
  if (finishBtn) finishBtn.addEventListener('click', () => openFinishModal(false));
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  // Preset Buttons
  const presetBtns = document.querySelectorAll('.quick-preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const minutes = parseInt(btn.getAttribute('data-minutes'), 10);
      if (isNaN(minutes) || minutes <= 0) return;

      if (quickTimer.running && !confirm('Timer is running. Reset to change duration?')) {
        return;
      }

      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      setQuickTimerDuration(minutes * 60);
    });
  });

  // Wire Finish Modal Save Button
  const saveModalBtn = document.getElementById('save-session-btn');
  if (saveModalBtn) {
    saveModalBtn.addEventListener('click', saveCompletedSession);
  }

  const closeModalBtn = document.getElementById('close-session-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      document.getElementById('finish-session-modal').classList.remove('active');
    });
  }
}

function setQuickTimerDuration(seconds) {
  quickTimer.running = false;
  quickTimer.paused = false;
  quickTimer.startTime = null;
  quickTimer.targetSeconds = seconds;
  quickTimer.remainingSeconds = seconds;
  quickTimer.startRemaining = seconds;
  quickTimer.timeStudiedSeconds = 0;

  clearInterval(quickTimer.intervalId);
  updateDisplay();
  updateTimerUIState('stopped');
  saveTimerState();
}

function updateDisplay() {
  const display = document.getElementById('quick-timer-display');
  if (display) {
    display.textContent = API.formatHHMMSS(quickTimer.remainingSeconds);
  }

  const fill = document.getElementById('quick-timer-progress-fill');
  if (fill && quickTimer.targetSeconds > 0) {
    const elapsed = quickTimer.targetSeconds - quickTimer.remainingSeconds;
    const pct = Math.min(100, Math.max(0, Math.round((elapsed / quickTimer.targetSeconds) * 100)));
    fill.style.width = `${pct}%`;
  }
}

function startTimer() {
  quickTimer.running = true;
  quickTimer.paused = false;
  quickTimer.startTime = Date.now();
  quickTimer.startRemaining = quickTimer.remainingSeconds;

  saveTimerState();
  startInterval();
  updateTimerUIState('running');
  API.showToast('Study session started. Stay focused! 🚀', 'info');
}

function pauseTimer() {
  if (!quickTimer.running) return;

  const elapsed = Math.floor((Date.now() - quickTimer.startTime) / 1000);
  quickTimer.remainingSeconds = Math.max(0, quickTimer.startRemaining - elapsed);
  quickTimer.timeStudiedSeconds = quickTimer.targetSeconds - quickTimer.remainingSeconds;

  quickTimer.running = false;
  quickTimer.paused = true;
  quickTimer.startTime = null;

  clearInterval(quickTimer.intervalId);
  saveTimerState();
  updateDisplay();
  updateTimerUIState('paused');
}

function resumeTimer() {
  quickTimer.running = true;
  quickTimer.paused = false;
  quickTimer.startTime = Date.now();
  quickTimer.startRemaining = quickTimer.remainingSeconds;

  saveTimerState();
  startInterval();
  updateTimerUIState('running');
}

function resetTimer() {
  clearInterval(quickTimer.intervalId);
  quickTimer.running = false;
  quickTimer.paused = false;
  quickTimer.startTime = null;
  quickTimer.remainingSeconds = quickTimer.targetSeconds;
  quickTimer.startRemaining = quickTimer.targetSeconds;
  quickTimer.timeStudiedSeconds = 0;

  clearTimerState();
  updateDisplay();
  updateTimerUIState('stopped');
}

function startInterval() {
  clearInterval(quickTimer.intervalId);
  quickTimer.intervalId = setInterval(() => {
    if (!quickTimer.running || !quickTimer.startTime) return;

    const elapsed = Math.floor((Date.now() - quickTimer.startTime) / 1000);
    const currentRemaining = Math.max(0, quickTimer.startRemaining - elapsed);
    quickTimer.remainingSeconds = currentRemaining;
    quickTimer.timeStudiedSeconds = quickTimer.targetSeconds - currentRemaining;

    updateDisplay();

    if (currentRemaining <= 0) {
      clearInterval(quickTimer.intervalId);
      quickTimer.running = false;
      quickTimer.paused = false;
      quickTimer.startTime = null;
      updateTimerUIState('stopped');
      playChime();
      API.showToast("Time's up! Great session completed! 🎉", 'success');
      openFinishModal(true);
    }
  }, 300);
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
}

function updateTimerUIState(state) {
  const startBtn = document.getElementById('quick-timer-start');
  const pauseBtn = document.getElementById('quick-timer-pause');
  const resumeBtn = document.getElementById('quick-timer-resume');
  const finishBtn = document.getElementById('quick-timer-finish');
  const resetBtn = document.getElementById('quick-timer-reset');

  if (!startBtn) return;

  if (state === 'running') {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';
    resumeBtn.style.display = 'none';
    finishBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'inline-flex';
  } else if (state === 'paused') {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-flex';
    finishBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'inline-flex';
  } else {
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    finishBtn.style.display = 'none';
    resetBtn.style.display = 'none';
  }
}

function openFinishModal(isCompleted = false) {
  let studied = quickTimer.timeStudiedSeconds;
  if (quickTimer.running && quickTimer.startTime) {
    const elapsed = Math.floor((Date.now() - quickTimer.startTime) / 1000);
    const rem = Math.max(0, quickTimer.startRemaining - elapsed);
    studied = quickTimer.targetSeconds - rem;
  }

  if (studied <= 0) {
    API.showToast('No study time logged yet.', 'error');
    return;
  }

  if (quickTimer.running) {
    pauseTimer();
  }

  const subjectSelect = document.getElementById('quick-timer-subject');
  const topicSelect = document.getElementById('quick-timer-topic');

  const subjectName = subjectSelect && subjectSelect.selectedIndex > 0 ? subjectSelect.options[subjectSelect.selectedIndex].text : 'General CSE Preparation';
  const topicName = topicSelect && topicSelect.selectedIndex > 0 ? topicSelect.options[topicSelect.selectedIndex].text : 'General Revision';

  document.getElementById('modal-session-duration').textContent = API.formatHoursMinutes(studied);
  document.getElementById('modal-session-subject').textContent = subjectName;
  document.getElementById('modal-session-topic').textContent = topicName;
  document.getElementById('session-notes-input').value = '';

  const titleEl = document.getElementById('modal-finish-title');
  if (titleEl) {
    titleEl.textContent = isCompleted ? "Timer Completed! Session Saved 🎉" : "Session Completed 🎉";
  }

  document.getElementById('finish-session-modal').classList.add('active');
}

async function saveCompletedSession() {
  const totalSecs = Math.max(1, quickTimer.timeStudiedSeconds);
  const subjectId = quickTimer.subjectId;
  const topicId = quickTimer.topicId;
  const notes = document.getElementById('session-notes-input').value;
  const saveBtn = document.getElementById('save-session-btn');

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const res = await API.request('/api/study-sessions', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        topic_id: topicId,
        duration_seconds: totalSecs,
        notes
      })
    });

    API.showToast('Study session saved! 🎉');
    document.getElementById('finish-session-modal').classList.remove('active');

    resetTimer();

    if (res.unlockedBadges && res.unlockedBadges.length > 0) {
      res.unlockedBadges.forEach(b => {
        API.showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success');
      });
    }

    await loadDashboardData();
  } catch (err) {
    API.showToast(err.message || 'Failed to save session.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Session';
  }
}

// LocalStorage timer persistence to survive refresh
function saveTimerState() {
  localStorage.setItem('gatetrack_dashboard_countdown_timer', JSON.stringify({
    running: quickTimer.running,
    paused: quickTimer.paused,
    targetSeconds: quickTimer.targetSeconds,
    remainingSeconds: quickTimer.remainingSeconds,
    startRemaining: quickTimer.startRemaining,
    startTime: quickTimer.startTime,
    timeStudiedSeconds: quickTimer.timeStudiedSeconds,
    subjectId: quickTimer.subjectId,
    topicId: quickTimer.topicId
  }));
}

function clearTimerState() {
  localStorage.removeItem('gatetrack_dashboard_countdown_timer');
}

function restoreTimerState() {
  const saved = localStorage.getItem('gatetrack_dashboard_countdown_timer');
  if (!saved) {
    setQuickTimerDuration(45 * 60);
    return;
  }

  try {
    const data = JSON.parse(saved);
    quickTimer.targetSeconds = data.targetSeconds || 45 * 60;
    quickTimer.remainingSeconds = data.remainingSeconds || quickTimer.targetSeconds;
    quickTimer.startRemaining = data.startRemaining || quickTimer.remainingSeconds;
    quickTimer.timeStudiedSeconds = data.timeStudiedSeconds || 0;
    quickTimer.subjectId = data.subjectId;
    quickTimer.topicId = data.topicId;

    const mins = Math.round(quickTimer.targetSeconds / 60);
    const presetBtn = document.querySelector(`.quick-preset-btn[data-minutes="${mins}"]`);
    if (presetBtn) {
      document.querySelectorAll('.quick-preset-btn').forEach(b => b.classList.remove('active'));
      presetBtn.classList.add('active');
    }

    if (quickTimer.subjectId) {
      const subjSelect = document.getElementById('quick-timer-subject');
      if (subjSelect) {
        subjSelect.value = quickTimer.subjectId;
        subjSelect.dispatchEvent(new Event('change'));
      }
    }

    if (quickTimer.topicId) {
      const topicSelect = document.getElementById('quick-timer-topic');
      if (topicSelect) {
        setTimeout(() => { topicSelect.value = quickTimer.topicId; }, 100);
      }
    }

    if (data.running && data.startTime) {
      const elapsedSinceCrash = Math.floor((Date.now() - data.startTime) / 1000);
      const restoredRemaining = Math.max(0, data.startRemaining - elapsedSinceCrash);
      quickTimer.remainingSeconds = restoredRemaining;
      quickTimer.timeStudiedSeconds = quickTimer.targetSeconds - restoredRemaining;

      if (restoredRemaining > 0) {
        quickTimer.running = true;
        quickTimer.startTime = Date.now();
        quickTimer.startRemaining = restoredRemaining;
        startInterval();
        updateTimerUIState('running');
      } else {
        quickTimer.running = false;
        quickTimer.paused = false;
        updateTimerUIState('stopped');
      }
    } else if (data.paused) {
      quickTimer.paused = true;
      updateTimerUIState('paused');
    } else {
      updateTimerUIState('stopped');
    }
    updateDisplay();
  } catch {
    clearTimerState();
    setQuickTimerDuration(45 * 60);
  }
}

/**
 * Daily Check-in Checker
 */
async function checkDailyCheckin() {
  try {
    const checkinStatus = await API.request('/api/checkins/today');
    const banner = document.getElementById('daily-checkin-banner');
    if (!banner) return;

    if (checkinStatus.hasCheckedIn) {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
      const openModalBtn = document.getElementById('open-checkin-modal-btn');
      if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
          document.getElementById('checkin-modal').classList.add('active');
        });
      }
    }
  } catch {}

  // Wire Checkin modal events
  wireCheckinModal();
}

function wireCheckinModal() {
  const modal = document.getElementById('checkin-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('close-checkin-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  const ratingBtns = modal.querySelectorAll('.rating-btn');
  let selectedRating = 4;

  ratingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ratingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRating = parseInt(btn.getAttribute('data-rating'), 10);
    });
  });

  const submitBtn = document.getElementById('submit-checkin-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const acc = document.getElementById('checkin-accomplishments').value;
      const tomorrow = document.getElementById('checkin-tomorrow').value;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

      try {
        await API.request('/api/checkins', {
          method: 'POST',
          body: JSON.stringify({
            rating: selectedRating,
            accomplishments: acc,
            tomorrow_focus: tomorrow
          })
        });

        API.showToast('Daily check-in saved! 🚀');
        modal.classList.remove('active');
        const banner = document.getElementById('daily-checkin-banner');
        if (banner) banner.style.display = 'none';
      } catch (err) {
        API.showToast('Failed to save check-in.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Check-in';
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
