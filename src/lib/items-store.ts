import fs from "fs";
import path from "path";

export type ItemType = "STRATEGY" | "COURSE" | "WEBINAR";

export interface ItemRecord {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  price: number;
  traderId: string;
  traderName: string;
  createdAt: string;
  updatedAt: string;

  // Strategy Specific (Strategy :: Item)
  strategyId?: string; // unique string identifier, e.g. STRAT-NVDA-QUANT
  ntfyTopic?: string; // secret ntfy topic name, e.g. 360m_strat_nvda_quant_882
  signalsCount?: number;
  activeSubscribers?: number;

  // Course Specific (Course :: Item)
  slug?: string;
  category?: string;
  level?: string;
  thumbnail?: string;
  enrolledCount?: number;

  // Webinar Specific (Webinar :: Item)
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  meetingUrl?: string;
  maxAttendees?: number;
  filledSeats?: number;
}

export interface StrategySignalRecord {
  id: string; // e.g. S0, S1, S2...
  strategyId: string;
  strategyName: string;
  traderId: string;
  traderName: string;
  signalText: string;
  symbol?: string;
  action?: "BUY" | "SELL" | "HOLD" | "ALERT";
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  riskReward?: string;
  timeframe?: string;
  notes?: string;
  ntfyTopic: string;
  ntfyStatus: "SENT" | "DELIVERED" | "FAILED";
  timestamp: string; // ISO String
}

export interface AccessCodeRecord {
  id: string;
  code: string; // e.g. 360-NVDA-X921
  itemId: string;
  itemName: string;
  itemType: ItemType;
  itemPrice: number;
  traderId: string;
  traderName: string;
  isRedeemed: boolean;
  maxUses: 1; // Strict single-use requirement
  usedCount: 0 | 1;
  redeemedByUserId?: string;
  redeemedByUserEmail?: string;
  redeemedAt?: string;
  invoiceId?: string;
  status: "UNUSED" | "REDEEMED" | "REVOKED";
  createdAt: string;
}

export interface InvoiceRecord {
  id: string; // e.g. INV-2026-00101
  invoiceNumber: string; // e.g. 360M-INV-84920
  accessCode: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  itemPrice: number;
  traderId: string;
  traderName: string;
  subscriberId: string;
  subscriberEmail: string;
  redeemedAt: string;
  platformFeeRate: number; // e.g. 0.20 (20%)
  platformFee: number;
  traderNet: number;
  debtAmount: number; // Debt put on trader's account for redemption
  debtStatus: "UNSETTLED" | "SETTLED";
}

