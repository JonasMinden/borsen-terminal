const STORAGE_KEYS = {
  settings: "boersen-terminal-settings",
  auth: "boersen-terminal-auth",
  portfolios: "boersen-terminal-portfolios",
  newsArchive: "boersen-terminal-news-archive"
};

const COMPANY_COLOR_MAP = {
  AAPL: "#b8f1ff",
  MSFT: "#8fd16f",
  NVDA: "#8cf26b",
  AMZN: "#ffb347",
  META: "#5fb6ff",
  GOOG: "#7aa9ff",
  GOOGL: "#7aa9ff",
  TSLA: "#ff5c75",
  SAP: "#52b6ff",
  "SAP.DE": "#52b6ff",
  ASML: "#7dc8ff",
  "MC.PA": "#d8b46a",
  BTC: "#f7931a",
  "BTC-USD": "#f7931a"
};

const CHART_RANGE_CONFIG = {
  "1d": { range: "1d", interval: "5m", label: "Heute / 5 Min", time: true },
  "5d": { range: "5d", interval: "30m", label: "Woche / 30 Min", time: true },
  "1mo": { range: "1mo", interval: "1d", label: "Monat / 1 Tag", time: false },
  "3mo": { range: "3mo", interval: "1d", label: "3 Monate / 1 Tag", time: false },
  "6mo": { range: "6mo", interval: "1d", label: "6 Monate / 1 Tag", time: false },
  "1y": { range: "1y", interval: "1wk", label: "Jahr / 1 Woche", time: false },
  "2y": { range: "2y", interval: "1wk", label: "2 Jahre / 1 Woche", time: false },
  "5y": { range: "5y", interval: "1mo", label: "5 Jahre / 1 Monat", time: false },
  "10y": { range: "10y", interval: "1mo", label: "10 Jahre / 1 Monat", time: false },
  "max": { range: "max", interval: "3mo", label: "Max / 3 Monate", time: false }
};

const state = {
  universe: [],
  groups: [],
  quotes: new Map(),
  markets: [],
  fundamentals: null,
  companyNews: [],
  globalNews: [],
  longRangeHistory: [],
  selectedSymbol: "MSFT",
  selectedMarket: "nasdaq",
  provider: "Loading...",
  filter: "",
  activeTab: "overview",
  activeDetailTab: "fundamentals",
  activeFundamentalsTab: "overview",
  activeFundamentalsPeriod: "quarter",
  activeUniverseFilter: "all",
  activePortfolioTab: "watchlists",
  chartRange: "1d",
  chartPoints: [],
  newsQuery: "",
  newsSort: "relevance",
  newsArchive: { global: [], ticker: {} },
  globeRotation: { lon: -18, lat: 16 },
  globeScale: 1,
  marketPreviewKey: null,
  priceColorMode: "brand",
  authConfig: null,
  authSession: null,
  portfolioStore: { watchlists: [], portfolios: [] }
};

const elements = {
  providerName: document.querySelector("#providerName"),
  updatedAt: document.querySelector("#updatedAt"),
  coverageLabel: document.querySelector("#coverageLabel"),
  authStatusLabel: document.querySelector("#authStatusLabel"),
  companyCount: document.querySelector("#companyCount"),
  advancers: document.querySelector("#advancers"),
  decliners: document.querySelector("#decliners"),
  leaderSymbol: document.querySelector("#leaderSymbol"),
  leaderMove: document.querySelector("#leaderMove"),
  laggardSymbol: document.querySelector("#laggardSymbol"),
  laggardMove: document.querySelector("#laggardMove"),
  watchlist: document.querySelector("#watchlist"),
  searchInput: document.querySelector("#searchInput"),
  scopeTabs: document.querySelector("#scopeTabs"),
  heroName: document.querySelector("#heroName"),
  heroMeta: document.querySelector("#heroMeta"),
  heroTicker: document.querySelector("#heroTicker"),
  heroPrice: document.querySelector("#heroPrice"),
  heroChange: document.querySelector("#heroChange"),
  heroPriceHover: document.querySelector("#heroPriceHover"),
  priceColorModeButton: document.querySelector("#priceColorModeButton"),
  priceColorModeLabel: document.querySelector("#priceColorModeLabel"),
  quoteGrid: document.querySelector("#quoteGrid"),
  chartSvg: document.querySelector("#chartSvg"),
  chartSubtitle: document.querySelector("#chartSubtitle"),
  chartTooltip: document.querySelector("#chartTooltip"),
  heatmapGrid: document.querySelector("#heatmapGrid"),
  heatmapTitle: document.querySelector("#heatmapTitle"),
  summaryCards: document.querySelector("#summaryCards"),
  breadthCards: document.querySelector("#breadthCards"),
  marketClock: document.querySelector("#marketClock"),
  marketDetails: document.querySelector("#marketDetails"),
  marketLinkedList: document.querySelector("#marketLinkedList"),
  marketScreener: document.querySelector("#marketScreener"),
  globeSvg: document.querySelector("#globeSvg"),
  metricsGrid: document.querySelector("#metricsGrid"),
  trendGrid: document.querySelector("#trendGrid"),
  filingsList: document.querySelector("#filingsList"),
  releaseLinks: document.querySelector("#releaseLinks"),
  fundamentalsSource: document.querySelector("#fundamentalsSource"),
  fundamentalsSummary: document.querySelector("#fundamentalsSummary"),
  companyNewsList: document.querySelector("#companyNewsList"),
  companyNewsSource: document.querySelector("#companyNewsSource"),
  globalNewsSource: document.querySelector("#globalNewsSource"),
  newsSearchInput: document.querySelector("#newsSearchInput"),
  globalNewsList: document.querySelector("#globalNewsList"),
  selectedNewsTitle: document.querySelector("#selectedNewsTitle"),
  selectedNewsList: document.querySelector("#selectedNewsList"),
  newsArchiveList: document.querySelector("#newsArchiveList"),
  newsResultMeta: document.querySelector("#newsResultMeta"),
  archiveMeta: document.querySelector("#archiveMeta"),
  screenerGroupTabs: document.querySelector("#screenerGroupTabs"),
  screenerTable: document.querySelector("#screenerTable"),
  authGate: document.querySelector("#authGate"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  demoLoginButton: document.querySelector("#demoLoginButton"),
  authProviders: document.querySelector("#authProviders"),
  portfolioWorkspace: document.querySelector("#portfolioWorkspace"),
  portfolioUserLabel: document.querySelector("#portfolioUserLabel"),
  portfolioSummaryCards: document.querySelector("#portfolioSummaryCards"),
  watchlistsPane: document.querySelector("#watchlistsPane"),
  portfoliosPane: document.querySelector("#portfoliosPane"),
  watchlistForm: document.querySelector("#watchlistForm"),
  watchlistNameInput: document.querySelector("#watchlistNameInput"),
  portfolioForm: document.querySelector("#portfolioForm"),
  portfolioNameInput: document.querySelector("#portfolioNameInput"),
  saveCurrentToListButton: document.querySelector("#saveCurrentToListButton"),
  logoutButton: document.querySelector("#logoutButton"),
  tabButtons: [...document.querySelectorAll(".tab-button")],
  tabPanels: [...document.querySelectorAll(".tab-panel")],
  detailTabButtons: [...document.querySelectorAll("[data-detail-tab]")],
  detailPanes: [...document.querySelectorAll(".detail-pane")],
  fundamentalsTabButtons: [...document.querySelectorAll("[data-fundamentals-tab]")],
  fundamentalsPeriodButtons: [...document.querySelectorAll("[data-period]")],
  chartRangeButtons: [...document.querySelectorAll("[data-chart-range]")],
  newsSortButtons: [...document.querySelectorAll("[data-news-sort]")],
  portfolioTabButtons: [...document.querySelectorAll("[data-portfolio-tab]")],
  portfolioPanes: [...document.querySelectorAll(".portfolio-pane")],
  watchlistItemTemplate: document.querySelector("#watchlistItemTemplate")
};

async function init() {
  hydrateLocalState();
  bindEvents();
  await Promise.all([loadUniverse(), loadMarkets(), loadAuthBootstrap(), loadGlobalNews()]);
  await refreshQuotes();
  await selectSymbol(state.selectedSymbol, { skipWatchlist: true, keepTab: true });
  renderAuth();
  renderPortfolioTabs();
  renderPortfolios();
  window.setInterval(refreshQuotes, 30000);
  window.setInterval(updateMarketClock, 1000);
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.filter = event.target.value.trim().toLowerCase();
    renderWatchlist();
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
    });
  });

  elements.detailTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDetailTab = button.dataset.detailTab;
      renderDetailTabs();
    });
  });

  elements.fundamentalsTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFundamentalsTab = button.dataset.fundamentalsTab;
      renderFundamentals();
    });
  });

  elements.fundamentalsPeriodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFundamentalsPeriod = button.dataset.period;
      renderFundamentals();
    });
  });

  elements.chartRangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      state.chartRange = button.dataset.chartRange;
      elements.chartRangeButtons.forEach((node) => node.classList.toggle("is-active", node === button));
      persistSettings();
      await loadChart(state.selectedSymbol);
    });
  });

  elements.newsSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.newsSort = button.dataset.newsSort;
      renderNewsSort();
      renderGlobalNews();
      renderCompanyNews();
    });
  });

  elements.newsSearchInput.addEventListener("input", (event) => {
    state.newsQuery = event.target.value.trim().toLowerCase();
    renderGlobalNews();
    renderCompanyNews();
  });

  elements.priceColorModeButton.addEventListener("click", () => {
    state.priceColorMode = state.priceColorMode === "brand" ? "standard" : "brand";
    persistSettings();
    renderSelectionHeader();
    renderPriceColorMode();
    renderChart(state.chartPoints);
  });

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loginWithProfile(elements.loginEmail.value.trim(), false);
  });

  elements.demoLoginButton.addEventListener("click", () => loginWithProfile("demo@terminal.local", true));
  elements.logoutButton.addEventListener("click", logout);
  elements.watchlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createList("watchlists", elements.watchlistNameInput.value.trim());
  });
  elements.portfolioForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createList("portfolios", elements.portfolioNameInput.value.trim());
  });
  elements.saveCurrentToListButton.addEventListener("click", () => saveCurrentToDefaultList());

  elements.portfolioTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activePortfolioTab = button.dataset.portfolioTab;
      renderPortfolioTabs();
      renderPortfolios();
    });
  });

  bindGlobeInteractions();
}
function hydrateLocalState() {
  const savedSettings = safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), {});
  state.activeUniverseFilter = savedSettings.activeUniverseFilter || state.activeUniverseFilter;
  state.chartRange = savedSettings.chartRange || state.chartRange;
  state.newsSort = savedSettings.newsSort || state.newsSort;
  state.priceColorMode = savedSettings.priceColorMode || state.priceColorMode;
  state.authSession = safeJsonParse(localStorage.getItem(STORAGE_KEYS.auth), null);
  state.newsArchive = safeJsonParse(localStorage.getItem(STORAGE_KEYS.newsArchive), { global: [], ticker: {} });
  state.portfolioStore = loadPortfolioStore();
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
    activeUniverseFilter: state.activeUniverseFilter,
    chartRange: state.chartRange,
    newsSort: state.newsSort,
    priceColorMode: state.priceColorMode
  }));
}

