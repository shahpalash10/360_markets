import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // 1. Primary: Cloud Database (Supabase)
  try {
    const { data: sbApps, error } = await supabase
      .from("trader_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && sbApps && sbApps.length > 0) {
      return NextResponse.json({ success: true, applications: sbApps });
    }
  } catch (sbErr) {
    console.warn("Supabase applications fetch fallback:", sbErr);
  }

  // 2. Secondary: Prisma SQLite table
  try {
    const applications = await prisma.certificationApplication.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, action, userId } = body;

    if (action === "APPROVE") {
      const certId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Primary: Update in Supabase Cloud DB
      try {
        await supabase
          .from("trader_applications")
          .update({
            status: "approved",
            certification_id: certId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        if (userId) {
          await supabase
            .from("trader_profiles")
            .upsert({
              user_id: userId,
              is_certified: true,
              certification_status: "approved",
              certification_id: certId,
              certified_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          await supabase
            .from("profiles")
            .update({
              role: "TRADER",
              is_certified: true,
              certification_status: "approved",
              certification_id: certId,
            })
            .eq("id", userId);
        }
      } catch (sbErr) {
        console.warn("Supabase application approval notice:", sbErr);
      }

      // 2. Secondary: Mirror to Prisma
      try {
        const updatedApp = await prisma.certificationApplication.update({
          where: { id: applicationId },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });

        await prisma.traderProfile.updateMany({
          where: { userId: updatedApp.userId },
          data: {
            isCertified: true,
            certificationId: certId,
            certifiedAt: new Date(),
          },
        });
      } catch (dbErr) {}

      return NextResponse.json({ success: true, status: "APPROVED", certificationId: certId });
    } else {
      // 1. Primary: Reject in Supabase Cloud DB
      try {
        await supabase
          .from("trader_applications")
          .update({
            status: "rejected",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", applicationId);
      } catch (sbErr) {}

      // 2. Secondary: Prisma
      try {
        await prisma.certificationApplication.update({
          where: { id: applicationId },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
          },
        });
      } catch (dbErr) {}

      return NextResponse.json({ success: true, status: "REJECTED" });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process application" }, { status: 500 });
  }
}
