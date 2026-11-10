// PocketTrack: shared, beginner-friendly JavaScript for all pages.
const STORAGE_KEY = "pocketTrackTransactions";
const BUDGET_KEY = "pocketTrackBudgets";
const CATEGORY_KEY = "pocketTrackCategoryBudgets";
const categories = ["Food","Travel","Shopping","Education","Bills","Salary","Health","Entertainment","Other"];
const today = new Date();
const todayText = [today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
const currentMonth = todayText.slice(0,7);

function loadData(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch (error) { return fallback; }
}
let transactions = loadData(STORAGE_KEY, []);
let budgets = loadData(BUDGET_KEY, {});
let categoryBudgets = loadData(CATEGORY_KEY, {});
if (!Array.isArray(transactions)) transactions = [];
if (!budgets || typeof budgets !== "object" || Array.isArray(budgets)) budgets = {};
if (!categoryBudgets || typeof categoryBudgets !== "object" || Array.isArray(categoryBudgets)) categoryBudgets = {};
transactions = transactions.filter(item => item && typeof item.id === "string" && typeof item.description === "string" && (item.type === "income" || item.type === "expense") && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.date));
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(transactions));
    localStorage.setItem(BUDGET_KEY,JSON.stringify(budgets));
    localStorage.setItem(CATEGORY_KEY,JSON.stringify(categoryBudgets));
    return true;
  } catch (error) { alert("Could not save data. Check browser storage space or privacy settings."); return false; }
}
function money(value) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(Number(value)||0); }
function sum(items,type) { return items.filter(item => !type || item.type===type).reduce((total,item)=>total+Number(item.amount),0); }
function monthItems(month) { return transactions.filter(item=>item.date.slice(0,7)===month); }
function make(tag,className,text) { const element=document.createElement(tag); if(className) element.className=className; if(text!==undefined) element.textContent=text; return element; }
function addText(parent,tag,className,text) { const element=make(tag,className,text); parent.appendChild(element); return element; }
function transactionRow(item,actions=false) {
  const row=make("div","transaction"), info=make("div","transaction-info");
  addText(info,"div","transaction-title",item.description);
  addText(info,"div","transaction-meta",item.category+" · "+item.date+" · "+(item.payment||"Other")+(item.note?" · "+item.note:""));
  const side=make("div","transaction-side");
  addText(side,"span","transaction-amount "+(item.type==="income"?"income":"expense"),(item.type==="income"?"+ ":"− ")+money(item.amount));
  if(actions){const buttons=make("div","transaction-actions");const edit=make("button","button secondary small","Edit");edit.type="button";edit.dataset.action="edit";edit.dataset.id=item.id;const del=make("button","button danger small","Delete");del.type="button";del.dataset.action="delete";del.dataset.id=item.id;buttons.append(edit,del);side.appendChild(buttons);}
  row.append(info,side);return row;
}
function updateDashboard() {
  const balance=document.getElementById("balance"); if(!balance)return;
  const income=sum(transactions,"income"),expense=sum(transactions,"expense");
  balance.textContent=money(income-expense);document.getElementById("totalIncome").textContent=money(income);document.getElementById("totalExpense").textContent=money(expense);
  const recent=document.getElementById("recentTransactions");recent.replaceChildren();
  const latest=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  if(!latest.length) recent.appendChild(make("p","empty","No transactions yet. Add your first transaction."));
  latest.forEach(item=>recent.appendChild(transactionRow(item)));
  const spent=sum(monthItems(currentMonth),"expense"),limit=Number(budgets[currentMonth])||0,percent=limit?spent/limit*100:0;
  document.getElementById("dashboardMonth").textContent=new Date(currentMonth+"-01T12:00:00").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  document.getElementById("dashboardSpent").textContent=money(spent);
  const bar=document.getElementById("dashboardProgress");bar.style.width=Math.min(percent,100)+"%";bar.className=percent>=100?"over":percent>=80?"warn":"";
  document.getElementById("dashboardBudgetStatus").textContent=limit?(percent>=100?"You have exceeded your monthly budget.":percent>=80?"You have used "+percent.toFixed(0)+"% of your budget.":"You have used "+percent.toFixed(0)+"% of your budget."):"Set a monthly budget to track your spending.";
}
function fillMonthOptions(select,selected) {
  const months=[...new Set(transactions.map(item=>item.date.slice(0,7)))].sort().reverse();
  select.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent="All months";select.appendChild(all);
  months.forEach(month=>{const option=document.createElement("option");option.value=month;option.textContent=month;select.appendChild(option);});
  select.value=selected||"all";
}
function setupTransactions() {
  const form=document.getElementById("transactionForm");if(!form)return;
  const byId=id=>document.getElementById(id),feedback=byId("transactionFeedback");
  byId("date").value=todayText;
  const list=byId("transactionList"),search=byId("searchTransactions"),type=byId("filterType"),month=byId("filterMonth");
  function render() {
    const query=search.value.trim().toLowerCase();fillMonthOptions(month,month.value);
    const filtered=[...transactions].filter(item=>(type.value==="all"||item.type===type.value)&&(month.value==="all"||item.date.startsWith(month.value))&&(item.description+" "+item.category+" "+(item.note||"")).toLowerCase().includes(query)).sort((a,b)=>b.date.localeCompare(a.date));
    list.replaceChildren();if(!filtered.length){list.appendChild(make("p","empty","No matching transactions found."));return;}
    filtered.forEach(item=>list.appendChild(transactionRow(item,true)));
  }
  function resetForm(){form.reset();byId("editId").value="";byId("date").value=todayText;byId("formTitle").textContent="Add a transaction";byId("saveTransaction").textContent="Save transaction";byId("cancelEdit").hidden=true;}
  form.addEventListener("submit",event=>{
    event.preventDefault();const id=byId("editId").value,description=byId("description").value.trim(),amount=Number(byId("amount").value),date=byId("date").value;
    if(!description||!Number.isFinite(amount)||amount<=0||!date){feedback.textContent="Enter a valid description, amount and date.";return;}
    const record={id:id||String(Date.now())+"-"+Math.random().toString(16).slice(2),description,amount,type:byId("type").value,category:byId("category").value,date,payment:byId("payment").value,note:byId("note").value.trim()};
    if(id) transactions=transactions.map(item=>item.id===id?record:item);else transactions.push(record);
    if(saveData()){feedback.textContent=id?"Transaction updated.":"Transaction saved.";resetForm();render();updateDashboard();updateBudgetPage();updateReports();}
  });
  byId("cancelEdit").addEventListener("click",resetForm);
  list.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");if(!button)return;
    const item=transactions.find(record=>record.id===button.dataset.id);if(!item)return;
    if(button.dataset.action==="delete"&&confirm("Delete this transaction?")){transactions=transactions.filter(record=>record.id!==item.id);if(saveData()){render();updateDashboard();updateBudgetPage();updateReports();}}
    if(button.dataset.action==="edit"){byId("editId").value=item.id;byId("description").value=item.description;byId("amount").value=item.amount;byId("type").value=item.type;byId("category").value=item.category;byId("date").value=item.date;byId("payment").value=item.payment||"Other";byId("note").value=item.note||"";byId("formTitle").textContent="Edit transaction";byId("saveTransaction").textContent="Update transaction";byId("cancelEdit").hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"});}
  });
  search.addEventListener("input",render);type.addEventListener("change",render);month.addEventListener("change",render);
  byId("exportCsv").addEventListener("click",()=>downloadCsv(transactions,"pockettrack-transactions.csv"));
  render();
}
function downloadCsv(items,filename) {
  if(!items.length){alert("There are no transactions to export.");return;}
  const columns=["Date","Description","Type","Category","Amount","Payment Method","Note"];
  const rows=items.map(item=>[item.date,item.description,item.type,item.category,item.amount,item.payment||"",item.note||""]);
  const quote=value=>'"'+String(value??"").replace(/"/g,'""')+'"';
  const csv=[columns,...rows].map(row=>row.map(quote).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
function updateBudgetPage() {
  const form=document.getElementById("monthlyBudgetForm");if(!form)return;
  const month=document.getElementById("budgetMonth").value||currentMonth,items=monthItems(month),spent=sum(items,"expense"),limit=Number(budgets[month])||0,percent=limit?spent/limit*100:0,remaining=limit-spent;
  document.getElementById("budgetAmount").value=limit||"";
  document.getElementById("budgetSpent").textContent=money(spent);document.getElementById("budgetRemaining").textContent=limit?money(Math.abs(remaining))+(remaining<0?" over":""):"Not set";
  const bar=document.getElementById("budgetProgress");bar.style.width=Math.min(percent,100)+"%";bar.className=percent>=100?"over":percent>=80?"warn":"";
  const status=document.getElementById("budgetStatus");status.className="status "+(percent>=100?"over":percent>=80?"warn":"");
  status.textContent=!limit?"Set a monthly budget to begin.":percent>=100?"Budget exceeded by "+money(spent-limit)+".":percent>=80?percent.toFixed(0)+"% of your budget used. Be careful.":money(remaining)+" remaining ("+percent.toFixed(0)+"% used).";
  const list=document.getElementById("categoryBudgetList");list.replaceChildren();
  const saved=categoryBudgets[month]||{};const names=Object.keys(saved);
  if(!names.length)list.appendChild(make("p","empty","No category budgets set for this month."));
  names.forEach(name=>{const total=sum(items.filter(item=>item.category===name),"expense"),cap=Number(saved[name]),used=cap?total/cap*100:0,row=make("div","budget-row"),head=make("div","budget-row-head");head.append(make("span","",name),make("strong","",money(total)+" / "+money(cap)));const progress=make("div","progress"),fill=make("span");fill.style.width=Math.min(used,100)+"%";fill.className=used>=100?"over":used>=80?"warn":"";progress.appendChild(fill);const statusText=make("p","status "+(used>=100?"over":used>=80?"warn":""),used>=100?"Category limit exceeded.":used>=80?"Close to category limit.":money(Math.max(cap-total,0))+" remaining.");const remove=make("button","button danger small","Remove limit");remove.type="button";remove.dataset.category=name;remove.dataset.month=month;row.append(head,progress,statusText,remove);list.appendChild(row);});
}
function setupBudget() {
  const form=document.getElementById("monthlyBudgetForm");if(!form)return;
  const month=document.getElementById("budgetMonth"),categoryMonth=document.getElementById("categoryBudgetMonth");month.value=currentMonth;categoryMonth.value=currentMonth;
  form.addEventListener("submit",event=>{event.preventDefault();const key=month.value,amount=Number(document.getElementById("budgetAmount").value);if(!key||!Number.isFinite(amount)||amount<=0)return;budgets[key]=amount;if(saveData()){document.getElementById("budgetFeedback").textContent="Monthly budget saved.";updateBudgetPage();updateDashboard();}});
  month.addEventListener("change",updateBudgetPage);
  document.getElementById("categoryBudgetForm").addEventListener("submit",event=>{event.preventDefault();const key=categoryMonth.value,name=document.getElementById("budgetCategory").value,amount=Number(document.getElementById("categoryBudgetAmount").value);if(!key||!Number.isFinite(amount)||amount<=0)return;if(!categoryBudgets[key])categoryBudgets[key]={};categoryBudgets[key][name]=amount;if(saveData()){document.getElementById("categoryBudgetForm").reset();categoryMonth.value=key;updateBudgetPage();}});
  categoryMonth.addEventListener("change",()=>{month.value=categoryMonth.value;updateBudgetPage();});
  document.getElementById("categoryBudgetList").addEventListener("click",event=>{const button=event.target.closest("button[data-category]");if(!button)return;const key=button.dataset.month,name=button.dataset.category;if(categoryBudgets[key]){delete categoryBudgets[key][name];if(!Object.keys(categoryBudgets[key]).length)delete categoryBudgets[key];saveData();updateBudgetPage();}});
  updateBudgetPage();
}
function updateReports() {
  const input=document.getElementById("reportMonth");if(!input)return;
  const month=input.value||currentMonth,items=monthItems(month),income=sum(items,"income"),expense=sum(items,"expense");
  document.getElementById("reportIncome").textContent=money(income);document.getElementById("reportExpense").textContent=money(expense);document.getElementById("reportSavings").textContent=money(income-expense);
  const totals={};items.filter(item=>item.type==="expense").forEach(item=>totals[item.category]=(totals[item.category]||0)+item.amount);
  const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]),list=document.getElementById("reportCategories");list.replaceChildren();
  if(!entries.length)list.appendChild(make("p","empty","No expenses for this month."));
  entries.forEach(([name,amount])=>{const row=make("div","bar-row"),head=make("div","bar-label");head.append(make("span","",name),make("strong","",money(amount)));const bar=make("div","bar"),fill=make("span");fill.style.width=(expense?amount/expense*100:0)+"%";bar.appendChild(fill);row.append(head,bar);list.appendChild(row);});
  const chart=document.getElementById("incomeExpenseChart");chart.replaceChildren();
  if(!income&&!expense)chart.appendChild(make("p","empty","Add transactions to see your comparison."));
  else [{label:"Income",value:income,color:"var(--green)"},{label:"Expenses",value:expense,color:"var(--red)"}].forEach(item=>{const row=make("div","bar-row"),head=make("div","bar-label");head.append(make("span","",item.label),make("strong","",money(item.value)));const bar=make("div","bar"),fill=make("span");fill.style.width=(Math.max(income,expense)?item.value/Math.max(income,expense)*100:0)+"%";fill.style.background=item.color;bar.appendChild(fill);row.append(head,bar);chart.appendChild(row);});
}
function setupReports(){const input=document.getElementById("reportMonth");if(!input)return;input.value=currentMonth;input.addEventListener("change",updateReports);document.getElementById("reportExport").addEventListener("click",()=>downloadCsv(monthItems(input.value),"pockettrack-"+input.value+".csv"));updateReports();}
updateDashboard();setupTransactions();setupBudget();setupReports();
