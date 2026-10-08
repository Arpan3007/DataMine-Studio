// core/metrics.js — Evaluation metrics

const Metrics = {

  // ── Classification ────────────────────────────────────────────

  classificationReport(actual, predicted, classes) {
    const confMatrix = this.confusionMatrix(actual, predicted, classes);
    const n = actual.length;
    const correct = actual.filter((a, i) => a === predicted[i]).length;
    const accuracy = n > 0 ? correct / n : 0;

    // Per-class precision, recall, F1
    const perClass = {};
    for (const cls of classes) {
      let tp = 0, fp = 0, fn = 0;
      for (let i = 0; i < n; i++) {
        const a = String(actual[i]), p = String(predicted[i]);
        if (a === cls && p === cls) tp++;
        else if (a !== cls && p === cls) fp++;
        else if (a === cls && p !== cls) fn++;
      }
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
      const support = actual.filter(a => String(a) === cls).length;
      perClass[cls] = { tp, fp, fn, precision, recall, f1, support };
    }

    // Macro averages
    const macro = (key) => classes.length > 0
      ? classes.reduce((s, c) => s + perClass[c][key], 0) / classes.length : 0;

    return {
      accuracy,
      precision: macro('precision'),
      recall: macro('recall'),
      f1: macro('f1'),
      perClass,
      confMatrix,
      classes
    };
  },

  confusionMatrix(actual, predicted, classes) {
    const matrix = {};
    for (const a of classes) {
      matrix[a] = {};
      for (const p of classes) matrix[a][p] = 0;
    }
    for (let i = 0; i < actual.length; i++) {
      const a = String(actual[i]), p = String(predicted[i]);
      if (matrix[a] && matrix[a][p] !== undefined) matrix[a][p]++;
    }
    return matrix;
  },

  // ── Regression ────────────────────────────────────────────────

  regressionReport(actual, predicted) {
    const n = actual.length;
    if (n === 0) return { mae: 0, mse: 0, rmse: 0, r2: 0 };

    const mae = actual.reduce((s, a, i) => s + Math.abs(a - predicted[i]), 0) / n;
    const mse = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0) / n;
    const rmse = Math.sqrt(mse);

    const meanActual = Helpers.mean(actual);
    const ssTot = actual.reduce((s, a) => s + (a - meanActual) ** 2, 0);
    const ssRes = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { mae, mse, rmse, r2 };
  },

  // ── Clustering ────────────────────────────────────────────────

  silhouetteScore(data, labels, k) {
    // Simplified silhouette score
    if (data.length < 2 || k < 2) return 0;
    const n = data.length;
    let total = 0;

    for (let i = 0; i < n; i++) {
      const label = labels[i];
      const sameCluster = data.filter((_, j) => j !== i && labels[j] === label);
      const a = sameCluster.length > 0
        ? Helpers.mean(sameCluster.map(d => this._euclidean(data[i], d)))
        : 0;

      let minB = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === label) continue;
        const otherCluster = data.filter((_, j) => labels[j] === c);
        if (otherCluster.length === 0) continue;
        const b = Helpers.mean(otherCluster.map(d => this._euclidean(data[i], d)));
        if (b < minB) minB = b;
      }
      const b = isFinite(minB) ? minB : 0;
      const s = Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : 0;
      total += s;
    }
    return total / n;
  },

  wcss(data, labels, centroids) {
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      const c = centroids[labels[i]];
      if (!c) continue;
      total += data[i].reduce((s, v, j) => s + (v - (c[j] || 0)) ** 2, 0);
    }
    return total;
  },

  _euclidean(a, b) {
    return Math.sqrt(a.reduce((s, v, i) => s + (v - (b[i] || 0)) ** 2, 0));
  },

  // ── Association ───────────────────────────────────────────────

  supportCount(transactions, itemset) {
    const set = new Set(itemset);
    return transactions.filter(t => [...set].every(item => t.has(item))).length;
  },

  support(transactions, itemset) {
    return this.supportCount(transactions, itemset) / transactions.length;
  }
};
