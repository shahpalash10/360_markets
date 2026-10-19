import { NextResponse } from "next/server";
import { pushSignal, getSignalsHistory } from "@/lib/items-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const strategyId = searchParams.get("strategyId") || undefined;
    const traderId = searchParams.get("traderId") || undefined;

    const data = await getSignalsHistory({ strategyId, traderId });
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to load signals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      strategyId,
      signalText,
      traderId,
      traderName,
      symbol,
      action = "BUY",
      entryPrice,
      targetPrice,
      stopLoss,
      riskReward,
      timeframe,
      notes,
    } = body;

    if (!strategyId) {
      return NextResponse.json({ ok: false, error: "Strategy ID is required to broadcast signal." }, { status: 400 });
    }

    const result = await pushSignal({
      strategyId,
      signalText,
      traderId: traderId || "trader",
      traderName: traderName || "Certified Quant",
      symbol,
      action,
      entryPrice: entryPrice ? Number(entryPrice) : undefined,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      riskReward,
      timeframe,
      notes,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      signal: result.signal,
      ntfyResult: result.ntfyResult,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to push signal" }, { status: 500 });
  }
}
