// Find the HTML elements that JavaScript needs to use.
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

// This array keeps all transactions while the page is running.
let transactions = [];

// Put today's date in the date box.
dateInput.value = new Date().toISOString().split("T")[0];

// Load previously saved transactions from this browser.
const savedTransactions = localStorage.getItem("myTransactions");
if (savedTransactions !== null) {
  try {
    transactions = JSON.parse(savedTransactions);
    if (!Array.isArray(transactions)) transactions = [];
  } catch (error) {
    transactions = [];
  }
}

// Save the transactions array in browser Local Storage.
function saveTransactions() {
  localStorage.setItem("myTransactions", JSON.stringify(transactions));
}

// Convert a number into Indian Rupees.
function formatMoney(amount) {
  return "₹" + Number(amount).toFixed(2);
}

// Add all income and expenses, then update the summary cards.
function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") {
      totalIncome += transactions[i].amount;
    } else {
      totalExpense += transactions[i].amount;
    }
  }

  balanceElement.textContent = formatMoney(totalIncome - totalExpense);
  incomeElement.textContent = formatMoney(totalIncome);
  expenseElement.textContent = formatMoney(totalExpense);
}

// Create and display the transaction list.
function showTransactions() {
  transactionList.innerHTML = "";
  const selectedFilter = filterInput.value;
  let visibleCount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const item = transactions[i];

    if (selectedFilter !== "all" && item.type !== selectedFilter) {
      continue;
    }

    visibleCount++;
    const row = document.createElement("div");
    row.className = "transaction-row";

    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "transaction-name";
    name.textContent = item.description;

    const information = document.createElement("div");
    information.className = "transaction-details";
    information.textContent = item.category + " • " + item.date;

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

// When the form is submitted, create a new transaction.
expenseForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (description === "" || !Number.isFinite(amount) || amount <= 0 || date === "") {
    alert("Please enter a valid description, amount and date.");
    return;
  }

  const newTransaction = {
    description: description,
    amount: amount,
    type: type,
    category: category,
    date: date
  };

  transactions.push(newTransaction);
  saveTransactions();
  updateSummary();
  showTransactions();

  expenseForm.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
});

// Use one click listener to delete the selected transaction.
transactionList.addEventListener("click", function(event) {
  if (event.target.classList.contains("delete-button")) {
    const index = Number(event.target.dataset.index);

    if (confirm("Do you want to delete this transaction?")) {
      transactions.splice(index, 1);
      saveTransactions();
      updateSummary();
      showTransactions();
    }
  }
});

// Show only income or expenses when the filter changes.
filterInput.addEventListener("change", showTransactions);

// Remove all transactions after the user confirms.
clearButton.addEventListener("click", function() {
  if (transactions.length === 0) {
    alert("There are no transactions to clear.");
    return;
  }

  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    saveTransactions();
    updateSummary();
    showTransactions();
  }
});

// Update the page when it first opens.
updateSummary();
showTransactions();