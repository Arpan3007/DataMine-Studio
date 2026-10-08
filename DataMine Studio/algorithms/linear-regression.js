// algorithms/linear-regression.js — Simple Linear Regression (OLS)

const LinearRegression = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, y) {
    // X is [[x1], [x2], ...] — single feature
    const xVals = X.map(r => +r[0]);
    const yVals = y.map(v => +v);

    const n = xVals.length;
    const mx = Helpers.mean(xVals);
    const my = Helpers.mean(yVals);

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xVals[i] - mx) * (yVals[i] - my);
      den += (xVals[i] - mx) ** 2;
    }

    this._b1 = den !== 0 ? num / den : 0;
    this._b0 = my - this._b1 * mx;
    this._mx = mx; this._my = my;
    this._r2 = this._computeR2(xVals, yVals);

    return this;
  },

  _computeR2(x, y) {
    const n = x.length;
    const my = Helpers.mean(y);
    const ssTot = y.reduce((s, v) => s + (v - my) ** 2, 0);
    const ssRes = y.reduce((s, v, i) => s + (v - (this._b0 + this._b1 * x[i])) ** 2, 0);
    return ssTot > 0 ? 1 - ssRes / ssTot : 0;
  },

  // ── Predict ───────────────────────────────────────────────────

  predict(X) {
    return X.map(r => this._b0 + this._b1 * +r[0]);
  },

  // ── Equation ──────────────────────────────────────────────────

  getEquation(xName = 'x', yName = 'y') {
    const b0 = this._b0.toFixed(4), b1 = this._b1.toFixed(4);
    return `${yName} = ${b0} + ${b1} × ${xName}`;
  },

  getCoefficients() {
    return { intercept: this._b0, slope: this._b1 };
  }
};
