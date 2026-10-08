// core/validation.js — File & dataset validation

const Validation = {

  SUPPORTED_TYPES: ['csv', 'xlsx', 'xls'],
  MAX_SIZE_MB: 100,

  // ── File-level validation ────────────────────────────────────

  validateFile(file) {
    const errors = [], warnings = [];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const sizeMB = file.size / (1024 * 1024);

    if (!this.SUPPORTED_TYPES.includes(ext))
      errors.push(`Unsupported file format ".${ext}". Supported formats: CSV, XLSX, XLS.`);

    if (sizeMB > this.MAX_SIZE_MB)
      errors.push(`File size ${sizeMB.toFixed(1)} MB exceeds the maximum limit of ${this.MAX_SIZE_MB} MB.`);

    return { valid: errors.length === 0, errors, warnings };
  },

  // ── Parsed dataset validation ────────────────────────────────

  validateDataset(rows, columns) {
    const errors = [], warnings = [];

    if (!rows || rows.length === 0)
      errors.push('The dataset is empty — no data rows were found.');

    if (!columns || columns.length === 0)
      errors.push('No columns were detected. Ensure the file has a header row.');

    if (rows.length === 1)
      errors.push('Dataset contains only one row — not enough data for analysis.');

    if (rows.length < 10)
      warnings.push(`Dataset is very small (${rows.length} rows). Results may not be statistically meaningful.`);

    if (columns.length === 1)
      errors.push('Dataset contains only one column. A valid dataset requires at least two columns.');

    // Duplicate column names
    const seen = new Set(), dupes = new Set();
    columns.forEach(c => { if (seen.has(c)) dupes.add(c); else seen.add(c); });
    if (dupes.size) warnings.push(`Duplicate column names detected: ${[...dupes].join(', ')}.`);

    // Blank column names
    const blanks = columns.filter(c => !c || !c.trim());
    if (blanks.length) warnings.push(`${blanks.length} column(s) have blank/missing header names.`);

    // High missing per column
    if (rows.length > 0) {
      for (const col of columns) {
        const missing = rows.filter(r => r[col] === null || r[col] === undefined || r[col] === '').length;
        const pct = missing / rows.length;
        if (pct > 0.5) warnings.push(`Column "${col}" has ${(pct * 100).toFixed(0)}% missing values.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  // ── Algorithm compatibility checks ───────────────────────────

  checkClassification(target, schema) {
    const errors = [], warnings = [];
    if (!target) { errors.push('Please select a target attribute.'); return { ok: false, errors, warnings }; }
    const t = schema[target];
    if (!t) { errors.push(`Column "${target}" not found.`); return { ok: false, errors, warnings }; }
    if (t.detectedType === 'float' && t.uniqueCount > 20)
      warnings.push(`Target "${target}" appears to be continuous (Float with ${t.uniqueCount} unique values). Consider using Regression instead.`);
    if (t.uniqueCount > 50)
      errors.push(`Target "${target}" has ${t.uniqueCount} unique values — too many for classification. Select a low-cardinality categorical column.`);
    if (t.uniqueCount < 2)
      errors.push(`Target "${target}" has fewer than 2 unique values — not suitable for classification.`);
    return { ok: errors.length === 0, errors, warnings };
  },

  checkRegression(target, schema) {
    const errors = [], warnings = [];
    if (!target) { errors.push('Please select a numerical target attribute.'); return { ok: false, errors, warnings }; }
    const t = schema[target];
    if (!t) { errors.push(`Column "${target}" not found.`); return { ok: false, errors, warnings }; }
    if (t.detectedType !== 'integer' && t.detectedType !== 'float')
      errors.push(`Regression requires a numerical target. "${target}" is ${t.detectedType}. Please select a numerical column.`);
    return { ok: errors.length === 0, errors, warnings };
  },

  checkClustering(features, schema) {
    const errors = [], warnings = [];
    const numericFeatures = features.filter(f => schema[f] && (schema[f].detectedType === 'integer' || schema[f].detectedType === 'float'));
    if (numericFeatures.length === 0)
      errors.push('K-Means requires at least one numerical feature. Go to Preprocessing to encode categorical attributes.');
    if (numericFeatures.length < 2)
      warnings.push('K-Means clustering is most meaningful with at least 2 numerical features for visualization.');
    return { ok: errors.length === 0, errors, warnings };
  },

  checkAssociation(transactionCol, schema) {
    const errors = [], warnings = [];
    if (!transactionCol) { errors.push('Please select the transaction/item column.'); return { ok: false, errors, warnings }; }
    return { ok: true, errors, warnings };
  }
};
