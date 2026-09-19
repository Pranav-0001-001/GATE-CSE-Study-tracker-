/**
 * GATETrack - Dedicated Adjustable Study Timer Controller
 */

let timerState = {
  running: false,
  paused: false,
  targetSeconds: 45 * 60,       // Default 45 minutes
  remainingSeconds: 45 * 60,
  startRemaining: 45 * 60,
  startTime: null,
  timeStudiedSeconds: 0,
  intervalId: null,
  subjectId: null,
  topicId: null
};

let cachedSubjects = [];
let currentFilter = 'today';

document.addEventListener('DOMContentLoaded', async () => {
  await loadSubjects();
  initPresetButtons();
  initAdjustButtons();
  initCustomTimeInputs();
  initTimerButtons();
  initFinishModal();
  initHistoryFilters();
  await loadHistory(currentFilter);
  restoreTimerState();
});

/**
 * Load subjects and topics for selection
 */
async function loadSubjects() {
  try {
    const data = await API.request('/api/syllabus');
    cachedSubjects = data.subjects || [];

    const subjectSelect = document.getElementById('timer-subject-select');
    const topicSelect = document.getElementById('timer-topic-select');

    if (!subjectSelect) return;

    subjectSelect.innerHTML = `<option value="">Select GATE Subject...</option>` +
      cachedSubjects.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');

    subjectSelect.addEventListener('change', () => {
      const selectedId = parseInt(subjectSelect.value, 10);
      timerState.subjectId = selectedId || null;
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
      updateActiveTopicLabel();
    });

    if (topicSelect) {
      topicSelect.addEventListener('change', () => {
        timerState.topicId = parseInt(topicSelect.value, 10) || null;
        saveTimerState();
        updateActiveTopicLabel();
      });
    }
  } catch (err) {
    console.error('Failed to load syllabus for timer:', err);
  }
}

function updateActiveTopicLabel() {
  const labelEl = document.getElementById('timer-active-topic-label');
  if (!labelEl) return;

  const subjectSelect = document.getElementById('timer-subject-select');
  const topicSelect = document.getElementById('timer-topic-select');

  const sText = subjectSelect && subjectSelect.selectedIndex > 0 ? subjectSelect.options[subjectSelect.selectedIndex].text : '';
  const tText = topicSelect && topicSelect.selectedIndex > 0 ? topicSelect.options[topicSelect.selectedIndex].text : '';

  if (sText && tText) {
    labelEl.textContent = `${sText} • ${tText}`;
  } else if (sText) {
    labelEl.textContent = sText;
  } else {
    labelEl.textContent = 'General Preparation';
  }
}

/**
 * Presets (25m, 45m, 60m, 90m, 120m, Custom)
 */
function initPresetButtons() {
  const presetBtns = document.querySelectorAll('.timer-preset-btn');
  const customInputs = document.getElementById('custom-time-inputs');

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const minsVal = btn.getAttribute('data-minutes');

      if (minsVal === 'custom') {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customInputs) customInputs.classList.add('active');
        return;
      }

      if (customInputs) customInputs.classList.remove('active');

      const minutes = parseInt(minsVal, 10);
      if (isNaN(minutes) || minutes <= 0) return;

      if (timerState.running && !confirm('Timer is currently running. Do you want to reset and change duration?')) {
        return;
      }

      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      setTimerDuration(minutes * 60);
    });
  });
}

/**
 * Adjusters (+5m, -5m, +15m, -15m)
 */
function initAdjustButtons() {
  const adjust = (deltaSeconds) => {
    if (timerState.running) {
      // Adjust remaining time directly while preserving time studied
      const newRemaining = Math.max(1, timerState.remainingSeconds + deltaSeconds);
      timerState.remainingSeconds = newRemaining;
      timerState.startRemaining = newRemaining;
      timerState.startTime = Date.now();
      timerState.targetSeconds = Math.max(timerState.targetSeconds, timerState.remainingSeconds);
    } else {
      const newTarget = Math.max(60, timerState.targetSeconds + deltaSeconds);
      setTimerDuration(newTarget);
    }
    updateDisplay();
    saveTimerState();
  };

  document.getElementById('adjust-minus-15')?.addEventListener('click', () => adjust(-15 * 60));
  document.getElementById('adjust-minus-5')?.addEventListener('click', () => adjust(-5 * 60));
  document.getElementById('adjust-plus-5')?.addEventListener('click', () => adjust(5 * 60));
  document.getElementById('adjust-plus-15')?.addEventListener('click', () => adjust(15 * 60));
}

