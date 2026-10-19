"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Plus, ArrowRight, ArrowLeft, Sparkles, Video, Calendar, Clock, DollarSign, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function NewWebinarPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [isCertified, setIsCertified] = useState(false);
  const [traderProfileId, setTraderProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(49);
  const [maxAttendees, setMaxAttendees] = useState(100);
  const [meetingUrl, setMeetingUrl] = useState("");

  useEffect(() => {
    async function checkCertification() {
      if (!user) return;
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_certified")
          .eq("id", user.id)
          .single();

        const { data: tp } = await supabase
          .from("trader_profiles")
          .select("id, is_certified, certification_status")
          .eq("user_id", user.id)
          .single();

        const certified =
          prof?.is_certified === true ||
          tp?.is_certified === true ||
          tp?.certification_status === "certified";

        setIsCertified(certified);
        if (tp?.id) setTraderProfileId(tp.id);
      } catch (e) {
        console.warn("Certification check:", e);
      } finally {
        setIsLoading(false);
      }
    }
    checkCertification();
  }, [user]);

  const handleScheduleWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let traderId = traderProfileId || user.id;

      if (!traderId) {
        const { data: tp } = await supabase
          .from("trader_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (tp?.id) traderId = tp.id;
      }

      const { data, error } = await supabase
        .from("webinars")
        .insert({
          trader_id: traderId || user.id,
          title,
          description,
          date,
          start_time: startTime,
          duration_minutes: durationMinutes,
          price: Number(price) || 0,
          max_attendees: maxAttendees,
          meeting_url: meetingUrl || `/webinars/pro-live-room/pro-live`, // Fallback/default URL
          status: "UPCOMING",
          filled_seats: 0,
          thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        })
        .select()
        .single();

      if (error) {
        console.warn("Supabase webinar insert notice:", error);
      }

      // Sync to unified Item Store (Webinar :: Item)
      try {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "WEBINAR",
            name: title,
            description,
            price: Number(price) || 0,
            traderId: user.id,
            traderName: user.displayName || user.name || "Alex Morgan",
            date,
            startTime,
            durationMinutes: Number(durationMinutes) || 60,
            meetingUrl: meetingUrl || `/webinars/pro-live-room/pro-live`,
          }),
        });
      } catch (itemErr) {
        console.warn("Item sync warning:", itemErr);
      }

      confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
      setTimeout(() => {
        router.push("/trader");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["TRADER", "ADMIN"]}>
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center font-mono">
          <div className="animate-pulse">Checking credentials...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["TRADER", "ADMIN"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Header */}
          <div className="pb-8 border-b border-[#1E1E1E] space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
              <span>PRO SESSION CREATOR</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
              SCHEDULE SESSION.
            </h1>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Create a paid live trading session or Pro Masterclass. Set ticket price, date, timing, and capacity.
            </p>
          </div>

          <form onSubmit={handleScheduleWebinar} className="border border-[#1E1E1E] bg-[#111111] p-8 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-5 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">SESSION TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. US Markets Open Execution & Order Flow Benchmark"
                  className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">DESCRIPTION</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you will cover, strategies deployed, and models provided..."
                  className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000] font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>DATE</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>START TIME (EST / UTC)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 09:30 AM EST"
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>DURATION (MINS)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#8BE000]" />
                    <span>TICKET PRICE (USD)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    <span>MAX CAPACITY</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(parseInt(e.target.value) || 100)}
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E1E1E]">
                <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-neutral-500" />
                  <span>CUSTOM STREAM / WEBCAST URL (OPTIONAL)</span>
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://... (Leave empty to use built-in WebRTC Live Room)"
                  className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-[#1E1E1E]">
              <Link href="/trader" className="bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 px-5 py-3 text-xs">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-lime px-8 py-3 text-xs font-bold text-black flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? "Scheduling..." : "Schedule Masterclass Session"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
