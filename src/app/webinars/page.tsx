"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";

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
  status: string;
  thumbnail: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function WebinarsPage() {
  const { t, currency } = useLanguage();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWebinars() {
      try {
        const { data, error } = await supabase
          .from("webinars")
          .select("*, profiles(first_name, last_name)")
          .order("date", { ascending: true });

        if (!error && data) {
          setWebinars(data);
        }
      } catch (error) {
        console.error("Error fetching webinars:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWebinars();
  }, []);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  const getTraderName = (web: Webinar) => {
    if (web.profiles) {
      return `${web.profiles.first_name || ""} ${web.profiles.last_name || ""}`.trim() || "Trader";
    }
    return "Trader";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 border-b border-[#D9D9D9] pb-8 space-y-4">
            <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase tracking-wider">
              {t.webinarsSub}
            </span>
            <SplitTextReveal
              lines={["LIVE US STOCK", "TRADING STREAMS."]}
              className="text-5xl lg:text-6xl font-display font-light tracking-tight text-[#0B0B0B]"
            />
            <p className="text-xs font-mono text-neutral-500 max-w-xl">
              Watch verified stock educators execute real trades during US market open sessions. Ask questions via live WebRTC voice Q&A and Level-2 order book breakdown.
            </p>
          </div>

          {loading ? (
            <div className="text-sm font-mono text-neutral-500 py-8">LOADING STREAMS...</div>
          ) : webinars.length === 0 ? (
            <div className="text-sm font-mono text-neutral-500 bg-[#FAFAFA] border border-[#D9D9D9] p-8 text-center uppercase tracking-widest">
              NO LIVE STREAMS SCHEDULED
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {webinars.map((web, i) => (
                <Reveal key={web.id} delay={i * 0.1}>
                  <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        {web.status === "LIVE" ? (
                          <span className="bg-red-600 text-white px-2.5 py-0.5 font-bold flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            LIVE NOW
                          </span>
                        ) : (
                          <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">{web.date}</span>
                        )}
                        <span className="text-neutral-500">{web.start_time}</span>
                      </div>

                      <div className="relative h-48 w-full overflow-hidden border border-[#D9D9D9]">
                        <img
                          src={web.thumbnail || "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"}
                          alt={web.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5">
                          {web.duration_minutes} mins
                        </div>
                      </div>

                      <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                        {web.title}
                      </h3>

                      <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                        {web.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-[#E5E5E5]">
                        <span>Host: <strong className="text-black">{getTraderName(web)}</strong></span>
                        <span>•</span>
                        <span>{web.filled_seats} / {web.max_attendees} Enrolled</span>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#D9D9D9] bg-white p-4 -mx-8 -mb-8">
                      <div>
                        <span className="text-[10px] text-neutral-400 block">TICKET</span>
                        <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                          {formatPrice(web.price)}
                        </span>
                      </div>
                      <Link href={`/webinars/${web.id}/live`}>
                        <MagneticButton className="btn-black text-xs px-6 py-3 font-bold">
                          {web.status === "LIVE" ? t.btnJoinStream : t.btnReserveSeat}
                        </MagneticButton>
                      </Link>
                    </div>
                  </Pressable>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