/**
 * Custom Hours & Minutes Input
 */
function initCustomTimeInputs() {
  const applyBtn = document.getElementById('apply-custom-time-btn');
  const hoursInput = document.getElementById('custom-hours');
  const minsInput = document.getElementById('custom-minutes');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const hours = parseInt(hoursInput.value, 10) || 0;
      const mins = parseInt(minsInput.value, 10) || 0;
      const totalSecs = (hours * 3600) + (mins * 60);

      if (totalSecs <= 0) {
        API.showToast('Please set a duration greater than 0 minutes.', 'error');
        return;
      }

      setTimerDuration(totalSecs);
      API.showToast(`Timer set to ${API.formatHoursMinutes(totalSecs)} ⏱️`);
    });
  }
}

function setTimerDuration(seconds) {
  timerState.running = false;
  timerState.paused = false;
  timerState.startTime = null;
  timerState.targetSeconds = seconds;
  timerState.remainingSeconds = seconds;
  timerState.startRemaining = seconds;
  timerState.timeStudiedSeconds = 0;

  clearInterval(timerState.intervalId);

  const targetLabel = document.getElementById('timer-target-label');
  if (targetLabel) {
    targetLabel.textContent = `Target: ${API.formatHoursMinutes(seconds)}`;
  }

  updateDisplay();
  updateUIState('stopped');
  saveTimerState();
}

/**
 * Display & Progress Calculation
 */
function updateDisplay() {
  const display = document.getElementById('timer-display');
  if (display) {
    display.textContent = API.formatHHMMSS(timerState.remainingSeconds);
  }

  const fill = document.getElementById('timer-progress-fill');
  if (fill && timerState.targetSeconds > 0) {
    const elapsed = timerState.targetSeconds - timerState.remainingSeconds;
    const pct = Math.min(100, Math.max(0, Math.round((elapsed / timerState.targetSeconds) * 100)));
    fill.style.width = `${pct}%`;
  }
}

/**
 * Countdown Engine
 */
function startTimer() {
  timerState.running = true;
  timerState.paused = false;
  timerState.startTime = Date.now();
  timerState.startRemaining = timerState.remainingSeconds;

  saveTimerState();
  startInterval();
  updateUIState('running');
  API.showToast('Focus session started. Stay focused! 🚀', 'info');
}

function pauseTimer() {
  if (!timerState.running) return;

  const elapsedSinceStart = Math.floor((Date.now() - timerState.startTime) / 1000);
  timerState.remainingSeconds = Math.max(0, timerState.startRemaining - elapsedSinceStart);
  timerState.timeStudiedSeconds = timerState.targetSeconds - timerState.remainingSeconds;

  timerState.running = false;
  timerState.paused = true;
  timerState.startTime = null;

  clearInterval(timerState.intervalId);
  saveTimerState();
  updateDisplay();
  updateUIState('paused');
}

function resumeTimer() {
  timerState.running = true;
  timerState.paused = false;
  timerState.startTime = Date.now();
  timerState.startRemaining = timerState.remainingSeconds;

  saveTimerState();
  startInterval();
  updateUIState('running');
}

function resetTimer() {
  clearInterval(timerState.intervalId);
  timerState.running = false;
  timerState.paused = false;
  timerState.startTime = null;
  timerState.remainingSeconds = timerState.targetSeconds;
  timerState.startRemaining = timerState.targetSeconds;
  timerState.timeStudiedSeconds = 0;

  clearTimerState();
  updateDisplay();
  updateUIState('stopped');
}

function startInterval() {
  clearInterval(timerState.intervalId);
  timerState.intervalId = setInterval(() => {
    if (!timerState.running || !timerState.startTime) return;

    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const currentRemaining = Math.max(0, timerState.startRemaining - elapsed);
    timerState.remainingSeconds = currentRemaining;
    timerState.timeStudiedSeconds = timerState.targetSeconds - currentRemaining;

    updateDisplay();

    // Check if countdown completed
    if (currentRemaining <= 0) {
      clearInterval(timerState.intervalId);
      timerState.running = false;
      timerState.paused = false;
      timerState.startTime = null;
      updateUIState('stopped');
      playChime();
      API.showToast("Time's up! Phenomenal work on completing your session! 🎉", 'success');
      openFinishModal(true);
    }
  }, 300);
}

/**
 * Synthesized gentle audio chime (no external audio files required)
 */
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
}

