// Select the HTML elements used by the app.
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

// Use the local date so the date input does not shift because of UTC.
const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");
dateInput.value = localDate;
selectedMonthInput.value = localDate.slice(0, 7);

// Load saved transactions and budgets without crashing if storage is invalid.
let transactions = [];
let monthlyBudgets = {};

try {
  const saved = JSON.parse(localStorage.getItem("myTransactions") || "[]");
  if (Array.isArray(saved)) {
    transactions = saved
      .filter(item => item && typeof item.description === "string" &&
        typeof item.date === "string" && (item.type === "income" || item.type === "expense"))
      .map(item => ({ ...item, amount: Number(item.amount) }))
      .filter(item => Number.isFinite(item.amount) && item.amount > 0);
  }
} catch (error) {
  transactions = [];
}

try {
  const saved = JSON.parse(localStorage.getItem("monthlyBudgets") || "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    monthlyBudgets = Object.fromEntries(
      Object.entries(saved).filter(([month, amount]) =>
        /^\d{4}-\d{2}$/.test(month) && Number.isFinite(Number(amount)) && Number(amount) > 0)
        .map(([month, amount]) => [month, Number(amount)])
    );
  }
} catch (error) {
  monthlyBudgets = {};
}

// Save both sets of data together.
function saveData() {
  try {
    localStorage.setItem("myTransactions", JSON.stringify(transactions));
    localStorage.setItem("monthlyBudgets", JSON.stringify(monthlyBudgets));
  } catch (error) {
    alert("Your browser could not save the changes. Please check available storage.");
  }
}

// Format all amounts as Indian Rupees.
function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);
}

// Update the balance, income and expense cards.
function updateSummary() {
  let income = 0;
  let expenses = 0;

  transactions.forEach(item => {
    if (item.type === "income") income += item.amount;
    else expenses += item.amount;
  });

  balanceElement.textContent = formatMoney(income - expenses);
  incomeElement.textContent = formatMoney(income);
  expenseElement.textContent = formatMoney(expenses);
}

// Update the selected month's budget and category insights.
function updateMonthly() {
  const month = selectedMonthInput.value;
  const monthItems = transactions.filter(item => item.date.slice(0, 7) === month);
  const expenses = monthItems.filter(item => item.type === "expense");
  const spent = expenses.reduce((total, item) => total + item.amount, 0);
  const budget = monthlyBudgets[month] || 0;
  const remaining = budget - spent;
  const percentage = budget ? (spent / budget) * 100 : 0;
  const progress = Math.min(percentage, 100);

  // Budget details and progress bar.
  monthlySpentElement.textContent = formatMoney(spent);
  budgetProgress.style.width = progress + "%";
  budgetProgress.className = "progress-fill";
  budgetProgressTrack.setAttribute("aria-valuenow", String(Math.round(progress)));

  if (!budget) {
    budgetAmountInput.value = "";
    budgetRemainingElement.textContent = "Not set";
    remainingLabel.textContent = "Remaining";
    budgetStatus.textContent = "Set a monthly budget to start tracking your spending.";
    budgetStatus.className = "budget-status";
  } else {
    budgetAmountInput.value = budget;
    budgetRemainingElement.textContent = formatMoney(Math.abs(remaining));
    remainingLabel.textContent = remaining < 0 ? "Over budget" : "Remaining";

    if (percentage >= 100) {
      budgetProgress.classList.add("over-budget");
      budgetStatus.textContent = "Budget exceeded. You have used " + percentage.toFixed(0) + "% of this month's limit.";
      budgetStatus.className = "budget-status over-budget";
    } else if (percentage >= 80) {
      budgetProgress.classList.add("warning");
      budgetStatus.textContent = "Heads up: you have used " + percentage.toFixed(0) + "% of your monthly budget.";
      budgetStatus.className = "budget-status warning";
    } else {
      budgetStatus.textContent = "You have used " + percentage.toFixed(0) + "% of your monthly budget. Keep it up!";
      budgetStatus.className = "budget-status";
    }
  }

  // Add up expenses by category.
  const categoryTotals = {};
  expenses.forEach(item => {
    const category = item.category || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + item.amount;
  });

  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  topCategoryElement.textContent = categories.length ? categories[0][0] : "No spending yet";
  topCategoryAmount.textContent = categories.length
    ? formatMoney(categories[0][1]) + " spent this month"
    : "Add an expense for this month to see your insights.";

  categoryInsights.innerHTML = "";
  if (!categories.length) {
    categoryInsights.innerHTML = '<p class="empty-insight">Your category breakdown will appear here.</p>';
  } else {
    categories.forEach(([category, amount]) => {
      const share = (amount / spent) * 100;
      const row = document.createElement("div");
      row.className = "category-row";

      const heading = document.createElement("div");
      heading.className = "category-row-top";
      const name = document.createElement("span");
      name.textContent = category + " · " + share.toFixed(0) + "%";
      const value = document.createElement("strong");
      value.textContent = formatMoney(amount);
      heading.append(name, value);

      const track = document.createElement("div");
      track.className = "category-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", category + " share of spending");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", String(Math.round(share)));

      const fill = document.createElement("div");
      fill.className = "category-fill";
      fill.style.width = share + "%";
      track.appendChild(fill);
      row.append(heading, track);
      categoryInsights.appendChild(row);
    });
  }

  const monthDate = new Date(month + "-01T12:00:00");
  insightMonthLabel.textContent = Number.isNaN(monthDate.getTime())
    ? month
    : monthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// Render transactions newest first and apply the selected filter.