function persistNewsArchive() {
  localStorage.setItem(STORAGE_KEYS.newsArchive, JSON.stringify(state.newsArchive));
}

function saveAuthSession() {
  if (state.authSession) {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state.authSession));
  } else {
    localStorage.removeItem(STORAGE_KEYS.auth);
  }
}

function loadPortfolioStore() {
  const all = safeJsonParse(localStorage.getItem(STORAGE_KEYS.portfolios), {});
  const key = state.authSession?.email || "guest";
  return all[key] || { watchlists: [], portfolios: [] };
}

function savePortfolioStore() {
  const all = safeJsonParse(localStorage.getItem(STORAGE_KEYS.portfolios), {});
  const key = state.authSession?.email || "guest";
  all[key] = state.portfolioStore;
  localStorage.setItem(STORAGE_KEYS.portfolios, JSON.stringify(all));
}

async function loadUniverse() {
  const response = await fetch("/api/universe");
  const payload = await response.json();
  state.groups = payload.groups || [];
  state.universe = (payload.items || []).map((item) => ({ universes: item.universes || inferUniverses(item), assetClass: item.assetClass || "equity", ...item }));
  renderScopeTabs();
  renderWatchlist();
}

async function loadMarkets() {
  const response = await fetch("/api/markets");
  const payload = await response.json();
  state.markets = payload.items || [];
  renderGlobe();
  renderMarketDetails();
  renderMarketLinkedList();
  renderMarketScreener();
  updateMarketClock();
}

async function loadAuthBootstrap() {
  try {
    const response = await fetch("/api/auth/bootstrap");
    state.authConfig = await response.json();
  } catch {
    state.authConfig = { mode: "local-prep", providers: [{ key: "email", label: "E-Mail Login Vorbereitung" }] };
  }
  renderAuth();
}

async function loadGlobalNews() {
  const response = await fetch("/api/news?mode=global&limit=36");
  const payload = await response.json();
  state.globalNews = payload.items || [];
  elements.globalNewsSource.textContent = payload.source || "Google News RSS";
  archiveNews("global", payload.items || []);
  renderGlobalNews();
}

async function refreshQuotes() {
  if (!state.universe.length) return;
  const symbols = state.universe.map((item) => item.symbol).join(",");
  let payload = { items: [] };
  try {
    const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
    payload = await response.json();
  } catch {
    // Netzwerkfehler – vorhandene Kursdaten behalten
  }
  if (payload.items?.length) {
    state.quotes = new Map(payload.items.map((item) => [item.symbol, item]));
  }
  state.provider = payload.sourceSummary || payload.provider || (state.quotes.size ? state.provider : "Fehler");
  elements.providerName.textContent = state.provider;
  elements.updatedAt.textContent = new Date().toLocaleTimeString("de-DE");
  renderWatchlist();
  renderSelectionHeader();
  renderHeatmap();
  renderSummaryCards();
  renderBreadthCards();
  renderScreener();
  renderMarketDetails();
  renderMarketLinkedList();
  renderMarketScreener();
  renderPortfolios();
}

async function loadChart(symbol) {
  const config = getChartConfig(state.chartRange);
  const response = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(config.range)}&interval=${encodeURIComponent(config.interval)}`);
  const payload = await response.json();
  state.chartPoints = payload.points || [];
  elements.chartSubtitle.textContent = config.label;
  renderChart(state.chartPoints);
}

async function loadLongRangeHistory(symbol) {
  const response = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=10y&interval=1mo`);
  const payload = await response.json();
  state.longRangeHistory = payload.points || [];
  renderFundamentals();
}