function updateUIState(state) {
  const startBtn = document.getElementById('timer-start-btn');
  const pauseBtn = document.getElementById('timer-pause-btn');
  const resumeBtn = document.getElementById('timer-resume-btn');
  const finishBtn = document.getElementById('timer-finish-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  const pill = document.getElementById('timer-status-pill');
  const statusText = document.getElementById('timer-status-text');

  if (!startBtn) return;

  if (state === 'running') {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';
    resumeBtn.style.display = 'none';
    finishBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'inline-flex';

    if (pill) pill.className = 'timer-status-pill running';
    if (statusText) statusText.textContent = 'Focusing';
  } else if (state === 'paused') {
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-flex';
    finishBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'inline-flex';

    if (pill) pill.className = 'timer-status-pill paused';
    if (statusText) statusText.textContent = 'Paused';
  } else {
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    finishBtn.style.display = 'none';
    resetBtn.style.display = 'none';

    if (pill) pill.className = 'timer-status-pill';
    if (statusText) statusText.textContent = 'Ready to Study';
  }
}

function initTimerButtons() {
  document.getElementById('timer-start-btn')?.addEventListener('click', startTimer);
  document.getElementById('timer-pause-btn')?.addEventListener('click', pauseTimer);
  document.getElementById('timer-resume-btn')?.addEventListener('click', resumeTimer);
  document.getElementById('timer-finish-btn')?.addEventListener('click', () => openFinishModal(false));
  document.getElementById('timer-reset-btn')?.addEventListener('click', resetTimer);
}

/**
 * Finish & Save Session Modal
 */
function initFinishModal() {
  const modal = document.getElementById('finish-modal');
  const closeBtn = document.getElementById('close-finish-modal');
  const saveBtn = document.getElementById('save-session-confirm-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const totalSecs = Math.max(1, timerState.timeStudiedSeconds);
      const notes = document.getElementById('finish-notes-input').value;

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

      try {
        const res = await API.request('/api/study-sessions', {
          method: 'POST',
          body: JSON.stringify({
            subject_id: timerState.subjectId,
            topic_id: timerState.topicId,
            duration_seconds: totalSecs,
            notes
          })
        });

        API.showToast('Study session recorded! 🎉');
        modal.classList.remove('active');
        resetTimer();

        if (res.unlockedBadges && res.unlockedBadges.length > 0) {
          res.unlockedBadges.forEach(b => {
            API.showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success');
          });
        }

        await loadHistory(currentFilter);
      } catch (err) {
        API.showToast(err.message || 'Failed to save session.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Session';
      }
    });
  }
}

function openFinishModal(isCompleted = false) {
  let studied = timerState.timeStudiedSeconds;
  if (timerState.running && timerState.startTime) {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const rem = Math.max(0, timerState.startRemaining - elapsed);
    studied = timerState.targetSeconds - rem;
  }

  if (studied <= 0) {
    API.showToast('No study time logged yet.', 'error');
    return;
  }

  if (timerState.running) {
    pauseTimer();
  }

  const subjectSelect = document.getElementById('timer-subject-select');
  const topicSelect = document.getElementById('timer-topic-select');

  const subjectName = subjectSelect && subjectSelect.selectedIndex > 0 ? subjectSelect.options[subjectSelect.selectedIndex].text : 'General Preparation';
  const topicName = topicSelect && topicSelect.selectedIndex > 0 ? topicSelect.options[topicSelect.selectedIndex].text : 'General Study & Practice';

  document.getElementById('finish-modal-duration').textContent = API.formatHoursMinutes(studied);
  document.getElementById('finish-modal-subject').textContent = subjectName;
  document.getElementById('finish-modal-topic').textContent = topicName;
  document.getElementById('finish-notes-input').value = '';

  const titleEl = document.getElementById('modal-complete-title');
  if (titleEl) {
    titleEl.textContent = isCompleted ? "Timer Completed! Great Work 🎉" : "Session Finished 🎉";
  }

  document.getElementById('finish-modal').classList.add('active');
}

/**
 * Persistence in LocalStorage
 */
function saveTimerState() {
  localStorage.setItem('gatetrack_countdown_timer', JSON.stringify({
    running: timerState.running,
    paused: timerState.paused,
    targetSeconds: timerState.targetSeconds,
    remainingSeconds: timerState.remainingSeconds,
    startRemaining: timerState.startRemaining,
    startTime: timerState.startTime,
    timeStudiedSeconds: timerState.timeStudiedSeconds,
    subjectId: timerState.subjectId,
    topicId: timerState.topicId
  }));
}

