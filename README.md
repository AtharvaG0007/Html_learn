# My Expense Tracker

A beginner-friendly personal expense tracker built with HTML5, CSS3 and plain JavaScript.

## Features
- Add income and expense transactions with category and date
- Automatically calculate total income, total expenses and balance
- Set a separate spending budget for each month
- Track monthly spending, remaining budget and budget usage progress
- Show a warning after 80% of the budget is used and an alert-style status when the budget is exceeded
- View monthly spending insights by category
- Identify the highest spending category for the selected month
- Filter transactions by income or expense
- Delete individual transactions or clear all transactions
- Save transactions and monthly budgets in browser Local Storage
- Responsive layout for desktop, tablet and mobile screens

## Project files
- `index.html` - page structure, forms and insight sections
- `style.css` - visual design and responsive layouts
- `script.js` - transaction logic, monthly budget calculations, insights and Local Storage

## How to run
Download or clone this repository and open `index.html` in a modern browser. No npm, Node.js, server, database or API key is required.

## How the monthly budget works
1. Choose a month.
2. Enter a spending limit and save it.
3. Only expense transactions dated in that month count toward the budget.
4. The progress bar shows the percentage used.
5. At 80%, the app displays a warning. At 100% or more, it shows that the budget has been exceeded.
6. Each month has its own saved budget.

## How spending insights work
The app groups expense transactions for the selected month by category, adds each category's amount, calculates its share of total monthly expenses, and displays the highest-spending category first. Income is not counted as spending.

## Simple explanation for viva
- HTML creates the page structure and forms.
- CSS controls colours, spacing and mobile responsiveness.
- JavaScript handles calculations and user interactions.
- An array stores transaction objects.
- An object stores each month's budget using the month as its key (for example, `2026-11`).
- `filter()` selects the expenses for a month.
- `reduce()` adds the amounts.
- `sort()` arranges categories from highest to lowest spending.
- Local Storage saves the data in the current browser.

**Balance = Total Income - Total Expenses**

## Important limitation
Data is stored only in the same browser on the same device. It is not synced to an online account or cloud backup. Clearing browser data can remove saved transactions and budgets.