async function loadFundamentals(symbol) {
  elements.fundamentalsSource.textContent = "SEC Daten werden geladen...";
  const response = await fetch(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}&ts=${Date.now()}`, { cache: "no-store" });
  state.fundamentals = normalizeFundamentalsPayload(await response.json());
  renderFundamentals();
}

async function loadCompanyNews(symbol) {
  const company = getCompany(symbol);
  const params = new URLSearchParams({ symbol, name: company?.name || symbol, mode: "ticker", limit: "36" });
  const response = await fetch(`/api/news?${params.toString()}`);
  const payload = await response.json();
  state.companyNews = payload.items || [];
  elements.companyNewsSource.textContent = payload.source || "Google News RSS";
  archiveNews(symbol, payload.items || []);
  renderCompanyNews();
  renderGlobalNews();
}

async function selectSymbol(symbol, options = {}) {
  state.selectedSymbol = symbol;
  renderWatchlist();
  renderSelectionHeader();
  renderSummaryCards();
  renderBreadthCards();
  renderGlobalNews();
  renderPortfolios();
  await Promise.all([loadChart(symbol), loadLongRangeHistory(symbol), loadFundamentals(symbol), loadCompanyNews(symbol)]);
  if (!options.skipWatchlist && !options.keepTab) {
    state.activeTab = "overview";
    renderTabs();
  }
}

function renderTabs() {
  elements.tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === state.activeTab));
  elements.tabPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === state.activeTab));
}

function renderDetailTabs() {
  elements.detailTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.detailTab === state.activeDetailTab));
  elements.detailPanes.forEach((pane) => pane.classList.toggle("is-active", pane.id === `${state.activeDetailTab === "company-news" ? "companyNews" : "fundamentals"}Pane`));
}

function renderPortfolioTabs() {
  elements.portfolioTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.portfolioTab === state.activePortfolioTab));
  elements.portfolioPanes.forEach((pane) => pane.classList.toggle("is-active", pane.id === `${state.activePortfolioTab}Pane`));
}

function renderScopeTabs() {
  const scopeNodes = state.groups.map((group) => createScopeButton(group, state.activeUniverseFilter === group.key));
  elements.scopeTabs.replaceChildren(...scopeNodes.map((node) => node.cloneNode(true)));
  elements.screenerGroupTabs.replaceChildren(...scopeNodes);
  [...elements.scopeTabs.querySelectorAll("button"), ...elements.screenerGroupTabs.querySelectorAll("button")].forEach((button) => {
    button.addEventListener("click", () => {
      state.activeUniverseFilter = button.dataset.scope;
      persistSettings();
      renderScopeTabs();
      renderWatchlist();
      renderHeatmap();
      renderSummaryCards();
      renderBreadthCards();
      renderScreener();
    });
  });
}

function renderWatchlist() {
  const filtered = getFilteredUniverse();
  const movers = getSortedUniverse(filtered);
  const leader = movers[0];
  const laggard = movers[movers.length - 1];
  elements.companyCount.textContent = String(filtered.length);
  elements.advancers.textContent = String(filtered.filter((item) => (state.quotes.get(item.symbol)?.changePercent || 0) > 0).length);
  elements.decliners.textContent = String(filtered.filter((item) => (state.quotes.get(item.symbol)?.changePercent || 0) < 0).length);
  elements.leaderSymbol.textContent = leader?.symbol || "--";
  elements.leaderMove.textContent = leader ? `${formatDelta(leader.change, leader.changePercent)} | MK ${formatCompactCurrency(leader.marketCap, leader.currency)}` : "--";
  elements.leaderMove.className = `source-note ${toneClass(leader?.changePercent)}`;
  elements.laggardSymbol.textContent = laggard?.symbol || "--";
  elements.laggardMove.textContent = laggard ? `${formatDelta(laggard.change, laggard.changePercent)} | MK ${formatCompactCurrency(laggard.marketCap, laggard.currency)}` : "--";
  elements.laggardMove.className = `source-note ${toneClass(laggard?.changePercent)}`;
  elements.watchlist.replaceChildren();
  if (!filtered.length) {
    elements.watchlist.append(createEmptyState("Keine Treffer im aktuellen Filter."));
    return;
  }
  filtered.forEach((item) => {
    const quote = state.quotes.get(item.symbol);
    const node = elements.watchlistItemTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("is-active", item.symbol === state.selectedSymbol);
    node.querySelector(".watchlist-item__symbol").textContent = item.symbol;
    node.querySelector(".watchlist-item__name").textContent = `${item.name} | MK ${formatCompactCurrency(quote?.marketCap, quote?.currency || item.currency)}`;
    node.querySelector(".watchlist-item__price").textContent = formatCurrency(quote?.price, quote?.currency || item.currency);
    const delta = node.querySelector(".watchlist-item__delta");
    delta.textContent = formatDelta(quote?.change, quote?.changePercent);
    delta.className = `watchlist-item__delta ${toneClass(quote?.changePercent)}`;
    node.addEventListener("click", async () => {
      if (item.symbol !== state.selectedSymbol) await selectSymbol(item.symbol);
    });
    elements.watchlist.append(node);
  });
}
function renderSelectionHeader() {
  const company = getCompany(state.selectedSymbol);
  const quote = state.quotes.get(state.selectedSymbol);
  if (!company) return;
  elements.heroName.textContent = company.name;
  elements.heroMeta.textContent = `${company.sector} | ${company.country} | ${quote?.exchange || company.exchange}`;
  elements.heroTicker.textContent = company.symbol;
  elements.heroPrice.textContent = formatCurrency(quote?.price, quote?.currency || company.currency);
  elements.heroPrice.className = `price-value ${state.priceColorMode === "standard" ? profitLossTone({ label: "price" }, quote?.change) : ""}`;
  elements.heroPrice.style.color = state.priceColorMode === "brand" ? getCompanyColor(company) : "";
  elements.heroChange.textContent = formatDelta(quote?.change, quote?.changePercent);
  elements.heroChange.className = `delta-pill ${toneClass(quote?.changePercent)}`;
  const tiles = [
    ["Eroeffnung", formatCurrency(quote?.open, quote?.currency || company.currency)],
    ["Tageshoch", formatCurrency(quote?.high, quote?.currency || company.currency)],
    ["Tagestief", formatCurrency(quote?.low, quote?.currency || company.currency)],
    ["Vortag", formatCurrency(quote?.previousClose, quote?.currency || company.currency)],
    ["Volumen", formatCompactNumber(quote?.volume)],
    ["Marktkap.", formatCompactCurrency(quote?.marketCap, quote?.currency || company.currency)],
    ["Asset-Klasse", assetLabel(company)],
    ["Coverage", company.universes.map(labelUniverseKey).join(" | ")]
  ];
  elements.quoteGrid.replaceChildren(...tiles.map(([label, value]) => createMiniTile(label, value)));
  elements.selectedNewsTitle.textContent = `Ticker Headlines: ${company.symbol}`;
  renderPriceColorMode();
}

function renderPriceColorMode() {
  const active = state.priceColorMode === "brand";
  elements.priceColorModeButton.classList.toggle("is-active", active);
  elements.priceColorModeLabel.textContent = active ? "Firmenfarbe" : "Standard";
  elements.priceColorModeButton.title = active ? "Firmenfarbe aktiv" : "Standardfarbe aktiv";
  const dot = elements.priceColorModeButton.querySelector(".indicator-dot");
  dot.style.background = active ? getCompanyColor(getCompany(state.selectedSymbol)) : "var(--blue)";
}

function renderHeatmap() {
  const heatmapItems = getHeatmapUniverse();
  const maxSize = Math.max(...heatmapItems.map((item) => item.marketCap || item.volume || 1), 1);
  const titleGroup = state.groups.find((group) => group.key === state.activeUniverseFilter);
  elements.heatmapTitle.textContent = `Heatmap ${titleGroup?.label || "Overview"}`;
  elements.heatmapGrid.replaceChildren(...(heatmapItems.length ? heatmapItems.map((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "heatmap-card";
    const weight = Math.sqrt((item.marketCap || item.volume || 1) / maxSize);
    const spans = getHeatmapSpans(weight);
    card.style.setProperty("--col-span", String(spans.col));
    card.style.setProperty("--row-span", String(spans.row));
    card.style.background = heatmapBackground(item.changePercent);
    card.innerHTML = `<span class="heatmap-card__symbol">${item.symbol}</span><span class="heatmap-card__name">${item.name}</span><span class="heatmap-card__meta ${toneClass(item.changePercent)}">${formatDelta(item.change, item.changePercent)}</span><span class="heatmap-card__meta">${formatCompactCurrency(item.marketCap, item.currency)}</span>`;
    card.addEventListener("click", async () => await selectSymbol(item.symbol));
    return card;
  }) : [createEmptyState("Keine Heatmap-Daten fuer diese Auswahl.")]));
}

function renderSummaryCards() {
  const company = getCompany(state.selectedSymbol);
  const quote = state.quotes.get(state.selectedSymbol);
  const filtered = getSortedUniverse(getFilteredUniverse());
  if (!company) return;
  const cards = [
    ["Sektor", company.sector, `${company.name} im Fokus`],
    ["Signal", formatSignal(quote?.changePercent), `${company.symbol} ${formatDelta(quote?.change, quote?.changePercent)}`],
    ["Marktkap.", formatCompactCurrency(quote?.marketCap, quote?.currency || company.currency), "Live Quote sofern verfuegbar"],
    ["Top Mover", filtered.slice(0, 3).map((item) => item.symbol).join(", ") || "--", "Beste Tagesbewegungen in der aktuellen Auswahl"]
  ];
  elements.summaryCards.replaceChildren(...cards.map(([title, value, copy]) => createSummaryBlock(title, value, copy, toneFromSummaryTitle(title, quote?.changePercent))));
}

function renderBreadthCards() {
  const filtered = getFilteredUniverse();
  const quoteList = filtered.map((item) => ({ ...item, ...state.quotes.get(item.symbol) }));
  const avgMove = average(quoteList.map((item) => item.changePercent).filter(Number.isFinite));
  const positiveCount = quoteList.filter((item) => (item.changePercent || 0) > 0).length;
  const negativeCount = quoteList.filter((item) => (item.changePercent || 0) < 0).length;
  const totalCap = quoteList.reduce((sum, item) => sum + (item.marketCap || 0), 0);
  elements.breadthCards.replaceChildren(
    createSummaryBlock("Durchschnitt", formatPercent(avgMove), `${filtered.length} Werte in Auswahl`, toneClass(avgMove)),
    createSummaryBlock("Marktkap.", formatCompactCurrency(totalCap, "USD"), "Aggregiert fuer den aktuellen Filter", totalCap > 0 ? "is-neutral" : "is-negative"),
    createSummaryBlock("Balance", `${positiveCount} / ${negativeCount}`, "Gruen gegen Rot", positiveCount >= negativeCount ? "is-positive" : "is-negative")
  );
}

function renderScreener() {
  const rows = getSortedUniverse(getFilteredUniverse());
  elements.screenerTable.replaceChildren();
  const head = document.createElement("div");
  head.className = "screener-row screener-row--head";
  head.innerHTML = "<div>Symbol</div><div>Name</div><div>Asset</div><div>Letzter Kurs</div><div>Veraenderung</div><div>Volumen</div><div>Marktkap.</div>";
  elements.screenerTable.append(head);
  rows.forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "screener-row";
    row.innerHTML = `<div class="screener-cell--mono">${item.symbol}</div><div class="screener-cell--name"><strong>${item.name}</strong><span>${item.sector}</span></div><div class="screener-cell--mono">${assetLabel(item)}</div><div class="screener-cell--mono">${formatCurrency(item.price, item.currency)}</div><div class="screener-cell--mono ${toneClass(item.changePercent)}">${formatDelta(item.change, item.changePercent)}</div><div class="screener-cell--mono">${formatCompactNumber(item.volume)}</div><div class="screener-cell--mono">${formatCompactCurrency(item.marketCap, item.currency)}</div>`;
    row.addEventListener("click", async () => await selectSymbol(item.symbol));
    elements.screenerTable.append(row);
  });
}

function renderChart(points) {
  elements.chartSvg.replaceChildren();
  elements.chartTooltip.classList.remove("is-visible");
  if (!points.length) {
    elements.chartSvg.append(svgText("Keine Chartdaten"));
    return;
  }
  const width = 640;
  const height = 220;
  const padding = 18;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const latest = points.at(-1);
  const currency = state.quotes.get(state.selectedSymbol)?.currency || getCompany(state.selectedSymbol)?.currency || "USD";
  const companyColor = getCompanyColor(getCompany(state.selectedSymbol));
  if (latest) {
    const hoverText = `${formatChartTimestamp(latest.time)} | ${formatCurrency(latest.price, currency)}`;
    elements.heroPriceHover.textContent = hoverText;
    elements.heroPrice.title = hoverText;
  }
  const coords = points.map((point, index) => ({
    ...point,
    x: padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * index,
    y: height - padding - ((point.price - min) / span) * (height - padding * 2)
  }));
  for (let index = 0; index < 4; index += 1) {
    const y = padding + ((height - padding * 2) / 3) * index;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("x2", String(width));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("class", "chart-grid-line");
    elements.chartSvg.append(line);
  }
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  areaPath.setAttribute("d", `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`);
  areaPath.setAttribute("class", "chart-area");
  areaPath.setAttribute("fill", state.priceColorMode === "brand" ? hexToRgba(companyColor, 0.18) : "rgba(255, 143, 31, 0.18)");
  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linePath.setAttribute("d", path);
  linePath.setAttribute("class", "chart-line");
  linePath.setAttribute("stroke", state.priceColorMode === "brand" ? companyColor : "var(--accent)");
  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  overlay.setAttribute("x", "0");
  overlay.setAttribute("y", "0");
  overlay.setAttribute("width", String(width));
  overlay.setAttribute("height", String(height));
  overlay.setAttribute("fill", "transparent");
  overlay.addEventListener("mousemove", (event) => {
    const rect = elements.chartSvg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const nearest = coords.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best), coords[0]);
    elements.chartTooltip.innerHTML = `<strong>${formatCurrency(nearest.price, currency)}</strong><span>${formatChartTimestamp(nearest.time)}</span>`;
    elements.chartTooltip.classList.add("is-visible");
    elements.chartTooltip.style.left = `${Math.min(Math.max((nearest.x / width) * 100, 8), 88)}%`;
    elements.chartTooltip.style.top = `${Math.min(Math.max((nearest.y / height) * 100 - 10, 8), 80)}%`;
    const hoverText = `${formatChartTimestamp(nearest.time)} | ${formatCurrency(nearest.price, currency)}`;
    elements.heroPriceHover.textContent = hoverText;
    elements.heroPrice.title = hoverText;
  });
  overlay.addEventListener("mouseleave", () => {
    elements.chartTooltip.classList.remove("is-visible");
    if (latest) {
      const hoverText = `${formatChartTimestamp(latest.time)} | ${formatCurrency(latest.price, currency)}`;
      elements.heroPriceHover.textContent = hoverText;
      elements.heroPrice.title = hoverText;
    }
  });
  elements.chartSvg.append(areaPath, linePath, overlay);
}
function renderGlobe() {
  const continents = [
    [[70,-168],[58,-145],[50,-130],[42,-124],[32,-117],[25,-107],[22,-96],[18,-90],[18,-82],[24,-79],[29,-83],[37,-90],[44,-96],[51,-108],[58,-120],[64,-140],[70,-168]],
    [[12,-81],[8,-77],[-2,-74],[-12,-71],[-24,-66],[-34,-61],[-46,-67],[-52,-71],[-41,-52],[-26,-48],[-10,-51],[2,-57],[9,-65],[12,-81]],
    [[71,-10],[64,0],[57,8],[52,16],[50,28],[58,44],[54,70],[48,92],[42,112],[38,126],[32,136],[26,126],[18,114],[8,102],[4,90],[8,74],[16,60],[22,48],[30,36],[36,28],[40,18],[45,8],[52,-2],[60,-8],[71,-10]],
    [[35,-18],[28,-12],[20,-8],[10,-1],[2,8],[-10,18],[-22,24],[-31,20],[-33,10],[-24,2],[-10,-3],[6,-10],[18,-15],[28,-17],[35,-18]],
    [[-11,112],[-17,118],[-22,128],[-27,138],[-34,146],[-39,151],[-35,115],[-28,112],[-18,110],[-11,112]]
  ];
  elements.globeSvg.replaceChildren();
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = '<radialGradient id="globeGradient" cx="35%" cy="30%"><stop offset="0%" stop-color="rgba(117, 194, 255, 0.72)"></stop><stop offset="100%" stop-color="rgba(8, 29, 50, 0.98)"></stop></radialGradient>';
  elements.globeSvg.append(defs);
  const shell = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  shell.setAttribute("cx", "210");
  shell.setAttribute("cy", "150");
  shell.setAttribute("r", String(112 * state.globeScale));
  shell.setAttribute("class", "globe-shell globe-shell--solid");
  elements.globeSvg.append(shell);
  [0.35, 0.62, 0.82].forEach((scale) => {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ring.setAttribute("cx", "210");
    ring.setAttribute("cy", "150");
    ring.setAttribute("rx", String(112 * state.globeScale * scale));
    ring.setAttribute("ry", String(112 * state.globeScale));
    ring.setAttribute("class", "globe-ring");
    elements.globeSvg.append(ring);
  });
  continents.forEach((polygon) => {
    const projected = polygon.map(([lat, lon]) => projectPoint(lat, lon));
    if (projected.filter((point) => point.visible).length < Math.max(3, polygon.length / 3)) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `${projected.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`);
    path.setAttribute("class", "globe-continent");
    elements.globeSvg.append(path);
  });
  state.markets.forEach((market) => {
    const point = projectPoint(market.lat, market.lon);
    if (!point.visible) return;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `market-pin ${market.key === state.selectedMarket ? "is-active" : ""}`);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(point.x));
    dot.setAttribute("cy", String(point.y));
    dot.setAttribute("r", market.key === state.selectedMarket ? "7" : "5.5");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(point.x + 10));
    label.setAttribute("y", String(point.y + 4));
    label.textContent = market.name;
    group.append(dot, label);
    group.addEventListener("mouseenter", () => {
      state.marketPreviewKey = market.key;
      renderMarketDetails();
    });
    group.addEventListener("mouseleave", () => {
      state.marketPreviewKey = null;
      renderMarketDetails();
    });
    group.addEventListener("click", () => {
      state.selectedMarket = market.key;
      renderGlobe();
      renderMarketDetails();
      renderMarketLinkedList();
      renderMarketScreener();
      updateMarketClock();
    });
    elements.globeSvg.append(group);
  });
}

function renderMarketDetails() {
  const key = state.marketPreviewKey || state.selectedMarket;
  const market = state.markets.find((item) => item.key === key);
  if (!market) return;
  const linked = getMarketLinkedCompanies(market).map((item) => ({ ...item, ...state.quotes.get(item.symbol) }));
  const avgMove = average(linked.map((item) => item.changePercent).filter(Number.isFinite));
  const totalCap = linked.reduce((sum, item) => sum + (item.marketCap || 0), 0);
  const cards = [
    [market.name, `${market.city}, ${market.country}`],
    ["Handelszeiten", `${market.openLocal} - ${market.closeLocal} (${market.timezone})`],
    ["Live Preview", `${linked.length} Werte | ${formatPercent(avgMove)} | MK ${formatCompactCurrency(totalCap, "USD")}`],
    ["Desk Note", market.note]
  ];
  elements.marketDetails.replaceChildren(...cards.map(([title, copy]) => {
    const card = document.createElement("article");
    card.className = "market-summary";
    card.innerHTML = `<strong>${title}</strong><span>${copy}</span>`;
    return card;
  }));
}
function renderMarketLinkedList() {
  const market = state.markets.find((item) => item.key === state.selectedMarket);
  if (!market) return;
  const linked = getMarketLinkedCompanies(market)
    .map((company) => ({ ...company, ...state.quotes.get(company.symbol) }))
    .sort((left, right) => Math.abs(right.changePercent || 0) - Math.abs(left.changePercent || 0))
    .slice(0, 10);
  elements.marketLinkedList.replaceChildren(...(linked.length ? linked.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "market-linked-item";
    button.innerHTML = `<div><strong>${item.symbol}</strong><span>${item.name} | MK ${formatCompactCurrency(item.marketCap, item.currency)}</span></div><div class="screener-cell--mono ${toneClass(item.changePercent)}">${formatDelta(item.change, item.changePercent)}</div>`;
    button.addEventListener("click", async () => await selectSymbol(item.symbol));
    return button;
  }) : [createEmptyState("Keine verknuepften Werte gefunden.")]));
}

function renderMarketScreener() {
  const cards = state.groups.filter((group) => group.key !== "all").map((group) => {
    const items = getUniverseByScope(group.key).map((company) => ({ ...company, ...state.quotes.get(company.symbol) }));
    const avgMove = average(items.map((item) => item.changePercent).filter(Number.isFinite));
    const totalCap = items.reduce((sum, item) => sum + (item.marketCap || 0), 0);
    const biggest = [...items].sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))[0];
    const card = document.createElement("article");
    card.className = "market-screen-card";
    card.innerHTML = `<span>${group.label}</span><strong class="${toneClass(avgMove)}">${formatPercent(avgMove)}</strong><p class="source-note">${items.length} Werte | MK ${formatCompactCurrency(totalCap, "USD")} | Top Move ${biggest?.symbol || "--"} ${biggest ? formatDelta(biggest.change, biggest.changePercent) : "--"}</p>`;
    return card;
  });
  elements.marketScreener.replaceChildren(...cards);
}

function renderFundamentals() {
  const payload = state.fundamentals;
  elements.fundamentalsTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.fundamentalsTab === state.activeFundamentalsTab));
  elements.fundamentalsPeriodButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.period === state.activeFundamentalsPeriod));
  elements.metricsGrid.style.display = state.activeFundamentalsTab === "trends" ? "none" : "grid";
  elements.trendGrid.style.display = state.activeFundamentalsTab === "trends" ? "grid" : "none";

  if (!payload) {
    elements.fundamentalsSource.textContent = "SEC";
    elements.fundamentalsSummary.replaceChildren(createEmptyState("Fundamentals werden geladen."));
    elements.metricsGrid.replaceChildren();
    elements.trendGrid.replaceChildren();
    elements.releaseLinks.replaceChildren();
    elements.filingsList.replaceChildren();
    return;
  }

  elements.fundamentalsSource.textContent = payload.source || "SEC";
  if (payload.available === false) {
    elements.fundamentalsSummary.replaceChildren(createEmptyState(payload.reason || "Keine Fundamentals verfuegbar."));
    elements.metricsGrid.replaceChildren();
    elements.trendGrid.replaceChildren(createEmptyState("Fuer dieses Asset gibt es keine SEC-Fundamentals."));
    elements.releaseLinks.replaceChildren();
    elements.filingsList.replaceChildren();
    return;
  }

  const tab = state.activeFundamentalsTab;
  const period = state.activeFundamentalsPeriod;
  elements.fundamentalsSummary.replaceChildren(...buildFundamentalsSummary(payload, tab, period));
  if (tab === "trends") {
    elements.metricsGrid.replaceChildren();
    elements.trendGrid.replaceChildren(...buildTrendCards(payload, period));
  } else if (tab === "filings") {
    elements.metricsGrid.replaceChildren(createEmptyState("Im Bereich Veroeffentlichungen stehen Meldungen und Release-Links im Fokus."));
    elements.trendGrid.replaceChildren();
  } else {
    const metrics = getMetricsForTab(payload.metricCatalog || [], tab, period);
    elements.metricsGrid.replaceChildren(...(metrics.length ? metrics.map((metric) => createMetricCard(metric)) : [createEmptyState(`Keine ${periodLabel(period)}-Kennzahlen fuer diesen Bereich verfuegbar.`)]));
    elements.trendGrid.replaceChildren();
  }
  const releases = payload.releases || [];
  elements.releaseLinks.replaceChildren(...(releases.length ? releases.map((release) => createReleaseLink(release)) : [createEmptyState("Keine Release-Links verfuegbar.")]));
  const filings = payload.filings || [];
  elements.filingsList.replaceChildren(...(filings.length ? filings.map((filing) => createFilingLink(filing)) : [createEmptyState("Keine relevanten Meldungen verfuegbar.")]));
}
function renderCompanyNews() {
  elements.companyNewsList.replaceChildren(...buildNewsNodes(state.companyNews));
  elements.selectedNewsList.replaceChildren(...buildNewsNodes(state.companyNews));
  renderNewsArchive();
}

function renderGlobalNews() {
  const filtered = getFilteredNews(state.globalNews);
  elements.globalNewsList.replaceChildren(...buildNewsNodes(filtered, false));
  elements.newsResultMeta.textContent = `${filtered.length} Treffer | Sortierung: ${state.newsSort === "relevance" ? "Relevanz" : "Aktualitaet"}`;
  if (!state.companyNews.length) {
    elements.selectedNewsList.replaceChildren(createEmptyState("Ticker-News werden geladen."));
  }
  renderNewsArchive();
}

function renderNewsArchive() {
  const archiveItems = getArchiveItemsForView();
  elements.archiveMeta.textContent = `${archiveItems.length} archivierte Meldungen lokal durchsuchbar`;
  elements.newsArchiveList.replaceChildren(...buildNewsNodes(archiveItems, true));
}

function renderNewsSort() {
  elements.newsSortButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.newsSort === state.newsSort));
}

function renderAuth() {
  const session = state.authSession;
  elements.authStatusLabel.textContent = session ? session.displayName : "Nicht eingeloggt";
  const providers = state.authConfig?.providers || [];
  elements.authProviders.replaceChildren(...providers.map((provider) => {
    const card = document.createElement("article");
    card.className = "portfolio-card";
    card.innerHTML = `<div class="portfolio-card__title"><strong>${provider.label}</strong><span class="portfolio-tag">Vorbereitet</span></div><div class="portfolio-card__meta">${provider.note || "Cloudflare Access / Turnstile / Session-Layer folgen im naechsten Schritt."}</div>`;
    return card;
  }));
  elements.authGate.classList.toggle("is-hidden", Boolean(session));
  elements.portfolioWorkspace.classList.toggle("is-hidden", !session);
  if (session) {
    elements.portfolioUserLabel.textContent = `${session.displayName} | ${session.email}`;
  }
}

function renderPortfolios() {
  if (!state.authSession) return;
  const watchlists = state.portfolioStore.watchlists || [];
  const portfolios = state.portfolioStore.portfolios || [];
  const allLists = [...watchlists, ...portfolios];
  elements.portfolioSummaryCards.replaceChildren(
    createSummaryBlock("Watchlisten", String(watchlists.length), "Personalisierte Listen", watchlists.length ? "is-positive" : "is-neutral"),
    createSummaryBlock("Musterportfolios", String(portfolios.length), "Vorbereitete Portfolio-Slots", portfolios.length ? "is-positive" : "is-neutral"),
    createSummaryBlock("Gespeicherte Positionen", String(allLists.reduce((sum, item) => sum + item.holdings.length, 0)), "Lokal persistiert", allLists.length ? "is-positive" : "is-neutral"),
    createSummaryBlock("Selektierter Wert", state.selectedSymbol, "Kann direkt hinzugefuegt werden", "is-neutral")
  );
  elements.watchlistsPane.replaceChildren(...(watchlists.length ? watchlists.map((list) => createPortfolioCard(list, "watchlist")) : [createEmptyState("Noch keine Watchlisten angelegt.")]));
  elements.portfoliosPane.replaceChildren(...(portfolios.length ? portfolios.map((list) => createPortfolioCard(list, "portfolio")) : [createEmptyState("Noch keine Musterportfolios angelegt.")]));
}

function createPortfolioCard(list, kind) {
  const card = document.createElement("article");
  card.className = "portfolio-card";
  const totalCap = list.holdings.reduce((sum, holding) => sum + (state.quotes.get(holding.symbol)?.marketCap || 0), 0);
  const rows = list.holdings.length ? list.holdings.map((holding) => createHoldingRow(holding, list, kind)) : [createEmptyState("Noch keine Werte gespeichert.")];
  card.append(htmlToNode(`<div class="portfolio-card__title"><div><span>${kind === "watchlist" ? "Watchlist" : "Musterportfolio"}</span><strong>${list.name}</strong></div><span class="portfolio-tag">${list.holdings.length} Werte</span></div>`));
  card.append(htmlToNode(`<div class="portfolio-card__meta">Erstellt ${formatDate(list.createdAt)} | MK ${formatCompactCurrency(totalCap, "USD")}</div>`));
  const holdings = document.createElement("div");
  holdings.className = "portfolio-holdings";
  holdings.replaceChildren(...rows);
  card.append(holdings);
  return card;
}

function createHoldingRow(holding, list, kind) {
  const company = getCompany(holding.symbol);
  const quote = state.quotes.get(holding.symbol);
  const row = document.createElement("div");
  row.className = "portfolio-holding-row";
  row.innerHTML = `<strong>${holding.symbol}</strong><div><strong>${company?.name || holding.symbol}</strong><div class="portfolio-card__meta">MK ${formatCompactCurrency(quote?.marketCap, quote?.currency || company?.currency)}</div></div><div class="screener-cell--mono">${formatCurrency(quote?.price, quote?.currency || company?.currency)}</div><div class="screener-cell--mono ${toneClass(quote?.changePercent)}">${formatDelta(quote?.change, quote?.changePercent)}</div>`;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "toggle-button";
  removeButton.textContent = "Entfernen";
  removeButton.addEventListener("click", () => removeHolding(kind, list.id, holding.symbol));
  row.append(removeButton);
  return row;
}

function createList(kind, name) {
  if (!state.authSession || !name) return;
  state.portfolioStore[kind] = [{ id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), holdings: [] }, ...(state.portfolioStore[kind] || [])];
  savePortfolioStore();
  renderPortfolios();
  if (kind === "watchlists") elements.watchlistNameInput.value = "";
  if (kind === "portfolios") elements.portfolioNameInput.value = "";
}

function saveCurrentToDefaultList() {
  if (!state.authSession) return;
  const targetCollection = state.activePortfolioTab === "watchlists" ? "watchlists" : "portfolios";
  if (!state.portfolioStore[targetCollection]?.length) {
    createList(targetCollection, targetCollection === "watchlists" ? "Meine erste Watchlist" : "Mein erstes Musterportfolio");
  }
  const target = state.portfolioStore[targetCollection][0];
  if (!target.holdings.some((item) => item.symbol === state.selectedSymbol)) {
    target.holdings.unshift({ symbol: state.selectedSymbol, addedAt: new Date().toISOString() });
    savePortfolioStore();
    renderPortfolios();
  }
}

function removeHolding(kind, listId, symbol) {
  state.portfolioStore[kind] = (state.portfolioStore[kind] || []).map((list) => list.id === listId ? { ...list, holdings: list.holdings.filter((holding) => holding.symbol !== symbol) } : list);
  savePortfolioStore();
  renderPortfolios();
}

function loginWithProfile(email, demoMode) {
  if (!email) return;
  const displayName = demoMode ? "Demo User" : email.split("@")[0];
  state.authSession = { email, displayName, mode: demoMode ? "demo" : "local-prep", loggedInAt: new Date().toISOString() };
  saveAuthSession();
  state.portfolioStore = loadPortfolioStore();
  renderAuth();
  renderPortfolios();
}

function logout() {
  state.authSession = null;
  state.portfolioStore = { watchlists: [], portfolios: [] };
  saveAuthSession();
  renderAuth();
}
function buildNewsNodes(items, archiveMode = false) {
  const list = getFilteredNews(items);
  return list.length ? list.map((item) => {
    const card = document.createElement("a");
    card.className = "news-card";
    card.href = item.link;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.innerHTML = `<strong>${item.title}</strong><span>${item.source || "Quelle"}</span><div class="news-card__meta"><small>${formatDateTime(item.publishedAt)}</small><span class="news-score-pill">Rel ${Math.round(item.relevanceScore || 0)} | Trust ${Math.round(item.trustScore || 0)}</span></div>${archiveMode ? `<small>${item.archiveScopeLabel || "Archiv"}</small>` : ""}`;
    return card;
  }) : [createEmptyState(state.newsQuery ? `Keine News fuer \"${state.newsQuery}\" gefunden.` : "Keine Nachrichten gefunden.")];
}

function getFilteredNews(items) {
  const query = state.newsQuery || "";
  const filtered = query ? items.filter((item) => `${item.title} ${item.source} ${item.keywords || ""}`.toLowerCase().includes(query)) : [...items];
  return filtered.sort((left, right) => state.newsSort === "recency" ? new Date(right.publishedAt || 0) - new Date(left.publishedAt || 0) : (right.relevanceScore || 0) - (left.relevanceScore || 0));
}

function archiveNews(scopeKey, items) {
  const bucketKey = scopeKey === "global" ? "global" : "ticker";
  const current = bucketKey === "global" ? state.newsArchive.global : state.newsArchive.ticker[scopeKey] || [];
  const next = dedupeNews([...items.map((item) => ({ ...item, archiveScope: scopeKey })), ...current]).slice(0, 180);
  if (bucketKey === "global") {
    state.newsArchive.global = next;
  } else {
    state.newsArchive.ticker[scopeKey] = next;
  }
  persistNewsArchive();
}

function getArchiveItemsForView() {
  const currentTickerArchive = state.newsArchive.ticker[state.selectedSymbol] || [];
  const merged = dedupeNews([
    ...state.globalNews.map((item) => ({ ...item, archiveScope: "global" })),
    ...state.companyNews.map((item) => ({ ...item, archiveScope: state.selectedSymbol })),
    ...state.newsArchive.global,
    ...currentTickerArchive
  ]).map((item) => ({ ...item, archiveScopeLabel: item.archiveScope === "global" ? "Global" : `Ticker ${item.archiveScope}` }));
  return getFilteredNews(merged);
}

function buildFundamentalsSummary(payload, tab, period) {
  if (tab === "trends") {
    const trendRows = buildTrendRows(payload, period);
    const latestTrend = trendRows[0];
    return [
      createSummaryBlock("Trendmodus", periodLabel(period), `${trendRows.length} Kennzahlen mit Historie`, "is-neutral"),
      createSummaryBlock("Vergleich", latestTrend?.label || "Historie", latestTrend ? `${latestTrend.entries.length} Punkte` : "Keine Historie", latestTrend?.deltaClass || "is-neutral")
    ];
  }
  const metrics = getMetricsForTab(payload.metricCatalog || [], tab, period).slice(0, 4);
  if (!metrics.length) {
    return [createSummaryBlock("Hinweis", "Keine Daten", `Fuer ${tabLabel(tab)} und ${periodLabel(period)} liegen aktuell keine SEC-Kennzahlen vor.`, "is-neutral")];
  }
  return metrics.map((metric) => createSummaryBlock(metric.label, formatMetricValue(metric.value, metric.unit), `${metric.formLabel || metric.form} | ${metric.periodLabel}`, profitLossTone(metric, metric.value)));
}

function buildTrendCards(payload, period) {
  const rows = buildTrendRows(payload, period);
  if (!rows.length) return [createEmptyState(`Keine Trenddaten fuer ${periodLabel(period)} verfuegbar.`)];
  return rows.map((row) => {
    const card = document.createElement("article");
    card.className = "trend-card";
    const pills = row.entries.map((entry) => `<div class="trend-pill"><span>${entry.periodLabel}</span><strong class="${profitLossTone(row, entry.value)}">${formatMetricValue(entry.value, entry.unit)}</strong><small class="${toneClass(entry.delta)}">${formatTrendDelta(entry.delta, row.unit)}</small></div>`).join("");
    card.innerHTML = `<div class="trend-card__header"><div><span>${row.label}</span><strong class="${row.deltaClass}">${row.headline}</strong></div><small>${row.copy}</small></div><div class="trend-pill-grid">${pills}</div>`;
    return card;
  });
}

function buildTrendRows(payload, period) {
  if (period === "month") {
    const points = state.longRangeHistory.slice(-12).map((point, index, all) => ({
      periodLabel: monthLabel(point.time),
      value: point.price,
      unit: state.quotes.get(state.selectedSymbol)?.currency || "USD",
      delta: index === 0 ? null : point.price - all[index - 1].price
    }));
    return points.length ? [{
      label: "Schlusskurs",
      unit: points[0].unit,
      entries: [...points].reverse(),
      headline: formatMetricValue(points.at(-1)?.value, points[0].unit),
      copy: "Monatliche Schlusskurse der letzten 12 Monate",
      deltaClass: toneClass(points.at(-1)?.delta)
    }] : [];
  }
  return (payload.metricCatalog || []).map((metric) => {
    const entries = (metric.entries || []).filter((entry) => entry.periodType === period).slice(0, 10).map((entry, index, all) => ({ ...entry, delta: index + 1 < all.length ? entry.value - all[index + 1].value : null }));
    if (!entries.length) return null;
    return {
      label: metric.label,
      unit: entries[0].unit,
      entries,
      headline: formatMetricValue(entries[0].value, entries[0].unit),
      copy: `${entries.length} Vergleichspunkte bis zu ${period === "year" ? "10 Jahre" : "10 Quartale"}`,
      deltaClass: toneClass(entries[0].delta)
    };
  }).filter(Boolean);
}
function createSummaryBlock(title, value, copy, tone = "is-neutral") {
  const card = document.createElement("article");
  card.className = "summary-card";
  card.innerHTML = `<span>${title}</span><strong class="${tone}">${value}</strong><p class="source-note">${copy}</p>`;
  return card;
}

function createMetricCard(metric) {
  const card = document.createElement("article");
  card.className = "metric-card";
  card.innerHTML = `<span>${metric.label}</span><strong class="${profitLossTone(metric, metric.value)}">${formatMetricValue(metric.value, metric.unit)}</strong><small>${metric.formLabel || metric.form} | ${metric.periodLabel} | eingereicht ${formatDate(metric.filed)}</small>`;
  return card;
}

function createReleaseLink(release) {
  const link = document.createElement("a");
  link.className = "release-link";
  link.href = release.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.innerHTML = `<strong>${release.label}</strong><span>${release.note || "Direkter Link zur Quelle"}</span>`;
  return link;
}

function createFilingLink(filing) {
  const link = document.createElement("a");
  link.className = "filing-link";
  link.href = filing.url || filing.indexUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.innerHTML = `<div><strong>${filing.formLabel || filing.form}</strong><span>${filing.releaseType || "Unternehmensmeldung"}</span></div><span>${formatDate(filing.filed)}</span>`;
  return link;
}

function normalizeFundamentalsPayload(payload) {
  const groupedMetrics = new Map();
  (payload.metrics || []).forEach((metric) => {
    const key = metric.label;
    if (!groupedMetrics.has(key)) {
      groupedMetrics.set(key, { label: localizeMetricLabel(metric.label), rawLabel: metric.label, category: metricCategory(metric.label), entries: [] });
    }
    groupedMetrics.get(key).entries.push({ ...metric, formLabel: filingTypeLabel(metric.form), releaseType: filingReleaseType(metric.form), periodType: metric.form === "10-K" ? "year" : "quarter", periodLabel: metricPeriodLabel(metric) });
  });
  const metricCatalog = [...groupedMetrics.values()].map((group) => ({ ...group, entries: group.entries.sort((left, right) => new Date(right.filed || 0) - new Date(left.filed || 0)) }));
  return {
    ...payload,
    metricCatalog,
    filings: (payload.filings || []).map((filing) => ({ ...filing, formLabel: filingTypeLabel(filing.form), releaseType: filingReleaseType(filing.form) })),
    releases: (payload.releases || []).map((release) => ({ ...release, note: release.note || releaseLinkNote(release.label) }))
  };
}

function getMetricsForTab(catalog, tab, period) {
  const categoryMap = { overview: ["overview", "income", "cashflow", "balance"], income: ["income"], cashflow: ["cashflow"], balance: ["balance"], filings: [] };
  return catalog.filter((metric) => categoryMap[tab]?.includes(metric.category)).map((metric) => {
    const entry = (metric.entries || []).find((candidate) => candidate.periodType === period);
    return entry ? { ...entry, label: metric.label, category: metric.category } : null;
  }).filter(Boolean);
}

function getCompany(symbol) {
  return state.universe.find((item) => item.symbol === symbol);
}

function getFilteredUniverse() {
  return getUniverseByScope(state.activeUniverseFilter).filter((item) => !state.filter || `${item.symbol} ${item.name} ${item.sector}`.toLowerCase().includes(state.filter));
}

function getUniverseByScope(scope) {
  if (scope === "all") return state.universe;
  return state.universe.filter((item) => (item.universes || []).includes(scope) || inferUniverses(item).includes(scope));
}

function getSortedUniverse(items) {
  return items.map((company) => ({ ...company, ...state.quotes.get(company.symbol) })).sort((left, right) => (right.changePercent || -999) - (left.changePercent || -999));
}

function getHeatmapUniverse() {
  return getUniverseByScope(state.activeUniverseFilter)
    .filter((item) => item.assetClass === "equity")
    .map((company) => ({ ...company, ...state.quotes.get(company.symbol) }))
    .sort((left, right) => (right.marketCap || right.volume || 0) - (left.marketCap || left.volume || 0))
    .slice(0, 40);
}

function getMarketLinkedCompanies(market) {
  return state.universe.filter((item) => {
    if (market.key === "crypto") return item.assetClass === "crypto";
    const exchange = (item.exchange || "").toLowerCase();
    return exchange.includes(market.name.toLowerCase()) || item.country === market.country || item.region === market.country;
  });
}

function updateMarketClock() {
  const market = state.markets.find((item) => item.key === state.selectedMarket);
  if (!market) return;
  const formatter = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: market.timezone });
  elements.marketClock.textContent = `${market.name} ${formatter.format(new Date())}`;
}

