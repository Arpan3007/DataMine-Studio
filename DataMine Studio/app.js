// app.js — DataMine Studio SPA Router + All Page Renderers

// ══════════════════════════════════════════════════════════════
// APP STATE
// ══════════════════════════════════════════════════════════════

const AppState = {
  currentPage: 'dashboard',
  dataset: { loaded: false, filename: null, fileType: null, rawData: [], processedData: [], rowCount: 0, columnCount: 0, columns: [], schema: {}, statistics: {} },
  detection: { numericColumns: [], categoricalColumns: [], dateColumns: [], idColumns: [], possibleClassificationTargets: [], possibleRegressionTargets: [], roles: {} },
  preprocessing: { config: { missingStrategy: 'mean', removeDuplicates: true, encoding: 'label', scaling: 'none', outlierMethod: 'none', featureSelection: 'all', selectedFeatures: [], trainTestSplit: 0.75 }, applied: false, beforeStats: {}, afterStats: {} },
  analysis: {
    classification: { target: null, features: [], algorithm: 'j48', parameters: { maxDepth: 5, minInstances: 2, smoothing: 1.0, learningRate: 0.1, maxIter: 300, lambda: 0.01 }, result: null },
    regression: { target: null, features: [], algorithm: 'simple', parameters: {}, result: null },
    clustering: { features: [], algorithm: 'kmeans', k: 3, parameters: { maxIter: 100, seed: 42 }, result: null },
    association: { transactionColumn: null, algorithm: 'apriori', parameters: { minSupport: 0.1, minConfidence: 0.5, minLift: 1.0, maxLen: 5 }, itemsets: [], rules: [], result: null }
  },
  visualization: { chartType: 'bar', xAxis: null, yAxis: null, groupBy: null, aggregation: 'mean', limit: 1000, topN: 15, sortOrder: 'desc', stacked: false },
  summary: null,
  uploadHistory: [],
  settings: {}
};

// ══════════════════════════════════════════════════════════════
// ROUTER
// ══════════════════════════════════════════════════════════════

const Router = {
  routes: {
    dashboard: { title: 'Dashboard', breadcrumb: ['Home', 'Dashboard'], icon: 'home' },
    import: { title: 'Import Dataset', breadcrumb: ['Home', 'Import Dataset'], icon: 'upload' },
    overview: { title: 'Dataset Overview', breadcrumb: ['Home', 'Dataset Overview'], icon: 'table' },
    detection: { title: 'Attribute Detection', breadcrumb: ['Home', 'Attribute Detection'], icon: 'search' },
    preprocessing: { title: 'Preprocessing', breadcrumb: ['Home', 'Preprocessing'], icon: 'settings' },
    classification: { title: 'Classification', breadcrumb: ['Home', 'Classification'], icon: 'git-branch' },
    regression: { title: 'Regression', breadcrumb: ['Home', 'Regression'], icon: 'trending-up' },
    clustering: { title: 'Clustering', breadcrumb: ['Home', 'Clustering'], icon: 'circle-dot' },
    association: { title: 'Association Rules', breadcrumb: ['Home', 'Association Rules'], icon: 'share-2' },
    comparison: { title: 'Model Comparison', breadcrumb: ['Home', 'Model Comparison'], icon: 'bar-chart-2' },
    visualization: { title: 'Visualization', breadcrumb: ['Home', 'Visualization'], icon: 'pie-chart' },
    results: { title: 'Results', breadcrumb: ['Home', 'Results'], icon: 'clipboard-list' },
    report: { title: 'Export Report', breadcrumb: ['Home', 'Export Report'], icon: 'file-text' },
    settings: { title: 'Settings', breadcrumb: ['Home', 'Settings'], icon: 'settings-2' }
  },

  navigate(page) {
    AppState.currentPage = page;
    this.render(page);
    this.updateSidebar(page);
    this.updateHeader(page);
    window.scrollTo(0, 0);
  },

  render(page) {
    const main = document.getElementById('main-content');
    if (!main) return;
    const pages = {
      dashboard: Pages.dashboard,
      import: Pages.importDataset,
      overview: Pages.datasetOverview,
      detection: Pages.attributeDetection,
      preprocessing: Pages.preprocessing,
      classification: Pages.classification,
      regression: Pages.regression,
      clustering: Pages.clustering,
      association: Pages.association,
      comparison: Pages.modelComparison,
      visualization: Pages.visualization,
      results: Pages.results,
      report: Pages.exportReport,
      settings: Pages.settings
    };
    const renderer = pages[page];
    if (renderer) main.innerHTML = renderer.render();
    if (renderer && renderer.init) setTimeout(() => renderer.init(), 50);
  },

  updateSidebar(active) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === active);
    });
  },

  updateHeader(page) {
    const route = this.routes[page] || {};
    const titleEl = document.getElementById('header-page-title');
    const breadcrumbEl = document.getElementById('header-breadcrumb');
    if (titleEl) titleEl.textContent = route.title || '';
    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = (route.breadcrumb || []).map((b, i, arr) =>
        i < arr.length - 1
          ? `<span onclick="Router.navigate('dashboard')" style="cursor:pointer;color:var(--teal)">${b}</span><span class="breadcrumb-sep"> › </span>`
          : `<span>${b}</span>`
      ).join('');
    }
    this.updateDatasetBadge();
  },

  updateDatasetBadge() {
    const badge = document.getElementById('dataset-badge');
    const dot = document.getElementById('badge-dot');
    const footerDot = document.getElementById('footer-dot');
    const footerName = document.getElementById('footer-dataset-name');
    const ds = AppState.dataset;
    if (badge) badge.innerHTML = ds.loaded
      ? `<span id="badge-dot" class="badge-dot loaded"></span> ${Helpers.truncate(ds.filename || '', 22)} <span class="badge-success" style="font-size:10px;padding:1px 6px">● Loaded</span>`
      : `<span id="badge-dot" class="badge-dot"></span> Dataset: No dataset loaded`;
    if (footerDot) footerDot.className = 'dataset-footer-dot' + (ds.loaded ? ' loaded' : '');
    if (footerName) footerName.textContent = ds.loaded ? Helpers.truncate(ds.filename || '', 22) : 'No dataset loaded';
  }
};

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════

function toast(type, title, msg = '', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  const colors = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--teal)' };
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<div class="toast-icon" style="color:${colors[type]}">${icons[type]}</div><div class="toast-body"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), duration);
}

// ══════════════════════════════════════════════════════════════
// DATASET OPERATIONS
// ══════════════════════════════════════════════════════════════

async function loadDataset(file) {
  const ds = AppState.dataset;

  // Validate file
  const fileValidation = Validation.validateFile(file);
  if (!fileValidation.valid) { toast('error', 'Invalid File', fileValidation.errors[0]); return; }

  toast('info', 'Loading...', `Parsing ${file.name}`);

  try {
    const { rows, columns } = await DatasetLoader.load(file);

    // Validate dataset
    const dsValidation = Validation.validateDataset(rows, columns);
    if (!dsValidation.valid) { toast('error', 'Dataset Error', dsValidation.errors[0]); return; }
    dsValidation.warnings.forEach(w => toast('warning', 'Dataset Warning', w));

    // Store
    ds.loaded = true;
    ds.filename = file.name;
    ds.fileType = file.name.split('.').pop().toLowerCase();
    ds.rawData = rows;
    ds.processedData = rows;
    ds.rowCount = rows.length;
    ds.columns = columns;
    ds.columnCount = columns.length;

    // Detect attributes
    const { schema, stats, detection } = AttributeDetector.analyze(rows, columns);
    ds.schema = schema;
    ds.statistics = stats;
    Object.assign(AppState.detection, detection);
    AppState.detection.roles = { ...detection.roles };

    // Compute summary
    AppState.summary = Statistics.summary(rows, columns, schema);

    // Default features = all non-identifier columns
    AppState.analysis.classification.features = columns.filter(c => schema[c]?.role !== 'identifier');
    AppState.analysis.regression.features = detection.numericColumns.filter(c => schema[c]?.role !== 'identifier');
    AppState.analysis.clustering.features = detection.numericColumns.filter(c => schema[c]?.role !== 'identifier');

    // History
    AppState.uploadHistory.unshift({
      id: Date.now(), filename: file.name,
      format: ds.fileType.toUpperCase(), rows: rows.length, columns: columns.length,
      date: new Date().toLocaleString('en-GB'), status: 'Loaded'
    });
    Storage.addToHistory({ filename: file.name, format: ds.fileType.toUpperCase(), rows: rows.length, columns: columns.length, date: new Date().toLocaleString('en-GB'), status: 'Loaded' });

    Router.updateDatasetBadge();
    toast('success', 'Dataset Loaded', `${rows.length.toLocaleString()} rows × ${columns.length} columns loaded successfully.`);

    // Navigate to overview
    setTimeout(() => Router.navigate('overview'), 500);
  } catch (err) {
    toast('error', 'Parse Error', err.message);
    console.error(err);
  }
}

async function loadSampleDataset(id) {
  try {
    const meta = SampleDatasets.get(id);
    if (!meta) return;
    const { rows, columns } = SampleDatasets.load(id);
    const fakeFile = { name: meta.name.toLowerCase().replace(/\s+/g, '_') + '.csv', size: 50000 };

    AppState.dataset.loaded = true;
    AppState.dataset.filename = fakeFile.name;
    AppState.dataset.fileType = 'csv';
    AppState.dataset.rawData = rows;
    AppState.dataset.processedData = rows;
    AppState.dataset.rowCount = rows.length;
    AppState.dataset.columns = columns;
    AppState.dataset.columnCount = columns.length;

    const { schema, stats, detection } = AttributeDetector.analyze(rows, columns);
    AppState.dataset.schema = schema;
    AppState.dataset.statistics = stats;
    Object.assign(AppState.detection, detection);
    AppState.detection.roles = { ...detection.roles };
    AppState.summary = Statistics.summary(rows, columns, schema);

    AppState.analysis.classification.features = columns.filter(c => schema[c]?.role !== 'identifier');
    AppState.analysis.regression.features = detection.numericColumns.filter(c => schema[c]?.role !== 'identifier');
    AppState.analysis.clustering.features = detection.numericColumns.filter(c => schema[c]?.role !== 'identifier');

    AppState.uploadHistory.unshift({ id: Date.now(), filename: fakeFile.name, format: 'CSV', rows: rows.length, columns: columns.length, date: new Date().toLocaleString('en-GB'), status: 'Loaded' });

    Router.updateDatasetBadge();
    toast('success', 'Sample Dataset Loaded', `${meta.name}: ${rows.length} rows × ${columns.length} columns`);
    setTimeout(() => Router.navigate('overview'), 400);
  } catch (err) { toast('error', 'Error', err.message); }
}

// ══════════════════════════════════════════════════════════════
// SHARED UPLOAD HANDLER
// ══════════════════════════════════════════════════════════════

function setupUploadZone(zoneId, inputId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadDataset(e.dataTransfer.files[0]); });
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { if (input.files[0]) loadDataset(input.files[0]); });
}

// ══════════════════════════════════════════════════════════════
// PAGE HELPERS
// ══════════════════════════════════════════════════════════════

function noDatasetWarning() {
  return `<div class="state-container">
    <div class="state-icon"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg></div>
    <div class="state-title">No Dataset Loaded</div>
    <div class="state-sub">Upload a dataset to use this feature.</div>
    <button class="btn btn-primary mt-16" onclick="Router.navigate('import')">Import Dataset</button>
  </div>`;
}

function statusBadge(type) {
  const map = { integer: 'badge-navy', float: 'badge-navy', categorical: 'badge-info', boolean: 'badge-amber', datetime: 'badge-success', string: 'badge-neutral', unknown: 'badge-neutral', identifier: 'badge-amber' };
  return `<span class="badge ${map[type] || 'badge-neutral'}">${type}</span>`;
}

function roleBadge(role) {
  const map = { feature: 'badge-neutral', target_candidate: 'badge-success', identifier: 'badge-amber', date: 'badge-info', ignore: 'badge-neutral', target: 'badge-success' };
  return `<span class="badge ${map[role] || 'badge-neutral'}">${role.replace('_', ' ')}</span>`;
}

// ══════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════

