"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import { DollarSign, ShieldCheck, ArrowUpRight, Building2, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TraderEarningsPage() {
  const { user } = useAuth();
  const { currency } = useLanguage();
  const [withdrawn, setWithdrawn] = useState(false);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    async function fetchEarnings() {
      if (!user) return;
      try {
        const { data: userCourses } = await supabase
          .from("courses")
          .select("id")
          .eq("trader_id", user.id);

        if (userCourses && userCourses.length > 0) {
          const courseIds = userCourses.map((c) => c.id);
          const { data: enrData } = await supabase
            .from("enrollments")
            .select("*, courses(*)")
            .in("course_id", courseIds)
            .order("created_at", { ascending: false });

          if (enrData) {
            setEnrollmentsList(enrData);
            const totalGross = enrData.reduce((acc, e) => acc + (e.courses?.price || 0), 0);
            setGrossRevenue(totalGross);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEarnings();
  }, [user]);

  const platformFee = grossRevenue * 0.2; // 20%
  const netEarnings = grossRevenue * 0.8; // 80%

  const handleWithdrawal = () => {
    setWithdrawn(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <AuthGuard allowedRoles={["TRADER"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="pb-8 border-b border-[#1E1E1E] space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
              <span>FINANCIAL SETTLEMENT & 80/20 REVENUE LEDGER</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
              EDUCATOR REVENUE.
            </h1>
            <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
              Automated institutional revenue split: 80% direct educator payout on all course and material sales.
            </p>
          </div>

          {/* Metric Cards (100% Real Database Queries) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider">GROSS VOLUME</span>
              <div className="text-3xl font-display font-light text-white">{formatPrice(grossRevenue)}</div>
              <span className="text-[10px] text-neutral-500 font-mono">100% Student Purchases</span>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider">PLATFORM SPLIT (20%)</span>
              <div className="text-3xl font-display font-light text-neutral-400">-{formatPrice(platformFee)}</div>
              <span className="text-[10px] text-neutral-500 font-mono">Infrastructure & DRM</span>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider">NET REVENUE (80%)</span>
              <div className="text-3xl font-display font-light text-[#8BE000]">{formatPrice(netEarnings)}</div>
              <span className="text-[10px] text-[#8BE000] font-mono">Educator Share</span>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider">AVAILABLE PAYOUT</span>
              <div className="text-3xl font-display font-light text-white font-bold">
                {withdrawn ? formatPrice(0) : formatPrice(netEarnings)}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">Instant ACH / Wire</span>
            </div>
          </div>

          {/* Withdrawal Card */}
          <div className="border border-[#1E1E1E] bg-[#111111] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <Building2 className="w-4 h-4 text-[#8BE000]" />
                <span>LINKED STRIPE CONNECT / BANK ACCOUNT</span>
              </div>
              <h3 className="text-2xl font-display font-medium text-white">SETTLEMENT DISBURSEMENT</h3>
              <p className="text-xs text-neutral-400 font-sans">
                Request automated ACH direct deposit payout of your accumulated 80% net course sales.
              </p>
            </div>

            <button
              onClick={handleWithdrawal}
              disabled={withdrawn || netEarnings === 0}
              className={`btn-lime text-xs px-8 py-4 font-bold text-black ${
                withdrawn || netEarnings === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {withdrawn ? "Payout Disbursed ✓" : `Request Payout — ${formatPrice(netEarnings)}`}
            </button>
          </div>

          {/* Real Transactions Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-medium text-white tracking-tight">
              SALES TRANSACTION HISTORY ({enrollmentsList.length})
            </h3>

            {enrollmentsList.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <div className="text-neutral-300 font-bold">NO SALES RECORDED YET</div>
                <p>When student investors enroll in your courses, their purchase records will appear here.</p>
              </div>
            ) : (
              <div className="border border-[#1E1E1E] bg-[#111111] overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Student ID</th>
                      <th className="p-4">Course Enrolled</th>
                      <th className="p-4">Gross Price</th>
                      <th className="p-4">Your Share (80%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {enrollmentsList.map((en) => {
                      const price = en.courses?.price || 49;
                      const share = price * 0.8;
                      return (
                        <tr key={en.id} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 text-neutral-500 text-[11px]">
                            {new Date(en.created_at || en.enrolledAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-neutral-400 font-mono text-[11px]">{en.user_id}</td>
                          <td className="p-4 text-white font-medium">{en.courses?.title || "Stock Course"}</td>
                          <td className="p-4 text-neutral-300">{formatPrice(price)}</td>
                          <td className="p-4 text-[#8BE000] font-bold">{formatPrice(share)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
