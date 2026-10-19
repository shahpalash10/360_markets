import { NextResponse } from "next/server";
import { getItems, createItem, updateItem, deleteItem, ItemType } from "@/lib/items-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const traderId = searchParams.get("traderId") || undefined;
    const type = (searchParams.get("type") as ItemType) || undefined;

    const items = await getItems({ traderId, type });
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to load items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      name,
      description = "",
      price = 0,
      traderId,
      traderName,
      strategyId,
      ntfyTopic,
      slug,
      category,
      level,
      thumbnail,
      date,
      startTime,
      durationMinutes,
      meetingUrl,
    } = body;

    if (!type || !name) {
      return NextResponse.json({ ok: false, error: "Item type and name are required." }, { status: 400 });
    }

    const item = await createItem({
      type,
      name,
      description,
      price: Number(price) || 0,
      traderId: traderId || "trader",
      traderName: traderName || "Certified Quant",
      strategyId,
      ntfyTopic,
      slug,
      category,
      level,
      thumbnail,
      date,
      startTime,
      durationMinutes,
      meetingUrl,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Item ID is required." }, { status: 400 });
    }

    const updated = await updateItem(id, updates);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Item not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Item ID is required." }, { status: 400 });
    }

    const deleted = await deleteItem(id);
    return NextResponse.json({ ok: deleted });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Failed to delete item" }, { status: 500 });
  }
}
