// visualization/charts.js — Chart.js wrappers + SVG association network

const Charts = {

  _charts: {}, // registry to destroy before recreating

  // ── Destroy existing chart ────────────────────────────────────

  destroy(id) {
    if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; }
  },

  _create(id, config) {
    this.destroy(id);
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const chart = new Chart(canvas, config);
    this._charts[id] = chart;
    return chart;
  },

  // ── Bar Chart ─────────────────────────────────────────────────

  bar(id, labels, datasets, title = '') {
    return this._create(id, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.color || Helpers.PALETTE[i % Helpers.PALETTE.length] + 'CC',
          borderColor: d.color || Helpers.PALETTE[i % Helpers.PALETTE.length],
          borderWidth: 1, borderRadius: 3
        }))
      },
      options: this._baseOptions(title)
    });
  },

  // ── Horizontal Bar ────────────────────────────────────────────

  horizontalBar(id, labels, data, title = '', color = '#168C8C') {
    return this._create(id, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: '', data, backgroundColor: color + 'BB', borderColor: color, borderWidth: 1, borderRadius: 3 }]
      },
      options: { ...this._baseOptions(title), indexAxis: 'y', plugins: { legend: { display: false } } }
    });
  },

  // ── Line Chart ────────────────────────────────────────────────

  line(id, labels, datasets, title = '') {
    return this._create(id, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          borderColor: d.color || Helpers.PALETTE[i],
          backgroundColor: (d.color || Helpers.PALETTE[i]) + '22',
          borderWidth: 2, pointRadius: 3,
          fill: d.fill !== undefined ? d.fill : false, tension: 0.3
        }))
      },
      options: this._baseOptions(title)
    });
  },

  // ── Scatter Plot ──────────────────────────────────────────────

  scatter(id, datasets, title = '') {
    return this._create(id, {
      type: 'scatter',
      data: {
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.data, // [{x, y}, ...]
          backgroundColor: (d.color || Helpers.PALETTE[i]) + 'AA',
          borderColor: d.color || Helpers.PALETTE[i],
          pointRadius: 4, pointHoverRadius: 6
        }))
      },
      options: this._baseOptions(title)
    });
  },

  // ── Doughnut Chart ────────────────────────────────────────────

  doughnut(id, labels, data, title = '') {
    return this._create(id, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: Helpers.PALETTE.slice(0, labels.length).map(c => c + 'CC'), borderWidth: 2 }]
      },
      options: {
        ...this._baseOptions(title),
        cutout: '60%',
        plugins: { legend: { position: 'right', labels: { font: { family: 'Inter', size: 11 }, padding: 12 } } }
      }
    });
  },

  // ── Histogram ─────────────────────────────────────────────────

  histogram(id, values, title = '', bins = 15, color = '#168C8C') {
    const numVals = values.filter(v => v !== null && isFinite(+v)).map(Number);
    if (!numVals.length) return;
    const min = Math.min(...numVals), max = Math.max(...numVals);
    const binWidth = (max - min) / bins || 1;
    const counts = Array(bins).fill(0);
    const labels = [];
    for (let b = 0; b < bins; b++) labels.push((min + b * binWidth).toFixed(1));
    numVals.forEach(v => {
      let b = Math.floor((v - min) / binWidth);
      if (b >= bins) b = bins - 1;
      counts[b]++;
    });
    return this.bar(id, labels, [{ label: 'Frequency', data: counts, color }], title);
  },

  // ── Actual vs Predicted scatter ───────────────────────────────

  actualVsPredicted(id, actual, predicted, title = 'Actual vs Predicted') {
    const pts = actual.map((a, i) => ({ x: a, y: predicted[i] }));
    const mn = Math.min(...actual, ...predicted), mx = Math.max(...actual, ...predicted);
    return this._create(id, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Actual vs Predicted', data: pts, backgroundColor: '#168C8CAA', borderColor: '#168C8C', pointRadius: 3 },
          { label: 'Perfect Fit', data: [{ x: mn, y: mn }, { x: mx, y: mx }], type: 'line', borderColor: '#C94C4C', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, borderDash: [5, 5] }
        ]
      },
      options: this._baseOptions(title)
    });
  },

  // ── Residual Plot ─────────────────────────────────────────────

  residualPlot(id, predicted, residuals, title = 'Residual Plot') {
    const pts = predicted.map((p, i) => ({ x: p, y: residuals[i] }));
    return this._create(id, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Residuals', data: pts, backgroundColor: '#D99A2BAA', borderColor: '#D99A2B', pointRadius: 3 },
          { label: 'Zero line', data: [{ x: Math.min(...predicted), y: 0 }, { x: Math.max(...predicted), y: 0 }], type: 'line', borderColor: '#C94C4C', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, borderDash: [5, 5] }
        ]
      },
      options: this._baseOptions(title)
    });
  },

  // ── Simple Regression Line ────────────────────────────────────

  regressionLine(id, xVals, yVals, predictedVals, xName = 'x', yName = 'y') {
    const pts = xVals.map((x, i) => ({ x: +x, y: +yVals[i] }));
    const linePts = xVals.map((x, i) => ({ x: +x, y: predictedVals[i] })).sort((a, b) => a.x - b.x);
    return this._create(id, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Data Points', data: pts, backgroundColor: '#173B5788', borderColor: '#173B57', pointRadius: 3 },
          { label: 'Regression Line', data: linePts, type: 'line', borderColor: '#168C8C', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: this._baseOptions(`${yName} vs ${xName}`)
    });
  },

  // ── Elbow Curve ───────────────────────────────────────────────

  elbowCurve(id, elbowData) {
    return this.line(id, elbowData.map(e => `K=${e.k}`), [{
      label: 'WCSS (Inertia)',
      data: elbowData.map(e => e.wcss),
      color: '#173B57'
    }], 'Elbow Curve');
  },

  // ── Feature Importance Bar ────────────────────────────────────

  featureImportance(id, importance) {
    const sorted = Object.entries(importance).sort((a, b) => b[1] - a[1]).slice(0, 15);
    return this.horizontalBar(id, sorted.map(e => e[0]), sorted.map(e => +e[1].toFixed(4)), 'Feature Importance', '#168C8C');
  },

  // ── Missing Values Bar ────────────────────────────────────────

  missingValues(id, missingMap) {
    const entries = Object.entries(missingMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 20);
    if (!entries.length) { const c = document.getElementById(id); if (c) c.parentElement.innerHTML = '<div class="state-container"><div class="state-title">No missing values detected</div></div>'; return; }
    return this.horizontalBar(id, entries.map(e => e[0]), entries.map(e => e[1]), 'Missing Values by Column', '#C98A16');
  },

  // ── Data Type Doughnut ────────────────────────────────────────

  dataTypePie(id, typeDist) {
    const entries = Object.entries(typeDist).filter(([, v]) => v > 0);
    return this.doughnut(id, entries.map(e => Helpers.capitalize(e[0])), entries.map(e => e[1]), 'Data Types');
  },

  // ── Model Comparison Bar ──────────────────────────────────────

  modelComparison(id, models, metrics) {
    const labels = Object.keys(metrics);
    const datasets = models.map((m, i) => ({
      label: m.name,
      data: labels.map(k => m.values[k] || 0),
      color: Helpers.PALETTE[i]
    }));
    return this.bar(id, labels, datasets, 'Model Comparison');
  },

  // ── Cluster Scatter (2D) ──────────────────────────────────────

  clusterScatter(id, points2D, labels, k) {
    const datasets = Array.from({ length: k }, (_, c) => {
      const pts = points2D.filter((_, i) => labels[i] === c).map(p => ({ x: p[0], y: p[1] }));
      return { label: `Cluster ${c + 1}`, data: pts, backgroundColor: Helpers.PALETTE[c] + '99', borderColor: Helpers.PALETTE[c], pointRadius: 4 };
    });
    return this.scatter(id, datasets, '2D Cluster Visualization (PCA)');
  },

  // ── Cluster Size Bar ──────────────────────────────────────────

  clusterSizes(id, sizes) {
    return this.bar(id, sizes.map((_, i) => `Cluster ${i + 1}`),
      [{ label: 'Records', data: sizes, color: '#168C8C' }], 'Cluster Sizes');
  },

  // ── Correlation Heatmap (HTML table based) ────────────────────

  correlationHeatmap(containerId, cols, matrix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!cols.length) { container.innerHTML = '<p class="text-muted text-sm">Not enough numeric columns.</p>'; return; }

    let html = '<div class="table-wrap"><table class="data-table" style="font-size:11px">';
    html += '<tr><th></th>' + cols.map(c => `<th>${Helpers.truncate(c, 10)}</th>`).join('') + '</tr>';
    for (const r of cols) {
      html += `<tr><th style="background:var(--bg)">${Helpers.truncate(r, 10)}</th>`;
      for (const c of cols) {
        const v = matrix[r]?.[c] ?? 0;
        const abs = Math.abs(v);
        const bg = v > 0
          ? `rgba(22,140,140,${(abs * 0.7).toFixed(2)})`
          : `rgba(201,76,76,${(abs * 0.7).toFixed(2)})`;
        html += `<td style="background:${bg};text-align:center;font-weight:600;color:${abs > 0.5 ? '#fff' : 'var(--text)'}">${v.toFixed(2)}</td>`;
      }
      html += '</tr>';
    }
    html += '</table></div>';
    container.innerHTML = html;
  },

  // ── Association Network (SVG) ─────────────────────────────────

  associationNetwork(containerId, rules, maxNodes = 20) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!rules || !rules.length) {
      container.innerHTML = '<div class="state-container"><div class="state-title">No rules to display</div></div>';
      return;
    }

    const topRules = rules.slice(0, Math.min(maxNodes, rules.length));
    const nodeSet = new Set();
    topRules.forEach(r => { r.antecedent.forEach(i => nodeSet.add(i)); r.consequent.forEach(i => nodeSet.add(i)); });
    const nodes = [...nodeSet];
    const W = container.offsetWidth || 500, H = 320;
    const cx = W / 2, cy = H / 2, radius = Math.min(W, H) * 0.35;

    // Position nodes in a circle
    const pos = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      pos[n] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });

    const maxLift = Math.max(...topRules.map(r => r.lift), 1);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    svg += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#667085"/></marker></defs>`;

    // Draw edges
    for (const rule of topRules) {
      for (const ant of rule.antecedent) {
        for (const con of rule.consequent) {
          const a = pos[ant], b = pos[con];
          if (!a || !b) continue;
          const opacity = 0.3 + 0.7 * (rule.lift / maxLift);
          const strokeW = 1 + 2 * (rule.confidence);
          svg += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#168C8C" stroke-width="${strokeW.toFixed(1)}" stroke-opacity="${opacity.toFixed(2)}" marker-end="url(#arr)"/>`;
        }
      }
    }

    // Draw nodes
    for (const [name, p] of Object.entries(pos)) {
      svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="18" fill="#173B57" stroke="#fff" stroke-width="2"/>`;
      svg += `<text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-family="Inter" font-size="10" fill="#fff" font-weight="600">${Helpers.truncate(name, 8)}</text>`;
    }

    svg += '</svg>';
    container.innerHTML = svg;
  },

  // ── Confusion Matrix Chart (canvas heatmap) ───────────────────

  confusionMatrixChart(id, classes, matrix) {
    if (!classes || !classes.length) return;
    const data = [], bgColors = [], borderColors = [];
    classes.forEach(a => {
      classes.forEach(p => {
        const v = matrix[a]?.[p] ?? 0;
        const isDiag = a === p;
        bgColors.push(isDiag ? 'rgba(46,125,91,0.65)' : (v > 0 ? 'rgba(201,76,76,0.45)' : 'rgba(228,231,236,0.3)'));
        borderColors.push(isDiag ? '#2E7D5B' : (v > 0 ? '#C94C4C' : '#E4E7EC'));
        data.push(v);
      });
    });
    return this._create(id, {
      type: 'bar',
      data: {
        labels: classes.flatMap(a => classes.map(p => `${a}→${p}`)),
        datasets: [{ label: 'Count', data, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1 }]
      },
      options: { ...this._baseOptions('Confusion Matrix'), plugins: { legend: { display: false } } }
    });
  },

  // ── Base chart options ────────────────────────────────────────

  _baseOptions(title = '') {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, padding: 16, usePointStyle: true } },
        title: title ? { display: true, text: title, font: { family: 'Inter', size: 13, weight: '600' }, color: '#172B3A', padding: { bottom: 12 } } : { display: false }
      },
      scales: {
        x: { ticks: { font: { family: 'Inter', size: 10 }, color: '#667085' }, grid: { color: '#E4E7EC55' }, border: { color: '#E4E7EC' } },
        y: { ticks: { font: { family: 'Inter', size: 10 }, color: '#667085' }, grid: { color: '#E4E7EC55' }, border: { color: '#E4E7EC' } }
      }
    };
  },

  // ── Download chart as PNG ─────────────────────────────────────

  downloadChart(id, filename = 'chart.png') {
    const c = document.getElementById(id);
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = filename;
    a.click();
  }
};
