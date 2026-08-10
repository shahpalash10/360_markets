import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    const { applicationId, action } = body;

    if (action === "APPROVE") {
      const certId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;

      const updatedApp = await prisma.certificationApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });

      // Update trader profile to certified
      await prisma.traderProfile.updateMany({
        where: { userId: updatedApp.userId },
        data: {
          isCertified: true,
          certificationId: certId,
          certifiedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, status: "APPROVED", certificationId: certId });
    } else {
      await prisma.certificationApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, status: "REJECTED" });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process application" }, { status: 500 });
  }
}
