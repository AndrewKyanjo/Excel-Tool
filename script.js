
// script.js
let sourceData = null;
let sourceColumns = [];
let comparisonFiles = [];
let comparisonResults = [];
let fileCounter = 0;

// Initialize event listeners
document.getElementById('sourceFile').addEventListener('change', handleSourceFileUpload);
document.getElementById('addFileBtn').addEventListener('click', addComparisonFile);
document.getElementById('compareBtn').addEventListener('click', runComparison);

function handleSourceFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                throw new Error('No data found in the Excel file');
            }

            sourceData = data;
            sourceColumns = Object.keys(data[0]);

            updateStatus('sourceStatus', `✅ Loaded ${data.length} records with ${sourceColumns.length} columns`, 'success');
            displaySourceColumns();

            document.getElementById('comparisonStep').style.display = 'block';
            hideError();
        } catch (error) {
            updateStatus('sourceStatus', '❌ Error reading file', 'error');
            showError('Error reading source file: ' + error.message);
        }
    };
    reader.readAsBinaryString(file);
}

function displaySourceColumns() {
    const columnsGrid = document.getElementById('sourceColumnsGrid');
    const columnSelectContainer = document.createElement('div');
    columnSelectContainer.innerHTML = `
    <label for="selectedColumns" style="margin-top:20px; display:block;"><strong>✅ Select Columns to Compare:</strong></label>
    <select id="selectedColumns" multiple size="5" class="file-input" style="height:auto;">
        ${sourceColumns.map(col => `<option value="${col}" selected>${col}</option>`).join('')}
    </select>
    <p style="font-size: 0.85rem; color: #666; margin-top: 8px;">
        Hold Ctrl (Windows) or Cmd (Mac) to select multiple columns.
    </p>
`;
    columnsGrid.parentNode.appendChild(columnSelectContainer);

    columnsGrid.innerHTML = '';

    sourceColumns.forEach(column => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.textContent = column;
        columnsGrid.appendChild(columnItem);
    });

    document.getElementById('sourceColumns').style.display = 'block';
}

function addComparisonFile() {
    fileCounter++;
    const fileDiv = document.createElement('div');
    fileDiv.className = 'comparison-file';
    fileDiv.id = `comparisonFile_${fileCounter}`;

    fileDiv.innerHTML = `
                <div class="comparison-file-header">
                    <span class="file-number">File ${fileCounter}</span>
                    <button class="remove-file" onclick="removeComparisonFile(${fileCounter})">Remove</button>
                </div>
                <input type="file" id="compFile_${fileCounter}" class="file-input" accept=".xlsx,.xls" />
                <div id="compStatus_${fileCounter}" class="file-status"></div>
                <div id="validation_${fileCounter}" class="column-validation"></div>
            `;

    document.getElementById('comparisonFiles').appendChild(fileDiv);

    // Add event listener for the new file input
    document.getElementById(`compFile_${fileCounter}`).addEventListener('change', (e) => handleComparisonFileUpload(e, fileCounter));
}

function removeComparisonFile(fileId) {
    const fileDiv = document.getElementById(`comparisonFile_${fileId}`);
    if (fileDiv) {
        fileDiv.remove();
        // Remove from comparisonFiles array
        comparisonFiles = comparisonFiles.filter(file => file.id !== fileId);
        checkComparisonReady();
    }
}

function handleComparisonFileUpload(event, fileId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                throw new Error('No data found in the Excel file');
            }

            const fileColumns = Object.keys(data[0]);
            const validation = validateColumns(fileColumns);

            // Update or add to comparison files
            const existingIndex = comparisonFiles.findIndex(f => f.id === fileId);
            const fileData = {
                id: fileId,
                name: file.name,
                data: data,
                columns: fileColumns,
                valid: validation.valid
            };

            if (existingIndex >= 0) {
                comparisonFiles[existingIndex] = fileData;
            } else {
                comparisonFiles.push(fileData);
            }

            updateStatus(`compStatus_${fileId}`, `✅ Loaded ${data.length} records with ${fileColumns.length} columns`, 'success');
            displayValidation(fileId, validation);
            checkComparisonReady();
            hideError();
        } catch (error) {
            updateStatus(`compStatus_${fileId}`, '❌ Error reading file', 'error');
            showError('Error reading comparison file: ' + error.message);
        }
    };
    reader.readAsBinaryString(file);
}

function validateColumns(fileColumns) {
    const missingColumns = [];
    const presentColumns = [];

    sourceColumns.forEach(sourceCol => {
        const found = fileColumns.some(fileCol =>
            sourceCol.toLowerCase().trim() === fileCol.toLowerCase().trim()
        );

        if (found) {
            presentColumns.push(sourceCol);
        } else {
            missingColumns.push(sourceCol);
        }
    });

    return {
        valid: missingColumns.length === 0,
        missing: missingColumns,
        present: presentColumns,
        extra: fileColumns.filter(fileCol =>
            !sourceColumns.some(sourceCol =>
                sourceCol.toLowerCase().trim() === fileCol.toLowerCase().trim()
            )
        )
    };
}

