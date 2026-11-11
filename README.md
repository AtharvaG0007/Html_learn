# PocketTrack — Personal Expense Tracker

A multi-page, responsive personal expense tracker built with HTML5, CSS3 and beginner-friendly JavaScript.

## Pages
- `index.html` — dashboard with balance, income, expenses, recent activity and monthly budget snapshot.
- `transactions.html` — add, edit, delete, search and filter transactions.
- `budget.html` — monthly and category-wise budgets with progress and warning states.
- `reports.html` — monthly money insights, savings rate, top category, largest expense, average daily spending, month-over-month comparison, budget health and personalised recommendations.

## Features
- Add income and expense records with description, amount, category, date, payment method and note.
- Automatically calculate total income, total expenses, balance and monthly net savings.
- Edit and delete individual transactions.
- Search transactions by description, category or note.
- Filter by transaction type and month.
- Set monthly and category-wise spending limits.
- See warnings at 80% and when a budget is exceeded.
- Monthly money insights including savings rate, top spending category, largest expense and average daily spending.
- Month-over-month expense comparison and monthly budget health.
- Rule-based recommendations based on recorded spending patterns.
- Responsive category spending breakdown.
- Save data in browser LocalStorage.
- Responsive layout for mobile, tablet and desktop.
- Consistent navigation across all four pages.
- SiteCrafters preview watermark and attribution footer.

## Folder structure
```
Html_learn/
├── index.html
├── transactions.html
├── budget.html
├── reports.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Run the project
Download or clone the repository and open `index.html` in a modern browser. No framework, npm package, server, database or API key is required.

## Storage note
Data is stored only in the browser and device where it is entered. It is not cloud-synchronised. Clearing browser data may delete transactions and budgets. There is no built-in backup or cloud sync.

## Simple viva explanation
- HTML creates page structure, forms, labels, navigation and content.
- CSS controls layout, colours, spacing and responsive design with media queries.
- JavaScript handles form submission, calculations, searching, filtering, editing, deleting and reports.
- Arrays store transaction objects.
- Objects store monthly and category budget values.
- LocalStorage saves information in the browser.
- `filter()` selects records, `reduce()` totals amounts, and `sort()` orders records.
- Monthly insights use simple JavaScript calculations and conditional rules; they do not use AI or send personal data to a server.

**Balance = Total Income − Total Expenses**

**Monthly net savings = Monthly Income − Monthly Expenses**

## Limitations
This is a client-side academic project. LocalStorage is not secure cloud storage and does not support user accounts or cross-device sync. The watermark is a visual attribution mark, not screenshot or copying protection.


## How the files work together (simple guide)

Think of the project as three parts working as a team:

- **HTML files are the rooms.** They create the visible headings, cards, buttons, forms and navigation.
- **`css/style.css` is the decoration.** It controls colours, spacing, card shapes and how pages fit on phones and computers.
- **`js/app.js` is the helper.** It reads what visitors enter, saves it in the browser, does the calculations and updates the page.

## How JavaScript connects to HTML

JavaScript finds an HTML element by its `id`. For example, `$("balance")` finds the element with `id="balance"` on the Dashboard. The `setText()` helper changes the words inside it. Each page has different elements, so a setup function first checks whether its form exists. This lets all pages share the same `app.js` file.

### What happens when a visitor adds a transaction?

1. The visitor fills in the form on `transactions.html`.
2. The browser fires the form's `submit` event.
3. `setupTransactions()` reads the fields and checks the amount and date.
4. The new record is added to the `transactions` array.
5. `saveData()` stores the data in browser LocalStorage.
6. `done()` redraws the transaction list and calls `refreshAll()`.
7. `refreshAll()` updates the Dashboard, Budget and Insights calculations.

### Main JavaScript functions

| Function | What it does |
| --- | --- |
| `loadAll()` | Reads saved transactions and budgets when a page opens. |
| `saveData()` | Saves the current data in the browser. |
| `transactionRow()` | Builds the visible row for one transaction. |
| `updateDashboard()` | Updates balance, income, expenses and recent activity. |
| `setupTransactions()` | Connects the transaction form, search, filters and action buttons. |
| `updateBudgetPage()` / `setupBudget()` | Displays and saves monthly and category limits. |
| `updateReports()` / `setupReports()` | Calculates and displays the selected month's insights. |
| `setupFastNavigation()` | Hints to the browser that a linked page may be opened next. |

Comments in the HTML, CSS and JavaScript explain the main sections and how the pieces connect. Comments are notes for people reading the code; they do not change how the app runs.
