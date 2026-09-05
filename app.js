/* ==========================================================================
   Cloud-Based Farm Irrigation Scheduling System - Main Application Logic
   Handles UI Interactions, Form Validations, LocalStorage, Admin Panel, Filters
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Application State
  App.init();
});

const App = {
  schedules: [],
  isAdminLoggedIn: false,
  activeArchTab: 'mqtt',

  init() {
    this.loadSchedules();
    this.setupEventListeners();
    this.initRealtimeTelemetry();
    this.renderSchedulesTable();
    this.updateStatsCounters();
    
    // Initial chart rendering
    setTimeout(() => {
      farmCharts.renderMoistureChart('moistureChart');
      farmCharts.renderWaterSavedChart('waterSavedChart');
    }, 200);

    window.addEventListener('resize', () => {
      farmCharts.renderMoistureChart('moistureChart');
      farmCharts.renderWaterSavedChart('waterSavedChart');
    });
  },

  loadSchedules() {
    const stored = localStorage.getItem('cloud_irrigation_schedules');
    if (stored) {
      try {
        this.schedules = JSON.parse(stored);
      } catch (e) {
        this.schedules = [];
      }
    }
    
    // Seed default sample schedules if empty
    if (!this.schedules || this.schedules.length === 0) {
      this.schedules = [
        {
          id: 'IRR-8921',
          farmerName: 'Ramesh Patel',
          location: 'North Sector Block A',
          cropType: 'Wheat',
          moistureLevel: 28,
          weatherCondition: 'Sunny',
          dateTime: '2026-09-06T06:00',
          status: 'Scheduled',
          createdAt: new Date().toISOString()
        },
        {
          id: 'IRR-8922',
          farmerName: 'Sunita Sharma',
          location: 'East Orchard Sector 2',
          cropType: 'Rice',
          moistureLevel: 42,
          weatherCondition: 'Cloudy',
          dateTime: '2026-09-05T18:30',
          status: 'In Progress',
          createdAt: new Date().toISOString()
        },
        {
          id: 'IRR-8923',
          farmerName: 'Vikram Singh',
          location: 'Greenhouse Sector 4',
          cropType: 'Vegetables',
          moistureLevel: 55,
          weatherCondition: 'Rainy',
          dateTime: '2026-09-04T07:00',
          status: 'Completed',
          createdAt: new Date().toISOString()
        }
      ];
      this.saveSchedules();
    }
  },

  saveSchedules() {
    localStorage.setItem('cloud_irrigation_schedules', JSON.stringify(this.schedules));
    this.renderSchedulesTable();
    this.updateStatsCounters();
  },

  setupEventListeners() {
    // Navigation Mobile Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active');
        });
      });
    }

    // Moisture Range Slider Sync
    const moistureInput = document.getElementById('soilMoisture');
    const moistureValBadge = document.getElementById('moistureValBadge');
    if (moistureInput && moistureValBadge) {
      moistureInput.addEventListener('input', (e) => {
        moistureValBadge.textContent = `${e.target.value}%`;
        this.updateFormRecommendation();
      });
    }

    const cropSelect = document.getElementById('cropType');
    if (cropSelect) {
      cropSelect.addEventListener('change', () => this.updateFormRecommendation());
    }

    // Form Submission
    const scheduleForm = document.getElementById('irrigationForm');
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
    }

    // Search and Filters
    const searchInput = document.getElementById('searchSchedule');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderSchedulesTable());
    }

    const statusFilter = document.getElementById('filterStatus');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.renderSchedulesTable());
    }

    // Tracking Lookup Form
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
      trackForm.addEventListener('submit', (e) => this.handleTrackLookup(e));
    }

    // Admin Login Modal
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', () => this.toggleAdminModal(true));
    }

    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
    }

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
    }
  },

  initRealtimeTelemetry() {
    cloudSim.subscribe((telemetry, zones, metrics) => {
      // Update UI Telemetry Cards
      const moistureEl = document.getElementById('telemetryMoisture');
      const tempEl = document.getElementById('telemetryTemp');
      const humidityEl = document.getElementById('telemetryHumidity');
      const solarEl = document.getElementById('telemetrySolar');
      const cloudMsgEl = document.getElementById('cloudMsgCount');

      if (moistureEl) moistureEl.textContent = `${telemetry.moisture}%`;
      if (tempEl) tempEl.textContent = `${telemetry.temperature}°C`;
      if (humidityEl) humidityEl.textContent = `${telemetry.humidity}%`;
      if (solarEl) solarEl.textContent = `${telemetry.solarRadiation} W/m²`;
      if (cloudMsgEl) cloudMsgEl.textContent = metrics.messagesProcessed.toLocaleString();

      // Update progress bar
      const moistureProgress = document.getElementById('telemetryMoistureProgress');
      if (moistureProgress) {
        moistureProgress.style.width = `${telemetry.moisture}%`;
        if (telemetry.moisture < 30) {
          moistureProgress.className = 'progress-bar-fill danger';
        } else if (telemetry.moisture < 40) {
          moistureProgress.className = 'progress-bar-fill warning';
        } else {
          moistureProgress.className = 'progress-bar-fill';
        }
      }

      // Render zones grid
      this.renderZonesGrid(zones);

      // Update Live Box in Cloud Architecture Inspector if open
      this.updateArchInspectorBox();

      // Update canvas real-time point
      farmCharts.pushRealtimeValue(telemetry.moisture);
      farmCharts.renderMoistureChart('moistureChart');
    });

    cloudSim.start();
  },

  switchArchTab(tab) {
    this.activeArchTab = tab;
    
    ['archTabMqtt', 'archTabCost', 'archTabLambda'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.className = 'btn btn-sm btn-outline';
    });

    if (tab === 'mqtt') {
      const b = document.getElementById('archTabMqtt');
      if (b) b.className = 'btn btn-sm btn-primary';
    } else if (tab === 'cost') {
      const b = document.getElementById('archTabCost');
      if (b) b.className = 'btn btn-sm btn-primary';
    } else if (tab === 'lambda') {
      const b = document.getElementById('archTabLambda');
      if (b) b.className = 'btn btn-sm btn-primary';
    }

    this.updateArchInspectorBox();
  },

  updateArchInspectorBox() {
    const box = document.getElementById('liveMqttJson');
    if (!box) return;

    if (this.activeArchTab === 'mqtt') {
      box.textContent = cloudSim.generateMqttPayload();
    } else if (this.activeArchTab === 'cost') {
      box.textContent = cloudSim.generateCostBreakdown();
    } else if (this.activeArchTab === 'lambda') {
      box.textContent = cloudSim.generateLambdaCode();
    }
  },

  renderZonesGrid(zones) {
    const container = document.getElementById('zonesGrid');
    if (!container) return;

    container.innerHTML = zones.map(zone => `
      <div class="glass-card zone-card">
        <div class="zone-header">
          <h4>${zone.name}</h4>
          <span class="zone-badge ${zone.valve === 'ON' ? 'badge-active' : 'badge-idle'}">
            ${zone.valve === 'ON' ? '⚡ Irrigating' : 'Idle'}
          </span>
        </div>
        <div class="zone-details">
          <span class="detail-label">Crop Type:</span>
          <span class="detail-value">${zone.crop}</span>
          <span class="detail-label">Soil Moisture:</span>
          <span class="detail-value" style="color: ${zone.moisture < zone.threshold ? '#ff6b6b' : '#2ecc71'}">
            ${zone.moisture}%
          </span>
          <span class="detail-label">Threshold:</span>
          <span class="detail-value">${zone.threshold}%</span>
          <span class="detail-label">Last Run:</span>
          <span class="detail-value">${zone.lastIrrigated}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill ${zone.moisture < zone.threshold ? 'danger' : ''}" style="width: ${zone.moisture}%"></div>
        </div>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-dim);">Valve: <strong>${zone.valve}</strong></span>
          <button onclick="App.toggleZoneValve('${zone.id}')" class="btn btn-sm ${zone.valve === 'ON' ? 'btn-danger' : 'btn-outline'}">
            ${zone.valve === 'ON' ? 'Close Valve' : 'Start Drip'}
          </button>
        </div>
      </div>
    `).join('');
  },

  toggleZoneValve(zoneId) {
    const zone = cloudSim.toggleZoneValve(zoneId);
    if (zone) {
      showToastNotification(`Zone '${zone.name}' valve switched to ${zone.valve}`);
    }
  },

  updateFormRecommendation() {
    const moisture = parseInt(document.getElementById('soilMoisture')?.value || '35');
    const crop = document.getElementById('cropType')?.value || 'Rice';
    const recBox = document.getElementById('formRecommendation');
    if (!recBox) return;

    let text = "";
    if (moisture < 30) {
      text = `⚠️ Critical Deficit for ${crop}! High priority: 45-60 min Drip Irrigation recommended immediately.`;
    } else if (moisture < 45) {
      text = `💡 Moderate Moisture for ${crop}: Standard 30 min scheduled morning irrigation advised.`;
    } else {
      text = `✅ Moisture Optimal (${moisture}%) for ${crop}: Irrigation can be postponed for 24-48 hours.`;
    }
    recBox.textContent = text;
  },

  handleScheduleSubmit(e) {
    e.preventDefault();

    const farmerName = document.getElementById('farmerName').value.trim();
    const location = document.getElementById('farmLocation').value.trim();
    const cropType = document.getElementById('cropType').value;
    const moistureLevel = parseInt(document.getElementById('soilMoisture').value);
    const weatherCondition = document.getElementById('weatherCondition').value;
    const dateTime = document.getElementById('irrigationDateTime').value;

    // JavaScript Validations
    if (!farmerName || !location || !cropType || isNaN(moistureLevel) || !weatherCondition || !dateTime) {
      this.showAlert('scheduleAlert', 'Please fill in all required fields accurately.', 'danger');
      return;
    }

    if (moistureLevel < 0 || moistureLevel > 100) {
      this.showAlert('scheduleAlert', 'Soil moisture level must be between 0% and 100%.', 'danger');
      return;
    }

    // Auto-generate Schedule ID (e.g., IRR-7492)
    const newId = `IRR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSchedule = {
      id: newId,
      farmerName,
      location,
      cropType,
      moistureLevel,
      weatherCondition,
      dateTime,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    this.schedules.unshift(newSchedule);
    this.saveSchedules();

    // Show Confirmation Requirement 2
    this.showAlert('scheduleAlert', `Your irrigation schedule has been saved successfully! Your Schedule ID is: ${newId}`, 'success');

    // Reset Form
    e.target.reset();
    document.getElementById('soilMoisture').value = 35;
    document.getElementById('moistureValBadge').textContent = '35%';

    // Scroll smoothly to schedules list
    setTimeout(() => {
      document.getElementById('monitor-soil')?.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  },

  handleTrackLookup(e) {
    e.preventDefault();
    const searchId = document.getElementById('trackScheduleId').value.trim().toUpperCase();
    const resultBox = document.getElementById('trackResult');

    if (!searchId) {
      resultBox.innerHTML = `<div class="alert-box alert-danger">Please enter a valid Schedule ID (e.g. IRR-8921).</div>`;
      return;
    }

    const item = this.schedules.find(s => s.id === searchId);
    if (item) {
      resultBox.innerHTML = `
        <div class="glass-card" style="border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3>Schedule Details: ${item.id}</h3>
            <span class="status-tag status-${item.status.toLowerCase().replace(' ', '')}">${item.status}</span>
          </div>
          <div class="zone-details">
            <span class="detail-label">Farmer Name:</span><span class="detail-value">${item.farmerName}</span>
            <span class="detail-label">Location:</span><span class="detail-value">${item.location}</span>
            <span class="detail-label">Crop Type:</span><span class="detail-value">${item.cropType}</span>
            <span class="detail-label">Moisture Input:</span><span class="detail-value">${item.moistureLevel}%</span>
            <span class="detail-label">Weather Condition:</span><span class="detail-value">${item.weatherCondition}</span>
            <span class="detail-label">Scheduled Date/Time:</span><span class="detail-value">${new Date(item.dateTime).toLocaleString()}</span>
          </div>
        </div>
      `;
    } else {
      resultBox.innerHTML = `<div class="alert-box alert-danger">No schedule found matching ID '${searchId}'. Please check and try again.</div>`;
    }
  },

  renderSchedulesTable() {
    const tbody = document.getElementById('schedulesTbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('searchSchedule')?.value || '').toLowerCase();
    const statusVal = document.getElementById('filterStatus')?.value || 'ALL';

    const filtered = this.schedules.filter(item => {
      const matchesSearch = item.farmerName.toLowerCase().includes(searchTerm) ||
                            item.location.toLowerCase().includes(searchTerm) ||
                            item.cropType.toLowerCase().includes(searchTerm) ||
                            item.id.toLowerCase().includes(searchTerm);
      const matchesStatus = statusVal === 'ALL' || item.status.toUpperCase() === statusVal.toUpperCase();
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No irrigation schedules found matching your query.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => `
      <tr>
        <td><strong>${item.id}</strong></td>
        <td>${item.farmerName}</td>
        <td>${item.location}</td>
        <td>${item.cropType}</td>
        <td>
          <span style="color: ${item.moistureLevel < 35 ? '#ff6b6b' : '#2ecc71'}; font-weight:700;">
            ${item.moistureLevel}%
          </span>
        </td>
        <td>${item.weatherCondition}</td>
        <td>${new Date(item.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td>
          ${this.isAdminLoggedIn ? `
            <select class="form-control" style="padding: 0.25rem 0.5rem; font-size:0.8rem;" onchange="App.updateScheduleStatus('${item.id}', this.value)">
              <option value="Scheduled" ${item.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          ` : `
            <span class="status-tag status-${item.status.toLowerCase().replace(' ', '')}">${item.status}</span>
          `}
        </td>
      </tr>
    `).join('');
  },

  updateScheduleStatus(id, newStatus) {
    const item = this.schedules.find(s => s.id === id);
    if (item) {
      item.status = newStatus;
      this.saveSchedules();
      showToastNotification(`Status for ${id} updated to '${newStatus}'`);
    }
  },

  exportCsv() {
    if (!this.schedules || this.schedules.length === 0) {
      showToastNotification('No schedule data available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Schedule ID,Farmer Name,Location,Crop Type,Soil Moisture,Weather,Scheduled Date,Status\n";
    this.schedules.forEach(s => {
      csvContent += `"${s.id}","${s.farmerName}","${s.location}","${s.cropType}","${s.moistureLevel}%","${s.weatherCondition}","${s.dateTime}","${s.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Irrigation_Schedules_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastNotification('Exported schedules to CSV file!');
  },

  updateStatsCounters() {
    const totalCount = this.schedules.length;
    const completedCount = this.schedules.filter(s => s.status === 'Completed').length;
    
    const totalEl = document.getElementById('statTotalSchedules');
    const completedEl = document.getElementById('statCompletedSchedules');
    
    if (totalEl) totalEl.textContent = totalCount;
    if (completedEl) completedEl.textContent = completedCount;
  },

  toggleAdminModal(show) {
    const modal = document.getElementById('adminModal');
    if (modal) {
      if (show) modal.classList.add('active');
      else modal.classList.remove('active');
    }
  },

  handleAdminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === 'admin' && pass === 'admin123') {
      this.isAdminLoggedIn = true;
      this.toggleAdminModal(false);
      this.renderSchedulesTable();
      showToastNotification('Successfully logged in as Admin!');
      
      const badge = document.getElementById('adminStatusBadge');
      if (badge) badge.style.display = 'inline-block';
    } else {
      this.showAlert('adminLoginAlert', 'Invalid credentials! Use demo login (admin / admin123).', 'danger');
    }
  },

  handleContactSubmit(e) {
    e.preventDefault();
    this.showAlert('contactAlert', 'Thank you! Your message has been sent to our Cloud Support Team.', 'success');
    e.target.reset();
  },

  showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="alert-box alert-${type}">
        <span>${message}</span>
      </div>
    `;
    setTimeout(() => {
      container.innerHTML = '';
    }, 6000);
  }
};

function showToastNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'alert-box alert-success';
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '3000';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  toast.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}
