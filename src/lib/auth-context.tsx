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
  setRole: (role: Role) => void;
  loginAs: (key: keyof typeof DEMO_USERS) => void;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "INVESTOR",
  isAuthenticated: false,
  isLoading: true,
  setRole: () => {},
  loginAs: () => {},
  signOut: async () => {},
  setUserProfile: () => {},
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
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem("markets_auth_user");
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
        setRole,
        loginAs,
        signOut,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
