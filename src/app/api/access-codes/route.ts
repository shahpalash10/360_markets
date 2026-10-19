import { NextResponse } from "next/server";
import { getAccessCodes, issueAccessCodes } from "@/lib/items-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const traderId = searchParams.get("traderId") || undefined;
    const itemId = searchParams.get("itemId") || undefined;
    const status = searchParams.get("status") || undefined;

    const codes = await getAccessCodes({ traderId, itemId, status });
    return NextResponse.json({ ok: true, count: codes.length, codes });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to load access codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, quantity = 1, traderId, traderName } = body;

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Item ID is required to issue access codes." }, { status: 400 });
    }

    const result = await issueAccessCodes({
      itemId,
      quantity: Number(quantity) || 1,
      traderId: traderId || "trader",
      traderName: traderName || "Certified Quant",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      count: result.count,
      codes: result.codes,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to issue access codes" }, { status: 500 });
  }
}
