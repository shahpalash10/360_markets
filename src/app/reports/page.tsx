"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = "rk_0e8f2500d54f9bb5960c1fe537ddde6f";
const BASE_URL = `https://report.tradingeasy.cn/api/${API_KEY}/latest`;

interface ReportInsight {
  summary: string;
  level: string;
  stars?: string;
  status?: string;
  action?: string;
}

interface ReportItem {
  filename: string;
  title: string;
  date: string;
  time: string;
  slot: string;
  market: "cn" | "us" | "weekend";
  mtime: number;
  size_kb: number;
  url: string;
  insights?: ReportInsight[];
  content?: string;
}

interface ApiResponse {
  ok: boolean;
  date: string;
  count: number;
  available_dates: string[];
  reports: ReportItem[];
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const { isUnlocked } = useAuth();

  const [reportsData, setReportsData] = useState<ApiResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<"all" | "cn" | "us" | "weekend">("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Reading Modal State
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalContent, setModalContent] = useState<string>("");

  // Fetch reports list for given date & market
  const fetchReports = async (dateParam?: string, typeParam: string = "all") => {
    setLoading(true);
    setErrorMsg("");

    try {
      const params = new URLSearchParams();
      if (dateParam) params.set("date", dateParam);
      if (typeParam !== "all") params.set("type", typeParam);

      const url = `${BASE_URL}?${params.toString()}`;
      const res = await fetch(url);
      const data: ApiResponse = await res.json();

      if (data.ok) {
        setReportsData(data);
        if (!selectedDate && data.date) {
          setSelectedDate(data.date);
        }
      } else {
        throw new Error("Unable to fetch research reports");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load research reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(undefined, selectedMarket);
  }, [selectedMarket]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchReports(newDate, selectedMarket);
  };

  // Open Full Report Reader
  const handleOpenReport = async (report: ReportItem) => {
    setActiveReport(report);
    setModalLoading(true);
    setModalContent("");

    try {
      // Fetch full Markdown source with content=1
      const res = await fetch(`${BASE_URL}?date=${report.date}&content=1`);
      const data: ApiResponse = await res.json();
      if (data.ok && data.reports) {
        const full = data.reports.find((r) => r.filename === report.filename);
        if (full?.content) {
          setModalContent(full.content);
        } else {
          setModalContent("# " + report.title + "\n\n" + (report.insights?.map((i) => `- ${i.level}: ${i.summary}`).join("\n\n") || ""));
        }
      }
    } catch (err) {
      setModalContent("# " + report.title + "\n\n" + (report.insights?.map((i) => `- ${i.level}: ${i.summary}`).join("\n\n") || ""));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white py-16 font-mono selection:bg-[#8BE000] selection:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section */}
        <div className="border-b border-[#222] pb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-mono text-[#8BE000] bg-[#141414] border border-[#262626] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {language === "ZH"
                  ? "实时机构投研数据源"
                  : language === "JA"
                  ? "機関投資家リサーチデータ"
                  : "INSTITUTIONAL RESEARCH DESK"}
              </span>
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchReports(selectedDate, selectedMarket)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-[#141414] border border-[#262626] px-3 py-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>

          <SplitTextReveal
            lines={
              language === "ZH"
                ? ["每日盘前盘后", "深度投研机会挖掘."]
                : language === "JA"
                ? ["日次株式リサーチ", "投資インサイトレポート."]
                : ["DAILY MARKET REPORTS &", "INVESTMENT INSIGHTS."]
            }
            className="text-4xl lg:text-5xl font-display font-light tracking-tight text-white"
          />

          <p className="text-xs text-neutral-400 max-w-2xl font-sans leading-relaxed">
            {language === "ZH"
              ? "直接接入机构级投研研报服务（A股盘前盘后、美股盘前及周末特刊），自动提炼核心主线逻辑与胜率模型。支持划词即时唤醒 AI 助手解析金融术语与量化策略。"
              : language === "JA"
              ? "A株および米国株式市場の寄り付き前・大引け後リサーチレポートを配信。気になる専門用語を選択するとAIアシスタントが即座に解説します。"
              : "Direct read-only feed of institutional investment research reports (A-share pre-market/close, US pre-market, and weekend specials). Highlight any phrase to summon the AI Financial Analyst."}
          </p>

          {/* AI Explainer Callout Notice */}
          <div className="bg-[#121212] border border-[#262626] p-3 text-xs flex items-center gap-2.5 text-neutral-300">
            <span className="bg-[#8BE000] text-black text-[10px] font-bold px-2 py-0.5 shrink-0">
              AI TIP
            </span>
            <span className="font-sans text-[11px] text-neutral-300">
              {language === "ZH"
                ? "💡 提示：在研报中划选任何金融术语（如“动量”、“地缘溢价”、“回踩确认”），即可一键呼出 AI 量化分析师获取深度解析。"
                : "💡 Tip: Select/highlight any financial term in the report to summon the interactive AI Quant Analyst."}
            </span>
          </div>
        </div>

        {/* Filter Bar: Markets & Available Dates */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#111111] border border-[#222] p-4">
          {/* Market Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Markets" },
              { id: "cn", label: "🇨🇳 A-Share (CN)" },
              { id: "us", label: "🇺🇸 US Market (US)" },
              { id: "weekend", label: "☕ Weekend Specials" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMarket(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-mono transition ${
                  selectedMarket === tab.id
                    ? "bg-[#8BE000] text-black font-bold"
                    : "bg-[#181818] border border-[#262626] text-neutral-300 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dates Bar */}
          {reportsData?.available_dates && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest shrink-0">
                DATE:
              </span>
              <div className="flex items-center gap-1.5">
                {reportsData.available_dates.slice(0, 7).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDateChange(d)}
                    className={`px-2.5 py-1 text-xs font-mono transition shrink-0 ${
                      (selectedDate || reportsData.date) === d
                        ? "bg-white text-black font-bold"
                        : "bg-[#161616] border border-[#262626] text-neutral-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reports Content Stream */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-12">
            {[1, 2].map((n) => (
              <div key={n} className="bg-[#121212] border border-[#222] p-8 space-y-4 animate-pulse">
                <div className="h-4 bg-[#222] w-24" />
                <div className="h-6 bg-[#222] w-3/4" />
                <div className="h-20 bg-[#181818]" />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="bg-red-950/40 border border-red-800 p-6 text-red-300 text-xs text-center space-y-2">
            <p>{errorMsg}</p>
            <button
              onClick={() => fetchReports()}
              className="btn-lime px-4 py-2 text-xs font-bold inline-block"
            >
              Retry Connection
            </button>
          </div>
        ) : reportsData?.reports && reportsData.reports.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportsData.reports.map((report) => (
              <motion.div
                key={report.filename}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111111] border border-[#262626] hover:border-[#8BE000] p-6 flex flex-col justify-between transition-all group space-y-6"
              >
                <div className="space-y-4">
                  {/* Top Meta Badges */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1f1f1f] border border-[#333] px-2.5 py-0.5 font-bold text-white text-[11px]">
                        {report.slot || report.time}
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                        {report.market === "cn" ? "A-SHARE" : report.market === "us" ? "US MARKET" : "SPECIAL"}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {report.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold font-sans text-white group-hover:text-[#8BE000] transition-colors leading-snug">
                    {report.title}
                  </h3>

                  {/* Key Takeaways & Insight Chips */}
                  {report.insights && report.insights.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                        {language === "ZH" ? "核心投资线索 (TOP INSIGHTS):" : "KEY SIGNALS & TAKEAWAYS:"}
                      </span>
                      <div className="space-y-1.5">
                        {report.insights.map((ins, idx) => (
                          <div
                            key={idx}
                            className="bg-[#161616] border border-[#222] p-2.5 text-xs font-sans text-neutral-200 flex items-start gap-2"
                          >
                            <span className="text-[10px] bg-[#222] text-[#8BE000] px-1.5 py-0.5 font-mono shrink-0">
                              {ins.level}
                            </span>
                            <span className="leading-snug">{ins.summary}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-[#222] flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    SIZE: {report.size_kb} KB
                  </span>

                  <button
                    onClick={() => handleOpenReport(report)}
                    className="btn-lime text-xs px-5 py-2.5 font-bold flex items-center gap-1.5 group-hover:scale-105 transition-transform"
                  >
                    <span>{language === "ZH" ? "阅读研报全文" : "Read Full Report"}</span>
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-16 border border-[#222] bg-[#111] text-center space-y-3">
            <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
            <h4 className="text-lg font-bold text-white uppercase">No Reports Published</h4>
            <p className="text-xs text-neutral-400 font-sans">
              There are no research reports available for the selected market or date ({selectedDate}).
            </p>
          </div>
        )}
      </div>

      {/* Full Markdown Report Reader Modal */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReport(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#111111] border border-[#262626] text-white flex flex-col shadow-2xl z-10 font-mono overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-6 border-b border-[#222] bg-[#141414] flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#8BE000] text-black text-[10px] font-bold px-2 py-0.5">
                      {activeReport.slot}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {activeReport.date} {activeReport.time}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1 font-sans">
                    {activeReport.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={activeReport.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-[#1a1a1a] border border-[#333] px-3 py-1.5 transition"
                  >
                    <span>Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveReport(null)}
                    className="p-1 text-neutral-400 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Reader Guidance Pill */}
              <div className="bg-[#161616] border-b border-[#222] px-6 py-2.5 text-xs text-neutral-400 flex items-center justify-between">
                <span className="text-[11px] font-sans text-neutral-300">
                  ✨ Highlight any phrase to analyze with the 360° AI Quant Analyst
                </span>
                <span className="text-[10px] text-[#8BE000] font-mono">
                  READER ACTIVE
                </span>
              </div>

              {/* Report Markdown Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-sm font-sans text-neutral-200 leading-relaxed selection:bg-[#8BE000] selection:text-black">
                {modalLoading ? (
                  <div className="py-20 text-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-[#8BE000] animate-spin mx-auto" />
                    <p className="text-xs font-mono text-neutral-400">Loading research note...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-neutral-200 leading-relaxed space-y-4">
                    {modalContent}
                  </div>
                )}
              </div>

              {/* Bottom Footer */}
              <div className="p-4 border-t border-[#222] bg-[#141414] flex items-center justify-between text-xs text-neutral-500 shrink-0 font-mono">
                <span>360° MARKETS • INVESTMENT RESEARCH PORTAL</span>
                <button
                  onClick={() => setActiveReport(null)}
                  className="btn-lime px-4 py-2 text-xs font-bold"
                >
                  Close Reader
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
