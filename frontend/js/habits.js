/**
 * GATETrack - Habit Tracker Controller
 */

let habitsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderDateBanner();
  initAddHabitModal();
  await loadHabits();
});

function renderDateBanner() {
  const dateEl = document.getElementById('habits-today-date');
  if (dateEl) {
    const today = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-US', options);
  }
}

async function loadHabits() {
  const container = document.getElementById('habits-list-container');
  if (container) {
    container.innerHTML = `<div class="text-sm text-muted" style="padding: 2rem; text-align: center;"><span class="spinner"></span> Loading habits...</div>`;
  }

  try {
    const data = await API.request('/api/habits');
    habitsList = data.habits || [];

    renderSummaryMetrics(data.summary);
    renderHabits(habitsList);
  } catch (err) {
    console.error('Failed to load habits:', err);
    if (container) {
      container.innerHTML = `<div class="card" style="color: var(--danger); text-align: center;">Failed to load habits.</div>`;
    }
  }
}

function renderSummaryMetrics(summary) {
  const countEl = document.getElementById('habits-summary-count');
  const percentEl = document.getElementById('habits-summary-percent');
  const fillEl = document.getElementById('habits-summary-fill');

  if (countEl) countEl.textContent = `${summary.completedToday} of ${summary.total} Completed`;
  if (percentEl) percentEl.textContent = `${summary.percentageToday}%`;
  if (fillEl) fillEl.style.width = `${summary.percentageToday}%`;
}

function renderHabits(habits) {
  const container = document.getElementById('habits-list-container');
  if (!container) return;

  if (!habits || habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No habits created yet</div>
        <div class="empty-state-desc">Consistent daily habits are the key to a top GATE rank. Add your first habit to get started!</div>
        <button class="btn btn-primary" onclick="openAddHabitModal()">+ Add Your First Habit</button>
      </div>
    `;
    return;
  }

  container.innerHTML = habits.map(h => `
    <div class="habit-row ${h.is_completed_today ? 'completed' : ''}" id="habit-row-${h.id}">
      <div class="habit-left">
        <button class="habit-check-btn" onclick="toggleHabit(${h.id})" title="${h.is_completed_today ? 'Mark Incomplete' : 'Mark Completed'}">
          ✓
        </button>
        <span class="habit-icon">${h.icon || '🎯'}</span>
        <div class="habit-details">
          <div class="habit-name">${escapeHTML(h.name)}</div>
          <div class="habit-desc">${escapeHTML(h.target || h.description || 'Daily habit')}</div>
        </div>
      </div>

      <div class="habit-right">
        <div class="habit-streak-badge">
          🔥 ${h.currentStreak} day${h.currentStreak === 1 ? '' : 's'}
        </div>
        <div class="habit-best-streak text-xs text-muted">
          Best: ${h.bestStreak}d
        </div>
        <button class="habit-actions-btn" onclick="deleteHabit(${h.id}, '${escapeHTML(h.name)}')" title="Delete Habit">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleHabit = async function(habitId) {
  try {
    const res = await API.request(`/api/habits/${habitId}/toggle`, { method: 'POST' });
    API.showToast(res.message);

    if (res.unlockedBadges && res.unlockedBadges.length > 0) {
      res.unlockedBadges.forEach(b => {
        API.showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success');
      });
    }

    await loadHabits();
  } catch (err) {
    API.showToast('Failed to toggle habit status.', 'error');
  }
};

window.deleteHabit = async function(habitId, habitName) {
  if (!confirm(`Are you sure you want to delete the habit "${habitName}"? Your completion history for this habit will be removed.`)) {
    return;
  }

  try {
    await API.request(`/api/habits/${habitId}`, { method: 'DELETE' });
    API.showToast('Habit deleted.');
    await loadHabits();
  } catch (err) {
    API.showToast('Failed to delete habit.', 'error');
  }
};

function initAddHabitModal() {
  const modal = document.getElementById('add-habit-modal');
  const openBtn = document.getElementById('open-add-habit-btn');
  const closeBtn = document.getElementById('close-add-habit-modal');
  const form = document.getElementById('add-habit-form');

  if (openBtn) openBtn.addEventListener('click', () => openAddHabitModal());
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('habit-name-input').value.trim();
      const target = document.getElementById('habit-target-input').value.trim();
      const icon = document.getElementById('habit-icon-select').value;
      const desc = document.getElementById('habit-desc-input').value.trim();
      const submitBtn = document.getElementById('create-habit-submit-btn');

      if (!name) {
        API.showToast('Please enter a habit name.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creating...';

      try {
        await API.request('/api/habits', {
          method: 'POST',
          body: JSON.stringify({
            name,
            target,
            icon,
            description: desc,
            frequency: 'daily'
          })
        });

        API.showToast('Habit created! 🎯');
        modal.classList.remove('active');
        form.reset();
        await loadHabits();
      } catch (err) {
        API.showToast(err.message || 'Failed to create habit.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Habit';
      }
    });
  }
}

window.openAddHabitModal = function() {
  const modal = document.getElementById('add-habit-modal');
  if (modal) modal.classList.add('active');
};

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
