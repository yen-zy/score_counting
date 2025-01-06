document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addStudentBtn').addEventListener('click', addNewStudent);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    document.getElementById('deleteAllBtn').addEventListener('click', deleteAllStudents);
    document.getElementById('uploadCsvBtn').addEventListener('click', triggerCsvUpload);
    
    // Clear the initial tbody
    document.getElementById('studentTableBody').innerHTML = '';
    
    // Load saved data
    loadSavedData();
    
    // If no saved data, initialize the first row
    if (document.querySelectorAll('.student-row').length === 0) {
        addNewStudent();
    }
});

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('studentScores');
        if (savedData) {
            const data = JSON.parse(savedData);
            const tbody = document.getElementById('studentTableBody');
            tbody.innerHTML = ''; // Clear default row
            
            data.forEach(studentData => {
                const row = createNewRow();
                fillRowData(row, studentData);
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function createNewRow() {
    const template = document.getElementById('rowTemplate');
    const newRow = template.content.cloneNode(true).querySelector('.student-row');
    
    // Add event listeners
    addRowEventListeners(newRow);
    addInputListeners(newRow);
    
    return newRow;
}

function fillRowData(row, data) {
    if (!data) return;
    
    row.querySelector('.student-name').value = data.name || '';
    
    // Fill Assignment A
    const assignmentAInputs = row.querySelectorAll('.assignment-a');
    if (data.assignmentA) {
        data.assignmentA.forEach((value, index) => {
            if (assignmentAInputs[index]) assignmentAInputs[index].value = value;
        });
    }
    
    // Fill Assignment B
    const assignmentBInputs = row.querySelectorAll('.assignment-b');
    if (data.assignmentB) {
        data.assignmentB.forEach((value, index) => {
            if (assignmentBInputs[index]) assignmentBInputs[index].value = value;
        });
    }
    
    calculateStudentScore(row);
}

function saveData() {
    try {
        const rows = document.querySelectorAll('.student-row');
        const data = Array.from(rows).map(row => ({
            name: row.querySelector('.student-name').value,
            assignmentA: Array.from(row.querySelectorAll('.assignment-a')).map(input => input.value),
            assignmentB: Array.from(row.querySelectorAll('.assignment-b')).map(input => input.value)
        }));
        
        localStorage.setItem('studentScores', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function exportToExcel() {
    const rows = document.querySelectorAll('.student-row');
    const data = [
        // Header row
        [
            'Student Name',
            'A-Research (30%)', 'A-Creativity (20%)', 'A-Type (20%)', 'A-Visual (20%)', 'A-Final (10%)',
            'B-T1-Research (30%)', 'B-T1-Creativity (20%)', 'B-T1-Type (20%)', 'B-T1-Visual (20%)', 'B-T1-Final (10%)',
            'B-T2-Research (30%)', 'B-T2-Creativity (20%)', 'B-T2-Type (20%)', 'B-T2-Visual (20%)', 'B-T2-Final (10%)',
            'Final Score'
        ]
    ];

    rows.forEach(row => {
        const rowData = [
            row.querySelector('.student-name').value,
            // Assignment A scores
            ...Array.from(row.querySelectorAll('.assignment-a')).map(input => input.value),
            // Assignment B scores (both teachers)
            ...Array.from(row.querySelectorAll('.assignment-b')).map(input => input.value),
            // Final score (remove % symbol)
            row.querySelector('.final-score').textContent.replace('%', '')
        ];
        data.push(rowData);
    });

    // Create CSV content
    const csvContent = data.map(row => row.join(',')).join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_scores.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showAlert(message) {
    const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
    document.getElementById('alertMessage').textContent = message;
    alertModal.show();
}

function showConfirm(message, callback) {
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    document.getElementById('confirmMessage').textContent = message;
    
    const confirmBtn = document.getElementById('confirmActionBtn');
    const handleConfirm = () => {
        confirmModal.hide();
        callback();
        confirmBtn.removeEventListener('click', handleConfirm);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    confirmModal.show();
}

function addInputListeners(row) {
    const inputs = row.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const criterion = input.dataset.criterion;
            const value = parseFloat(input.value || 0);
            
            const maxValues = {
                'research': 30,
                'creativity': 20,
                'type': 20,
                'visual': 20,
                'final': 10
            };

            if (value > maxValues[criterion]) {
                showAlert(`Maximum score for ${criterion} is ${maxValues[criterion]}`);
                input.value = maxValues[criterion];
            }

            calculateStudentScore(row);
            saveData();
        });
    });

    const nameInput = row.querySelector('.student-name');
    nameInput.addEventListener('input', () => {
        saveData();
    });
}

function addNewStudent() {
    const newRow = createNewRow();
    document.getElementById('studentTableBody').appendChild(newRow);
    saveData();
}

function addRowEventListeners(row) {
    row.querySelector('.delete-btn').addEventListener('click', function() {
        if (document.querySelectorAll('.student-row').length > 1) {
            row.remove();
            saveData();
        }
    });
}

function calculateStudentScore(row) {
    const assignmentAScore = calculateAssignmentSection(row, '.assignment-a');
    const weightedAssignmentA = assignmentAScore * 0.4;

    const assignmentBInputs = row.querySelectorAll('.assignment-b');
    let teacher1Total = 0;
    let teacher2Total = 0;

    for (let i = 0; i < assignmentBInputs.length; i += 2) {
        teacher1Total += parseFloat(assignmentBInputs[i].value || 0);
        teacher2Total += parseFloat(assignmentBInputs[i + 1].value || 0);
    }

    // Check if scores exceed maximum
    if (assignmentAScore > 100) {
        showAlert('Assignment A total score cannot exceed 100%');
        return;
    }
    if (teacher1Total > 100) {
        showAlert('Teacher 1 total score cannot exceed 100%');
        return;
    }
    if (teacher2Total > 100) {
        showAlert('Teacher 2 total score cannot exceed 100%');
        return;
    }

    const averageBScore = (teacher1Total + teacher2Total) / 2;
    const weightedAssignmentB = averageBScore * 0.6;
    const finalScore = weightedAssignmentA + weightedAssignmentB;
    
    const scoreCell = row.querySelector('.final-score');
    scoreCell.textContent = `${finalScore.toFixed(2)}%`;
    
    if (finalScore >= 80) {
        scoreCell.classList.add('score-high');
        scoreCell.classList.remove('score-medium', 'score-low');
    } else if (finalScore >= 60) {
        scoreCell.classList.add('score-medium');
        scoreCell.classList.remove('score-high', 'score-low');
    } else {
        scoreCell.classList.add('score-low');
        scoreCell.classList.remove('score-high', 'score-medium');
    }
}

function calculateAssignmentSection(row, selector) {
    const inputs = row.querySelectorAll(selector);
    let total = 0;
    
    inputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    return total;
}

function deleteAllStudents() {
    showConfirm('Are you sure you want to delete all students? This cannot be undone.', () => {
        document.getElementById('studentTableBody').innerHTML = '';
        localStorage.removeItem('studentScores');
        addNewStudent();
    });
}

function triggerCsvUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                processCsvData(e.target.result);
            };
            reader.readAsText(file);
        }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function processCsvData(csvContent) {
    const rows = csvContent.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    
    // Skip header row and process data
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = ''; // Clear existing rows
    
    for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (rowData.length < 2) continue; // Skip empty rows
        
        const newRow = createNewRow();
        const studentData = {
            name: rowData[0],
            assignmentA: rowData.slice(1, 6),
            assignmentB: rowData.slice(6, 16)
        };
        
        fillRowData(newRow, studentData);
        tbody.appendChild(newRow);
    }
    
    saveData();
    showAlert('CSV data imported successfully!');
} 