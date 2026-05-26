// ==========================================================================
// Application State & Constants
// ==========================================================================
let expenses = [];
const BUDGET_LIMIT = 1500.00;

// Category Emoji Map for Icons
const CATEGORY_ICONS = {
    food: "🍔",
    shopping: "🛍️",
    utilities: "⚡",
    entertainment: "🎬",
    travel: "✈️",
    others: "📦"
};

const CATEGORY_NAMES = {
    food: "Food & Dining",
    shopping: "Shopping",
    utilities: "Utilities",
    entertainment: "Entertainment",
    travel: "Travel",
    others: "Others"
};

// ==========================================================================
// DOM Element Selectors
// ==========================================================================
const expenseForm = document.getElementById('expense-form');
const titleInput = document.getElementById('expense-title');
const amountInput = document.getElementById('expense-amount');
const categoryInput = document.getElementById('expense-category');
const dateInput = document.getElementById('expense-date');

const totalAmountEl = document.getElementById('total-amount');
const expenseCountIndicatorEl = document.getElementById('expense-count-indicator');
const budgetProgressEl = document.getElementById('budget-progress');
const budgetPercentageEl = document.getElementById('budget-percentage');
const budgetRemainingEl = document.getElementById('budget-remaining');

const searchInput = document.getElementById('search-input');
const filterCategorySelect = document.getElementById('filter-category');
const expenseList = document.getElementById('expense-list');
const emptyState = document.getElementById('empty-state');
const categoryBreakdownContainer = document.getElementById('category-breakdown-container');
const toastContainer = document.getElementById('toast-container');

// ==========================================================================
// Initial Seed Data (if empty)
// ==========================================================================
const SEED_DATA = [
    {
        id: "seed-1",
        title: "Weekly Groceries Supermarket",
        amount: 84.50,
        category: "food",
        date: getFormattedTodayDate(0)
    },
    {
        id: "seed-2",
        title: "Monthly Gym Membership",
        amount: 45.00,
        category: "others",
        date: getFormattedTodayDate(-2)
    },
    {
        id: "seed-3",
        title: "Movie Tickets & Snacks",
        amount: 32.80,
        category: "entertainment",
        date: getFormattedTodayDate(-5)
    }
];

// Helper to get ISO date strings relative to today
function getFormattedTodayDate(daysOffset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

// Helper to format currency values cleanly
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Helper to format date for display
function formatDateDisplay(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    // Adjusting timezone offset to display correct localized date
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localDate.toLocaleDateString('en-US', options);
}

// ==========================================================================
// Storage and Logic Methods
// ==========================================================================

// Load expenses from local storage
function initApp() {
    // Set default date input to today
    dateInput.value = getFormattedTodayDate();

    const storedExpenses = localStorage.getItem('quantum_spend_expenses');
    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
    } else {
        // First run: load seed data
        expenses = [...SEED_DATA];
        saveExpensesToStorage();
        showToast("Welcome! Loaded sample expenses.", "info");
    }

    // Bind event listeners
    expenseForm.addEventListener('submit', handleAddExpense);
    searchInput.addEventListener('input', updateView);
    filterCategorySelect.addEventListener('change', updateView);

    // Initial render
    updateView();
}

// Save to storage
function saveExpensesToStorage() {
    localStorage.setItem('quantum_spend_expenses', JSON.stringify(expenses));
}

// Main logic coordinator to update Dashboard & Lists
function updateView() {
    const total = calculateTotalExpenses();
    updateDashboard(total);
    renderCategoryBreakdown(total);
    renderExpenseList();
}

