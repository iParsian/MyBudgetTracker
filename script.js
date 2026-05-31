let appState = {
  currency: "IRR",
  calendar: "english",
  language: "english",
  theme: "linen",
  dashboard_widgets: ["pie", "ai_report", "budget", "recent"],
  living_country: "IR",
  inflation_rate: 0,
  categories: [],
  transactions: [],
  recurring_transactions: [],
  category_rules: [],
  goals: [],
  investments: [],
  market_provider: { name: "navasan", api_key: "", price_unit: "toman" }
};
let annualYearOffset = 0;
let dashboardMonthOffset = 0;
let pieSlices = [];
let storageState = {};
let importRows = [];
let aiReportState = null;
let currentAiSuggestion = null;
let aiHintRequestId = 0;
let marketState = { rates: { status: "missing_api_key", items: {} }, portfolio: { holdings: [] } };

const piePalettes = {
  linen: ["#1c6680", "#1ba0d0", "#15772b", "#ff7a35", "#a72fa8", "#6f4ba8", "#d6a22d", "#3c8d88"],
  sage: ["#547d64", "#8fb69c", "#b8c89b", "#d8b878", "#c98b72", "#9a7fae", "#6fa6a0", "#b5a36f"],
  mist: ["#637f8d", "#9bb6c4", "#76a5b7", "#a7c6d1", "#d4a6a0", "#a7a2c8", "#b5c0cf", "#7c9ca6"],
  "pale-blue": ["#5f8fad", "#91bdd3", "#bdd9e7", "#7aa9c2", "#a7c6dc", "#d5b8c5", "#96b6c8", "#6f9bb5"],
  "pale-pink": ["#b87991", "#d9a7b8", "#f0c7d4", "#c98b9d", "#e3b4a4", "#b9a0c7", "#d7a0ad", "#bd8e9f"],
  "pale-green": ["#6f9f81", "#9ec9a8", "#c7dfc4", "#84b895", "#b8d6a6", "#d5c48e", "#8bb9a5", "#78aa8c"]
};

