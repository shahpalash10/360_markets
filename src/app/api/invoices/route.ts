import { NextResponse } from "next/server";
import { getInvoices } from "@/lib/items-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const traderId = searchParams.get("traderId") || undefined;
    const subscriberId = searchParams.get("subscriberId") || undefined;

    const data = await getInvoices({ traderId, subscriberId });
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to load invoices" }, { status: 500 });
  }
}
