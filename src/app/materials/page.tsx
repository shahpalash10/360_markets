"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Download, Star, Loader } from "lucide-react";
import confetti from "canvas-confetti";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function MaterialsPage() {
  const { t, currency } = useLanguage();
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const { data, error } = await supabase
          .from("materials")
          .select(`
            *,
            trader_profiles (
              *,
              profiles (*)
            )
          `);

        if (error) {
          console.error("Error fetching materials:", error);
          // Fallback if trader_profiles relation doesn't exist, try profiles direct
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("materials")
            .select(`
              *,
              profiles (*)
            `);
          if (!fallbackError && fallbackData) {
            setMaterials(fallbackData);
          }
        } else if (data) {
          setMaterials(data);
        }
      } catch (e) {
        console.error("Fetch materials error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const handleBuy = (mat: any) => {
    setPurchasedIds((prev) => [...prev, mat.id]);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const getTraderName = (mat: any) => {
    // If joined through trader_profiles
    const p1 = mat.trader_profiles?.profiles;
    if (p1) return p1.display_name || `${p1.first_name || ""} ${p1.last_name || ""}`.trim() || "Unknown Trader";
    
    // If joined directly to profiles
    const p2 = mat.profiles;
    if (p2) return p2.display_name || `${p2.first_name || ""} ${p2.last_name || ""}`.trim() || "Unknown Trader";

    // Fallback
    return "Verified Educator";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 border-b border-[#D9D9D9] pb-8 space-y-4">
            <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase tracking-wider">
              {t.materialsSub || "QUANT MODELS & SCRIPTS"}
            </span>
            <SplitTextReveal
              lines={["INSTITUTIONAL CODE &", "FINANCIAL MODELS."]}
              className="text-5xl lg:text-6xl font-display font-light tracking-tight text-[#0B0B0B]"
            />
            <p className="text-xs font-mono text-neutral-500 max-w-xl">
              Download audited Python stock trading backtest algorithms, options surface spreadsheets, and Wall Street DCF models created by verified quantitative traders.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : materials.length === 0 ? (
            <div className="border border-[#D9D9D9] bg-[#FAFAFA] p-12 text-center text-xs text-neutral-500 font-mono">
              NO QUANT MODELS FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {materials.map((mat, i) => {
                const isPurchased = purchasedIds.includes(mat.id);
                const traderName = getTraderName(mat);

                return (
                  <Reveal key={mat.id} delay={i * 0.1}>
                    <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">{mat.file_type || mat.category || "File"}</span>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{mat.rating || 5.0}</span>
                          </div>
                        </div>

                        <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                          {mat.title}
                        </h3>

                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                          {mat.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-[#E5E5E5] flex-wrap">
                          <span>Author: <strong className="text-black">{traderName}</strong></span>
                          <span>•</span>
                          <span>{mat.file_size_mb || 0} MB</span>
                          <span>•</span>
                          <span>{mat.downloads_count || 0} Downloads</span>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-[#D9D9D9] bg-white p-4 -mx-8 -mb-8">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">PRICE</span>
                          <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                            {formatPrice(mat.price || 0)}
                          </span>
                        </div>

                        {isPurchased ? (
                          <a
                            href={mat.download_url || "#"}
                            download
                            className="btn-lime text-xs px-6 py-3 font-bold flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Archive</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewMaterial(mat)}
                              className="bg-[#E5E5E5] hover:bg-[#D4D4D4] text-black text-xs px-4 py-3 font-bold transition"
                            >
                              Preview Code
                            </button>
                            <button
                              onClick={() => handleBuy(mat)}
                              className="btn-black text-xs px-6 py-3 font-bold"
                            >
                              {t.btnBuyMaterial || "Purchase"}
                            </button>
                          </div>
                        )}
                      </div>
                    </Pressable>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>

        {/* Code Preview Modal */}
        <AnimatePresence>
          {previewMaterial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewMaterial(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0B0B0B] text-white border border-[#262626] max-w-2xl w-full p-8 space-y-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start border-b border-[#262626] pb-4">
                  <div>
                    <span className="text-xs text-[#8BE000] font-bold">SOURCE CODE PREVIEW</span>
                    <h3 className="text-xl font-bold font-display text-white mt-1">{previewMaterial.title}</h3>
                  </div>
                  <button
                    onClick={() => setPreviewMaterial(null)}
                    className="text-neutral-500 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#161616] p-4 border border-[#262626] text-xs font-mono text-neutral-300 overflow-x-auto max-h-64">
                  <pre>{`import numpy as np
import pandas as pd
from scipy.stats import norm

class InstitutionalOptionsEngine:
    def __init__(self, spot: float, strike: float, rate: float, vol: float, expiry: float):
        self.S = spot
        self.K = strike
        self.r = rate
        self.sigma = vol
        self.T = expiry

    def black_scholes_call(self) -> float:
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma ** 2) * self.T) / (self.sigma * np.sqrt(self.T))
        d2 = d1 - self.sigma * np.sqrt(self.T)
        return self.S * norm.cdf(d1) - self.K * np.exp(-self.r * self.T) * norm.cdf(d2)

# Execute Backtest Simulation...`}</pre>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-neutral-400">Includes complete tests & documentation.</span>
                  <button
                    onClick={() => {
                      handleBuy(previewMaterial);
                      setPreviewMaterial(null);
                    }}
                    className="btn-lime px-6 py-3 text-xs font-bold"
                  >
                    Purchase Model ({formatPrice(previewMaterial.price || 0)})
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