function showTransactions() {
  transactionList.innerHTML = "";
  let count = 0;

  for (let i = transactions.length - 1; i >= 0; i--) {
    const item = transactions[i];
    if (filterInput.value !== "all" && item.type !== filterInput.value) continue;
    count++;

    const row = document.createElement("div");
    row.className = "transaction-row";

    const details = document.createElement("div");
    details.className = "transaction-details-wrap";
    const name = document.createElement("div");
    name.className = "transaction-name";
    name.textContent = item.description;
    const info = document.createElement("div");
    info.className = "transaction-details";
    info.textContent = (item.category || "Other") + " • " + item.date;
    details.append(name, info);

    const right = document.createElement("div");
    right.className = "transaction-right";
    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.style.color = item.type === "income" ? "#159b72" : "#e05b67";
    amount.textContent = (item.type === "income" ? "+ " : "- ") + formatMoney(item.amount);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Delete";
    remove.dataset.index = i;
    remove.setAttribute("aria-label", "Delete " + item.description);
    right.append(amount, remove);
    row.append(details, right);
    transactionList.appendChild(row);
  }

  if (!count) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No transactions found. Add your first one!";
    transactionList.appendChild(message);
  }
}

// Refresh every section that depends on transaction data.
function refresh() {
  updateSummary();
  updateMonthly();
  showTransactions();
}

// Add a transaction.
expenseForm.addEventListener("submit", event => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
    formFeedback.textContent = "Please enter a valid description, amount and date.";
    return;
  }

  transactions.push({
    description,
    amount,
    type: typeInput.value,
    category: categoryInput.value,
    date
  });

  saveData();
  refresh();
  expenseForm.reset();
  dateInput.value = localDate;
  formFeedback.textContent = "Transaction added successfully.";
});

// Save a separate budget for the selected month.
budgetForm.addEventListener("submit", event => {
  event.preventDefault();
  const month = selectedMonthInput.value;
  const budget = Number(budgetAmountInput.value);

  if (!month || !Number.isFinite(budget) || budget <= 0) {
    alert("Please choose a month and enter a budget greater than zero.");
    return;
  }

  monthlyBudgets[month] = budget;
  saveData();
  updateMonthly();
});

selectedMonthInput.addEventListener("change", updateMonthly);
filterInput.addEventListener("change", showTransactions);

// Delete a transaction using its current list index.
transactionList.addEventListener("click", event => {
  if (!event.target.classList.contains("delete-button")) return;

  const index = Number(event.target.dataset.index);
  if (Number.isInteger(index) && index >= 0 && index < transactions.length &&
      confirm("Do you want to delete this transaction?")) {
    transactions.splice(index, 1);
    saveData();
    refresh();
  }
});

// Clear all transactions but keep the saved monthly budgets.
clearButton.addEventListener("click", () => {
  if (!transactions.length) {
    alert("There are no transactions to clear.");
  } else if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    saveData();
    refresh();
  }
});

// Show saved data when the page opens.
refresh();
