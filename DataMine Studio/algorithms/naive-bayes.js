// algorithms/naive-bayes.js — Gaussian/Categorical Naive Bayes

const NaiveBayes = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, y, params = {}) {
    const smoothing = params.smoothing !== undefined ? +params.smoothing : 1.0; // Laplace

    this._classes = [...new Set(y)].sort();
    const n = y.length;

    // Class priors
    this._priors = {};
    for (const cls of this._classes) {
      this._priors[cls] = (y.filter(v => v === cls).length + smoothing) / (n + smoothing * this._classes.length);
    }

    // Separate by class
    const byClass = {};
    for (const cls of this._classes) {
      byClass[cls] = X.filter((_, i) => y[i] === cls);
    }

    const numFeatures = X[0].length;

    // Determine numeric vs categorical per feature
    this._featureType = [];
    for (let fi = 0; fi < numFeatures; fi++) {
      const vals = X.map(r => r[fi]);
      const numVals = vals.filter(v => v !== null && !isNaN(+v) && typeof v !== 'boolean').map(Number);
      this._featureType[fi] = (numVals.length / vals.length > 0.8) ? 'gaussian' : 'categorical';
    }

    // Per-class, per-feature parameters
    this._params = {};
    for (const cls of this._classes) {
      this._params[cls] = [];
      for (let fi = 0; fi < numFeatures; fi++) {
        const colVals = byClass[cls].map(r => r[fi]);
        if (this._featureType[fi] === 'gaussian') {
          const numVals = colVals.filter(v => v !== null && !isNaN(+v)).map(Number);
          const mean = Helpers.mean(numVals);
          const variance = Math.max(Helpers.variance(numVals), 1e-9);
          this._params[cls][fi] = { type: 'gaussian', mean, variance };
        } else {
          // Categorical: frequency counts with Laplace smoothing
          const freq = {};
          colVals.forEach(v => { const s = String(v ?? ''); freq[s] = (freq[s] || 0) + 1; });
          const total = colVals.length;
          const uniqueVals = [...new Set(X.map(r => String(r[fi] ?? '')))];
          const proba = {};
          uniqueVals.forEach(v => {
            proba[v] = ((freq[v] || 0) + smoothing) / (total + smoothing * uniqueVals.length);
          });
          this._params[cls][fi] = { type: 'categorical', proba, smoothing, total, uniqueCount: uniqueVals.length };
        }
      }
    }
    return this;
  },

  // ── Predict ───────────────────────────────────────────────────

  predict(X) { return X.map(row => this._predictOne(row)); },

  predictProba(X) { return X.map(row => this._probaOne(row)); },

  _predictOne(row) {
    const proba = this._probaOne(row);
    return Object.entries(proba).sort((a, b) => b[1] - a[1])[0][0];
  },

  _probaOne(row) {
    const logProba = {};
    for (const cls of this._classes) {
      let lp = Math.log(this._priors[cls]);
      for (let fi = 0; fi < row.length; fi++) {
        const p = this._params[cls][fi];
        if (!p) continue;
        if (p.type === 'gaussian') {
          const v = +row[fi];
          if (!isNaN(v)) {
            lp += -0.5 * Math.log(2 * Math.PI * p.variance)
                  - (v - p.mean) ** 2 / (2 * p.variance);
          }
        } else {
          const key = String(row[fi] ?? '');
          const prob = p.proba[key] || (p.smoothing / (p.total + p.smoothing * p.uniqueCount));
          lp += Math.log(prob);
        }
      }
      logProba[cls] = lp;
    }
    // Convert log-proba to proba via softmax
    const maxLP = Math.max(...Object.values(logProba));
    const exp = {};
    let sum = 0;
    for (const cls of this._classes) { exp[cls] = Math.exp(logProba[cls] - maxLP); sum += exp[cls]; }
    const result = {};
    for (const cls of this._classes) result[cls] = exp[cls] / (sum || 1);
    return result;
  },

  getClasses() { return this._classes; }
};