function bindGlobeInteractions() {
  const svg = elements.globeSvg;
  let dragging = false;
  let last = null;
  svg.addEventListener("pointerdown", (event) => {
    dragging = true;
    last = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragging || !last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    state.globeRotation.lon += dx * 0.35;
    state.globeRotation.lat = clamp(state.globeRotation.lat - dy * 0.25, -65, 65);
    last = { x: event.clientX, y: event.clientY };
    renderGlobe();
  });
  svg.addEventListener("pointerup", () => {
    dragging = false;
    last = null;
  });
  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    state.globeScale = clamp(state.globeScale + (event.deltaY < 0 ? 0.08 : -0.08), 0.8, 1.8);
    renderGlobe();
  }, { passive: false });
}
function projectPoint(lat, lon) {
  const rotLon = state.globeRotation.lon * (Math.PI / 180);
  const rotLat = state.globeRotation.lat * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const lambda = lon * (Math.PI / 180);
  const cosc = Math.sin(rotLat) * Math.sin(phi) + Math.cos(rotLat) * Math.cos(phi) * Math.cos(lambda - rotLon);
  return {
    x: 210 + 112 * state.globeScale * Math.cos(phi) * Math.sin(lambda - rotLon),
    y: 150 - 112 * state.globeScale * (Math.cos(rotLat) * Math.sin(phi) - Math.sin(rotLat) * Math.cos(phi) * Math.cos(lambda - rotLon)),
    visible: cosc >= -0.08
  };
}

