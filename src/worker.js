import { NASDAQ100, MARKET_CENTERS } from "./data/nasdaq100.js";
import { CROSS_MARKET_ADDITIONS, EXPANDED_MARKETS, UNIVERSE_GROUPS } from "./data/marketExpansions.js";

const CACHE_TTL_SECONDS = 30;
const DEFAULT_SYMBOLS = ["MSFT", "NVDA", "AAPL", "AMZN", "META"];
const MAX_SYMBOLS = 320;
const CHART_QUOTE_CONCURRENCY = 8;
const DEFAULT_CHART_RANGE = "1d";
const DEFAULT_CHART_INTERVAL = "5m";
const TEN_YEAR_LIMIT = 10;
const DEFAULT_NEWS_LIMIT = 36;
const NEWS_TRUST_MAP = {
  "reuters.com": 98,
  "bloomberg.com": 97,
  "wsj.com": 94,
  "ft.com": 94,
  "cnbc.com": 88,
  "finance.yahoo.com": 84,
  "marketwatch.com": 84,
  "investopedia.com": 78,
  "fool.com": 64,
  "benzinga.com": 60
};

const UNIVERSE = mergeUniverse([...NASDAQ100.map((item) => ({ ...item, assetClass: "equity", universes: ["nasdaq100", "sp500", "msciworld"] })), ...CROSS_MARKET_ADDITIONS]);
const MARKETS = mergeMarkets(MARKET_CENTERS, EXPANDED_MARKETS);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env, url) {
  const headers = corsHeaders();
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    if (url.pathname === "/api/universe") {
      return json({ asOf: "2026-03-22", items: UNIVERSE, groups: UNIVERSE_GROUPS }, headers);
    }
    if (url.pathname === "/api/markets") {
      return json({ items: MARKETS }, headers);
    }
    if (url.pathname === "/api/quotes") {
      return json(await getQuotes(parseSymbols(url.searchParams.get("symbols")), env), headers, CACHE_TTL_SECONDS);
    }
    if (url.pathname === "/api/chart") {
      const symbol = (url.searchParams.get("symbol") || "").toUpperCase();
      if (!symbol) {
        return json({ error: "Missing symbol" }, headers, 0, 400);
      }
      const range = url.searchParams.get("range") || DEFAULT_CHART_RANGE;
      const interval = url.searchParams.get("interval") || DEFAULT_CHART_INTERVAL;
      return json(await getChart(symbol, range, interval), headers, CACHE_TTL_SECONDS);
    }
    if (url.pathname === "/api/fundamentals") {
      const symbol = (url.searchParams.get("symbol") || "").toUpperCase();
      if (!symbol) {
        return json({ error: "Missing symbol" }, headers, 0, 400);
      }
      return json(await getFundamentals(symbol, env), headers, 21600);
    }
    if (url.pathname === "/api/news") {
      const symbol = (url.searchParams.get("symbol") || "").toUpperCase();
      const name = url.searchParams.get("name") || symbol;
      const mode = url.searchParams.get("mode") || (symbol ? "ticker" : "global");
      const limit = Number(url.searchParams.get("limit") || DEFAULT_NEWS_LIMIT);
      return json(await getNews(symbol, name, mode, limit), headers, 300);
    }
    if (url.pathname === "/api/auth/bootstrap") {
      return json({
        mode: "local-prep",
        sessionStorage: "browser-localstorage",
        plannedProviders: ["Email", "GitHub OAuth", "Cloudflare Access"],
        providers: [
          { key: "email", label: "E-Mail Login Vorbereitung", note: "Die Session wird fuer den Prototyp lokal gespeichert." },
          { key: "github", label: "GitHub OAuth Vorbereitung", note: "Fuer den naechsten Cloudflare/GitHub Schritt vorbereitet." }
        ]
      }, headers, 3600);
    }
    return json({ error: "Not found" }, headers, 0, 404);
  } catch (error) {
    return json({ error: "Upstream fetch failed", detail: error instanceof Error ? error.message : String(error) }, headers, 0, 502);
  }
}

function mergeUniverse(items) {
  const merged = new Map();
  for (const item of items) {
    const current = merged.get(item.symbol);
    if (current) {
      merged.set(item.symbol, { ...current, ...item, universes: [...new Set([...(current.universes || []), ...(item.universes || [])])] });
    } else {
      merged.set(item.symbol, item);
    }
  }
  return [...merged.values()];
}

