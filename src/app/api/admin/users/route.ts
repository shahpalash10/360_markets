import { NextResponse } from "next/server";
import {
  getAllUsers,
  updateUserRole,
  certifyUser,
  revokeCertification,
  UserRole,
} from "@/lib/user-store";

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ ok: true, users });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, newRole, certId, email } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing required 'userId' parameter." },
        { status: 400 }
      );
    }

    if (action === "UPDATE_ROLE") {
      const validRoles: UserRole[] = ["INVESTOR", "TRADER", "ADMIN"];
      if (!newRole || !validRoles.includes(newRole)) {
        return NextResponse.json(
          { ok: false, error: `Invalid role "${newRole}". Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      const result = await updateUserRole(userId, newRole, email);
      return NextResponse.json({
        message: `Successfully granted ${newRole} access to user.`,
        ...result,
      });
    }

    if (action === "CERTIFY") {
      const result = await certifyUser(userId, certId, email);
      return NextResponse.json({
        message: `User certified successfully with ID: ${result.certificationId}`,
        ...result,
      });
    }

    if (action === "REVOKE_CERTIFICATION") {
      const result = await revokeCertification(userId, email);
      return NextResponse.json({
        message: "Certification revoked successfully.",
        ...result,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action: "${action}"` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update user." },
      { status: 500 }
    );
  }
}
