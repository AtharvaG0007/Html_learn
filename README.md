# PocketTrack — Personal Expense Tracker

A multi-page, responsive personal expense tracker built with HTML5, CSS3 and beginner-friendly JavaScript.

## Pages
- `index.html` — dashboard with balance, income, expenses, recent activity and monthly budget snapshot.
- `transactions.html` — add, edit, delete, search, filter and export transactions.
- `budget.html` — monthly and category-wise budgets with progress and warning states.
- `reports.html` — monthly income/expense comparison, category breakdown and CSV export.

## Features
- Add income and expense records with description, amount, category, date, payment method and note.
- Automatically calculate total income, total expenses, balance and monthly net savings.
- Edit and delete individual transactions.
- Search transactions by description, category or note.
- Filter by transaction type and month.
- Set monthly and category-wise spending limits.
- See warnings at 80% and when a budget is exceeded.
- Monthly category spending report and income-versus-expense bars.
- Export all transactions or a selected month's transactions to CSV.
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
Data is stored only in the browser and device where it is entered. It is not cloud-synchronised. Clearing browser data may delete transactions and budgets. Export CSV regularly to keep a backup.

## Simple viva explanation
- HTML creates page structure, forms, labels, navigation and content.
- CSS controls layout, colours, spacing and responsive design with media queries.
- JavaScript handles form submission, calculations, searching, filtering, editing, deleting and reports.
- Arrays store transaction objects.
- Objects store monthly and category budget values.
- LocalStorage saves information in the browser.
- `filter()` selects records, `reduce()` totals amounts, and `sort()` orders records.
- CSV export converts transaction records into comma-separated text and downloads it.

**Balance = Total Income − Total Expenses**

**Monthly net savings = Monthly Income − Monthly Expenses**

## Limitations
This is a client-side academic project. LocalStorage is not secure cloud storage and does not support user accounts or cross-device sync. The watermark is a visual attribution mark, not screenshot or copying protection.
