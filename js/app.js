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
  const keys=[STORAGE_KEY,BUDGET_KEY,CATEGORY_KEY];
  const oldValues=keys.map(key=>localStorage.getItem(key));
  try {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(transactions));
    localStorage.setItem(BUDGET_KEY,JSON.stringify(budgets));
    localStorage.setItem(CATEGORY_KEY,JSON.stringify(categoryBudgets));
    return true;
  } catch (error) {
    keys.forEach((key,index)=>{
      try {
        if(oldValues[index]===null)localStorage.removeItem(key);
        else localStorage.setItem(key,oldValues[index]);
      } catch (restoreError) {}
    });
    transactions=loadData(STORAGE_KEY,[]);
    budgets=loadData(BUDGET_KEY,{});
    categoryBudgets=loadData(CATEGORY_KEY,{});
    alert("Could not save changes. Your previous saved data has been kept. Check browser storage or privacy settings.");
    return false;
  }
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
  const quote=value=>{
    let text=String(value??"");
    if(/^[=+@\-\t\r]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  };
  const csv=[columns,...rows].map(row=>row.map(quote).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
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
  const input=document.getElementById("reportMonth");
  if(!input)return;
  const month=input.value||currentMonth;
  const items=monthItems(month);
  const income=sum(items,"income");
  const expense=sum(items,"expense");
  const savings=income-expense;
  const savingsRate=income?(savings/income)*100:0;

  document.getElementById("reportIncome").textContent=money(income);
  document.getElementById("reportExpense").textContent=money(expense);
  document.getElementById("reportSavings").textContent=money(savings);
  document.getElementById("reportSavingsRate").textContent=income?savingsRate.toFixed(1)+"%":"—";

  const expenseItems=items.filter(item=>item.type==="expense");
  const categoryTotals={};
  expenseItems.forEach(item=>{
    categoryTotals[item.category]=(categoryTotals[item.category]||0)+Number(item.amount);
  });
  const categoryEntries=Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]);
  const top=categoryEntries[0];
  const topCategory=document.getElementById("topCategory");
  const topDetail=document.getElementById("topCategoryDetail");
  topCategory.textContent=top?top[0]:"No data yet";
  topDetail.textContent=top?money(top[1])+" · "+(expense?((top[1]/expense)*100).toFixed(1):0)+"% of your expenses":"Add expenses to discover your top category.";

  const largest=[...expenseItems].sort((a,b)=>Number(b.amount)-Number(a.amount))[0];
  document.getElementById("largestExpense").textContent=largest?money(largest.amount):"No data yet";
  document.getElementById("largestExpenseDetail").textContent=largest?largest.description+" · "+largest.category+" · "+largest.date:"Your biggest single expense will appear here.";

  const year=Number(month.slice(0,4)),monthNumber=Number(month.slice(5,7));
  const daysInMonth=new Date(year,monthNumber,0).getDate();
  const todayMonth=currentMonth;
  const daysCounted=month===todayMonth?Math.max(1,today.getDate()):daysInMonth;
  document.getElementById("dailyAverage").textContent=money(expense/daysCounted);
  document.getElementById("dailyAverageDetail").textContent="Based on "+daysCounted+" calendar day"+(daysCounted===1?"":"s")+" in the selected month.";

  const previousDate=new Date(year,monthNumber-2,1);
  const previousMonth=previousDate.getFullYear()+"-"+String(previousDate.getMonth()+1).padStart(2,"0");
  const previousExpense=sum(monthItems(previousMonth),"expense");
  const change=document.getElementById("expenseChange");
  const changeDetail=document.getElementById("expenseChangeDetail");
  const changeBar=document.getElementById("comparisonProgress");
  if(previousExpense===0&&expense===0){
    change.textContent="No change";
    changeDetail.textContent="No expenses recorded in either selected or previous month.";
    changeBar.style.width="0%";
    changeBar.className="";
  }else if(previousExpense===0){
    change.textContent="New spending";
    changeDetail.textContent="You recorded "+money(expense)+" in expenses. There was no spending recorded in "+previousMonth+".";
    changeBar.style.width="100%";
    changeBar.className="warn";
  }else{
    const difference=expense-previousExpense;
    const percentage=Math.abs(difference/previousExpense*100);
    change.textContent=(difference>0?"+":difference<0?"−":"")+percentage.toFixed(1)+"%";
    changeDetail.textContent=difference>0?"Expenses increased by "+money(difference)+" compared with "+previousMonth+".":difference<0?"Expenses decreased by "+money(Math.abs(difference))+" compared with "+previousMonth+".":"Your expenses are the same as the previous month.";
    changeBar.style.width=Math.min(percentage,100)+"%";
    changeBar.className=difference>0?"warn":"";
  }

  const budgetLimit=Number(budgets[month])||0;
  const budgetPercent=budgetLimit?expense/budgetLimit*100:0;
  const budgetHealth=document.getElementById("budgetHealth");
  const budgetDetail=document.getElementById("budgetHealthDetail");
  const budgetBar=document.getElementById("insightBudgetProgress");
  if(!budgetLimit){
    budgetHealth.textContent="No budget set";
    budgetDetail.textContent="Set a monthly budget to see how your spending compares.";
    budgetBar.style.width="0%";
    budgetBar.className="";
  }else{
    budgetHealth.textContent=budgetPercent.toFixed(0)+"% used";
    budgetDetail.textContent=budgetPercent>=100?"You are "+money(expense-budgetLimit)+" over your budget.":money(budgetLimit-expense)+" remaining from your "+money(budgetLimit)+" limit.";
    budgetBar.style.width=Math.min(budgetPercent,100)+"%";
    budgetBar.className=budgetPercent>=100?"over":budgetPercent>=80?"warn":"";
  }

  const categoryList=document.getElementById("reportCategories");
  categoryList.replaceChildren();
  if(!categoryEntries.length){
    categoryList.appendChild(make("p","empty","No expenses recorded for this month."));
  }else{
    categoryEntries.forEach(([name,amount])=>{
      const row=make("div","bar-row");
      const head=make("div","bar-label");
      head.append(make("span","",name),make("strong","",money(amount)+" · "+(expense?amount/expense*100:0).toFixed(1)+"%"));
      const bar=make("div","bar");
      const fill=make("span");
      fill.style.width=(expense?amount/expense*100:0)+"%";
      bar.appendChild(fill);
      row.append(head,bar);
      categoryList.appendChild(row);
    });
  }

  const recommendations=document.getElementById("reportRecommendations");
  recommendations.replaceChildren();
  const tips=[];
  if(!items.length){
    tips.push("No transactions found for this month. Add your income and expenses to unlock useful insights.");
  }else{
    if(savings<0)tips.push("Your expenses are higher than your income by "+money(Math.abs(savings))+". Review non-essential spending first.");
    else if(income>0&&savingsRate>=20)tips.push("You saved "+savingsRate.toFixed(1)+"% of your income. Keep following the habits that helped you reach this.");
    else if(income>0&&savingsRate>=0)tips.push("Your savings rate is "+savingsRate.toFixed(1)+"%. Try setting aside a small amount as soon as income arrives.");
    if(top&&expense>0&&top[1]/expense>=0.4)tips.push(top[0]+" accounts for "+(top[1]/expense*100).toFixed(1)+"% of your spending. Check whether this category has any costs you can reduce.");
    if(previousExpense>0&&expense>previousExpense*1.15)tips.push("Your spending is more than 15% higher than last month. Review recent purchases to find what changed.");
    if(previousExpense>0&&expense<previousExpense*0.85)tips.push("Your spending is down by more than 15% compared with last month. Keep the sustainable changes going.");
    if(budgetLimit&&budgetPercent>=100)tips.push("You have crossed your monthly budget. Pause optional purchases and review the remaining days of the month.");
    else if(budgetLimit&&budgetPercent>=80)tips.push("You have used "+budgetPercent.toFixed(0)+"% of your budget. Set a smaller weekly spending limit for the rest of the month.");
    if(largest&&expenseItems.length>1)tips.push("Your largest purchase was "+largest.description+" for "+money(largest.amount)+". Consider planning for similar large costs in advance.");
    if(!tips.length)tips.push("Your spending looks steady based on the available records. Keep recording transactions so future insights become more useful.");
  }
  tips.forEach(tip=>{
    const row=make("div","recommendation-item");
    row.appendChild(make("span","recommendation-mark","✓"));
    row.appendChild(make("p","",tip));
    recommendations.appendChild(row);
  });
}
function setupReports(){const input=document.getElementById("reportMonth");if(!input)return;input.value=currentMonth;input.addEventListener("change",updateReports);updateReports();}
updateDashboard();setupTransactions();setupBudget();setupReports();