const DATA_DIR = path.join(process.cwd(), "data");
const ITEMS_FILE = path.join(DATA_DIR, "items.json");
const SIGNALS_FILE = path.join(DATA_DIR, "strategy-signals.json");
const ACCESS_CODES_FILE = path.join(DATA_DIR, "access-codes.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// DEFAULT SEED DATA
// ---------------------------------------------------------------------------

const DEFAULT_ITEMS: ItemRecord[] = [
  {
    id: "item-strat-001",
    type: "STRATEGY",
    name: "NVDA Institutional Volatility Breakout",
    description: "Multi-timeframe quantitative breakout strategy utilizing dark pool block volume and options delta skew.",
    price: 299,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    strategyId: "STRAT-NVDA-QUANT",
    ntfyTopic: "360m_strat_nvda_quant_882",
    signalsCount: 16,
    activeSubscribers: 42,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "item-strat-002",
    type: "STRATEGY",
    name: "US Large-Cap Momentum & Gamma Scalper",
    description: "Algorithmic trend following across NASDAQ-100 equities with dynamic ATR stop-loss positioning.",
    price: 399,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    strategyId: "STRAT-TECH-ALPHA",
    ntfyTopic: "360m_strat_tech_alpha_419",
    signalsCount: 9,
    activeSubscribers: 28,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "item-course-001",
    type: "COURSE",
    name: "Stocks: the beginning to the end",
    description: "From order book microstructures to institutional portfolio rebalancing. The comprehensive equity masterclass.",
    price: 499,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    slug: "stocks-the-beginning-to-the-end",
    category: "Quantitative Equities",
    level: "All Levels",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    enrolledCount: 124,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "item-webinar-001",
    type: "WEBINAR",
    name: "Institutional Order Flow & Gamma Scalping Live Workshop",
    description: "Live 2-hour interactive breakdown of institutional order book positioning, VWAP bands, and gamma levels.",
    price: 149,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    date: "2026-10-25",
    startTime: "18:00 UTC",
    durationMinutes: 120,
    meetingUrl: "https://meet.google.com/qmv-mkpt-xyz",
    maxAttendees: 100,
    filledSeats: 64,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SIGNALS: StrategySignalRecord[] = [
  {
    id: "S0",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "BUY NVDA @ $128.50 | Target $145.00 | SL $122.00. 4H chart breakout confirmation with 2.8x volume surge.",
    symbol: "NVDA",
    action: "BUY",
    entryPrice: 128.50,
    targetPrice: 145.00,
    stopLoss: 122.00,
    riskReward: "1 : 2.54",
    timeframe: "4H / SWING",
    notes: "Consolidation breakout confirmed on 4-hour chart. Dark pool order flow shows heavy support at $127.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // ~1 hour ago
  },
  {
    id: "S1",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "NVDA Target 1 Hit ($135.50). Raise trailing stop to breakeven ($128.50). Lock in 50% profits.",
    symbol: "NVDA",
    action: "ALERT",
    entryPrice: 128.50,
    targetPrice: 145.00,
    stopLoss: 128.50,
    riskReward: "1 : 2.54",
    timeframe: "4H / SWING",
    notes: "Target 1 reached. Protecting initial capital by moving stop loss to entry.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
  },
  {
    id: "S2",
    strategyId: "STRAT-TECH-ALPHA",
    strategyName: "US Large-Cap Momentum & Gamma Scalper",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "BUY TSLA @ $245.00 | Target $280.00 | SL $234.00. Options gamma squeeze potential ahead of robotaxi updates.",
    symbol: "TSLA",
    action: "BUY",
    entryPrice: 245.00,
    targetPrice: 280.00,
    stopLoss: 234.00,
    riskReward: "1 : 3.18",
    timeframe: "SWING",
    notes: "Call wall shift higher to $280 strike. Gamma profile indicates strong upward squeeze probability.",
    ntfyTopic: "360m_strat_tech_alpha_419",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago (past 24h!)
  },
  {
    id: "S3",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "BUY 00700.HK @ 382.00 | Target 425.00 | SL 368.00. Southbound fund inflow acceleration.",
    symbol: "00700.HK",
    action: "BUY",
    entryPrice: 382.00,
    targetPrice: 425.00,
    stopLoss: 368.00,
    riskReward: "1 : 3.07",
    timeframe: "POSITION",
    notes: "Southbound fund inflow acceleration. Retesting 50-day EMA support with decreasing volume on pullbacks.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago (past week!)
  },
  {
    id: "S4",
    strategyId: "STRAT-TECH-ALPHA",
    strategyName: "US Large-Cap Momentum & Gamma Scalper",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "BUY AAPL @ $224.00 | Target $238.00 | SL $218.00. Volume profile bounce from value area low.",
    symbol: "AAPL",
    action: "BUY",
    entryPrice: 224.00,
    targetPrice: 238.00,
    stopLoss: 218.00,
    riskReward: "1 : 2.33",
    timeframe: "INTRADAY",
    notes: "Clean bounce off the daily POC with institutional bid volume supporting $223.50.",
    ntfyTopic: "360m_strat_tech_alpha_419",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago (past week!)
  },
  {
    id: "S5",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "STOPPED OUT: AMD @ $148.00. Market-wide semiconductor pullback hit stop loss. Preserving risk unit.",
    symbol: "AMD",
    action: "ALERT",
    entryPrice: 154.00,
    targetPrice: 172.00,
    stopLoss: 148.00,
    riskReward: "1 : 3.00",
    timeframe: "SWING",
    notes: "Controlled stop loss executed according to risk parameters. Loss: -3.89%.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 130).toISOString(), // 5.5 days ago (past week!)
  },
  {
    id: "S6",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "BUY MSFT @ $415.00 | Target $440.00 | SL $402.00. Cloud enterprise re-acceleration confirmation.",
    symbol: "MSFT",
    action: "BUY",
    entryPrice: 415.00,
    targetPrice: 440.00,
    stopLoss: 402.00,
    riskReward: "1 : 2.25",
    timeframe: "SWING",
    notes: "Enterprise cloud contract pipeline strength reported. Break above 20-day moving average.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago (past month!)
  },
  {
    id: "S7",
    strategyId: "STRAT-NVDA-QUANT",
    strategyName: "NVDA Institutional Volatility Breakout",
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    signalText: "MSFT FULL TARGET REACHED @ $440.00! +6.02% Gain. Strategy closed with 100% win realization.",
    symbol: "MSFT",
    action: "ALERT",
    entryPrice: 415.00,
    targetPrice: 440.00,
    stopLoss: 402.00,
    riskReward: "1 : 2.25",
    timeframe: "SWING",
    notes: "Final target reached on high volume. Trade completed successfully.",
    ntfyTopic: "360m_strat_nvda_quant_882",
    ntfyStatus: "SENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago (past month!)
  },
];

const DEFAULT_ACCESS_CODES: AccessCodeRecord[] = [
  {
    id: "code-001",
    code: "360-NVDA-X921",
    itemId: "item-strat-001",
    itemName: "NVDA Institutional Volatility Breakout",
    itemType: "STRATEGY",
    itemPrice: 299,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: false,
    maxUses: 1,
    usedCount: 0,
    status: "UNUSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "code-002",
    code: "360-NVDA-K742",
    itemId: "item-strat-001",
    itemName: "NVDA Institutional Volatility Breakout",
    itemType: "STRATEGY",
    itemPrice: 299,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: true,
    maxUses: 1,
    usedCount: 1,
    redeemedByUserId: "user-palash-demo",
    redeemedByUserEmail: "palash@investor.io",
    redeemedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    invoiceId: "INV-2026-00101",
    status: "REDEEMED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "code-003",
    code: "360-TECH-M881",
    itemId: "item-strat-002",
    itemName: "US Large-Cap Momentum & Gamma Scalper",
    itemType: "STRATEGY",
    itemPrice: 399,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: false,
    maxUses: 1,
    usedCount: 0,
    status: "UNUSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "code-004",
    code: "360-STK-P301",
    itemId: "item-course-001",
    itemName: "Stocks: the beginning to the end",
    itemType: "COURSE",
    itemPrice: 499,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: false,
    maxUses: 1,
    usedCount: 0,
    status: "UNUSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "code-005",
    code: "360-STK-Q552",
    itemId: "item-course-001",
    itemName: "Stocks: the beginning to the end",
    itemType: "COURSE",
    itemPrice: 499,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: true,
    maxUses: 1,
    usedCount: 1,
    redeemedByUserId: "user-palash-demo",
    redeemedByUserEmail: "palash@investor.io",
    redeemedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    invoiceId: "INV-2026-00102",
    status: "REDEEMED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "code-006",
    code: "360-WEB-W108",
    itemId: "item-webinar-001",
    itemName: "Institutional Order Flow & Gamma Scalping Live Workshop",
    itemType: "WEBINAR",
    itemPrice: 149,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    isRedeemed: false,
    maxUses: 1,
    usedCount: 0,
    status: "UNUSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

const DEFAULT_INVOICES: InvoiceRecord[] = [
  {
    id: "INV-2026-00101",
    invoiceNumber: "360M-INV-84920",
    accessCode: "360-NVDA-K742",
    itemId: "item-strat-001",
    itemName: "NVDA Institutional Volatility Breakout",
    itemType: "STRATEGY",
    itemPrice: 299,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    subscriberId: "user-palash-demo",
    subscriberEmail: "palash@investor.io",
    redeemedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    platformFeeRate: 0.20,
    platformFee: 59.80,
    traderNet: 239.20,
    debtAmount: 59.80,
    debtStatus: "UNSETTLED",
  },
  {
    id: "INV-2026-00102",
    invoiceNumber: "360M-INV-84921",
    accessCode: "360-STK-Q552",
    itemId: "item-course-001",
    itemName: "Stocks: the beginning to the end",
    itemType: "COURSE",
    itemPrice: 499,
    traderId: "user-alex-demo",
    traderName: "Alex Morgan",
    subscriberId: "user-palash-demo",
    subscriberEmail: "palash@investor.io",
    redeemedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    platformFeeRate: 0.20,
    platformFee: 99.80,
    traderNet: 399.20,
    debtAmount: 99.80,
    debtStatus: "UNSETTLED",
  },
];

// ---------------------------------------------------------------------------
// STORAGE HELPERS
// ---------------------------------------------------------------------------

function loadItems(): ItemRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ITEMS_FILE)) {
      return JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));
    }
  } catch (e) {}
  saveItems(DEFAULT_ITEMS);
  return DEFAULT_ITEMS;
}

