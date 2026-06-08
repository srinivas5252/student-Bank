// ==========================================================================
// DOM Elements Selection
// ==========================================================================
const docHtml = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');
const adminViewBtn = document.getElementById('admin-view-btn');
const backToFormBtn = document.getElementById('back-to-form-btn');

const formSection = document.getElementById('form-section');
const adminSection = document.getElementById('admin-section');

// Form Fields
const form = document.getElementById('bank-details-form');
const studentNameInput = document.getElementById('student-name');
const mobileNumberInput = document.getElementById('mobile-number');
const bankNameSelect = document.getElementById('bank-name');
const customBankGroup = document.getElementById('custom-bank-group');
const customBankInput = document.getElementById('custom-bank-name');
const accountNumberInput = document.getElementById('account-number');
const confirmAccountInput = document.getElementById('confirm-account-number');
const toggleAccountVisBtn = document.getElementById('toggle-account-vis');
const ifscCodeInput = document.getElementById('ifsc-code');
const termsCheckbox = document.getElementById('terms-agree');
const formProgressBar = document.getElementById('form-progress');
const progressPercent = document.getElementById('progress-percent');

// Modals
const successModal = document.getElementById('success-modal');
const pinModal = document.getElementById('pin-modal');
const pinForm = document.getElementById('pin-form');
const adminPinInput = document.getElementById('admin-pin');
const closePinModalBtn = document.getElementById('close-pin-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const downloadReceiptBtn = document.getElementById('download-receipt-btn');

// Receipt Elements
const receiptIdSpan = document.getElementById('receipt-id');
const receiptNameSpan = document.getElementById('receipt-name');
const receiptMobileSpan = document.getElementById('receipt-mobile');
const receiptBankSpan = document.getElementById('receipt-bank');
const receiptAccountSpan = document.getElementById('receipt-account');
const receiptIfscSpan = document.getElementById('receipt-ifsc');
const receiptTimeSpan = document.getElementById('receipt-time');

// Admin Elements
const searchInput = document.getElementById('admin-search-input');
const bankFilterSelect = document.getElementById('bank-filter');
const tableBody = document.getElementById('table-body');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// Stats Counters
const statTotalSpan = document.getElementById('stat-total-submissions');
const statBanksSpan = document.getElementById('stat-unique-banks');
const statTodaySpan = document.getElementById('stat-recent-today');

// Toast Notification Container
const toastContainer = document.getElementById('toast-container');

// State Variables
let submissions = JSON.parse(localStorage.getItem('student_bank_details')) || [];
let activeReceipt = null;

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-content">${message}</div>
        <button class="toast-close-btn" aria-label="Close message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Close button event
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto dismiss
    setTimeout(() => {
        removeToast(toast);
    }, 4500);
}

function removeToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

// ==========================================================================
// Theme Management (LocalStorage persisted)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    docHtml.setAttribute('data-theme', savedTheme);
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = docHtml.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    docHtml.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
});

// ==========================================================================
// Real-Time Form Validation
// ==========================================================================
const validationRules = {
    studentName: (val) => {
        const cleaned = val.trim();
        return cleaned.length >= 3 && /^[A-Za-z\s]+$/.test(cleaned);
    },
    mobileNumber: (val) => {
        return /^[0-9]{10}$/.test(val);
    },
    bankName: (val) => {
        return val !== "" && val !== null;
    },
    customBankName: (val) => {
        if (bankNameSelect.value === 'other') {
            return val.trim().length >= 2;
        }
        return true;
    },
    accountNumber: (val) => {
        return /^[0-9]{9,18}$/.test(val);
    },
    confirmAccountNumber: (val) => {
        return val === accountNumberInput.value && val.length > 0;
    },
    ifscCode: (val) => {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val.toUpperCase());
    },
    termsAgree: () => {
        return termsCheckbox.checked;
    }
};

// Toggle Custom Bank Input field
bankNameSelect.addEventListener('change', () => {
    if (bankNameSelect.value === 'other') {
        customBankGroup.classList.remove('hidden');
        customBankInput.setAttribute('required', 'true');
    } else {
        customBankGroup.classList.add('hidden');
        customBankInput.removeAttribute('required');
        customBankInput.value = '';
        clearValidationState(customBankInput);
    }
    validateField(bankNameSelect);
    calculateProgress();
});

// Convert IFSC Code to Uppercase automatically
ifscCodeInput.addEventListener('input', () => {
    ifscCodeInput.value = ifscCodeInput.value.toUpperCase();
});