function clearTimerState() {
  localStorage.removeItem('gatetrack_countdown_timer');
}

function restoreTimerState() {
  const saved = localStorage.getItem('gatetrack_countdown_timer');
  if (!saved) {
    setTimerDuration(45 * 60);
    return;
  }

  try {
    const data = JSON.parse(saved);
    timerState.targetSeconds = data.targetSeconds || 45 * 60;
    timerState.remainingSeconds = data.remainingSeconds || timerState.targetSeconds;
    timerState.startRemaining = data.startRemaining || timerState.remainingSeconds;
    timerState.timeStudiedSeconds = data.timeStudiedSeconds || 0;
    timerState.subjectId = data.subjectId;
    timerState.topicId = data.topicId;

    // Highlight matching preset button if any
    const minutes = Math.round(timerState.targetSeconds / 60);
    const presetBtn = document.querySelector(`.timer-preset-btn[data-minutes="${minutes}"]`);
    if (presetBtn) {
      document.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
      presetBtn.classList.add('active');
    }

    const targetLabel = document.getElementById('timer-target-label');
    if (targetLabel) {
      targetLabel.textContent = `Target: ${API.formatHoursMinutes(timerState.targetSeconds)}`;
    }

    if (timerState.subjectId) {
      const subjSelect = document.getElementById('timer-subject-select');
      if (subjSelect) {
        subjSelect.value = timerState.subjectId;
        subjSelect.dispatchEvent(new Event('change'));
      }
    }

    if (timerState.topicId) {
      const topicSelect = document.getElementById('timer-topic-select');
      if (topicSelect) {
        setTimeout(() => {
          topicSelect.value = timerState.topicId;
          updateActiveTopicLabel();
        }, 120);
      }
    } else {
      updateActiveTopicLabel();
    }

    if (data.running && data.startTime) {
      const elapsedSinceCrash = Math.floor((Date.now() - data.startTime) / 1000);
      const restoredRemaining = Math.max(0, data.startRemaining - elapsedSinceCrash);
      timerState.remainingSeconds = restoredRemaining;
      timerState.timeStudiedSeconds = timerState.targetSeconds - restoredRemaining;

      if (restoredRemaining > 0) {
        timerState.running = true;
        timerState.startTime = Date.now();
        timerState.startRemaining = restoredRemaining;
        startInterval();
        updateUIState('running');
      } else {
        timerState.running = false;
        timerState.paused = false;
        updateUIState('stopped');
      }
    } else if (data.paused) {
      timerState.paused = true;
      updateUIState('paused');
    } else {
      updateUIState('stopped');
    }

    updateDisplay();
  } catch {
    clearTimerState();
    setTimerDuration(45 * 60);
  }
}

/**
 * History & Filter Pills
 */
function initHistoryFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', async () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      await loadHistory(currentFilter);
    });
  });
}

async function loadHistory(filter) {
  const container = document.getElementById('timer-history-list');
  const totalDisplay = document.getElementById('history-total-time');
  if (!container) return;

  container.innerHTML = `<div class="text-sm text-muted" style="padding: 1rem; text-align: center;"><span class="spinner"></span> Loading history...</div>`;

  try {
    const data = await API.request(`/api/study-sessions?filter=${filter}`);
    if (totalDisplay) {
      totalDisplay.textContent = API.formatHoursMinutes(data.totalDurationSeconds);
    }

    if (!data.sessions || data.sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
          <div class="empty-state-title" style="font-size: 1rem;">No sessions logged</div>
          <div class="empty-state-desc" style="font-size: 0.8rem;">No study sessions found for this period.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.sessions.map(s => {
      const startDt = new Date(s.started_at);
      const endDt = new Date(s.ended_at);
      const dateStr = startDt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = `${startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return `
        <div class="history-card">
          <div class="history-card-meta">
            <div class="history-card-subject">${escapeHTML(s.subject_name || 'GATE CSE')}</div>
            <div class="history-card-topic">${escapeHTML(s.topic_name || 'General Study')}</div>
            <div class="history-card-time">${dateStr} • ${timeStr}</div>
            ${s.notes ? `<div class="text-xs text-muted" style="margin-top: 0.25rem;">📝 ${escapeHTML(s.notes)}</div>` : ''}
          </div>
          <div class="history-card-duration">
            ${API.formatHoursMinutes(s.duration_seconds)}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-sm" style="color: var(--danger); padding: 1rem;">Failed to load history.</div>`;
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