const elements = {
  savedStatus: document.querySelector("#savedStatus"),
  currentMonthTitle: document.querySelector("#currentMonthTitle"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceLabel: document.querySelector("#balanceLabel"),
  balanceTotal: document.querySelector("#balanceTotal"),
  savingsRate: document.querySelector("#savingsRate"),
  budgetPlanned: document.querySelector("#budgetPlanned"),
  budgetSpent: document.querySelector("#budgetSpent"),
  budgetRemaining: document.querySelector("#budgetRemaining"),
  budgetOverCount: document.querySelector("#budgetOverCount"),
  expensePie: document.querySelector("#expensePie"),
  pieTooltip: document.querySelector("#pieTooltip"),
  pieSummary: document.querySelector("#pieSummary"),
  dashboardTrendChart: document.querySelector("#dashboardTrendChart"),
  dashboardCategoryChart: document.querySelector("#dashboardCategoryChart"),
  dashboardAiReport: document.querySelector("#dashboardAiReport"),
  budgetHealth: document.querySelector("#budgetHealth"),
  recentTransactions: document.querySelector("#recentTransactions"),
  transactionModal: document.querySelector("#transactionModal"),
  tableAddTransactionButton: document.querySelector("#tableAddTransactionButton"),
  closeTransactionFormButton: document.querySelector("#closeTransactionFormButton"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionFormTitle: document.querySelector("#transactionFormTitle"),
  englishDateGroup: document.querySelector("#englishDateGroup"),
  persianDateGroup: document.querySelector("#persianDateGroup"),
  transactionId: document.querySelector("#transactionId"),
  dateInput: document.querySelector("#dateInput"),
  persianYearInput: document.querySelector("#persianYearInput"),
  persianMonthInput: document.querySelector("#persianMonthInput"),
  persianDayInput: document.querySelector("#persianDayInput"),
  timeInput: document.querySelector("#timeInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  transactionAiHint: document.querySelector("#transactionAiHint"),
  categoryInput: document.querySelector("#categoryInput"),
  amountInput: document.querySelector("#amountInput"),
  clearFormButton: document.querySelector("#clearFormButton"),
  transactionsTable: document.querySelector("#transactionsTable"),
  searchInput: document.querySelector("#searchInput"),
  filterCategory: document.querySelector("#filterCategory"),
  settingsForm: document.querySelector("#settingsForm"),
  currencyInput: document.querySelector("#currencyInput"),
  calendarInput: document.querySelector("#calendarInput"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryModal: document.querySelector("#categoryModal"),
  categoryFormTitle: document.querySelector("#categoryFormTitle"),
  openCategoryFormButton: document.querySelector("#openCategoryFormButton"),
  closeCategoryFormButton: document.querySelector("#closeCategoryFormButton"),
  clearCategoryFormButton: document.querySelector("#clearCategoryFormButton"),
  newCategoryInput: document.querySelector("#newCategoryInput"),
  categoryTypeInput: document.querySelector("#categoryTypeInput"),
  budgetInput: document.querySelector("#budgetInput"),
  applyAiBudgetsButton: document.querySelector("#applyAiBudgetsButton"),
  budgetTable: document.querySelector("#budgetTable"),
  budgetWatchList: document.querySelector("#budgetWatchList"),
  annualTitle: document.querySelector("#annualTitle"),
  annualChart: document.querySelector("#annualChart"),
  annualTable: document.querySelector("#annualTable"),
  previousYearButton: document.querySelector("#previousYearButton"),
  nextYearButton: document.querySelector("#nextYearButton"),
  languageInput: document.querySelector("#languageInput"),
  themeInput: document.querySelector("#themeInput"),
  livingCountryInput: document.querySelector("#livingCountryInput"),
  inflationRateInput: document.querySelector("#inflationRateInput"),
  marketProviderInput: document.querySelector("#marketProviderInput"),
  marketApiKeyInput: document.querySelector("#marketApiKeyInput"),
  settingsCategoryList: document.querySelector("#settingsCategoryList"),
  dataFileInput: document.querySelector("#dataFileInput"),
  browseDataFileButton: document.querySelector("#browseDataFileButton"),
  saveDataFileButton: document.querySelector("#saveDataFileButton"),
  backupNowButton: document.querySelector("#backupNowButton"),
  backupFolderText: document.querySelector("#backupFolderText"),
  backupCountText: document.querySelector("#backupCountText"),
  previousMonthButton: document.querySelector("#previousMonthButton"),
  currentMonthButton: document.querySelector("#currentMonthButton"),
  nextMonthButton: document.querySelector("#nextMonthButton"),
  filterType: document.querySelector("#filterType"),
  filterFromDate: document.querySelector("#filterFromDate"),
  filterToDate: document.querySelector("#filterToDate"),
  filterMinAmount: document.querySelector("#filterMinAmount"),
  filterMaxAmount: document.querySelector("#filterMaxAmount"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  aiConfidence: document.querySelector("#aiConfidence"),
  aiMonthEnd: document.querySelector("#aiMonthEnd"),
  aiSavingIdea: document.querySelector("#aiSavingIdea"),
  aiRiskLevel: document.querySelector("#aiRiskLevel"),
  aiExecutiveSummary: document.querySelector("#aiExecutiveSummary"),
  aiSuggestions: document.querySelector("#aiSuggestions"),
  aiHabits: document.querySelector("#aiHabits"),
  aiAutofillGuide: document.querySelector("#aiAutofillGuide"),
  importFileInput: document.querySelector("#importFileInput"),
  importDateColumn: document.querySelector("#importDateColumn"),
  importDescriptionColumn: document.querySelector("#importDescriptionColumn"),
  importAmountColumn: document.querySelector("#importAmountColumn"),
  importCategoryColumn: document.querySelector("#importCategoryColumn"),
  importTransactionsButton: document.querySelector("#importTransactionsButton"),
  importPreview: document.querySelector("#importPreview"),
  backupList: document.querySelector("#backupList"),
  applyRecurringButton: document.querySelector("#applyRecurringButton"),
  recurringForm: document.querySelector("#recurringForm"),
  recurringDescription: document.querySelector("#recurringDescription"),
  recurringCategory: document.querySelector("#recurringCategory"),
  recurringAmount: document.querySelector("#recurringAmount"),
  recurringStartDate: document.querySelector("#recurringStartDate"),
  recurringDay: document.querySelector("#recurringDay"),
  recurringList: document.querySelector("#recurringList"),
  ruleForm: document.querySelector("#ruleForm"),
  ruleContains: document.querySelector("#ruleContains"),
  ruleCategory: document.querySelector("#ruleCategory"),
  ruleList: document.querySelector("#ruleList"),
  goalForm: document.querySelector("#goalForm"),
  goalName: document.querySelector("#goalName"),
  goalType: document.querySelector("#goalType"),
  goalCategory: document.querySelector("#goalCategory"),
  goalTarget: document.querySelector("#goalTarget"),
  goalList: document.querySelector("#goalList"),
  widgetForm: document.querySelector("#widgetForm")
};
Object.assign(elements, {
  investmentValue: document.querySelector("#investmentValue"),
  investmentCost: document.querySelector("#investmentCost"),
  investmentGain: document.querySelector("#investmentGain"),
  investmentRateStatus: document.querySelector("#investmentRateStatus"),
  investmentForm: document.querySelector("#investmentForm"),
  investmentName: document.querySelector("#investmentName"),
  investmentType: document.querySelector("#investmentType"),
  investmentQuantity: document.querySelector("#investmentQuantity"),
  investmentPurchasePrice: document.querySelector("#investmentPurchasePrice"),
  investmentManualPrice: document.querySelector("#investmentManualPrice"),
  investmentUseMarketPrice: document.querySelector("#investmentUseMarketPrice"),
  investmentList: document.querySelector("#investmentList"),
  refreshRatesButton: document.querySelector("#refreshRatesButton"),
  updateInvestmentPricesButton: document.querySelector("#updateInvestmentPricesButton")
});

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadData() {
  setStatus("Loading");
  appState = await api("/api/data");
  storageState = await api("/api/storage");
  await refreshAiReport();
  await refreshMarketRates();
  resetTransactionForm();
  render();
  document.querySelector(".month-controls").hidden = false;
  setStatus("Saved automatically");
}

async function persist(path, options) {
  setStatus("Saving");
  appState = await api(path, options);
  storageState = await api("/api/storage");
  await refreshAiReport();
  await refreshMarketRates();
  render();
  setStatus("Saved automatically");
}

async function updateStorage(path, options) {
  setStatus("Updating storage");
  storageState = await api(path, options);
  appState = await api("/api/data");
  await refreshAiReport();
  render();
  setStatus("Storage saved");
}

async function refreshAiReport() {
  try {
    aiReportState = await api("/api/ai/report");
  } catch {
    aiReportState = null;
  }
}

async function refreshMarketRates() {
  try {
    marketState = await api("/api/market-rates");
  } catch {
    marketState = { rates: { status: "error", items: {} }, portfolio: portfolioFromManualPrices() };
  }
}

function setStatus(message) {
  elements.savedStatus.textContent = message;
}

function formatMoney(value, options = {}) {
  const currency = appState.currency || "IRR";
  const locale = appState.language === "persian" ? "fa-IR" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IRR" ? 0 : 2
    }).format(value || 0);
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString("en-US")}`;
  }
}

function categoryByName(name) {
  return appState.categories.find((category) => category.name === name);
}

function signedAmountForCategory(categoryName, amount) {
  const category = categoryByName(categoryName);
  const absolute = Math.abs(Number(amount) || 0);
  return category && category.type === "income" ? absolute : -absolute;
}

function chartColors() {
  return piePalettes[appState.theme || "linen"] || piePalettes.linen;
}

function currentMonthTransactions() {
  const activeKey = calendarMonthKey(selectedDashboardDate());
  return appState.transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);
    return calendarMonthKey(date) === activeKey;
  });
}

function selectedDashboardDate() {
  const now = new Date();
  return addMonthsClamped(now, dashboardMonthOffset);
}

function addMonthsClamped(date, offset) {
  const target = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

function calendarMonthKey(date) {
  if (appState.calendar === "persian") {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "numeric"
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year").value;
    const month = parts.find((part) => part.type === "month").value;
    return `${year}-${month}`;
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function calendarYearKey(date) {
  if (appState.calendar === "persian") {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric"
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === "year").value);
  }
  return date.getFullYear();
}

function calendarMonthNumber(date) {
  if (appState.calendar === "persian") {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      month: "numeric"
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === "month").value);
  }
  return date.getMonth() + 1;
}

function expensesByCategory(transactions) {
  return transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + Math.abs(Number(transaction.amount));
      return totals;
    }, {});
}

function totalsByCategory(transactions) {
  return transactions.reduce((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] || 0) + Math.abs(Number(transaction.amount));
    return totals;
  }, {});
}

function expenseCategories() {
  return appState.categories.filter((category) => (category.type || "expense") === "expense");
}

function render() {
  applyTheme();
  updateTransactionDateMode();
  renderSelectors();
  renderDashboard();
  renderTransactions();
  renderBudgets();
  renderInvestments();
  renderAnnual();
  renderAiCoach();
  renderSettings();
}

function applyTheme() {
  document.documentElement.dataset.theme = appState.theme || "linen";
  document.documentElement.lang = appState.language === "persian" ? "fa" : "en";
}

function renderSelectors() {
  const selectedCategory = elements.categoryInput.value;
  const selectedFilter = elements.filterCategory.value;
  const categories = appState.categories.map((category) => category.name).sort();
  elements.categoryInput.innerHTML = categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  elements.filterCategory.innerHTML = `<option value="">All categories</option>${categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  [elements.recurringCategory, elements.ruleCategory, elements.goalCategory].forEach((select) => {
    select.innerHTML = `${select === elements.goalCategory ? '<option value="">Any category</option>' : ""}${categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  });
  if (categories.includes(selectedCategory)) {
    elements.categoryInput.value = selectedCategory;
  }
  if (categories.includes(selectedFilter)) {
    elements.filterCategory.value = selectedFilter;
  }
}

function renderDashboard() {
  const monthly = currentMonthTransactions();
  const income = monthly.filter((item) => item.amount > 0).reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = monthly.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const now = selectedDashboardDate();

  elements.currentMonthTitle.textContent = formatMonthTitle(now);
  elements.balanceLabel.textContent = balance >= 0 ? "Saving" : "Loss";
  elements.incomeTotal.textContent = formatMoney(income, { compact: true });
  elements.expenseTotal.textContent = formatMoney(expenses, { compact: true });
  elements.balanceTotal.textContent = formatMoney(balance, { compact: true });
  elements.savingsRate.textContent = `${savingsRate}%`;

  renderPieChart(buildIncomeExpensePieModel(monthly));
  renderDashboardAiReport(monthly, income, expenses, balance);
  renderDashboardCharts(monthly);
  renderBudgetHealth(monthly);
  renderRecentTransactions();
  renderDashboardWidgets();
}

function buildIncomeExpensePieModel(monthly) {
  const income = monthly.filter((item) => item.amount > 0).reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = monthly.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const remaining = Math.max(income - expenses, 0);
  const overspent = Math.max(expenses - income, 0);
  const slices = Object.entries(expensesByCategory(monthly))
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      label: category,
      category,
      amount,
      kind: "expense_deduction",
      percentage_of_income: income > 0 ? (amount / income) * 100 : 0
    }));
  if (remaining > 0) {
    slices.push({ label: "Remaining income", category: "Remaining income", amount: remaining, kind: "remaining", percentage_of_income: income > 0 ? (remaining / income) * 100 : 0 });
  }
  if (overspent > 0) {
    slices.push({ label: "Overspent beyond income", category: "Overspent beyond income", amount: overspent, kind: "overspent", percentage_of_income: income > 0 ? (overspent / income) * 100 : 0 });
  }
  return {
    base_label: "Total income",
    base_amount: income,
    total_expenses: expenses,
    remaining_income: remaining,
    overspent,
    slices
  };
}

function renderDashboardAiReport(monthly, income, expenses, balance) {
  const expenseItems = monthly.filter((item) => Number(item.amount) < 0);
  const largest = expenseItems
    .map((item) => ({ ...item, amount: Math.abs(Number(item.amount)) }))
    .sort((a, b) => b.amount - a.amount)[0];
  const averageExpense = expenseItems.length ? expenses / expenseItems.length : 0;
  const report = aiReportState || {};
  const health = report.health_score || {};
  const forecast = report.forecast || {};
  const actions = (report.action_queue || []).slice(0, 4);
  const brief = report.priority_brief || {};
  const executiveSummary = brief.headline || report.executive_summary || `${balance >= 0 ? "Saving" : "Loss"} this month. Largest expense is ${largest ? largest.description : "not available yet"}.`;

  elements.dashboardAiReport.innerHTML = `
    <div class="insight-card ai-summary-card">
      <small>${escapeHtml(report.title || "AI Financial Report")}</small>
      <strong class="${healthToneClass(health)}">${health.score != null ? `${health.score}/100` : formatMoney(balance)}</strong>
      <span>${escapeHtml(executiveSummary)}</span>
      <div class="mini-metrics">
        <span><small>Daily spend</small><strong>${formatMoney(brief.daily_expense_rate || 0, { compact: true })}</strong></span>
        <span><small>Remaining days</small><strong>${brief.remaining_days ?? "-"}</strong></span>
      </div>
    </div>
    <div class="insight-card">
      <small>Projected net</small>
      <strong>${formatMoney(forecast.projected_net ?? balance, { compact: true })}</strong>
      <span>${forecast.projected_savings_rate != null ? `${Math.round(forecast.projected_savings_rate)}% projected savings rate` : `${expenseItems.length} expense records`}</span>
    </div>
    <div class="insight-card">
      <small>Largest expense</small>
      <strong>${largest ? formatMoney(largest.amount, { compact: true }) : formatMoney(0, { compact: true })}</strong>
      <span>${largest ? escapeHtml(largest.description) : "No expenses yet"}</span>
    </div>
    <div class="insight-card">
      <small>Average expense</small>
      <strong>${formatMoney(averageExpense, { compact: true })}</strong>
      <span>${report.data_quality?.summary?.duplicate_groups || 0} duplicate group(s) flagged</span>
    </div>
    <div class="ai-action-list">
      ${actions.map((item) => aiActionItem(item, true)).join("") || `<div class="empty-state">No report actions yet.</div>`}
    </div>
  `;
}

function renderDashboardWidgets() {
  const visible = new Set(normalizedDashboardWidgets(appState.dashboard_widgets));
  document.querySelectorAll(".dashboard-widget").forEach((widget) => {
    widget.hidden = !visible.has(widget.dataset.widget);
  });
}

function normalizedDashboardWidgets(widgets) {
  const aliases = new Set(["insights", "goals", "ai", "report", "reports", "ai_coach", "ai_coaching", "coach", "coaching"]);
  const source = Array.isArray(widgets) ? widgets : ["pie", "ai_report", "budget", "recent"];
  const normalized = [];
  source.forEach((widget) => {
    let value = String(widget || "").trim().toLowerCase().replace(/-/g, "_");
    if (aliases.has(value)) {
      value = "ai_report";
    }
    if (["pie", "ai_report", "budget", "recent"].includes(value) && !normalized.includes(value)) {
      normalized.push(value);
    }
  });
  return normalized;
}

function healthToneClass(health) {
  const score = Number(health.score ?? 75);
  if (score < 50 || health.label === "High risk") {
    return "negative";
  }
  if (score < 70 || health.label === "Watch") {
    return "warning";
  }
  return "positive";
}

function toneFromItem(item) {
  if (item.tone) {
    return item.tone;
  }
  if (item.severity === "danger" || item.status === "behind") {
    return "negative";
  }
  if (item.severity === "warning" || item.type === "savings_opportunity" || item.type === "forecast_review") {
    return "warning";
  }
  return "neutral";
}

function aiActionItem(item, compact = false) {
  return `
    <div class="ai-card ${toneFromItem(item)} ${compact ? "compact-ai-card" : ""}">
      <div class="ai-card-top">
        <strong>${escapeHtml(item.title || item.type || "Review item")}</strong>
        ${item.impact ? `<small>${formatMoney(item.impact, { compact: true })}</small>` : ""}
      </div>
      <span>${escapeHtml(item.message || item.reason || item.text || "")}</span>
      ${item.next_step ? `<em>${escapeHtml(item.next_step)}</em>` : ""}
    </div>
  `;
}

function renderDashboardCharts(monthly) {
  renderRecentMonthTrend();
  renderCurrentCategoryBars(monthly);
}

function renderRecentMonthTrend() {
  const selectedDate = selectedDashboardDate();
  const rows = [];
  for (let offset = -5; offset <= 0; offset += 1) {
    const date = addMonthsClamped(selectedDate, offset);
    const key = calendarMonthKey(date);
    const transactions = appState.transactions.filter((transaction) => {
      const transactionDate = new Date(`${transaction.date}T00:00:00`);
      return calendarMonthKey(transactionDate) === key;
    });
    const income = transactions.filter((item) => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = transactions.filter((item) => Number(item.amount) < 0).reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
    rows.push({ date, income, expenses, net: income - expenses });
  }
  const maxValue = Math.max(...rows.flatMap((row) => [row.income, row.expenses]), 1);
  elements.dashboardTrendChart.innerHTML = rows.map((row) => {
    const incomeHeight = Math.max(3, Math.round((row.income / maxValue) * 100));
    const expenseHeight = Math.max(3, Math.round((row.expenses / maxValue) * 100));
    const label = formatMonthTitle(row.date).split(" ")[0];
    return `
      <div class="dashboard-trend-month" title="${escapeHtml(formatMonthTitle(row.date))}">
        <div class="dashboard-trend-bars">
          <span class="dashboard-bar income-bar" style="height:${incomeHeight}%" title="Income: ${escapeHtml(formatMoney(row.income))}"></span>
          <span class="dashboard-bar expense-bar" style="height:${expenseHeight}%" title="Expenses: ${escapeHtml(formatMoney(row.expenses))}"></span>
        </div>
        <strong class="${row.net >= 0 ? "positive" : "negative"}">${formatMoney(row.net)}</strong>
        <small>${escapeHtml(label)}</small>
      </div>
    `;
  }).join("");
}

function renderCurrentCategoryBars(monthly) {
  const rows = Object.entries(expensesByCategory(monthly))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  if (!rows.length) {
    elements.dashboardCategoryChart.innerHTML = `<div class="empty-state">No expenses recorded this month.</div>`;
    return;
  }
  const maxValue = Math.max(...rows.map((row) => row[1]), 1);
  elements.dashboardCategoryChart.innerHTML = rows.map(([category, amount], index) => {
    const width = Math.max(4, Math.round((amount / maxValue) * 100));
    const color = chartColors()[index % chartColors().length];
    return `
      <div class="category-bar-row">
        <div class="category-bar-label">
          <strong>${escapeHtml(category)}</strong>
          <small>${formatMoney(amount)}</small>
        </div>
        <div class="category-bar-track">
          <span style="width:${width}%; background:${color}"></span>
        </div>
      </div>
    `;
  }).join("");
}

function renderGoalProgress(monthly, income, expenses, balance) {
  if (!elements.goalProgress) {
    return;
  }
  const goals = appState.goals || [];
  if (!goals.length) {
    elements.goalProgress.innerHTML = `<div class="empty-state">Add monthly goals in Settings.</div>`;
    return;
  }
  const spent = expensesByCategory(monthly);
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  elements.goalProgress.innerHTML = goals.map((goal) => {
    const isSavings = goal.type === "savings_rate";
    const actual = isSavings ? savingsRate : (spent[goal.category] || 0);
    const target = Number(goal.target || 0);
    const percent = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
    const success = isSavings ? actual >= target : actual <= target;
    const value = isSavings ? `${Math.round(actual)}% of ${target}%` : `${formatMoney(actual)} of ${formatMoney(target)}`;
    return `
      <div class="goal-card">
        <div>
          <strong>${escapeHtml(goal.name)}</strong>
          <small>${isSavings ? "Savings rate" : escapeHtml(goal.category || "Category spend")}</small>
        </div>
        <strong class="${success ? "positive" : "warning"}">${value}</strong>
        <div class="progress-track"><div class="progress-fill ${success ? "" : "is-over"}" style="width:${percent}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderPieChart(model) {
  const entries = (model.slices || []).map((slice) => [slice.label || slice.category, Number(slice.amount || 0), slice]);
  const { context, width, height } = preparePieCanvas();
  const centerX = width / 2;
  const centerY = height / 2 + 8;
  const radius = Math.min(width, height) / 2 - 76;
  pieSlices = [];
  context.clearRect(0, 0, width, height);

  if (!entries.length) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = "#eef1f3";
    context.fill();
    pieSlices = [];
    elements.pieSummary.innerHTML = `<div class="empty-state">No income or expenses recorded this month.</div>`;
    return;
  }

  const total = entries.reduce((sum, entry) => sum + entry[1], 0);
  let startAngle = -Math.PI / 2;

  entries.forEach(([name, amount, slice], index) => {
    const colors = chartColors();
    const angle = (amount / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    context.closePath();
    context.shadowColor = "rgba(28, 43, 50, 0.28)";
    context.shadowBlur = 14;
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 8;
    context.fillStyle = colors[index % colors.length];
    context.fill();
    context.shadowColor = "transparent";
    pieSlices.push({
      name,
      amount,
      kind: slice.kind,
      percentageOfIncome: slice.percentage_of_income,
      color: colors[index % colors.length],
      startAngle,
      endAngle: startAngle + angle
    });
    startAngle += angle;
  });

  renderPieSummary(total, model);
}

function preparePieCanvas() {
  const canvas = elements.expensePie;
  const rect = canvas.getBoundingClientRect();
  const fallbackWidth = 560;
  const fallbackHeight = 462;
  const width = Math.max(280, Math.round(rect.width || fallbackWidth));
  const height = Math.max(240, Math.round(rect.height || (width * fallbackHeight) / fallbackWidth));
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
}

function renderPieSummary(total, model) {
  elements.pieSummary.innerHTML = `
    <div class="pie-base-row">
      <small>${escapeHtml(model.base_label || "Total income")}</small>
      <strong>${formatMoney(model.base_amount || 0, { compact: true })}</strong>
    </div>
    ${pieSlices.map((slice) => {
    const percentage = Math.round((slice.amount / total) * 100);
    return `
      <div class="pie-summary-row">
        <span class="pie-dot" style="background:${slice.color}"></span>
        <strong>${escapeHtml(slice.name)}</strong>
        <span>${slice.percentageOfIncome != null ? `${Math.round(slice.percentageOfIncome)}%` : `${percentage}%`}</span>
        <small>${formatMoney(slice.amount, { compact: true })}</small>
      </div>
    `;
  }).join("")}`;
}

function renderBudgetHealth(monthly) {
  const spent = expensesByCategory(monthly);
  const targets = budgetTargetsByCategory();
  const rows = expenseCategories()
    .filter((category) => category.budget > 0 || spent[category.name] || targets[category.name])
    .map((category) => budgetItem({ ...category, aiBudgetTarget: targets[category.name] }, spent[category.name] || 0));
  elements.budgetHealth.innerHTML = rows.join("") || `<div class="empty-state">Add category budgets in Settings.</div>`;
}

function budgetTargetsByCategory() {
  return (aiReportState?.budget_targets || []).reduce((map, item) => {
    map[item.category] = item;
    return map;
  }, {});
}

function budgetItem(category, actual, mode = "card") {
  const budget = Number(category.budget || 0);
  const difference = budget - actual;
  const percent = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 100;
  if (mode === "row") {
    const rowPercent = budget > 0 ? Math.round((actual / budget) * 100) : 0;
    const state = difference < 0 ? "Over budget" : "Remaining";
    const aiTarget = category.aiBudgetTarget || category.ai_budget;
    const shownBudget = budget || Number(aiTarget?.target_budget || 0);
    const budgetLabel = budget > 0 ? "Monthly category limit" : aiTarget ? "AI target available" : "No budget set";
    return `
      <div class="budget-runway-item">
        <div class="budget-runway-main">
          <div>
            <strong>${escapeHtml(category.name)}</strong>
            <small>${budgetLabel}</small>
          </div>
          <span class="status-pill ${difference < 0 ? "is-over" : ""}">${state}</span>
        </div>
        <div class="budget-runway-values">
          <span><small>Used</small><strong class="${difference < 0 ? "negative" : ""}">${budget > 0 ? `${rowPercent}%` : "-"}</strong></span>
          <span><small>Spent</small><strong class="money negative">${formatMoney(actual, { compact: true })}</strong></span>
          <span><small>${budget > 0 ? "Budget" : "AI target"}</small><strong class="money">${formatMoney(shownBudget, { compact: true })}</strong></span>
          <span><small>${state}</small><strong class="money ${difference >= 0 ? "positive" : "negative"}">${formatMoney(Math.abs(difference), { compact: true })}</strong></span>
          ${aiTarget ? `<span><small>Optimum</small><strong class="money positive">${formatMoney(aiTarget.optimum_budget || 0, { compact: true })}</strong></span>` : ""}
        </div>
      </div>
    `;
  }
  return `
    <div class="budget-item">
      <div>
        <strong>${escapeHtml(category.name)}</strong><br>
        <small>${formatMoney(actual)} of ${formatMoney(budget)}</small>
      </div>
      <strong class="${difference >= 0 ? "positive" : "negative"}">${formatMoney(difference)}</strong>
      <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
    </div>
  `;
}

function renderRecentTransactions() {
  const recent = [...appState.transactions]
    .sort((a, b) => transactionSortKey(b).localeCompare(transactionSortKey(a)))
    .slice(0, 6);

  elements.recentTransactions.innerHTML = recent.map((transaction) => `
    <div class="transaction-item">
      <div>
        <strong>${escapeHtml(transaction.description)}</strong><br>
        <small>${formatTransactionDateTime(transaction)} - ${escapeHtml(transaction.category)}</small>
      </div>
      <strong class="money ${transaction.amount >= 0 ? "positive" : "negative"}">${formatMoney(transaction.amount)}</strong>
    </div>
  `).join("") || `<div class="empty-state">No transactions yet.</div>`;
}

function renderTransactions() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const category = elements.filterCategory.value;
  const type = elements.filterType.value;
  const fromDate = elements.filterFromDate.value;
  const toDate = elements.filterToDate.value;
  const minAmount = Number(elements.filterMinAmount.value || 0);
  const maxAmount = Number(elements.filterMaxAmount.value || 0);
  const rows = appState.transactions
    .filter((transaction) => !category || transaction.category === category)
    .filter((transaction) => !type || (type === "income" ? transaction.amount >= 0 : transaction.amount < 0))
    .filter((transaction) => !fromDate || transaction.date >= fromDate)
    .filter((transaction) => !toDate || transaction.date <= toDate)
    .filter((transaction) => !minAmount || Math.abs(Number(transaction.amount)) >= minAmount)
    .filter((transaction) => !maxAmount || Math.abs(Number(transaction.amount)) <= maxAmount)
    .filter((transaction) => {
      const text = `${transaction.description} ${transaction.category} ${transaction.amount}`.toLowerCase();
      return !search || text.includes(search);
    })
    .sort((a, b) => transactionSortKey(b).localeCompare(transactionSortKey(a)))
    .map((transaction) => `
      <tr>
        <td>${formatTransactionDateTime(transaction)}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td>${escapeHtml(transaction.category)}</td>
        <td class="money ${transaction.amount >= 0 ? "positive" : "negative"}">${formatMoney(transaction.amount)}</td>
        <td>
          <span class="row-actions">
            <button class="icon-button icon-only" title="Edit" aria-label="Edit" type="button" data-edit="${transaction.id}">${icon("edit")}</button>
            <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-delete="${transaction.id}">${icon("delete")}</button>
          </span>
        </td>
      </tr>
    `);

  elements.transactionsTable.innerHTML = rows.join("") || `<tr><td colspan="5"><div class="empty-state">No matching transactions.</div></td></tr>`;
}

function renderBudgets() {
  const targets = budgetTargetsByCategory();
  const spent = expensesByCategory(currentMonthTransactions());
  const rows = expenseCategories().map((category) => ({
    ...category,
    actual: spent[category.name] || 0,
    budget: Number(category.budget || 0),
    aiBudgetTarget: targets[category.name]
  }));
  const planned = rows.reduce((sum, category) => sum + category.budget, 0);
  const actual = rows.reduce((sum, category) => sum + category.actual, 0);
  const remaining = planned - actual;
  const overBudget = rows.filter((category) => category.budget > 0 && category.actual > category.budget);
  const sortedRows = [...rows].sort((a, b) => {
    const aRatio = a.budget > 0 ? a.actual / a.budget : 0;
    const bRatio = b.budget > 0 ? b.actual / b.budget : 0;
    return bRatio - aRatio;
  });
  const watchList = rows
    .filter((category) => category.budget > 0)
    .sort((a, b) => (b.actual / b.budget) - (a.actual / a.budget))
    .slice(0, 5);

  elements.budgetPlanned.textContent = formatMoney(planned, { compact: true });
  elements.budgetSpent.textContent = formatMoney(actual, { compact: true });
  elements.budgetRemaining.textContent = formatMoney(remaining, { compact: true });
  elements.budgetOverCount.textContent = overBudget.length;
  elements.budgetTable.innerHTML = sortedRows.map((category) => budgetItem(category, category.actual, "row")).join("") ||
    `<div class="empty-state">Add expense category budgets in Settings.</div>`;
  elements.budgetWatchList.innerHTML = watchList.map((category) => budgetItem(category, category.actual)).join("") ||
    `<div class="empty-state">Add category budgets in Settings.</div>`;
}

function renderInvestments() {
  const portfolio = marketState.portfolio || portfolioFromManualPrices();
  const status = marketState.rates?.status || "manual";
  elements.investmentValue.textContent = formatMoney(portfolio.total_value || 0, { compact: true });
  elements.investmentCost.textContent = formatMoney(portfolio.total_cost || 0, { compact: true });
  elements.investmentGain.textContent = formatMoney(portfolio.gain_loss || 0, { compact: true });
  elements.investmentGain.className = (portfolio.gain_loss || 0) >= 0 ? "positive" : "negative";
  elements.investmentRateStatus.textContent = status === "ok" ? `Live ${marketState.rates?.provider || ""}` : "Manual";
  elements.investmentList.innerHTML = (portfolio.holdings || []).map((item) => `
    <div class="investment-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong><br>
        <small>${escapeHtml(investmentTypeLabel(item.asset_type))} - ${Number(item.quantity || 0).toLocaleString("en-US")} unit(s) - ${item.price_source === "live" ? "live rate" : "manual rate"}</small>
      </div>
      <div class="investment-values">
        <span><small>Value</small><strong class="money">${formatMoney(item.current_value || 0, { compact: true })}</strong></span>
        <span><small>Gain / loss</small><strong class="money ${(item.gain_loss || 0) >= 0 ? "positive" : "negative"}">${formatMoney(item.gain_loss || 0, { compact: true })}</strong></span>
      </div>
      <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-investment-delete="${item.id}">${icon("delete")}</button>
    </div>
  `).join("") || `<div class="empty-state">Add gold, currency, coins, or crypto holdings.</div>`;
}

function portfolioFromManualPrices() {
  const holdings = (appState.investments || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const currentPrice = Number(item.manual_price || item.purchase_price || 0);
    const cost = Number(item.purchase_price || 0) * quantity;
    const value = currentPrice * quantity;
    return {
      ...item,
      current_price: currentPrice,
      current_value: value,
      cost_value: cost,
      gain_loss: value - cost,
      price_source: "manual"
    };
  });
  const totalCost = holdings.reduce((sum, item) => sum + item.cost_value, 0);
  const totalValue = holdings.reduce((sum, item) => sum + item.current_value, 0);
  return { holdings, total_cost: totalCost, total_value: totalValue, gain_loss: totalValue - totalCost };
}

function investmentTypeLabel(type) {
  return {
    gold_18k_gram: "Gold 18k gram",
    coin_emami: "Gold coin - Emami",
    coin_bahar: "Gold coin - Bahar",
    coin_half: "Half coin",
    coin_quarter: "Quarter coin",
    coin_gram: "Gram coin",
    usd: "US dollar",
    eur: "Euro",
    try: "Turkish lira",
    btc: "Bitcoin",
    eth: "Ethereum",
    usdt: "Tether"
  }[type] || type;
}

function renderAnnual() {
  const baseYear = calendarYearKey(new Date()) + annualYearOffset;
  const rows = annualRows(baseYear);
  const yearlyIncome = rows.reduce((sum, row) => sum + row.income, 0);
  const yearlyExpenses = rows.reduce((sum, row) => sum + row.expenses, 0);

  elements.annualTitle.textContent = `${baseYear} - Income ${formatMoney(yearlyIncome)} / Expenses ${formatMoney(yearlyExpenses)}`;
  renderAnnualChart(rows);
  elements.annualTable.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.month)}</td>
      <td class="money positive">${formatMoney(row.income)}</td>
      <td class="money negative">${formatMoney(row.expenses)}</td>
      <td class="money ${row.savings >= 0 ? "positive" : "negative"}">${formatMoney(row.savings)}</td>
    </tr>
  `).join("");
}

function renderAnnualChart(rows) {
  const max = Math.max(...rows.map((row) => Math.max(row.income, row.expenses)), 1);
  elements.annualChart.innerHTML = rows.map((row) => {
    const incomeHeight = Math.max(2, Math.round((row.income / max) * 100));
    const expenseHeight = Math.max(2, Math.round((row.expenses / max) * 100));
    return `
      <div class="annual-month" title="${escapeHtml(row.month)}: ${formatMoney(row.income)} income, ${formatMoney(row.expenses)} expenses">
        <div class="annual-bars">
          <span class="annual-bar income-bar" style="height:${incomeHeight}%"></span>
          <span class="annual-bar expense-bar" style="height:${expenseHeight}%"></span>
        </div>
        <small>${escapeHtml(row.month)}</small>
      </div>
    `;
  }).join("");
}

function renderAiCoach() {
  if (aiReportState) {
    renderAiReportCoach(aiReportState);
    return;
  }
  const model = buildAiModel();
  const suggestions = aiSuggestionsForModel(model);
  const habits = aiHabitsForModel(model);
  const dashboardSuggestions = suggestions.slice(0, 3);

  elements.aiConfidence.textContent = `${model.confidence}%`;
  elements.aiMonthEnd.textContent = formatMoney(model.predictedMonthEndExpense);
  elements.aiSavingIdea.textContent = formatMoney(model.suggestedSaving);
  elements.aiRiskLevel.textContent = model.riskLevel;
  elements.aiRiskLevel.className = model.riskLevel === "High" ? "negative" : model.riskLevel === "Medium" ? "warning" : "positive";
  elements.aiExecutiveSummary.textContent = "AI Financial Report is using the local fallback model until the report endpoint is available.";

  elements.aiSuggestions.innerHTML = renderAiCards(suggestions, "No suggestions yet. Add more transactions so the coach can learn your habits.");
  elements.aiHabits.innerHTML = renderAiCards(habits, "No clear habits detected yet.");
  elements.aiAutofillGuide.innerHTML = renderAiCards([
    {
      title: "Smart transaction entry",
      text: "When you type a description in Add Transaction, the app checks similar past entries and can suggest the category and a typical amount.",
      tone: "neutral"
    },
    {
      title: "Rule learning",
      text: "The coach also uses your category rules, so names like Salary or Snap can be filled faster and more consistently.",
      tone: "neutral"
    }
  ], "");
}

function renderAiReportCoach(report) {
  const health = report.health_score || {};
  const forecast = report.forecast || {};
  const actions = report.action_queue || [];
  const habits = [
    ...(report.merchant_insights || []).map((item) => ({
      title: item.merchant || item.title || "Merchant pattern",
      text: item.message || `${item.count || 0} transaction(s), total ${formatMoney(item.total || 0)}.`,
      tone: "positive"
    })),
    ...(report.recurring_candidates || []).map((item) => ({
      title: item.description || "Recurring candidate",
      text: item.reason || `${formatMoney(item.amount || 0)} in ${item.category || "a category"}.`,
      tone: "neutral"
    }))
  ];
  const quality = report.data_quality?.summary || {};
  const budgetTargets = report.budget_targets || [];
  const brief = report.priority_brief || {};

  elements.aiExecutiveSummary.textContent = brief.headline
    ? `${brief.headline}. ${report.executive_summary || ""}`.trim()
    : report.executive_summary || "No AI financial report is available yet.";
  elements.aiConfidence.textContent = health.score != null ? `${health.score}/100` : "0%";
  elements.aiMonthEnd.textContent = formatMoney(forecast.projected_net ?? 0);
  elements.aiSavingIdea.textContent = forecast.projected_savings_rate != null ? `${Math.round(forecast.projected_savings_rate)}%` : formatMoney(report.summary?.net || 0);
  elements.aiRiskLevel.textContent = health.label || "Good";
  elements.aiRiskLevel.className = healthToneClass(health);

  elements.aiSuggestions.innerHTML = renderAiCards(actions.map(reportItemToCard), "No suggestions yet.", true);
  elements.aiHabits.innerHTML = renderAiCards([
    ...budgetTargets.slice(0, 3).map(reportItemToCard),
    ...habits
  ].slice(0, 6), "No recurring habits or budget targets detected yet.");
  elements.aiAutofillGuide.innerHTML = renderAiCards([
    {
      title: "Data quality",
      text: `${quality.duplicate_groups || 0} duplicate group(s), ${quality.missing_count || 0} missing field(s), ${quality.low_confidence_count || 0} low-confidence categorization(s).`,
      tone: quality.duplicate_groups || quality.missing_count || quality.low_confidence_count ? "warning" : "positive"
    },
    {
      title: report.ai_engine?.name || "Local Budget Intelligence",
      text: `${report.ai_engine?.privacy || "offline"} analysis using ${(report.ai_engine?.methods || []).slice(0, 4).join(", ") || "local rules and statistics"}.`,
      tone: "neutral"
    }
  ], "");
}

function reportItemToCard(item) {
  return {
    title: item.title || item.type || "Review item",
    text: item.message || item.reason || item.text || "",
    tone: toneFromItem(item),
    impact: item.impact,
    nextStep: item.next_step
  };
}

function buildAiModel() {
  const transactions = [...appState.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const monthly = currentMonthTransactions();
  const expenseItems = transactions.filter((item) => Number(item.amount) < 0);
  const monthlyExpenses = monthly.filter((item) => Number(item.amount) < 0);
  const monthlyIncome = monthly.filter((item) => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const categoryTotals = expensesByCategory(monthly);
  const historicalCategoryTotals = expensesByCategory(transactions);
  const monthRows = trailingMonthRows(6);
  const activeRows = monthRows.filter((row) => row.income || row.expenses);
  const averageExpense = activeRows.length ? activeRows.reduce((sum, row) => sum + row.expenses, 0) / activeRows.length : 0;
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const predictedMonthEndExpense = today.getDate() > 0 ? (monthlyExpenseTotal / today.getDate()) * daysInMonth : monthlyExpenseTotal;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenseTotal) / monthlyIncome) * 100 : 0;
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const topHistoricalCategory = Object.entries(historicalCategoryTotals).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const largestExpense = [...monthlyExpenses].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
  const suggestedSaving = Math.max(0, monthlyExpenseTotal * 0.08);
  const riskLevel = predictedMonthEndExpense > averageExpense * 1.25 && averageExpense > 0 ? "High" : savingsRate < 10 && monthlyIncome > 0 ? "Medium" : "Low";

  return {
    transactions,
    expenseItems,
    monthly,
    monthlyIncome,
    monthlyExpenseTotal,
    averageExpense,
    predictedMonthEndExpense,
    savingsRate,
    topCategory,
    topHistoricalCategory,
    largestExpense,
    suggestedSaving,
    riskLevel,
    confidence: Math.min(95, Math.max(15, Math.round(transactions.length * 7)))
  };
}

function aiSuggestionsForModel(model) {
  const suggestions = [];
  if (!model.transactions.length) {
    return [{
      title: "Start with a few transactions",
      text: "Once you add income and expenses, the coach can identify recurring habits, unusual spending, and likely categories.",
      tone: "neutral"
    }];
  }

  if (model.predictedMonthEndExpense > model.averageExpense * 1.2 && model.averageExpense > 0) {
    suggestions.push({
      title: "Spending is trending higher",
      text: `At this pace, this month may end around ${formatMoney(model.predictedMonthEndExpense)}, above your recent average of ${formatMoney(model.averageExpense)}.`,
      tone: "warning"
    });
  }

  if (model.monthlyIncome > 0 && model.savingsRate < 20) {
    suggestions.push({
      title: "Savings rate can improve",
      text: `Your current savings rate is about ${Math.round(model.savingsRate)}%. Try reducing flexible expenses by ${formatMoney(model.suggestedSaving)} this month.`,
      tone: "warning"
    });
  }

  if (model.topCategory[0] !== "-") {
    suggestions.push({
      title: `${model.topCategory[0]} is leading expenses`,
      text: `${model.topCategory[0]} is your largest category this month at ${formatMoney(model.topCategory[1])}. A small limit here could have the biggest effect.`,
      tone: "neutral"
    });
  }

  if (model.largestExpense) {
    suggestions.push({
      title: "Largest recent expense",
      text: `${model.largestExpense.description} is the largest current-month expense at ${formatMoney(Math.abs(model.largestExpense.amount))}. Check if it was planned or unusual.`,
      tone: "neutral"
    });
  }

  if (!appState.goals.length) {
    suggestions.push({
      title: "Add one simple goal",
      text: "A savings-rate target or one category limit gives the coach a clearer target to measure against.",
      tone: "positive"
    });
  }

  return suggestions.slice(0, 6);
}

function aiHabitsForModel(model) {
  const byDescription = new Map();
  model.transactions.forEach((transaction) => {
    const key = normalizeText(transaction.description);
    if (!key) {
      return;
    }
    const item = byDescription.get(key) || { count: 0, category: transaction.category, total: 0 };
    item.count += 1;
    item.total += Math.abs(Number(transaction.amount));
    byDescription.set(key, item);
  });

  const repeated = [...byDescription.entries()]
    .filter(([, value]) => value.count > 1)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, value]) => ({
      title: titleCase(name),
      text: `Usually ${value.category}, average amount ${formatMoney(value.total / value.count)}, seen ${value.count} times.`,
      tone: "positive"
    }));

  if (model.topHistoricalCategory[0] !== "-") {
    repeated.push({
      title: "Long-term top category",
      text: `${model.topHistoricalCategory[0]} is your largest historical expense category at ${formatMoney(model.topHistoricalCategory[1])}.`,
      tone: "neutral"
    });
  }

  return repeated.slice(0, 5);
}

function renderAiCards(items, emptyText, detailed = false) {
  return items.length ? items.map((item) => `
    <div class="ai-card ${item.tone || "neutral"} ${detailed ? "detailed-ai-card" : ""}">
      <div class="ai-card-top">
        <strong>${escapeHtml(item.title)}</strong>
        ${item.impact ? `<small>${formatMoney(item.impact, { compact: true })}</small>` : ""}
      </div>
      <span>${escapeHtml(item.text)}</span>
      ${item.nextStep ? `<em>${escapeHtml(item.nextStep)}</em>` : ""}
    </div>
  `).join("") : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
}

function smartTransactionSuggestion(description) {
  const text = normalizeText(description);
  if (!text) {
    return null;
  }
  const rule = (appState.category_rules || []).find((item) => text.includes(normalizeText(item.contains)));
  const matches = appState.transactions
    .map((transaction) => ({
      ...transaction,
      score: similarityScore(text, normalizeText(transaction.description))
    }))
    .filter((transaction) => transaction.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const category = rule ? rule.category : mostCommon(matches.map((item) => item.category));
  const similarAmounts = matches
    .filter((item) => !category || item.category === category)
    .map((item) => Math.abs(Number(item.amount)))
    .filter(Boolean);
  if (!category && !similarAmounts.length) {
    return null;
  }
  return {
    category,
    amount: similarAmounts.length ? average(similarAmounts) : 0,
    confidence: Math.min(95, Math.max(35, (matches[0]?.score || 0) * 18 + matches.length * 6 + (rule ? 18 : 0)))
  };
}

async function updateTransactionAiHint() {
  const requestId = ++aiHintRequestId;
  const description = elements.descriptionInput.value;
  let suggestion = smartTransactionSuggestion(description);
  if (normalizeText(description)) {
    try {
      const response = await api("/api/ai/predict-category", {
        method: "POST",
        body: JSON.stringify({
          description,
          amount: Number(elements.amountInput.value || 0)
        })
      });
      const transaction = response.transaction || response;
      suggestion = {
        category: transaction.category,
        amount: Math.abs(Number(transaction.amount || 0)),
        confidence: Number(transaction.ai?.confidence || response.prediction?.confidence || 0) * 100,
        reason: transaction.ai?.reason || response.prediction?.reason || ""
      };
    } catch {
      // Keep the local in-browser hint when the report endpoint is unavailable.
    }
  }
  if (requestId !== aiHintRequestId) {
    return;
  }
  currentAiSuggestion = suggestion;
  if (!suggestion) {
    elements.transactionAiHint.hidden = true;
    elements.transactionAiHint.innerHTML = "";
    return;
  }
  const amountText = suggestion.amount ? `Typical amount ${formatMoney(suggestion.amount)}` : "No usual amount yet";
  elements.transactionAiHint.hidden = false;
  elements.transactionAiHint.innerHTML = `
    <span>AI suggestion: ${escapeHtml(suggestion.category || "No category")} - ${amountText} - ${Math.round(suggestion.confidence)}% confidence${suggestion.reason ? ` - ${escapeHtml(suggestion.reason)}` : ""}</span>
    <button class="secondary-button" type="button" id="applyAiSuggestionButton">Apply</button>
  `;
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff ]/g, " ").replace(/\s+/g, " ").trim();
}

function similarityScore(a, b) {
  if (!a || !b) {
    return 0;
  }
  if (a === b) {
    return 10;
  }
  if (a.includes(b) || b.includes(a)) {
    return 7;
  }
  const aWords = new Set(a.split(" ").filter((word) => word.length > 2));
  const bWords = new Set(b.split(" ").filter((word) => word.length > 2));
  const overlap = [...aWords].filter((word) => bWords.has(word)).length;
  return overlap ? overlap * 2 : 0;
}

function mostCommon(items) {
  const counts = items.filter(Boolean).reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function titleCase(value) {
  return String(value || "").replace(/\b\w/g, (char) => char.toUpperCase());
}

function trailingMonthRows(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1));
    const key = calendarMonthKey(date);
    const transactions = appState.transactions.filter((transaction) => calendarMonthKey(new Date(`${transaction.date}T00:00:00`)) === key);
    const income = transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
    return { label: formatMonthShort(date), income, expenses, savings: income - expenses };
  });
}

function formatMonthShort(date) {
  if (appState.calendar === "persian") {
    const month = calendarMonthNumber(date);
    return monthName(month);
  }
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
}

function annualRows(year) {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    month: monthName(index + 1, year),
    income: 0,
    expenses: 0,
    savings: 0
  }));

  appState.transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);
    if (calendarYearKey(date) !== year) {
      return;
    }
    const row = rows[calendarMonthNumber(date) - 1];
    const amount = Number(transaction.amount);
    if (amount >= 0) {
      row.income += amount;
    } else {
      row.expenses += Math.abs(amount);
    }
    row.savings = row.income - row.expenses;
  });

  return rows;
}

function monthName(month, year) {
  const locale = appState.language === "persian" ? "fa-IR" : "en-US";
  if (appState.calendar === "persian") {
    const englishMonths = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];
    const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    return appState.language === "persian" ? persianMonths[month - 1] : englishMonths[month - 1];
  }
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, month - 1, 1));
}

function renderSettings() {
  elements.currencyInput.value = appState.currency || "IRR";
  elements.calendarInput.value = appState.calendar || "english";
  elements.languageInput.value = appState.language || "english";
  elements.themeInput.value = appState.theme || "linen";
  elements.livingCountryInput.value = appState.living_country || "IR";
  elements.inflationRateInput.value = appState.inflation_rate || "";
  elements.marketProviderInput.value = appState.market_provider?.name || "tgju";
  elements.marketApiKeyInput.value = appState.market_provider?.api_key || "";
  elements.settingsCategoryList.innerHTML = appState.categories.map((category) => `
    <div class="category-item">
      <div>
        <strong>${escapeHtml(category.name)}</strong><br>
        <small>${category.type === "income" ? "Income category" : "Expense category"} - Monthly budget ${formatMoney(category.budget || 0)}</small>
      </div>
      <span class="row-actions">
        <button class="icon-button icon-only" title="Edit" aria-label="Edit" type="button" data-category-edit="${escapeHtml(category.name)}">${icon("edit")}</button>
        <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-category-delete="${escapeHtml(category.name)}">${icon("delete")}</button>
      </span>
    </div>
  `).join("");
  elements.dataFileInput.value = storageState.data_file || "";
  elements.backupFolderText.textContent = storageState.backup_dir || "-";
  elements.backupCountText.textContent = storageState.backup_count || 0;
  renderBackupList();
  renderRecurringList();
  renderRuleList();
  renderGoalList();
  renderWidgetOptions();
}

function renderBackupList() {
  const backups = storageState.backups || [];
  elements.backupList.innerHTML = backups.slice(0, 8).map((backup) => `
    <div class="restore-item">
      <div>
        <strong>${escapeHtml(backup.name)}</strong>
        <small>${new Date(backup.created).toLocaleString()} - ${Math.round(backup.size / 1024)} KB</small>
      </div>
      <button class="secondary-button" type="button" data-restore-backup="${escapeHtml(backup.path)}">Restore</button>
    </div>
  `).join("") || `<div class="empty-state">No backups yet.</div>`;
}

function renderRecurringList() {
  elements.recurringList.innerHTML = (appState.recurring_transactions || []).map((item) => `
    <div class="category-item">
      <div>
        <strong>${escapeHtml(item.description)}</strong><br>
        <small>${escapeHtml(item.category)} - ${formatMoney(item.amount)} - monthly on day ${item.day}</small>
      </div>
      <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-recurring-delete="${item.id}">${icon("delete")}</button>
    </div>
  `).join("") || `<div class="empty-state">No recurring transactions yet.</div>`;
}

function renderRuleList() {
  elements.ruleList.innerHTML = (appState.category_rules || []).map((rule) => `
    <div class="category-item">
      <div>
        <strong>Contains "${escapeHtml(rule.contains)}"</strong><br>
        <small>Category: ${escapeHtml(rule.category)}</small>
      </div>
      <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-rule-delete="${rule.id}">${icon("delete")}</button>
    </div>
  `).join("") || `<div class="empty-state">No category rules yet.</div>`;
}

function renderGoalList() {
  elements.goalList.innerHTML = (appState.goals || []).map((goal) => `
    <div class="category-item">
      <div>
        <strong>${escapeHtml(goal.name)}</strong><br>
        <small>${goal.type === "savings_rate" ? "Savings rate" : escapeHtml(goal.category)} - Target ${goal.type === "savings_rate" ? `${goal.target}%` : formatMoney(goal.target)}</small>
      </div>
      <button class="icon-button icon-only danger" title="Delete" aria-label="Delete" type="button" data-goal-delete="${goal.id}">${icon("delete")}</button>
    </div>
  `).join("") || `<div class="empty-state">No monthly goals yet.</div>`;
}

function renderWidgetOptions() {
  const visible = new Set(normalizedDashboardWidgets(appState.dashboard_widgets));
  elements.widgetForm.querySelectorAll('input[name="widget"]').forEach((input) => {
    input.checked = visible.has(input.value);
  });
}

function icon(name) {
  if (name === "edit") {
    return `<svg viewBox="0 0 24 24"><path d="m14 6 4 4M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (appState.calendar === "persian") {
    const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${String(jalali.jd).padStart(2, "0")}/${String(jalali.jm).padStart(2, "0")}/${jalali.jy}`;
  }
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatTransactionDateTime(transaction) {
  const time = normalTimeValue(transaction.time);
  return time ? `${formatDate(transaction.date)} ${time}` : formatDate(transaction.date);
}

function transactionSortKey(transaction) {
  return `${transaction.date || ""}T${normalTimeValue(transaction.time) || "00:00"}`;
}

function normalTimeValue(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return "";
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function transactionDateValue() {
  if (appState.calendar !== "persian") {
    return elements.dateInput.value;
  }

  const jy = Number(elements.persianYearInput.value);
  const jm = Number(elements.persianMonthInput.value);
  const jd = Number(elements.persianDayInput.value);
  if (!jy || !jm || !jd) {
    return "";
  }
  const gregorian = jalaliToGregorian(jy, jm, jd);
  return isoDate(gregorian.gy, gregorian.gm, gregorian.gd);
}

function setTransactionDate(value) {
  elements.dateInput.value = value;
  const date = new Date(`${value}T00:00:00`);
  const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  elements.persianYearInput.value = jalali.jy;
  elements.persianMonthInput.value = jalali.jm;
  elements.persianDayInput.value = jalali.jd;
}

function updateTransactionDateMode() {
  const usePersian = appState.calendar === "persian";
  elements.englishDateGroup.hidden = usePersian;
  elements.persianDateGroup.hidden = !usePersian;
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function div(a, b) {
  return Math.trunc(a / b);
}

function gregorianToJalali(gy, gm, gd) {
  const gDMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) - 80 + gd + gDMonth[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (div(jy, 33) * 8) + div((jy % 33) + 3, 4) + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * div(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) {
      days++;
    }
  }
  gy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const months = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gd > months[gm]) {
    gd -= months[gm];
    gm++;
  }
  return { gy, gm, gd };
}

function formatMonthTitle(date) {
  const locale = appState.language === "persian" ? "fa-IR" : "en-US";
  if (appState.calendar === "persian") {
    return new Intl.DateTimeFormat(`${locale}-u-ca-persian`, {
      month: "long",
      year: "numeric"
    }).format(date).replace(/\s*AP\b/i, "");
  }
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function resetTransactionForm() {
  elements.transactionFormTitle.textContent = "Add transaction";
  elements.transactionId.value = "";
  setTransactionDate(new Date().toISOString().slice(0, 10));
  updateTransactionDateMode();
  elements.timeInput.value = "";
  elements.descriptionInput.value = "";
  elements.amountInput.value = "";
  currentAiSuggestion = null;
  elements.transactionAiHint.hidden = true;
  elements.transactionAiHint.innerHTML = "";
  if (appState.categories[0]) {
    elements.categoryInput.value = appState.categories[0].name;
  }
}

function updateCategoryBudgetField() {
  const isIncome = elements.categoryTypeInput.value === "income";
  elements.budgetInput.disabled = isIncome;
  elements.budgetInput.placeholder = isIncome ? "Income categories do not use budgets" : "0";
  if (isIncome) {
    elements.budgetInput.value = "";
  }
}

function openTransactionForm() {
  updateTransactionDateMode();
  elements.transactionModal.hidden = false;
  const firstInput = appState.calendar === "persian" ? elements.persianYearInput : elements.dateInput;
  firstInput.focus();
}

function closeTransactionForm() {
  elements.transactionModal.hidden = true;
}

function resetCategoryForm() {
  elements.categoryFormTitle.textContent = "Add category";
  elements.newCategoryInput.value = "";
  elements.categoryTypeInput.value = "expense";
  elements.budgetInput.value = "";
  updateCategoryBudgetField();
}

function openCategoryForm() {
  elements.categoryModal.hidden = false;
  elements.newCategoryInput.focus();
}

function closeCategoryForm() {
  elements.categoryModal.hidden = true;
}

function showView(viewName) {
  document.querySelectorAll(".nav-tab").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${viewName}View`).classList.add("active");
  document.querySelector(".month-controls").hidden = viewName !== "dashboard";
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

document.querySelectorAll("[data-view-jump]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewJump));
});

