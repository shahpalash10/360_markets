"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

export type Role = "INVESTOR" | "TRADER" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: Role;
  title: string;
  avatarUrl: string;
  country: string;
  language: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  isCertified?: boolean;
  certificationStatus?: "pending" | "under_review" | "certified" | "rejected";
  certificationId?: string;
  isUnlocked?: boolean;
  unlockedCode?: string;
  signalSubscription?: SignalSubscription | null;
}

export interface SignalSubscription {
  active: boolean;
  tier: "SIGNALS" | "ALL_ACCESS";
  code: string;
  durationDays: number;
  isLifetime: boolean;
  expiresAt: string | null;
  redeemedAt: string;
}

export const DEMO_USERS: Record<string, UserProfile> = {
  investor: {
    id: "user-palash-demo",
    email: "palash@investor.io",
    name: "Palash Shah",
    firstName: "Palash",
    lastName: "Shah",
    displayName: "Palash Shah",
    role: "INVESTOR",
    title: "Stock Investor",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    country: "United States",
    language: "EN",
    onboardingCompleted: true,
    onboardingStep: 4,
  },
  trader: {
    id: "user-alex-demo",
    email: "alex.morgan@trader.io",
    name: "Alex Morgan",
    firstName: "Alex",
    lastName: "Morgan",
    displayName: "Alex Morgan",
    role: "TRADER",
    title: "Ex-Hedge Fund Stock Quant",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    country: "United States",
    language: "EN",
    onboardingCompleted: true,
    onboardingStep: 4,
    isCertified: true,
    certificationStatus: "certified",
    certificationId: "TRD-928184",
  },
  admin: {
    id: "user-admin-demo",
    email: "admin@markets.io",
    name: "System Admin",
    firstName: "System",
    lastName: "Admin",
    displayName: "System Admin",
    role: "ADMIN",
    title: "Head of Operations",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    country: "United States",
    language: "EN",
    onboardingCompleted: true,
    onboardingStep: 4,
  },
};

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUnlocked: boolean;
  unlockedCode: string | null;
  signalSubscription: SignalSubscription | null;
  setRole: (role: Role) => void;
  loginAs: (key: keyof typeof DEMO_USERS) => void;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  unlockWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  redeemSignalCode: (code: string) => Promise<{ success: boolean; message: string; subscription?: SignalSubscription }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "INVESTOR",
  isAuthenticated: false,
  isLoading: true,
  isUnlocked: false,
  unlockedCode: null,
  signalSubscription: null,
  setRole: () => {},
  loginAs: () => {},
  signOut: async () => {},
  setUserProfile: () => {},
  unlockWithCode: async () => ({ success: false, message: "" }),
  redeemSignalCode: async () => ({ success: false, message: "" }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Sync session from localStorage or Supabase session
    const saved = localStorage.getItem("markets_auth_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        setUser(null);
      }
    }

    // Check active Supabase Auth Session
    const checkSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from Supabase profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            let userObj: UserProfile = {
              id: profile.id,
              email: session.user.email || "",
              name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
              firstName: profile.first_name,
              lastName: profile.last_name,
              displayName: profile.display_name,
              role: profile.role as Role,
              title: profile.role === "TRADER" ? "Stock Educator" : "Stock Investor",
              avatarUrl: profile.avatar_url || DEMO_USERS.investor.avatarUrl,
              country: profile.country || "United States",
              language: profile.language || "EN",
              onboardingCompleted: profile.onboarding_completed ?? true,
              onboardingStep: profile.onboarding_step ?? 4,
              isCertified: profile.is_certified || false,
              certificationId: profile.certification_id || undefined,
              certificationStatus: profile.certification_status || undefined,
            };

            const { data: tp } = await supabase.from('trader_profiles').select('*').eq('user_id', session.user.id).single();
            if (tp) {
              userObj.isCertified = userObj.isCertified || tp.is_certified || false;
              userObj.certificationId = userObj.certificationId || tp.certification_id || undefined;
              userObj.certificationStatus = tp.certification_status as any || userObj.certificationStatus;
            }

            if (userObj.role === "ADMIN") {
              userObj.title = "Platform Administrator";
            } else if (userObj.isCertified) {
              userObj.title = "Certified Stock Educator";
            }

            setUser(userObj);
            localStorage.setItem("markets_auth_user", JSON.stringify(userObj));
          }
        }
      } catch (e) {
        // Fallback to local session
      } finally {
        setIsLoading(false);
      }
    };

    checkSupabaseSession();

    // Listen to Supabase Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("markets_auth_user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setRole = (newRole: Role) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem("markets_auth_user", JSON.stringify(updated));
  };

  const loginAs = (key: keyof typeof DEMO_USERS) => {
    const selected = DEMO_USERS[key];
    setUser(selected);
    localStorage.setItem("markets_auth_user", JSON.stringify(selected));

    // Auto-redeem any pending invitation code when signing in
    if (typeof window !== "undefined") {
      const pending = localStorage.getItem("markets_pending_code");
      if (pending) {
        const clean = pending.trim().toUpperCase();
        fetch("/api/redeem-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: clean,
            userId: selected.id,
            userEmail: selected.email,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok) {
              redeemSignalCode(clean);
              localStorage.removeItem("markets_pending_code");
            }
          })
          .catch(() => {});
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem("markets_auth_user");
  };

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [unlockedCode, setUnlockedCode] = useState<string | null>(null);

  useEffect(() => {
    const savedCode = localStorage.getItem("markets_unlocked_code");
    if (savedCode) {
      setIsUnlocked(true);
      setUnlockedCode(savedCode);
    }
  }, []);

  const unlockWithCode = async (rawCode: string): Promise<{ success: boolean; message: string }> => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, message: "Please enter an invitation code." };
    }

    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { success: false, message: data.error || "Invalid or expired invitation code." };
      }

      setIsUnlocked(true);
      setUnlockedCode(code);
      localStorage.setItem("markets_unlocked_code", code);

      const newSub: SignalSubscription = {
        active: true,
        tier: data.tier || "SIGNALS",
        code,
        durationDays: data.durationDays || 30,
        isLifetime: !!data.isLifetime,
        expiresAt: data.expiresAt || null,
        redeemedAt: new Date().toISOString(),
      };
      setSignalSubscription(newSub);
      localStorage.setItem("markets_signal_subscription", JSON.stringify(newSub));

      if (data.targetCourseId || data.enrolledCourseId || data.scope === "COURSE") {
        try {
          const unlocked = JSON.parse(localStorage.getItem("markets_unlocked_courses") || "[]");
          const idToAdd = data.targetCourseId || data.enrolledCourseId;
          const slugToAdd = data.targetCourseSlug;
          if (idToAdd && !unlocked.includes(idToAdd)) unlocked.push(idToAdd);
          if (slugToAdd && !unlocked.includes(slugToAdd)) unlocked.push(slugToAdd);
          localStorage.setItem("markets_unlocked_courses", JSON.stringify(unlocked));
        } catch (e) {}
      } else if (data.scope === "ALL_ACCESS" || data.tier === "ALL_ACCESS") {
        try {
          const unlocked = JSON.parse(localStorage.getItem("markets_unlocked_courses") || "[]");
          if (!unlocked.includes("ALL_ACCESS")) unlocked.push("ALL_ACCESS");
          localStorage.setItem("markets_unlocked_courses", JSON.stringify(unlocked));
        } catch (e) {}
      }

      if (user) {
        const updated = {
          ...user,
          isUnlocked: true,
          unlockedCode: code,
          signalSubscription: newSub,
        };
        setUser(updated);
        localStorage.setItem("markets_auth_user", JSON.stringify(updated));
      } else {
        localStorage.setItem("markets_pending_code", code);
      }

      return { success: true, message: data.message || `Code "${code}" verified! Access granted.` };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to verify invitation code." };
    }
  };

  const [signalSubscription, setSignalSubscription] = useState<SignalSubscription | null>(null);

  useEffect(() => {
    const savedSub = localStorage.getItem("markets_signal_subscription");
    if (savedSub) {
      try {
        setSignalSubscription(JSON.parse(savedSub));
      } catch (e) {}
    }
  }, []);

  const redeemSignalCode = async (rawCode: string): Promise<{ success: boolean; message: string; subscription?: SignalSubscription }> => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, message: "Please enter an invitation code to redeem." };
    }

    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { success: false, message: data.error || "Failed to redeem code" };
      }

      const newSub: SignalSubscription = {
        active: true,
        tier: data.tier || "SIGNALS",
        code: data.code,
        durationDays: data.durationDays,
        isLifetime: data.isLifetime,
        expiresAt: data.expiresAt,
        redeemedAt: new Date().toISOString(),
      };

      setSignalSubscription(newSub);
      localStorage.setItem("markets_signal_subscription", JSON.stringify(newSub));

      // Also unlock courses/signals globally
      setIsUnlocked(true);
      setUnlockedCode(code);
      localStorage.setItem("markets_unlocked_code", code);

      if (data.targetCourseId || data.enrolledCourseId || data.scope === "COURSE") {
        try {
          const unlocked = JSON.parse(localStorage.getItem("markets_unlocked_courses") || "[]");
          const idToAdd = data.targetCourseId || data.enrolledCourseId;
          const slugToAdd = data.targetCourseSlug;
          if (idToAdd && !unlocked.includes(idToAdd)) unlocked.push(idToAdd);
          if (slugToAdd && !unlocked.includes(slugToAdd)) unlocked.push(slugToAdd);
          localStorage.setItem("markets_unlocked_courses", JSON.stringify(unlocked));
        } catch (e) {}
      } else if (data.scope === "ALL_ACCESS" || data.tier === "ALL_ACCESS") {
        try {
          const unlocked = JSON.parse(localStorage.getItem("markets_unlocked_courses") || "[]");
          if (!unlocked.includes("ALL_ACCESS")) unlocked.push("ALL_ACCESS");
          localStorage.setItem("markets_unlocked_courses", JSON.stringify(unlocked));
        } catch (e) {}
      }

      if (user) {
        const updated = {
          ...user,
          isUnlocked: true,
          unlockedCode: code,
          signalSubscription: newSub,
        };
        setUser(updated);
        localStorage.setItem("markets_auth_user", JSON.stringify(updated));
      }

      return { success: true, message: data.message, subscription: newSub };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to process redemption." };
    }
  };

  const setUserProfile = (profile: UserProfile | null) => {
    setUser(profile);
    if (profile) {
      localStorage.setItem("markets_auth_user", JSON.stringify(profile));
    } else {
      localStorage.removeItem("markets_auth_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : "INVESTOR",
        isAuthenticated: !!user,
        isLoading,
        isUnlocked: isUnlocked || !!user?.isUnlocked,
        unlockedCode: unlockedCode || user?.unlockedCode || null,
        signalSubscription,
        setRole,
        loginAs,
        signOut,
        setUserProfile,
        unlockWithCode,
        redeemSignalCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