// Account Number visibility toggle
toggleAccountVisBtn.addEventListener('click', () => {
    const isPassword = accountNumberInput.type === 'password';
    accountNumberInput.type = isPassword ? 'text' : 'password';
    
    const eyeOff = toggleAccountVisBtn.querySelector('.eye-off');
    const eyeOn = toggleAccountVisBtn.querySelector('.eye-on');

    if (isPassword) {
        eyeOff.classList.add('hidden');
        eyeOn.classList.remove('hidden');
    } else {
        eyeOff.classList.remove('hidden');
        eyeOn.classList.add('hidden');
    }
});

// Field Helper functions
function validateField(element) {
    const fieldName = element.name || element.id;
    let isValid = false;

    if (element === termsCheckbox) {
        isValid = validationRules.termsAgree();
    } else {
        isValid = validationRules[fieldName] ? validationRules[fieldName](element.value) : true;
    }

    const group = element.closest('.form-group');
    if (!group) return isValid;

    if (element.value === "" && element !== termsCheckbox) {
        clearValidationState(element);
    } else if (isValid) {
        group.classList.remove('has-error');
        group.classList.add('has-success');
    } else {
        group.classList.remove('has-success');
        group.classList.add('has-error');
    }

    return isValid;
}

function clearValidationState(element) {
    const group = element.closest('.form-group');
    if (group) {
        group.classList.remove('has-error');
        group.classList.remove('has-success');
    }
}

// Attach listeners for validation
const inputsToValidate = [
    studentNameInput,
    mobileNumberInput,
    customBankInput,
    accountNumberInput,
    confirmAccountInput,
    ifscCodeInput
];

inputsToValidate.forEach(input => {
    input.addEventListener('input', () => {
        validateField(input);
        if (input === accountNumberInput && confirmAccountInput.value !== "") {
            validateField(confirmAccountInput);
        }
        calculateProgress();
    });

    input.addEventListener('blur', () => {
        validateField(input);
    });
});

termsCheckbox.addEventListener('change', () => {
    validateField(termsCheckbox);
    calculateProgress();
});

// Calculate and Update Progress Bar
function calculateProgress() {
    let fieldsCount = 7; // Total validation points
    let validFields = 0;

    if (validationRules.studentName(studentNameInput.value)) validFields++;
    if (validationRules.mobileNumber(mobileNumberInput.value)) validFields++;
    
    if (bankNameSelect.value !== "") {
        if (bankNameSelect.value === 'other') {
            if (validationRules.customBankName(customBankInput.value)) {
                validFields++;
            }
        } else {
            validFields++;
        }
    }
    
    if (validationRules.accountNumber(accountNumberInput.value)) validFields++;
    if (validationRules.confirmAccountNumber(confirmAccountInput.value)) validFields++;
    if (validationRules.ifscCode(ifscCodeInput.value)) validFields++;
    if (validationRules.termsAgree()) validFields++;

    const percent = Math.round((validFields / fieldsCount) * 100);
    formProgressBar.style.width = `${percent}%`;
    progressPercent.innerText = `${percent}%`;
}

// Form Submit Handling
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateField(studentNameInput);
    const isMobileValid = validateField(mobileNumberInput);
    const isBankValid = validateField(bankNameSelect);
    const isCustomBankValid = validateField(customBankInput);
    const isAccountValid = validateField(accountNumberInput);
    const isConfirmValid = validateField(confirmAccountInput);
    const isIfscValid = validateField(ifscCodeInput);
    const isTermsValid = validateField(termsCheckbox);

    const isFormValid = isNameValid && isMobileValid && isBankValid && 
                        isCustomBankValid && isAccountValid && isConfirmValid && 
                        isIfscValid && isTermsValid;

    if (!isFormValid) {
        showToast('Please fix the errors in the form before submitting.', 'danger');
        
        // Find the first error group and shake it
        const firstError = form.querySelector('.has-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.classList.add('shake');
            setTimeout(() => {
                firstError.classList.remove('shake');
            }, 500);
        }
        return;
    }

    // Save record to local storage
    const subId = 'SUB-' + Math.floor(10000 + Math.random() * 90000);
    const selectedBankName = bankNameSelect.value === 'other' ? customBankInput.value.trim() : bankNameSelect.value;
    
    const newSubmission = {
        id: subId,
        studentName: studentNameInput.value.trim(),
        mobileNumber: mobileNumberInput.value.trim(),
        bankName: selectedBankName,
        accountNumber: accountNumberInput.value.trim(),
        ifscCode: ifscCodeInput.value.toUpperCase().trim(),
        timestamp: new Date().toISOString()
    };

    submissions.push(newSubmission);
    localStorage.setItem('student_bank_details', JSON.stringify(submissions));

    // Setup Receipt preview fields
    activeReceipt = newSubmission;
    receiptIdSpan.innerText = `ID: ${newSubmission.id}`;
    receiptNameSpan.innerText = newSubmission.studentName;
    receiptMobileSpan.innerText = '+91 ' + newSubmission.mobileNumber;
    receiptBankSpan.innerText = newSubmission.bankName;
    
    // Mask account number for security: show only last 4 digits
    const acc = newSubmission.accountNumber;
    receiptAccountSpan.innerText = '•'.repeat(acc.length - 4) + acc.slice(-4);
    
    receiptIfscSpan.innerText = newSubmission.ifscCode;
    receiptTimeSpan.innerText = new Date(newSubmission.timestamp).toLocaleString();

    // Reset Form Fields
    form.reset();
    customBankGroup.classList.add('hidden');
    customBankInput.removeAttribute('required');
    
    // Clear validation outlines
    inputsToValidate.forEach(input => clearValidationState(input));
    clearValidationState(bankNameSelect);
    clearValidationState(termsCheckbox);
    calculateProgress();

    // Show Success Modal
    successModal.classList.add('active');
    showToast('Bank details submitted successfully!', 'success');
});