function mergeMarkets(baseMarkets, extraMarkets) {
  const seen = new Set();
  return [...baseMarkets, ...extraMarkets].filter((market) => {
    if (seen.has(market.key)) {
      return false;
    }
    seen.add(market.key);
    return true;
  });
}

function parseSymbols(raw) {
  const symbols = (raw || "").split(",").map((value) => value.trim().toUpperCase()).filter(Boolean);
  return symbols.length ? symbols.slice(0, MAX_SYMBOLS) : DEFAULT_SYMBOLS;
}

async function getQuotes(symbols, env) {
  const provider = (env.QUOTE_PROVIDER || "yahoo").toLowerCase();
  if (provider === "finnhub" && env.FINNHUB_API_KEY) {
    return summarizeQuotePayload(provider, await Promise.all(symbols.map((symbol) => getFinnhubQuote(symbol, env.FINNHUB_API_KEY))));
  }
  if (provider === "twelvedata" && env.TWELVEDATA_API_KEY) {
    return summarizeQuotePayload(provider, await Promise.all(symbols.map((symbol) => getTwelveDataQuote(symbol, env.TWELVEDATA_API_KEY))));
  }
  return summarizeQuotePayload("yahoo", await getYahooQuotes(symbols));
}

function summarizeQuotePayload(provider, items) {
  const sourceSet = [...new Set(items.map((item) => item.source).filter(Boolean))];
  return { provider, sourceSummary: sourceSet.join(" + ") || provider, items };
}

const V7_BATCH_SIZE = 50;

async function getYahooQuotes(symbols) {
  // Split into parallel v7 batches of 50 — covers all symbols with ~4 requests
  const batches = [];
  for (let i = 0; i < symbols.length; i += V7_BATCH_SIZE) {
    batches.push(symbols.slice(i, i + V7_BATCH_SIZE));
  }
  const batchResults = await Promise.all(batches.map((batch) => fetchV7Batch(batch)));
  const v7Items = batchResults.flat();

  const covered = new Set(v7Items.map((item) => item.symbol));
  const missing = symbols.filter((s) => !covered.has(s));
  if (missing.length === 0) return v7Items;
  // Chart fallback for all symbols v7 missed — DEFAULT_SYMBOLS first for priority
  const prioritized = [...new Set([...DEFAULT_SYMBOLS.filter((s) => missing.includes(s)), ...missing])];
  const fallback = await getYahooChartQuotes(prioritized);
  return [...v7Items, ...fallback];
}

async function fetchV7Batch(symbols) {
  try {
    const endpoint = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
    endpoint.searchParams.set("symbols", symbols.join(","));
    const response = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.quoteResponse?.result || []).map((item) => normalizeQuote({
      symbol: item.symbol,
      price: item.regularMarketPrice,
      change: item.regularMarketChange,
      changePercent: item.regularMarketChangePercent,
      open: item.regularMarketOpen,
      high: item.regularMarketDayHigh,
      low: item.regularMarketDayLow,
      previousClose: item.regularMarketPreviousClose,
      volume: item.regularMarketVolume,
      marketCap: item.marketCap,
      currency: item.currency || inferCurrency(item.symbol),
      exchange: item.fullExchangeName || item.exchange,
      marketState: item.marketState,
      shortName: item.shortName,
      source: "Yahoo Finance unofficial"
    }));
  } catch {
    return [];
  }
}

async function getYahooChartQuotes(symbols) {
  const items = [];
  for (let index = 0; index < symbols.length; index += CHART_QUOTE_CONCURRENCY) {
    const batch = symbols.slice(index, index + CHART_QUOTE_CONCURRENCY);
    const results = await Promise.all(batch.map((symbol) => getYahooChartQuote(symbol)));
    items.push(...results.filter(Boolean));
  }
  return items;
}

async function getYahooChartQuote(symbol) {
  try {
    const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
    endpoint.searchParams.set("range", "1d");
    endpoint.searchParams.set("interval", "5m");
    endpoint.searchParams.set("includePrePost", "true");
    const response = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return null;
    const payload = await response.json();
    return normalizeChartQuote(symbol, payload.chart?.result?.[0]);
  } catch {
    return null;
  }
}

