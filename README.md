# 🚀 DataMine Studio - Universal Data Mining Platform

**DataMine Studio** is a modern, web-based, 100% client-side data mining and analytical suite. Built purely with modern JavaScript, HTML5, and CSS3, it allows users to import datasets, perform data preprocessing, execute classification, clustering, regression, and association rule algorithms, and export detailed analytical reports — all locally in the browser with zero backend requirements.

---

## ✨ Features

- 📁 **Data Import & Parsing**: Supports CSV and Excel (`.xlsx`, `.xls`) files via PapaParse and SheetJS. Includes built-in sample datasets for quick testing.
- 🧹 **Data Preprocessing & Cleaning**: Automatic missing value handling, feature scaling (Min-Max, Z-score normalization), encoding, and attribute type detection.
- 🤖 **Comprehensive Mining Algorithms**:
  - **Classification**: Naïve Bayes, J48 (Decision Tree)
  - **Clustering**: K-Means
  - **Association Rule Mining**: Apriori, FP-Growth
  - **Regression Analysis**: Linear Regression, Multiple Linear Regression, Logistic Regression
- 📊 **Interactive Visualizations**: High-performance interactive charts powered by Chart.js.
- 📄 **Report Generation**: Export complete analysis reports as PDFs via `html2pdf.js` or download cleaned datasets.
- ⚡ **Zero Backend Setup**: Runs entirely in the client's browser. Safe, private, and lightning fast.

---

## 🛠️ Built With

- **HTML5 & CSS3** (Vanilla CSS with CSS Custom Properties, modern layout design)
- **JavaScript (ES6+)**
- **PapaParse** (CSV parsing)
- **SheetJS / xlsx** (Excel file handling)
- **Chart.js** (Data visualization)
- **html2pdf.js** (PDF export)

---

## 🚀 Quick Start

### Running Locally

Since **DataMine Studio** is a static web application, no server installation or build steps are required.

#### Option 1: Open Directly
Simply double-click `index.html` to open the app in any modern web browser.

#### Option 2: Live Server (Recommended)
Using a local server prevents local file protocol restrictions.

**Using Python:**
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

**Using Node.js:**
```bash
npx serve .
```

---

## 📦 Deployment

Deploy easily to **Vercel**, **GitHub Pages**, or **Netlify** with zero configuration:

### Deploying to Vercel (CLI)
```bash
npx vercel
```

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings** -> **Pages**.
3. Under **Branch**, select `main` / `root` and click **Save**.

---

## 📄 License

This project is licensed under the MIT License.
