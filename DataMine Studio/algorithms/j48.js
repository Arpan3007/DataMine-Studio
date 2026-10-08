// algorithms/j48.js — C4.5 / J48 Decision Tree

const J48 = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, y, featureNames, params = {}) {
    const maxDepth = params.maxDepth || 10;
    const minInstances = params.minInstances || 2;

    const classes = [...new Set(y)].sort();
    const indices = Helpers.range(X.length);

    this._featureNames = featureNames;
    this._classes = classes;
    this._featureImportance = {};
    featureNames.forEach(f => { this._featureImportance[f] = 0; });

    this._tree = this._buildTree(X, y, indices, featureNames, 0, maxDepth, minInstances);

    // Normalize importance
    const total = Object.values(this._featureImportance).reduce((s, v) => s + v, 0) || 1;
    for (const f of featureNames) this._featureImportance[f] /= total;

    return this;
  },

  // ── Build tree recursively ────────────────────────────────────

  _buildTree(X, y, indices, features, depth, maxDepth, minInst) {
    const yVals = indices.map(i => y[i]);

    // Stopping conditions
    if (indices.length < minInst || depth >= maxDepth || new Set(yVals).size === 1) {
      return { type: 'leaf', prediction: this._majorityClass(yVals), count: indices.length };
    }

    // Find best split
    const best = this._bestSplit(X, y, indices, features);
    if (!best || best.gainRatio <= 0) {
      return { type: 'leaf', prediction: this._majorityClass(yVals), count: indices.length };
    }

    // Record feature importance
    const fn = best.featureName;
    this._featureImportance[fn] = (this._featureImportance[fn] || 0) + best.gainRatio;

    const node = {
      type: 'split',
      feature: best.feature,
      featureName: fn,
      threshold: best.threshold,
      gainRatio: best.gainRatio,
      count: indices.length,
      prediction: this._majorityClass(yVals),
      children: {}
    };

    if (best.threshold !== null) {
      // Numeric split: left (≤ threshold) and right (> threshold)
      const left = indices.filter(i => +X[i][best.feature] <= best.threshold);
      const right = indices.filter(i => +X[i][best.feature] > best.threshold);
      if (left.length && right.length) {
        node.children['left'] = this._buildTree(X, y, left, features, depth + 1, maxDepth, minInst);
        node.children['right'] = this._buildTree(X, y, right, features, depth + 1, maxDepth, minInst);
      } else {
        return { type: 'leaf', prediction: this._majorityClass(yVals), count: indices.length };
      }
    } else {
      // Categorical split
      for (const [val, subIndices] of Object.entries(best.splits)) {
        node.children[val] = this._buildTree(X, y, subIndices, features, depth + 1, maxDepth, minInst);
      }
    }

    return node;
  },

  // ── Best split (gain ratio) ───────────────────────────────────

  _bestSplit(X, y, indices, features) {
    const parentEntropy = this._entropy(indices.map(i => y[i]));
    let bestGainRatio = -Infinity, bestSplit = null;

    for (let fi = 0; fi < features.length; fi++) {
      const vals = indices.map(i => X[i][fi]);
      const numVals = vals.map(Number).filter(v => !isNaN(v));
      const isNumeric = numVals.length === vals.length;

      if (isNumeric) {
        // Numeric: try midpoints, but limit to max 20 thresholds to prevent freezing on continuous vars
        const sorted = [...new Set(numVals)].sort((a, b) => a - b);
        const thresholds = [];
        if (sorted.length > 20) {
          for (let k = 1; k < 20; k++) {
            const idx = Math.floor((k / 20) * sorted.length);
            thresholds.push(sorted[idx]);
          }
        } else {
          for (let t = 0; t < sorted.length - 1; t++) {
            thresholds.push((sorted[t] + sorted[t + 1]) / 2);
          }
        }
        
        // Remove duplicates
        const uniqueThresholds = [...new Set(thresholds)];

        for (const threshold of uniqueThresholds) {
          const left = indices.filter(i => +X[i][fi] <= threshold);
          const right = indices.filter(i => +X[i][fi] > threshold);
          if (!left.length || !right.length) continue;
          const gain = parentEntropy
            - (left.length / indices.length) * this._entropy(left.map(i => y[i]))
            - (right.length / indices.length) * this._entropy(right.map(i => y[i]));
          const splitInfo = this._entropy([left.length, right.length]);
          const gainRatio = splitInfo > 0 ? gain / splitInfo : 0;
          if (gainRatio > bestGainRatio) {
            bestGainRatio = gainRatio;
            bestSplit = { feature: fi, featureName: features[fi], threshold, gainRatio, splits: null };
          }
        }
      } else {
        // Categorical
        const groups = {};
        indices.forEach(i => {
          const v = String(X[i][fi] ?? '').trim();
          (groups[v] = groups[v] || []).push(i);
        });
        const numGroups = Object.keys(groups).length;
        if (numGroups < 2 || numGroups > 30) continue; // Prevent explosion on high-cardinality text
        const gain = parentEntropy - Object.values(groups).reduce((s, g) =>
          s + (g.length / indices.length) * this._entropy(g.map(i => y[i])), 0);
        const splitInfo = this._entropy(Object.values(groups).map(g => g.length));
        const gainRatio = splitInfo > 0 ? gain / splitInfo : 0;
        if (gainRatio > bestGainRatio) {
          bestGainRatio = gainRatio;
          bestSplit = { feature: fi, featureName: features[fi], threshold: null, gainRatio, splits: groups };
        }
      }
    }
    return bestSplit;
  },

  // ── Predict ───────────────────────────────────────────────────

  predict(X) { return X.map(row => this._traverse(this._tree, row)); },

  _traverse(node, row) {
    if (!node || node.type === 'leaf') return node ? node.prediction : null;
    const val = row[node.feature];
    if (node.threshold !== null) {
      const side = +val <= node.threshold ? 'left' : 'right';
      return node.children[side]
        ? this._traverse(node.children[side], row)
        : node.prediction;
    } else {
      const key = String(val ?? '').trim();
      return node.children[key]
        ? this._traverse(node.children[key], key)
        : node.prediction;
    }
  },

  predictProba(X) {
    // Return class as probability 1.0 for predicted class (simplified)
    const preds = this.predict(X);
    return preds.map(p => {
      const proba = {};
      this._classes.forEach(c => { proba[c] = c === p ? 1.0 : 0.0; });
      return proba;
    });
  },

  // ── Helpers ───────────────────────────────────────────────────

  _entropy(labels) {
    if (!labels.length) return 0;
    const counts = {};
    labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    const n = labels.length;
    return -Object.values(counts).reduce((s, c) => {
      const p = c / n;
      return s + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
  },

  _majorityClass(labels) {
    const counts = {};
    labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  },

  getFeatureImportance() { return { ...this._featureImportance }; },
  getClasses() { return this._classes; }
};
