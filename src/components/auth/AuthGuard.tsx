"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: ("INVESTOR" | "TRADER" | "ADMIN")[];
}) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect unauthorized roles to their designated home
        if (role === "INVESTOR") {
          router.push("/investor");
        } else if (role === "TRADER") {
          router.push("/trader");
        } else if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, role, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#8BE000] border-t-transparent rounded-full animate-spin" />
          <span>AUTHENTICATING SESSION...</span>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
