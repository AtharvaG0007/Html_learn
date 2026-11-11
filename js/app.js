// PocketTrack: shared JavaScript for all pages (optimized).
const KEYS = { tx: "pocketTrackTransactions", budget: "pocketTrackBudgets", cat: "pocketTrackCategoryBudgets" };
const pad = n => String(n).padStart(2, "0"), now = new Date(), fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const todayText = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, currentMonth = todayText.slice(0, 7);
const validDate = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false; const [y,m,d] = s.split("-").map(Number), date = new Date(y,m-1,d); return date.getFullYear() === y && date.getMonth() === m-1 && date.getDate() === d; };
let transactions, budgets, categoryBudgets;
const $ = id => document.getElementById(id), money = v => fmt.format(Number(v) || 0);
const sum = (items, type) => items.filter(i => !type || i.type === type).reduce((t, i) => t + Number(i.amount), 0);
const monthItems = m => transactions.filter(i => i.date.startsWith(m)), statusClass = p => (p >= 100 ? "over" : p >= 80 ? "warn" : "");
const setText = (id, text) => ($(id).textContent = text), setTexts = o => Object.entries(o).forEach(([id, t]) => setText(id, t));
const setBar = (el, pct) => { el.style.width = Math.min(pct, 100) + "%"; el.className = statusClass(pct); };
const make = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls || ""; if (text !== undefined) el.textContent = text; return el; };
const btn = (text, cls, data) => { const b = make("button", "button " + cls, text); b.type = "button"; Object.assign(b.dataset, data); return b; };
const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const asObj = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
function loadAll() { const list = load(KEYS.tx); transactions = (Array.isArray(list) ? list : []).filter(i => i && typeof i.id === "string" && typeof i.description === "string"
    && ["income", "expense"].includes(i.type) && Number.isFinite(Number(i.amount)) && Number(i.amount) > 0 && validDate(i.date)); budgets = asObj(load(KEYS.budget)); categoryBudgets = asObj(load(KEYS.cat)); }
function saveData() { const keys = Object.values(KEYS), data = [transactions, budgets, categoryBudgets]; let old = [];
  try { old = keys.map(k => localStorage.getItem(k)); keys.forEach((k, i) => localStorage.setItem(k, JSON.stringify(data[i]))); return true; } catch {
    keys.forEach((k, i) => { try { if (old[i] === null) localStorage.removeItem(k); else if (old[i] !== undefined) localStorage.setItem(k, old[i]); } catch {} });
    loadAll(); alert("Could not save changes. Your previous saved data has been kept. Check browser storage or privacy settings."); return false; } }
const refreshAll = () => { updateDashboard(); updateBudgetPage(); updateReports(); };
function transactionRow(item, actions = false) { const row = make("div", "transaction"), info = make("div", "transaction-info"), side = make("div", "transaction-side");
  info.append(make("div", "transaction-title", item.description), make("div", "transaction-meta", `${item.category} · ${item.date} · ${item.payment || "Other"}${item.note ? " · " + item.note : ""}`));
  side.appendChild(make("span", "transaction-amount " + item.type, (item.type === "income" ? "+ " : "− ") + money(item.amount)));
  if (actions) { const box = make("div", "transaction-actions"); box.append(btn("Edit", "secondary small", { action: "edit", id: item.id }), btn("Delete", "danger small", { action: "delete", id: item.id })); side.appendChild(box); }
  row.append(info, side); return row; }
