/**
 * GATETrack - Syllabus Tracker Controller
 */

let syllabusData = {
  summary: {},
  subjects: []
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadSyllabus();
});

async function loadSyllabus() {
  const container = document.getElementById('syllabus-subjects-container');
  if (container) {
    container.innerHTML = `<div class="text-sm text-muted" style="padding: 2rem; text-align: center;"><span class="spinner"></span> Loading GATE CSE Syllabus...</div>`;
  }

  try {
    const data = await API.request('/api/syllabus');
    syllabusData = data;

    renderOverallSummary(data.summary);
    renderSubjects(data.subjects);
  } catch (err) {
    console.error('Failed to load syllabus:', err);
    if (container) {
      container.innerHTML = `<div class="card" style="color: var(--danger); text-align: center;">Failed to load syllabus. Please refresh.</div>`;
    }
  }
}

function renderOverallSummary(summary) {
  const percentEl = document.getElementById('syllabus-overall-percent');
  const barFillEl = document.getElementById('syllabus-overall-fill');
  const completedEl = document.getElementById('stat-completed-count');
  const inProgressEl = document.getElementById('stat-in-progress-count');
  const notStartedEl = document.getElementById('stat-not-started-count');

  if (percentEl) percentEl.textContent = `${summary.percentage}%`;
  if (barFillEl) barFillEl.style.width = `${summary.percentage}%`;
  if (completedEl) completedEl.textContent = `${summary.completedTopics} Completed`;
  if (inProgressEl) inProgressEl.textContent = `${summary.inProgressTopics} In Progress`;
  if (notStartedEl) notStartedEl.textContent = `${summary.notStartedTopics} Not Started`;
}

function renderSubjects(subjects) {
  const container = document.getElementById('syllabus-subjects-container');
  if (!container) return;

  if (!subjects || subjects.length === 0) {
    container.innerHTML = `<div class="card">No subjects available in syllabus.</div>`;
    return;
  }

  container.innerHTML = subjects.map(s => `
    <div class="subject-card" id="subject-card-${s.id}">
      <div class="subject-card-header" onclick="toggleSubjectAccordion(${s.id})">
        <div class="subject-title-area">
          <span class="subject-code-badge">${escapeHTML(s.code)}</span>
          <div>
            <div class="subject-name">${escapeHTML(s.name)}</div>
            <div class="text-xs text-muted" style="margin-top: 0.15rem;">${escapeHTML(s.description || '')}</div>
          </div>
        </div>
        <div class="subject-progress-area">
          <div style="width: 140px;">
            <div class="progress-container">
              <div class="progress-bar-fill ${s.percentage === 100 ? 'progress-fill-success' : ''}" 
                   id="subject-fill-${s.id}" 
                   style="width: ${s.percentage}%;"></div>
            </div>
          </div>
          <div class="subject-fraction" id="subject-fraction-${s.id}">
            ${s.completedTopics} / ${s.totalTopics} (${s.percentage}%)
          </div>
          <span class="subject-accordion-icon">▼</span>
        </div>
      </div>

      <div class="topics-drawer" id="topics-drawer-${s.id}">
        ${renderTopics(s.topics, s.id)}
      </div>
    </div>
  `).join('');
}

function renderTopics(topics, subjectId) {
  if (!topics || topics.length === 0) {
    return `<div class="text-xs text-muted" style="padding: 0.5rem 0;">No topics found under this subject.</div>`;
  }

  return topics.map(t => `
    <div class="topic-row" id="topic-row-${t.id}">
      <div class="topic-name">${escapeHTML(t.name)}</div>
      <div class="topic-status-group">
        <button class="status-btn ${t.status === 'not_started' ? 'active not_started' : ''}" 
                onclick="updateTopicStatus(${t.id}, 'not_started', ${subjectId})" 
                title="Mark as Not Started">
          ☐ Not Started
        </button>
        <button class="status-btn ${t.status === 'in_progress' ? 'active in_progress' : ''}" 
                onclick="updateTopicStatus(${t.id}, 'in_progress', ${subjectId})" 
                title="Mark as In Progress">
          ◐ In Progress
        </button>
        <button class="status-btn ${t.status === 'completed' ? 'active completed' : ''}" 
                onclick="updateTopicStatus(${t.id}, 'completed', ${subjectId})" 
                title="Mark as Completed">
          ✓ Completed
        </button>
      </div>
    </div>
  `).join('');
}

window.toggleSubjectAccordion = function(subjectId) {
  const card = document.getElementById(`subject-card-${subjectId}`);
  if (card) {
    card.classList.toggle('expanded');
  }
};

window.updateTopicStatus = async function(topicId, newStatus, subjectId) {
  try {
    const res = await API.request(`/api/syllabus/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    API.showToast('Progress updated!');

    // Update buttons in this topic row
    const row = document.getElementById(`topic-row-${topicId}`);
    if (row) {
      row.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active', 'not_started', 'in_progress', 'completed');
        if (btn.textContent.includes('Not Started') && newStatus === 'not_started') {
          btn.classList.add('active', 'not_started');
        } else if (btn.textContent.includes('In Progress') && newStatus === 'in_progress') {
          btn.classList.add('active', 'in_progress');
        } else if (btn.textContent.includes('Completed') && newStatus === 'completed') {
          btn.classList.add('active', 'completed');
        }
      });
    }

    // Update local state in subject & overall
    const subject = syllabusData.subjects.find(s => s.id === subjectId);
    if (subject) {
      const topic = subject.topics.find(t => t.id === topicId);
      if (topic) topic.status = newStatus;

      subject.completedTopics = subject.topics.filter(t => t.status === 'completed').length;
      subject.inProgressTopics = subject.topics.filter(t => t.status === 'in_progress').length;
      subject.notStartedTopics = subject.totalTopics - subject.completedTopics - subject.inProgressTopics;
      subject.percentage = Math.round((subject.completedTopics / subject.totalTopics) * 100);

      // Update subject fraction & bar
      const fillEl = document.getElementById(`subject-fill-${subjectId}`);
      const fracEl = document.getElementById(`subject-fraction-${subjectId}`);
      if (fillEl) fillEl.style.width = `${subject.percentage}%`;
      if (fracEl) fracEl.textContent = `${subject.completedTopics} / ${subject.totalTopics} (${subject.percentage}%)`;
    }

    // Recalculate overall summary
    let allTotal = 0, allCompleted = 0, allInProgress = 0;
    syllabusData.subjects.forEach(s => {
      allTotal += s.totalTopics;
      allCompleted += s.completedTopics;
      allInProgress += s.inProgressTopics;
    });
    const allNotStarted = allTotal - allCompleted - allInProgress;
    const allPercentage = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

    renderOverallSummary({
      totalTopics: allTotal,
      completedTopics: allCompleted,
      inProgressTopics: allInProgress,
      notStartedTopics: allNotStarted,
      percentage: allPercentage
    });

    // Check newly unlocked badges
    if (res.unlockedBadges && res.unlockedBadges.length > 0) {
      res.unlockedBadges.forEach(b => {
        API.showToast(`🏆 Badge Unlocked: ${b.name}!`, 'success');
      });
    }
  } catch (err) {
    API.showToast(err.message || 'Failed to update topic status.', 'error');
  }
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
