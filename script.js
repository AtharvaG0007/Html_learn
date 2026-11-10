// Get the page elements that JavaScript needs to update.
const expenseForm = document.getElementById("expenseForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("totalIncome");
const expenseElement = document.getElementById("totalExpense");
const transactionList = document.getElementById("transactionList");
const filterInput = document.getElementById("filter");
const clearButton = document.getElementById("clearButton");
const selectedMonthInput = document.getElementById("selectedMonth");
const budgetForm = document.getElementById("budgetForm");
const budgetAmountInput = document.getElementById("budgetAmount");
const monthlySpentElement = document.getElementById("monthlySpent");
const budgetRemainingElement = document.getElementById("budgetRemaining");
const remainingLabel = document.getElementById("remainingLabel");
const budgetProgress = document.getElementById("budgetProgress");
const budgetProgressTrack = document.getElementById("budgetProgressTrack");
const budgetStatus = document.getElementById("budgetStatus");
const topCategoryElement = document.getElementById("topCategory");
const topCategoryAmount = document.getElementById("topCategoryAmount");
const categoryInsights = document.getElementById("categoryInsights");
const insightMonthLabel = document.getElementById("insightMonthLabel");
const formFeedback = document.getElementById("formFeedback");

// Keep transactions and monthly budgets in separate arrays/objects.
let transactions = [];
let monthlyBudgets = {};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getCurrentMonth() {
  return getLocalDateString().slice(0, 7);
}

dateInput.value = getLocalDateString();
selectedMonthInput.value = getCurrentMonth();

// Load saved data safely. Invalid or old data will not stop the page.
try {
  const savedTransactions = JSON.parse(localStorage.getItem("myTransactions") || "[]");
  if (Array.isArray(savedTransactions)) {
    transactions = savedTransactions
      .filter(item => item && typeof item.description === "string" && typeof item.date === "string")
      .map(item => ({ ...item, amount: Number(item.amount) }))
      .filter(item => Number.isFinite(item.amount) && item.amount > 0 && (item.type === "income" || item.type === "expense"));
  }
} catch (error) {
  transactions = [];
}

try {
  const savedBudgets = JSON.parse(localStorage.getItem("monthlyBudgets") || "{}");
  if (savedBudgets && typeof savedBudgets === "object" && !Array.isArray(savedBudgets)) {
    monthlyBudgets = savedBudgets;
  }
} catch (error) {
  monthlyBudgets = {};
}

function saveTransactions() {
  try {
    localStorage.setItem("myTransactions", JSON.stringify(transactions));
  } catch (error) {
    alert("Your browser could not save this transaction. Please check available storage.");
  }
}

function saveBudgets() {
  try {
    localStorage.setItem("monthlyBudgets", JSON.stringify(monthlyBudgets));
  } catch (error) {
    alert("Your browser could not save this budget. Please check available storage.");
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function getSelectedMonthTransactions() {
  const month = selectedMonthInput.value;
  return transactions.filter(item => item.date.slice(0, 7) === month);
}

function getMonthlyExpenseTotal() {
  return getSelectedMonthTransactions()
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);
}

// Update the three original summary cards.
function updateSummary() {
  const totalIncome = transactions
    .filter(item => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const totalExpense = transactions
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  balanceElement.textContent = formatMoney(totalIncome - totalExpense);
  incomeElement.textContent = formatMoney(totalIncome);
  expenseElement.textContent = formatMoney(totalExpense);
}

// Update budget values and show a warning at 80% or above.
function updateBudget() {
  const month = selectedMonthInput.value;
  const budget = Number(monthlyBudgets[month]) || 0;
  const spent = getMonthlyExpenseTotal();
  const remaining = budget - spent;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  monthlySpentElement.textContent = formatMoney(spent);
  budgetProgress.style.width = Math.min(percentage, 100) + "%";
  budgetProgress.className = "progress-fill";
  budgetProgressTrack.setAttribute("aria-valuenow", String(Math.min(Math.round(percentage), 100)));

  if (budget <= 0) {
    budgetAmountInput.value = "";
    budgetRemainingElement.textContent = "Not set";
    remainingLabel.textContent = "Remaining";
    budgetStatus.textContent = "Set a monthly budget to start tracking your spending.";
    budgetStatus.className = "budget-status";
    budgetProgress.style.width = "0%";
    return;
  }

  budgetAmountInput.value = budget;
  if (remaining >= 0) {
    budgetRemainingElement.textContent = formatMoney(remaining);
    remainingLabel.textContent = "Remaining";
  } else {
    budgetRemainingElement.textContent = formatMoney(Math.abs(remaining));
    remainingLabel.textContent = "Over budget";
  }

  if (percentage >= 100) {
    budgetProgress.classList.add("over-budget");
    budgetStatus.textContent = "Budget exceeded. You have used " + percentage.toFixed(0) + "% of this month's limit.";
    budgetStatus.classList.add("over-budget");
  } else if (percentage >= 80) {
    budgetProgress.classList.add("warning");
    budgetStatus.textContent = "Heads up: you have used " + percentage.toFixed(0) + "% of your monthly budget.";
    budgetStatus.classList.add("warning");
  } else {
    budgetStatus.textContent = "You have used " + percentage.toFixed(0) + "% of your monthly budget. Keep it up!";
    budgetStatus.className = "budget-status";
  }
}

// Show how much of this month's spending belongs to each category.
function updateSpendingInsights() {
  const month = selectedMonthInput.value;
  const monthTransactions = getSelectedMonthTransactions();
  const expenses = monthTransactions.filter(item => item.type === "expense");
  const totalsByCategory = {};

  expenses.forEach(item => {
    const category = item.category || "Other";
    totalsByCategory[category] = (totalsByCategory[category] || 0) + item.amount;
  });

  const categories = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);
  const totalSpent = expenses.reduce((total, item) => total + item.amount, 0);

  if (categories.length === 0) {
    topCategoryElement.textContent = "No spending yet";
    topCategoryAmount.textContent = "Add an expense for this month to see your insights.";
    categoryInsights.innerHTML = '<p class="empty-insight">Your category breakdown will appear here.</p>';
  } else {
    topCategoryElement.textContent = categories[0][0];
    topCategoryAmount.textContent = formatMoney(categories[0][1]) + " spent this month";

    categoryInsights.innerHTML = "";
    categories.forEach(([category, amount]) => {
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      const row = document.createElement("div");
      row.className = "category-row";

      const top = document.createElement("div");
      top.className = "category-row-top";

      const name = document.createElement("span");
      name.textContent = category + " · " + percentage.toFixed(0) + "%";

      const value = document.createElement("strong");
      value.textContent = formatMoney(amount);

      const track = document.createElement("div");
      track.className = "category-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", category + " share of spending");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", String(Math.round(percentage)));

      const fill = document.createElement("div");
      fill.className = "category-fill";
      fill.style.width = percentage + "%";

      top.appendChild(name);
      top.appendChild(value);
      track.appendChild(fill);
      row.appendChild(top);
      row.appendChild(track);
      categoryInsights.appendChild(row);
    });
  }

  const monthDate = new Date(month + "-01T12:00:00");
  insightMonthLabel.textContent = Number.isNaN(monthDate.getTime())
    ? month
    : monthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// Refresh both new features whenever the selected month or transactions change.
function updateMonthlyFeatures() {
  updateBudget();
  updateSpendingInsights();
}

// Create and display the transaction list.
function showTransactions() {
  transactionList.innerHTML = "";
  const selectedFilter = filterInput.value;
  let visibleCount = 0;

  for (let i = transactions.length - 1; i >= 0; i--) {
    const item = transactions[i];
    if (selectedFilter !== "all" && item.type !== selectedFilter) continue;

    visibleCount++;
    const row = document.createElement("div");
    row.className = "transaction-row";

    const details = document.createElement("div");
    details.className = "transaction-details-wrap";

    const name = document.createElement("div");
    name.className = "transaction-name";
    name.textContent = item.description;

    const information = document.createElement("div");
    information.className = "transaction-details";
    information.textContent = (item.category || "Other") + " • " + item.date;

    details.appendChild(name);
    details.appendChild(information);

    const rightSide = document.createElement("div");
    rightSide.className = "transaction-right";

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    if (item.type === "income") {
      amount.style.color = "#159b72";
      amount.textContent = "+ " + formatMoney(item.amount);
    } else {
      amount.style.color = "#e05b67";
      amount.textContent = "- " + formatMoney(item.amount);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";
    deleteButton.dataset.index = i;
    deleteButton.setAttribute("aria-label", "Delete " + item.description);

    rightSide.appendChild(amount);
    rightSide.appendChild(deleteButton);
    row.appendChild(details);
    row.appendChild(rightSide);
    transactionList.appendChild(row);
  }

  if (visibleCount === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No transactions found. Add your first one!";
    transactionList.appendChild(message);
  }
}

// Save a new transaction after validating the form.
expenseForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
    formFeedback.textContent = "Please enter a valid description, amount and date.";
    return;
  }

  transactions.push({ description, amount, type, category, date });
  saveTransactions();
  updateSummary();
  updateMonthlyFeatures();
  showTransactions();

  expenseForm.reset();
  dateInput.value = getLocalDateString();
  formFeedback.textContent = "Transaction added successfully.";
});

budgetForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const month = selectedMonthInput.value;
  const budget = Number(budgetAmountInput.value);

  if (!month || !Number.isFinite(budget) || budget <= 0) {
    alert("Please choose a month and enter a budget greater than zero.");
    return;
  }

  monthlyBudgets[month] = budget;
  saveBudgets();
  updateBudget();
});

// When a different month is selected, show that month's budget and insights.
selectedMonthInput.addEventListener("change", updateMonthlyFeatures);

// Delete a transaction and refresh every calculation.
transactionList.addEventListener("click", function(event) {
  if (event.target.classList.contains("delete-button")) {
    const index = Number(event.target.dataset.index);
    if (Number.isInteger(index) && index >= 0 && index < transactions.length &&
        confirm("Do you want to delete this transaction?")) {
      transactions.splice(index, 1);
      saveTransactions();
      updateSummary();
      updateMonthlyFeatures();
      showTransactions();
    }
  }
});

filterInput.addEventListener("change", showTransactions);

clearButton.addEventListener("click", function() {
  if (transactions.length === 0) {
    alert("There are no transactions to clear.");
    return;
  }

  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    saveTransactions();
    updateSummary();
    updateMonthlyFeatures();
    showTransactions();
  }
});

// First page load.
updateSummary();
updateMonthlyFeatures();
showTransactions();