const Pages = {

  // ── DASHBOARD ─────────────────────────────────────────────────

  dashboard: {
    render() {
      const ds = AppState.dataset;
      const stepDone = [ds.loaded, AppState.summary != null, AppState.preprocessing.applied,
      !!(AppState.analysis.classification.result || AppState.analysis.regression.result), false, false];

      return `
<div class="page-header">
  <div>
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Analyze, preprocess and apply data mining algorithms to your dataset.</p>
  </div>
  <div class="page-actions">
    <button class="btn btn-primary btn-lg" onclick="Router.navigate('import')">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Import Dataset
    </button>
  </div>
</div>

<div class="card mb-24">
  <div class="card-body">
    <div id="dash-upload-zone" class="upload-zone" style="padding:48px 32px">
      <input type="file" id="dash-file-input" accept=".csv,.xlsx,.xls" style="display:none">
      <div class="upload-zone-icon">
        <svg width="56" height="56" fill="none" stroke="var(--teal)" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
      </div>
      <h2 class="upload-zone-title">Start a New Analysis</h2>
      <p class="upload-zone-sub">Upload a CSV or Excel dataset to begin exploring and analyzing your data.</p>
      <div style="border:1px dashed var(--border);border-radius:var(--radius);padding:18px 24px;display:inline-block;margin:12px auto;min-width:320px">
        <p style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">Drag & drop your dataset here</p>
        <p style="font-size:12px;color:var(--text2);margin-bottom:14px">or</p>
        <button class="btn btn-primary btn-lg" onclick="event.stopPropagation();document.getElementById('dash-file-input').click()">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Browse Dataset
        </button>
      </div>
      <div class="upload-zone-formats">Supported formats: <strong>CSV, XLSX, XLS</strong></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Supported Analysis</div>
  <div class="grid-auto" style="grid-template-columns:repeat(4,1fr)">
    ${[
          ['Classification', 'Predict categorical outcomes', 'git-branch', 'teal', 'classification'],
          ['Regression', 'Predict numerical values', 'trending-up', 'amber', 'regression'],
          ['Clustering', 'Discover hidden groups', 'circle-dot', 'navy', 'clustering'],
          ['Association Rules', 'Discover relationships between items', 'share-2', 'teal', 'association']
        ].map(([t, d, ico, clr, pg]) => `
    <div class="analysis-card" onclick="Router.navigate('${pg}')">
      <div class="analysis-card-left">
        <div class="analysis-card-icon" style="background:var(--${clr === 'navy' ? 'navy' : 'teal'}-light);color:var(--${clr === 'navy' ? 'navy' : 'teal'})">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${svgPath(ico)}</svg>
        </div>
        <div><div class="analysis-card-title">${t}</div><div class="analysis-card-sub">${d}</div></div>
      </div>
      <svg width="14" height="14" fill="none" stroke="var(--text2)" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join('')}
  </div>
</div>

<div class="section">
  <div class="section-title">Workflow</div>
  <div class="card"><div class="card-body" style="padding:24px">
    <div class="workflow-stepper">
      ${[
          ['1', 'Import Dataset', 'Upload your data'],
          ['2', 'Understand Data', 'Explore and analyze'],
          ['3', 'Preprocess', 'Clean and transform'],
          ['4', 'Apply Algorithm', 'Run data mining methods'],
          ['5', 'Evaluate Results', 'Analyze performance'],
          ['6', 'Export Report', 'Generate insights']
        ].map(([n, t, s], i, arr) => `
      <div class="workflow-step">
        <div class="step-circle ${i < 1 ? 'active' : ''}">${n}</div>
        <div class="step-label">${t}</div>
        <div class="step-sub">${s}</div>
      </div>
      ${i < arr.length - 1 ? '<div class="step-connector"></div>' : ''}`).join('')}
    </div>
  </div></div>
</div>

<div class="grid-2 mt-20">
  <div class="card"><div class="card-body" style="display:flex;gap:16px;align-items:flex-start">
    <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="20" height="20" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <div><div class="fw-700 mb-4">Work with Any Dataset</div>
    <div class="text-sm text-muted">DataMine Studio supports tabular data from any domain — education, finance, healthcare, e-commerce, marketing, research and more.</div></div>
  </div></div>
  <div class="card" style="border-left:3px solid var(--amber)"><div class="card-body" style="display:flex;gap:16px;align-items:flex-start">
    <div style="width:40px;height:40px;border-radius:50%;background:var(--amber-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="20" height="20" fill="none" stroke="var(--amber)" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    </div>
    <div><div class="fw-700 mb-4">Get Started</div>
    <div class="text-sm text-muted">Upload a dataset to explore its structure, detect attributes and apply data mining algorithms.</div></div>
  </div></div>
</div>`;
    },
    init() { setupUploadZone('dash-upload-zone', 'dash-file-input'); }
  },

  // ── IMPORT DATASET ────────────────────────────────────────────

  importDataset: {
    render() {
      const history = AppState.uploadHistory.slice(0, 10);
      return `
<div class="page-header">
  <div>
    <h1 class="page-title">Import Dataset</h1>
    <p class="page-subtitle">Upload a tabular dataset from any supported domain.</p>
  </div>
</div>

<div class="grid-2 mb-24">
  <div class="card">
    <div class="card-body">
      <div id="import-upload-zone" class="upload-zone">
        <input type="file" id="import-file-input" accept=".csv,.xlsx,.xls" style="display:none">
        <div class="upload-zone-icon"><svg width="48" height="48" fill="none" stroke="var(--teal)" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg></div>
        <p class="upload-zone-title">Drag & drop your dataset here</p>
        <p class="upload-zone-sub" style="margin:6px 0 16px">or</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('import-file-input').click()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            Browse Files
          </button>
          <button class="btn btn-secondary" onclick="showSampleModal()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Load Sample Dataset
          </button>
        </div>
        <div class="upload-zone-formats">Supported formats: CSV, XLSX, XLS &nbsp;|&nbsp; Max size: 100 MB</div>
      </div>
    </div>
  </div>

  <div>
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Supported Domains</div><div class="card-subtitle">Your dataset can belong to any domain</div></div>
      <div class="card-body">
        <div class="domain-grid">
          ${[['🎓', 'Education', 'teal'], ['🏦', 'Finance', 'navy'], ['🏥', 'Healthcare', 'error'], ['🛒', 'E-commerce', 'amber'], ['📊', 'Marketing', 'navy'], ['🏛', 'Banking', 'teal'], ['👥', 'HR', 'success'], ['📈', 'Sales', 'amber'], ['🔬', 'Research', 'info']].map(([e, n, c]) => `
          <span class="domain-badge" style="border-color:var(--border)">${e} ${n}</span>`).join('')}
        </div>
        <div class="info-box info mt-12">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          DataMine Studio works with any tabular dataset. No domain-specific structure required.
        </div>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header">
    <div><div class="card-title">Upload History</div><div class="card-subtitle">Recently uploaded datasets</div></div>
    <div class="flex gap-8">
      <div class="header-search"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Search files..." id="history-search"></div>
    </div>
  </div>
  <div class="table-wrap">
    <table class="data-table" id="history-table">
      <thead><tr><th>#</th><th>File Name</th><th>Format</th><th>Rows</th><th>Columns</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${history.length ? history.map((h, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${Helpers.escapeHtml(h.filename)}</strong></td>
          <td><span class="badge badge-neutral">${h.format}</span></td>
          <td>${(h.rows || 0).toLocaleString()}</td>
          <td>${h.columns || 0}</td>
          <td style="color:var(--text2);font-size:12px">${h.date}</td>
          <td>${h.status === 'Loaded' ? '<span class="badge badge-success">Loaded</span>' : h.status === 'Failed' ? '<span class="badge badge-error">Failed</span>' : '<span class="badge badge-info">Processed</span>'}</td>
          <td>
            <div class="flex gap-4">
              <button class="btn btn-ghost btn-sm btn-icon" title="View" onclick="Router.navigate('overview')"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Delete" onclick="deleteHistory(${h.id})"><svg width="14" height="14" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
            </div>
          </td>
        </tr>`).join('') : '<tr><td colspan="8"><div class="state-container" style="padding:24px"><div class="state-title">No upload history</div><div class="state-sub">Uploaded datasets will appear here.</div></div></td></tr>'}
      </tbody>
    </table>
  </div>
  ${history.length ? `<div class="pagination"><div class="pagination-info">Showing 1 to ${history.length} of ${history.length} files</div></div>` : ''}
</div>

<div id="sample-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title">Load Sample Dataset</span><button class="modal-close" onclick="document.getElementById('sample-modal').classList.add('hidden')">×</button></div>
    <div class="modal-body">
      ${SampleDatasets.getList().map(s => `
      <div class="card mb-12 cursor-pointer" onclick="loadSampleDataset('${s.id}');document.getElementById('sample-modal').classList.add('hidden')" style="transition:all .15s;cursor:pointer" onmouseenter="this.style.borderColor='var(--teal)'" onmouseleave="this.style.borderColor='var(--border)'">
        <div class="card-body" style="padding:14px 16px">
          <div class="fw-600 mb-4">${s.name}</div>
          <div class="text-sm text-muted mb-8">${s.description}</div>
          <div class="flex gap-6">
            <span class="badge badge-neutral">${s.rows} rows</span>
            <span class="badge badge-neutral">${s.columns} cols</span>
            ${s.suitable.map(t => `<span class="badge badge-info">${t}</span>`).join('')}
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</div>`;
    },
    init() {
      setupUploadZone('import-upload-zone', 'import-file-input');
      const search = document.getElementById('history-search');
      if (search) search.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#history-table tbody tr').forEach(r => {
          r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  },

  // ── DATASET OVERVIEW ──────────────────────────────────────────

  datasetOverview: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Dataset Overview</h1></div></div>${noDatasetWarning()}`;

      const sum = AppState.summary;
      const previewRows = ds.rawData.slice(0, 50);
      const cols = ds.columns;

      return `
<div class="page-header">
  <div>
    <h1 class="page-title">Dataset Overview</h1>
    <div class="flex gap-8 mt-4">
      <span class="badge badge-success"><svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:2px"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Dataset Loaded</span>
      <span class="text-muted text-sm">${Helpers.escapeHtml(ds.filename)}</span>
    </div>
  </div>
  <div class="page-actions">
    <button class="btn btn-secondary" onclick="Router.navigate('import')">Change Dataset</button>
    <button class="btn btn-primary" onclick="Router.navigate('detection')">Attribute Detection →</button>
  </div>
</div>

<div class="metric-grid-4 mb-24">
  ${[
          ['Rows', (ds.rowCount || 0).toLocaleString(), 'Total records', '#173B57'],
          ['Columns', ds.columnCount || 0, 'Total attributes', '#168C8C'],
          ['Missing Values', (sum?.missingTotal || 0).toLocaleString(), 'Across all columns', '#C98A16'],
          ['Duplicate Rows', (sum?.duplicates || 0).toLocaleString(), 'Exact row matches', '#C94C4C'],
          ['Numerical Cols', sum?.numericCount || 0, 'Integer + Float', '#168C8C'],
          ['Categorical Cols', sum?.categoricalCount || 0, 'Text categories', '#173B57'],
          ['Date Columns', sum?.dateCount || 0, 'Datetime columns', '#D99A2B'],
          ['Identifier Cols', sum?.idCount || 0, 'ID/Key columns', '#667085']
        ].map(([l, v, s, c]) => `
  <div class="metric-card">
    <div class="metric-card-label">${l}</div>
    <div class="metric-card-value" style="color:${c};font-size:22px">${v}</div>
    <div class="metric-card-sub">${s}</div>
  </div>`).join('')}
</div>

<div class="card mb-24">
  <div class="card-header">
    <div class="card-title">Dataset Preview</div>
    <div class="flex gap-8">
      <div class="header-search"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Search..." id="preview-search"></div>
      <span class="badge badge-neutral">${ds.rowCount.toLocaleString()} rows</span>
    </div>
  </div>
  <div class="table-wrap" style="max-height:340px;overflow-y:auto">
    <table class="data-table" id="preview-table">
      <thead><tr><th>#</th>${cols.map(c => `<th>${Helpers.escapeHtml(c)}</th>`).join('')}</tr></thead>
      <tbody>
        ${previewRows.map((r, i) => `<tr><td style="color:var(--text2)">${i + 1}</td>${cols.map(c => `<td>${Helpers.escapeHtml(r[c] ?? '')}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div class="pagination"><div class="pagination-info">Showing first 50 of ${ds.rowCount.toLocaleString()} rows</div></div>
</div>

<div class="grid-2">
  <div class="chart-card">
    <div class="chart-card-header">Missing Values by Column</div>
    <div class="chart-card-body"><canvas id="missing-chart" height="200"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="chart-card-header">Data Type Distribution</div>
    <div class="chart-card-body"><canvas id="type-chart" height="200"></canvas></div>
  </div>
</div>`;
    },
    init() {
      const ds = AppState.dataset;
      if (!ds.loaded) return;

      // Preview search
      const ps = document.getElementById('preview-search');
      if (ps) ps.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#preview-table tbody tr').forEach(r => {
          r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });

      // Charts
      const missingMap = Statistics.missingMap(ds.rawData, ds.columns);
      Charts.missingValues('missing-chart', missingMap);
      const typeDist = Statistics.typeDistribution(ds.columns, ds.schema);
      Charts.dataTypePie('type-chart', typeDist);
    }
  },

  // ── ATTRIBUTE DETECTION ───────────────────────────────────────

  attributeDetection: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Attribute Detection</h1></div></div>${noDatasetWarning()}`;

      const det = AppState.detection;
      const cols = ds.columns;

      return `
<div class="page-header">
  <div>
    <h1 class="page-title">Attribute Detection</h1>
    <p class="page-subtitle">Automatically identify column types and recommended roles.</p>
  </div>
  <div class="page-actions">
    <button class="btn btn-primary" onclick="Router.navigate('preprocessing')">Proceed to Preprocessing →</button>
  </div>
</div>

<div class="metric-grid-4 mb-20">
  <div class="metric-card"><div class="metric-card-label">Numerical</div><div class="metric-card-value" style="color:var(--navy)">${det.numericColumns.length}</div><div class="metric-card-sub">Integer + Float</div></div>
  <div class="metric-card"><div class="metric-card-label">Categorical</div><div class="metric-card-value" style="color:var(--teal)">${det.categoricalColumns.length}</div><div class="metric-card-sub">Text categories</div></div>
  <div class="metric-card"><div class="metric-card-label">Date</div><div class="metric-card-value" style="color:var(--amber)">${det.dateColumns.length}</div><div class="metric-card-sub">Datetime columns</div></div>
  <div class="metric-card"><div class="metric-card-label">Identifier</div><div class="metric-card-value" style="color:var(--text2)">${det.idColumns.length}</div><div class="metric-card-sub">ID / Key columns</div></div>
</div>