function getChartConfig(range) {
  return CHART_RANGE_CONFIG[range] || CHART_RANGE_CONFIG["1d"];
}

function getCompanyColor(company) {
  if (!company) return "#ff8f1f";
  if (COMPANY_COLOR_MAP[company.symbol]) return COMPANY_COLOR_MAP[company.symbol];
  const seed = [...company.symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hue = seed % 360;
  return `hsl(${hue} 78% 68%)`;
}

function getHeatmapSpans(weight) {
  if (weight > 0.82) return { col: 5, row: 4 };
  if (weight > 0.58) return { col: 4, row: 3 };
  if (weight > 0.35) return { col: 3, row: 3 };
  if (weight > 0.18) return { col: 3, row: 2 };
  return { col: 2, row: 2 };
}

function dedupeNews(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.id || `${item.title}|${item.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function createScopeButton(group, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.scope = group.key;
  button.className = `scope-chip ${isActive ? "is-active" : ""}`;
  button.textContent = group.label;
  return button;
}

function createMiniTile(label, value) {
  const tile = document.createElement("article");
  tile.className = "mini-tile";
  tile.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return tile;
}

function createEmptyState(text) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  return empty;
}

function htmlToNode(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function localizeMetricLabel(label) {
  const map = { Revenue: "Umsatz", "Net Income": "Nettoergebnis", "Operating Income": "Betriebsergebnis", "Diluted EPS": "Verwaessertes EPS", "Gross Profit": "Bruttoergebnis", "Operating Cash Flow": "Operativer Cashflow", "Cash & Equivalents": "Liquide Mittel", "Total Assets": "Gesamtvermoegen", "Total Liabilities": "Gesamtverbindlichkeiten", "Shareholders Equity": "Eigenkapital", "Free Cash Flow": "Free Cashflow", "Research & Development": "Forschung & Entwicklung", "Long-Term Debt": "Langfristige Schulden", "Cost of Revenue": "Umsatzkosten" };
  return map[label] || label;
}

function metricCategory(label) {
  const map = { Revenue: "income", "Net Income": "income", "Operating Income": "income", "Diluted EPS": "overview", "Gross Profit": "income", "Operating Cash Flow": "cashflow", "Cash & Equivalents": "balance", "Total Assets": "balance", "Total Liabilities": "balance", "Shareholders Equity": "balance", "Free Cash Flow": "cashflow", "Research & Development": "income", "Long-Term Debt": "balance", "Cost of Revenue": "income" };
  return map[label] || "overview";
}

function filingTypeLabel(form) {
  const map = { "10-Q": "Quartalsbericht (10-Q)", "10-K": "Jahresbericht (10-K)", "8-K": "Ad-hoc Unternehmensmeldung (8-K)" };
  return map[form] || form;
}

function filingReleaseType(form) {
  const map = { "10-Q": "Regulaerer Quartalsabschluss", "10-K": "Regulaerer Jahresabschluss", "8-K": "Wesentliche Unternehmensmeldung" };
  return map[form] || "Unternehmensmeldung";
}

function metricPeriodLabel(metric) {
  const fy = metric.fy ? `GJ ${metric.fy}` : "";
  const fp = metric.fp ? String(metric.fp) : "";
  return [fp, fy].filter(Boolean).join(" ") || formatDate(metric.end || metric.filed);
}

function releaseLinkNote(label) {
  const notes = { "SEC Company Page": "Alle offiziellen SEC-Unterlagen im Ueberblick", "Latest Quarterly Release": "Direkter Link zum juengsten Quartalsbericht", "Latest Annual Report": "Direkter Link zum juengsten Jahresbericht" };
  return notes[label] || "Direkter Link zur Quelle";
}

function inferUniverses(item) {
  const tags = [];
  if (item.exchange === "NASDAQ") tags.push("nasdaq100");
  if (item.country === "United States" && !["crypto", "commodity", "fx"].includes(item.assetClass)) tags.push("sp500");
  if (item.country === "United States" || ["Germany", "France", "Switzerland", "Denmark", "United Kingdom", "Canada", "Netherlands", "Ireland", "Australia", "Japan", "Spain"].includes(item.country)) tags.push("msciworld");
  if (item.country === "Germany") tags.push("dax");
  if (item.country === "France") tags.push("france", "eurostoxx");
  if (item.country === "Spain") tags.push("spain", "eurostoxx");
  if (item.country === "Japan") tags.push("japan");
  if (item.country === "China") tags.push("china");
  if (item.country === "Australia") tags.push("australia");
  if (item.country === "Canada") tags.push("canada");
  if (["fx", "commodity", "crypto"].includes(item.assetClass)) tags.push("macro");
  return [...new Set(tags)];
}

function assetLabel(item) {
  const map = { equity: "Aktie", fx: "FX", commodity: "Rohstoff", crypto: "Krypto" };
  return map[item.assetClass] || "Asset";
}

function labelUniverseKey(key) {
  const group = state.groups.find((item) => item.key === key);
  return group?.label || key;
}
function toneClass(value) {
  if (value > 0) return "is-positive";
  if (value < 0) return "is-negative";
  return "is-neutral";
}

function toneFromSummaryTitle(title, changePercent) {
  return ["Signal", "Schwaeche"].includes(title) ? toneClass(changePercent) : "is-neutral";
}

function profitLossTone(metric, value) {
  const label = (metric.label || "").toLowerCase();
  const sensitive = ["netto", "eps", "cashflow", "ergebnis", "schlusskurs", "price"];
  if (!sensitive.some((token) => label.includes(token))) return "is-neutral";
  if (value > 0) return "is-positive";
  if (value < 0) return "is-negative";
  return "is-neutral";
}

function formatSignal(value) {
  if (!Number.isFinite(value)) return "Awaiting quote";
  if (value > 2) return "Starker Aufwaertstrend";
  if (value > 0) return "Positiver Bias";
  if (value < -2) return "Deutlicher Abgabedruck";
  if (value < 0) return "Risk-off Ton";
  return "Seitwaerts";
}

function heatmapBackground(value) {
  const strength = Math.min(Math.abs(value || 0) / 6, 1);
  if ((value || 0) > 0) return `linear-gradient(180deg, rgba(61, 220, 151, ${0.2 + strength * 0.38}), rgba(7, 20, 18, 0.96))`;
  if ((value || 0) < 0) return `linear-gradient(180deg, rgba(255, 99, 125, ${0.2 + strength * 0.38}), rgba(24, 10, 15, 0.96))`;
  return "linear-gradient(180deg, rgba(82, 182, 255, 0.16), rgba(10, 18, 32, 0.94))";
}

function formatChartTimestamp(value) {
  const config = getChartConfig(state.chartRange);
  return new Intl.DateTimeFormat("de-DE", config.time ? { dateStyle: "medium", timeStyle: "short" } : { month: "short", year: "numeric" }).format(new Date(value));
}

function formatCurrency(value, currency = "USD") {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: value >= 100 ? 2 : 3 }).format(value);
}

function formatCompactCurrency(value, currency = "USD") {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatCompactNumber(value) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatDelta(change, percent) {
  if (!Number.isFinite(change) || !Number.isFinite(percent)) return "--";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function formatMetricValue(value, unit) {
  if (!Number.isFinite(value)) return "--";
  return (unit || "").toLowerCase().includes("usd") ? formatCompactCurrency(value, "USD") : new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatTrendDelta(value, unit) {
  if (!Number.isFinite(value)) return "Vergleich n/v";
  if ((unit || "").toLowerCase().includes("usd")) return `vs. Vorperiode ${value > 0 ? "+" : ""}${formatCompactCurrency(value, "USD")}`;
  return `vs. Vorperiode ${value > 0 ? "+" : ""}${new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function monthLabel(value) {
  return new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" }).format(new Date(value));
}

function periodLabel(period) {
  const map = { month: "Monat", quarter: "Quartal", year: "Jahr" };
  return map[period] || period;
}

function tabLabel(tab) {
  const map = { overview: "Ueberblick", income: "Ertrag", cashflow: "Cashflow", balance: "Bilanz", trends: "Trends", filings: "Veroeffentlichungen" };
  return map[tab] || tab;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function svgText(text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
  node.setAttribute("x", "50%");
  node.setAttribute("y", "50%");
  node.setAttribute("fill", "#8ea3bd");
  node.setAttribute("text-anchor", "middle");
  node.textContent = text;
  return node;
}

function hexToRgba(value, alpha) {
  if (value.startsWith("hsl")) return value;
  const hex = value.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const bigint = Number.parseInt(normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

renderTabs();
renderDetailTabs();
renderPortfolioTabs();
renderNewsSort();
init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<div class="shell"><div class="empty-state">Dashboard failed to load: ${error.message}</div></div>`;
});
