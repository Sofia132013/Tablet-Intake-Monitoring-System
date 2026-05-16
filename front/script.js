import {API_URL} from '/env.js'


document.addEventListener('DOMContentLoaded', function() {
  const TOKEN_KEY = 'pill_reminder_token';
  const USER_KEY = 'pill_reminder_user';

  const monthYearEl = document.getElementById('month-year');
  const daysEl = document.getElementById('days');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const todayBtn = document.getElementById('today-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const eventDateEl = document.getElementById('event-date');
  const eventListEl = document.getElementById('event-list');
  const addPillBtn = document.getElementById('add-pill-btn');
  const pillNameInput = document.getElementById('pill-name');
  const pillTimeInput = document.getElementById('pill-time');
  const pillDosageInput = document.getElementById('pill-dosage');

  let currentDate = new Date();
  let selectedDate = null;
  let medications = [];
  let pills = {};

  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    window.location.href = '/login';
    return;
  }

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request error');
    }

    return data;
  }

  async function loadMedications() {
    try {
      medications = await apiRequest('/medications');
      pills = buildPillsByDate(medications);
      renderCalendar();

      if (selectedDate) {
        const dateStr = getDateKey(selectedDate);
        showPills(dateStr);
      }
    } catch (err) {
      if (
        err.message === 'Invalid token' ||
        err.message === 'Access denied. No token provided.' ||
        err.message === 'Token expired. Please login again.'
      ) {
        logout();
        return;
      }

      eventListEl.innerHTML = `<div class="no-events">${escapeHtml(err.message)}</div>`;
    }
  }

  function buildPillsByDate(items) {
    const result = {};

    items.forEach(medication => {
      medication.schedules.forEach(schedule => {
        const dateStr = schedule.date;
        const intake = medication.intakes.find(item => {
          return item.date === schedule.date && item.time === schedule.time;
        });

        if (!result[dateStr]) {
          result[dateStr] = [];
        }

        result[dateStr].push({
          medicationId: medication.id,
          scheduleId: schedule.id,
          name: medication.name,
          time: schedule.time,
          dosage: medication.dosage || '',
          taken: Boolean(intake),
        });
      });
    });

    return result;
  }

  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function formatDateKey(dateStr) {
    return dateStr;
  }

  function renderCalendar() {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const prevLastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );

    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    monthYearEl.innerHTML = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    let days = '';

    for (let x = firstDayIndex; x > 0; x--) {
      const prevDate = prevLastDay.getDate() - x + 1;
      const dateKey = getDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevDate));
      const hasPill = pills[dateKey] !== undefined;

      days += `<div class="day other-month${hasPill ? ' has-events' : ''}">${prevDate}</div>`;
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );

      const dateKey = getDateKey(date);
      const hasPill = pills[dateKey] !== undefined;

      let dayClass = 'day';

      if (
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()
      ) {
        dayClass += ' today';
      }

      if (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      ) {
        dayClass += ' selected';
      }

      if (hasPill) {
        dayClass += ' has-events';
      }

      days += `<div class="${dayClass}" data-date="${dateKey}">${i}</div>`;
    }

    for (let j = 1; j <= nextDays; j++) {
      const dateKey = getDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, j));
      const hasPill = pills[dateKey] !== undefined;

      days += `<div class="day other-month${hasPill ? ' has-events' : ''}">${j}</div>`;
    }

    daysEl.innerHTML = days;

    document.querySelectorAll('.day:not(.other-month)').forEach(day => {
      day.addEventListener('click', () => {
        const dateStr = day.getAttribute('data-date');
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        selectedDate = new Date(year, month - 1, dayNum);
        renderCalendar();
        showPills(dateStr);
      });
    });
  }

  async function togglePillTaken(dateStr, pillIndex) {
    const pill = pills[dateStr] && pills[dateStr][pillIndex];

    if (!pill || pill.taken) {
      return;
    }

    try {
      await apiRequest('/intake', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: pill.medicationId,
          date: formatDateKey(dateStr),
          time: pill.time,
          taken: true,
        }),
      });

      await loadMedications();
      showPills(dateStr);
    } catch (err) {
      alert(err.message);
    }
  }

  async function deletePill(dateStr, pillIndex) {
    const pill = pills[dateStr] && pills[dateStr][pillIndex];

    if (!pill) {
      return;
    }

    const isConfirmed = confirm('Delete this medication and all its schedules?');

    if (!isConfirmed) {
      return;
    }

    try {
      await apiRequest(`/medications/${pill.medicationId}`, {
        method: 'DELETE',
      });

      await loadMedications();
      showPills(dateStr);
    } catch (err) {
      alert(err.message);
    }
  }

  function showPills(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dateObj.getDay()];

    eventDateEl.textContent = `${dayName}, ${months[dateObj.getMonth()]} ${day}, ${year}`;
    eventListEl.innerHTML = '';

    if (pills[dateStr] && pills[dateStr].length > 0) {
      const sortedPills = [...pills[dateStr]].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

      sortedPills.forEach(pill => {
        const originalIndex = pills[dateStr].findIndex(p => p === pill);
        const pillItem = document.createElement('div');
        const displayTime = pill.time ? pill.time.substring(0, 5) : 'Not set';

        pillItem.className = `pill-item ${pill.taken ? 'pill-taken' : ''}`;
        pillItem.innerHTML = `
          <div class="pill-info">
            <div class="pill-name">
              <i class="fas fa-capsules"></i>
              <strong>${escapeHtml(pill.name)}</strong>
            </div>
            <div class="pill-details">
              <span class="pill-time"><i class="far fa-clock"></i> ${displayTime}</span>
              ${pill.dosage ? `<span class="pill-dosage"><i class="fas fa-weight-hanging"></i> ${escapeHtml(pill.dosage)}</span>` : ''}
            </div>
          </div>
          <div class="pill-actions">
            <button class="pill-taken-btn ${pill.taken ? 'taken' : ''}" data-index="${originalIndex}">
              <i class="fas ${pill.taken ? 'fa-check-circle' : 'fa-circle'}"></i>
            </button>
            <button class="pill-delete-btn" data-index="${originalIndex}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;

        eventListEl.appendChild(pillItem);
      });

      document.querySelectorAll('.pill-taken-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt(btn.dataset.index);
          togglePillTaken(dateStr, index);
        });
      });

      document.querySelectorAll('.pill-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt(btn.dataset.index);
          deletePill(dateStr, index);
        });
      });
    } else {
      eventListEl.innerHTML = '<div class="no-events"><i class="fas fa-pills"></i> No pills scheduled for this day<br><small>Use the form above to add pills!</small></div>';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function addPill() {
    if (!selectedDate) {
      alert('Please select a date first!');
      return;
    }

    const pillName = pillNameInput.value.trim();
    const pillTime = pillTimeInput.value;
    const pillDosage = pillDosageInput.value.trim();

    if (!pillName) {
      alert('Please enter pill name!');
      return;
    }

    if (!pillTime) {
      alert('Please select time!');
      return;
    }

    const dateStr = getDateKey(selectedDate);

    try {
      const medication = await apiRequest('/medications', {
        method: 'POST',
        body: JSON.stringify({
          name: pillName,
          dosage: pillDosage || '',
        }),
      });

      await apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: medication.id,
          date: formatDateKey(dateStr),
          time: pillTime,
        }),
      });

      pillNameInput.value = '';
      pillTimeInput.value = '';
      pillDosageInput.value = '';

      await loadMedications();
      showPills(dateStr);
    } catch (err) {
      alert(err.message);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('pill_reminder_session');
    window.location.href = '/login';
  }

  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    eventDateEl.textContent = 'Select a date';
    eventListEl.innerHTML = '<div class="no-events">Select a date to add or view pills</div>';
    selectedDate = null;
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    eventDateEl.textContent = 'Select a date';
    eventListEl.innerHTML = '<div class="no-events">Select a date to add or view pills</div>';
    selectedDate = null;
  });

  todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();

    const dateStr = getDateKey(currentDate);
    showPills(dateStr);
  });

  logoutBtn.addEventListener('click', logout);

  addPillBtn.addEventListener('click', addPill);

  pillNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });

  pillTimeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });

  pillDosageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });

  renderCalendar();
  loadMedications();
});