function normalizeChartQuote(symbol, result) {
  const meta = result?.meta || {};
  const quote = result?.indicators?.quote?.[0] || {};
  const closes = (quote.close || []).filter(isNumber);
  const highs = (quote.high || []).filter(isNumber);
  const lows = (quote.low || []).filter(isNumber);
  const opens = (quote.open || []).filter(isNumber);
  const volumes = (quote.volume || []).filter(isNumber);
  const price = isNumber(meta.regularMarketPrice) ? meta.regularMarketPrice : closes.at(-1) ?? null;
  const previousClose = isNumber(meta.previousClose) ? meta.previousClose : null;
  const sharesOutstanding = toNumber(meta.sharesOutstanding);
  return normalizeQuote({
    symbol,
    price,
    change: isNumber(price) && isNumber(previousClose) ? price - previousClose : null,
    changePercent: isNumber(price) && isNumber(previousClose) && previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : null,
    open: isNumber(meta.regularMarketOpen) ? meta.regularMarketOpen : opens[0] ?? null,
    high: isNumber(meta.regularMarketDayHigh) ? meta.regularMarketDayHigh : maxOrNull(highs),
    low: isNumber(meta.regularMarketDayLow) ? meta.regularMarketDayLow : minOrNull(lows),
    previousClose,
    volume: isNumber(meta.regularMarketVolume) ? meta.regularMarketVolume : sumOrNull(volumes),
    marketCap: isNumber(sharesOutstanding) && isNumber(price) ? sharesOutstanding * price : null,
    currency: meta.currency || inferCurrency(symbol),
    exchange: normalizeExchangeName(meta.exchangeName || meta.fullExchangeName || meta.exchangeTimezoneName || inferExchange(symbol)),
    marketState: meta.marketState,
    shortName: meta.shortName || meta.instrumentType || symbol,
    source: "Yahoo Finance chart fallback"
  });
}

async function getFinnhubQuote(symbol, apiKey) {
  const endpoint = new URL("https://finnhub.io/api/v1/quote");
  endpoint.searchParams.set("symbol", symbol);
  endpoint.searchParams.set("token", apiKey);
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Finnhub quote endpoint returned ${response.status}`);
  }
  const payload = await response.json();
  return normalizeQuote({ symbol, price: payload.c, change: payload.d, changePercent: payload.dp, high: payload.h, low: payload.l, open: payload.o, previousClose: payload.pc, source: "Finnhub" });
}

async function getTwelveDataQuote(symbol, apiKey) {
  const endpoint = new URL("https://api.twelvedata.com/quote");
  endpoint.searchParams.set("symbol", symbol);
  endpoint.searchParams.set("apikey", apiKey);
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Twelve Data quote endpoint returned ${response.status}`);
  }
  const payload = await response.json();
  return normalizeQuote({ symbol, price: toNumber(payload.close), change: toNumber(payload.change), changePercent: toNumber(payload.percent_change), high: toNumber(payload.high), low: toNumber(payload.low), open: toNumber(payload.open), previousClose: toNumber(payload.previous_close), volume: toNumber(payload.volume), marketCap: toNumber(payload.market_cap), exchange: payload.exchange, shortName: payload.name, currency: payload.currency || inferCurrency(symbol), source: "Twelve Data" });
}

async function getChart(symbol, range, interval) {
  const endpoint = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  endpoint.searchParams.set("range", range);
  endpoint.searchParams.set("interval", interval);
  endpoint.searchParams.set("includePrePost", "true");
  const response = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) {
    throw new Error(`Yahoo chart endpoint returned ${response.status}`);
  }
  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const prices = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps.map((timestamp, index) => ({ time: timestamp * 1000, price: prices[index] })).filter((point) => isNumber(point.price));
  return { symbol, range, interval, points };
}

