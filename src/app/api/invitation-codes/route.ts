import { NextResponse } from "next/server";
import {
  getInvitationCodes,
  getInvitationCodeByCode,
  addInvitationCode,
  updateInvitationCode,
  updateInvitationCodeStatus,
  deleteInvitationCode,
  getRedemptions,
} from "@/lib/invitation-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codeQuery = searchParams.get("code");
    const creatorId = searchParams.get("creatorId") || undefined;
    const creatorRole = searchParams.get("creatorRole") || undefined;
    const redemptionsCodeId = searchParams.get("redemptionsCodeId");

    if (redemptionsCodeId) {
      const redemptions = await getRedemptions(redemptionsCodeId);
      return NextResponse.json({ ok: true, redemptions });
    }

    if (codeQuery) {
      const found = await getInvitationCodeByCode(codeQuery);
      if (!found) {
        return NextResponse.json({ ok: false, error: "Code not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, code: found });
    }

    const codes = await getInvitationCodes({ creatorId, creatorRole });
    return NextResponse.json({
      ok: true,
      count: codes.length,
      codes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load invitation codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      code,
      scope = "SIGNALS",
      tier = "SIGNALS",
      targetCourseId,
      targetCourseTitle,
      targetCourseSlug,
      creatorRole = "ADMIN",
      creatorId = "system",
      creatorName = "System Admin",
      durationDays = 30,
      maxUses = 100,
      notes = "",
    } = body;

    const result = await addInvitationCode({
      code,
      scope,
      tier,
      targetCourseId,
      targetCourseTitle,
      targetCourseSlug,
      creatorRole,
      creatorId,
      creatorName,
      durationDays,
      maxUses,
      notes,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      message: `Invitation code "${result.code?.code}" successfully issued.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create invitation code" }, { status: 500 });
  }
}

// Modify / Edit any invitation code fields
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      code,
      scope,
      targetCourseId,
      targetCourseTitle,
      targetCourseSlug,
      durationDays,
      maxUses,
      status,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Code ID is required for editing" }, { status: 400 });
    }

    const result = await updateInvitationCode(id, {
      code,
      scope,
      targetCourseId,
      targetCourseTitle,
      targetCourseSlug,
      durationDays,
      maxUses,
      status,
      notes,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      message: `Invitation code "${result.code?.code}" updated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update invitation code" }, { status: 500 });
  }
}

// Quick status toggle (Revoke / Reactivate)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const result = await updateInvitationCodeStatus(id, status);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ok: true, code: result.code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update status" }, { status: 500 });
  }
}

// Delete an invitation code
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
    }

    const result = await deleteInvitationCode(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Code deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete" }, { status: 500 });
  }
}
