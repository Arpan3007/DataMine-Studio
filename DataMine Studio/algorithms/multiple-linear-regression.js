// algorithms/multiple-linear-regression.js — Multiple Linear Regression (OLS normal equation)

const MultipleLinearRegression = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, y, featureNames = []) {
    const n = X.length;
    if (n === 0) throw new Error('No training data');

    // Build design matrix with bias column: [1, x1, x2, ...]
    const Xb = X.map(row => [1, ...row.map(Number)]);
    const yVec = y.map(Number);

    // Normal equation: β = (XᵀX)⁻¹Xᵀy
    const Xt = Helpers.transpose(Xb);
    const XtX = Helpers.matMul(Xt, Xb);
    const Xty = Xt.map(row => Helpers.dot(row, yVec));

    // Try direct inverse; fall back to ridge if singular
    let XtXinv = Helpers.matInv(XtX);
    if (!XtXinv) {
      // Ridge: add small λI
      const lambda = 1e-4;
      const ridgeXtX = XtX.map((row, i) => row.map((v, j) => v + (i === j ? lambda : 0)));
      XtXinv = Helpers.matInv(ridgeXtX);
      if (!XtXinv) throw new Error('Matrix is singular — cannot compute regression. Try fewer features or check for multicollinearity.');
    }

    // β = (XᵀX)⁻¹ · Xᵀy
    const beta = XtXinv.map(row => Helpers.dot(row, Xty));

    this._intercept = beta[0];
    this._coefficients = beta.slice(1);
    this._featureNames = featureNames;
    this._numFeatures = X[0].length;

    return this;
  },

  // ── Predict ───────────────────────────────────────────────────

  predict(X) {
    return X.map(row => {
      const nums = row.map(Number);
      return this._intercept + nums.reduce((s, v, i) => s + v * (this._coefficients[i] || 0), 0);
    });
  },

  // ── Equation string ───────────────────────────────────────────

  getEquation(yName = 'y') {
    const terms = this._coefficients.map((c, i) => {
      const fn = this._featureNames[i] || `x${i + 1}`;
      return `${c >= 0 ? '+ ' : '- '}${Math.abs(c).toFixed(4)} × ${fn}`;
    }).join(' ');
    return `${yName} = ${this._intercept.toFixed(4)} ${terms}`;
  },

  getCoefficients() {
    const result = { intercept: this._intercept, coefficients: {} };
    this._coefficients.forEach((c, i) => {
      result.coefficients[this._featureNames[i] || `x${i + 1}`] = c;
    });
    return result;
  }
};
