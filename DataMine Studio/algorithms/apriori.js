// algorithms/apriori.js — Apriori frequent itemset mining + association rules

const Apriori = {

  // ── Main entry: find frequent itemsets ─────────────────────────

  run(transactions, params = {}) {
    const minSupport = params.minSupport || 0.1;
    const maxLen = params.maxLen || 5;

    this._transactions = transactions; // array of Sets
    this._n = transactions.length;
    this._minSupport = minSupport;

    if (!this._n) return { itemsets: [], rules: [] };

    // 1-itemsets
    const allItems = new Set();
    transactions.forEach(t => t.forEach(item => allItems.add(item)));

    let Lk = [];
    for (const item of allItems) {
      const sup = this._support([item]);
      if (sup >= minSupport) Lk.push({ items: [item], support: sup });
    }
    Lk.sort((a, b) => b.support - a.support);

    const allFrequent = [...Lk];

    // k-itemsets
    let k = 2;
    while (Lk.length > 0 && k <= maxLen) {
      const candidates = this._aprioriGen(Lk, k);
      const nextLk = [];
      for (const candidate of candidates) {
        const sup = this._support(candidate);
        if (sup >= minSupport) nextLk.push({ items: candidate, support: sup });
      }
      nextLk.sort((a, b) => b.support - a.support);
      allFrequent.push(...nextLk);
      Lk = nextLk;
      k++;
    }

    this._itemsets = allFrequent;
    return this;
  },

  // ── Generate association rules ─────────────────────────────────

  generateRules(params = {}) {
    const minConf = params.minConfidence || 0.5;
    const minLift = params.minLift || 1.0;

    const rules = [];
    for (const { items, support } of this._itemsets) {
      if (items.length < 2) continue;
      // Generate all non-empty subsets as antecedent
      const subsets = this._subsets(items);
      for (const ant of subsets) {
        if (ant.length === 0 || ant.length === items.length) continue;
        const con = items.filter(i => !ant.includes(i));
        if (!con.length) continue;
        const antSupport = this._support(ant);
        if (antSupport === 0) continue;
        const confidence = support / antSupport;
        const conSupport = this._support(con);
        const lift = conSupport > 0 ? confidence / conSupport : 0;
        const conviction = (1 - conSupport) > 0 && (1 - confidence) > 0
          ? (1 - conSupport) / (1 - confidence) : Infinity;

        if (confidence >= minConf && lift >= minLift) {
          rules.push({
            antecedent: ant,
            consequent: con,
            support: +support.toFixed(4),
            confidence: +confidence.toFixed(4),
            lift: +lift.toFixed(4),
            conviction: isFinite(conviction) ? +conviction.toFixed(4) : '∞'
          });
        }
      }
    }
    rules.sort((a, b) => b.lift - a.lift);
    this._rules = rules;
    return this;
  },

  // ── Helpers ───────────────────────────────────────────────────

  _support(items) {
    const count = this._transactions.filter(t => items.every(item => t.has(item))).length;
    return count / this._n;
  },

  _aprioriGen(Lk, k) {
    const candidates = new Set();
    const itemLists = Lk.map(l => l.items);
    for (let i = 0; i < itemLists.length; i++) {
      for (let j = i + 1; j < itemLists.length; j++) {
        const a = itemLists[i], b = itemLists[j];
        // Join step: merge if first k-2 items match
        const merged = [...new Set([...a, ...b])].sort();
        if (merged.length === k) {
          // Prune: check all (k-1)-subsets exist in Lk
          const subsetsValid = this._kSubsets(merged, k - 1).every(sub => {
            const key = sub.sort().join('|');
            return itemLists.some(l => [...l].sort().join('|') === key);
          });
          if (subsetsValid) candidates.add(merged.join('|'));
        }
      }
    }
    return [...candidates].map(s => s.split('|'));
  },

  _subsets(arr) {
    const result = [[]];
    for (const item of arr) {
      const newSubs = result.map(sub => [...sub, item]);
      result.push(...newSubs);
    }
    return result.filter(s => s.length > 0);
  },

  _kSubsets(arr, k) {
    if (k === 0) return [[]];
    if (k > arr.length) return [];
    const [head, ...tail] = arr;
    return [
      ...this._kSubsets(tail, k - 1).map(s => [head, ...s]),
      ...this._kSubsets(tail, k)
    ];
  },

  getItemsets() { return this._itemsets || []; },
  getRules() { return this._rules || []; }
};