function updateDashboard() { if (!$("balance")) return;
  const income = sum(transactions, "income"), expense = sum(transactions, "expense"), latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const spent = sum(monthItems(currentMonth), "expense"), limit = Number(budgets[currentMonth]) || 0, pct = limit ? spent / limit * 100 : 0;
  setTexts({ balance: money(income - expense), totalIncome: money(income), totalExpense: money(expense), dashboardSpent: money(spent),
    dashboardMonth: new Date(currentMonth + "-01T12:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    dashboardBudgetStatus: !limit ? "Set a monthly budget to track your spending." : pct >= 100 ? "You have exceeded your monthly budget." : `You have used ${pct.toFixed(0)}% of your budget.` });
  $("recentTransactions").replaceChildren(...(latest.length ? latest.map(i => transactionRow(i)) : [make("p", "empty", "No transactions yet. Add your first transaction.")])); setBar($("dashboardProgress"), pct); }
function setupTransactions() { const form = $("transactionForm"); if (!form) return;
  const list = $("transactionList"), search = $("searchTransactions"), type = $("filterType"), month = $("filterMonth"), feedback = $("transactionFeedback");
  const fields = ["description", "amount", "type", "category", "date", "payment", "note"]; $("date").value = todayText; function render() {
    const query = search.value.trim().toLowerCase(), selected = month.value || "all";
    month.replaceChildren(new Option("All months", "all"), ...[...new Set(transactions.map(i => i.date.slice(0, 7)))].sort().reverse().map(m => new Option(m, m))); month.value = selected;
    const rows = transactions.filter(i => (type.value === "all" || i.type === type.value) && (month.value === "all" || i.date.startsWith(month.value))
      && `${i.description} ${i.category} ${i.note || ""}`.toLowerCase().includes(query)).sort((a, b) => b.date.localeCompare(a.date));
    list.replaceChildren(...(rows.length ? rows.map(i => transactionRow(i, true)) : [make("p", "empty", "No matching transactions found.")])); }
  function resetForm() { form.reset(); $("editId").value = ""; $("date").value = todayText; setTexts({ formTitle: "Add a transaction", saveTransaction: "Save transaction" }); $("cancelEdit").hidden = true; }
  const done = () => { render(); refreshAll(); }; form.addEventListener("submit", e => { e.preventDefault();
    const id = $("editId").value, description = $("description").value.trim(), amount = Number($("amount").value), date = $("date").value;
    if (!description || !Number.isFinite(amount) || amount <= 0 || !validDate(date)) { feedback.textContent = "Enter a valid description, amount and date."; return; }
    const record = { id: id || Date.now() + "-" + Math.random().toString(16).slice(2), description, amount, date, type: $("type").value, category: $("category").value, payment: $("payment").value, note: $("note").value.trim() };
    transactions = id ? transactions.map(i => (i.id === id ? record : i)) : [...transactions, record];
    if (saveData()) { feedback.textContent = id ? "Transaction updated." : "Transaction saved."; resetForm(); done(); } }); $("cancelEdit").addEventListener("click", resetForm); list.addEventListener("click", e => {
    const button = e.target.closest("button[data-action]"), item = button && transactions.find(r => r.id === button.dataset.id); if (!item) return;
    if (button.dataset.action === "delete") { if (confirm("Delete this transaction?")) { transactions = transactions.filter(r => r.id !== item.id); if (saveData()) done(); } return; }
    $("editId").value = item.id; fields.forEach(f => ($(f).value = item[f] || (f === "payment" ? "Other" : "")));
    setTexts({ formTitle: "Edit transaction", saveTransaction: "Update transaction" }); $("cancelEdit").hidden = false; form.scrollIntoView({ behavior: "smooth", block: "start" }); });
  [search, type, month].forEach(el => el.addEventListener(el === search ? "input" : "change", render)); render(); }
function updateBudgetPage() { if (!$("monthlyBudgetForm")) return; const month = $("budgetMonth").value || currentMonth, items = monthItems(month), spent = sum(items, "expense");
  const limit = Number(budgets[month]) || 0, pct = limit ? spent / limit * 100 : 0, remaining = limit - spent, status = $("budgetStatus"); $("budgetAmount").value = limit || "";
  setTexts({ budgetSpent: money(spent), budgetRemaining: limit ? money(Math.abs(remaining)) + (remaining < 0 ? " over" : "") : "Not set",
    budgetStatus: !limit ? "Set a monthly budget to begin." : pct >= 100 ? `Budget exceeded by ${money(spent - limit)}.` : pct >= 80 ? `${pct.toFixed(0)}% of your budget used. Be careful.` : `${money(remaining)} remaining (${pct.toFixed(0)}% used).` });
  setBar($("budgetProgress"), pct); status.className = "status " + statusClass(pct); const saved = categoryBudgets[month] || {}, names = Object.keys(saved);
  $("categoryBudgetList").replaceChildren(...(names.length ? names.map(name => { const total = sum(items.filter(i => i.category === name), "expense"), cap = Number(saved[name]), used = cap ? total / cap * 100 : 0;
    const head = make("div", "budget-row-head"), progress = make("div", "progress"), fill = make("span"), row = make("div", "budget-row");
    head.append(make("span", "", name), make("strong", "", `${money(total)} / ${money(cap)}`)); setBar(fill, used); progress.appendChild(fill);
    row.append(head, progress, make("p", "status " + statusClass(used), used >= 100 ? "Category limit exceeded." : used >= 80 ? "Close to category limit." : `${money(Math.max(cap - total, 0))} remaining.`), btn("Remove limit", "danger small", { category: name, month }));
    return row; }) : [make("p", "empty", "No category budgets set for this month.")])); }
function setupBudget() { const form = $("monthlyBudgetForm"); if (!form) return;
  const month = $("budgetMonth"), catMonth = $("categoryBudgetMonth"), catForm = $("categoryBudgetForm"), valid = (k, a) => k && Number.isFinite(a) && a > 0; month.value = catMonth.value = currentMonth;
  form.addEventListener("submit", e => { e.preventDefault(); const key = month.value, amount = Number($("budgetAmount").value); if (!valid(key, amount)) return; budgets[key] = amount;
    if (saveData()) { setText("budgetFeedback", "Monthly budget saved."); updateBudgetPage(); updateDashboard(); } }); catForm.addEventListener("submit", e => {
    e.preventDefault(); const key = catMonth.value, amount = Number($("categoryBudgetAmount").value); if (!valid(key, amount)) return; (categoryBudgets[key] ||= {})[$("budgetCategory").value] = amount;
    if (saveData()) { catForm.reset(); catMonth.value = key; updateBudgetPage(); } }); month.addEventListener("change", updateBudgetPage);
  catMonth.addEventListener("change", () => { month.value = catMonth.value; updateBudgetPage(); }); $("categoryBudgetList").addEventListener("click", e => {
    const b = e.target.closest("button[data-category]"), m = b && b.dataset.month; if (!b || !categoryBudgets[m]) return;
    delete categoryBudgets[m][b.dataset.category]; if (!Object.keys(categoryBudgets[m]).length) delete categoryBudgets[m]; saveData(); updateBudgetPage(); }); updateBudgetPage(); }
function updateReports() { const input = $("reportMonth"); if (!input) return; const month = input.value || currentMonth, items = monthItems(month), income = sum(items, "income"), expense = sum(items, "expense");
  const savings = income - expense, rate = income ? savings / income * 100 : 0, pctOf = v => (expense ? v / expense * 100 : 0); const expenses = items.filter(i => i.type === "expense"), totals = {};
  expenses.forEach(i => (totals[i.category] = (totals[i.category] || 0) + Number(i.amount)));
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]), top = entries[0], largest = expenses.reduce((a, b) => (!a || Number(b.amount) > Number(a.amount) ? b : a), null);
  const year = Number(month.slice(0, 4)), mon = Number(month.slice(5, 7)), days = month === currentMonth ? Math.max(1, now.getDate()) : new Date(year, mon, 0).getDate();
  const prev = new Date(year, mon - 2, 1), prevMonth = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`, prevExpense = sum(monthItems(prevMonth), "expense");
  const limit = Number(budgets[month]) || 0, bp = limit ? expense / limit * 100 : 0; let change = "No change", detail = "No expenses recorded in either selected or previous month.", width = 0, cls = "";
  if (!prevExpense && expense) { change = "New spending"; detail = `You recorded ${money(expense)} in expenses. There was no spending recorded in ${prevMonth}.`; width = 100; cls = "warn"; } else if (prevExpense) {
    const diff = expense - prevExpense, p = Math.abs(diff / prevExpense * 100); change = (diff > 0 ? "+" : diff < 0 ? "−" : "") + p.toFixed(1) + "%"; width = Math.min(p, 100); cls = diff > 0 ? "warn" : "";
    detail = diff > 0 ? `Expenses increased by ${money(diff)} compared with ${prevMonth}.` : diff < 0 ? `Expenses decreased by ${money(-diff)} compared with ${prevMonth}.` : "Your expenses are the same as the previous month.";
  } setTexts({ reportIncome: money(income), reportExpense: money(expense), reportSavings: money(savings), reportSavingsRate: income ? rate.toFixed(1) + "%" : "—",
    topCategory: top ? top[0] : "No data yet", topCategoryDetail: top ? `${money(top[1])} · ${pctOf(top[1]).toFixed(1)}% of your expenses` : "Add expenses to discover your top category.",
    largestExpense: largest ? money(largest.amount) : "No data yet", largestExpenseDetail: largest ? `${largest.description} · ${largest.category} · ${largest.date}` : "Your biggest single expense will appear here.",
    dailyAverage: money(expense / days), dailyAverageDetail: `Based on ${days} calendar day${days === 1 ? "" : "s"} in the selected month.`,
    expenseChange: change, expenseChangeDetail: detail, budgetHealth: limit ? bp.toFixed(0) + "% used" : "No budget set",
    budgetHealthDetail: !limit ? "Set a monthly budget to see how your spending compares." : bp >= 100 ? `You are ${money(expense - limit)} over your budget.` : `${money(limit - expense)} remaining from your ${money(limit)} limit.` });
  Object.assign($("comparisonProgress"), { className: cls }).style.width = width + "%"; setBar($("insightBudgetProgress"), limit ? bp : 0);
  $("reportCategories").replaceChildren(...(entries.length ? entries.map(([name, amount]) => { const row = make("div", "bar-row"), head = make("div", "bar-label"), bar = make("div", "bar"), fill = make("span");
    head.append(make("span", "", name), make("strong", "", `${money(amount)} · ${pctOf(amount).toFixed(1)}%`)); fill.style.width = pctOf(amount) + "%"; bar.appendChild(fill); row.append(head, bar); return row;
  }) : [make("p", "empty", "No expenses recorded for this month.")])); const tips = !items.length ? ["No transactions found for this month. Add your income and expenses to unlock useful insights."] : [
    savings < 0 ? `Your expenses are higher than your income by ${money(-savings)}. Review non-essential spending first.` : income > 0 && rate >= 20 ? `You saved ${rate.toFixed(1)}% of your income. Keep following the habits that helped you reach this.` : income > 0 && `Your savings rate is ${rate.toFixed(1)}%. Try setting aside a small amount as soon as income arrives.`,
    top && expense > 0 && top[1] / expense >= 0.4 && `${top[0]} accounts for ${pctOf(top[1]).toFixed(1)}% of your spending. Check whether this category has any costs you can reduce.`,
    prevExpense > 0 && expense > prevExpense * 1.15 && "Your spending is more than 15% higher than last month. Review recent purchases to find what changed.",
    prevExpense > 0 && expense < prevExpense * 0.85 && "Your spending is down by more than 15% compared with last month. Keep the sustainable changes going.",
    limit && bp >= 100 ? "You have crossed your monthly budget. Pause optional purchases and review the remaining days of the month." : limit && bp >= 80 && `You have used ${bp.toFixed(0)}% of your budget. Set a smaller weekly spending limit for the rest of the month.`,
    largest && expenses.length > 1 && `Your largest purchase was ${largest.description} for ${money(largest.amount)}. Consider planning for similar large costs in advance.`].filter(Boolean);
  if (items.length && !tips.length) tips.push("Your spending looks steady based on the available records. Keep recording transactions so future insights become more useful.");
  $("reportRecommendations").replaceChildren(...tips.map(t => { const row = make("div", "recommendation-item"); row.append(make("span", "recommendation-mark", "✓"), make("p", "", t)); return row; })); }
function setupReports() { const input = $("reportMonth"); if (!input) return; input.value = currentMonth; input.addEventListener("change", updateReports); updateReports(); }
function setupFastNavigation() { const seen = new Set([location.href.split("#")[0]]); const prefetch = e => { const a = e.target.closest?.("a[href]"), url = a && a.href.split("#")[0];
    if (!a || a.origin !== location.origin || !a.pathname.endsWith(".html") || seen.has(url)) return;
    seen.add(url); document.head.appendChild(Object.assign(document.createElement("link"), { rel: "prefetch", href: url, as: "document" })); };
  ["pointerover", "focusin", "touchstart"].forEach(t => document.addEventListener(t, prefetch, { passive: true })); }
loadAll(); setupFastNavigation(); updateDashboard(); setupTransactions(); setupBudget(); setupReports();