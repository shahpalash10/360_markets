import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const traderId = searchParams.get("traderId");

  // 1. Primary: Cloud Database (Supabase)
  try {
    let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (traderId) {
      query = query.eq("trader_id", traderId);
    }

    const { data: sbCourses, error } = await query;

    if (!error && sbCourses) {
      return NextResponse.json({ success: true, courses: sbCourses });
    }
  } catch (sbErr) {
    console.warn("Supabase courses fetch fallback:", sbErr);
  }

  // 2. Secondary: Prisma SQLite table
  try {
    const whereClause: any = {};
    if (traderId) {
      whereClause.OR = [
        { traderId },
        { trader: { userId: traderId } },
      ];
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
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
    const {
      title,
      description,
      category = "Stock Trading",
      level = "Intermediate",
      price = 49,
      isSubscription = false,
      thumbnail,
      traderId,
      modules = [],
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required." },
        { status: 400 }
      );
    }

    const slug = (body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const courseId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `crs-${Date.now()}`;
    const courseThumbnail =
      thumbnail ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";

    // 1. Primary: Insert into Supabase Cloud DB
    try {
      let sbTraderProfileId: string | null = null;
      if (traderId) {
        const { data: tpById } = await supabase.from("trader_profiles").select("id").eq("id", traderId).single();
        if (tpById?.id) {
          sbTraderProfileId = tpById.id;
        } else {
          const { data: tpByUserId } = await supabase.from("trader_profiles").select("id").eq("user_id", traderId).single();
          if (tpByUserId?.id) {
            sbTraderProfileId = tpByUserId.id;
          }
        }
      }

      const { error: sbInsertErr } = await supabase.from("courses").insert({
        id: courseId,
        trader_id: sbTraderProfileId,
        title,
        slug,
        description,
        category,
        level,
        price: parseFloat(price.toString()),
        is_subscription: !!isSubscription,
        thumbnail: courseThumbnail,
        published: true,
        rating: 5.0,
        created_at: new Date().toISOString(),
      });
      if (sbInsertErr) {
        console.warn("Supabase course insert notice:", sbInsertErr);
      }
    } catch (sbErr) {
      console.warn("Supabase course insert exception:", sbErr);
    }

    // 2. Secondary: Mirror to Prisma ORM Table
    let prismaCourse: any = null;
    try {
      let resolvedTraderId: string | null = null;
      if (traderId) {
        const tpById = await prisma.traderProfile.findUnique({ where: { id: traderId } });
        if (tpById) {
          resolvedTraderId = tpById.id;
        } else {
          const tpByUserId = await prisma.traderProfile.findFirst({ where: { userId: traderId } });
          if (tpByUserId) resolvedTraderId = tpByUserId.id;
        }
      }

      if (!resolvedTraderId) {
        const defaultTp = await prisma.traderProfile.findFirst();
        if (defaultTp) resolvedTraderId = defaultTp.id;
      }

      if (resolvedTraderId) {
        prismaCourse = await prisma.course.create({
          data: {
            id: courseId,
            traderId: resolvedTraderId,
            title,
            slug,
            description,
            category,
            level,
            price: parseFloat(price.toString()),
            isSubscription: !!isSubscription,
            thumbnail: courseThumbnail,
            published: true,
            rating: 5.0,
            modules: {
              create: modules.map((m: any, mIdx: number) => ({
                title: m.title || `Module ${mIdx + 1}`,
                orderIndex: mIdx,
                lessons: {
                  create: (m.lessons || []).map((les: any, lIdx: number) => ({
                    title: les.title || `Lesson ${lIdx + 1}`,
                    durationMinutes: les.durationMinutes || 25,
                    videoUrl: les.videoUrl || null,
                    resourceFileUrl: les.resourceFileUrl || null,
                    orderIndex: lIdx,
                  })),
                },
              })),
            },
          },
        });
      }
    } catch (dbErr) {
      console.warn("Prisma course creation notice:", dbErr);
    }

    const resultCourse = prismaCourse || {
      id: courseId,
      title,
      slug,
      description,
      category,
      level,
      price: parseFloat(price.toString()),
      isSubscription: !!isSubscription,
      thumbnail: courseThumbnail,
      published: true,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, course: resultCourse }, { status: 201 });
  } catch (error: any) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}
