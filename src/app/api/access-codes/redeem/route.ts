import { NextResponse } from "next/server";
import { redeemAccessCode } from "@/lib/items-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subscriberId, subscriberEmail, subscriberName } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ ok: false, error: "Please enter an access code to redeem." }, { status: 400 });
    }

    const result = await redeemAccessCode({
      code: code.trim(),
      subscriberId: subscriberId || "user-subscriber-anonymous",
      subscriberEmail: subscriberEmail || "investor@example.com",
      subscriberName: subscriberName || "Verified Investor",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      item: result.item,
      invoice: result.invoice,
      message: `Successfully redeemed! "${result.item?.name}" is now unlocked in your dashboard.`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to redeem access code" }, { status: 500 });
  }
}
