# 🔍 Universal Excel Data Comparison Tool

A powerful, browser-based tool for comparing data across Excel files. This application allows users to upload a source Excel file and compare it with multiple other Excel files, highlighting matches, partial matches, and unmatched records. The comparison is customizable, fast, and completely private — all handled in the browser.

---

## ✨ Features

- ✅ Upload and parse `.xlsx` / `.xls` Excel files in-browser
- ✅ Detects columns in the source file automatically
- ✅ **Select specific columns** to compare
- ✅ Supports **Exact Match** and **Partial Match** comparison modes
- ✅ Handles and normalizes Excel date formats
- ✅ Detailed match breakdowns for partial comparisons
- ✅ Dynamic **row filtering** on results
- ✅ **Download comparison results** as Excel files
- ✅ Fully client-side — no uploads, no servers

---

## 📁 File Structure
- index.html # Main HTML page (UI layout and structure)
- styles.css # Styling and design (colors, layout, responsiveness)
- script.js # Main logic (data parsing, comparison, filtering, rendering)
- README.md # Project documentation


---

## 🧰 Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for loading SheetJS library from CDN)

📝 **No installation required!** Just open `index.html` in your browser.

---

## 🧑‍💻 How to Use

1. **Open `index.html`** in your browser.

2. **Step 1: Upload Source File**
   - Select an Excel file that will serve as the base reference.

3. **Step 2: Review Columns**
   - All columns from the source file will be listed.
   - Use the dropdown to choose which ones to use for comparison.

4. **Step 3: Upload Comparison Files**
   - Add one or more Excel files to compare against your source.
   - Files will be validated for matching column structure.

5. **Step 4: Choose Match Type**
   - **Exact Match**: All selected columns must match.
   - **Partial Match**: Shows best-effort matches with match scores.

6. **Start Comparison**
   - Click "🚀 Start Comparison" to process all files.

7. **Review and Filter Results**
   - Filter rows with the search bar.
   - Download result files individually as `.xlsx`.

---

## 📦 Technologies Used

- **SheetJS (XLSX.js)** – Excel file parsing and writing
- **HTML5 + CSS3 + JavaScript** – Frontend logic and layout

---

## 🛡️ Data Privacy

This tool is 100% **client-side**. Your files are **not uploaded** to any server — everything runs locally in your browser for maximum privacy and speed.

---

## 👤 Author

**Andrew Wamala Kyanjo**  
`kyanjoa5@gmail.com` 
Built with ❤️ to make Excel data comparison simple and intuitive.

---

## 📄 License

This project is licensed under the MIT License — free to use, modify, and share.

---