elements.tableAddTransactionButton.addEventListener("click", () => {
  resetTransactionForm();
  openTransactionForm();
});

elements.previousMonthButton.addEventListener("click", () => {
  dashboardMonthOffset -= 1;
  render();
});

elements.currentMonthButton.addEventListener("click", () => {
  dashboardMonthOffset = 0;
  render();
});

elements.nextMonthButton.addEventListener("click", () => {
  dashboardMonthOffset += 1;
  render();
});

elements.closeTransactionFormButton.addEventListener("click", closeTransactionForm);
elements.transactionModal.addEventListener("click", (event) => {
  if (event.target === elements.transactionModal) {
    closeTransactionForm();
  }
});

elements.openCategoryFormButton.addEventListener("click", () => {
  resetCategoryForm();
  openCategoryForm();
});

elements.closeCategoryFormButton.addEventListener("click", closeCategoryForm);
elements.clearCategoryFormButton.addEventListener("click", resetCategoryForm);
elements.categoryModal.addEventListener("click", (event) => {
  if (event.target === elements.categoryModal) {
    closeCategoryForm();
  }
});

elements.expensePie.addEventListener("mousemove", (event) => {
  const slice = pieSliceAt(event);
  if (!slice) {
    elements.pieTooltip.hidden = true;
    return;
  }
  const rect = elements.expensePie.getBoundingClientRect();
  elements.pieTooltip.hidden = false;
  elements.pieTooltip.style.left = `${event.clientX - rect.left + 14}px`;
  elements.pieTooltip.style.top = `${event.clientY - rect.top + 14}px`;
  elements.pieTooltip.innerHTML = `<strong>${escapeHtml(slice.name)}</strong><span>${formatMoney(slice.amount, { compact: true })}</span>`;
});

