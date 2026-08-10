import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        trader: {
          include: {
            user: true,
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, level, price, isSubscription, thumbnail, traderId } = body;

    const course = await prisma.course.create({
      data: {
        traderId: traderId || "trader-alex",
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        category,
        level,
        price: parseFloat(price),
        isSubscription: !!isSubscription,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      },
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 });
  }
}
