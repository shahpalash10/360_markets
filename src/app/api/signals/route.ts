import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

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
  courseId?: string;
  courseSlug?: string;
  courseName?: string;
  channelTopic?: string;
}

const SIGNALS_FILE = path.join(process.cwd(), "data", "signals.json");

const SEED_SIGNALS: TechnicalSignal[] = [
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
    courseId: "stocks-the-beginning-to-the-end",
    courseSlug: "stocks_the_beginning_to_the_end",
    courseName: "Stocks: the beginning to the end",
    channelTopic: "360markets_signals_stocks_the_beginning_to_the_end",
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

function loadDiskSignals(): TechnicalSignal[] {
  try {
    if (fs.existsSync(SIGNALS_FILE)) {
      const data = fs.readFileSync(SIGNALS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to read signals disk fallback:", e);
  }
  return SEED_SIGNALS;
}

function saveDiskSignals(signals: TechnicalSignal[]) {
  try {
    const dir = path.dirname(SIGNALS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write signals disk mirror:", e);
  }
}

export async function GET() {
  // 1. Primary: Cloud Database (Supabase)
  try {
    const { data: sbSignals, error } = await supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false });

    const diskFallback = loadDiskSignals();
    const diskMap = new Map(diskFallback.map((d) => [d.id, d]));

    if (!error && sbSignals && sbSignals.length > 0) {
      const formatted: TechnicalSignal[] = sbSignals.map((s: any) => {
        const entry = Number(s.entry_price) || 0;
        const sl = Number(s.stop_loss) || 0;
        const tp = Number(s.target_price) || 0;
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        const rr = s.risk_reward || (risk > 0 ? `1 : ${(reward / risk).toFixed(2)}` : "1 : 2.5");
        const diskMatch = diskMap.get(s.id);

        return {
          id: s.id,
          symbol: s.symbol,
          market: (s.market as any) || (s.symbol.includes(".HK") ? "HK" : "US"),
          action: (s.action as any) || "BUY",
          entryPrice: entry,
          stopLoss: sl,
          targetPrice: tp,
          timeframe: (s.timeframe as any) || "SWING",
          riskReward: rr,
          notes: s.notes || "",
          providerName: s.provider_name || "Certified Quant",
          providerAvatar: s.provider_avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          isVerified: true,
          status: (s.status as any) || "ACTIVE",
          createdAt: s.created_at || new Date().toISOString(),
          courseId: s.course_id || diskMatch?.courseId || undefined,
          courseSlug: s.course_slug || diskMatch?.courseSlug || undefined,
          courseName: s.course_name || diskMatch?.courseName || undefined,
          channelTopic: s.channel_topic || diskMatch?.channelTopic || (diskMatch?.courseSlug ? `360markets_signals_${diskMatch.courseSlug}` : undefined),
        };
      });

      try { saveDiskSignals(formatted); } catch (e) {}
      return NextResponse.json({
        ok: true,
        count: formatted.length,
        signals: formatted,
      });
    }
  } catch (sbErr) {
    console.warn("Supabase signals fetch notice:", sbErr);
  }

  // 2. Secondary: Prisma Database Table
  try {
    const dbSignals = await prisma.marketSignal.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbSignals && dbSignals.length > 0) {
      const formatted: TechnicalSignal[] = dbSignals.map((s) => {
        const risk = Math.abs(s.entryPrice - s.stopLoss);
        const reward = Math.abs(s.targetPrice - s.entryPrice);
        const rr = risk > 0 ? `1 : ${(reward / risk).toFixed(2)}` : "1 : 2.5";

        return {
          id: s.id,
          symbol: s.symbol,
          market: s.symbol.includes(".HK") ? "HK" : "US",
          action: (s.action as any) || "BUY",
          entryPrice: s.entryPrice,
          stopLoss: s.stopLoss,
          targetPrice: s.targetPrice,
          timeframe: (s.timeframe as any) || "SWING",
          riskReward: rr,
          notes: s.rationale,
          providerName: s.traderName || "Certified Quant",
          providerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          isVerified: true,
          status: (s.status as any) || "ACTIVE",
          createdAt: s.createdAt.toISOString(),
        };
      });

      try { saveDiskSignals(formatted); } catch (e) {}
      return NextResponse.json({
        ok: true,
        count: formatted.length,
        signals: formatted,
      });
    }
  } catch (err) {}

  // 3. Fallback to disk mirror
  const disk = loadDiskSignals();
  return NextResponse.json({
    ok: true,
    count: disk.length,
    signals: disk,
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
      traderId = "trader",
      userRole,
      courseId,
      courseSlug,
      courseName,
    } = body;

    // Item 9: Restrict signal publishing to providers only
    if (userRole && userRole !== "TRADER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Signal broadcasting is strictly restricted to certified educators and providers." },
        { status: 403 }
      );
    }

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
    const sigId = `sig-${Date.now()}`;

    // Item 12: Determine course-specific ntfy notification channel
    const courseSlugClean = (courseSlug || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/^_+|_+$/g, "");
    const topicName = courseSlugClean ? `360markets_signals_${courseSlugClean}` : "360markets_signals";

    const newSignal: TechnicalSignal = {
      id: sigId,
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
      courseId: courseId || undefined,
      courseSlug: courseSlugClean || undefined,
      courseName: courseName || (courseSlugClean ? `Course: ${courseSlugClean}` : "General Broadcast"),
      channelTopic: topicName,
    };

    // 1. Primary: Insert into Supabase Cloud DB Table
    try {
      const { error: sbErr } = await supabase.from("signals").insert({
        id: newSignal.id,
        symbol: newSignal.symbol,
        market: newSignal.market,
        action: newSignal.action,
        entry_price: newSignal.entryPrice,
        stop_loss: newSignal.stopLoss,
        target_price: newSignal.targetPrice,
        timeframe: newSignal.timeframe,
        risk_reward: newSignal.riskReward,
        notes: newSignal.notes,
        provider_name: newSignal.providerName,
        provider_avatar: newSignal.providerAvatar,
        status: newSignal.status,
        created_at: newSignal.createdAt,
      });
      if (sbErr) console.warn("Supabase signal insert notice:", sbErr);
    } catch (e) {}

    // 2. Secondary: Mirror to Prisma ORM Table
    try {
      await prisma.marketSignal.create({
        data: {
          id: sigId,
          traderId: traderId || "trader",
          traderName: providerName,
          symbol: newSignal.symbol,
          action: newSignal.action,
          entryPrice: numEntry,
          targetPrice: numTP,
          stopLoss: numSL,
          timeframe: timeframe,
          confidence: 88,
          rationale: notes.trim() || "Technical breakout signal",
          status: "ACTIVE",
        },
      });
    } catch (dbErr) {}

    // 3. Mirror to disk cache
    try {
      const currentSignals = loadDiskSignals();
      currentSignals.unshift(newSignal);
      saveDiskSignals(currentSignals);
    } catch (e) {}

    // 4. Dispatch real-time Push Notification to course-specific ntfy.sh channel
    let ntfyStatus = "pending";
    try {
      const channelHeaderTitle = courseName
        ? `🚨 [${courseName}] ${action} ${symbol.toUpperCase()} @ $${numEntry}`
        : `🚨 Signal Alert: ${action} ${symbol.toUpperCase()} @ $${numEntry}`;

      const ntfyResponse = await fetch(`https://ntfy.sh/${topicName}`, {
        method: "POST",
        headers: {
          Title: channelHeaderTitle,
          Priority: "high",
          Tags: action === "BUY" ? "chart_with_upwards_trend,moneybag" : "chart_with_downwards_trend,warning",
          Click: `https://360markets.io/signals?channel=${courseSlugClean || "all"}`,
        },
        body: `🎯 Target: $${numTP} | 🛑 Stop Loss: $${numSL} | R:R ${rrRatio}\nChannel: ntfy.sh/${topicName}\nNotes: ${notes || "Breakout confirmation"}\nBy: ${providerName}`,
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
      topic: topicName,
      channelUrl: `https://ntfy.sh/${topicName}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to publish signal" },
      { status: 500 }
    );
  }
}
