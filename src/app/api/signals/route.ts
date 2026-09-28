import { NextResponse } from "next/server";

export interface TechnicalSignal {
  id: string;
  symbol: string;
  market: "US" | "CN" | "HK" | "CRYPTO";
  action: "BUY" | "SELL" | "WATCH";
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  timeframe: "INTRADAY" | "SWING" | "POSITION";
  riskReward: string;
  notes: string;
  providerName: string;
  providerAvatar?: string;
  isVerified: boolean;
  status: "ACTIVE" | "TARGET_REACHED" | "STOPPED";
  createdAt: string;
}

// In-memory signals store with high-conviction seed signals
let globalSignals: TechnicalSignal[] = [
  {
    id: "sig-001",
    symbol: "NVDA",
    market: "US",
    action: "BUY",
    entryPrice: 126.50,
    stopLoss: 121.00,
    targetPrice: 142.00,
    timeframe: "SWING",
    riskReward: "1 : 2.82",
    notes: "Consolidation breakout on 4-hour chart with institutional dark pool accumulation. Level-2 order book shows heavy bid support at $125.",
    providerName: "Alex Morgan",
    providerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    isVerified: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "sig-002",
    symbol: "00700.HK",
    market: "HK",
    action: "BUY",
    entryPrice: 382.00,
    stopLoss: 368.00,
    targetPrice: 425.00,
    timeframe: "POSITION",
    riskReward: "1 : 3.07",
    notes: "Southbound fund inflow acceleration. Retesting 50-day EMA support with decreasing volume on pullbacks.",
    providerName: "Marcus Vance",
    providerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    isVerified: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "sig-003",
    symbol: "TSLA",
    market: "US",
    action: "BUY",
    entryPrice: 245.00,
    stopLoss: 234.00,
    targetPrice: 280.00,
    timeframe: "SWING",
    riskReward: "1 : 3.18",
    notes: "Options gamma squeeze potential ahead of robotaxi updates. Call wall shift higher to $280 strike.",
    providerName: "Sarah Lin",
    providerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    isVerified: true,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  }
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    count: globalSignals.length,
    signals: globalSignals,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      symbol,
      market = "US",
      action = "BUY",
      entryPrice,
      stopLoss,
      targetPrice,
      timeframe = "SWING",
      notes = "",
      providerName = "Certified Quantitative Trader",
      providerAvatar,
    } = body;

    if (!symbol || !entryPrice || !stopLoss || !targetPrice) {
      return NextResponse.json(
        { error: "Symbol, entry price, stop loss, and target price are required." },
        { status: 400 }
      );
    }

    const numEntry = Number(entryPrice);
    const numSL = Number(stopLoss);
    const numTP = Number(targetPrice);

    // Compute Risk-Reward Ratio
    const risk = Math.abs(numEntry - numSL);
    const reward = Math.abs(numTP - numEntry);
    const rrRatio = risk > 0 ? `1 : ${(reward / risk).toFixed(2)}` : "1 : 2.5";

    const newSignal: TechnicalSignal = {
      id: `sig-${Date.now()}`,
      symbol: symbol.toUpperCase().trim(),
      market: market as any,
      action: action as any,
      entryPrice: numEntry,
      stopLoss: numSL,
      targetPrice: numTP,
      timeframe: timeframe as any,
      riskReward: rrRatio,
      notes: notes.trim(),
      providerName,
      providerAvatar:
        providerAvatar ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      isVerified: true,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    // Prepend to signals list
    globalSignals = [newSignal, ...globalSignals];

    // Dispatch real-time Push Notification to ntfy.sh
    let ntfyStatus = "pending";
    try {
      const ntfyResponse = await fetch("https://ntfy.sh/360markets_signals", {
        method: "POST",
        headers: {
          Title: `🚨 Signal Alert: ${action} ${symbol.toUpperCase()} @ $${numEntry}`,
          Priority: "high",
          Tags: action === "BUY" ? "chart_with_upwards_trend,moneybag" : "chart_with_downwards_trend,warning",
          Click: "https://360markets.io/signals",
        },
        body: `🎯 Target: $${numTP} | 🛑 Stop Loss: $${numSL} | R:R ${rrRatio}\nNotes: ${notes || "No notes provided"}\nBy: ${providerName}`,
      });

      ntfyStatus = ntfyResponse.ok ? "sent" : "failed";
    } catch (pushErr) {
      console.warn("ntfy.sh dispatch notice:", pushErr);
      ntfyStatus = "error";
    }

    return NextResponse.json({
      ok: true,
      signal: newSignal,
      ntfyStatus,
      topic: "360markets_signals",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to publish signal" },
      { status: 500 }
    );
  }
}
