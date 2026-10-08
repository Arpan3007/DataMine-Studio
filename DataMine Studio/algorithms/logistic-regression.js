// algorithms/logistic-regression.js — Logistic Regression (OvR multi-class)

const LogisticRegression = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, y, params = {}) {
    const lr = params.learningRate || 0.1;
    const maxIter = params.maxIter || 300;
    const lambda = params.lambda || 0.01; // L2 regularization
    const batchSize = params.batchSize || Math.min(64, X.length);

    this._classes = [...new Set(y)].sort();
    const isBinary = this._classes.length === 2;

    // Normalize features
    const { normX, means, stds } = this._normalize(X);
    this._means = means; this._stds = stds;

    if (isBinary) {
      // Binary: one classifier
      const yBin = y.map(v => v === this._classes[1] ? 1 : 0);
      this._weights = [this._trainBinary(normX, yBin, lr, maxIter, lambda, batchSize)];
    } else {
      // OvR: one classifier per class
      this._weights = this._classes.map(cls => {
        const yBin = y.map(v => v === cls ? 1 : 0);
        return this._trainBinary(normX, yBin, lr, maxIter, lambda, batchSize);
      });
    }

    this._isBinary = isBinary;
    return this;
  },

  _trainBinary(X, y, lr, maxIter, lambda, batchSize) {
    const m = X.length, n = X[0].length;
    let w = Array(n).fill(0), b = 0;

    for (let iter = 0; iter < maxIter; iter++) {
      // Mini-batch
      const start = (iter * batchSize) % m;
      const batchX = X.slice(start, start + batchSize);
      const batchY = y.slice(start, start + batchSize);

      let dw = Array(n).fill(0), db = 0;
      for (let i = 0; i < batchX.length; i++) {
        const pred = Helpers.sigmoid(Helpers.dot(batchX[i], w) + b);
        const err = pred - batchY[i];
        for (let j = 0; j < n; j++) dw[j] += err * batchX[i][j];
        db += err;
      }
      const bSize = batchX.length || 1;
      for (let j = 0; j < n; j++) w[j] -= lr * (dw[j] / bSize + lambda * w[j]);
      b -= lr * db / bSize;
    }
    return { w, b };
  },

  // ── Normalize ─────────────────────────────────────────────────

  _normalize(X) {
    if (!X.length) return { normX: [], means: [], stds: [] };
    const n = X[0].length;
    const means = Array(n).fill(0).map((_, j) => Helpers.mean(X.map(r => r[j])));
    const stds = Array(n).fill(0).map((_, j) => Math.max(Helpers.std(X.map(r => r[j])), 1e-8));
    const normX = X.map(r => r.map((v, j) => (v - means[j]) / stds[j]));
    return { normX, means, stds };
  },

  _normalizeRow(row) {
    return row.map((v, j) => (v - (this._means[j] || 0)) / (this._stds[j] || 1));
  },

  // ── Predict ───────────────────────────────────────────────────

  predict(X) { return this.predictProba(X).map(p => Object.entries(p).sort((a, b) => b[1] - a[1])[0][0]); },

  predictProba(X) {
    return X.map(row => {
      const normRow = this._normalizeRow(row);
      if (this._isBinary) {
        const prob = Helpers.sigmoid(Helpers.dot(normRow, this._weights[0].w) + this._weights[0].b);
        return { [this._classes[0]]: 1 - prob, [this._classes[1]]: prob };
      } else {
        // OvR: softmax over raw scores
        const scores = this._weights.map(({ w, b }) => Helpers.sigmoid(Helpers.dot(normRow, w) + b));
        const sum = scores.reduce((s, v) => s + v, 0) || 1;
        const result = {};
        this._classes.forEach((cls, i) => { result[cls] = scores[i] / sum; });
        return result;
      }
    });
  },

  getClasses() { return this._classes; },

  getCoefficients() {
    return this._weights.map((wt, i) => ({
      class: this._classes[i],
      coefficients: wt.w,
      intercept: wt.b
    }));
  }
};
