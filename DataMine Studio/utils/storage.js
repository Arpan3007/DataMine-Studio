// utils/storage.js — localStorage / sessionStorage helpers

const Storage = {

  PREFIX: 'dms_',

  // ── localStorage (settings, history) ────────────────────────

  set(key, value) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(value)); }
    catch (e) { console.warn('Storage.set failed:', e); }
  },

  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  },

  remove(key) { localStorage.removeItem(this.PREFIX + key); },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  // ── sessionStorage (current dataset — cleared on tab close) ──

  setSession(key, value) {
    try { sessionStorage.setItem(this.PREFIX + key, JSON.stringify(value)); }
    catch (e) { console.warn('sessionStorage.set failed:', e); }
  },

  getSession(key, fallback = null) {
    try {
      const v = sessionStorage.getItem(this.PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  },

  removeSession(key) { sessionStorage.removeItem(this.PREFIX + key); },

  // ── Typed helpers ────────────────────────────────────────────

  getSettings() {
    return this.get('settings', {
      maxFileSizeMB: 100,
      defaultSplit: 0.75,
      randomState: 42,
      missingDefault: 'mean',
      encodingDefault: 'label',
      scalingDefault: 'none',
      defaultAlgo: 'j48',
      theme: 'light'
    });
  },

  saveSettings(s) { this.set('settings', s); },

  getHistory() { return this.get('upload_history', []); },

  addToHistory(entry) {
    const h = this.getHistory();
    h.unshift({ ...entry, id: Date.now() });
    if (h.length > 50) h.length = 50; // cap at 50
    this.set('upload_history', h);
  },

  removeFromHistory(id) {
    const h = this.getHistory().filter(e => e.id !== id);
    this.set('upload_history', h);
  },

  clearHistory() { this.remove('upload_history'); },

  // Save/load last analysis config
  saveAnalysisConfig(cfg) { this.set('last_analysis_cfg', cfg); },
  getAnalysisConfig() { return this.get('last_analysis_cfg', {}); }
};