function displayValidation(fileId, validation) {
    const validationDiv = document.getElementById(`validation_${fileId}`);
    validationDiv.innerHTML = '';

    let html = '<h5>Column Validation:</h5>';

    validation.present.forEach(col => {
        html += `
                    <div class="validation-item">
                        <span class="validation-icon success">✅</span>
                        <span>${col} - Found</span>
                    </div>
                `;
    });

    validation.missing.forEach(col => {
        html += `
                    <div class="validation-item">
                        <span class="validation-icon error">❌</span>
                        <span>${col} - Missing</span>
                    </div>
                `;
    });

    if (validation.extra.length > 0) {
        html += '<div style="margin-top: 10px; font-size: 0.9rem; color: #666;">Additional columns found: ' + validation.extra.join(', ') + '</div>';
    }

    validationDiv.innerHTML = html;
    validationDiv.style.display = 'block';
}

function checkComparisonReady() {
    const validFiles = comparisonFiles.filter(file => file.valid);
    const compareBtn = document.getElementById('compareBtn');

    if (sourceData && validFiles.length > 0) {
        compareBtn.disabled = false;
        document.getElementById('compareStep').style.display = 'block';
    } else {
        compareBtn.disabled = true;
    }
}

function runComparison() {
    hideError();
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';

    // Get selected matching mode
    const matchingMode = document.querySelector('input[name="matchingMode"]:checked').value;

    setTimeout(() => {
        try {
            comparisonResults = [];

            comparisonFiles.filter(file => file.valid).forEach(compFile => {
                const result = compareDatasets(sourceData, compFile.data, compFile.name, matchingMode);
                comparisonResults.push(result);
            });

            displayResults();
        } catch (error) {
            showError('Error during comparison: ' + error.message);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }, 1000);
}

function compareDatasets(sourceData, comparisonData, fileName, matchingMode) {
    const matches = [];
    const unmatched = [];
    const partialMatches = [];
    const selectedColumns = getSelectedColumns();

    sourceData.forEach((sourceRecord, index) => {
        let matchResult = findBestMatch(sourceRecord, comparisonData, matchingMode, selectedColumns);

        const recordWithStatus = {
            ...sourceRecord,
            Status: matchResult.status,
            RowIndex: index + 1,
            MatchDetails: matchResult.details
        };

        if (matchResult.status === 'MATCHED') {
            matches.push(recordWithStatus);
        } else if (matchResult.status === 'PARTIAL') {
            partialMatches.push(recordWithStatus);
        } else {
            unmatched.push(recordWithStatus);
        }
    });

    return {
        fileName: fileName,
        matchingMode: matchingMode,
        totalRecords: sourceData.length,
        matchedCount: matches.length,
        partialMatchedCount: partialMatches.length,
        unmatchedCount: unmatched.length,
        matches: matches,
        partialMatches: partialMatches,
        unmatched: unmatched,
        allResults: [...matches, ...partialMatches, ...unmatched]
    };
}

function findBestMatch(sourceRecord, comparisonData, matchingMode, selectedColumns) {
    let bestMatch = null;
    let bestMatchScore = 0;
    let bestMatchDetails = '';

    for (let compRecord of comparisonData) {
        let matchedColumns = 0;
        let totalColumns = selectedColumns.length;
        let columnDetails = [];
        let isExactMatch = true;

        for (let column of selectedColumns) {
            const sourceValue = normalizeValue(sourceRecord[column], column);
            const compValue = normalizeValue(findColumnValue(compRecord, column), column);

            if (sourceValue === compValue) {
                matchedColumns++;
                columnDetails.push(`${column}: ✓`);
            } else {
                isExactMatch = false;
                columnDetails.push(`${column}: ✗ (${sourceValue} ≠ ${compValue})`);
            }
        }

        const matchScore = matchedColumns / totalColumns;

        if (matchingMode === 'exact') {
            if (isExactMatch) {
                return {
                    status: 'MATCHED',
                    details: 'All columns match'
                };
            }
        } else { // partial
            if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestMatch = compRecord;
                bestMatchDetails = `${matchedColumns}/${totalColumns} columns match: ${columnDetails.join(', ')}`;
            }
        }
    }

    if (matchingMode === 'exact') {
        return {
            status: 'UNMATCHED',
            details: 'No exact match found'
        };
    } else {
        if (bestMatchScore === 1) {
            return {
                status: 'MATCHED',
                details: bestMatchDetails
            };
        } else if (bestMatchScore > 0) {
            return {
                status: 'PARTIAL',
                details: bestMatchDetails
            };
        } else {
            return {
                status: 'UNMATCHED',
                details: 'No matching columns found'
            };
        }
    }
}


