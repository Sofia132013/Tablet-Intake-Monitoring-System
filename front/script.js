document.addEventListener('DOMContentLoaded', function() {
  const monthYearEl = document.getElementById('month-year');
  const daysEl = document.getElementById('days');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const todayBtn = document.getElementById('today-btn');
  const eventDateEl = document.getElementById('event-date');
  const eventListEl = document.getElementById('event-list');
  const addPillBtn = document.getElementById('add-pill-btn');
  const pillNameInput = document.getElementById('pill-name');
  const pillTimeInput = document.getElementById('pill-time');
  const pillDosageInput = document.getElementById('pill-dosage');
  
  let currentDate = new Date();
  let selectedDate = null;
  
  // Load pills from localStorage or use default
  let pills = loadPills();
  
  // Sample default pills if empty
  if (Object.keys(pills).length === 0) {
    pills = {
      '2025-9-15': [
        { name: 'Aspirin', time: '08:00', dosage: '100', taken: false },
        { name: 'Vitamin D', time: '20:00', dosage: '2000', taken: false }
      ],
      '2025-9-20': [
        { name: 'Lisinopril', time: '09:00', dosage: '10', taken: false }
      ],
      '2025-9-25': [
        { name: 'Metformin', time: '19:00', dosage: '500', taken: false },
        { name: 'Aspirin', time: '08:00', dosage: '100', taken: false }
      ]
    };
    savePills();
  }
  
  // Save pills to localStorage
  function savePills() {
    localStorage.setItem('pills', JSON.stringify(pills));
  }
  
  // Load pills from localStorage
  function loadPills() {
    const saved = localStorage.getItem('pills');
    return saved ? JSON.parse(saved) : {};
  }
  
  // Render calendar
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
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    monthYearEl.innerHTML = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    let days = "";
    
    // Previous month days
    for (let x = firstDayIndex; x > 0; x--) {
      const prevDate = prevLastDay.getDate() - x + 1;
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${prevDate}`;
      const hasPill = pills[dateKey] !== undefined;
      
      days += `<div class="day other-month${hasPill ? ' has-events' : ''}">${prevDate}</div>`;
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${i}`;
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
    
    // Next month days
    for (let j = 1; j <= nextDays; j++) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 2}-${j}`;
      const hasPill = pills[dateKey] !== undefined;
      
      days += `<div class="day other-month${hasPill ? ' has-events' : ''}">${j}</div>`;
    }
    
    daysEl.innerHTML = days;
    
    // Add click event to days
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
  
  // Toggle pill taken status
  function togglePillTaken(dateStr, pillIndex) {
    if (pills[dateStr] && pills[dateStr][pillIndex]) {
      pills[dateStr][pillIndex].taken = !pills[dateStr][pillIndex].taken;
      savePills();
      showPills(dateStr); // Refresh the display
      renderCalendar(); // Update calendar indicators
    }
  }
  
  // Delete pill
  function deletePill(dateStr, pillIndex) {
    if (pills[dateStr]) {
      pills[dateStr].splice(pillIndex, 1);
      if (pills[dateStr].length === 0) {
        delete pills[dateStr];
      }
      savePills();
      showPills(dateStr);
      renderCalendar();
    }
  }
  
  // Show pills for selected date
  function showPills(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dateObj.getDay()];
  
  eventDateEl.textContent = `${dayName}, ${months[dateObj.getMonth()]} ${day}, ${year}`;
  
  // Clear previous pills
  eventListEl.innerHTML = '';
  
  if (pills[dateStr] && pills[dateStr].length > 0) {
    // Сортируем таблетки по времени
    const sortedPills = [...pills[dateStr]].sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    
    let currentHour = null;
    
    sortedPills.forEach((pill, sortedIndex) => {
      const originalIndex = pills[dateStr].findIndex(p => p === pill);
      const pillHour = pill.time ? pill.time.substring(0, 2) : null;
      
    //   if (pillHour && pillHour !== currentHour) {
    //     currentHour = pillHour;
    //     const hourSeparator = document.createElement('div');
    //     hourSeparator.className = 'hour-separator';
    //     hourSeparator.innerHTML = `<i class="fas fa-sun"></i> ${currentHour}:00 - ${parseInt(currentHour) + 1}:00`;
    //     eventListEl.appendChild(hourSeparator);
    //   }
      
      const pillItem = document.createElement('div');
      pillItem.className = `pill-item ${pill.taken ? 'pill-taken' : ''}`;
      const displayTime = pill.time ? pill.time.substring(0, 5) : 'Not set';
      
      pillItem.innerHTML = `
        <div class="pill-info">
          <div class="pill-name">
            <i class="fas fa-capsules"></i>
            <strong>${escapeHtml(pill.name)}</strong>
          </div>
          <div class="pill-details">
            <span class="pill-time"><i class="far fa-clock"></i> ${displayTime}</span>
            ${pill.dosage ? `<span class="pill-dosage"><i class="fas fa-weight-hanging"></i> ${pill.dosage} mg</span>` : ''}
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
  ////////////////////////////////////
  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Add new pill
  function addPill() {
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
    
    const dateStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    
    if (!pills[dateStr]) {
      pills[dateStr] = [];
    }
    
    pills[dateStr].push({
      name: pillName,
      time: pillTime,
      dosage: pillDosage || '',
      taken: false
    });
    
    savePills();
    
    // Clear form
    pillNameInput.value = '';
    pillTimeInput.value = '';
    pillDosageInput.value = '';
    
    // Refresh display
    showPills(dateStr);
    renderCalendar();
  }
  
  // Previous month
  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    eventDateEl.textContent = 'Select a date';
    eventListEl.innerHTML = '<div class="no-events">Select a date to add or view pills</div>';
    selectedDate = null;
  });
  
  // Next month
  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    eventDateEl.textContent = 'Select a date';
    eventListEl.innerHTML = '<div class="no-events">Select a date to add or view pills</div>';
    selectedDate = null;
  });
  
  // Today button
  todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    showPills(dateStr);
  });
  
  // Add pill button
  addPillBtn.addEventListener('click', addPill);
  
  // Allow Enter key in form
  pillNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });
  pillTimeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });
  pillDosageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPill();
  });
  
  // Initialize calendar
  renderCalendar();
});