function saveItems(items: ItemRecord[]) {
  ensureDataDir();
  fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), "utf-8");
}

function loadSignals(): StrategySignalRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(SIGNALS_FILE)) {
      return JSON.parse(fs.readFileSync(SIGNALS_FILE, "utf-8"));
    }
  } catch (e) {}
  saveSignals(DEFAULT_SIGNALS);
  return DEFAULT_SIGNALS;
}

function saveSignals(signals: StrategySignalRecord[]) {
  ensureDataDir();
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2), "utf-8");
}

function loadAccessCodes(): AccessCodeRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ACCESS_CODES_FILE)) {
      return JSON.parse(fs.readFileSync(ACCESS_CODES_FILE, "utf-8"));
    }
  } catch (e) {}
  saveAccessCodes(DEFAULT_ACCESS_CODES);
  return DEFAULT_ACCESS_CODES;
}

function saveAccessCodes(codes: AccessCodeRecord[]) {
  ensureDataDir();
  fs.writeFileSync(ACCESS_CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
}

function loadInvoices(): InvoiceRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      return JSON.parse(fs.readFileSync(INVOICES_FILE, "utf-8"));
    }
  } catch (e) {}
  saveInvoices(DEFAULT_INVOICES);
  return DEFAULT_INVOICES;
}

