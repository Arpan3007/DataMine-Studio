// utils/helpers.js — Utility functions

const Helpers = {

  // ── Array & Object ──────────────────────────────────────────

  range(n) { return Array.from({ length: n }, (_, i) => i); },

  shuffle(arr, seed = 42) {
    // Seeded Fisher-Yates shuffle (deterministic)
    const a = [...arr];
    let s = seed;
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  unique(arr) { return [...new Set(arr)]; },

  groupBy(arr, key) {
    return arr.reduce((g, item) => {
      const k = item[key];
      (g[k] = g[k] || []).push(item);
      return g;
    }, {});
  },

  flatten(arr) { return arr.flat(Infinity); },

  zip(...arrays) {
    const len = Math.min(...arrays.map(a => a.length));
    return Array.from({ length: len }, (_, i) => arrays.map(a => a[i]));
  },

  // ── Math ────────────────────────────────────────────────────

  sum(arr) { return arr.reduce((s, v) => s + (isFinite(v) ? v : 0), 0); },
  mean(arr) { return arr.length ? this.sum(arr) / arr.length : 0; },
  median(arr) {
    const s = [...arr].filter(v => isFinite(v)).sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
  mode(arr) {
    const freq = {};
    arr.forEach(v => { if (v !== null && v !== undefined && v !== '') freq[v] = (freq[v] || 0) + 1; });
    let best = null, bestCount = 0;
    for (const [v, c] of Object.entries(freq)) { if (c > bestCount) { best = v; bestCount = c; } }
    return best;
  },
  variance(arr) {
    const m = this.mean(arr);
    return this.mean(arr.map(v => (v - m) ** 2));
  },
  std(arr) { return Math.sqrt(this.variance(arr)); },
  min(arr) { return Math.min(...arr.filter(isFinite)); },
  max(arr) { return Math.max(...arr.filter(isFinite)); },

  dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); },

  // Matrix multiply A(m×k) × B(k×n) → C(m×n)
  matMul(A, B) {
    return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
  },

  // Matrix transpose
  transpose(M) { return M[0].map((_, j) => M.map(row => row[j])); },

  // Determinant (Gaussian elimination)
  det(M) {
    const n = M.length;
    const a = M.map(r => [...r]);
    let det = 1;
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
      if (pivot !== col) { [a[col], a[pivot]] = [a[pivot], a[col]]; det *= -1; }
      if (Math.abs(a[col][col]) < 1e-12) return 0;
      det *= a[col][col];
      for (let r = col + 1; r < n; r++) {
        const f = a[r][col] / a[col][col];
        for (let c = col; c < n; c++) a[r][c] -= f * a[col][c];
      }
    }
    return det;
  },

  // Matrix inverse via Gauss-Jordan
  matInv(M) {
    const n = M.length;
    const a = M.map((r, i) => [...r, ...Array(n).fill(0).map((_, j) => +(i === j))]);
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
      if (pivot !== col) [a[col], a[pivot]] = [a[pivot], a[col]];
      const f = a[col][col];
      if (Math.abs(f) < 1e-12) return null; // singular
      for (let c = 0; c < 2 * n; c++) a[col][c] /= f;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const k = a[r][col];
        for (let c = 0; c < 2 * n; c++) a[r][c] -= k * a[col][c];
      }
    }
    return a.map(r => r.slice(n));
  },

  sigmoid(z) { return 1 / (1 + Math.exp(-z)); },
  log(x) { return Math.log(Math.max(x, 1e-15)); },

  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },

  // ── String ──────────────────────────────────────────────────

  capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; },

  truncate(s, n = 30) { return s.length > n ? s.slice(0, n) + '…' : s; },

  formatNum(n, decimals = 2) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return (+n).toFixed(decimals);
  },

  formatPct(n, decimals = 1) { return this.formatNum(n * 100, decimals) + '%'; },

  formatCount(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return '' + n;
  },

  formatDate(d = new Date()) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  },

  escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── DOM ─────────────────────────────────────────────────────

  el(id) { return document.getElementById(id); },
  qs(sel, ctx = document) { return ctx.querySelector(sel); },
  qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  html(id, content) { const e = this.el(id); if (e) e.innerHTML = content; },

  // ── Splitting ────────────────────────────────────────────────

  trainTestSplit(data, ratio = 0.75, seed = 42) {
    const shuffled = this.shuffle(data, seed);
    const trainN = Math.floor(shuffled.length * ratio);
    return { train: shuffled.slice(0, trainN), test: shuffled.slice(trainN) };
  },

  // ── Color ───────────────────────────────────────────────────

  PALETTE: [
    '#168C8C', '#173B57', '#D99A2B', '#2E7D5B', '#C94C4C',
    '#6366f1', '#0891b2', '#d97706', '#059669', '#dc2626',
    '#7c3aed', '#0284c7', '#b45309', '#047857', '#b91c1c'
  ],

  colorFor(i) { return this.PALETTE[i % this.PALETTE.length]; },

  // ── Number coerce ────────────────────────────────────────────

  isNumeric(v) {
    if (v === null || v === undefined || v === '') return false;
    return !isNaN(Number(v));
  },

  toNum(v, fallback = NaN) {
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  },

  // ── PCA lite (2 components via covariance) for scatter ───────

  pca2D(data) {
    // data: array of number arrays (rows × features)
    if (!data || !data.length || data[0].length < 2) return data.map(r => [r[0] || 0, r[1] || 0]);
    const n = data.length, m = data[0].length;
    const means = Array(m).fill(0).map((_, j) => this.mean(data.map(r => r[j])));
    const centered = data.map(r => r.map((v, j) => v - means[j]));
    // power iteration for 2 PCs
    const pc = (seed) => {
      let v = Array(m).fill(0).map((_, i) => (i === seed) ? 1 : 0);
      for (let iter = 0; iter < 30; iter++) {
        const newV = Array(m).fill(0);
        for (const row of centered) {
          const proj = this.dot(row, v);
          for (let j = 0; j < m; j++) newV[j] += proj * row[j];
        }
        const norm = Math.sqrt(this.dot(newV, newV)) || 1;
        v = newV.map(x => x / norm);
      }
      return v;
    };
    const pc1 = pc(0), pc2 = pc(1);
    return centered.map(r => [this.dot(r, pc1), this.dot(r, pc2)]);
  }
};