// Close Success Modal
closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    activeReceipt = null;
});

// ==========================================================================
// Receipt Downloader
// ==========================================================================
downloadReceiptBtn.addEventListener('click', () => {
    if (!activeReceipt) return;

    const receiptContent = `================================================
           EDUPAY SCHOLARSHIP PORTAL
              SUBMISSION RECEIPT
================================================
Submission ID:  ${activeReceipt.id}
Student Name:   ${activeReceipt.studentName}
Mobile Number:  +91 ${activeReceipt.mobileNumber}
Bank Name:      ${activeReceipt.bankName}
Account Number: ${'•'.repeat(activeReceipt.accountNumber.length - 4) + activeReceipt.accountNumber.slice(-4)}
IFSC Code:      ${activeReceipt.ifscCode}
Submitted At:   ${new Date(activeReceipt.timestamp).toLocaleString()}
================================================
Status: REGISTERED AND SECURED IN DATABASE
Note: Keep this receipt for scholarship verifications.
================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${activeReceipt.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Receipt download started', 'success');
});

// ==========================================================================
// Admin Navigation (PIN security)
// ==========================================================================
adminViewBtn.addEventListener('click', () => {
    // If PIN verified recently in session, bypass
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
        navigateToAdmin();
    } else {
        pinModal.classList.add('active');
        adminPinInput.value = '';
        adminPinInput.focus();
    }
});

closePinModalBtn.addEventListener('click', () => {
    pinModal.classList.remove('active');
});

pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = adminPinInput.value;

    if (enteredPin === '1234') {
        sessionStorage.setItem('admin_authenticated', 'true');
        pinModal.classList.remove('active');
        navigateToAdmin();
        showToast('Administrative access granted.', 'success');
    } else {
        const group = adminPinInput.closest('.form-group');
        group.classList.add('has-error');
        adminPinInput.classList.add('shake');
        
        setTimeout(() => {
            adminPinInput.classList.remove('shake');
        }, 500);
        
        adminPinInput.value = '';
        adminPinInput.focus();
    }
});

// Reset error when user starts typing pin again
adminPinInput.addEventListener('input', () => {
    const group = adminPinInput.closest('.form-group');
    group.classList.remove('has-error');
});

function navigateToAdmin() {
    formSection.classList.remove('active');
    adminSection.classList.add('active');
    adminViewBtn.classList.add('hidden');
    renderAdminDashboard();
}

backToFormBtn.addEventListener('click', () => {
    adminSection.classList.remove('active');
    formSection.classList.add('active');
    adminViewBtn.classList.remove('hidden');
});

// ==========================================================================
// Admin Dashboard Logic
// ==========================================================================
function renderAdminDashboard() {
    updateStatistics();
    populateBankFilter();
    renderTableRows();
}

function updateStatistics() {
    statTotalSpan.innerText = submissions.length;

    // Unique Banks
    const banksSet = new Set(submissions.map(sub => sub.bankName.trim()));
    statBanksSpan.innerText = banksSet.has("") || banksSet.size === 0 ? 0 : banksSet.size;

    // Today's Submissions
    const todayStr = new Date().toDateString();
    const todaySubmissions = submissions.filter(sub => {
        return new Date(sub.timestamp).toDateString() === todayStr;
    });
    statTodaySpan.innerText = todaySubmissions.length;
}

function populateBankFilter() {
    // Keep current selection
    const currentSelection = bankFilterSelect.value;
    
    // Clear all except the first "All Banks"
    bankFilterSelect.innerHTML = '<option value="">All Banks</option>';
    
    const uniqueBanks = [...new Set(submissions.map(sub => sub.bankName))].sort();
    
    uniqueBanks.forEach(bank => {
        if (bank) {
            const opt = document.createElement('option');
            opt.value = bank;
            opt.innerText = bank;
            bankFilterSelect.appendChild(opt);
        }
    });

    bankFilterSelect.value = currentSelection;
}

function renderTableRows() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const bankFilter = bankFilterSelect.value;

    const filtered = submissions.filter(sub => {
        const matchesSearch = 
            sub.studentName.toLowerCase().includes(searchQuery) ||
            sub.mobileNumber.includes(searchQuery) ||
            sub.bankName.toLowerCase().includes(searchQuery) ||
            sub.accountNumber.includes(searchQuery) ||
            sub.ifscCode.toLowerCase().includes(searchQuery);

        const matchesBank = bankFilter === "" || sub.bankName === bankFilter;

        return matchesSearch && matchesBank;
    });

    // Clear Table
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center empty-state">No matching records found.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(sub => {
        const tr = document.createElement('tr');
        
        const dateFormatted = new Date(sub.timestamp).toLocaleString();
        
        // Hide account number prefix (e.g. ••••••••1234) for display privacy
        const maskedAccount = '•'.repeat(sub.accountNumber.length - 4) + sub.accountNumber.slice(-4);

        tr.innerHTML = `
            <td><strong>${escapeHTML(sub.studentName)}</strong></td>
            <td>+91 ${escapeHTML(sub.mobileNumber)}</td>
            <td>${escapeHTML(sub.bankName)}</td>
            <td title="Actual account number encrypted">${maskedAccount}</td>
            <td><code>${escapeHTML(sub.ifscCode)}</code></td>
            <td style="font-size:0.8rem; color:var(--text-secondary);">${dateFormatted}</td>
            <td class="text-center">
                <button class="action-icon-btn delete-btn" data-id="${sub.id}" title="Delete Record">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    // Attach row delete actions
    const deleteBtns = tableBody.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deleteRecord(id);
        });
    });
}

