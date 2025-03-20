const expenseForm = document.getElementById('expense-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const expenseList = document.getElementById('expense-list');
const emptyState = document.getElementById('empty-state');
const filterSelect = document.getElementById('filter-select');
const sortSelect = document.getElementById('sort-select');
const totalAmountEl = document.getElementById('total-amount');
const monthAmountEl = document.getElementById('month-amount');
const dailyAmountEl = document.getElementById('daily-amount');
const addFirstExpenseBtn = document.getElementById('add-first-expense');
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const toast = document.getElementById('toast');
const toastMessage = document.querySelector('.toast-message');

// FOR Error 
const descriptionError = document.getElementById('description-error');
const amountError = document.getElementById('amount-error');
const dateError = document.getElementById('date-error');
const categoryError = document.getElementById('category-error');

// Constants
const STORAGE_KEY = 'expenses';
const CATEGORIES = {
  food: { label: 'Food & Dining', class: 'category-food' },
  transportation: { label: 'Transportation', class: 'category-transportation' },
  housing: { label: 'Housing', class: 'category-housing' },
  entertainment: { label: 'Entertainment', class: 'category-entertainment' },
  utilities: { label: 'Utilities', class: 'category-utilities' },
  healthcare: { label: 'Healthcare', class: 'category-healthcare' },
  shopping: { label: 'Shopping', class: 'category-shopping' },
  other: { label: 'Other', class: 'category-other' }
};

// State
let expenses = [];
let filterCategory = 'all';
let sortOption = 'date-desc';
let expenseToDelete = null;

// Initialize the app
function init() {
  // Set today's date as default
  dateInput.value = getTodayDateString();

  // Load expenses from local storage
  loadExpenses();
  
  // Update UI
  updateUI();
  
  // Event listeners
  expenseForm.addEventListener('submit', handleFormSubmit);
  filterSelect.addEventListener('change', handleFilterChange);
  sortSelect.addEventListener('change', handleSortChange);
  addFirstExpenseBtn.addEventListener('click', focusExpenseForm);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', confirmDelete);
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadExpenses() {
  try {
    const storedExpenses = localStorage.getItem(STORAGE_KEY);
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
  } catch (error) {
    console.error('Failed to load expenses from localStorage:', error);
    expenses = [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses to localStorage:', error);
    showToast('Error saving expenses to storage', true);
  }
}

function addExpense(expenseData) {
  const newExpense = {
    ...expenseData,
    id: Date.now() 
  };
  
  expenses.push(newExpense);
  saveExpenses();
  updateUI();
  showToast('Expense added successfully!');
  
  return newExpense;
}

function deleteExpense(id) {
  expenses = expenses.filter(expense => expense.id !== id);
  saveExpenses();
  updateUI();
  showToast('Expense deleted successfully!');
}

function filterAndSortExpenses() {
  // Filter expenses
  let filteredExpenses = expenses;
  if (filterCategory !== 'all') {
    filteredExpenses = expenses.filter(expense => expense.category === filterCategory);
  }
  
  // Sort expenses
  return [...filteredExpenses].sort((a, b) => {
    switch (sortOption) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
}

// Calculate summary data
function calculateSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  
  const monthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate average daily expense for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth = Math.min(now.getDate(), daysInMonth);
  const averagePerDay = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0;
  
  return {
    total,
    monthTotal,
    averagePerDay
  };
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Update UI based on current state
function updateUI() {
  updateExpenseList();
  updateSummary();
}

// Update the expense list UI
function updateExpenseList() {
  const filteredExpenses = filterAndSortExpenses();
  
  // Clear the list first
  // Keep the empty state but hide/show based on if we have expenses
  expenseList.querySelectorAll('.expense-item').forEach(item => item.remove());
  
  if (filteredExpenses.length > 0) {
    emptyState.style.display = 'none';
    
    // Add expenses to the list
    filteredExpenses.forEach(expense => {
      const expenseEl = document.createElement('div');
      expenseEl.className = 'expense-item';
      
      const categoryInfo = CATEGORIES[expense.category] || CATEGORIES.other;
      
      expenseEl.innerHTML = `
        <div class="expense-details">
          <h4>${expense.description}</h4>
          <div class="expense-meta">
            <span class="category-badge ${categoryInfo.class}">${categoryInfo.label}</span>
            <span>${formatDate(expense.date)}</span>
          </div>
        </div>
        <div class="expense-actions">
          <span class="expense-amount">${formatCurrency(expense.amount)}</span>
          <button class="delete-btn" data-id="${expense.id}">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      `;
      
      // Add event listener for delete button
      expenseEl.querySelector('.delete-btn').addEventListener('click', function() {
        expenseToDelete = expense.id;
        openDeleteModal();
      });
      
      expenseList.insertBefore(expenseEl, emptyState);
    });
  } else {
    emptyState.style.display = 'block';
  }
}

// Update the summary UI
function updateSummary() {
  const summary = calculateSummary();
  
  totalAmountEl.textContent = formatCurrency(summary.total);
  monthAmountEl.textContent = formatCurrency(summary.monthTotal);
  dailyAmountEl.textContent = formatCurrency(summary.averagePerDay);
}

// Event Handlers
function handleFormSubmit(e) {
  e.preventDefault();
  
  // Reset error messages
  descriptionError.textContent = '';
  amountError.textContent = '';
  dateError.textContent = '';
  categoryError.textContent = '';
  
  // Validate form inputs
  let isValid = true;
  
  if (!descriptionInput.value.trim()) {
    descriptionError.textContent = 'Description is required';
    isValid = false;
  }
  
  if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
    amountError.textContent = 'Amount must be greater than 0';
    isValid = false;
  }
  
  if (!dateInput.value) {
    dateError.textContent = 'Date is required';
    isValid = false;
  }
  
  if (!categoryInput.value) {
    categoryError.textContent = 'Category is required';
    isValid = false;
  }
  
  if (!isValid) return;
  
  // Create expense object
  const expense = {
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    date: dateInput.value,
    category: categoryInput.value
  };
  
  // Add expense
  addExpense(expense);
  
  // Reset form
  expenseForm.reset();
  dateInput.value = getTodayDateString();
  categoryInput.value = 'food';
}

function handleFilterChange(e) {
  filterCategory = e.target.value;
  updateUI();
}

function handleSortChange(e) {
  sortOption = e.target.value;
  updateUI();
}

function focusExpenseForm() {
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  descriptionInput.focus();
}

// Modal functionality
function openDeleteModal() {
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  expenseToDelete = null;
}

function confirmDelete() {
  if (expenseToDelete !== null) {
    deleteExpense(expenseToDelete);
    closeDeleteModal();
  }
}

// Toast notification
function showToast(message, isError = false) {
  const toastContent = document.querySelector('.toast-content');
  
  if (isError) {
    toastContent.classList.add('error');
  } else {
    toastContent.classList.remove('error');
  }
  
  toastMessage.textContent = message;
  toast.classList.add('active');
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Initialize the app
init();