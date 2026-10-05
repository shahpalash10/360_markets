import { NextResponse } from "next/server";
import { redeemInvitationCode } from "@/lib/invitation-store";

export async function POST(req: Request) {
  try {
    const { code, userEmail, userId } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please provide an invitation code to redeem." }, { status: 400 });
    }

    const result = await redeemInvitationCode(code, userEmail, userId);

    if (!result.ok) {
      const status = result.error?.includes("revoked")
        ? 403
        : result.error?.includes("capacity") || result.error?.includes("expired")
        ? 410
        : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      scope: result.scope,
      tier: result.tier,
      targetCourseId: result.targetCourseId,
      targetCourseTitle: result.targetCourseTitle,
      targetCourseSlug: result.targetCourseSlug,
      durationDays: result.durationDays,
      isLifetime: result.isLifetime,
      expiresAt: result.expiresAt,
      message: result.message,
      enrolledCourseId: result.enrolledCourseId,
      enrolledCourseTitle: result.enrolledCourseTitle,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to redeem invitation code" }, { status: 500 });
  }
}
