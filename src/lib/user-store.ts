import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { supabase } from "./supabase";

export type UserRole = "INVESTOR" | "TRADER" | "ADMIN";

export interface StoredUserOverride {
  role?: UserRole;
  isCertified?: boolean;
  certificationId?: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USER_OVERRIDES_FILE = path.join(DATA_DIR, "user-roles.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadOverrides(): Record<string, StoredUserOverride> {
  try {
    ensureDataDir();
    if (fs.existsSync(USER_OVERRIDES_FILE)) {
      const raw = fs.readFileSync(USER_OVERRIDES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read user-roles.json:", err);
  }
  return {};
}

function saveOverrides(overrides: Record<string, StoredUserOverride>) {
  try {
    ensureDataDir();
    fs.writeFileSync(USER_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write user-roles.json:", err);
  }
}

/**
 * Fetch all users normalized for the Admin Portal.
 * Combines Prisma SQLite records, persistent overrides, and Supabase profiles.
 */
export async function getAllUsers() {
  const overrides = loadOverrides();
  const userMap = new Map<string, any>();

  // 1. Fetch from Prisma
  try {
    const prismaUsers = await prisma.user.findMany({
      include: {
        traderProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const u of prismaUsers) {
      const override = overrides[u.id] || (u.email ? overrides[u.email] : undefined);
      const effectiveRole: UserRole = override?.role || (u.role as UserRole) || "INVESTOR";
      const isCertified = override?.isCertified !== undefined
        ? override.isCertified
        : (u.traderProfile?.isCertified ?? false);
      const certificationId = override?.certificationId || u.traderProfile?.certificationId || null;

      const nameParts = (u.name || "User").split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";

      userMap.set(u.id, {
        id: u.id,
        email: u.email,
        name: u.name,
        display_name: u.name,
        first_name: firstName,
        last_name: lastName,
        role: effectiveRole,
        title: u.title || (effectiveRole === "ADMIN" ? "Platform Administrator" : effectiveRole === "TRADER" ? "Stock Educator" : "Stock Investor"),
        avatar_url: u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
        is_certified: isCertified,
        certification_id: certificationId,
        created_at: u.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.warn("Prisma fetch users fallback:", err);
  }

  // 2. Fetch from Supabase profiles (safely)
  try {
    const { data: sbProfiles } = await supabase.from("profiles").select("*");
    if (sbProfiles && Array.isArray(sbProfiles)) {
      for (const p of sbProfiles) {
        const override = overrides[p.id] || (p.email ? overrides[p.email] : undefined);
        const existing = userMap.get(p.id);

        const effectiveRole: UserRole = override?.role || (p.role as UserRole) || existing?.role || "INVESTOR";
        const isCertified = override?.isCertified !== undefined
          ? override.isCertified
          : (p.is_certified ?? existing?.is_certified ?? false);
        const certificationId = override?.certificationId || p.certification_id || existing?.certification_id || null;

        const displayName = p.display_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || existing?.name || "User";

        userMap.set(p.id, {
          id: p.id,
          email: p.email || existing?.email || `${p.id}@markets.io`,
          name: displayName,
          display_name: displayName,
          first_name: p.first_name || existing?.first_name || "User",
          last_name: p.last_name || existing?.last_name || "",
          role: effectiveRole,
          title: p.title || (effectiveRole === "ADMIN" ? "Platform Administrator" : effectiveRole === "TRADER" ? "Stock Educator" : "Stock Investor"),
          avatar_url: p.avatar_url || existing?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
          is_certified: isCertified,
          certification_id: certificationId,
          created_at: p.created_at || existing?.created_at || new Date().toISOString(),
        });
      }
    }
  } catch (sbErr) {
    console.warn("Supabase fetch profiles notice:", sbErr);
  }

  // 3. Ensure System Admin demo user is always present in directory
  if (!Array.from(userMap.values()).some((u) => u.email === "admin@markets.io" || u.id === "user-admin-demo")) {
    const override = overrides["user-admin-demo"] || overrides["admin@markets.io"];
    userMap.set("user-admin-demo", {
      id: "user-admin-demo",
      email: "admin@markets.io",
      name: "System Admin",
      display_name: "System Admin",
      first_name: "System",
      last_name: "Admin",
      role: override?.role || "ADMIN",
      title: "Head of Operations & Platform Admin",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      is_certified: true,
      certification_id: "TRD-ADMIN-001",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    });
  }

  // 4. Sort with Admins first, then Educators, then Students
  const rolePriority: Record<string, number> = { ADMIN: 1, TRADER: 2, INVESTOR: 3 };
  return Array.from(userMap.values()).sort((a, b) => {
    const prioA = rolePriority[a.role] || 99;
    const prioB = rolePriority[b.role] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

/**
 * Update user role across Prisma SQLite, JSON persistent store, and Supabase.
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  email?: string
) {
  const overrides = loadOverrides();

  // Save to persistent file overrides
  overrides[userId] = {
    ...overrides[userId],
    role: newRole,
    updatedAt: new Date().toISOString(),
  };
  if (email) {
    overrides[email] = {
      ...overrides[email],
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
  }
  saveOverrides(overrides);

  // 1. Primary: Update Supabase Cloud DB
  try {
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ""}`);

    if (newRole === "ADMIN" || newRole === "TRADER") {
      await supabase
        .from("trader_profiles")
        .upsert({
          user_id: userId,
          is_certified: newRole === "ADMIN",
        }, { onConflict: "user_id" });
    }
  } catch (sbErr) {
    console.warn("Supabase profiles update notice:", sbErr);
  }

  // 2. Secondary: Mirror to Prisma
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: newRole },
      });

      // If promoting to TRADER or ADMIN, ensure traderProfile exists
      if (newRole === "TRADER" || newRole === "ADMIN") {
        const tp = await prisma.traderProfile.findUnique({
          where: { userId: existing.id },
        });
        if (!tp) {
          await prisma.traderProfile.create({
            data: {
              userId: existing.id,
              isCertified: newRole === "ADMIN",
              certificationId: newRole === "ADMIN" ? `ADM-${Math.floor(100000 + Math.random() * 900000)}` : null,
              expertise: "Quantitative Equities & Derivatives",
              rating: 5.0,
            },
          });
        }
      }
    } else if (email) {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name: email.split("@")[0],
          passwordHash: "demo-password-hash",
          role: newRole,
        },
      });
    }
  } catch (prismaErr) {
    console.warn("Prisma user role update notice:", prismaErr);
  }

  return {
    ok: true,
    userId,
    role: newRole,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Directly certify an educator or grant certified status.
 */
export async function certifyUser(
  userId: string,
  certId?: string,
  email?: string
) {
  const generatedId = certId || `TRD-${Math.floor(100000 + Math.random() * 900000)}`;
  const overrides = loadOverrides();

  overrides[userId] = {
    ...overrides[userId],
    role: "TRADER",
    isCertified: true,
    certificationId: generatedId,
    updatedAt: new Date().toISOString(),
  };
  if (email) {
    overrides[email] = {
      ...overrides[email],
      role: "TRADER",
      isCertified: true,
      certificationId: generatedId,
      updatedAt: new Date().toISOString(),
    };
  }
  saveOverrides(overrides);

  // 1. Primary: Update Supabase Cloud DB
  try {
    await supabase
      .from("profiles")
      .update({
        is_certified: true,
        certification_id: generatedId,
        role: "TRADER",
      })
      .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ""}`);

    await supabase
      .from("trader_profiles")
      .upsert({
        user_id: userId,
        is_certified: true,
        certification_id: generatedId,
        certified_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    await supabase
      .from("trader_applications")
      .update({ status: "approved", certification_id: generatedId })
      .eq("user_id", userId);
  } catch (err) {
    console.warn("Supabase certify notice:", err);
  }

  // 2. Secondary: Mirror to Prisma
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "TRADER" },
      });

      await prisma.traderProfile.upsert({
        where: { userId: existing.id },
        create: {
          userId: existing.id,
          isCertified: true,
          certificationId: generatedId,
          certifiedAt: new Date(),
          expertise: "Certified Stock Educator",
          rating: 5.0,
        },
        update: {
          isCertified: true,
          certificationId: generatedId,
          certifiedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.warn("Prisma certify notice:", err);
  }

  return {
    ok: true,
    userId,
    isCertified: true,
    certificationId: generatedId,
  };
}

/**
 * Revoke certification
 */
export async function revokeCertification(
  userId: string,
  email?: string
) {
  const overrides = loadOverrides();

  overrides[userId] = {
    ...overrides[userId],
    isCertified: false,
    updatedAt: new Date().toISOString(),
  };
  if (email) {
    overrides[email] = {
      ...overrides[email],
      isCertified: false,
      updatedAt: new Date().toISOString(),
    };
  }
  saveOverrides(overrides);

  // 1. Primary: Revoke in Supabase Cloud DB
  try {
    await supabase
      .from("profiles")
      .update({ is_certified: false })
      .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ""}`);

    await supabase
      .from("trader_profiles")
      .update({ is_certified: false })
      .eq("user_id", userId);
  } catch (err) {
    console.warn("Supabase revoke notice:", err);
  }

  // 2. Secondary: Mirror to Prisma
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.traderProfile.updateMany({
        where: { userId: existing.id },
        data: { isCertified: false },
      });
    }
  } catch (err) {
    console.warn("Prisma revoke notice:", err);
  }

  return {
    ok: true,
    userId,
    isCertified: false,
  };
}