// Delete Record helper
function deleteRecord(id) {
    if (confirm(`Are you sure you want to delete submission ${id}?`)) {
        submissions = submissions.filter(sub => sub.id !== id);
        localStorage.setItem('student_bank_details', JSON.stringify(submissions));
        showToast(`Record ${id} deleted successfully.`, 'info');
        renderAdminDashboard();
    }
}

// Clear all database submissions
clearAllBtn.addEventListener('click', () => {
    if (submissions.length === 0) {
        showToast('Database is already empty.', 'info');
        return;
    }

    if (confirm('CRITICAL ACTION: Are you sure you want to delete ALL student bank details? This action cannot be undone.')) {
        submissions = [];
        localStorage.setItem('student_bank_details', JSON.stringify(submissions));
        showToast('All database records cleared.', 'danger');
        renderAdminDashboard();
    }
});

// Search & Filter event bindings
searchInput.addEventListener('input', renderTableRows);
bankFilterSelect.addEventListener('change', renderTableRows);

// Escape HTML entities to prevent XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==========================================================================
// Exports Handler (CSV & JSON)
// ==========================================================================
exportCsvBtn.addEventListener('click', () => {
    if (submissions.length === 0) {
        showToast('No submission records found to export.', 'danger');
        return;
    }

    // CSV Headers
    let csvContent = 'Submission ID,Student Name,Mobile Number,Bank Name,Account Number,IFSC Code,Submitted Timestamp\n';
    
    submissions.forEach(sub => {
        // Wrap fields in double quotes to handle commas safely
        const row = [
            `"${sub.id}"`,
            `"${sub.studentName.replace(/"/g, '""')}"`,
            `"${sub.mobileNumber}"`,
            `"${sub.bankName.replace(/"/g, '""')}"`,
            `"${sub.accountNumber}"`,
            `"${sub.ifscCode}"`,
            `"${sub.timestamp}"`
        ];
        csvContent += row.join(',') + '\n';
    });

    triggerFileDownload(csvContent, 'student_bank_details.csv', 'text/csv');
    showToast('Submissions CSV downloaded.', 'success');
});

exportJsonBtn.addEventListener('click', () => {
    if (submissions.length === 0) {
        showToast('No submission records found to export.', 'danger');
        return;
    }

    const jsonContent = JSON.stringify(submissions, null, 2);
    triggerFileDownload(jsonContent, 'student_bank_details.json', 'application/json');
    showToast('Submissions JSON downloaded.', 'success');
});

function triggerFileDownload(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    calculateProgress();
});
