// core/dataset-loader.js — CSV/XLSX/XLS parsing via PapaParse + SheetJS

const DatasetLoader = {

  // ── Main entry point ─────────────────────────────────────────

  async load(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (ext === 'csv') return this._parseCSV(file);
    if (ext === 'xlsx' || ext === 'xls') return this._parseExcel(file);

    throw new Error(`Unsupported file format: .${ext}`);
  },

  // ── CSV via PapaParse ────────────────────────────────────────

  _parseCSV(file) {
    return new Promise((resolve, reject) => {
      if (typeof Papa === 'undefined') { reject(new Error('PapaParse not loaded')); return; }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // We type ourselves for control
        transformHeader: h => h.trim(),
        complete: (result) => {
          if (result.errors.length && result.data.length === 0) {
            reject(new Error('CSV parse failed: ' + result.errors[0].message));
            return;
          }
          const rows = result.data.map(r => {
            const clean = {};
            for (const [k, v] of Object.entries(r)) {
              clean[k.trim()] = (v === '' || v === null || v === undefined) ? null : v;
            }
            return clean;
          });
          const columns = result.meta.fields.map(f => f.trim()).filter(f => f);
          resolve({ rows, columns });
        },
        error: (err) => reject(new Error('CSV parse error: ' + err.message))
      });
    });
  },

  // ── Excel via SheetJS ─────────────────────────────────────────

  _parseExcel(file) {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === 'undefined') { reject(new Error('SheetJS (XLSX) not loaded')); return; }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(sheet, {
            header: 1, defval: null, blankrows: false
          });

          if (!raw.length) { reject(new Error('Excel file appears to be empty.')); return; }

          // First row = headers
          const headers = raw[0].map(h => (h === null || h === undefined) ? '' : String(h).trim());
          const rows = raw.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => {
              const v = row[i];
              obj[h] = (v === null || v === undefined || v === '') ? null : v;
            });
            return obj;
          }).filter(r => Object.values(r).some(v => v !== null));

          const columns = headers.filter(h => h);
          resolve({ rows, columns });
        } catch (err) {
          reject(new Error('Excel parse error: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsArrayBuffer(file);
    });
  },

  // ── Load from string (sample datasets) ──────────────────────

  fromCSVString(csvString) {
    if (typeof Papa === 'undefined') throw new Error('PapaParse not loaded');
    const result = Papa.parse(csvString.trim(), {
      header: true, skipEmptyLines: true, dynamicTyping: false,
      transformHeader: h => h.trim()
    });
    const rows = result.data.map(r => {
      const clean = {};
      for (const [k, v] of Object.entries(r))
        clean[k.trim()] = (v === '' || v === null) ? null : v;
      return clean;
    });
    const columns = (result.meta.fields || []).map(f => f.trim()).filter(Boolean);
    return { rows, columns };
  }
};
