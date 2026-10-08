// algorithms/fp-growth.js — FP-Growth frequent itemset mining

const FPGrowth = {

  // ── FP-Tree Node ──────────────────────────────────────────────

  _makeNode(item, count, parent) {
    return { item, count, parent, children: {}, nodeLink: null };
  },

  // ── Main entry ────────────────────────────────────────────────

  run(transactions, params = {}) {
    const minSupport = params.minSupport || 0.1;
    const maxLen = params.maxLen || 5;
    const n = transactions.length;

    if (!n) return this;

    this._transactions = transactions;
    this._n = n;
    this._minSupport = minSupport;
    this._minCount = Math.ceil(minSupport * n);

    // Step 1: frequency of all items
    const freq = {};
    transactions.forEach(t => t.forEach(item => { freq[item] = (freq[item] || 0) + 1; }));

    // Filter by min support
    const freqItems = Object.entries(freq)
      .filter(([, c]) => c >= this._minCount)
      .sort((a, b) => b[1] - a[1]);

    if (!freqItems.length) { this._itemsets = []; return this; }

    // Order map (descending frequency)
    const order = {};
    freqItems.forEach(([item, c], i) => { order[item] = i; });

    // Step 2: Build FP-tree
    const root = this._makeNode(null, 0, null);
    const headerTable = {};
    freqItems.forEach(([item]) => { headerTable[item] = null; });

    for (const t of transactions) {
      const filtered = [...t].filter(i => freq[i] >= this._minCount)
        .sort((a, b) => (order[a] ?? Infinity) - (order[b] ?? Infinity));
      this._insertTree(filtered, root, headerTable);
    }

    // Step 3: Mine
    const result = [];
    this._mineTree(root, headerTable, [], result, maxLen, freq);

    // Normalize and sort
    this._itemsets = result
      .map(r => ({ items: r.items.sort(), support: r.count / n }))
      .sort((a, b) => b.support - a.support);

    return this;
  },

  // ── Insert transaction into FP-tree ──────────────────────────

  _insertTree(items, node, headerTable) {
    if (!items.length) return;
    const [head, ...tail] = items;
    if (!node.children[head]) {
      const child = this._makeNode(head, 0, node);
      node.children[head] = child;
      // Update header table
      if (headerTable[head] === null) {
        headerTable[head] = child;
      } else {
        let cur = headerTable[head];
        while (cur.nodeLink) cur = cur.nodeLink;
        cur.nodeLink = child;
      }
    }
    node.children[head].count++;
    this._insertTree(tail, node.children[head], headerTable);
  },

  // ── Mine frequent patterns from FP-tree ──────────────────────

  _mineTree(root, headerTable, suffix, result, maxLen, globalFreq) {
    // Process items in ascending frequency order (bottom-up)
    const items = Object.keys(headerTable).sort((a, b) =>
      this._nodeCount(headerTable[a]) - this._nodeCount(headerTable[b]));

    for (const item of items) {
      const newSuffix = [item, ...suffix];
      const count = this._nodeCount(headerTable[item]);
      if (count < this._minCount) continue;

      if (newSuffix.length <= maxLen) {
        result.push({ items: newSuffix, count });
      }

      // Conditional pattern base
      const condPatterns = [];
      let node = headerTable[item];
      while (node) {
        const path = [];
        let parent = node.parent;
        while (parent && parent.item !== null) { path.push(parent.item); parent = parent.parent; }
        if (path.length) condPatterns.push({ path, count: node.count });
        node = node.nodeLink;
      }

      if (!condPatterns.length) continue;

      // Conditional frequency
      const condFreq = {};
      condPatterns.forEach(({ path, count }) => {
        path.forEach(i => { condFreq[i] = (condFreq[i] || 0) + count; });
      });

      // Filter
      const filteredFreq = Object.fromEntries(Object.entries(condFreq).filter(([, c]) => c >= this._minCount));
      if (!Object.keys(filteredFreq).length) continue;

      // Build conditional FP-tree
      const condRoot = this._makeNode(null, 0, null);
      const condHeader = {};
      Object.keys(filteredFreq).forEach(i => { condHeader[i] = null; });

      const order = {};
      Object.entries(filteredFreq).sort((a, b) => b[1] - a[1]).forEach(([i], idx) => { order[i] = idx; });

      for (const { path, count } of condPatterns) {
        const filtered = path.filter(i => filteredFreq[i] >= this._minCount)
          .sort((a, b) => (order[a] ?? Infinity) - (order[b] ?? Infinity));
        for (let c = 0; c < count; c++) this._insertTree(filtered, condRoot, condHeader);
      }

      if (newSuffix.length < maxLen) {
        this._mineTree(condRoot, condHeader, newSuffix, result, maxLen, filteredFreq);
      }
    }
  },

  _nodeCount(node) {
    let total = 0;
    let cur = node;
    while (cur) { total += cur.count; cur = cur.nodeLink; }
    return total;
  },

  // ── Generate rules (same interface as Apriori) ─────────────────

  generateRules(params = {}) {
    // Reuse Apriori's rule generation logic
    const minConf = params.minConfidence || 0.5;
    const minLift = params.minLift || 1.0;
    const n = this._n;

    const rules = [];
    for (const { items, support } of this._itemsets) {
      if (items.length < 2) continue;
      const subsets = this._subsets(items);
      for (const ant of subsets) {
        if (!ant.length || ant.length === items.length) continue;
        const con = items.filter(i => !ant.includes(i));
        if (!con.length) continue;
        const antSet = new Set(ant);
        const antCount = this._transactions.filter(t => [...antSet].every(i => t.has(i))).length;
        if (!antCount) continue;
        const antSupport = antCount / n;
        const confidence = support / antSupport;
        const conSet = new Set(con);
        const conCount = this._transactions.filter(t => [...conSet].every(i => t.has(i))).length;
        const conSupport = conCount / n;
        const lift = conSupport > 0 ? confidence / conSupport : 0;
        const conviction = (1 - conSupport) > 0 && (1 - confidence) > 0
          ? (1 - conSupport) / (1 - confidence) : Infinity;
        if (confidence >= minConf && lift >= minLift) {
          rules.push({
            antecedent: ant, consequent: con,
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

  _subsets(arr) {
    const result = [[]];
    for (const item of arr) {
      result.push(...result.map(s => [...s, item]));
    }
    return result.filter(s => s.length > 0);
  },

  getItemsets() { return this._itemsets || []; },
  getRules() { return this._rules || []; }
};
