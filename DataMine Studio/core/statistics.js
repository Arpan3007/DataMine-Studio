// core/statistics.js — Descriptive statistics and data quality

const Statistics = {

  // ── Dataset-level summary ─────────────────────────────────────

  summary(rows, columns, schema) {
    const missingTotal = columns.reduce((s, c) => s + (schema[c]?.missingCount || 0), 0);
    const duplicates = this.countDuplicates(rows, columns);
    const numericCols = columns.filter(c => schema[c]?.detectedType === 'integer' || schema[c]?.detectedType === 'float');
    const categoricalCols = columns.filter(c => schema[c]?.detectedType === 'categorical' || schema[c]?.detectedType === 'boolean');
    const dateCols = columns.filter(c => schema[c]?.detectedType === 'datetime');
    const idCols = columns.filter(c => schema[c]?.role === 'identifier');
    const constantCols = columns.filter(c => schema[c]?.isConstant);

    return {
      rowCount: rows.length,
      columnCount: columns.length,
      missingTotal,
      duplicates,
      numericCount: numericCols.length,
      categoricalCount: categoricalCols.length,
      dateCount: dateCols.length,
      idCount: idCols.length,
      constantCount: constantCols.length,
      completeness: rows.length > 0 ? 1 - missingTotal / (rows.length * columns.length) : 0,
      numericCols, categoricalCols, dateCols, idCols, constantCols
    };
  },

  // ── Duplicate detection ───────────────────────────────────────

  countDuplicates(rows, columns) {
    const seen = new Set();
    let dupes = 0;
    for (const r of rows) {
      const key = columns.map(c => r[c] ?? '').join('|');
      if (seen.has(key)) dupes++;
      else seen.add(key);
    }
    return dupes;
  },

  removeDuplicates(rows, columns) {
    const seen = new Set();
    return rows.filter(r => {
      const key = columns.map(c => r[c] ?? '').join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  },

  // ── Missing value map: col → count ───────────────────────────

  missingMap(rows, columns) {
    const map = {};
    for (const c of columns) {
      map[c] = rows.filter(r => r[c] === null || r[c] === undefined || r[c] === '').length;
    }
    return map;
  },

  // ── Data type distribution ────────────────────────────────────

  typeDistribution(columns, schema) {
    const counts = { integer: 0, float: 0, categorical: 0, boolean: 0, datetime: 0, string: 0, unknown: 0 };
    for (const c of columns) {
      const t = schema[c]?.detectedType || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  },

  // ── Correlation matrix (Pearson) for numeric columns ─────────

  correlationMatrix(rows, numericCols) {
    const matrix = {};
    const vectors = {};
    for (const col of numericCols) {
      vectors[col] = rows.map(r => +r[col]).filter(v => !isNaN(v));
    }
    for (const a of numericCols) {
      matrix[a] = {};
      for (const b of numericCols) {
        if (a === b) { matrix[a][b] = 1; continue; }
        matrix[a][b] = this._pearson(vectors[a], vectors[b]);
      }
    }
    return matrix;
  },

  _pearson(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const mx = Helpers.mean(x.slice(0, n)), my = Helpers.mean(y.slice(0, n));
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) ** 2;
      dy += (y[i] - my) ** 2;
    }
    return dx && dy ? num / Math.sqrt(dx * dy) : 0;
  }
};
