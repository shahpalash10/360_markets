import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { supabase } from "./supabase";

export type CodeScope = "ALL_ACCESS" | "SIGNALS" | "COURSE" | "TRADER_BUNDLE";

export interface InvitationCodeRecord {
  id: string;
  code: string;
  scope: CodeScope;
  tier?: "SIGNALS" | "ALL_ACCESS";
  targetCourseId?: string;
  targetCourseTitle?: string;
  targetCourseSlug?: string;
  creatorRole: "ADMIN" | "TRADER";
  creatorId: string;
  creatorName: string;
  durationDays: number; // 0 or >= 9999 means Lifetime
  maxUses: number;
  usedCount: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CodeRedemptionRecord {
  id: string;
  codeId: string;
  code: string;
  userId: string;
  userEmail?: string;
  scope: CodeScope;
  targetCourseId?: string;
  targetCourseTitle?: string;
  redeemedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CODES_FILE = path.join(DATA_DIR, "invitation-codes.json");
const REDEMPTIONS_FILE = path.join(DATA_DIR, "code-redemptions.json");

// Default initial seed codes
const DEFAULT_CODES: InvitationCodeRecord[] = [
  {
    id: "inv-001",
    code: "TRADINGEASY",
    scope: "ALL_ACCESS",
    tier: "ALL_ACCESS",
    creatorRole: "ADMIN",
    creatorId: "admin",
    creatorName: "System Admin",
    durationDays: 365,
    maxUses: 1000,
    usedCount: 142,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    notes: "Official TradingEasy partnership master pass (Signals + Courses)",
  },
  {
    id: "inv-002",
    code: "ALPHA2026",
    scope: "SIGNALS",
    tier: "SIGNALS",
    creatorRole: "ADMIN",
    creatorId: "admin",
    creatorName: "System Admin",
    durationDays: 90,
    maxUses: 500,
    usedCount: 88,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    notes: "Q4 Quantitative Signals VIP access voucher",
  },
  {
    id: "inv-003",
    code: "VIP888",
    scope: "SIGNALS",
    tier: "SIGNALS",
    creatorRole: "TRADER",
    creatorId: "trader",
    creatorName: "Alex Morgan",
    durationDays: 30,
    maxUses: 200,
    usedCount: 45,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: "Educator community fast-track signal pass",
  },
  {
    id: "inv-004",
    code: "QUANT101",
    scope: "COURSE",
    tier: "ALL_ACCESS",
    targetCourseId: "c-1",
    targetCourseTitle: "Quantitative Stock Trading & Algorithms",
    targetCourseSlug: "quantitative-stock-trading",
    creatorRole: "TRADER",
    creatorId: "trader",
    creatorName: "Alex Morgan",
    durationDays: 9999,
    maxUses: 100,
    usedCount: 22,
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    notes: "Direct course voucher for Quant Stock Trading masterclass",
  },
];

function ensureDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

function loadCodesFromDisk(): InvitationCodeRecord[] {
  try {
    ensureDirExists();
    if (fs.existsSync(CODES_FILE)) {
      const data = fs.readFileSync(CODES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load codes from disk fallback:", err);
  }
  return [...DEFAULT_CODES];
}

function saveCodesToDisk(codes: InvitationCodeRecord[]) {
  try {
    ensureDirExists();
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
  } catch (err) {}
}

function loadRedemptionsFromDisk(): CodeRedemptionRecord[] {
  try {
    ensureDirExists();
    if (fs.existsSync(REDEMPTIONS_FILE)) {
      const data = fs.readFileSync(REDEMPTIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {}
  return [];
}

function saveRedemptionsToDisk(redemptions: CodeRedemptionRecord[]) {
  try {
    ensureDirExists();
    fs.writeFileSync(REDEMPTIONS_FILE, JSON.stringify(redemptions, null, 2), "utf-8");
  } catch (err) {}
}

function formatSupabaseCode(row: any): InvitationCodeRecord {
  return {
    id: row.id,
    code: row.code,
    scope: (row.scope as CodeScope) || "SIGNALS",
    tier: (row.tier as any) || (row.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS"),
    targetCourseId: row.target_course_id || undefined,
    targetCourseTitle: row.target_course_title || undefined,
    targetCourseSlug: row.target_course_slug || undefined,
    creatorRole: (row.creator_role as any) || "ADMIN",
    creatorId: row.creator_id || "admin",
    creatorName: row.creator_name || "System Admin",
    durationDays: row.duration_days ?? 30,
    maxUses: row.max_uses ?? 100,
    usedCount: row.used_count ?? 0,
    status: (row.status as any) || "ACTIVE",
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

function formatDbCode(dbCode: any): InvitationCodeRecord {
  return {
    id: dbCode.id,
    code: dbCode.code,
    scope: dbCode.scope as CodeScope,
    tier: (dbCode.tier as any) || (dbCode.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS"),
    targetCourseId: dbCode.targetCourseId || undefined,
    targetCourseTitle: dbCode.targetCourseTitle || undefined,
    targetCourseSlug: dbCode.targetCourseSlug || undefined,
    creatorRole: (dbCode.creatorRole as any) || "ADMIN",
    creatorId: dbCode.creatorId,
    creatorName: dbCode.creatorName,
    durationDays: dbCode.durationDays,
    maxUses: dbCode.maxUses,
    usedCount: dbCode.usedCount,
    status: (dbCode.status as any) || "ACTIVE",
    notes: dbCode.notes || undefined,
    createdAt: dbCode.createdAt ? new Date(dbCode.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: dbCode.updatedAt ? new Date(dbCode.updatedAt).toISOString() : undefined,
  };
}

/**
 * Fetch all invitation codes directly from Supabase Cloud DB.
 * Falls back to local Prisma SQLite if offline.
 */
export async function getInvitationCodes(filter?: {
  creatorId?: string;
  creatorRole?: string;
}): Promise<InvitationCodeRecord[]> {
  // 1. Primary: Supabase Cloud PostgreSQL
  try {
    let query = supabase.from("invitation_codes").select("*").order("created_at", { ascending: false });
    if (filter?.creatorId && filter.creatorRole !== "ADMIN") {
      query = query.eq("creator_id", filter.creatorId);
    }
    if (filter?.creatorRole && filter.creatorRole !== "ADMIN") {
      query = query.eq("creator_role", filter.creatorRole);
    }

    const { data: sbCodes, error } = await query;
    if (!error && sbCodes && sbCodes.length > 0) {
      const formatted = sbCodes.map(formatSupabaseCode);
      try { saveCodesToDisk(formatted); } catch (e) {}
      return formatted;
    }
  } catch (sbErr) {
    console.warn("Supabase invitation codes fetch notice:", sbErr);
  }

  // 2. Secondary: Prisma SQLite table
  try {
    const where: any = {};
    if (filter?.creatorId && filter.creatorRole !== "ADMIN") {
      where.creatorId = filter.creatorId;
    }
    if (filter?.creatorRole && filter.creatorRole !== "ADMIN") {
      where.creatorRole = filter.creatorRole;
    }

    const dbCodes = await prisma.invitationCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (dbCodes && dbCodes.length > 0) {
      const formatted = dbCodes.map(formatDbCode);
      try { saveCodesToDisk(formatted); } catch (e) {}
      return formatted;
    }
  } catch (err) {}

  // 3. Fallback: Disk cache
  const disk = loadCodesFromDisk();
  if (!filter) return disk;
  return disk.filter((c) => {
    if (filter.creatorId && c.creatorId !== filter.creatorId && filter.creatorRole !== "ADMIN") {
      return false;
    }
    if (filter.creatorRole && filter.creatorRole !== "ADMIN" && c.creatorRole !== filter.creatorRole) {
      return false;
    }
    return true;
  });
}

/**
 * Find invitation code by code string from Supabase Cloud DB.
 */
export async function getInvitationCodeByCode(code: string): Promise<InvitationCodeRecord | null> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Primary: Supabase Cloud DB
  try {
    const { data: sbCode, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (!error && sbCode) {
      return formatSupabaseCode(sbCode);
    }
  } catch (sbErr) {}

  // 2. Secondary: Prisma SQLite table
  try {
    const dbCode = await prisma.invitationCode.findFirst({
      where: { code: cleanCode },
    });
    if (dbCode) return formatDbCode(dbCode);
  } catch (err) {}

  // 3. Fallback: Disk cache
  const disk = loadCodesFromDisk();
  return disk.find((c) => c.code === cleanCode) || null;
}

/**
 * Insert a new invitation code directly into Supabase Cloud DB.
 */
export async function addInvitationCode(data: {
  code: string;
  scope?: CodeScope;
  tier?: "SIGNALS" | "ALL_ACCESS";
  targetCourseId?: string;
  targetCourseTitle?: string;
  targetCourseSlug?: string;
  creatorRole?: "ADMIN" | "TRADER";
  creatorId?: string;
  creatorName?: string;
  durationDays?: number;
  maxUses?: number;
  notes?: string;
}): Promise<{ ok: boolean; code?: InvitationCodeRecord; error?: string }> {
  const cleanCode = data.code.trim().toUpperCase();

  if (!cleanCode) {
    return { ok: false, error: "Code cannot be empty" };
  }

  const determinedScope: CodeScope =
    data.scope || (data.tier === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS");

  const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const durationDays = Number(data.durationDays) || 30;
  const maxUses = Number(data.maxUses) || 100;
  const creatorRole = data.creatorRole || "ADMIN";
  const creatorId = data.creatorId || "system";
  const creatorName = data.creatorName || (creatorRole === "TRADER" ? "Verified Educator" : "System Admin");
  const notes = data.notes?.trim() || "";

  const newRecord: InvitationCodeRecord = {
    id,
    code: cleanCode,
    scope: determinedScope,
    tier: determinedScope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS",
    targetCourseId: data.targetCourseId || undefined,
    targetCourseTitle: data.targetCourseTitle || undefined,
    targetCourseSlug: data.targetCourseSlug || undefined,
    creatorRole,
    creatorId,
    creatorName,
    durationDays,
    maxUses,
    usedCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    notes,
  };

  // 1. Primary: Insert into Supabase Cloud DB
  try {
    const { error: sbCheckErr, data: existingSb } = await supabase
      .from("invitation_codes")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (existingSb) {
      return { ok: false, error: `Invitation code "${cleanCode}" already exists. Please choose a different code.` };
    }

    const { error: sbInsertErr } = await supabase.from("invitation_codes").insert({
      id: newRecord.id,
      code: newRecord.code,
      scope: newRecord.scope,
      tier: newRecord.tier,
      target_course_id: newRecord.targetCourseId || null,
      target_course_title: newRecord.targetCourseTitle || null,
      target_course_slug: newRecord.targetCourseSlug || null,
      creator_role: newRecord.creatorRole,
      creator_id: newRecord.creatorId,
      creator_name: newRecord.creatorName,
      duration_days: newRecord.durationDays,
      max_uses: newRecord.maxUses,
      used_count: 0,
      status: newRecord.status,
      notes: newRecord.notes || null,
      created_at: newRecord.createdAt,
      updated_at: newRecord.createdAt,
    });

    if (sbInsertErr) {
      console.warn("Supabase cloud insert notice:", sbInsertErr);
    }
  } catch (sbErr) {
    console.warn("Supabase cloud insert exception:", sbErr);
  }

  // 2. Secondary: Mirror to Prisma SQLite
  try {
    await prisma.invitationCode.upsert({
      where: { code: cleanCode },
      update: {
        scope: determinedScope,
        tier: determinedScope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS",
        status: "ACTIVE",
      },
      create: {
        id,
        code: cleanCode,
        scope: determinedScope,
        tier: determinedScope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS",
        targetCourseId: data.targetCourseId || null,
        targetCourseTitle: data.targetCourseTitle || null,
        targetCourseSlug: data.targetCourseSlug || null,
        creatorRole,
        creatorId,
        creatorName,
        durationDays,
        maxUses,
        usedCount: 0,
        status: "ACTIVE",
        notes: notes || null,
      },
    });
  } catch (dbErr) {}

  // 3. Fallback disk mirror
  try {
    const disk = loadCodesFromDisk();
    disk.unshift(newRecord);
    saveCodesToDisk(disk);
  } catch (e) {}

  return { ok: true, code: newRecord };
}

/**
 * Update invitation code in Supabase Cloud DB.
 */
export async function updateInvitationCode(
  id: string,
  updates: {
    code?: string;
    scope?: CodeScope;
    targetCourseId?: string;
    targetCourseTitle?: string;
    targetCourseSlug?: string;
    durationDays?: number;
    maxUses?: number;
    status?: "ACTIVE" | "REVOKED" | "EXPIRED";
    notes?: string;
  }
): Promise<{ ok: boolean; code?: InvitationCodeRecord; error?: string }> {
  const cleanCode = updates.code ? updates.code.trim().toUpperCase() : undefined;
  let updatedRecord: InvitationCodeRecord | null = null;

  // 1. Primary: Update in Supabase Cloud DB
  try {
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (cleanCode) updatePayload.code = cleanCode;
    if (updates.scope) {
      updatePayload.scope = updates.scope;
      updatePayload.tier = updates.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS";
    }
    if (updates.targetCourseId !== undefined) updatePayload.target_course_id = updates.targetCourseId;
    if (updates.targetCourseTitle !== undefined) updatePayload.target_course_title = updates.targetCourseTitle;
    if (updates.targetCourseSlug !== undefined) updatePayload.target_course_slug = updates.targetCourseSlug;
    if (updates.durationDays !== undefined) updatePayload.duration_days = Number(updates.durationDays);
    if (updates.maxUses !== undefined) updatePayload.max_uses = Number(updates.maxUses);
    if (updates.status) updatePayload.status = updates.status;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;

    const { data: updatedSb, error } = await supabase
      .from("invitation_codes")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!error && updatedSb) {
      updatedRecord = formatSupabaseCode(updatedSb);
    }
  } catch (sbErr) {
    console.warn("Supabase code update notice:", sbErr);
  }

  // 2. Secondary: Update Prisma SQLite
  try {
    const updated = await prisma.invitationCode.update({
      where: { id },
      data: {
        ...(cleanCode ? { code: cleanCode } : {}),
        ...(updates.scope ? { scope: updates.scope, tier: updates.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS" } : {}),
        ...(updates.targetCourseId !== undefined ? { targetCourseId: updates.targetCourseId || null } : {}),
        ...(updates.targetCourseTitle !== undefined ? { targetCourseTitle: updates.targetCourseTitle || null } : {}),
        ...(updates.targetCourseSlug !== undefined ? { targetCourseSlug: updates.targetCourseSlug || null } : {}),
        ...(updates.durationDays !== undefined ? { durationDays: Number(updates.durationDays) } : {}),
        ...(updates.maxUses !== undefined ? { maxUses: Number(updates.maxUses) } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes || null } : {}),
      },
    });
    if (!updatedRecord) updatedRecord = formatDbCode(updated);
  } catch (err) {}

  // 3. Disk mirror
  try {
    const disk = loadCodesFromDisk();
    const index = disk.findIndex((c) => c.id === id);
    if (index !== -1) {
      disk[index] = {
        ...disk[index],
        ...(cleanCode ? { code: cleanCode } : {}),
        ...(updates.scope ? { scope: updates.scope, tier: updates.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS" } : {}),
        ...(updates.targetCourseId !== undefined ? { targetCourseId: updates.targetCourseId } : {}),
        ...(updates.targetCourseTitle !== undefined ? { targetCourseTitle: updates.targetCourseTitle } : {}),
        ...(updates.targetCourseSlug !== undefined ? { targetCourseSlug: updates.targetCourseSlug } : {}),
        ...(updates.durationDays !== undefined ? { durationDays: Number(updates.durationDays) } : {}),
        ...(updates.maxUses !== undefined ? { maxUses: Number(updates.maxUses) } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        updatedAt: new Date().toISOString(),
      };
      saveCodesToDisk(disk);
      if (!updatedRecord) updatedRecord = disk[index];
    }
  } catch (e) {}

  return { ok: true, code: updatedRecord || undefined };
}

/**
 * Update code status in database table.
 */
export async function updateInvitationCodeStatus(
  id: string,
  status: "ACTIVE" | "REVOKED" | "EXPIRED"
): Promise<{ ok: boolean; code?: InvitationCodeRecord; error?: string }> {
  return updateInvitationCode(id, { status });
}

/**
 * Delete invitation code from Supabase Cloud DB.
 */
export async function deleteInvitationCode(id: string): Promise<{ ok: boolean; error?: string }> {
  // 1. Primary: Supabase Cloud DB
  try {
    await supabase.from("invitation_codes").delete().eq("id", id);
  } catch (sbErr) {
    console.warn("Supabase delete notice:", sbErr);
  }

  // 2. Secondary: Prisma SQLite
  try {
    await prisma.invitationCode.delete({ where: { id } });
  } catch (err) {}

  // 3. Disk mirror
  try {
    const disk = loadCodesFromDisk();
    const filtered = disk.filter((c) => c.id !== id);
    saveCodesToDisk(filtered);
  } catch (e) {}

  return { ok: true };
}

/**
 * Redeem an invitation code against Supabase Cloud DB and record in redemption ledger.
 */
export async function redeemInvitationCode(
  code: string,
  userEmail?: string,
  userId?: string
): Promise<{
  ok: boolean;
  error?: string;
  code?: string;
  scope?: CodeScope;
  tier?: "SIGNALS" | "ALL_ACCESS";
  targetCourseId?: string;
  targetCourseTitle?: string;
  targetCourseSlug?: string;
  durationDays?: number;
  isLifetime?: boolean;
  expiresAt?: string | null;
  message?: string;
  enrolledCourseId?: string;
  enrolledCourseTitle?: string;
}> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Primary: Find code in Supabase Cloud DB
  let matched: InvitationCodeRecord | null = null;
  try {
    const { data: sbCode } = await supabase
      .from("invitation_codes")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (sbCode) {
      matched = formatSupabaseCode(sbCode);
    }
  } catch (sbErr) {}

  // Secondary: Prisma SQLite table
  if (!matched) {
    try {
      const dbCode = await prisma.invitationCode.findFirst({
        where: { code: cleanCode },
      });
      if (dbCode) {
        matched = formatDbCode(dbCode);
      }
    } catch (err) {}
  }

  // Fallback: Disk cache
  if (!matched) {
    const disk = loadCodesFromDisk();
    matched = disk.find((c) => c.code === cleanCode) || null;
  }

  if (!matched) {
    return {
      ok: false,
      error: `Invalid invitation code "${cleanCode}". Please verify with your educator or administration.`,
    };
  }

  if (matched.status === "REVOKED") {
    return {
      ok: false,
      error: `Invitation code "${cleanCode}" has been revoked by the issuer.`,
    };
  }

  if (matched.status === "EXPIRED" || (matched.maxUses && matched.usedCount >= matched.maxUses)) {
    return {
      ok: false,
      error: `Invitation code "${cleanCode}" has reached its maximum redemption capacity or has expired.`,
    };
  }

  // 2. Increment usage count in Supabase Cloud DB
  try {
    await supabase
      .from("invitation_codes")
      .update({ used_count: (matched.usedCount || 0) + 1 })
      .eq("id", matched.id);
  } catch (sbErr) {}

  // Secondary: Prisma SQLite table
  try {
    await prisma.invitationCode.update({
      where: { id: matched.id },
      data: { usedCount: { increment: 1 } },
    });
  } catch (err) {}

  matched.usedCount = (matched.usedCount || 0) + 1;

  const durationDays = matched.durationDays || 30;
  const isLifetime = durationDays >= 9999 || durationDays === 0;
  const expiresAt = isLifetime ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // 3. Record in Supabase code_redemptions table
  const redemptionId = `red-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    await supabase.from("code_redemptions").insert({
      id: redemptionId,
      code_id: matched.id,
      code: cleanCode,
      user_id: userId || "anonymous",
      user_email: userEmail || null,
      scope: matched.scope,
      target_course_id: matched.targetCourseId || null,
      target_course_title: matched.targetCourseTitle || null,
      redeemed_at: new Date().toISOString(),
    });
  } catch (sbErr) {
    console.warn("Supabase code_redemptions insert notice:", sbErr);
  }

  // Secondary: Prisma CodeRedemption
  try {
    await prisma.codeRedemption.create({
      data: {
        id: redemptionId,
        codeId: matched.id,
        code: cleanCode,
        userId: userId || "anonymous",
        userEmail: userEmail || null,
        scope: matched.scope,
        targetCourseId: matched.targetCourseId || null,
        targetCourseTitle: matched.targetCourseTitle || null,
        redeemedAt: new Date(),
      },
    });
  } catch (err) {}

  // 4. Automatic Enrollment in Supabase enrollments table if userId provided
  let enrolledCourseId = matched.targetCourseId;
  let enrolledCourseTitle = matched.targetCourseTitle;

  if (userId) {
    try {
      if (matched.scope === "COURSE" && matched.targetCourseId) {
        await supabase.from("enrollments").upsert({
          user_id: userId,
          course_id: matched.targetCourseId,
          progress_percentage: 0,
          is_completed: false,
          created_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id" });
      } else if (matched.scope === "ALL_ACCESS" || matched.scope === "TRADER_BUNDLE") {
        const { data: allCourses } = await supabase.from("courses").select("id");
        if (allCourses && allCourses.length > 0) {
          for (const crs of allCourses) {
            await supabase.from("enrollments").upsert({
              user_id: userId,
              course_id: crs.id,
              progress_percentage: 0,
              is_completed: false,
              created_at: new Date().toISOString(),
            }, { onConflict: "user_id,course_id" });
          }
        }
      }
    } catch (sbEnrollErr) {
      console.warn("Supabase auto-enroll notice:", sbEnrollErr);
    }

    // Secondary: Prisma CourseEnrollment
    try {
      if (matched.scope === "COURSE" && matched.targetCourseId) {
        const course = await prisma.course.findFirst({
          where: {
            OR: [
              { id: matched.targetCourseId },
              ...(matched.targetCourseSlug ? [{ slug: matched.targetCourseSlug }] : []),
            ],
          },
        });

        if (course) {
          enrolledCourseId = course.id;
          enrolledCourseTitle = course.title;
          await prisma.courseEnrollment.create({
            data: {
              userId,
              courseId: course.id,
              progressPercent: 0,
              isCompleted: false,
            },
          });
        }
      } else if (matched.scope === "ALL_ACCESS" || matched.scope === "TRADER_BUNDLE") {
        const allCourses = await prisma.course.findMany({ where: { published: true } });
        for (const crs of allCourses) {
          try {
            await prisma.courseEnrollment.create({
              data: {
                userId,
                courseId: crs.id,
                progressPercent: 0,
                isCompleted: false,
              },
            });
          } catch (e) {}
        }
      }
    } catch (enrollErr) {}
  }

  // Update disk cache mirror
  try {
    const disk = loadCodesFromDisk();
    const dIndex = disk.findIndex((c) => c.id === matched?.id);
    if (dIndex !== -1) {
      disk[dIndex].usedCount = matched.usedCount;
      saveCodesToDisk(disk);
    }

    const redemptions = loadRedemptionsFromDisk();
    redemptions.unshift({
      id: redemptionId,
      codeId: matched.id,
      code: cleanCode,
      userId: userId || "anonymous",
      userEmail: userEmail || undefined,
      scope: matched.scope,
      targetCourseId: matched.targetCourseId,
      targetCourseTitle: matched.targetCourseTitle,
      redeemedAt: new Date().toISOString(),
    });
    saveRedemptionsToDisk(redemptions);
  } catch (e) {}

  let message = "";
  if (matched.scope === "ALL_ACCESS") {
    message = `Master Pass Unlocked! You now have unrestricted VIP access to all Technical Signals and Educational Courses for ${isLifetime ? "Lifetime" : `${durationDays} days`}.`;
  } else if (matched.scope === "SIGNALS") {
    message = `Signals VIP Unlocked! You now have access to high-probability technical trade signals and live alerts for ${isLifetime ? "Lifetime" : `${durationDays} days`}.`;
  } else if (matched.scope === "COURSE") {
    message = `Course Access Unlocked! You are now enrolled in "${matched.targetCourseTitle || "Selected Masterclass"}" with full lesson and material privileges.`;
  } else {
    message = `Trader Bundle Unlocked! Premium access privileges activated for ${isLifetime ? "Lifetime" : `${durationDays} days`}.`;
  }

  return {
    ok: true,
    code: cleanCode,
    scope: matched.scope,
    tier: matched.tier || (matched.scope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS"),
    targetCourseId: matched.targetCourseId,
    targetCourseTitle: matched.targetCourseTitle,
    targetCourseSlug: matched.targetCourseSlug,
    durationDays,
    isLifetime,
    expiresAt,
    message,
    enrolledCourseId,
    enrolledCourseTitle,
  };
}

/**
 * Fetch redemptions from Supabase Cloud DB.
 */
export async function getRedemptions(codeId?: string): Promise<CodeRedemptionRecord[]> {
  // 1. Primary: Supabase Cloud DB
  try {
    let query = supabase.from("code_redemptions").select("*").order("redeemed_at", { ascending: false });
    if (codeId) {
      query = query.eq("code_id", codeId);
    }
    const { data: sbRedemptions, error } = await query;
    if (!error && sbRedemptions && sbRedemptions.length > 0) {
      return sbRedemptions.map((r: any) => ({
        id: r.id,
        codeId: r.code_id,
        code: r.code,
        userId: r.user_id,
        userEmail: r.user_email || undefined,
        scope: (r.scope as CodeScope) || "SIGNALS",
        targetCourseId: r.target_course_id || undefined,
        targetCourseTitle: r.target_course_title || undefined,
        redeemedAt: r.redeemed_at || new Date().toISOString(),
      }));
    }
  } catch (sbErr) {}

  // 2. Secondary: Prisma SQLite table
  try {
    const dbRedemptions = await prisma.codeRedemption.findMany({
      where: codeId ? { codeId } : undefined,
      orderBy: { redeemedAt: "desc" },
    });

    if (dbRedemptions && dbRedemptions.length > 0) {
      return dbRedemptions.map((r) => ({
        id: r.id,
        codeId: r.codeId,
        code: r.code,
        userId: r.userId,
        userEmail: r.userEmail || undefined,
        scope: r.scope as CodeScope,
        targetCourseId: r.targetCourseId || undefined,
        targetCourseTitle: r.targetCourseTitle || undefined,
        redeemedAt: r.redeemedAt.toISOString(),
      }));
    }
  } catch (err) {}

  // 3. Fallback: Disk cache
  const disk = loadRedemptionsFromDisk();
  if (!codeId) return disk;
  return disk.filter((r) => r.codeId === codeId);
}