<div class="grid-2 mb-20" style="grid-template-columns:1fr 280px">
  <div class="card">
    <div class="card-header"><div class="card-title">Column Analysis</div><div class="card-subtitle">Click Role to override detection</div></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Column</th><th>Detected Type</th><th>Role</th><th>Unique Values</th><th>Missing</th><th>Status</th></tr></thead>
        <tbody>
          ${cols.map(col => {
        const s = ds.schema[col] || {};
        const role = det.roles[col] || s.role || 'feature';
        return `<tr>
              <td><strong>${Helpers.escapeHtml(col)}</strong></td>
              <td>${statusBadge(s.detectedType || 'unknown')}</td>
              <td>
                <select class="form-select" style="width:140px;height:28px;font-size:11px" onchange="updateRole('${col}',this.value)">
                  ${['feature', 'target', 'identifier', 'date', 'ignore'].map(r => `<option value="${r}" ${role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}
                </select>
              </td>
              <td>${(s.uniqueCount || 0).toLocaleString()}</td>
              <td>${s.missingCount || 0} ${s.missingPct > 0.1 ? `<span class="text-warning text-xs">(${(s.missingPct * 100).toFixed(0)}%)</span>` : ''}</td>
              <td>${s.isConstant ? '<span class="badge badge-warning">Constant</span>' : s.role === 'target_candidate' ? '<span class="badge badge-success">Recommended</span>' : '<span class="badge badge-neutral">Detected</span>'}</td>
            </tr>`;
      }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="card">
      <div class="card-header"><div class="card-title">Classification Targets</div></div>
      <div class="card-body" style="padding:12px 16px">
        ${det.possibleClassificationTargets.length
          ? det.possibleClassificationTargets.map(t => `<div class="flex-between mb-8"><span class="text-sm fw-600">${Helpers.escapeHtml(t)}</span><span class="badge badge-success">Candidate</span></div>`).join('')
          : '<div class="text-sm text-muted">None detected</div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Regression Targets</div></div>
      <div class="card-body" style="padding:12px 16px">
        ${det.possibleRegressionTargets.slice(0, 5).map(t => `<div class="flex-between mb-8"><span class="text-sm fw-600">${Helpers.escapeHtml(t)}</span><span class="badge badge-navy">Numeric</span></div>`).join('') || '<div class="text-sm text-muted">No numerical columns</div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Identifier Columns</div></div>
      <div class="card-body" style="padding:12px 16px">
        ${det.idColumns.length ? det.idColumns.map(t => `<div class="flex-between mb-8"><span class="text-sm fw-600">${Helpers.escapeHtml(t)}</span><span class="badge badge-amber">ID</span></div>`).join('') : '<div class="text-sm text-muted">None detected</div>'}
      </div>
    </div>
  </div>
</div>`;
    },
    init() { }
  },

  // ── PREPROCESSING ─────────────────────────────────────────────

  preprocessing: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Data Preprocessing</h1></div></div>${noDatasetWarning()}`;

      const cfg = AppState.preprocessing.config;
      const pre = AppState.preprocessing;

      return `
<div class="page-header">
  <div><h1 class="page-title">Data Preprocessing</h1><p class="page-subtitle">Clean and transform your dataset before analysis.</p></div>
  <div class="page-actions">
    <button class="btn btn-primary btn-lg" onclick="applyPreprocessing()" id="apply-pre-btn">Apply Preprocessing</button>
  </div>
</div>

<div class="two-col">
  <div class="sidebar-col">

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Missing Values</div></div>
      <div class="card-body">
        <div class="radio-group" id="missing-group">
          ${[['remove', 'Remove Rows', 'Delete rows with any missing value'], ['mean', 'Mean Imputation', 'Replace with column mean (numeric)'], ['median', 'Median Imputation', 'Replace with column median (numeric)'], ['mode', 'Mode Imputation', 'Replace with most frequent value']].map(([v, l, d]) => `
          <label class="radio-option ${cfg.missingStrategy === v ? 'selected' : ''}" onclick="selectRadio('missing-group',this);AppState.preprocessing.config.missingStrategy='${v}'">
            <input type="radio" name="missing" value="${v}" ${cfg.missingStrategy === v ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div><div class="radio-option-desc">${d}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Duplicates</div></div>
      <div class="card-body">
        <div class="toggle-wrap">
          <button class="toggle ${cfg.removeDuplicates ? 'on' : ''}" id="dup-toggle" onclick="this.classList.toggle('on');AppState.preprocessing.config.removeDuplicates=this.classList.contains('on')"></button>
          <span class="toggle-label">Remove Duplicate Rows</span>
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Encoding</div></div>
      <div class="card-body">
        <div class="radio-group" id="enc-group">
          ${[['none', 'No Encoding', 'Keep categorical columns as-is'], ['label', 'Label Encoding', 'Convert categories to integers (0,1,2...)'], ['onehot', 'One-Hot Encoding', 'Create binary columns per category']].map(([v, l, d]) => `
          <label class="radio-option ${cfg.encoding === v ? 'selected' : ''}" onclick="selectRadio('enc-group',this);AppState.preprocessing.config.encoding='${v}'">
            <input type="radio" name="enc" value="${v}" ${cfg.encoding === v ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div><div class="radio-option-desc">${d}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Feature Scaling</div></div>
      <div class="card-body">
        <div class="radio-group" id="scale-group">
          ${[['none', 'No Scaling', 'Keep original values'], ['standard', 'Standardization (Z-score)', 'Mean=0, Std=1'], ['minmax', 'Min-Max Normalization', 'Scale to [0,1] range']].map(([v, l, d]) => `
          <label class="radio-option ${cfg.scaling === v ? 'selected' : ''}" onclick="selectRadio('scale-group',this);AppState.preprocessing.config.scaling='${v}'">
            <input type="radio" name="scale" value="${v}" ${cfg.scaling === v ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div><div class="radio-option-desc">${d}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Outlier Handling</div></div>
      <div class="card-body">
        <div class="radio-group" id="out-group">
          ${[['none', 'No Outlier Removal', 'Keep all values'], ['iqr', 'IQR Method', 'Remove values outside Q1−1.5×IQR and Q3+1.5×IQR'], ['zscore', 'Z-Score Method', 'Remove values with |Z| > 3']].map(([v, l, d]) => `
          <label class="radio-option ${cfg.outlierMethod === v ? 'selected' : ''}" onclick="selectRadio('out-group',this);AppState.preprocessing.config.outlierMethod='${v}'">
            <input type="radio" name="out" value="${v}" ${cfg.outlierMethod === v ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div><div class="radio-option-desc">${d}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Train / Test Split</div></div>
      <div class="card-body">
        <div class="radio-group" id="split-group">
          ${[['0.7', '70% / 30%'], ['0.75', '75% / 25%'], ['0.8', '80% / 20%']].map(([v, l]) => `
          <label class="radio-option ${Math.abs(cfg.trainTestSplit - +v) < 0.01 ? 'selected' : ''}" onclick="selectRadio('split-group',this);AppState.preprocessing.config.trainTestSplit=${v}">
            <input type="radio" name="split" value="${v}" ${Math.abs(cfg.trainTestSplit - +v) < 0.01 ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>

  </div>

  <div class="content-col">
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Before / After Statistics</div></div>
      <div class="card-body">
        <div class="grid-2">
          ${['Before', 'After'].map((label, idx) => {
        const s = idx === 0 ? { rows: ds.rowCount, missing: AppState.summary?.missingTotal || 0, dupes: AppState.summary?.duplicates || 0, cols: ds.columnCount } : (pre.applied ? pre.afterStats : { rows: '—', missing: '—', dupes: '—', cols: '—' });
        return `<div class="card" style="border:1px solid var(--border)"><div class="card-body" style="padding:14px 16px">
              <div class="fw-600 mb-12 text-${idx === 0 ? 'muted' : 'teal'}">${label} Preprocessing</div>
              ${[['Rows', s.rows], ['Missing Values', s.missing], ['Duplicate Rows', s.dupes], ['Columns', s.cols]].map(([k, v]) => `<div class="flex-between mb-6"><span class="text-sm text-muted">${k}</span><span class="fw-600">${v}</span></div>`).join('')}
            </div></div>`;
      }).join('')}
        </div>
        ${pre.applied ? `<div class="info-box success mt-12"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Preprocessing applied successfully. ${pre.log?.join(' ') ?? ''}</div>` : '<div class="info-box info mt-12"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Configure options and click "Apply Preprocessing" to transform your dataset.</div>'}
      </div>
    </div>

    ${pre.applied ? `
    <div class="card">
      <div class="card-header"><div class="card-title">Processed Data Preview</div><span class="badge badge-info">${ds.processedData?.length || 0} rows</span></div>
      <div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>#</th>${(AppState.preprocessing.resultColumns || ds.columns).slice(0, 10).map(c => `<th>${Helpers.escapeHtml(c)}</th>`).join('')}${(AppState.preprocessing.resultColumns || ds.columns).length > 10 ? '<th>...</th>' : ''}</tr></thead>
          <tbody>
            ${(ds.processedData || []).slice(0, 20).map((r, i) => `<tr><td style="color:var(--text2)">${i + 1}</td>${(AppState.preprocessing.resultColumns || ds.columns).slice(0, 10).map(c => `<td>${typeof r[c] === 'number' ? r[c].toFixed(3) : Helpers.escapeHtml(r[c] ?? '')}</td>`).join('')}${(AppState.preprocessing.resultColumns || ds.columns).length > 10 ? '<td class="text-muted">...</td>' : ''}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="mt-16">
      <button class="btn btn-primary btn-lg w-full" onclick="applyPreprocessing()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Apply Preprocessing
      </button>
    </div>
  </div>
</div>`;
    },
    init() { }
  },

  // ── CLASSIFICATION ────────────────────────────────────────────

  classification: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Classification</h1></div></div>${noDatasetWarning()}`;

      const ca = AppState.analysis.classification;
      const det = AppState.detection;
      const cols = ds.columns;
      const r = ca.result;

      return `
<div class="page-header">
  <div><h1 class="page-title">Classification</h1><p class="page-subtitle">Predict categorical outcomes using supervised learning.</p></div>
</div>

<div class="two-col">
  <div class="sidebar-col">
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Configuration</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Target Attribute <span class="text-error">*</span></label>
          <select class="form-select" id="clf-target" onchange="AppState.analysis.classification.target=this.value;updateFeatureList('clf-features',this.value)">
            <option value="">— Select categorical target —</option>
            ${det.possibleClassificationTargets.map(c => `<option value="${c}" ${ca.target === c ? 'selected' : ''}>${Helpers.escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Train / Test Split</label>
          <select class="form-select" id="clf-split" onchange="AppState.preprocessing.config.trainTestSplit=+this.value">
            ${[['0.7', '70/30'], ['0.75', '75/25'], ['0.8', '80/20']].map(([v, l]) => `<option value="${v}" ${Math.abs(AppState.preprocessing.config.trainTestSplit - +v) < 0.01 ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Random State</label>
          <input class="form-input" type="number" value="42" id="clf-seed" onchange="AppState.preprocessing.config.seed=+this.value">
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Select Algorithm</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['j48', 'J48 Decision Tree', 'teal', 'Tree-based classification using gain ratio splitting.'],
          ['nb', 'Naive Bayes', 'navy', 'Probabilistic classification based on Bayes theorem with Laplace smoothing.'],
          ['lr', 'Logistic Regression', 'amber', 'Classification using gradient descent and probability-based boundaries.']
        ].map(([v, t, c, d]) => `
        <div class="algo-card ${ca.algorithm === v ? 'selected' : ''}" onclick="selectAlgo('${v}',this)" id="algo-${v}">
          <div class="algo-card-icon ${c}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${v === 'j48' ? '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>' : v === 'nb' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'}</svg></div>
          <div class="algo-card-title">${t}</div>
          <div class="algo-card-desc">${d}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="card mb-16" id="algo-params-card">
      <div class="card-header"><div class="card-title">Algorithm Parameters</div></div>
      <div class="card-body" id="algo-params">
        ${this._renderParams(ca.algorithm, ca.parameters)}
      </div>
    </div>

    <button class="btn btn-primary btn-lg w-full" id="run-clf-btn" onclick="runClassification()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Run Classification
    </button>
  </div>

  <div class="content-col">
    ${r ? this._renderResults(r, ca) : `
    <div class="state-container" style="min-height:400px">
      <div class="state-icon"><svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
      <div class="state-title">Ready to Classify</div>
      <div class="state-sub">Select a target attribute and algorithm, then click Run Classification.</div>
    </div>`}
  </div>
</div>`;
    },
    _renderParams(algo, params) {
      if (algo === 'j48') return `
        <div class="form-group"><label class="form-label">Max Depth <span class="text-muted text-xs">(1–20)</span></label><div class="range-wrap"><input type="range" class="form-range" min="1" max="20" value="${params.maxDepth || 5}" oninput="AppState.analysis.classification.parameters.maxDepth=+this.value;this.nextElementSibling.textContent=this.value"><span class="range-value">${params.maxDepth || 5}</span></div></div>
        <div class="form-group"><label class="form-label">Min Instances per Leaf</label><input class="form-input" type="number" min="1" value="${params.minInstances || 2}" onchange="AppState.analysis.classification.parameters.minInstances=+this.value"></div>
        <div class="form-group"><label class="form-label">Pruning</label><div class="toggle-wrap"><button class="toggle on" id="prune-toggle" onclick="this.classList.toggle('on')"></button><span class="toggle-label">Enabled</span></div></div>`;
      if (algo === 'nb') return `
        <div class="form-group"><label class="form-label">Laplace Smoothing (α)</label><input class="form-input" type="number" step="0.1" min="0" value="${params.smoothing || 1.0}" onchange="AppState.analysis.classification.parameters.smoothing=+this.value"></div>`;
      if (algo === 'lr') return `
        <div class="form-group"><label class="form-label">Learning Rate</label><input class="form-input" type="number" step="0.01" min="0.001" value="${params.learningRate || 0.1}" onchange="AppState.analysis.classification.parameters.learningRate=+this.value"></div>
        <div class="form-group"><label class="form-label">Max Iterations</label><input class="form-input" type="number" min="10" value="${params.maxIter || 300}" onchange="AppState.analysis.classification.parameters.maxIter=+this.value"></div>
        <div class="form-group"><label class="form-label">Regularization (λ)</label><input class="form-input" type="number" step="0.001" min="0" value="${params.lambda || 0.01}" onchange="AppState.analysis.classification.parameters.lambda=+this.value"></div>`;
      return '<div class="text-muted text-sm">Select an algorithm to see parameters.</div>';
    },
    _renderResults(r, ca) {
      return `
<div>
  <div class="flex-between mb-16">
    <div class="fw-700" style="font-size:16px">Classification Results</div>
    <div class="flex gap-8">
      <span class="badge badge-info">${ca.algorithm === 'j48' ? 'J48 Decision Tree' : ca.algorithm === 'nb' ? 'Naive Bayes' : 'Logistic Regression'}</span>
      <span class="badge badge-neutral">Target: ${ca.target}</span>
    </div>
  </div>
  <div class="metric-grid-4 mb-20">
    ${[
          ['Accuracy', (r.accuracy * 100).toFixed(2) + '%', 'var(--success)'],
          ['Precision', (r.precision * 100).toFixed(2) + '%', 'var(--teal)'],
          ['Recall', (r.recall * 100).toFixed(2) + '%', 'var(--navy)'],
          ['F1 Score', (r.f1 * 100).toFixed(2) + '%', 'var(--amber)']
        ].map(([l, v, c]) => `<div class="result-metric"><div class="result-metric-val" style="color:${c}">${v}</div><div class="result-metric-label">${l}</div></div>`).join('')}
  </div>

  <div class="grid-2 mb-16">
    <div class="chart-card">
      <div class="chart-card-header">Confusion Matrix</div>
      <div class="card-body">
        <table class="confusion-matrix" style="margin:0 auto">
          <tr><th></th>${r.classes.map(c => `<th>Pred: ${Helpers.escapeHtml(String(c))}</th>`).join('')}</tr>
          ${r.classes.map(a => `<tr><th>Act: ${Helpers.escapeHtml(String(a))}</th>${r.classes.map(p => `<td class="${a === p ? 'cm-diag' : r.confMatrix[a]?.[p] > 0 ? 'cm-off' : ''}">${r.confMatrix[a]?.[p] ?? 0}</td>`).join('')}</tr>`).join('')}
        </table>
      </div>
    </div>
    ${ca.algorithm === 'j48' && r.featureImportance ? `
    <div class="chart-card">
      <div class="chart-card-header">Feature Importance</div>
      <div class="chart-card-body"><canvas id="feat-imp-chart" height="200"></canvas></div>
    </div>` : `
    <div class="chart-card">
      <div class="chart-card-header">Per-Class Report</div>
      <div class="card-body">
        <table class="data-table" style="font-size:11px">
          <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead>
          <tbody>
            ${r.classes.map(c => `<tr><td>${Helpers.escapeHtml(String(c))}</td><td>${(r.perClass[c].precision * 100).toFixed(1)}%</td><td>${(r.perClass[c].recall * 100).toFixed(1)}%</td><td>${(r.perClass[c].f1 * 100).toFixed(1)}%</td><td>${r.perClass[c].support}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`}
  </div>

  <div class="chart-card mb-16">
    <div class="chart-card-header">Prediction Preview</div>
    <div class="table-wrap" style="max-height:200px;overflow-y:auto">
      <table class="data-table" style="font-size:11px">
        <thead><tr><th>#</th><th>Actual</th><th>Predicted</th><th>Correct</th></tr></thead>
        <tbody>
          ${(r.predictions || []).slice(0, 30).map((p, i) => `<tr><td>${i + 1}</td><td>${Helpers.escapeHtml(String(p.actual))}</td><td>${Helpers.escapeHtml(String(p.predicted))}</td><td>${p.actual === p.predicted ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-error">✗</span>'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="flex gap-10">
    <button class="btn btn-secondary" onclick="Export.exportClassificationResults(AppState.analysis.classification.result,'classification_results')">Download Results</button>
    <button class="btn btn-ghost" onclick="Router.navigate('comparison')">View Model Comparison →</button>
  </div>
</div>`;
    },
    init() {
      const r = AppState.analysis.classification.result;
      if (r?.featureImportance) setTimeout(() => Charts.featureImportance('feat-imp-chart', r.featureImportance), 100);
    }
  },

  // ── REGRESSION ────────────────────────────────────────────────

  regression: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Regression</h1></div></div>${noDatasetWarning()}`;

      const ra = AppState.analysis.regression;
      const det = AppState.detection;
      const r = ra.result;

      return `
<div class="page-header">
  <div><h1 class="page-title">Regression</h1><p class="page-subtitle">Predict continuous numerical values from selected features.</p></div>
</div>

<div class="two-col">
  <div class="sidebar-col">
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Regression Type</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        ${[['simple', 'Simple Linear Regression', 'teal', 'One independent variable → one target (y = b0 + b1x)'], ['multiple', 'Multiple Linear Regression', 'navy', 'Multiple features → one target (y = b0 + b1x1 + b2x2 + ...)']].map(([v, t, c, d]) => `
        <div class="algo-card ${ra.algorithm === v ? 'selected' : ''}" onclick="AppState.analysis.regression.algorithm='${v}';Router.navigate('regression')">
          <div class="algo-card-icon ${c}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div class="algo-card-title">${t}</div>
          <div class="algo-card-desc">${d}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Configuration</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Target Attribute (Numerical) <span class="text-error">*</span></label>
          <select class="form-select" id="reg-target" onchange="AppState.analysis.regression.target=this.value">
            <option value="">— Select numerical target —</option>
            ${det.possibleRegressionTargets.map(c => `<option value="${c}" ${ra.target === c ? 'selected' : ''}>${Helpers.escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        ${ra.algorithm === 'simple' ? `
        <div class="form-group">
          <label class="form-label">X Feature (Independent Variable)</label>
          <select class="form-select" id="reg-x" onchange="AppState.analysis.regression.features=[this.value]">
            <option value="">— Select X feature —</option>
            ${det.possibleRegressionTargets.map(c => `<option value="${c}" ${ra.features[0] === c ? 'selected' : ''}>${Helpers.escapeHtml(c)}</option>`).join('')}
          </select>
        </div>` : `
        <div class="form-group">
          <label class="form-label">Feature Attributes</label>
          <div class="checkbox-group" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
            ${det.numericColumns.filter(c => ds.schema[c]?.role !== 'identifier').map(c => `
            <label class="checkbox-item"><input type="checkbox" ${ra.features.includes(c) ? 'checked' : ''} onchange="toggleFeature('reg',this,'${c}')"> ${Helpers.escapeHtml(c)}</label>`).join('')}
          </div>
        </div>`}
        <div class="form-group">
          <label class="form-label">Train / Test Split</label>
          <select class="form-select" onchange="AppState.preprocessing.config.trainTestSplit=+this.value">
            ${[['0.7', '70/30'], ['0.75', '75/25'], ['0.8', '80/20']].map(([v, l]) => `<option value="${v}" ${Math.abs(AppState.preprocessing.config.trainTestSplit - +v) < 0.01 ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-lg w-full" onclick="runRegression()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Run Regression
    </button>
  </div>

  <div class="content-col">
    ${r ? this._renderResults(r, ra) : `
    <div class="state-container" style="min-height:400px">
      <div class="state-icon"><svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      <div class="state-title">Ready to Run Regression</div>
      <div class="state-sub">Select a numerical target attribute and features, then click Run Regression.</div>
    </div>`}
  </div>
</div>`;
    },
    _renderResults(r, ra) {
      return `
<div>
  <div class="flex-between mb-16">
    <div class="fw-700" style="font-size:16px">Regression Results</div>
    <span class="badge badge-info">${ra.algorithm === 'simple' ? 'Simple Linear Regression' : 'Multiple Linear Regression'}</span>
  </div>
  <div class="metric-grid-4 mb-20">
    ${[['MAE', r.mae?.toFixed(4), 'Mean Absolute Error', 'var(--teal)'], ['MSE', r.mse?.toFixed(4), 'Mean Squared Error', 'var(--navy)'], ['RMSE', r.rmse?.toFixed(4), 'Root MSE', 'var(--amber)'], ['R²', r.r2?.toFixed(4), 'Coefficient of Determination', 'var(--success)']].map(([l, v, s, c]) => `
    <div class="result-metric"><div class="result-metric-val" style="color:${c}">${v}</div><div class="result-metric-label">${l}</div><div class="text-xs text-muted mt-4">${s}</div></div>`).join('')}
  </div>
  ${r.equation ? `<div class="info-box info mb-16"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg><span class="fw-600">Equation: </span><code style="font-family:monospace;margin-left:4px">${Helpers.escapeHtml(r.equation)}</code></div>` : ''}
  <div class="grid-2 mb-16">
    <div class="chart-card"><div class="chart-card-header">Actual vs Predicted</div><div class="chart-card-body"><canvas id="avp-chart" height="200"></canvas></div></div>
    <div class="chart-card"><div class="chart-card-header">Residual Plot</div><div class="chart-card-body"><canvas id="resid-chart" height="200"></canvas></div></div>
  </div>
  ${ra.algorithm === 'simple' ? `<div class="chart-card mb-16"><div class="chart-card-header">Regression Line</div><div class="chart-card-body"><canvas id="regline-chart" height="200"></canvas></div></div>` : ''}
  <button class="btn btn-secondary" onclick="Export.exportRegressionResults(AppState.analysis.regression.result,'regression_results')">Download Results</button>
</div>`;
    },
    init() {
      const r = AppState.analysis.regression.result;
      if (!r) return;
      setTimeout(() => {
        const actual = r.predictions.map(p => p.actual);
        const predicted = r.predictions.map(p => p.predicted);
        const residuals = actual.map((a, i) => a - predicted[i]);
        Charts.actualVsPredicted('avp-chart', actual, predicted);
        Charts.residualPlot('resid-chart', predicted, residuals);
        if (AppState.analysis.regression.algorithm === 'simple' && r.testX) {
          Charts.regressionLine('regline-chart', r.testX, actual, predicted, AppState.analysis.regression.features[0], AppState.analysis.regression.target);
        }
      }, 100);
    }
  },

  // ── CLUSTERING ────────────────────────────────────────────────

  clustering: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Clustering</h1></div></div>${noDatasetWarning()}`;

      const cl = AppState.analysis.clustering;
      const det = AppState.detection;
      const r = cl.result;

      return `
<div class="page-header">
  <div><h1 class="page-title">Clustering</h1><p class="page-subtitle">Discover groups in your dataset without a predefined target.</p></div>
</div>

<div class="two-col">
  <div class="sidebar-col">
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Algorithm</div></div>
      <div class="card-body">
        <div class="algo-card selected">
          <div class="algo-card-icon teal"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg></div>
          <div class="algo-card-title">K-Means Clustering</div>
          <div class="algo-card-desc">Partition data into K clusters by minimizing within-cluster variance.</div>
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Configuration</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Features (Numerical only)</label>
          <div class="checkbox-group" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
            ${det.possibleRegressionTargets.map(c => `
            <label class="checkbox-item"><input type="checkbox" ${cl.features.includes(c) ? 'checked' : ''} onchange="toggleFeature('cl',this,'${c}')"> ${Helpers.escapeHtml(c)}</label>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Number of Clusters (K)</label>
          <div class="range-wrap"><input type="range" class="form-range" min="2" max="15" value="${cl.k}" oninput="AppState.analysis.clustering.k=+this.value;this.nextElementSibling.textContent=this.value" id="k-slider"><span class="range-value">${cl.k}</span></div>
        </div>
        <div class="form-group">
          <label class="form-label">Max Iterations</label>
          <input class="form-input" type="number" value="${cl.parameters.maxIter || 100}" onchange="AppState.analysis.clustering.parameters.maxIter=+this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Random State</label>
          <input class="form-input" type="number" value="${cl.parameters.seed || 42}" onchange="AppState.analysis.clustering.parameters.seed=+this.value">
        </div>
        <div class="info-box info mt-8">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg>
          K-Means uses k-means++ initialization for better convergence.
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-lg w-full" onclick="runClustering()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Run K-Means
    </button>
  </div>

  <div class="content-col">
    ${r ? this._renderResults(r) : `
    <div class="state-container" style="min-height:400px">
      <div class="state-icon"><svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg></div>
      <div class="state-title">Ready to Cluster</div>
      <div class="state-sub">Select numerical features and K, then click Run K-Means.</div>
    </div>`}
  </div>
</div>`;
    },
    _renderResults(r) {
      return `
<div>
  <div class="metric-grid-3 mb-20">
    <div class="result-metric"><div class="result-metric-val" style="color:var(--teal)">${r.k}</div><div class="result-metric-label">Clusters</div></div>
    <div class="result-metric"><div class="result-metric-val" style="color:var(--navy)">${r.silhouette?.toFixed(4) ?? '—'}</div><div class="result-metric-label">Silhouette Score</div></div>
    <div class="result-metric"><div class="result-metric-val" style="color:var(--amber)">${r.iterations || '—'}</div><div class="result-metric-label">Iterations</div></div>
  </div>

  <div class="card mb-16">
    <div class="card-header"><div class="card-title">Cluster Summary</div></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Cluster</th><th>Size</th><th>Percentage</th><th>Centroid (first 3 features)</th></tr></thead>
        <tbody>
          ${r.sizes.map((s, i) => `<tr>
            <td><span class="badge" style="background:${Helpers.PALETTE[i]}22;color:${Helpers.PALETTE[i]}">Cluster ${i + 1}</span></td>
            <td>${s.toLocaleString()}</td>
            <td>${((s / r.totalPoints) * 100).toFixed(1)}%</td>
            <td class="mono">${(r.centroids[i] || []).slice(0, 3).map(v => v.toFixed(3)).join(', ')}${(r.centroids[i] || []).length > 3 ? ', …' : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="grid-2 mb-16">
    <div class="chart-card"><div class="chart-card-header">Cluster Size Distribution</div><div class="chart-card-body"><canvas id="cl-size-chart" height="200"></canvas></div></div>
    <div class="chart-card"><div class="chart-card-header">Elbow Curve (WCSS vs K)</div><div class="chart-card-body"><canvas id="elbow-chart" height="200"></canvas></div></div>
  </div>
  <div class="chart-card mb-16"><div class="chart-card-header">2D Cluster Visualization (PCA Projection)</div><div class="chart-card-body"><canvas id="cl-scatter" height="250"></canvas></div></div>
</div>`;
    },
    init() {
      const r = AppState.analysis.clustering.result;
      if (!r) return;
      setTimeout(() => {
        Charts.clusterSizes('cl-size-chart', r.sizes);
        if (r.elbowData) Charts.elbowCurve('elbow-chart', r.elbowData);
        if (r.points2D) Charts.clusterScatter('cl-scatter', r.points2D, r.labels, r.k);
      }, 100);
    }
  },

  // ── ASSOCIATION RULES ─────────────────────────────────────────

  association: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Association Rules</h1></div></div>${noDatasetWarning()}`;

      const aa = AppState.analysis.association;
      const cols = ds.columns;
      const det = AppState.detection || {};
      const numericSet = new Set(det.possibleRegressionTargets || []);
      const p = aa.parameters;
      const r = aa.result;
      const rules = aa.rules || [];
      const itemsets = aa.itemsets || [];

      return `
<div class="page-header">
  <div><h1 class="page-title">Association Rules</h1><p class="page-subtitle">Discover frequently occurring item combinations and relationships.</p></div>
</div>

<div class="two-col">
  <div class="sidebar-col">
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Dataset Configuration</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Transaction / Item Column</label>
          <select class="form-select" onchange="AppState.analysis.association.transactionColumn=this.value">
            <option value="">— Select categorical / item column —</option>
            ${cols.filter(c => !numericSet.has(c)).map(c => `<option value="${c}" ${aa.transactionColumn === c ? 'selected' : ''}>${Helpers.escapeHtml(c)}</option>`).join('')}
          </select>
          <span class="form-label-sub">Select the column where each cell contains a list of items (pipe-separated or comma-separated).</span>
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Algorithm</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        ${[['apriori', 'Apriori', 'teal', 'Candidate-generation approach. Suitable for smaller datasets.'], ['fpgrowth', 'FP-Growth', 'navy', 'FP-tree approach. More efficient for larger datasets.']].map(([v, t, c, d]) => `
        <div class="algo-card ${aa.algorithm === v ? 'selected' : ''}" onclick="AppState.analysis.association.algorithm='${v}';Router.navigate('association')">
          <div class="algo-card-icon ${c}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
          <div class="algo-card-title">${t}</div>
          <div class="algo-card-desc">${d}</div>
        </div>`).join('')}
        <div class="info-box info" style="font-size:11px">Neither algorithm is universally better — results depend on dataset size, density, and min-support threshold.</div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Parameters</div></div>
      <div class="card-body">
        ${[
          ['minSupport', 'Min Support (0–1)', p.minSupport || 0.1, 0, 1, 0.01, 'AppState.analysis.association.parameters.minSupport=+this.value'],
          ['minConfidence', 'Min Confidence (0–1)', p.minConfidence || 0.5, 0, 1, 0.01, 'AppState.analysis.association.parameters.minConfidence=+this.value'],
          ['minLift', 'Min Lift (≥1)', p.minLift || 1.0, 0.5, 10, 0.1, 'AppState.analysis.association.parameters.minLift=+this.value']
        ].map(([id, label, val, mn, mx, step, onchange]) => `
        <div class="form-group"><label class="form-label">${label}</label><input class="form-input" type="number" id="${id}" step="${step}" min="${mn}" max="${mx}" value="${val}" onchange="${onchange}"></div>`).join('')}
        <div class="form-group"><label class="form-label">Max Itemset Length</label><input class="form-input" type="number" min="2" max="10" value="${p.maxLen || 5}" onchange="AppState.analysis.association.parameters.maxLen=+this.value"></div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary btn-lg w-full" onclick="runFrequentItemsets()">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Generate Frequent Itemsets
      </button>
      <button class="btn btn-navy btn-lg w-full" onclick="runAssociationRules()" ${itemsets.length ? '' : 'disabled'}>
        Generate Association Rules
      </button>
    </div>
  </div>

  <div class="content-col">
    ${itemsets.length ? `
    <div class="card mb-16">
      <div class="card-header">
        <div><div class="card-title">Frequent Itemsets</div><div class="card-subtitle">${itemsets.length} itemsets found</div></div>
        <button class="btn btn-secondary btn-sm" onclick="Export.downloadCSV(AppState.analysis.association.itemsets.map(s=>({Itemset:Array.isArray(s.items)?s.items.join(', '):s.items,Support:s.support.toFixed(4)})),'frequent_itemsets.csv')">Export CSV</button>
      </div>
      <div class="table-wrap" style="max-height:250px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>#</th><th>Itemset</th><th>Support</th><th>Frequency</th></tr></thead>
          <tbody>
            ${itemsets.slice(0, 50).map((s, i) => `<tr><td>${i + 1}</td><td><strong>${Helpers.escapeHtml(Array.isArray(s.items) ? s.items.join(', ') : String(s.items))}</strong></td><td>${(s.support * 100).toFixed(2)}%</td><td><div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${(s.support * 100).toFixed(1)}%;background:var(--teal)"></div></div></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : `<div class="state-container" style="min-height:200px"><div class="state-title">No Itemsets Yet</div><div class="state-sub">Select a transaction column and click "Generate Frequent Itemsets".</div></div>`}

    ${rules.length ? `
    <div class="card mb-16">
      <div class="card-header">
        <div><div class="card-title">Association Rules</div><div class="card-subtitle">${rules.length} rules generated</div></div>
        <button class="btn btn-secondary btn-sm" onclick="Export.exportAssociationRules(AppState.analysis.association.rules)">Export CSV</button>
      </div>
      <div class="table-wrap" style="max-height:280px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>#</th><th>Antecedent</th><th>→</th><th>Consequent</th><th>Support</th><th>Confidence</th><th>Lift</th></tr></thead>
          <tbody>
            ${rules.slice(0, 50).map((r, i) => `<tr>
              <td>${i + 1}</td>
              <td><strong>${Helpers.escapeHtml(r.antecedent.join(', '))}</strong></td>
              <td>→</td>
              <td>${Helpers.escapeHtml(r.consequent.join(', '))}</td>
              <td>${(r.support * 100).toFixed(2)}%</td>
              <td>${(r.confidence * 100).toFixed(2)}%</td>
              <td><span class="badge ${r.lift >= 1.5 ? 'badge-success' : r.lift >= 1 ? 'badge-info' : 'badge-neutral'}">${r.lift.toFixed(3)}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="chart-card"><div class="chart-card-header">Association Network</div><div class="card-body" id="assoc-network" style="min-height:300px"></div></div>` : ''}
  </div>
</div>`;
    },
    init() {
      if (AppState.analysis.association.rules?.length) {
        setTimeout(() => Charts.associationNetwork('assoc-network', AppState.analysis.association.rules), 200);
      }
    }
  },

  // ── MODEL COMPARISON ──────────────────────────────────────────

  modelComparison: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Model Comparison</h1></div></div>${noDatasetWarning()}`;

      const ca = AppState.analysis.classification;
      const ra = AppState.analysis.regression;

      return `
<div class="page-header">
  <div><h1 class="page-title">Model Comparison</h1><p class="page-subtitle">Compare algorithm performance on identical data splits and preprocessing.</p></div>
</div>

<div class="tabs">
  <button class="tab-btn active" onclick="switchTab(this,'overall-tab')">Overall Summary</button>
  <button class="tab-btn" onclick="switchTab(this,'clf-tab')">Classification</button>
  <button class="tab-btn" onclick="switchTab(this,'reg-tab')">Regression</button>
  <button class="tab-btn" onclick="switchTab(this,'assoc-tab')">Association Rules</button>
</div>

<div id="overall-tab">
  <div class="info-box info mb-16"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg>
  This view aggregates the best or most recent results from all four data mining techniques applied to this dataset.</div>
  
  <div class="metric-grid-4 mb-16">
    <div class="metric-card">
      <div class="metric-card-label">Classification</div>
      <div class="metric-card-value" style="color:var(--teal)">${AppState.analysis.classification.result ? (AppState.analysis.classification.result.accuracy * 100).toFixed(1) + '%' : 'N/A'}</div>
      <div class="metric-card-sub">${AppState.analysis.classification.result ? 'Best Accuracy' : 'Not run yet'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-card-label">Regression</div>
      <div class="metric-card-value" style="color:var(--amber)">${AppState.analysis.regression.result ? AppState.analysis.regression.result.r2.toFixed(3) : 'N/A'}</div>
      <div class="metric-card-sub">${AppState.analysis.regression.result ? 'Best R² Score' : 'Not run yet'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-card-label">Clustering</div>
      <div class="metric-card-value" style="color:var(--navy)">${AppState.analysis.clustering.result ? AppState.analysis.clustering.k : 'N/A'}</div>
      <div class="metric-card-sub">${AppState.analysis.clustering.result ? 'Clusters Formed' : 'Not run yet'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-card-label">Association</div>
      <div class="metric-card-value" style="color:var(--text)">${AppState.analysis.association.result ? AppState.analysis.association.rules.length : 'N/A'}</div>
      <div class="metric-card-sub">${AppState.analysis.association.result ? 'Rules Discovered' : 'Not run yet'}</div>
    </div>
  </div>
  
  <div class="card mb-16">
    <div class="card-header"><div class="card-title">Completed Analysis Tasks</div></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Task Type</th><th>Target / Features</th><th>Key Metric</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>Classification</strong></td>
            <td>${AppState.analysis.classification.result ? 'Target: ' + AppState.analysis.classification.target : '—'}</td>
            <td>${AppState.analysis.classification.result ? 'Accuracy: ' + (AppState.analysis.classification.result.accuracy * 100).toFixed(2) + '%' : '—'}</td>
            <td>${AppState.analysis.classification.result ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-neutral">Pending</span>'}</td>
          </tr>
          <tr>
            <td><strong>Regression</strong></td>
            <td>${AppState.analysis.regression.result ? 'Target: ' + AppState.analysis.regression.target : '—'}</td>
            <td>${AppState.analysis.regression.result ? 'R²: ' + AppState.analysis.regression.result.r2.toFixed(3) : '—'}</td>
            <td>${AppState.analysis.regression.result ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-neutral">Pending</span>'}</td>
          </tr>
          <tr>
            <td><strong>Clustering</strong></td>
            <td>${AppState.analysis.clustering.result ? AppState.analysis.clustering.features.length + ' features' : '—'}</td>
            <td>${AppState.analysis.clustering.result ? 'K = ' + AppState.analysis.clustering.k : '—'}</td>
            <td>${AppState.analysis.clustering.result ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-neutral">Pending</span>'}</td>
          </tr>
          <tr>
            <td><strong>Association Rules</strong></td>
            <td>${AppState.analysis.association.result ? 'Min Support: ' + AppState.analysis.association.parameters.minSupport : '—'}</td>
            <td>${AppState.analysis.association.result ? AppState.analysis.association.rules.length + ' Rules' : '—'}</td>
            <td>${AppState.analysis.association.result ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-neutral">Pending</span>'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div id="clf-tab" class="hidden">
  <div class="info-box info mb-16"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg>
  Compare J48, Naive Bayes and Logistic Regression on identical dataset split and preprocessing settings. Metrics are shown without declaring a "best" model.</div>
  <div class="card mb-16">
    <div class="card-header"><div class="card-title">Classification Comparison</div>
      <button class="btn btn-primary btn-sm" onclick="runAllClassification()">Compare All Models</button>
    </div>
    <div class="table-wrap">
      <table class="data-table" id="clf-comp-table">
        <thead><tr><th>Algorithm</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1 Score</th><th>Training Time</th></tr></thead>
        <tbody id="clf-comp-body">
          <tr><td colspan="6"><div class="state-container" style="padding:24px"><div class="state-title">Click "Compare All Models" to run all classifiers</div></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="chart-card"><div class="chart-card-header">Performance Comparison</div><div class="chart-card-body"><canvas id="clf-comp-chart" height="200"></canvas></div></div>
</div>

<div id="reg-tab" class="hidden">
  <div class="card mb-16">
    <div class="card-header"><div class="card-title">Regression Comparison</div>
      <button class="btn btn-primary btn-sm" onclick="runAllRegression()">Compare Models</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Model</th><th>MAE</th><th>MSE</th><th>RMSE</th><th>R²</th><th>Training Time</th></tr></thead>
        <tbody id="reg-comp-body">
          <tr><td colspan="6"><div class="state-container" style="padding:24px"><div class="state-title">Click "Compare Models" to run regression algorithms</div></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="chart-card"><div class="chart-card-header">Regression Metrics Comparison</div><div class="chart-card-body"><canvas id="reg-comp-chart" height="200"></canvas></div></div>
</div>

<div id="assoc-tab" class="hidden">
  <div class="card mb-16">
    <div class="card-header"><div class="card-title">Association Rules Comparison (Apriori vs FP-Growth)</div>
      <button class="btn btn-primary btn-sm" onclick="runAssocComparison()">Compare Algorithms</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Algorithm</th><th>Frequent Itemsets</th><th>Rules Generated</th><th>Execution Time</th></tr></thead>
        <tbody id="assoc-comp-body">
          <tr><td colspan="4"><div class="state-container" style="padding:24px"><div class="state-title">Click "Compare Algorithms" to run comparison</div></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;
    },
    init() { }
  },

  // ── VISUALIZATION ─────────────────────────────────────────────

  visualization: {
    render() {
      const ds = AppState.dataset;
      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Visualization</h1></div></div>${noDatasetWarning()}`;

      const cols = ds.columns;
      const viz = AppState.visualization;
      const det = AppState.detection || {};
      const numCols = det.numericColumns || [];
      const catCols = [...(det.categoricalColumns || []), ...(det.booleanColumns || [])];
      const allCols = cols;

      const opt = (arr, sel, prefix = '') => arr.map(c => `<option value="${c}" ${sel === c ? 'selected' : ''}>${Helpers.escapeHtml(prefix + c)}</option>`).join('');

      return `
<div class="page-header">
  <div>
    <h1 class="page-title">Visualization Studio</h1>
    <p class="page-subtitle">Build accurate, interactive charts — Group By splits data into colored series, Aggregation controls how values are computed.</p>
  </div>
  <div class="page-actions">
    <button class="btn btn-secondary btn-sm" onclick="Charts.downloadChart('viz-chart-canvas','chart.png')">
      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download PNG
    </button>
  </div>
</div>

<div class="two-col">
  <div class="sidebar-col">

    <!-- Chart Type -->
    <div class="card mb-12">
      <div class="card-header"><div class="card-title">Chart Type</div></div>
      <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px">
        ${[
          ['bar', 'bar-chart-2', 'Bar'],
          ['line', 'trending-up', 'Line'],
          ['scatter', 'crosshair', 'Scatter'],
          ['histogram', 'bar-chart', 'Histogram'],
          ['doughnut', 'pie-chart', 'Donut/Pie'],
          ['heatmap', 'grid', 'Heatmap'],
        ].map(([v, ico, label]) => `
        <div class="viz-type-btn ${(viz.chartType || 'bar') === v ? 'active' : ''}" onclick="vizSetType('${v}')" title="${label}">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${svgPath(ico)}</svg>
          <span>${label}</span>
        </div>`).join('')}
      </div>
    </div>

    <!-- Columns -->
    <div class="card mb-12">
      <div class="card-header"><div class="card-title">Columns</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:12px">

        <div class="form-group" id="viz-x-wrap">
          <label class="form-label" id="viz-x-label">X Axis</label>
          <select class="form-select" id="viz-x" onchange="AppState.visualization.xAxis=this.value">
            <option value="">— Select column —</option>
            ${opt(allCols, viz.xAxis)}
          </select>
          <div class="form-label-sub" id="viz-x-hint">Pick any column</div>
        </div>

        <div class="form-group" id="viz-y-wrap">
          <label class="form-label" id="viz-y-label">Y Axis <span style="font-weight:400;font-size:10px;color:var(--text-muted)">(numeric)</span></label>
          <select class="form-select" id="viz-y" onchange="AppState.visualization.yAxis=this.value">
            <option value="">— None (count) —</option>
            ${opt(numCols, viz.yAxis)}
          </select>
        </div>

        <div class="form-group" id="viz-group-wrap">
          <label class="form-label">Group By
            <span style="font-weight:400;font-size:10px;color:var(--text-muted)"> (color series)</span>
          </label>
          <select class="form-select" id="viz-group" onchange="AppState.visualization.groupBy=this.value||null">
            <option value="">— None —</option>
            ${opt(catCols, viz.groupBy)}
          </select>
          <div class="form-label-sub">Categorical only · max 8 groups shown</div>
        </div>

      </div>
    </div>

    <!-- Options -->
    <div class="card mb-12">
      <div class="card-header"><div class="card-title">Options</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">

        <div class="form-group" id="viz-agg-wrap">
          <label class="form-label">Aggregation (Y Axis)</label>
          <select class="form-select" id="viz-agg" onchange="AppState.visualization.aggregation=this.value">
            ${[['mean', 'Mean (Average)'], ['sum', 'Sum (Total)'], ['count', 'Count'], ['min', 'Min'], ['max', 'Max'], ['median', 'Median']].map(([v, l]) => `<option value="${v}" ${(viz.aggregation || 'mean') === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="viz-topn-wrap">
          <label class="form-label">Show Top N Categories</label>
          <select class="form-select" id="viz-topn" onchange="AppState.visualization.topN=+this.value">
            ${[[10, 'Top 10'], [15, 'Top 15'], [20, 'Top 20'], [30, 'Top 30'], [-1, 'All']].map(([v, l]) => `<option value="${v}" ${(viz.topN || 15) === +v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="viz-sort-wrap">
          <label class="form-label">Sort Order</label>
          <select class="form-select" id="viz-sort" onchange="AppState.visualization.sortOrder=this.value">
            ${[['desc', 'Descending (highest first)'], ['asc', 'Ascending (lowest first)'], ['alpha', 'Alphabetical'], ['none', 'Original order']].map(([v, l]) => `<option value="${v}" ${(viz.sortOrder || 'desc') === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="viz-stack-wrap" style="display:none">
          <label class="form-label">Bar Mode</label>
          <select class="form-select" id="viz-stack" onchange="AppState.visualization.stacked=this.value==='stacked'">
            <option value="grouped" ${!viz.stacked ? 'selected' : ''}>Grouped</option>
            <option value="stacked" ${viz.stacked ? 'selected' : ''}>Stacked</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Max Rows to Use</label>
          <select class="form-select" id="viz-limit" onchange="AppState.visualization.limit=+this.value">
            ${[[500, '500 rows'], [1000, '1,000 rows'], [5000, '5,000 rows'], [-1, 'All rows']].map(([v, l]) => `<option value="${v}" ${(viz.limit || 1000) === +v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>

      </div>
    </div>

    <button class="btn btn-primary w-full" onclick="generateVizChart()">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Generate Chart
    </button>
  </div>

  <div class="content-col" style="display:flex;flex-direction:column;gap:14px">
    <!-- Main chart card -->
    <div class="chart-card" style="flex:1;min-height:460px">
      <div class="chart-card-header" style="display:flex;align-items:center;justify-content:space-between">
        <span id="viz-chart-label">Chart Preview</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span id="viz-row-badge" style="font-size:11px;color:var(--text-muted)"></span>
        </div>
      </div>
      <div class="chart-card-body" id="viz-chart-body" style="min-height:400px">
        <div class="state-container">
          <div class="state-icon"><svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <div class="state-title">Configure & Generate</div>
          <div class="state-sub">Select chart type + columns, then click Generate Chart.</div>
        </div>
      </div>
    </div>

    <!-- Data summary -->
    <div id="viz-summary-card" class="card" style="display:none">
      <div class="card-header"><div class="card-title">Column Statistics</div></div>
      <div class="card-body" id="viz-summary-body" style="font-size:13px"></div>
    </div>
  </div>
</div>`;
    },
    init() {
      vizApplyTypeUI();
      if (AppState.visualization.xAxis) setTimeout(() => generateVizChart(), 120);
    }
  },

  // ── RESULTS ───────────────────────────────────────────────────

  results: {
    render() {
      const an = AppState.analysis;
      const ds = AppState.dataset;
      const hasResults = an.classification.result || an.regression.result || an.clustering.result || an.association.result;

      if (!ds.loaded) return `<div class="page-header"><div><h1 class="page-title">Results</h1></div></div>${noDatasetWarning()}`;

      return `
<div class="page-header">
  <div><h1 class="page-title">Analysis Results</h1><p class="page-subtitle">Review all completed analysis outputs.</p></div>
  <div class="page-actions">
    ${hasResults ? `<button class="btn btn-primary" onclick="Router.navigate('report')">Export Report</button>` : ''}
  </div>
</div>

${!hasResults ? `<div class="state-container" style="min-height:400px"><div class="state-icon"><svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><div class="state-title">No Analysis Results Yet</div><div class="state-sub">Run Classification, Regression, Clustering or Association Rules to see results here.</div></div>` : `
<div style="display:flex;flex-direction:column;gap:20px">
${an.classification.result ? `
<div class="card">
  <div class="card-header"><div class="card-title">Classification Results</div><div class="flex gap-6"><span class="badge badge-info">${an.classification.algorithm === 'j48' ? 'J48' : an.classification.algorithm === 'nb' ? 'Naive Bayes' : 'Logistic Regression'}</span><span class="badge badge-neutral">Target: ${an.classification.target}</span></div></div>
  <div class="card-body">
    <div class="metric-grid-4">
      ${[['Accuracy', (an.classification.result.accuracy * 100).toFixed(2) + '%'], ['Precision', (an.classification.result.precision * 100).toFixed(2) + '%'], ['Recall', (an.classification.result.recall * 100).toFixed(2) + '%'], ['F1 Score', (an.classification.result.f1 * 100).toFixed(2) + '%']].map(([l, v]) => `<div class="result-metric"><div class="result-metric-val">${v}</div><div class="result-metric-label">${l}</div></div>`).join('')}
    </div>
  </div>
</div>` : ''}

${an.regression.result ? `
<div class="card">
  <div class="card-header"><div class="card-title">Regression Results</div><span class="badge badge-info">${an.regression.algorithm === 'simple' ? 'Simple LR' : 'Multiple LR'}</span></div>
  <div class="card-body">
    <div class="metric-grid-4">
      ${[['MAE', an.regression.result.mae?.toFixed(4)], ['MSE', an.regression.result.mse?.toFixed(4)], ['RMSE', an.regression.result.rmse?.toFixed(4)], ['R²', an.regression.result.r2?.toFixed(4)]].map(([l, v]) => `<div class="result-metric"><div class="result-metric-val">${v}</div><div class="result-metric-label">${l}</div></div>`).join('')}
    </div>
    ${an.regression.result.equation ? `<div class="info-box info mt-12"><code>${Helpers.escapeHtml(an.regression.result.equation)}</code></div>` : ''}
  </div>
</div>` : ''}

${an.clustering.result ? `
<div class="card">
  <div class="card-header"><div class="card-title">Clustering Results</div><span class="badge badge-info">K-Means (K=${an.clustering.k})</span></div>
  <div class="card-body">
    <div class="metric-grid-3">
      ${[['Clusters', an.clustering.k], ['Silhouette Score', an.clustering.result.silhouette?.toFixed(4)], ['Total Points', an.clustering.result.totalPoints?.toLocaleString()]].map(([l, v]) => `<div class="result-metric"><div class="result-metric-val">${v}</div><div class="result-metric-label">${l}</div></div>`).join('')}
    </div>
  </div>
</div>` : ''}

${an.association.result ? `
<div class="card">
  <div class="card-header"><div class="card-title">Association Rules Results</div><span class="badge badge-info">${an.association.algorithm === 'fpgrowth' ? 'FP-Growth' : 'Apriori'}</span></div>
  <div class="card-body">
    <div class="metric-grid-3">
      ${[['Frequent Itemsets', an.association.result.itemsetCount], ['Rules Generated', an.association.result.ruleCount], ['Min Support', (an.association.parameters.minSupport * 100).toFixed(0) + '%']].map(([l, v]) => `<div class="result-metric"><div class="result-metric-val">${v}</div><div class="result-metric-label">${l}</div></div>`).join('')}
    </div>
  </div>
</div>` : ''}
</div>`}`;
    },
    init() { }
  },

  // ── EXPORT REPORT ─────────────────────────────────────────────

  exportReport: {
    render() {
      return `
<div class="page-header">
  <div><h1 class="page-title">Export Report</h1><p class="page-subtitle">Generate a professional report of your data mining analysis.</p></div>
</div>

<div class="grid-2">
  <div>
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Report Sections</div></div>
      <div class="card-body">
        <div class="checkbox-group">
          ${[['sec-overview', 'datasetOverview', 'Dataset Overview'], ['sec-attr', 'attributeDetection', 'Attribute Detection'], ['sec-quality', 'dataQuality', 'Data Quality'], ['sec-pre', 'preprocessing', 'Preprocessing Summary'], ['sec-algo', 'algorithmConfig', 'Algorithm Configuration'], ['sec-results', 'results', 'Model Results'], ['sec-comp', 'modelComparison', 'Model Comparison'], ['sec-conc', 'conclusion', 'Conclusion']].map(([id, key, label]) => `
          <label class="checkbox-item"><input type="checkbox" id="${id}" data-key="${key}" checked> ${label}</label>`).join('')}
        </div>
      </div>
    </div>
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Export Format</div></div>
      <div class="card-body">
        <div class="radio-group" id="export-fmt">
          ${[['pdf', 'PDF Document', 'Academic-style PDF report'], ['excel', 'Excel Workbook', 'Metrics and tables as spreadsheet'], ['csv', 'CSV Files', 'Results as comma-separated files']].map(([v, l, d]) => `
          <label class="radio-option ${v === 'pdf' ? 'selected' : ''}" onclick="selectRadio('export-fmt',this)">
            <input type="radio" name="fmt" value="${v}" ${v === 'pdf' ? 'checked' : ''}> <div class="radio-option-content"><div class="radio-option-title">${l}</div><div class="radio-option-desc">${d}</div></div>
          </label>`).join('')}
        </div>
      </div>
    </div>
    <button class="btn btn-primary btn-lg w-full" onclick="generateReport()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Generate Report
    </button>
  </div>

  <div>
    <div class="card">
      <div class="card-header"><div class="card-title">Report Preview</div></div>
      <div id="report-preview-container" style="max-height:600px;overflow-y:auto;padding:8px">
        <div class="state-container"><div class="state-title">Click "Generate Report" to preview</div></div>
      </div>
    </div>
  </div>
</div>`;
    },
    init() { }
  },

  // ── SETTINGS ──────────────────────────────────────────────────

  settings: {
    render() {
      const s = Storage.getSettings();
      return `
<div class="page-header">
  <div><h1 class="page-title">Settings</h1><p class="page-subtitle">Configure application preferences and defaults.</p></div>
  <div class="page-actions"><button class="btn btn-primary" onclick="saveSettings()">Save Settings</button></div>
</div>

<div style="max-width:640px;display:flex;flex-direction:column;gap:16px">

  <div class="card">
    <div class="card-header"><div class="card-title">Appearance</div></div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">Theme</label>
        <select class="form-select" disabled><option>Light Theme (Default)</option></select>
        <span class="form-label-sub">DataMine Studio uses a professional light theme for optimal readability.</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div class="card-title">Dataset</div></div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">Maximum File Size (MB)</label><input class="form-input" type="number" id="s-maxsize" value="${s.maxFileSizeMB || 100}" min="1" max="500"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div class="card-title">Analysis Defaults</div></div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">Default Train/Test Split</label>
        <select class="form-select" id="s-split">
          ${[['0.7', '70% / 30%'], ['0.75', '75% / 25% (Default)'], ['0.8', '80% / 20%']].map(([v, l]) => `<option value="${v}" ${Math.abs(s.defaultSplit - +v) < 0.01 ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Random State (Seed)</label><input class="form-input" type="number" id="s-seed" value="${s.randomState || 42}"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div class="card-title">Preprocessing Defaults</div></div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">Default Missing Value Handling</label>
        <select class="form-select" id="s-missing">
          ${[['mean', 'Mean Imputation'], ['median', 'Median Imputation'], ['mode', 'Mode Imputation'], ['remove', 'Remove Rows']].map(([v, l]) => `<option value="${v}" ${s.missingDefault === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Default Encoding</label>
        <select class="form-select" id="s-encoding">
          ${[['none', 'None'], ['label', 'Label Encoding'], ['onehot', 'One-Hot Encoding']].map(([v, l]) => `<option value="${v}" ${s.encodingDefault === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Default Scaling</label>
        <select class="form-select" id="s-scaling">
          ${[['none', 'None'], ['standard', 'Standardization'], ['minmax', 'Min-Max Normalization']].map(([v, l]) => `<option value="${v}" ${s.scalingDefault === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div class="card-title">Data Management</div></div>
    <div class="card-body">
      <div class="flex gap-10">
        <button class="btn btn-danger" onclick="if(confirm('Clear upload history?')){Storage.clearHistory();AppState.uploadHistory=[];toast('success','History Cleared')}">Clear Upload History</button>
        <button class="btn btn-danger" onclick="if(confirm('Reset all settings to defaults?')){Storage.clear();location.reload()}">Reset All Settings</button>
      </div>
    </div>
  </div>

</div>`;
    },
    init() { }
  }
};

// ══════════════════════════════════════════════════════════════
// GLOBAL ACTION HANDLERS
// ══════════════════════════════════════════════════════════════

function selectRadio(groupId, el) {
  document.querySelectorAll(`#${groupId} .radio-option`).forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
}

function selectAlgo(algo, el) {
  AppState.analysis.classification.algorithm = algo;
  document.querySelectorAll('.algo-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const params = document.getElementById('algo-params');
  if (params) params.innerHTML = Pages.classification._renderParams(algo, AppState.analysis.classification.parameters);
}

function updateRole(col, role) { AppState.detection.roles[col] = role; }

function updateFeatureList(containerId, excludeCol) {
  AppState.analysis.classification.features = AppState.dataset.columns.filter(c => c !== excludeCol && AppState.dataset.schema[c]?.role !== 'identifier');
}

function toggleFeature(prefix, el, col) {
  const key = prefix === 'cl' ? 'clustering' : 'regression';
  const feats = AppState.analysis[key].features;
  if (el.checked) { if (!feats.includes(col)) feats.push(col); }
  else { const idx = feats.indexOf(col); if (idx > -1) feats.splice(idx, 1); }
}

function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['clf-tab', 'reg-tab', 'assoc-tab'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== tabId);
  });
}

function deleteHistory(id) {
  AppState.uploadHistory = AppState.uploadHistory.filter(h => h.id !== id);
  Storage.removeFromHistory(id);
  Router.navigate('import');
}

function showSampleModal() {
  const m = document.getElementById('sample-modal');
  if (m) m.classList.remove('hidden');
}

function saveSettings() {
  const s = {
    maxFileSizeMB: +(document.getElementById('s-maxsize')?.value || 100),
    defaultSplit: +(document.getElementById('s-split')?.value || 0.75),
    randomState: +(document.getElementById('s-seed')?.value || 42),
    missingDefault: document.getElementById('s-missing')?.value || 'mean',
    encodingDefault: document.getElementById('s-encoding')?.value || 'label',
    scalingDefault: document.getElementById('s-scaling')?.value || 'none',
    theme: 'light'
  };
  Storage.saveSettings(s);
  AppState.settings = s;
  toast('success', 'Settings Saved', 'Your preferences have been saved.');
}

// ══════════════════════════════════════════════════════════════
// PREPROCESSING
// ══════════════════════════════════════════════════════════════

function applyPreprocessing() {
  const ds = AppState.dataset;
  if (!ds.loaded) { toast('error', 'No Dataset', 'Please upload a dataset first.'); return; }
  if (!confirm('Apply preprocessing to the dataset? This will modify the working data.')) return;

  const cfg = AppState.preprocessing.config;
  const beforeStats = { rows: ds.rowCount, missing: AppState.summary?.missingTotal || 0, dupes: AppState.summary?.duplicates || 0, cols: ds.columnCount };

  try {
    const { data, columns, log } = Preprocessing.apply(ds.rawData, ds.columns, ds.schema, {
      ...cfg,
      ignoreColumns: Object.entries(AppState.detection.roles).filter(([, r]) => r === 'ignore').map(([c]) => c)
    });

    ds.processedData = data;
    AppState.preprocessing.applied = true;
    AppState.preprocessing.beforeStats = beforeStats;
    AppState.preprocessing.afterStats = {
      rows: data.length,
      missing: Statistics.missingMap(data, columns) ? Object.values(Statistics.missingMap(data, columns)).reduce((a, b) => a + b, 0) : 0,
      dupes: Statistics.countDuplicates(data, columns),
      cols: columns.length
    };
    AppState.preprocessing.log = log;
    AppState.preprocessing.resultColumns = columns;

    toast('success', 'Preprocessing Applied', log.join(' '));
    Router.navigate('preprocessing');
  } catch (err) { toast('error', 'Preprocessing Error', err.message); }
}

// ══════════════════════════════════════════════════════════════
// CLASSIFICATION
// ══════════════════════════════════════════════════════════════

function runClassification() {
  const ds = AppState.dataset;
  const ca = AppState.analysis.classification;
  if (!ds.loaded) { toast('error', 'No Dataset'); return; }
  if (!ca.target) { toast('warning', 'No Target', 'Please select a target attribute.'); return; }

  const check = Validation.checkClassification(ca.target, ds.schema);
  if (!check.ok) { toast('error', 'Incompatible Target', check.errors[0]); return; }
  check.warnings.forEach(w => toast('warning', 'Warning', w));

  toast('info', 'Training...', `Running ${ca.algorithm === 'j48' ? 'J48' : ca.algorithm === 'nb' ? 'Naive Bayes' : 'Logistic Regression'}...`);

  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const features = ca.features.filter(f => f !== ca.target && data[0] && f in data[0]);
      if (!features.length) { toast('error', 'No Features', 'No valid feature columns selected.'); return; }

      const { train, test } = Helpers.trainTestSplit(data, AppState.preprocessing.config.trainTestSplit, 42);
      const { X: Xtrain, y: ytrain } = Preprocessing.extractXY(train, features, ca.target);
      const { X: Xtest, y: ytest } = Preprocessing.extractXY(test, features, ca.target);

      const { yEncoded: ytrainEnc, classes, revMap } = Preprocessing.encodeLabels(ytrain);
      const { yEncoded: ytestEnc } = Preprocessing.encodeLabels(ytest);

      let model, predicted, featureImportance;

      if (ca.algorithm === 'j48') {
        model = Object.create(J48);
        model.train(Xtrain, ytrainEnc, features, ca.parameters);
        const predEnc = model.predict(Xtest);
        predicted = predEnc.map(e => revMap[e] ?? String(e));
        featureImportance = model.getFeatureImportance();
      } else if (ca.algorithm === 'nb') {
        model = Object.create(NaiveBayes);
        model.train(Xtrain, ytrainEnc, ca.parameters);
        const predEnc = model.predict(Xtest);
        predicted = predEnc.map(e => revMap[e] ?? String(e));
      } else {
        model = Object.create(LogisticRegression);
        model.train(Xtrain, ytrainEnc, ca.parameters);
        const predEnc = model.predict(Xtest);
        predicted = predEnc.map(e => revMap[e] ?? String(e));
      }

      const actual = ytest.map(v => String(v));
      const strClasses = classes.map(c => revMap[c] ?? String(c));
      const report = Metrics.classificationReport(actual, predicted, strClasses);

      ca.result = {
        ...report,
        predictions: actual.map((a, i) => ({ actual: a, predicted: predicted[i] })),
        featureImportance,
        algorithm: ca.algorithm,
        trainSize: train.length, testSize: test.length
      };

      toast('success', 'Classification Complete', `Accuracy: ${(report.accuracy * 100).toFixed(2)}%`);
      Router.navigate('classification');
    } catch (err) { toast('error', 'Error', err.message); console.error(err); }
  }, 100);
}

// ══════════════════════════════════════════════════════════════
// REGRESSION
// ══════════════════════════════════════════════════════════════

function runRegression() {
  const ds = AppState.dataset;
  const ra = AppState.analysis.regression;
  if (!ds.loaded) { toast('error', 'No Dataset'); return; }
  if (!ra.target) { toast('warning', 'No Target', 'Please select a numerical target attribute.'); return; }

  const check = Validation.checkRegression(ra.target, ds.schema);
  if (!check.ok) { toast('error', 'Invalid Target', check.errors[0]); return; }

  const features = ra.features.filter(f => f !== ra.target);
  if (!features.length) { toast('warning', 'No Features', 'Please select at least one feature.'); return; }

  toast('info', 'Training...', 'Running Regression...');

  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const { train, test } = Helpers.trainTestSplit(data, AppState.preprocessing.config.trainTestSplit, 42);

      const { X: Xtrain, y: ytrain } = Preprocessing.extractXY(train, features, ra.target);
      const { X: Xtest, y: ytest } = Preprocessing.extractXY(test, features, ra.target);
      const ytestNum = ytest.map(Number);

      let model, predicted, equation;

      if (ra.algorithm === 'simple') {
        if (!features[0]) { toast('error', 'No X Feature'); return; }
        model = Object.create(LinearRegression);
        model.train(Xtrain, ytrain.map(Number));
        predicted = model.predict(Xtest);
        equation = model.getEquation(features[0], ra.target);
      } else {
        model = Object.create(MultipleLinearRegression);
        model.train(Xtrain, ytrain.map(Number), features);
        predicted = model.predict(Xtest);
        equation = model.getEquation(ra.target);
      }

      const report = Metrics.regressionReport(ytestNum, predicted);

      ra.result = {
        ...report,
        equation,
        predictions: ytestNum.map((a, i) => ({ actual: a, predicted: predicted[i] })),
        testX: ra.algorithm === 'simple' ? Xtest.map(r => r[0]) : null
      };

      toast('success', 'Regression Complete', `R² = ${report.r2.toFixed(4)}`);
      Router.navigate('regression');
    } catch (err) { toast('error', 'Error', err.message); console.error(err); }
  }, 100);
}

// ══════════════════════════════════════════════════════════════
// CLUSTERING
// ══════════════════════════════════════════════════════════════

function runClustering() {
  const ds = AppState.dataset;
  const cl = AppState.analysis.clustering;
  if (!ds.loaded) { toast('error', 'No Dataset'); return; }

  const features = cl.features.filter(f => f && (ds.schema[f]?.detectedType === 'integer' || ds.schema[f]?.detectedType === 'float'));
  if (!features.length) { toast('error', 'No Numeric Features', 'K-Means requires at least one numerical feature.'); return; }

  toast('info', 'Clustering...', `Running K-Means (K=${cl.k})...`);

  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const { X } = Preprocessing.extractXY(data, features, features[0]);

      const model = Object.create(KMeans);
      model.train(X, { k: cl.k, maxIter: cl.parameters.maxIter || 100, seed: cl.parameters.seed || 42 });

      const labels = model.getLabels();
      const centroids = model.getCentroids();
      const sizes = model.getSizes();

      // Silhouette (on sample for speed)
      const sampleSize = Math.min(200, X.length);
      const sampleIdx = Helpers.range(sampleSize).map(i => Math.floor(i * X.length / sampleSize));
      const sampleX = sampleIdx.map(i => X[i]);
      const sampleLabels = sampleIdx.map(i => labels[i]);
      const silhouette = Metrics.silhouetteScore(sampleX, sampleLabels, cl.k);

      // Elbow (fast, max K=8)
      const elbowData = model.elbow(X.slice(0, Math.min(300, X.length)), Math.min(8, X.length - 1), cl.parameters.seed || 42);

      // 2D projection
      const points2D = features.length >= 2 ? Helpers.pca2D(X.slice(0, Math.min(500, X.length))) : X.slice(0, 500).map(r => [r[0], 0]);
      const labels2D = labels.slice(0, Math.min(500, X.length));

      cl.result = {
        k: cl.k, labels, centroids, sizes, silhouette,
        iterations: cl.parameters.maxIter,
        totalPoints: X.length, elbowData,
        points2D, labels2D: labels.slice(0, points2D.length)
      };

      toast('success', 'Clustering Complete', `${cl.k} clusters | Silhouette: ${silhouette.toFixed(4)}`);
      Router.navigate('clustering');
    } catch (err) { toast('error', 'Error', err.message); console.error(err); }
  }, 100);
}

// ══════════════════════════════════════════════════════════════
// ASSOCIATION RULES
// ══════════════════════════════════════════════════════════════

function parseTransactions(data, col) {
  return data.map(r => {
    const val = String(r[col] ?? '').trim();
    const items = val.includes('|') ? val.split('|') : val.split(',');
    return new Set(items.map(i => i.trim()).filter(i => i));
  }).filter(t => t.size > 0);
}

function runFrequentItemsets() {
  const ds = AppState.dataset;
  const aa = AppState.analysis.association;
  if (!ds.loaded) { toast('error', 'No Dataset'); return; }
  if (!aa.transactionColumn) { toast('warning', 'No Column', 'Please select a transaction column.'); return; }

  toast('info', 'Mining...', 'Generating frequent itemsets...');
  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const transactions = parseTransactions(data, aa.transactionColumn);
      if (!transactions.length) { toast('error', 'No Transactions', 'No valid transaction data found.'); return; }

      const algo = aa.algorithm === 'fpgrowth' ? Object.create(FPGrowth) : Object.create(Apriori);
      algo.run(transactions, aa.parameters);

      aa.itemsets = algo.getItemsets();
      aa.result = { itemsetCount: aa.itemsets.length, ruleCount: 0, algorithm: aa.algorithm };
      aa.rules = [];

      toast('success', 'Itemsets Generated', `${aa.itemsets.length} frequent itemsets found.`);
      Router.navigate('association');
    } catch (err) { toast('error', 'Error', err.message); console.error(err); }
  }, 100);
}

function runAssociationRules() {
  const aa = AppState.analysis.association;
  const ds = AppState.dataset;
  if (!aa.itemsets?.length) { toast('warning', 'No Itemsets', 'Generate frequent itemsets first.'); return; }

  toast('info', 'Generating Rules...', '');
  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const transactions = parseTransactions(data, aa.transactionColumn);
      const algo = aa.algorithm === 'fpgrowth' ? Object.create(FPGrowth) : Object.create(Apriori);
      algo._transactions = transactions;
      algo._n = transactions.length;
      algo._itemsets = aa.itemsets;

      algo.generateRules(aa.parameters);
      aa.rules = algo.getRules();
      aa.result.ruleCount = aa.rules.length;

      toast('success', 'Rules Generated', `${aa.rules.length} association rules generated.`);
      Router.navigate('association');
    } catch (err) { toast('error', 'Error', err.message); console.error(err); }
  }, 100);
}

// ══════════════════════════════════════════════════════════════
// MODEL COMPARISON
// ══════════════════════════════════════════════════════════════

function runAllClassification() {
  const ds = AppState.dataset;
  const ca = AppState.analysis.classification;
  if (!ds.loaded || !ca.target) { toast('warning', 'Setup Required', 'Configure classification target first.'); return; }

  toast('info', 'Running All Models...', 'This may take a moment.');
  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const features = ca.features.filter(f => f !== ca.target && data[0] && f in data[0]);
      const { train, test } = Helpers.trainTestSplit(data, 0.75, 42);
      const { X: Xtrain, y: ytrain } = Preprocessing.extractXY(train, features, ca.target);
      const { X: Xtest, y: ytest } = Preprocessing.extractXY(test, features, ca.target);
      const { yEncoded: ytrainEnc, classes, revMap } = Preprocessing.encodeLabels(ytrain);

      const results = [];
      for (const [name, key] of [['J48 Decision Tree', 'j48'], ['Naive Bayes', 'nb'], ['Logistic Regression', 'lr']]) {
        const t0 = performance.now();
        let model;
        if (key === 'j48') { model = Object.create(J48); model.train(Xtrain, ytrainEnc, features, ca.parameters); }
        else if (key === 'nb') { model = Object.create(NaiveBayes); model.train(Xtrain, ytrainEnc, ca.parameters); }
        else { model = Object.create(LogisticRegression); model.train(Xtrain, ytrainEnc, ca.parameters); }
        const predEnc = model.predict(Xtest);
        const predicted = predEnc.map(e => revMap[e] ?? String(e));
        const actual = ytest.map(String);
        const r = Metrics.classificationReport(actual, predicted, classes.map(c => revMap[c] ?? String(c)));
        const t1 = performance.now();
        results.push({ Algorithm: name, Accuracy: (r.accuracy * 100).toFixed(2) + '%', Precision: (r.precision * 100).toFixed(2) + '%', Recall: (r.recall * 100).toFixed(2) + '%', 'F1 Score': (r.f1 * 100).toFixed(2) + '%', 'Training Time': (t1 - t0).toFixed(1) + 'ms', _raw: r });
      }

      const tbody = document.getElementById('clf-comp-body');
      if (tbody) tbody.innerHTML = results.map(r => `<tr>${Object.entries(r).filter(([k]) => !k.startsWith('_')).map(([, v]) => `<td>${v}</td>`).join('')}</tr>`).join('');

      // Chart
      Charts.bar('clf-comp-chart',
        ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
        results.map(r => ({ label: r.Algorithm, data: [r._raw.accuracy * 100, r._raw.precision * 100, r._raw.recall * 100, r._raw.f1 * 100] }))
      );
      toast('success', 'Comparison Complete');
    } catch (err) { toast('error', 'Error', err.message); }
  }, 100);
}

function runAllRegression() {
  const ds = AppState.dataset;
  const ra = AppState.analysis.regression;
  if (!ds.loaded || !ra.target) { toast('warning', 'Setup Required', 'Configure regression target first.'); return; }
  toast('info', 'Running Regression Models...', '');
  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const features = ra.features.filter(f => f !== ra.target);
      if (!features.length) { toast('warning', 'No Features'); return; }
      const { train, test } = Helpers.trainTestSplit(data, 0.75, 42);
      const { X: Xtrain, y: ytrain } = Preprocessing.extractXY(train, features, ra.target);
      const { X: Xtest, y: ytest } = Preprocessing.extractXY(test, features, ra.target);
      const ytestNum = ytest.map(Number);

      const results = [];
      // Simple (first feature only)
      const t0 = performance.now();
      const simpleModel = Object.create(LinearRegression);
      simpleModel.train(Xtrain.map(r => [r[0]]), ytrain.map(Number));
      const simplePred = simpleModel.predict(Xtest.map(r => [r[0]]));
      const simpleR = Metrics.regressionReport(ytestNum, simplePred);
      results.push({ Model: 'Simple Linear Regression', MAE: simpleR.mae.toFixed(4), MSE: simpleR.mse.toFixed(4), RMSE: simpleR.rmse.toFixed(4), 'R²': simpleR.r2.toFixed(4), 'Training Time': (performance.now() - t0).toFixed(1) + 'ms', _raw: simpleR });

      const t1 = performance.now();
      const multiModel = Object.create(MultipleLinearRegression);
      multiModel.train(Xtrain, ytrain.map(Number), features);
      const multiPred = multiModel.predict(Xtest);
      const multiR = Metrics.regressionReport(ytestNum, multiPred);
      results.push({ Model: 'Multiple Linear Regression', MAE: multiR.mae.toFixed(4), MSE: multiR.mse.toFixed(4), RMSE: multiR.rmse.toFixed(4), 'R²': multiR.r2.toFixed(4), 'Training Time': (performance.now() - t1).toFixed(1) + 'ms', _raw: multiR });

      const tbody = document.getElementById('reg-comp-body');
      if (tbody) tbody.innerHTML = results.map(r => `<tr>${Object.entries(r).filter(([k]) => !k.startsWith('_')).map(([, v]) => `<td>${v}</td>`).join('')}</tr>`).join('');

      Charts.bar('reg-comp-chart', ['MAE', 'MSE', 'RMSE', 'R²'], results.map(r => ({ label: r.Model, data: [+r.MAE, +r.MSE, +r.RMSE, +r['R²']] })));
      toast('success', 'Regression Comparison Complete');
    } catch (err) { toast('error', 'Error', err.message); }
  }, 100);
}

function runAssocComparison() {
  const ds = AppState.dataset;
  const aa = AppState.analysis.association;
  if (!ds.loaded || !aa.transactionColumn) { toast('warning', 'Setup Required', 'Configure Association Rules first.'); return; }
  toast('info', 'Comparing Algorithms...', '');
  setTimeout(() => {
    try {
      const data = ds.processedData.length ? ds.processedData : ds.rawData;
      const transactions = parseTransactions(data, aa.transactionColumn);
      const results = [];

      for (const [name, algo] of [['Apriori', Object.create(Apriori)], ['FP-Growth', Object.create(FPGrowth)]]) {
        const t0 = performance.now();
        algo.run(transactions, aa.parameters);
        algo.generateRules(aa.parameters);
        const t1 = performance.now();
        results.push({ Algorithm: name, 'Frequent Itemsets': algo.getItemsets().length, 'Rules Generated': algo.getRules().length, 'Execution Time': (t1 - t0).toFixed(1) + 'ms' });
      }

      const tbody = document.getElementById('assoc-comp-body');
      if (tbody) tbody.innerHTML = results.map(r => `<tr>${Object.values(r).map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
      toast('success', 'Association Comparison Complete');
    } catch (err) { toast('error', 'Error', err.message); }
  }, 100);
}

// ══════════════════════════════════════════════════════════════
// VISUALIZATION HELPERS + ENGINE
// ══════════════════════════════════════════════════════════════

function vizSetType(type) {
  AppState.visualization.chartType = type;
  document.querySelectorAll('.viz-type-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(`'${type}'`)));
  vizApplyTypeUI();
}

function vizApplyTypeUI() {
  const type = AppState.visualization.chartType || 'bar';
  const show = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };

  const cfg = {
    bar: { xh: 'Category column', y: true, agg: true, grp: true, sort: true, topn: true, stack: true },
    line: { xh: 'Any column (used as label)', y: true, agg: false, grp: true, sort: false, topn: false, stack: false },
    scatter: { xh: 'Numeric column (X axis)', y: true, agg: false, grp: true, sort: false, topn: false, stack: false },
    histogram: { xh: 'Numeric column to distribute', y: false, agg: false, grp: false, sort: false, topn: false, stack: false },
    doughnut: { xh: 'Categorical column', y: false, agg: false, grp: false, sort: true, topn: true, stack: false },
    heatmap: { xh: 'Auto — no selection needed', y: false, agg: false, grp: false, sort: false, topn: false, stack: false },
  };
  const c = cfg[type] || cfg.bar;
  const hint = document.getElementById('viz-x-hint');
  if (hint) hint.textContent = c.xh;
  show('viz-y-wrap', c.y);
  show('viz-agg-wrap', c.agg);
  show('viz-group-wrap', c.grp);
  show('viz-sort-wrap', c.sort);
  show('viz-topn-wrap', c.topn);
  show('viz-stack-wrap', c.stack);
}

function _vizAgg(arr, method) {
  const nums = arr.map(Number).filter(v => isFinite(v));
  if (!nums.length) return 0;
  switch (method) {
    case 'sum': return nums.reduce((s, v) => s + v, 0);
    case 'count': return nums.length;
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
    case 'median': { const s = [...nums].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
    default: return nums.reduce((s, v) => s + v, 0) / nums.length; // mean
  }
}

function _vizSort(entries, order) {
  if (order === 'desc') return entries.sort((a, b) => b[1] - a[1]);
  if (order === 'asc') return entries.sort((a, b) => a[1] - b[1]);
  if (order === 'alpha') return entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return entries; // none = original
}

function _vizStats(xCol, yCol, data) {
  const card = document.getElementById('viz-summary-card');
  const body = document.getElementById('viz-summary-body');
  if (!card || !body) return;
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
  if (xCol) {
    const xv = data.map(r => r[xCol]).filter(v => v != null && v !== '');
    const xu = new Set(xv.map(String)).size;
    html += `<div><div style="font-weight:600;margin-bottom:4px">${Helpers.escapeHtml(xCol)}</div>
      <div style="color:var(--text-muted);font-size:12px">Rows: ${xv.length.toLocaleString()}<br>Unique: ${xu.toLocaleString()}</div></div>`;
  }
  if (yCol) {
    const yv = data.map(r => +r[yCol]).filter(v => isFinite(v));
    if (yv.length) {
      const mean = (yv.reduce((s, v) => s + v, 0) / yv.length).toFixed(3);
      html += `<div><div style="font-weight:600;margin-bottom:4px">${Helpers.escapeHtml(yCol)}</div>
        <div style="color:var(--text-muted);font-size:12px">Mean: ${mean}<br>Min: ${Math.min(...yv).toFixed(3)} / Max: ${Math.max(...yv).toFixed(3)}</div></div>`;
    }
  }
  html += '</div>';
  card.style.display = '';
  body.innerHTML = html;
}

function generateVizChart() {
  const ds = AppState.dataset;
  if (!ds.loaded) return;
  const body = document.getElementById('viz-chart-body');
  if (!body) return;

  const viz = AppState.visualization;
  // Sync from DOM to state
  const type = document.getElementById('viz-type')?.value || viz.chartType || 'bar';
  const xCol = document.getElementById('viz-x')?.value || '';
  const yCol = document.getElementById('viz-y')?.value || '';
  const grpCol = document.getElementById('viz-group')?.value || '';
  const agg = document.getElementById('viz-agg')?.value || 'mean';
  const topN = parseInt(document.getElementById('viz-topn')?.value || '15');
  const sort = document.getElementById('viz-sort')?.value || 'desc';
  const stacked = document.getElementById('viz-stack')?.value === 'stacked';
  const limitV = parseInt(document.getElementById('viz-limit')?.value || '1000');

  AppState.visualization = { ...viz, chartType: type, xAxis: xCol, yAxis: yCol, groupBy: grpCol || null, aggregation: agg, topN, sortOrder: sort, stacked, limit: limitV };

  const rawData = ds.rawData;
  const data = limitV > 0 ? rawData.slice(0, limitV) : rawData;

  // Update badge + label
  const badge = document.getElementById('viz-row-badge');
  if (badge) badge.textContent = `${data.length.toLocaleString()} rows`;
  const lbl = document.getElementById('viz-chart-label');
  if (lbl) lbl.textContent = [xCol, yCol].filter(Boolean).join(' × ') + (grpCol ? ` by ${grpCol}` : '') || 'Chart';

  // ── HEATMAP ──────────────────────────────────────────────────
  if (type === 'heatmap') {
    body.innerHTML = '<div id="viz-hm" style="padding:8px;overflow:auto"></div>';
    const nc = ds.columns.filter(c => ds.schema[c]?.detectedType === 'integer' || ds.schema[c]?.detectedType === 'float').slice(0, 10);
    Charts.correlationHeatmap('viz-hm', nc, Statistics.correlationMatrix(rawData, nc));
    document.getElementById('viz-summary-card') && (document.getElementById('viz-summary-card').style.display = 'none');
    return;
  }

  body.innerHTML = '<canvas id="viz-chart-canvas"></canvas>';

  // ── HISTOGRAM ────────────────────────────────────────────────
  if (type === 'histogram') {
    if (!xCol) { toast('warning', 'Select column', 'Pick an X column for Histogram.'); return; }
    Charts.histogram('viz-chart-canvas', data.map(r => r[xCol]), `Distribution of ${xCol}`);
    _vizStats(xCol, null, data); return;
  }

  // ── DONUT / PIE ───────────────────────────────────────────────
  if (type === 'doughnut') {
    if (!xCol) { toast('warning', 'Select column', 'Pick an X column for Donut/Pie.'); return; }
    const freq = {};
    data.forEach(r => { const v = String(r[xCol] ?? '').trim(); freq[v] = (freq[v] || 0) + 1; });
    let entries = Object.entries(freq);
    entries = _vizSort(entries, sort);
    if (topN > 0) entries = entries.slice(0, topN);
    Charts.doughnut('viz-chart-canvas', entries.map(e => e[0]), entries.map(e => e[1]), `${xCol} Distribution`);
    _vizStats(xCol, null, data); return;
  }

  // ── BAR CHART ────────────────────────────────────────────────
  if (type === 'bar') {
    if (!xCol) { toast('warning', 'Select column', 'Pick an X column for Bar chart.'); return; }

    if (grpCol && grpCol !== xCol) {
      // ---- GROUPED BAR (Group By active) ----
      // Build: { groupVal → { xVal → [yVals] } }
      const gmap = {};
      data.forEach(r => {
        const xv = String(r[xCol] ?? '').trim();
        const gv = String(r[grpCol] ?? '').trim();
        if (!gmap[gv]) gmap[gv] = {};
        if (!gmap[gv][xv]) gmap[gv][xv] = [];
        gmap[gv][xv].push(+r[yCol] || 0);
      });

      // Get top X labels by total frequency
      const xFreq = {};
      data.forEach(r => { const v = String(r[xCol] ?? '').trim(); xFreq[v] = (xFreq[v] || 0) + 1; });
      let xEntries = Object.entries(xFreq);
      xEntries = _vizSort(xEntries, sort);
      if (topN > 0) xEntries = xEntries.slice(0, topN);
      const labels = xEntries.map(e => e[0]);

      // Get top 8 groups
      const gFreq = {};
      data.forEach(r => { const v = String(r[grpCol] ?? '').trim(); gFreq[v] = (gFreq[v] || 0) + 1; });
      const topGroups = Object.entries(gFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);

      const datasets = topGroups.map((g, gi) => ({
        label: g,
        data: labels.map(lbl => yCol ? _vizAgg(gmap[g]?.[lbl] || [], agg) : (gmap[g]?.[lbl] || []).length),
        backgroundColor: Helpers.PALETTE[gi % Helpers.PALETTE.length] + 'BB',
        borderColor: Helpers.PALETTE[gi % Helpers.PALETTE.length],
        borderWidth: 1, borderRadius: 3,
      }));

      Charts._create('viz-chart-canvas', {
        type: 'bar',
        data: { labels, datasets },
        options: {
          ...Charts._baseOptions(`${agg} of ${yCol || 'count'} by ${xCol} (grouped by ${grpCol})`),
          scales: {
            ...Charts._baseOptions().scales,
            x: { ...Charts._baseOptions().scales.x, stacked },
            y: { ...Charts._baseOptions().scales.y, stacked }
          }
        }
      });
    } else if (yCol) {
      // ---- SIMPLE AGGREGATED BAR ----
      const buckets = {};
      data.forEach(r => { const k = String(r[xCol] ?? '').trim(); if (!buckets[k]) buckets[k] = []; buckets[k].push(+r[yCol] || 0); });
      let entries = Object.entries(buckets).map(([k, v]) => [k, _vizAgg(v, agg)]);
      entries = _vizSort(entries, sort);
      if (topN > 0) entries = entries.slice(0, topN);
      Charts.bar('viz-chart-canvas', entries.map(e => e[0]), [{ label: `${agg} ${yCol}`, data: entries.map(e => e[1]) }], `${agg} of ${yCol} by ${xCol}`);
    } else {
      // ---- COUNT FREQUENCY BAR ----
      const freq = {};
      data.forEach(r => { const k = String(r[xCol] ?? '').trim(); freq[k] = (freq[k] || 0) + 1; });
      let entries = Object.entries(freq);
      entries = _vizSort(entries, sort);
      if (topN > 0) entries = entries.slice(0, topN);
      Charts.bar('viz-chart-canvas', entries.map(e => e[0]), [{ label: 'Count', data: entries.map(e => e[1]) }], `Frequency of ${xCol}`);
    }
    _vizStats(xCol, yCol || null, data); return;
  }

  // ── SCATTER ───────────────────────────────────────────────────
  if (type === 'scatter') {
    if (!xCol || !yCol) { toast('warning', 'Select columns', 'Scatter needs both X and Y numeric columns.'); return; }
    if (grpCol) {
      const gmap = {};
      data.forEach(r => {
        const gv = String(r[grpCol] ?? '').trim();
        const pt = { x: +r[xCol], y: +r[yCol] };
        if (isFinite(pt.x) && isFinite(pt.y)) { if (!gmap[gv]) gmap[gv] = []; gmap[gv].push(pt); }
      });
      const topG = Object.keys(gmap).sort((a, b) => gmap[b].length - gmap[a].length).slice(0, 8);
      Charts.scatter('viz-chart-canvas', topG.map((g, i) => ({
        label: g, data: gmap[g],
        backgroundColor: Helpers.PALETTE[i % Helpers.PALETTE.length] + '99',
        borderColor: Helpers.PALETTE[i % Helpers.PALETTE.length],
        pointRadius: 3
      })), `${xCol} vs ${yCol} (by ${grpCol})`);
    } else {
      const pts = data.map(r => ({ x: +r[xCol], y: +r[yCol] })).filter(p => isFinite(p.x) && isFinite(p.y));
      Charts.scatter('viz-chart-canvas', [{ label: `${xCol} vs ${yCol}`, data: pts }], `${xCol} vs ${yCol}`);
    }
    _vizStats(xCol, yCol, data); return;
  }

  // ── LINE CHART ────────────────────────────────────────────────
  if (type === 'line') {
    if (!yCol) { toast('warning', 'Select column', 'Pick a Y column for Line chart.'); return; }
    if (grpCol) {
      const gmap = {};
      data.forEach(r => { const gv = String(r[grpCol] ?? '').trim(); if (!gmap[gv]) gmap[gv] = []; gmap[gv].push(r); });
      const topG = Object.keys(gmap).sort((a, b) => gmap[b].length - gmap[a].length).slice(0, 6);
      const sliceN = Math.min(200, data.length);
      const labels = xCol ? data.slice(0, sliceN).map(r => String(r[xCol] ?? '').trim()) : [...Array(sliceN).keys()];
      const datasets = topG.map((g, i) => {
        const rows = gmap[g].slice(0, sliceN);
        return {
          label: g, data: rows.map(r => +r[yCol] || 0),
          borderColor: Helpers.PALETTE[i % Helpers.PALETTE.length],
          backgroundColor: Helpers.PALETTE[i % Helpers.PALETTE.length] + '22',
          pointRadius: 2, tension: 0.3, fill: false
        };
      });
      Charts.line('viz-chart-canvas', labels, datasets, `${yCol} by ${grpCol}`);
    } else {
      const sliced = data.slice(0, 200);
      const labels = xCol ? sliced.map(r => String(r[xCol] ?? '').trim()) : sliced.map((_, i) => i);
      Charts.line('viz-chart-canvas', labels, [{ label: yCol, data: sliced.map(r => +r[yCol] || 0) }], yCol);
    }
    _vizStats(xCol || null, yCol, data); return;
  }

  toast('warning', 'Select columns', 'Select a chart type and required columns.');
}

// ══════════════════════════════════════════════════════════════
// REPORT
// ══════════════════════════════════════════════════════════════

function generateReport() {
  try {
    const sections = {};
    document.querySelectorAll('[data-key]').forEach(el => { sections[el.dataset.key] = el.checked; });
    const html = ReportGenerator.buildHTML(AppState, sections);
    const container = document.getElementById('report-preview-container');
    if (container) container.innerHTML = html;

    const fmt = document.querySelector('input[name="fmt"]:checked')?.value || 'pdf';
    if (fmt === 'pdf') {
      setTimeout(() => Export.downloadPDF('report-preview', 'DataMineStudio_Report.pdf'), 500);
      toast('success', 'Report Generated', 'PDF report export initiated.');
    } else if (fmt === 'excel') {
      const rows = [];
      if (AppState.dataset.loaded) rows.push({ Section: 'Dataset', Value: AppState.dataset.filename });
      if (AppState.analysis.classification.result) {
        const r = AppState.analysis.classification.result;
        ['accuracy', 'precision', 'recall', 'f1'].forEach(m => rows.push({ Section: 'Classification', Metric: m, Value: (r[m] * 100).toFixed(2) + '%' }));
      }
      Export.downloadExcel([{ name: 'Report', rows }], 'DataMineStudio_Report.xlsx');
      toast('success', 'Report Generated', 'Excel report downloaded.');
    } else {
      Export.downloadCSV([{ Report: 'DataMine Studio Report', Date: new Date().toISOString() }], 'report.csv');
      toast('success', 'Report Generated', 'CSV report downloaded.');
    }
  } catch (err) {
    console.error('Error generating report:', err);
    toast('danger', 'Report Generation Failed', err.message || 'An error occurred while generating the report.');
  }
}

// ══════════════════════════════════════════════════════════════
// SVG ICON HELPER
// ══════════════════════════════════════════════════════════════

function svgPath(name) {
  const paths = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    'git-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    'share-2': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    'bar-chart-2': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    'bar-chart': '<rect x="2" y="14" width="4" height="6" rx="1"/><rect x="9" y="8" width="4" height="12" rx="1"/><rect x="16" y="2" width="4" height="18" rx="1"/>',
    crosshair: '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    'pie-chart': '<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>',
    'clipboard-list': '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>',
    'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    'settings-2': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'
  };
  return paths[name] || '';
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════

function buildSidebar() {
  const nav = [
    { section: 'WORKSPACE' },
    { page: 'dashboard', label: 'Dashboard', icon: 'home' },
    { page: 'import', label: 'Import Dataset', icon: 'upload' },
    { page: 'overview', label: 'Dataset Overview', icon: 'table' },
    { page: 'detection', label: 'Attribute Detection', icon: 'search' },
    { page: 'preprocessing', label: 'Preprocessing', icon: 'settings' },
    { section: 'DATA MINING' },
    { page: 'classification', label: 'Classification', icon: 'git-branch' },
    { page: 'regression', label: 'Regression', icon: 'trending-up' },
    { page: 'clustering', label: 'Clustering', icon: 'circle-dot' },
    { page: 'association', label: 'Association Rules', icon: 'share-2' },
    { section: 'ANALYSIS' },
    { page: 'comparison', label: 'Model Comparison', icon: 'bar-chart-2' },
    { page: 'visualization', label: 'Visualization', icon: 'pie-chart' },
    { page: 'results', label: 'Results', icon: 'clipboard-list' },
    { section: 'REPORT' },
    { page: 'report', label: 'Export Report', icon: 'file-text' }
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = `
  <div class="sidebar-brand">
    <div class="brand-logo">
      <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 20 22 20"/></svg>
    </div>
    <div class="brand-text"><div class="brand-title">DataMine Studio</div><div class="brand-sub">Universal Data Mining</div></div>
  </div>
  <nav class="sidebar-nav">`;

  nav.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      html += `<div class="nav-item" data-page="${item.page}" onclick="Router.navigate('${item.page}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${svgPath(item.icon)}</svg>
        ${item.label}
      </div>`;
    }
  });

  html += `</nav>
  <div class="sidebar-footer">
    <div class="dataset-footer" onclick="Router.navigate('import')">
      <div style="width:30px;height:30px;border-radius:6px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:8px">
        <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <div class="dataset-footer-label">Dataset</div>
        <div id="footer-dataset-name" class="dataset-footer-name">No dataset loaded</div>
      </div>
      <div id="footer-dot" class="dataset-footer-dot"></div>
    </div>
    <div class="nav-item" data-page="settings" onclick="Router.navigate('settings')">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${svgPath('settings-2')}</svg>
      Settings
    </div>
  </div>`;

  sidebar.innerHTML = html;
}

function buildHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  header.innerHTML = `
  <div class="header-left">
    <div class="header-page-title" id="header-page-title">Dashboard</div>
    <div class="header-breadcrumb" id="header-breadcrumb">
      <span onclick="Router.navigate('dashboard')" style="cursor:pointer;color:var(--teal)">Home</span>
      <span class="breadcrumb-sep"> › </span>
      <span>Dashboard</span>
    </div>
  </div>
  <div class="header-search">
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <input placeholder="Search..." id="global-search" onkeydown="if(event.key==='Enter')globalSearch(this.value)">
  </div>
  <div id="dataset-badge" class="header-dataset-badge" onclick="Router.navigate('import')">
    <span id="badge-dot" class="badge-dot"></span> Dataset: No dataset loaded
  </div>
  <button class="header-icon-btn" title="Help" onclick="showHelp()">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  </button>
  <button class="header-icon-btn" title="Notifications">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
  </button>
  <div class="profile-btn" onclick="Router.navigate('settings')">
    <div class="profile-avatar">A</div>
    <span>Analyst</span>
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
  </div>`;
}

function globalSearch(q) {
  if (!q.trim()) return;
  const q2 = q.toLowerCase();
  const pageMap = { dashboard: 'dashboard', import: 'import', overview: 'overview', detection: 'detection', preprocessing: 'preprocessing', classification: 'classification', regression: 'regression', clustering: 'clustering', association: 'association', comparison: 'comparison', visualization: 'visualization', results: 'results', report: 'report', settings: 'settings' };
  for (const [key, page] of Object.entries(pageMap)) {
    if (key.includes(q2) || page.includes(q2)) { Router.navigate(page); return; }
  }
}

function showHelp() {
  toast('info', 'DataMine Studio Help',
    'Upload a CSV/XLSX dataset → Detect attributes → Preprocess → Choose a mining task → Run analysis → Compare models → Export report.');
}

document.addEventListener('DOMContentLoaded', () => {
  AppState.uploadHistory = Storage.getHistory();
  AppState.settings = Storage.getSettings();

  buildSidebar();
  buildHeader();
  Router.navigate('dashboard');
});
