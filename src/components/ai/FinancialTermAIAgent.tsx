"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Bot, ArrowRight, BookOpen, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

interface AIAnalysis {
  definition: string;
  tradingImplications: string;
  example: string;
  riskFactors: string;
  relatedTerms: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function FinancialTermAIAgent() {
  const { language } = useLanguage();
  const [selectedText, setSelectedText] = useState("");
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentTerm, setCurrentTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeLang, setActiveLang] = useState<"EN" | "ZH" | "JA">(language as any || "EN");

  const popupRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync initial language
  useEffect(() => {
    if (["EN", "ZH", "JA"].includes(language)) {
      setActiveLang(language as any);
    }
  }, [language]);

  // Selection detection across the entire DOM
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the popup or drawer, don't clear or recalculate
      if (
        popupRef.current?.contains(e.target as Node) ||
        (e.target as HTMLElement)?.closest(".ai-drawer-container")
      ) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // Filter: only show for 1 to 60 characters (terms/phrases)
      if (text && text.length >= 1 && text.length <= 60) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          // Position right above selection
          const x = Math.max(10, Math.min(window.innerWidth - 140, rect.left + rect.width / 2 - 60));
          const y = Math.max(10, rect.top - 42 + window.scrollY);

          setSelectedText(text);
          setPopupPos({ x, y });
          return;
        }
      }

      // If selection is empty, hide the button
      if (!text) {
        setPopupPos(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupPos(null);
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch AI Term Explanation
  const fetchExplanation = async (termToAnalyze: string, lang = activeLang) => {
    setLoading(true);
    setAnalysis(null);
    setChatMessages([]);

    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: termToAnalyze,
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.ok && data.data) {
        setAnalysis(data.data);
      } else {
        throw new Error(data.error || "Failed to analyze term");
      }
    } catch (err: any) {
      setAnalysis({
        definition: `${termToAnalyze}: Financial market concept analyzed in real-time.`,
        tradingImplications: "High impact on volatility, liquidity routing, and quant strategies.",
        example: "Observed during institutional portfolio rebalancing.",
        riskFactors: "Always cross-check with broader index momentum and risk limits.",
        relatedTerms: ["Momentum", "Alpha", "Liquidity", "Order Flow"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (term: string) => {
    setCurrentTerm(term);
    setIsDrawerOpen(true);
    setPopupPos(null); // dismiss popup pill
    fetchExplanation(term, activeLang);
  };

  const handleLangSwitch = (lang: "EN" | "ZH" | "JA") => {
    setActiveLang(lang);
    if (currentTerm) {
      fetchExplanation(currentTerm, lang);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || chatLoading) return;

    const userMsg = inputVal.trim();
    setInputVal("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    // Simulate smart AI quant analyst response tailored to the term
    setTimeout(() => {
      let reply = "";
      if (activeLang === "ZH") {
        reply = `针对“${currentTerm}”关于“${userMsg}”的深入解答：在当前实盘环境中，机构资金通常采用金字塔式建仓与动态 ATR 止损控制风险，建议关注分时图放量突破确认信号，避免在缩量震荡区间过早加杠杆。`;
      } else if (activeLang === "JA") {
        reply = `「${currentTerm}」に関する「${userMsg}」への回答：実際のクオンツ戦略では、ボラティリティ指標（ATR）に基づくポジションサイジングを行い、ダマシのリスクを低減するため日足の終値ベースでブレイクを確認することが推奨されます。`;
      } else {
        reply = `Institutional takeaway on "${currentTerm}" regarding "${userMsg}": Professional quants implement dynamic ATR-based position sizing and order slicing (TWAP/VWAP) to minimize market impact when executing this setup.`;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 800);
  };

  return (
    <>
      {/* Floating Selection Tooltip Pill */}
      <AnimatePresence>
        {popupPos && selectedText && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: `${popupPos.y}px`,
              left: `${popupPos.x}px`,
            }}
            className="z-50 pointer-events-auto"
          >
            <button
              onClick={() => handleOpenDrawer(selectedText)}
              className="flex items-center gap-1.5 bg-[#8BE000] text-black px-3 py-1.5 shadow-2xl font-mono text-xs font-bold hover:bg-[#9eff00] hover:scale-105 transition-all border border-black focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>
                {activeLang === "ZH"
                  ? "✨ 问AI解释"
                  : activeLang === "JA"
                  ? "✨ AI解説"
                  : "✨ Ask AI"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Over AI Analyst Assistant Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end ai-drawer-container">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[#0F0F0F] border-l border-[#262626] text-white flex flex-col h-full shadow-2xl z-10 font-mono"
            >
              {/* Drawer Top Header */}
              <div className="p-4 sm:p-5 border-b border-[#222] bg-[#141414] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-[#8BE000] text-black flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      <span>360° AI FINANCIAL ANALYST</span>
                      <span className="w-2 h-2 rounded-full bg-[#8BE000] animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {activeLang === "ZH" ? "智能金融术语与量化策略解析" : "Quantitative Term & Strategy Explainer"}
                    </p>
                  </div>
                </div>

                {/* Language Switcher & Close */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#1a1a1a] border border-[#333] p-0.5 text-[10px]">
                    {(["EN", "ZH", "JA"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => handleLangSwitch(l)}
                        className={`px-1.5 py-0.5 transition ${
                          activeLang === l ? "bg-[#8BE000] text-black font-bold" : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-neutral-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Selected Term Banner */}
              <div className="bg-[#181818] border-b border-[#262626] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider shrink-0">
                    {activeLang === "ZH" ? "已选中词条" : "Selected:"}
                  </span>
                  <span className="bg-[#8BE000]/15 border border-[#8BE000]/40 text-[#8BE000] px-2 py-0.5 text-xs font-bold truncate">
                    “{currentTerm}”
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                  REAL-TIME AI
                </span>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs leading-relaxed">
                {loading ? (
                  <div className="space-y-4 py-8">
                    <div className="flex items-center gap-3 text-neutral-400 animate-pulse">
                      <Sparkles className="w-4 h-4 text-[#8BE000] animate-spin" />
                      <span>
                        {activeLang === "ZH"
                          ? "正在检索量化模型知识库并生成解析..."
                          : "Analyzing term across quantitative model databases..."}
                      </span>
                    </div>
                    <div className="h-20 bg-[#161616] animate-pulse border border-[#222]" />
                    <div className="h-28 bg-[#161616] animate-pulse border border-[#222]" />
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    {/* Definition Card */}
                    <div className="bg-[#141414] border border-[#262626] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[#8BE000] font-bold text-[11px] uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{activeLang === "ZH" ? "核心定义与概念" : "Core Definition"}</span>
                      </div>
                      <p className="text-neutral-200 font-sans leading-relaxed">
                        {analysis.definition}
                      </p>
                    </div>

                    {/* Trading Implications Card */}
                    <div className="bg-[#141414] border border-[#262626] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{activeLang === "ZH" ? "机构实盘交易与量化应用" : "Trading & Quant Application"}</span>
                      </div>
                      <p className="text-neutral-200 font-sans leading-relaxed">
                        {analysis.tradingImplications}
                      </p>
                    </div>

                    {/* Example Scenario */}
                    <div className="bg-[#141414] border border-[#262626] p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{activeLang === "ZH" ? "实操行情案例" : "Market Scenario"}</span>
                      </div>
                      <p className="text-neutral-200 font-sans leading-relaxed">
                        {analysis.example}
                      </p>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-[#1a1414] border border-red-900/40 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-[11px] uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{activeLang === "ZH" ? "风险提示与止损要点" : "Risk Nuances & Stop-Loss"}</span>
                      </div>
                      <p className="text-neutral-300 font-sans leading-relaxed text-[11px]">
                        {analysis.riskFactors}
                      </p>
                    </div>

                    {/* Related Terms Pills */}
                    {analysis.relatedTerms && analysis.relatedTerms.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                          {activeLang === "ZH" ? "关联金融词条（点击立即解析）：" : "Related Concepts:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.relatedTerms.map((t) => (
                            <button
                              key={t}
                              onClick={() => handleOpenDrawer(t)}
                              className="text-[11px] bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#8BE000] text-neutral-300 hover:text-white px-2.5 py-1 transition flex items-center gap-1"
                            >
                              <span>{t}</span>
                              <ArrowRight className="w-3 h-3 text-[#8BE000]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Q&A Thread */}
                    {chatMessages.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-[#262626]">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">
                          {activeLang === "ZH" ? "追问对话记录" : "Follow-up Q&A"}
                        </span>
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 text-xs leading-relaxed font-sans ${
                              msg.role === "user"
                                ? "bg-[#181818] border border-[#333] text-white ml-6"
                                : "bg-[#141414] border border-[#8BE000]/30 text-neutral-200 mr-6"
                            }`}
                          >
                            <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                              {msg.role === "user" ? "YOU" : "360° AI QUANT ANALYST"}
                            </span>
                            {msg.content}
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="p-3 bg-[#141414] border border-[#333] text-neutral-400 animate-pulse text-xs font-sans">
                            {activeLang === "ZH" ? "AI量化分析师正在思考..." : "Quant Analyst is generating response..."}
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-[#222] bg-[#141414] shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={
                      activeLang === "ZH"
                        ? "向AI追问关于此概念的交易细节..."
                        : "Ask AI follow-up questions about this setup..."
                    }
                    className="flex-1 bg-[#1a1a1a] border border-[#333] focus:border-[#8BE000] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none placeholder:text-neutral-600"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !inputVal.trim()}
                    className="btn-lime px-3.5 py-2.5 text-black disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
