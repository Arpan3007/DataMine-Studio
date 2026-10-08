// algorithms/kmeans.js — K-Means Clustering

const KMeans = {

  // ── Train ─────────────────────────────────────────────────────

  train(X, params = {}) {
    const k = params.k || 3;
    const maxIter = params.maxIter || 100;
    const seed = params.seed || 42;
    const init = params.init || 'kmeans++'; // 'random' | 'kmeans++'

    if (X.length < k) throw new Error(`K (${k}) must be ≤ number of data points (${X.length}).`);

    const numX = X.map(r => r.map(Number));

    let centroids = init === 'kmeans++'
      ? this._kmeansppInit(numX, k, seed)
      : this._randomInit(numX, k, seed);

    let labels = new Array(numX.length).fill(0);
    let prevLabels = null;

    for (let iter = 0; iter < maxIter; iter++) {
      // Assignment step
      labels = numX.map(row => this._closestCentroid(row, centroids));

      if (prevLabels && labels.every((l, i) => l === prevLabels[i])) break; // converged

      // Update step
      centroids = this._recalcCentroids(numX, labels, k, centroids);
      prevLabels = [...labels];
    }

    this._k = k;
    this._centroids = centroids;
    this._labels = labels;

    // Cluster sizes
    this._sizes = Array(k).fill(0);
    labels.forEach(l => { this._sizes[l]++; });

    return this;
  },

  // ── Elbow method: run for k=1..maxK ──────────────────────────

  elbow(X, maxK = 10, seed = 42) {
    const numX = X.map(r => r.map(Number));
    const results = [];
    for (let k = 1; k <= Math.min(maxK, numX.length - 1); k++) {
      const centroids = k === 1
        ? [this._mean(numX)]
        : this._kmeansppInit(numX, k, seed);
      const labels = numX.map(r => this._closestCentroid(r, centroids));
      const finalCentroids = this._recalcCentroids(numX, labels, k, centroids);
      const wcss = Metrics.wcss(numX, labels, finalCentroids);
      results.push({ k, wcss });
    }
    return results;
  },

  // ── k-means++ initialization ──────────────────────────────────

  _kmeansppInit(X, k, seed) {
    let s = seed;
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    const centroids = [X[Math.floor(rand() * X.length)]];
    while (centroids.length < k) {
      const dists = X.map(r => Math.min(...centroids.map(c => this._euclideanSq(r, c))));
      const sum = dists.reduce((a, b) => a + b, 0);
      let r = rand() * sum;
      let idx = 0;
      for (; idx < dists.length - 1; idx++) { r -= dists[idx]; if (r <= 0) break; }
      centroids.push(X[idx]);
    }
    return centroids;
  },

  _randomInit(X, k, seed) {
    return Helpers.shuffle(X, seed).slice(0, k);
  },

  // ── Centroid recalculation ────────────────────────────────────

  _recalcCentroids(X, labels, k, prevCentroids) {
    return Array.from({ length: k }, (_, c) => {
      const pts = X.filter((_, i) => labels[i] === c);
      return pts.length > 0 ? this._mean(pts) : prevCentroids[c];
    });
  },

  _mean(pts) {
    if (!pts.length) return [];
    const dim = pts[0].length;
    return Array(dim).fill(0).map((_, j) => Helpers.mean(pts.map(p => p[j])));
  },

  _closestCentroid(row, centroids) {
    let best = 0, bestDist = Infinity;
    centroids.forEach((c, i) => {
      const d = this._euclideanSq(row, c);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  },

  _euclideanSq(a, b) { return a.reduce((s, v, i) => s + (v - (b[i] || 0)) ** 2, 0); },

  // ── Predict new points ────────────────────────────────────────

  predict(X) {
    const numX = X.map(r => r.map(Number));
    return numX.map(r => this._closestCentroid(r, this._centroids));
  },

  // ── Getters ───────────────────────────────────────────────────

  getCentroids() { return this._centroids; },
  getLabels() { return this._labels; },
  getSizes() { return this._sizes; },
  getK() { return this._k; }
};
