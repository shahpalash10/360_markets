"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";
import {
  Zap,
  Radio,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  Video,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";

interface Webinar {
  id: string;
  trader_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  max_attendees: number;
  filled_seats: number;
  meeting_url: string;
  status?: string;
  trader?: {
    id: string;
    professional_title?: string;
    profiles?: {
      display_name: string;
      avatar_url?: string;
    };
  };
}

export default function ProMasterclassLandingPage() {
  const { user } = useAuth();
  const { t, currency } = useLanguage();
  
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [enrolledWebinarIds, setEnrolledWebinarIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatPrice = (usd: number) => {
    if (usd === 0) return "FREE";
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  // Load live scheduled sessions and user enrollments from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch live webinars with joined profiles
      const { data: webinarsData, error: webinarsError } = await supabase
        .from("webinars")
        .select(`
          *,
          trader:trader_profiles (
            id,
            professional_title,
            profiles:profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (!webinarsError && webinarsData) {
        setWebinars(webinarsData);
      }

      // 2. Fetch current user's webinar enrollments
      if (user) {
        const { data: enrollmentsData } = await supabase
          .from("enrollments")
          .select("webinar_id")
          .eq("user_id", user.id)
          .not("webinar_id", "is", null);

        if (enrollmentsData) {
          const enrolledIds = new Set(enrollmentsData.map((e) => e.webinar_id));
          setEnrolledWebinarIds(enrolledIds);
        }
      }
    } catch (err) {
      console.error("Error loading masterclasses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle seat purchase and database enrollment
  const handleReserve = async (webinarId: string) => {
    if (!user) return;
    setProcessingId(webinarId);

    try {
      // Simulate Stripe/Secure payout checkout settlement screen delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Insert enrollment row in Supabase
      const { error } = await supabase
        .from("enrollments")
        .insert({
          webinar_id: webinarId,
          user_id: user.id,
        });

      if (error) {
        console.error("Error creating enrollment record:", error);
        return;
      }

      // Increment filled seats counter in webinars table
      const webinarToUpdate = webinars.find((w) => w.id === webinarId);
      if (webinarToUpdate) {
        const currentSeats = webinarToUpdate.filled_seats || 0;
        await supabase
          .from("webinars")
          .update({ filled_seats: currentSeats + 1 })
          .eq("id", webinarId);
      }

      // Update local state
      setEnrolledWebinarIds((prev) => {
        const updated = new Set(prev);
        updated.add(webinarId);
        return updated;
      });

      // Celebrate
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      loadData(); // Sync active seats remaining
    } catch (err) {
      console.error("Reservation failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0B0B] text-white pb-24 font-mono select-none">
        {/* Top Header Banner */}
        <div className="border-b border-[#262626] bg-[#161616] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 border border-[#8BE000] px-3 py-1 text-xs text-[#8BE000] font-bold uppercase tracking-wider bg-black">
                <Zap className="w-4 h-4 fill-[#8BE000] text-[#8BE000]" />
                <span>{t.proSub}</span>
              </div>
            </Reveal>

            <SplitTextReveal
              lines={["LIVE MASTERCLASSES &", "COHORT SECTIONS."]}
              className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none uppercase"
            />

            <Reveal delay={0.1}>
              <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                Connect directly with verified educators, watch screenshares of algorithmic strategies, participate in live market opens, and view trading desks.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Masterclass Overview & Live Webcasts */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          {loading ? (
            <div className="text-center py-20 text-neutral-500 text-xs animate-pulse">
              SYNCING ACTIVE MASTERCLASS CHANNELS...
            </div>
          ) : webinars.length === 0 ? (
            <div className="border border-dashed border-[#262626] p-16 text-center space-y-6 max-w-xl mx-auto">
              <Radio className="w-12 h-12 text-neutral-600 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm uppercase">No Live Cohorts Scheduled</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  There are currently no active trading masterclasses scheduled. Educators can schedule a session directly from their portal dashboard.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/trader/webinars/new"
                  className="btn-lime text-xs px-6 py-3 font-bold text-black uppercase tracking-wider"
                >
                  Schedule Live Session
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {webinars.map((webinar) => {
                const enrolled = enrolledWebinarIds.has(webinar.id);
                const isProcessing = processingId === webinar.id;
                const isFull = (webinar.filled_seats || 0) >= (webinar.max_attendees || 100);
                
                const instructorName = webinar.trader?.profiles?.display_name || "Certified Trader";
                const instructorTitle = webinar.trader?.professional_title || "Stock Market Educator";
                const instructorAvatar = webinar.trader?.profiles?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";

                return (
                  <div
                    key={webinar.id}
                    className="border border-[#1E1E1E] bg-[#111111] p-8 flex flex-col justify-between space-y-8 hover:border-[#8BE000]/60 transition-all duration-300 relative group"
                  >
                    {/* Live Badge */}
                    <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-[#000] border border-[#2E2E2E] px-2.5 py-1 text-[9px] font-bold text-[#8BE000]">
                      <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full animate-pulse"></span>
                      <span>{webinar.status || "UPCOMING"}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                          LIVE COHORT SESSION
                        </span>
                        <h3 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight uppercase group-hover:text-[#8BE000] transition-colors">
                          {webinar.title}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sans font-light">
                        {webinar.description}
                      </p>
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-2 gap-4 border-t border-[#1E1E1E] pt-6 text-xs text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>{webinar.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>{webinar.start_time} ({webinar.duration_minutes}m)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>
                          {webinar.max_attendees - (webinar.filled_seats || 0)} / {webinar.max_attendees} seats left
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8BE000] shrink-0" />
                        <span className="text-[#8BE000] font-bold">FINRA VERIFIED</span>
                      </div>
                    </div>

                    {/* Instructor Segment */}
                    <div className="flex items-center gap-3 border-t border-[#1E1E1E] pt-6">
                      <img
                        src={instructorAvatar}
                        alt={instructorName}
                        className="w-10 h-10 border border-[#2E2E2E] object-cover"
                      />
                      <div className="text-xs leading-tight">
                        <div className="text-white font-bold">{instructorName}</div>
                        <div className="text-neutral-500 text-[10px] font-sans">{instructorTitle}</div>
                      </div>
                    </div>

                    {/* Action & Price Settlement Footer */}
                    <div className="border-t border-[#1E1E1E] pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase">SECURE PASS VALUE</span>
                        <span className="text-2xl font-display font-bold text-white">
                          {formatPrice(webinar.price)}
                        </span>
                      </div>

                      {enrolled ? (
                        <Link
                          href={`/webinars/${webinar.id}/live`}
                          className="bg-[#181818] hover:bg-[#8BE000] border border-[#2E2E2E] hover:border-[#8BE000] text-white hover:text-black px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all duration-300"
                        >
                          <Video className="w-4 h-4 shrink-0" />
                          <span>Enter Live Studio</span>
                        </Link>
                      ) : isFull ? (
                        <button
                          disabled
                          className="bg-[#181818] border border-[#2E2E2E] text-neutral-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4 shrink-0" />
                          <span>COHORT FULL</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReserve(webinar.id)}
                          disabled={isProcessing}
                          className="btn-lime px-6 py-3.5 text-xs font-bold text-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <span>PROCESSING SECURE GATEWAY...</span>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 shrink-0 text-black" />
                              <span>Reserve Seat Pass</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Masterclass Benefits Panel */}
          <div className="border border-[#262626] bg-[#161616] p-8 space-y-6">
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              {t.proIncludesTitle}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-300">
              <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                <span>{t.proInc1}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                <span>{t.proInc2}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                <span>{t.proInc3}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                <span>{t.proInc4}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