elements.expensePie.addEventListener("mouseleave", () => {
  elements.pieTooltip.hidden = true;
});

let chartResizeTimer = null;
window.addEventListener("resize", () => {
  window.clearTimeout(chartResizeTimer);
  chartResizeTimer = window.setTimeout(() => {
    if (appState.transactions) {
      renderDashboard();
    }
  }, 120);
});

elements.descriptionInput.addEventListener("input", updateTransactionAiHint);
elements.amountInput.addEventListener("input", updateTransactionAiHint);

elements.transactionAiHint.addEventListener("click", (event) => {
  if (event.target.id !== "applyAiSuggestionButton") {
    return;
  }
  const suggestion = currentAiSuggestion || smartTransactionSuggestion(elements.descriptionInput.value);
  if (!suggestion) {
    return;
  }
  if (suggestion.category) {
    elements.categoryInput.value = suggestion.category;
  }
  if (suggestion.amount) {
    elements.amountInput.value = Math.round(suggestion.amount);
  }
  updateTransactionAiHint();
});

elements.transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const transaction = {
    date: transactionDateValue(),
    description: elements.descriptionInput.value.trim(),
    category: elements.categoryInput.value,
    amount: signedAmountForCategory(elements.categoryInput.value, elements.amountInput.value)
  };
  if (elements.timeInput.value) {
    transaction.time = elements.timeInput.value;
  }
  if (!transaction.date) {
    window.alert("Please enter a valid date.");
    return;
  }
  const id = elements.transactionId.value;
  if (id) {
    await persist(`/api/transactions/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(transaction)
    });
  } else {
    await persist("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction)
    });
  }
  resetTransactionForm();
  closeTransactionForm();
});

elements.transactionsTable.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("button");
  if (!actionButton) {
    return;
  }
  const editId = actionButton.dataset.edit;
  const deleteId = actionButton.dataset.delete;

  if (editId) {
    const transaction = appState.transactions.find((item) => item.id === editId);
    elements.transactionFormTitle.textContent = "Edit transaction";
    elements.transactionId.value = transaction.id;
    setTransactionDate(transaction.date);
    elements.timeInput.value = normalTimeValue(transaction.time);
    elements.descriptionInput.value = transaction.description;
    elements.categoryInput.value = transaction.category;
    elements.amountInput.value = Math.abs(Number(transaction.amount));
    openTransactionForm();
  }

  if (deleteId) {
    const transaction = appState.transactions.find((item) => item.id === deleteId);
    const label = transaction ? transaction.description : "this transaction";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }
    await persist(`/api/transactions/${encodeURIComponent(deleteId)}`, { method: "DELETE" });
  }
});

elements.clearFormButton.addEventListener("click", resetTransactionForm);
[
  elements.searchInput,
  elements.filterCategory,
  elements.filterType,
  elements.filterFromDate,
  elements.filterToDate,
  elements.filterMinAmount,
  elements.filterMaxAmount
].forEach((filter) => {
  filter.addEventListener("input", renderTransactions);
  filter.addEventListener("change", renderTransactions);
});

elements.clearFiltersButton.addEventListener("click", () => {
  elements.searchInput.value = "";
  elements.filterCategory.value = "";
  elements.filterType.value = "";
  elements.filterFromDate.value = "";
  elements.filterToDate.value = "";
  elements.filterMinAmount.value = "";
  elements.filterMaxAmount.value = "";
  renderTransactions();
});

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      currency: elements.currencyInput.value,
      calendar: elements.calendarInput.value,
      language: elements.languageInput.value,
      theme: elements.themeInput.value,
      living_country: elements.livingCountryInput.value,
      inflation_rate: Number(elements.inflationRateInput.value || 0),
      market_provider: elements.marketProviderInput.value,
      market_api_key: elements.marketApiKeyInput.value
    })
  });
});

elements.browseDataFileButton.addEventListener("click", async () => {
  await updateStorage("/api/storage/browse", { method: "POST", body: JSON.stringify({}) });
});

elements.saveDataFileButton.addEventListener("click", async () => {
  const dataFile = elements.dataFileInput.value.trim();
  if (!dataFile) {
    window.alert("Please enter or choose a JSON file path.");
    return;
  }
  await updateStorage("/api/storage", {
    method: "POST",
    body: JSON.stringify({ data_file: dataFile })
  });
});

elements.backupNowButton.addEventListener("click", async () => {
  await updateStorage("/api/backup", { method: "POST", body: JSON.stringify({}) });
});

elements.applyAiBudgetsButton.addEventListener("click", async () => {
  const count = (aiReportState?.budget_targets || []).length;
  if (!count) {
    window.alert("No AI budget targets are available for unset expense categories yet.");
    return;
  }
  if (!window.confirm(`Apply AI target budgets to ${count} expense categor${count === 1 ? "y" : "ies"} without a budget?`)) {
    return;
  }
  const response = await api("/api/ai/apply-budget-targets", {
    method: "POST",
    body: JSON.stringify({})
  });
  appState = response.data;
  storageState = await api("/api/storage");
  await refreshAiReport();
  render();
  setStatus(`Applied ${response.applied.length} AI budget target${response.applied.length === 1 ? "" : "s"}`);
});

elements.refreshRatesButton.addEventListener("click", async () => {
  setStatus("Refreshing rates");
  await refreshMarketRates();
  renderInvestments();
  setStatus(marketState.rates?.status === "ok" ? "Rates refreshed" : "Rates unavailable");
});

elements.updateInvestmentPricesButton.addEventListener("click", async () => {
  setStatus("Updating investment prices");
  const response = await api("/api/investments/update-prices", {
    method: "POST",
    body: JSON.stringify({})
  });
  appState = response.data;
  storageState = await api("/api/storage");
  await refreshMarketRates();
  render();
  const updatedCount = response.updated?.length || 0;
  setStatus(updatedCount ? `Updated ${updatedCount} investment price${updatedCount === 1 ? "" : "s"}` : "No live prices found");
});

elements.investmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/investments", {
    method: "POST",
    body: JSON.stringify({
      name: elements.investmentName.value.trim(),
      asset_type: elements.investmentType.value,
      quantity: Number(elements.investmentQuantity.value || 0),
      purchase_price: Number(elements.investmentPurchasePrice.value || 0),
      manual_price: Number(elements.investmentManualPrice.value || 0),
      use_market_price: elements.investmentUseMarketPrice.checked
    })
  });
  elements.investmentForm.reset();
  elements.investmentUseMarketPrice.checked = true;
});

elements.investmentList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-investment-delete]");
  if (!button) {
    return;
  }
  if (!window.confirm("Delete this investment holding?")) {
    return;
  }
  await persist(`/api/investments/${encodeURIComponent(button.dataset.investmentDelete)}`, { method: "DELETE" });
});

elements.backupList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-restore-backup]");
  if (!button) {
    return;
  }
  if (!window.confirm("Restore this backup? A fresh backup of your current file will be created first.")) {
    return;
  }
  appState = await api("/api/backups/restore", {
    method: "POST",
    body: JSON.stringify({ path: button.dataset.restoreBackup })
  });
  storageState = await api("/api/storage");
  render();
  setStatus("Backup restored");
});

elements.applyRecurringButton.addEventListener("click", async () => {
  await persist("/api/recurring/apply", { method: "POST", body: JSON.stringify({}) });
});

elements.previousYearButton.addEventListener("click", () => {
  annualYearOffset -= 1;
  renderAnnual();
});

elements.nextYearButton.addEventListener("click", () => {
  annualYearOffset += 1;
  renderAnnual();
});

elements.categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/categories", {
    method: "POST",
    body: JSON.stringify({
      name: elements.newCategoryInput.value.trim(),
      type: elements.categoryTypeInput.value,
      budget: Number(elements.budgetInput.value || 0)
    })
  });
  elements.newCategoryInput.value = "";
  resetCategoryForm();
  closeCategoryForm();
});
elements.categoryTypeInput.addEventListener("change", updateCategoryBudgetField);

elements.recurringForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/recurring", {
    method: "POST",
    body: JSON.stringify({
      description: elements.recurringDescription.value.trim(),
      category: elements.recurringCategory.value,
      amount: Number(elements.recurringAmount.value || 0),
      start_date: elements.recurringStartDate.value,
      day: Number(elements.recurringDay.value || 1),
      frequency: "monthly",
      active: true
    })
  });
  elements.recurringForm.reset();
});

elements.recurringList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-recurring-delete]");
  if (!button) {
    return;
  }
  if (!window.confirm("Delete this recurring transaction?")) {
    return;
  }
  await persist(`/api/recurring/${encodeURIComponent(button.dataset.recurringDelete)}`, { method: "DELETE" });
});

elements.ruleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/rules", {
    method: "POST",
    body: JSON.stringify({
      contains: elements.ruleContains.value.trim(),
      category: elements.ruleCategory.value
    })
  });
  elements.ruleForm.reset();
});

elements.ruleList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-rule-delete]");
  if (!button) {
    return;
  }
  if (!window.confirm("Delete this category rule?")) {
    return;
  }
  await persist(`/api/rules/${encodeURIComponent(button.dataset.ruleDelete)}`, { method: "DELETE" });
});

elements.goalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await persist("/api/goals", {
    method: "POST",
    body: JSON.stringify({
      name: elements.goalName.value.trim(),
      type: elements.goalType.value,
      category: elements.goalCategory.value,
      target: Number(elements.goalTarget.value || 0)
    })
  });
  elements.goalForm.reset();
});

elements.goalList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-goal-delete]");
  if (!button) {
    return;
  }
  if (!window.confirm("Delete this monthly goal?")) {
    return;
  }
  await persist(`/api/goals/${encodeURIComponent(button.dataset.goalDelete)}`, { method: "DELETE" });
});

elements.widgetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const dashboardWidgets = [...elements.widgetForm.querySelectorAll('input[name="widget"]:checked')].map((input) => input.value);
  await persist("/api/dashboard-widgets", {
    method: "POST",
    body: JSON.stringify({ dashboard_widgets: dashboardWidgets })
  });
});

elements.importFileInput.addEventListener("change", async () => {
  const file = elements.importFileInput.files[0];
  if (!file) {
    return;
  }
  const text = await file.text();
  importRows = parseCsv(text);
  renderImportMapping();
  renderImportPreview();
});

[elements.importDateColumn, elements.importDescriptionColumn, elements.importAmountColumn, elements.importCategoryColumn].forEach((select) => {
  select.addEventListener("change", renderImportPreview);
});

elements.importTransactionsButton.addEventListener("click", async () => {
  const transactions = mappedImportTransactions();
  if (!transactions.length) {
    window.alert("No valid rows to import.");
    return;
  }
  if (!window.confirm(`Import ${transactions.length} transactions?`)) {
    return;
  }
  await persist("/api/transactions/import", {
    method: "POST",
    body: JSON.stringify({ transactions })
  });
  importRows = [];
  elements.importFileInput.value = "";
  renderImportMapping();
  renderImportPreview();
});

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }
  return rows;
}

function renderImportMapping() {
  const headers = importRows[0] || [];
  const options = headers.map((header, index) => `<option value="${index}">${escapeHtml(header || `Column ${index + 1}`)}</option>`).join("");
  [elements.importDateColumn, elements.importDescriptionColumn, elements.importAmountColumn, elements.importCategoryColumn].forEach((select) => {
    select.innerHTML = options;
  });
  setLikelyColumn(elements.importDateColumn, headers, ["date", "transaction date"]);
  setLikelyColumn(elements.importDescriptionColumn, headers, ["description", "details", "memo", "name"]);
  setLikelyColumn(elements.importAmountColumn, headers, ["amount", "value", "debit", "credit"]);
  setLikelyColumn(elements.importCategoryColumn, headers, ["category", "type"]);
}

function setLikelyColumn(select, headers, names) {
  const found = headers.findIndex((header) => names.some((name) => header.toLowerCase().includes(name)));
  if (found >= 0) {
    select.value = String(found);
  }
}

function mappedImportTransactions() {
  if (importRows.length < 2) {
    return [];
  }
  const dateIndex = Number(elements.importDateColumn.value || 0);
  const descriptionIndex = Number(elements.importDescriptionColumn.value || 0);
  const amountIndex = Number(elements.importAmountColumn.value || 0);
  const categoryIndex = Number(elements.importCategoryColumn.value || 0);
  return importRows.slice(1).map((row) => {
    const description = row[descriptionIndex] || "Imported transaction";
    const category = row[categoryIndex] || guessCategory(description);
    return {
      date: normalizeImportDate(row[dateIndex]),
      description,
      category,
      amount: signedAmountForCategory(category, parseImportAmount(row[amountIndex]))
    };
  }).filter((transaction) => transaction.date && transaction.amount);
}

function renderImportPreview() {
  const transactions = mappedImportTransactions().slice(0, 8);
  elements.importPreview.innerHTML = transactions.map((transaction) => `
    <div class="transaction-item">
      <div><strong>${escapeHtml(transaction.description)}</strong><br><small>${formatTransactionDateTime(transaction)} - ${escapeHtml(transaction.category)}</small></div>
      <strong class="money ${transaction.amount >= 0 ? "positive" : "negative"}">${formatMoney(transaction.amount)}</strong>
    </div>
  `).join("") || `<div class="empty-state">Choose a CSV file to preview imports.</div>`;
}

function parseImportAmount(value) {
  return Math.abs(Number(String(value || "0").replace(/[^\d.-]/g, "")) || 0);
}

function normalizeImportDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function guessCategory(description) {
  const lower = String(description || "").toLowerCase();
  const rule = (appState.category_rules || []).find((item) => lower.includes(String(item.contains || "").toLowerCase()));
  return rule ? rule.category : (expenseCategories()[0] ? expenseCategories()[0].name : appState.categories[0]?.name || "");
}

elements.settingsCategoryList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("button");
  if (!actionButton) {
    return;
  }
  const editName = actionButton.dataset.categoryEdit;
  const deleteName = actionButton.dataset.categoryDelete;

  if (editName) {
    const category = appState.categories.find((item) => item.name === editName);
    elements.categoryFormTitle.textContent = "Update category";
    elements.newCategoryInput.value = category.name;
    elements.categoryTypeInput.value = category.type || "expense";
    elements.budgetInput.value = category.budget || 0;
    updateCategoryBudgetField();
    openCategoryForm();
  }

  if (deleteName) {
    if (!window.confirm(`Delete ${deleteName}? Transactions will keep their category text, but the category will be removed from settings.`)) {
      return;
    }
    await persist(`/api/categories/${encodeURIComponent(deleteName)}`, { method: "DELETE" });
  }
});

function pieSliceAt(event) {
  const rect = elements.expensePie.getBoundingClientRect();
  const width = rect.width || 560;
  const height = rect.height || 462;
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = width / 2;
  const centerY = height / 2 + 8;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const outerRadius = Math.min(width, height) / 2 - 76;
  if (distance > outerRadius) {
    return null;
  }
  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) {
    angle += Math.PI * 2;
  }
  return pieSlices.find((slice) => angle >= slice.startAngle && angle <= slice.endAngle);
}

loadData().catch(() => {
  setStatus("Server unavailable");
});