async function getFundamentals(symbol, env) {
  const asset = UNIVERSE.find((item) => item.symbol === symbol);
  if (asset?.assetClass && asset.assetClass !== "equity") {
    return { symbol, source: "Market data only", metrics: [], filings: [], releases: [], available: false, reason: "Fundamentals sind fuer Nicht-Aktien nicht verfuegbar." };
  }

  const userAgent = env.SEC_USER_AGENT || "BoersenTerminalPrototype/0.1 hello@example.com";
  const mappingResponse = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: { "User-Agent": userAgent, Accept: "application/json" } });
  if (!mappingResponse.ok) {
    throw new Error(`SEC ticker map returned ${mappingResponse.status}`);
  }
  const mapping = await mappingResponse.json();
  const match = Object.values(mapping).find((item) => item.ticker === symbol);
  if (!match) {
    return { symbol, source: "SEC EDGAR", metrics: [], filings: [], releases: [], available: false, reason: "Keine SEC-Unterlagen fuer dieses Symbol gefunden." };
  }

  const cik = String(match.cik_str).padStart(10, "0");
  const [companyFactsResponse, submissionsResponse] = await Promise.all([
    fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: { "User-Agent": userAgent, Accept: "application/json" } }),
    fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: { "User-Agent": userAgent, Accept: "application/json" } })
  ]);
  if (!companyFactsResponse.ok) {
    throw new Error(`SEC companyfacts returned ${companyFactsResponse.status}`);
  }
  if (!submissionsResponse.ok) {
    throw new Error(`SEC submissions returned ${submissionsResponse.status}`);
  }

  const companyFacts = await companyFactsResponse.json();
  const submissions = await submissionsResponse.json();
  return {
    symbol,
    companyName: companyFacts.entityName || match.title,
    cik,
    source: "SEC EDGAR Company Facts + Submissions",
    metrics: extractMetrics(companyFacts),
    filings: extractFilings(submissions),
    releases: extractReleaseLinks(submissions),
    available: true
  };
}

function extractMetrics(companyFacts) {
  const taxonomy = companyFacts.facts?.["us-gaap"] || {};
  const metricMap = [
    ["Revenue", [taxonomy.RevenueFromContractWithCustomerExcludingAssessedTax, taxonomy.SalesRevenueNet, taxonomy.Revenues]],
    ["Net Income", [taxonomy.NetIncomeLoss]],
    ["Operating Income", [taxonomy.OperatingIncomeLoss]],
    ["Diluted EPS", [taxonomy.EarningsPerShareDiluted]],
    ["Gross Profit", [taxonomy.GrossProfit]],
    ["Operating Cash Flow", [taxonomy.NetCashProvidedByUsedInOperatingActivities, taxonomy.NetCashProvidedByUsedInOperatingActivitiesContinuingOperations]],
    ["Cash & Equivalents", [taxonomy.CashAndCashEquivalentsAtCarryingValue]],
    ["Total Assets", [taxonomy.Assets]],
    ["Total Liabilities", [taxonomy.Liabilities]],
    ["Shareholders Equity", [taxonomy.StockholdersEquity, taxonomy.StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest]],
    ["Free Cash Flow", [taxonomy.FreeCashFlow]],
    ["Research & Development", [taxonomy.ResearchAndDevelopmentExpense]],
    ["Long-Term Debt", [taxonomy.LongTermDebtAndCapitalLeaseObligations, taxonomy.LongTermDebtNoncurrent]],
    ["Cost of Revenue", [taxonomy.CostOfGoodsSold, taxonomy.CostOfRevenue]]
  ];

  return metricMap.flatMap(([label, nodes]) => {
    const unitEntries = nodes.flatMap((node) => Object.values(node?.units || {}).flat())
      .filter((entry) => (entry.form === "10-Q" || entry.form === "10-K") && isNumber(toNumber(entry.val)))
      .sort(compareMetricEntries);

    const quarterly = dedupeMetricEntries(unitEntries.filter((entry) => entry.form === "10-Q")).slice(0, TEN_YEAR_LIMIT);
    const yearly = dedupeMetricEntries(unitEntries.filter((entry) => entry.form === "10-K")).slice(0, TEN_YEAR_LIMIT);

    return [...quarterly, ...yearly].map((entry) => ({
      label,
      value: toNumber(entry.val),
      unit: entry.uom || entry.frame || "USD",
      form: entry.form,
      fy: entry.fy,
      fp: entry.fp,
      filed: entry.filed,
      end: entry.end
    }));
  });
}

function dedupeMetricEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = [entry.form, entry.fy, entry.fp, entry.end, entry.filed].join("|");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function extractFilings(submissions) {
  const recent = submissions.filings?.recent;
  if (!recent) {
    return [];
  }
  return recent.form.map((form, index) => ({
    form,
    filed: recent.filingDate[index],
    accessionNumber: recent.accessionNumber[index],
    primaryDocument: recent.primaryDocument[index]
  })).filter((filing) => ["10-Q", "10-K", "8-K"].includes(filing.form)).slice(0, 12).map((filing) => ({
    ...filing,
    url: filingDocumentUrl(submissions.cik, filing.accessionNumber, filing.primaryDocument),
    indexUrl: filingIndexUrl(submissions.cik, filing.accessionNumber)
  }));
}

function extractReleaseLinks(submissions) {
  const filings = extractFilings(submissions);
  const latestQuarterly = filings.find((filing) => filing.form === "10-Q");
  const latestAnnual = filings.find((filing) => filing.form === "10-K");
  return [
    { label: "SEC Company Page", url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${Number(submissions.cik)}&owner=exclude&count=40` },
    latestQuarterly ? { label: "Latest Quarterly Release", url: latestQuarterly.url } : null,
    latestAnnual ? { label: "Latest Annual Report", url: latestAnnual.url } : null
  ].filter(Boolean);
}

async function getNews(symbol, name, mode, limit = DEFAULT_NEWS_LIMIT) {
  const query = mode === "global"
    ? '(stock market OR earnings OR inflation OR rates OR guidance) when:30d'
    : `("${symbol}" OR "${name}") (earnings OR revenue OR guidance OR margin OR outlook OR stock) when:30d`;
  const endpoint = new URL("https://news.google.com/rss/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("hl", "en-US");
  endpoint.searchParams.set("gl", "US");
  endpoint.searchParams.set("ceid", "US:en");
  const response = await fetch(endpoint, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) {
    throw new Error(`News feed returned ${response.status}`);
  }
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map((match) => parseNewsItem(match[1], { symbol, name, mode }))
    .filter(Boolean)
    .sort((left, right) => (right.relevanceScore || 0) - (left.relevanceScore || 0))
    .slice(0, Math.max(1, Math.min(limit, 60)));
  return { mode, symbol, items, source: "Google News RSS" };
}

function parseNewsItem(chunk, context) {
  const title = decodeXml(readXmlTag(chunk, "title"));
  const link = decodeXml(readXmlTag(chunk, "link"));
  const publishedAt = readXmlTag(chunk, "pubDate");
  const source = decodeXml(readXmlTag(chunk, "source"));
  if (!title || !link) {
    return null;
  }
  const hostname = hostnameFromUrl(link);
  const trustScore = trustScoreForSource(hostname, source || hostname);
  const impactScore = impactScoreForTitle(title, context);
  const recencyScore = recencyScoreForDate(publishedAt);
  return {
    id: stableNewsId(title, link),
    title,
    link,
    publishedAt,
    source: source || hostname,
    hostname,
    trustScore,
    impactScore,
    recencyScore,
    relevanceScore: trustScore * 0.45 + impactScore * 0.4 + recencyScore * 0.15,
    keywords: title.toLowerCase()
  };
}

function readXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function stableNewsId(title, link) {
  return `${title}::${link}`;
}

function trustScoreForSource(hostname, sourceLabel = "") {
  const normalizedHost = (hostname || "").replace(/^www\./, "");
  const normalizedSource = String(sourceLabel || "").toLowerCase();
  if (NEWS_TRUST_MAP[normalizedHost]) {
    return NEWS_TRUST_MAP[normalizedHost];
  }
  const sourceMap = {
    reuters: 98,
    bloomberg: 97,
    barron: 90,
    cnbc: 88,
    yahoo: 84,
    marketwatch: 84,
    investopedia: 78,
    morningstar: 78,
    fool: 64,
    benzinga: 60,
    axios: 74,
    fortune: 72,
    pbs: 70,
    nyse: 82,
    aljazeera: 68,
    financial: 94
  };
  const match = Object.entries(sourceMap).find(([token]) => normalizedSource.includes(token));
  return match ? match[1] : 52;
}

function impactScoreForTitle(title, context) {
  const normalized = title.toLowerCase();
  const highImpactTerms = ["earnings", "revenue", "guidance", "margin", "profit", "forecast", "outlook", "results", "quarter", "annual", "sales", "cash flow"];
  const companyTerms = [context.symbol, context.name].filter(Boolean).map((value) => String(value).toLowerCase());
  let score = highImpactTerms.reduce((sum, term) => sum + (normalized.includes(term) ? 8 : 0), 18);
  score += companyTerms.reduce((sum, term) => sum + (normalized.includes(term) ? 10 : 0), 0);
  if (context.mode === "ticker") {
    score += 12;
  }
  return Math.min(score, 100);
}

function recencyScoreForDate(value) {
  const ageHours = Math.max(0, (Date.now() - new Date(value || 0).getTime()) / 3600000);
  return Math.max(0, 100 - ageHours * 3.2);
}
function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Quelle";
  }
}

function filingDocumentUrl(cik, accessionNumber, primaryDocument) {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${primaryDocument}`;
}

function filingIndexUrl(cik, accessionNumber) {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${accessionNumber}-index.htm`;
}

function normalizeQuote(item) {
  const normalized = {
    symbol: item.symbol,
    price: toNumber(item.price),
    change: toNumber(item.change),
    changePercent: toNumber(item.changePercent),
    open: toNumber(item.open),
    high: toNumber(item.high),
    low: toNumber(item.low),
    previousClose: toNumber(item.previousClose),
    volume: toNumber(item.volume),
    marketCap: sanitizePositiveNumber(item.marketCap),
    currency: item.currency || inferCurrency(item.symbol),
    exchange: normalizeExchangeName(item.exchange),
    marketState: item.marketState || null,
    shortName: item.shortName || item.symbol,
    source: item.source || "Unknown"
  };
  if (!isNumber(normalized.change) && isNumber(normalized.price) && isNumber(normalized.previousClose)) {
    normalized.change = normalized.price - normalized.previousClose;
  }
  if (!isNumber(normalized.changePercent) && isNumber(normalized.change) && isNumber(normalized.previousClose) && normalized.previousClose !== 0) {
    normalized.changePercent = (normalized.change / normalized.previousClose) * 100;
  }
  return normalized;
}

function inferCurrency(symbol) {
  if (symbol.endsWith(".DE") || symbol.endsWith(".PA") || symbol.endsWith(".CO")) {
    return "EUR";
  }
  if (symbol.endsWith(".SW")) {
    return "CHF";
  }
  if (symbol.endsWith(".L")) {
    return "GBP";
  }
  return symbol === "EURUSD=X" ? "USD" : "USD";
}

function inferExchange(symbol) {
  if (symbol.endsWith(".DE")) {
    return "XETRA";
  }
  if (symbol.endsWith(".PA")) {
    return "Euronext Paris";
  }
  if (symbol.endsWith(".SW")) {
    return "SIX";
  }
  if (symbol.endsWith(".L")) {
    return "LSE";
  }
  if (symbol.endsWith(".CO")) {
    return "CPH";
  }
  if (symbol === "EURUSD=X") {
    return "FX";
  }
  if (symbol.endsWith("=F")) {
    return "COMEX";
  }
  if (symbol === "BTC-USD") {
    return "Crypto";
  }
  return "NASDAQ";
}

function sanitizePositiveNumber(value) {
  const parsed = toNumber(value);
  return isNumber(parsed) && parsed > 0 ? parsed : null;
}

function normalizeExchangeName(value) {
  const raw = (value || "").trim();
  const map = { NMS: "NASDAQ", NGM: "NASDAQ Global Market", NCM: "NASDAQ Capital Market", NYQ: "NYSE", PCX: "NYSE Arca", FX: "FX", COMEX: "COMEX" };
  return map[raw] || raw || "NASDAQ";
}

function compareMetricEntries(left, right) {
  return compareDatesDesc(left.filed, right.filed) || compareDatesDesc(left.end, right.end) || compareValuesDesc(left.fy, right.fy);
}

function maxOrNull(values) {
  return values.length ? Math.max(...values) : null;
}

function minOrNull(values) {
  return values.length ? Math.min(...values) : null;
}

function sumOrNull(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function compareDatesDesc(left, right) {
  return new Date(right || 0) - new Date(left || 0);
}

function compareValuesDesc(left, right) {
  return Number(right || 0) - Number(left || 0);
}

function json(payload, headers, ttl = 0, status = 200) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", ttl ? `public, max-age=${ttl}` : "no-store");
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isNumber(value) {
  return Number.isFinite(value);
}






