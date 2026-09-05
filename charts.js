/* ==========================================================================
   Cloud-Based Farm Irrigation Scheduling System - Canvas Charting Utility
   High-performance self-contained HTML5 Canvas Renderer for Telemetry Graphs
   ========================================================================== */

class FarmChartsEngine {
  constructor() {
    this.moistureHistory = [35, 34, 32, 30, 28, 27, 45, 52, 50, 48, 45, 42, 40, 38, 37, 35, 33, 48, 55, 50, 46, 42, 40, 38];
    this.hours = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
  }

  pushRealtimeValue(val) {
    this.moistureHistory.shift();
    this.moistureHistory.push(val);
  }

  renderMoistureChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set display resolution according to DPR
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padding = { top: 30, right: 30, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 100; y += 25) {
      const yPos = padding.top + chartHeight - (y / 100) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${y}%`, 10, yPos + 4);
    }

    // Threshold line (35%)
    const thresholdY = padding.top + chartHeight - (35 / 100) * chartHeight;
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(width - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f39c12';
    ctx.fillText('Crit Threshold (35%)', width - padding.right - 110, thresholdY - 6);

    // Plot moisture line curve
    const points = this.moistureHistory.map((val, idx) => {
      const x = padding.left + (idx / (this.moistureHistory.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (val / 100) * chartHeight;
      return { x, y, val };
    });

    // Draw gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.35)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw main stroke line
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      // Smooth quadratic bezier curves
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    // Draw data points
    points.forEach((pt, idx) => {
      if (idx % 3 === 0) { // draw dot every 3 hours
        ctx.fillStyle = '#091311';
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  renderWaterSavedChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 20, bottom: 40, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const traditionalUsage = [1200, 1150, 1300, 1250, 1400, 1350, 1300]; // Liters
    const cloudSmartUsage = [750, 680, 820, 710, 890, 790, 740]; // Liters saved via ET0 cloud AI

    const maxVal = 1600;
    const barGroupWidth = chartWidth / categories.length;
    const barWidth = barGroupWidth * 0.32;

    // Y-Axis Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    for (let y = 0; y <= maxVal; y += 400) {
      const yPos = padding.top + chartHeight - (y / maxVal) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${y} L`, 10, yPos + 4);
    }

    // Render Bars
    categories.forEach((cat, idx) => {
      const groupX = padding.left + idx * barGroupWidth;

      // Traditional Bar
      const tradHeight = (traditionalUsage[idx] / maxVal) * chartHeight;
      const tradX = groupX + barGroupWidth * 0.15;
      const tradY = padding.top + chartHeight - tradHeight;

      ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
      ctx.beginPath();
      ctx.roundRect(tradX, tradY, barWidth, tradHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Smart Cloud Bar
      const smartHeight = (cloudSmartUsage[idx] / maxVal) * chartHeight;
      const smartX = tradX + barWidth + 6;
      const smartY = padding.top + chartHeight - smartHeight;

      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.roundRect(smartX, smartY, barWidth, smartHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Category Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cat, groupX + barGroupWidth / 2, height - 12);
    });

    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
    ctx.fillRect(width - 240, 10, 12, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Fixed Schedule', width - 222, 20);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(width - 130, 10, 12, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Cloud AI Smart', width - 112, 20);
  }
}

const farmCharts = new FarmChartsEngine();