// Calculates sum of all logged expenses
function calculateTotalExpenses() {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

// Update dashboard display cards
function updateDashboard(total) {
    // 1. Total Spend
    totalAmountEl.textContent = formatCurrency(total);
    expenseCountIndicatorEl.textContent = `${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`;

    // 2. Budget Progress
    const remaining = BUDGET_LIMIT - total;
    budgetRemainingEl.textContent = `${formatCurrency(Math.max(0, remaining))} left`;

    const percentage = Math.min(100, Math.round((total / BUDGET_LIMIT) * 100));
    budgetPercentageEl.textContent = `${percentage}% used`;
    budgetProgressEl.style.width = `${percentage}%`;

    // Visual warnings based on budget threshold
    if (percentage >= 100) {
        budgetProgressEl.className = 'progress-bar warning';
        budgetPercentageEl.style.color = 'var(--accent-red)';
    } else if (percentage >= 80) {
        budgetProgressEl.className = 'progress-bar warning';
        budgetPercentageEl.style.color = '#f59e0b';
    } else {
        budgetProgressEl.className = 'progress-bar';
        budgetPercentageEl.style.color = 'var(--text-muted)';
    }
}

// Generate category spending percentages
function renderCategoryBreakdown(totalSum) {
    categoryBreakdownContainer.innerHTML = '';
    
    if (expenses.length === 0) {
        categoryBreakdownContainer.style.display = 'none';
        return;
    }
    
    categoryBreakdownContainer.style.display = 'flex';

    // Calculate sum per category
    const catSums = {};
    expenses.forEach(item => {
        catSums[item.category] = (catSums[item.category] || 0) + item.amount;
    });

    // Create sorted list of categories by expense size
    const sortedCats = Object.keys(catSums).sort((a, b) => catSums[b] - catSums[a]);

    sortedCats.forEach(cat => {
        const amt = catSums[cat];
        const pct = totalSum > 0 ? Math.round((amt / totalSum) * 100) : 0;
        
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
            <span class="breakdown-label">${CATEGORY_ICONS[cat]} ${CATEGORY_NAMES[cat]}</span>
            <div class="breakdown-progress-container">
                <div class="breakdown-progress-bar" style="width: ${pct}%; background-color: var(--cat-${cat})"></div>
            </div>
            <span class="breakdown-percent">${pct}%</span>
            <span class="breakdown-val">${formatCurrency(amt)}</span>
        `;
        categoryBreakdownContainer.appendChild(row);
    });
}

// Render list of expenses matching filters
function renderExpenseList() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filterCat = filterCategorySelect.value;

    const filtered = expenses.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCat === 'all' || item.category === filterCat;
        return matchesSearch && matchesCategory;
    });

    // Sort items chronologically (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Clear prior list
    expenseList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'flex';
        expenseList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    expenseList.style.display = 'flex';

    filtered.forEach(item => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.dataset.id = item.id;
        li.innerHTML = `
            <div class="expense-details">
                <div class="category-badge badge-${item.category}">
                    ${CATEGORY_ICONS[item.category]}
                </div>
                <div class="item-info">
                    <span class="item-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</span>
                    <div class="item-meta">
                        <span class="item-category-text">${CATEGORY_NAMES[item.category]}</span>
                        <div class="item-meta-separator"></div>
                        <span class="item-date">${formatDateDisplay(item.date)}</span>
                    </div>
                </div>
            </div>
            <div class="expense-amount-action">
                <span class="item-amount">${formatCurrency(item.amount)}</span>
                <button class="btn-delete" title="Delete Expense" aria-label="Delete expense">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </div>
        `;

        // Register Delete Action
        li.querySelector('.btn-delete').addEventListener('click', () => {
            handleDeleteExpense(item.id, li);
        });

        expenseList.appendChild(li);
    });
}

// Escape simple strings to avoid XSS vectors
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
// Event & Form Handlers
// ==========================================================================

function handleAddExpense(e) {
    e.preventDefault();
    
    // Reset validations
    let isValid = true;
    const fields = [
        { el: titleInput, errorEl: document.getElementById('title-error'), validator: (val) => val.trim().length >= 3 },
        { el: amountInput, errorEl: document.getElementById('amount-error'), validator: (val) => !isNaN(val) && parseFloat(val) > 0 },
        { el: categoryInput, errorEl: document.getElementById('category-error'), validator: (val) => val !== "" },
        { el: dateInput, errorEl: document.getElementById('date-error'), validator: (val) => val !== "" }
    ];

    fields.forEach(field => {
        const group = field.el.closest('.form-group');
        if (!field.validator(field.el.value)) {
            group.classList.add('invalid');
            isValid = false;
        } else {
            group.classList.remove('invalid');
        }
    });

    if (!isValid) return;

    // Create expense object
    const newExpense = {
        id: Date.now().toString(),
        title: titleInput.value.trim(),
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value
    };

    expenses.push(newExpense);
    saveExpensesToStorage();
    updateView();

    // Reset Form Input elements
    titleInput.value = '';
    amountInput.value = '';
    categoryInput.value = '';
    dateInput.value = getFormattedTodayDate();

    // Remove any trailing invalid classes on reset
    fields.forEach(f => f.el.closest('.form-group').classList.remove('invalid'));

    showToast("Expense added successfully!", "success");
}

function handleDeleteExpense(id, itemElement) {
    // Add deletion slide animation class
    itemElement.classList.add('deleting');

    // Wait for the slideOutFade animation to finish (400ms)
    itemElement.addEventListener('animationend', () => {
        expenses = expenses.filter(item => item.id !== id);
        saveExpensesToStorage();
        updateView();
        showToast("Expense has been deleted", "danger");
    });
}

// ==========================================================================
// Toast Notification Engine
// ==========================================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSVG = '';
    if (type === 'success') {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'danger') {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSVG}</div>
        <span class="toast-msg">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Fade and slide toast out after 3.2 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3200);
}

// Initialize Application once DOM Content is ready
document.addEventListener('DOMContentLoaded', initApp);
