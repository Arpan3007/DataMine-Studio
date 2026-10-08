// utils/export.js — CSV, Excel, PDF export helpers

const Export = {

  // ── CSV download ─────────────────────────────────────────────

  downloadCSV(rows, filename = 'export.csv') {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = r[h] === null || r[h] === undefined ? '' : String(r[h]);
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(','))
    ];
    this._download(lines.join('\n'), filename, 'text/csv;charset=utf-8;');
  },

  // ── Excel (SheetJS) ──────────────────────────────────────────

  downloadExcel(sheetsData, filename = 'export.xlsx') {
    // sheetsData: [{ name, rows }]
    if (typeof XLSX === 'undefined') { alert('SheetJS not loaded'); return; }
    const wb = XLSX.utils.book_new();
    for (const { name, rows } of sheetsData) {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename);
  },

  // ── PDF (html2pdf.js) ─────────────────────────────────────────

  downloadPDF(elementId, filename = 'report.pdf') {
    const el = document.getElementById(elementId);
    if (!el) { console.warn('PDF element not found:', elementId); return; }
    if (typeof html2pdf === 'undefined') {
      // Fallback: print
      window.print();
      return;
    }
    const opt = {
      margin: [12, 12],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
  },

  // ── Internal download ─────────────────────────────────────────

  _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // ── Dataset export ────────────────────────────────────────────

  exportDataset(data, filename = 'processed_data.csv') {
    this.downloadCSV(data, filename);
  },

  // ── Results export ────────────────────────────────────────────

  exportClassificationResults(result, filename = 'classification_results') {
    const metricsRows = [
      { Metric: 'Accuracy', Value: result.accuracy.toFixed(4) },
      { Metric: 'Precision', Value: result.precision.toFixed(4) },
      { Metric: 'Recall', Value: result.recall.toFixed(4) },
      { Metric: 'F1 Score', Value: result.f1.toFixed(4) }
    ];
    this.downloadExcel([
      { name: 'Metrics', rows: metricsRows },
      { name: 'Predictions', rows: result.predictions.map((p, i) => ({
        Index: i + 1, Actual: p.actual, Predicted: p.predicted,
        Correct: p.actual === p.predicted ? 'Yes' : 'No'
      }))}
    ], filename + '.xlsx');
  },

  exportRegressionResults(result, filename = 'regression_results') {
    const metricsRows = [
      { Metric: 'MAE', Value: result.mae.toFixed(4) },
      { Metric: 'MSE', Value: result.mse.toFixed(4) },
      { Metric: 'RMSE', Value: result.rmse.toFixed(4) },
      { Metric: 'R² Score', Value: result.r2.toFixed(4) }
    ];
    this.downloadExcel([
      { name: 'Metrics', rows: metricsRows },
      { name: 'Predictions', rows: result.predictions.map((p, i) => ({
        Index: i + 1, Actual: p.actual.toFixed(4), Predicted: p.predicted.toFixed(4),
        Residual: (p.actual - p.predicted).toFixed(4)
      }))}
    ], filename + '.xlsx');
  },

  exportAssociationRules(rules, filename = 'association_rules.csv') {
    this.downloadCSV(rules.map(r => ({
      Antecedent: Array.from(r.antecedent).join(', '),
      Consequent: Array.from(r.consequent).join(', '),
      Support: r.support.toFixed(4),
      Confidence: r.confidence.toFixed(4),
      Lift: r.lift.toFixed(4)
    })), filename);
  }
};
