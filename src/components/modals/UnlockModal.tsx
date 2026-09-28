"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { KeyRound, Sparkles, Check, X, ShieldCheck, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export function UnlockModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { unlockWithCode, isUnlocked, unlockedCode } = useAuth();
  const { language } = useLanguage();
  const [code, setCode] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    const res = await unlockWithCode(code);
    setLoading(false);

    if (res.success) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#8BE000", "#FFFFFF"] });
      setStatusMsg({ text: res.message, isError: false });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleQuickFill = (c: string) => {
    setCode(c);
    setStatusMsg(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#121212] border border-[#262626] p-6 sm:p-8 text-white font-mono shadow-2xl z-10 space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-[#8BE000]/10 border border-[#8BE000]/30 px-2.5 py-1 text-[11px] text-[#8BE000] font-bold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {language === "ZH"
                  ? "邀请码专属解锁"
                  : language === "JA"
                  ? "招待コード解除"
                  : "INVITATION CODE ACCESS"}
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">
              {language === "ZH"
                ? "解锁课程与交易信号"
                : language === "JA"
                ? "コース＆シグナル解除"
                : "Unlock Courses & Signals"}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              {language === "ZH"
                ? "输入导师或平台邀请码，免费解锁所有量化课程、投研快报及实时交易信号。"
                : language === "JA"
                ? "エデュケーターまたはプラットフォーム招待コードを入力すると、すべてのコースとシグナルが無料解除されます。"
                : "Enter an educator or platform invitation code to unlock all quantitative courses, research reports, and live technical signals."}
            </p>
          </div>

          {/* Current Status Badge if already unlocked */}
          {isUnlocked && (
            <div className="bg-[#8BE000]/10 border border-[#8BE000] p-3 text-xs flex items-center justify-between text-[#8BE000]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  {language === "ZH" ? "已激活专属权限" : "Unlocked: "}
                  <strong className="text-white">{unlockedCode || "VIP ACCESS"}</strong>
                </span>
              </div>
              <span className="text-[10px] bg-[#8BE000] text-black px-2 py-0.5 font-bold">
                ACTIVE
              </span>
            </div>
          )}

          {/* Feedback message */}
          {statusMsg && (
            <div
              className={`p-3 text-xs ${
                statusMsg.isError
                  ? "bg-red-950/50 border border-red-800 text-red-300"
                  : "bg-emerald-950/50 border border-emerald-600 text-emerald-300"
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                {language === "ZH" ? "输入邀请码" : "ENTER CODE"}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRADINGEASY"
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3.5 focus:outline-none text-base uppercase tracking-widest font-mono placeholder:text-neutral-600 font-bold"
                autoFocus
              />
            </div>

            {/* Quick Demo Code Suggestions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">
                {language === "ZH" ? "快捷填入测试码：" : "TEST INVITATION CODES:"}
              </span>
              <div className="flex flex-wrap gap-2">
                {["TRADINGEASY", "ALPHA2026", "VIP888"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleQuickFill(c)}
                    className="text-[11px] bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] hover:border-[#8BE000] text-neutral-300 hover:text-white px-2.5 py-1 transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-lime w-full py-3.5 text-xs font-bold text-black flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-50"
            >
              <span>{loading ? "Verifying..." : language === "ZH" ? "立即验证并解锁" : "Verify & Unlock"}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          <div className="border-t border-[#222] pt-4 text-center">
            <p className="text-[11px] text-neutral-500 font-sans">
              {language === "ZH"
                ? "没有邀请码？可在导师直播间或 Telegram/Discord 社区获取"
                : "Need an invite code? Ask your course provider or join our community"}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