function normalizeValue(value, columnName) {
    if (value === null || value === undefined) return '';

    // Handle dates specifically
    if (isDateColumn(columnName) || isDateValue(value)) {
        return normalizeDateValue(value);
    }

    if (typeof value === 'number') return value.toString();
    return value.toString().toLowerCase().trim();
}

function isDateColumn(columnName) {
    const dateKeywords = ['date', 'time', 'created', 'updated', 'modified', 'birth', 'expire', 'start', 'end'];
    const columnLower = columnName.toLowerCase();
    return dateKeywords.some(keyword => columnLower.includes(keyword));
}

function isDateValue(value) {
    if (typeof value === 'number' && value > 25000 && value < 100000) {
        // Likely Excel date serial number
        return true;
    }

    if (typeof value === 'string') {
        // Check for common date patterns
        const datePatterns = [
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // DD/MM/YYYY or MM/DD/YYYY
            /^\d{4}-\d{1,2}-\d{1,2}$/,    // YYYY-MM-DD
            /^\d{1,2}-\d{1,2}-\d{4}$/,    // DD-MM-YYYY
        ];
        return datePatterns.some(pattern => pattern.test(value.trim()));
    }

    return false;
}

function normalizeDateValue(value) {
    try {
        if (typeof value === 'number') {
            // Excel date serial number
            const date = new Date((value - 25569) * 86400 * 1000);
            return formatDate(date);
        }

        if (typeof value === 'string') {
            const dateStr = value.trim();

            // Try to parse common date formats
            let date;

            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY
                const parts = dateStr.split('/');
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                // YYYY-MM-DD
                date = new Date(dateStr);
            } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
                // DD-MM-YYYY
                const parts = dateStr.split('-');
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                // Try generic date parsing
                date = new Date(dateStr);
            }

            if (!isNaN(date.getTime())) {
                return formatDate(date);
            }
        }

        // If all parsing fails, return original value
        return value.toString().toLowerCase().trim();
    } catch (error) {
        return value.toString().toLowerCase().trim();
    }
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function findColumnValue(record, targetColumn) {
    // Find column value with case-insensitive matching
    const key = Object.keys(record).find(k =>
        k.toLowerCase().trim() === targetColumn.toLowerCase().trim()
    );
    return key ? record[key] : null;
}

function normalizeValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toString();
    return value.toString().toLowerCase().trim();
}

function displayResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    comparisonResults.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'file-results';

        resultDiv.innerHTML = `
                    <div class="file-results-header">
                        📄 ${result.fileName}
                    </div>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number total">${result.totalRecords}</div>
                            <div>Total Records</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number matched">${result.matchedCount}</div>
                            <div>Exact Matches</div>
                        </div>
                        ${result.matchingMode === 'partial' ? `
                        <div class="stat-card">
                            <div class="stat-number" style="color: #f39c12;">${result.partialMatchedCount || 0}</div>
                            <div>Partial Matches</div>
                        </div>
                        ` : ''}
                        <div class="stat-card">
                            <div class="stat-number unmatched">${result.unmatchedCount}</div>
                            <div>No Matches</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${((result.matchedCount / result.totalRecords) * 100).toFixed(1)}%</div>
                            <div>Exact Match Rate</div>
                        </div>
                    </div>
                    
                    <button class="download-btn" onclick="downloadResults(${index})">📥 Download Results</button>
                    
                    <div class="table-container">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Row #</th>
                                    ${sourceColumns.map(col => `<th>${col}</th>`).join('')}
                                    <th>Status</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.allResults.map(record => `
                                    <tr>
                                        <td>${record.RowIndex}</td>
                                        ${sourceColumns.map(col => `<td>${record[col] || 'N/A'}</td>`).join('')}
                                        <td><span class="status-${record.Status.toLowerCase()}">${record.Status}</span></td>
                                        <td><div class="partial-details">${record.MatchDetails || ''}</div></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

        resultsContainer.appendChild(resultDiv);
    });

    document.getElementById('resultsSection').style.display = 'block';
}

function downloadResults(resultIndex) {
    if (!comparisonResults[resultIndex]) return;

    const result = comparisonResults[resultIndex];
    const ws = XLSX.utils.json_to_sheet(result.allResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comparison Results");

    const fileName = `comparison_${result.fileName.replace(/\.[^/.]+$/, "")}_results.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function updateStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `file-status ${type}`;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}
function getSelectedColumns() {
    const select = document.getElementById('selectedColumns');
    return Array.from(select.selectedOptions).map(opt => opt.value);
}


// Initialize with first comparison file
addComparisonFile();