function saveInvoices(invoices: InvoiceRecord[]) {
  ensureDataDir();
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// ITEM CRUD OPERATIONS (Strategy, Course, Webinar :: Item)
// ---------------------------------------------------------------------------

export async function getItems(filter?: { traderId?: string; type?: ItemType }): Promise<ItemRecord[]> {
  let items = loadItems();
  if (filter?.traderId) {
    items = items.filter((i) => i.traderId === filter.traderId);
  }
  if (filter?.type) {
    items = items.filter((i) => i.type === filter.type);
  }
  return items;
}

export async function getItemById(id: string): Promise<ItemRecord | null> {
  const items = loadItems();
  return items.find((i) => i.id === id || i.strategyId === id) || null;
}

export async function createItem(data: {
  type: ItemType;
  name: string;
  description: string;
  price: number;
  traderId: string;
  traderName: string;
  strategyId?: string;
  ntfyTopic?: string;
  slug?: string;
  category?: string;
  level?: string;
  thumbnail?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  meetingUrl?: string;
}): Promise<ItemRecord> {
  const items = loadItems();
  const id = `item-${data.type.toLowerCase()}-${Date.now()}`;

  // For strategies, automatically generate strategyId and secret ntfy topic if not provided
  let strategyId = data.strategyId;
  let ntfyTopic = data.ntfyTopic;

  if (data.type === "STRATEGY") {
    if (!strategyId) {
      const cleanName = data.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      strategyId = `STRAT-${cleanName || "QUANT"}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
    if (!ntfyTopic) {
      const secretHash = Math.random().toString(36).substring(2, 8);
      const cleanSlug = strategyId.toLowerCase().replace(/[^a-z0-9]/g, "_");
      ntfyTopic = `360m_${cleanSlug}_${secretHash}`;
    }
  }

  const newItem: ItemRecord = {
    id,
    type: data.type,
    name: data.name.trim(),
    description: data.description.trim(),
    price: Number(data.price) || 0,
    traderId: data.traderId,
    traderName: data.traderName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    strategyId,
    ntfyTopic,
    signalsCount: 0,
    activeSubscribers: 0,

    slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category: data.category || "Equities",
    level: data.level || "Beginner",
    thumbnail: data.thumbnail || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    enrolledCount: 0,

    date: data.date,
    startTime: data.startTime,
    durationMinutes: data.durationMinutes,
    meetingUrl: data.meetingUrl,
    maxAttendees: 100,
    filledSeats: 0,
  };

  items.unshift(newItem);
  saveItems(items);
  return newItem;
}

export async function updateItem(id: string, updates: Partial<ItemRecord>): Promise<ItemRecord | null> {
  const items = loadItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveItems(items);
  return items[index];
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = loadItems();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveItems(filtered);
  return true;
}

// ---------------------------------------------------------------------------
// SIGNAL PUSH & FREQUENCY HISTORY (Strategy ID, Signal -> ntfy.sh)
// ---------------------------------------------------------------------------

export async function pushSignal(data: {
  strategyId: string;
  signalText: string;
  traderId: string;
  traderName: string;
  symbol?: string;
  action?: "BUY" | "SELL" | "HOLD" | "ALERT";
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  riskReward?: string;
  timeframe?: string;
  notes?: string;
}): Promise<{ ok: boolean; signal: StrategySignalRecord; ntfyResult?: string; error?: string }> {
  const items = loadItems();
  const strategy = items.find((i) => i.strategyId === data.strategyId || i.id === data.strategyId);

  if (!strategy || strategy.type !== "STRATEGY") {
    return { ok: false, signal: null as any, error: `Strategy with ID "${data.strategyId}" not found.` };
  }

  const topic = strategy.ntfyTopic || `360m_strat_${strategy.strategyId?.toLowerCase()}`;
  const signals = loadSignals();
  const sigIndex = signals.length;
  const sigId = `S${sigIndex}`;

  // Format notification payload
  const actionEmoji = data.action === "BUY" ? "📈" : data.action === "SELL" ? "📉" : "⚡";
  const title = `🚨 [${strategy.strategyId}] ${data.action || "SIGNAL"}: ${data.symbol || "MARKET"}`;
  const body = data.signalText || `${actionEmoji} ${data.action} ${data.symbol || ""} @ $${data.entryPrice} | TP: $${data.targetPrice} | SL: $${data.stopLoss}\nNotes: ${data.notes || "Technical breakout confirmation"}`;

  // Push to ntfy.sh topic
  let ntfyStatus: "SENT" | "DELIVERED" | "FAILED" = "SENT";
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        Title: title,
        Priority: "high",
        Tags: data.action === "BUY" ? "chart_with_upwards_trend,moneybag" : "warning,bell",
      },
      body,
    });
    ntfyStatus = res.ok ? "DELIVERED" : "SENT";
  } catch (pushErr) {
    console.warn("ntfy push warning:", pushErr);
    ntfyStatus = "FAILED";
  }

  const newSignal: StrategySignalRecord = {
    id: sigId,
    strategyId: strategy.strategyId || strategy.id,
    strategyName: strategy.name,
    traderId: data.traderId,
    traderName: data.traderName,
    signalText: data.signalText || body,
    symbol: data.symbol,
    action: data.action || "BUY",
    entryPrice: data.entryPrice,
    targetPrice: data.targetPrice,
    stopLoss: data.stopLoss,
    riskReward: data.riskReward,
    timeframe: data.timeframe,
    notes: data.notes,
    ntfyTopic: topic,
    ntfyStatus,
    timestamp: new Date().toISOString(),
  };

  signals.unshift(newSignal);
  saveSignals(signals);

  // Update strategy signal count
  strategy.signalsCount = (strategy.signalsCount || 0) + 1;
  saveItems(items);

  return { ok: true, signal: newSignal, ntfyResult: `Dispatched to ntfy.sh/${topic}` };
}

export async function getSignalsHistory(filter?: {
  strategyId?: string;
  traderId?: string;
}): Promise<{
  frequency24h: number;
  frequency7d: number;
  frequency30d: number;
  totalCount: number;
  signals: StrategySignalRecord[];
}> {
  let signals = loadSignals();
  if (filter?.strategyId) {
    const stratId = filter.strategyId;
    signals = signals.filter(
      (s) => s.strategyId === stratId || s.strategyId === stratId.toUpperCase()
    );
  }
  if (filter?.traderId) {
    signals = signals.filter((s) => s.traderId === filter.traderId);
  }

  const now = Date.now();
  const past24hMs = 24 * 60 * 60 * 1000;
  const past7dMs = 7 * 24 * 60 * 60 * 1000;
  const past30dMs = 30 * 24 * 60 * 60 * 1000;

  const frequency24h = signals.filter((s) => now - new Date(s.timestamp).getTime() <= past24hMs).length;
  const frequency7d = signals.filter((s) => now - new Date(s.timestamp).getTime() <= past7dMs).length;
  const frequency30d = signals.filter((s) => now - new Date(s.timestamp).getTime() <= past30dMs).length;

  return {
    frequency24h,
    frequency7d,
    frequency30d,
    totalCount: signals.length,
    signals,
  };
}

// ---------------------------------------------------------------------------
// SINGLE-USE ACCESS CODES & INVOICING / DEBT ACCOUNTING
// ---------------------------------------------------------------------------

export async function issueAccessCodes(data: {
  itemId: string;
  quantity?: number;
  traderId: string;
  traderName: string;
}): Promise<{ ok: boolean; count: number; codes: AccessCodeRecord[]; error?: string }> {
  const items = loadItems();
  const item = items.find((i) => i.id === data.itemId);

  if (!item) {
    return { ok: false, count: 0, codes: [], error: `Item "${data.itemId}" not found.` };
  }

  const accessCodes = loadAccessCodes();
  const qty = Math.max(1, Math.min(50, data.quantity || 1));
  const created: AccessCodeRecord[] = [];

  const prefix = item.type === "STRATEGY" ? "STRAT" : item.type === "COURSE" ? "CRS" : "WEB";

  for (let i = 0; i < qty; i++) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const codeString = `360-${prefix}-${randomHex}${randomNum}`;

    const newCode: AccessCodeRecord = {
      id: `code-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      code: codeString,
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      itemPrice: item.price,
      traderId: data.traderId,
      traderName: data.traderName,
      isRedeemed: false,
      maxUses: 1, // Single-use guarantee!
      usedCount: 0,
      status: "UNUSED",
      createdAt: new Date().toISOString(),
    };

    created.push(newCode);
    accessCodes.unshift(newCode);
  }

  saveAccessCodes(accessCodes);
  return { ok: true, count: created.length, codes: created };
}

export async function getAccessCodes(filter?: {
  traderId?: string;
  itemId?: string;
  status?: string;
}): Promise<AccessCodeRecord[]> {
  let codes = loadAccessCodes();
  if (filter?.traderId) codes = codes.filter((c) => c.traderId === filter.traderId);
  if (filter?.itemId) codes = codes.filter((c) => c.itemId === filter.itemId);
  if (filter?.status) codes = codes.filter((c) => c.status === filter.status);
  return codes;
}

/**
 * Redeem an access code:
 * "Each access code can only be redeemed once."
 * "Redeem an access code => Put a debt on the trader's account"
 */
export async function redeemAccessCode(data: {
  code: string;
  subscriberId: string;
  subscriberEmail: string;
  subscriberName?: string;
}): Promise<{
  ok: boolean;
  item?: ItemRecord;
  invoice?: InvoiceRecord;
  error?: string;
}> {
  const cleanCode = data.code.trim().toUpperCase();
  const codes = loadAccessCodes();
  const codeIndex = codes.findIndex((c) => c.code.toUpperCase() === cleanCode);

  if (codeIndex === -1) {
    return { ok: false, error: `Invalid access code "${cleanCode}". Please verify with your trader.` };
  }

  const codeRecord = codes[codeIndex];

  // STRICT SINGLE-USE ENFORCEMENT
  if (codeRecord.isRedeemed || codeRecord.usedCount >= 1 || codeRecord.status === "REDEEMED") {
    return {
      ok: false,
      error: `Access code "${cleanCode}" has already been redeemed on ${new Date(codeRecord.redeemedAt || "").toLocaleDateString()} and cannot be used again (Single-Use Only).`,
    };
  }

  if (codeRecord.status === "REVOKED") {
    return { ok: false, error: `Access code "${cleanCode}" has been revoked by the issuer.` };
  }

  // Retrieve underlying Item
  const items = loadItems();
  const item = items.find((i) => i.id === codeRecord.itemId);

  if (!item) {
    return { ok: false, error: `The item associated with this access code no longer exists.` };
  }

  // 1. Generate Invoice & Record Debt on Trader's Account
  const invoiceId = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const invoiceNumber = `360M-INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const platformFeeRate = 0.20; // 20% platform commission
  const platformFee = Number((item.price * platformFeeRate).toFixed(2));
  const traderNet = Number((item.price * (1 - platformFeeRate)).toFixed(2));
  const debtAmount = platformFee; // Platform fee debt placed on trader account for coupon redemption

  const newInvoice: InvoiceRecord = {
    id: invoiceId,
    invoiceNumber,
    accessCode: cleanCode,
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    itemPrice: item.price,
    traderId: item.traderId,
    traderName: item.traderName,
    subscriberId: data.subscriberId,
    subscriberEmail: data.subscriberEmail,
    redeemedAt: new Date().toISOString(),
    platformFeeRate,
    platformFee,
    traderNet,
    debtAmount,
    debtStatus: "UNSETTLED",
  };

  const invoices = loadInvoices();
  invoices.unshift(newInvoice);
  saveInvoices(invoices);

  // 2. Burn / Consume the single-use access code
  codes[codeIndex] = {
    ...codeRecord,
    isRedeemed: true,
    usedCount: 1,
    status: "REDEEMED",
    redeemedByUserId: data.subscriberId,
    redeemedByUserEmail: data.subscriberEmail,
    redeemedAt: new Date().toISOString(),
    invoiceId,
  };
  saveAccessCodes(codes);

  // 3. Increment Item metrics
  if (item.type === "STRATEGY") {
    item.activeSubscribers = (item.activeSubscribers || 0) + 1;
  } else if (item.type === "COURSE") {
    item.enrolledCount = (item.enrolledCount || 0) + 1;
  } else if (item.type === "WEBINAR") {
    item.filledSeats = (item.filledSeats || 0) + 1;
  }
  saveItems(items);

  return {
    ok: true,
    item,
    invoice: newInvoice,
  };
}

export async function getInvoices(filter?: {
  traderId?: string;
  subscriberId?: string;
}): Promise<{
  invoices: InvoiceRecord[];
  totalGmv: number;
  totalPlatformDebt: number;
  totalRedemptions: number;
}> {
  let invoices = loadInvoices();
  if (filter?.traderId) invoices = invoices.filter((inv) => inv.traderId === filter.traderId);
  if (filter?.subscriberId) invoices = invoices.filter((inv) => inv.subscriberId === filter.subscriberId);

  const totalGmv = invoices.reduce((sum, inv) => sum + (inv.itemPrice || 0), 0);
  const totalPlatformDebt = invoices.reduce((sum, inv) => sum + (inv.debtAmount || 0), 0);

  return {
    invoices,
    totalGmv,
    totalPlatformDebt,
    totalRedemptions: invoices.length,
  };
}
