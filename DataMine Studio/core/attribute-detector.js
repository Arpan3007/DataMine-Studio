// core/attribute-detector.js — Auto-detect column types and roles

const AttributeDetector = {

  // ── Detect type for a single column ─────────────────────────

  detectType(values) {
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNull.length === 0) return 'unknown';

    // Boolean check
    const boolSet = new Set(['true', 'false', '0', '1', 'yes', 'no']);
    if (nonNull.every(v => boolSet.has(String(v).toLowerCase().trim()))) return 'boolean';

    // Integer check
    if (nonNull.every(v => /^-?\d+$/.test(String(v).trim()))) return 'integer';

    // Float check
    if (nonNull.every(v => /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(String(v).trim()))) return 'float';

    // Date check
    const dateCount = nonNull.filter(v => {
      const s = String(v).trim();
      return !isNaN(Date.parse(s)) && /[\-\/]/.test(s) && s.length >= 6;
    }).length;
    if (dateCount / nonNull.length > 0.8) return 'datetime';

    // Categorical / String
    const unique = new Set(nonNull.map(v => String(v).trim())).size;
    if (unique / nonNull.length <= 0.15 || unique <= 20) return 'categorical';

    return 'string';
  },

  // ── Detect role heuristic ─────────────────────────────────────

  detectRole(colName, detectedType, uniqueCount, totalRows) {
    const name = colName.toLowerCase().replace(/[_\s]/g, '');
    const idPatterns = /^(id|uuid|key|index|code|no|num|serial|ref|customerid|studentid|userid|orderid|productid|employeeid|recordid)$/;
    const datePatterns = /(date|time|timestamp|year|month|day|created|updated|born)/;
    const targetPatterns = /(target|label|class|result|output|predicted|churn|fraud|status|outcome|category|type|passed|failed|flag|survived|response|decision|approved|rejected|success|diagnosis|grade|score)/;

    if (detectedType === 'datetime') return 'date';
    if (idPatterns.test(name)) return 'identifier';
    if (datePatterns.test(name) && detectedType !== 'float') return 'date';

    // Identifier by uniqueness
    if (uniqueCount === totalRows && (detectedType === 'integer' || detectedType === 'string')) return 'identifier';

    // Target candidate
    if (targetPatterns.test(name)) return 'target_candidate';

    // High cardinality text
    if (detectedType === 'string' && uniqueCount > 30 && (uniqueCount / totalRows) > 0.4) return 'ignore';

    // Default feature
    return 'feature';
  },

  // ── Full dataset analysis ────────────────────────────────────

  analyze(rows, columns) {
    const schema = {};
    const stats = {};
    const detection = {
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      idColumns: [],
      booleanColumns: [],
      possibleClassificationTargets: [],
      possibleRegressionTargets: [],
      roles: {}
    };

    const n = rows.length;

    for (const col of columns) {
      const values = rows.map(r => r[col]);
      const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
      const missingCount = values.length - nonNull.length;
      const uniqueVals = [...new Set(nonNull.map(v => String(v).trim()))];
      const uniqueCount = uniqueVals.length;

      const detectedType = this.detectType(values);
      const role = this.detectRole(col, detectedType, uniqueCount, n);

      // Example values (up to 5)
      const examples = uniqueVals.slice(0, 5);

      // Per-column stats
      const numericVals = nonNull.map(v => Number(v)).filter(v => !isNaN(v));

      schema[col] = {
        detectedType,
        role,
        uniqueCount,
        missingCount,
        missingPct: n > 0 ? missingCount / n : 0,
        examples,
        isConstant: uniqueCount <= 1,
        isHighCardinality: detectedType === 'string' && uniqueCount > 50,
        numericVals
      };

      // Compute stats for numeric cols
      if (numericVals.length > 0) {
        const sorted = [...numericVals].sort((a, b) => a - b);
        const mean = Helpers.mean(numericVals);
        const std = Helpers.std(numericVals);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        stats[col] = {
          min: sorted[0], max: sorted[sorted.length - 1],
          mean: +mean.toFixed(4),
          median: +Helpers.median(numericVals).toFixed(4),
          std: +std.toFixed(4),
          q1, q3, iqr: q3 - q1,
          count: numericVals.length
        };
      } else {
        // Frequency for categorical
        const freq = {};
        nonNull.forEach(v => { const s = String(v).trim(); freq[s] = (freq[s] || 0) + 1; });
        stats[col] = { frequencies: freq, count: nonNull.length };
      }

      // Categorize columns
      if (detectedType === 'integer' || detectedType === 'float') {
        detection.numericColumns.push(col);
        if (role === 'target_candidate') detection.possibleRegressionTargets.push(col);
        else if (role === 'feature') detection.possibleRegressionTargets.push(col);
      }
      if (detectedType === 'categorical' || detectedType === 'boolean') {
        detection.categoricalColumns.push(col);
        if (role === 'target_candidate' || (uniqueCount >= 2 && uniqueCount <= 20))
          detection.possibleClassificationTargets.push(col);
      }
      if (detectedType === 'datetime') detection.dateColumns.push(col);
      if (role === 'identifier') detection.idColumns.push(col);
      if (detectedType === 'boolean') detection.booleanColumns.push(col);

      // User-facing role
      detection.roles[col] = role === 'target_candidate' ? 'feature' : role;
    }

    // Refine regression targets (only actual numeric cols, not IDs)
    detection.possibleRegressionTargets = detection.numericColumns
      .filter(c => schema[c].role !== 'identifier' && schema[c].uniqueCount > 5);

    // Refine classification targets
    detection.possibleClassificationTargets = [
      ...detection.categoricalColumns.filter(c => {
        const s = schema[c];
        return s.uniqueCount >= 2 && s.uniqueCount <= 20 && s.role !== 'identifier';
      }),
      ...detection.booleanColumns
    ];
    // Remove duplicates
    detection.possibleClassificationTargets = [...new Set(detection.possibleClassificationTargets)];

    return { schema, stats, detection };
  }
};
