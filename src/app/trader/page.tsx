"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  Radio,
  Send,
  KeyRound,
  DollarSign,
  Users,
  BookOpen,
  Video,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  Clock,
  Activity,
  ExternalLink,
  Layers,
  Receipt,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { ItemRecord, StrategySignalRecord, AccessCodeRecord, InvoiceRecord } from "@/lib/items-store";

export default function TraderStudioPage() {
  const { user } = useAuth();
  const { currency, t } = useLanguage();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "strategies" | "signals" | "courses" | "webinars" | "access_codes" | "invoices"
  >("overview");

  // Core Data States
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [signals, setSignals] = useState<StrategySignalRecord[]>([]);
  const [signalFrequencies, setSignalFrequencies] = useState({
    frequency24h: 0,
    frequency7d: 0,
    frequency30d: 0,
    totalCount: 0,
  });
  const [accessCodes, setAccessCodes] = useState<AccessCodeRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [financialStats, setFinancialStats] = useState({
    totalGmv: 0,
    totalPlatformDebt: 0,
    totalRedemptions: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Strategy Modal State (Strategy :: Item)
  const [showCreateStrategyModal, setShowCreateStrategyModal] = useState(false);
  const [stratName, setStratName] = useState("");
  const [stratDescription, setStratDescription] = useState("");
  const [stratPrice, setStratPrice] = useState<number>(299);
  const [stratCustomId, setStratCustomId] = useState("");
  const [stratCustomTopic, setStratCustomTopic] = useState("");
  const [isCreatingStrat, setIsCreatingStrat] = useState(false);
  const [stratError, setStratError] = useState("");

  // Signal Push State (Strategy ID, Signal -> ntfy.sh)
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [signalAction, setSignalAction] = useState<"BUY" | "SELL" | "HOLD" | "ALERT">("BUY");
  const [signalSymbol, setSignalSymbol] = useState("NVDA");
  const [signalEntryPrice, setSignalEntryPrice] = useState<number | "">("");
  const [signalTargetPrice, setSignalTargetPrice] = useState<number | "">("");
  const [signalStopLoss, setSignalStopLoss] = useState<number | "">("");
  const [signalRiskReward, setSignalRiskReward] = useState("1 : 2.5");
  const [signalTimeframe, setSignalTimeframe] = useState("4H / SWING");
  const [signalNotes, setSignalNotes] = useState("");
  const [signalTextCustom, setSignalTextCustom] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Access Code Issuance State
  const [issueItemId, setIssueItemId] = useState("");
  const [issueQuantity, setIssueQuantity] = useState<number>(5);
  const [isIssuingCodes, setIsIssuingCodes] = useState(false);
  const [issueFeedback, setIssueFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Clipboard & Visibility toggles
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedTopics, setRevealedTopics] = useState<Record<string, boolean>>({});

  // Signal history tag filter (e.g. S0, S1, S2...)
  const [selectedSignalTag, setSelectedSignalTag] = useState<string | null>(null);

  // Active Invoice View Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch all core studio data
  const loadStudioData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Items (Strategies, Courses, Webinars)
      const itemsRes = await fetch("/api/items");
      const itemsData = await itemsRes.json();
      if (itemsData.ok) {
        setItems(itemsData.items || []);
        if (itemsData.items.length > 0 && !selectedStrategyId) {
          const firstStrat = itemsData.items.find((i: ItemRecord) => i.type === "STRATEGY");
          if (firstStrat) {
            setSelectedStrategyId(firstStrat.strategyId || firstStrat.id);
          }
          if (!issueItemId) {
            setIssueItemId(itemsData.items[0].id);
          }
        }
      }

      // 2. Fetch Signals & Frequency History
      const sigRes = await fetch("/api/items/signals");
      const sigData = await sigRes.json();
      if (sigData.ok) {
        setSignals(sigData.signals || []);
        setSignalFrequencies({
          frequency24h: sigData.frequency24h || 0,
          frequency7d: sigData.frequency7d || 0,
          frequency30d: sigData.frequency30d || 0,
          totalCount: sigData.totalCount || 0,
        });
      }

      // 3. Fetch Single-Use Access Codes
      const codesRes = await fetch("/api/access-codes");
      const codesData = await codesRes.json();
      if (codesData.ok) {
        setAccessCodes(codesData.codes || []);
      }

      // 4. Fetch Invoices & Trader Account Debt Ledger
      const invRes = await fetch("/api/invoices");
      const invData = await invRes.json();
      if (invData.ok) {
        setInvoices(invData.invoices || []);
        setFinancialStats({
          totalGmv: invData.totalGmv || 0,
          totalPlatformDebt: invData.totalPlatformDebt || 0,
          totalRedemptions: invData.totalRedemptions || 0,
        });
      }
    } catch (err) {
      console.error("Trader studio data load error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [user]);

  // Handle Strategy Creation
  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stratName.trim()) {
      setStratError("Please provide a name for your quantitative strategy.");
      return;
    }

    setIsCreatingStrat(true);
    setStratError("");

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STRATEGY",
          name: stratName.trim(),
          description: stratDescription.trim(),
          price: Number(stratPrice) || 0,
          strategyId: stratCustomId.trim() || undefined,
          ntfyTopic: stratCustomTopic.trim() || undefined,
          traderId: user?.id || "trader",
          traderName: user?.displayName || user?.name || "Alex Morgan",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create strategy");
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setShowCreateStrategyModal(false);
      setStratName("");
      setStratDescription("");
      setStratCustomId("");
      setStratCustomTopic("");
      await loadStudioData();
      setActiveTab("strategies");
    } catch (err: any) {
      setStratError(err.message || "An error occurred while creating strategy.");
    } finally {
      setIsCreatingStrat(false);
    }
  };

  // Handle Signal Push to ntfy.sh
  const handleBroadcastSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategyId) {
      setBroadcastResult({ success: false, msg: "Please select a strategy to broadcast to." });
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);

    const generatedText =
      signalTextCustom.trim() ||
      `${signalAction} ${signalSymbol} @ $${signalEntryPrice || "MKT"} | TP: $${signalTargetPrice || "OPEN"} | SL: $${signalStopLoss || "NONE"}. ${signalNotes}`;

    try {
      const res = await fetch("/api/items/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: selectedStrategyId,
          signalText: generatedText,
          action: signalAction,
          symbol: signalSymbol.trim().toUpperCase(),
          entryPrice: signalEntryPrice ? Number(signalEntryPrice) : undefined,
          targetPrice: signalTargetPrice ? Number(signalTargetPrice) : undefined,
          stopLoss: signalStopLoss ? Number(signalStopLoss) : undefined,
          riskReward: signalRiskReward,
          timeframe: signalTimeframe,
          notes: signalNotes,
          traderId: user?.id || "trader",
          traderName: user?.displayName || user?.name || "Alex Morgan",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to push signal");
      }

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setBroadcastResult({
        success: true,
        msg: `Signal ${data.signal?.id} pushed live to private channel ${data.ntfyResult}!`,
      });
      setSignalNotes("");
      setSignalTextCustom("");
      await loadStudioData();
    } catch (err: any) {
      setBroadcastResult({ success: false, msg: err.message || "Broadcast failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Batch Single-Use Access Code Issuance
  const handleIssueAccessCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueItemId) {
      setIssueFeedback({ success: false, msg: "Please select an Item to issue access codes for." });
      return;
    }

    setIsIssuingCodes(true);
    setIssueFeedback(null);

    try {
      const res = await fetch("/api/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: issueItemId,
          quantity: Number(issueQuantity) || 1,
          traderId: user?.id || "trader",
          traderName: user?.displayName || user?.name || "Alex Morgan",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to issue access codes");
      }

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setIssueFeedback({
        success: true,
        msg: `Generated ${data.count} single-use access code(s)! Each can be redeemed exactly once.`,
      });
      await loadStudioData();
    } catch (err: any) {
      setIssueFeedback({ success: false, msg: err.message || "Failed to issue access codes" });
    } finally {
      setIsIssuingCodes(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const strategies = items.filter((i) => i.type === "STRATEGY");
  const courses = items.filter((i) => i.type === "COURSE");
  const webinars = items.filter((i) => i.type === "WEBINAR");

  // Filter signals if tag clicked
  const filteredSignals = selectedSignalTag
    ? signals.filter((s) => s.id === selectedSignalTag)
    : signals;

  return (
    <AuthGuard allowedRoles={["TRADER", "ADMIN"]}>
      <div className="min-h-screen bg-[#080808] text-white font-mono selection:bg-[#8BE000] selection:text-black">
        {/* Top Institutional Header */}
        <div className="border-b border-[#1E1E1E] bg-[#0C0C0C]/90 sticky top-16 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
                <span className="w-2 h-2 bg-[#8BE000] rounded-full inline-block animate-pulse" />
                <span>360° MARKETS TRADER WEB APP</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">INSTITUTIONAL QUANT STUDIO</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight uppercase mt-0.5">
                TRADER HUB & ENGINE.
              </h1>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setShowCreateStrategyModal(true)}
                className="bg-[#8BE000] text-black font-bold text-xs px-3.5 py-2 hover:bg-[#9BF500] transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Strategy</span>
              </button>

              <Link
                href="/trader/courses/new"
                className="bg-[#181818] border border-[#2E2E2E] hover:border-[#8BE000] text-white text-xs px-3.5 py-2 transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#8BE000]" />
                <span>Create Course</span>
              </Link>

              <Link
                href="/trader/webinars/new"
                className="bg-[#181818] border border-[#2E2E2E] hover:border-[#8BE000] text-white text-xs px-3.5 py-2 transition flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-[#8BE000]" />
                <span>Schedule Webinar</span>
              </Link>

              <button
                onClick={loadStudioData}
                disabled={isRefreshing}
                className="bg-[#121212] border border-[#262626] text-neutral-300 hover:text-white px-3 py-2 text-xs flex items-center gap-1.5 transition"
                title="Refresh Studio Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8BE000]" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>

          {/* Studio Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-[#1A1A1A] text-xs pt-1">
            {[
              { id: "overview", label: "Overview & Metrics", icon: Activity },
              { id: "strategies", label: `Strategies (${strategies.length})`, icon: Layers },
              { id: "signals", label: `Signal Broadcaster (${signals.length})`, icon: Radio },
              { id: "courses", label: `Courses (${courses.length})`, icon: BookOpen },
              { id: "webinars", label: `Webinars (${webinars.length})`, icon: Video },
              { id: "access_codes", label: `Single-Use Access Codes (${accessCodes.length})`, icon: KeyRound },
              { id: "invoices", label: `Invoices & Debt Ledger (${invoices.length})`, icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap transition border-b-2 font-mono ${
                    isActive
                      ? "border-[#8BE000] text-[#8BE000] font-bold bg-[#141414]"
                      : "border-transparent text-neutral-400 hover:text-white hover:bg-[#121212]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Financial & Debt Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span className="uppercase tracking-wider">Gross Volume (GMV)</span>
                    <DollarSign className="w-4 h-4 text-[#8BE000]" />
                  </div>
                  <div className="text-3xl font-display text-white">
                    {formatPrice(financialStats.totalGmv)}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Total market value of single-use codes redeemed across all items.
                  </p>
                </div>

                <div className="bg-[#111111] border border-amber-900/40 p-6 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 text-xs">
                    <span className="uppercase tracking-wider">Trader Account Debt</span>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-display text-amber-400">
                    {formatPrice(financialStats.totalPlatformDebt)}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Platform commission debt placed on trader account upon code redemption.
                  </p>
                </div>

                <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span className="uppercase tracking-wider">Single-Use Redemptions</span>
                    <KeyRound className="w-4 h-4 text-[#8BE000]" />
                  </div>
                  <div className="text-3xl font-display text-white">
                    {financialStats.totalRedemptions}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Guaranteed single-use redemptions tracked and invoiced.
                  </p>
                </div>

                <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span className="uppercase tracking-wider">Live Signal Velocity</span>
                    <Radio className="w-4 h-4 text-[#8BE000] animate-pulse" />
                  </div>
                  <div className="text-3xl font-display text-[#8BE000]">
                    {signalFrequencies.frequency24h} <span className="text-xs text-neutral-400">/ 24h</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    {signalFrequencies.frequency7d} in past 7d • {signalFrequencies.frequency30d} in past 30d
                  </p>
                </div>
              </div>

              {/* Quick Hub Launchers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4 hover:border-[#2E2E2E] transition">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-[#8BE000]/10 border border-[#8BE000]/30 flex items-center justify-center text-[#8BE000]">
                      <Radio className="w-5 h-5" />
                    </div>
                    <span className="text-xs bg-[#1C1C1C] px-2 py-0.5 text-neutral-300">
                      {strategies.length} Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-white">Quantitative Strategies</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-1">
                      Create strategies with secret ntfy channel topics and push live algorithmic signals.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("strategies")}
                    className="text-xs text-[#8BE000] flex items-center gap-1 hover:underline font-bold"
                  >
                    Manage Strategies →
                  </button>
                </div>

                <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4 hover:border-[#2E2E2E] transition">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Link
                      href="/trader/courses/new"
                      className="text-xs bg-[#8BE000] text-black font-bold px-2.5 py-1 hover:bg-[#9BF500]"
                    >
                      + Create Course
                    </Link>
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-white">Educational Curriculum</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-1">
                      Author comprehensive stock masterclasses with video modules and materials.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="text-xs text-[#8BE000] flex items-center gap-1 hover:underline font-bold"
                  >
                    View Curriculum ({courses.length}) →
                  </button>
                </div>

                <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4 hover:border-[#2E2E2E] transition">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <span className="text-xs bg-[#1C1C1C] px-2 py-0.5 text-neutral-300">
                      Single-Use Strict
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-white">Access Code Issuance</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-1">
                      Issue single-use access codes for items. Redeeming places debt on trader account and invoices.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("access_codes")}
                    className="text-xs text-[#8BE000] flex items-center gap-1 hover:underline font-bold"
                  >
                    Issue Codes ({accessCodes.length}) →
                  </button>
                </div>
              </div>

              {/* Portal Links Bar */}
              <div className="border border-[#1E1E1E] bg-[#141414] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Separate Platform Portals
                  </h4>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    Navigate easily between the dedicated portals of the 360° Markets ecosystem.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/user"
                    className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-white px-3.5 py-2 text-xs flex items-center gap-1.5 transition"
                  >
                    <span>Investor Portal (/user)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#8BE000]" />
                  </Link>
                  <Link
                    href="/admin"
                    className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-red-400 px-3.5 py-2 text-xs flex items-center gap-1.5 transition"
                  >
                    <span>Admin Portal (/admin)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 2. STRATEGIES TAB (Strategy :: Item) */}
          {activeTab === "strategies" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1E1E1E]">
                <div>
                  <h2 className="text-2xl font-display text-white">Quantitative Strategies</h2>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    Strategy :: Item =&gt; Strategy ID: string, ntfy.sh topic name: string. Secret channel code known only to trader until subscriber redemption.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateStrategyModal(true)}
                  className="bg-[#8BE000] text-black font-bold text-xs px-4 py-2.5 hover:bg-[#9BF500] flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Strategy</span>
                </button>
              </div>

              {strategies.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center space-y-3">
                  <Layers className="w-10 h-10 text-neutral-600 mx-auto" />
                  <p className="text-sm text-neutral-400">No quantitative strategies created yet.</p>
                  <button
                    onClick={() => setShowCreateStrategyModal(true)}
                    className="btn-lime text-black font-bold text-xs px-4 py-2 inline-block"
                  >
                    Create First Strategy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {strategies.map((strat) => {
                    const isTopicRevealed = revealedTopics[strat.id] || false;
                    return (
                      <div
                        key={strat.id}
                        className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] bg-[#181818] border border-[#2E2E2E] text-[#8BE000] px-2 py-0.5 font-bold">
                              ID: {strat.strategyId}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {formatPrice(strat.price)}
                            </span>
                          </div>

                          <h3 className="text-xl font-display text-white">{strat.name}</h3>
                          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                            {strat.description}
                          </p>

                          {/* Secret ntfy.sh Channel Topic */}
                          <div className="p-3 bg-[#090909] border border-[#222] space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-400 flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-[#8BE000]" />
                                <span>Private ntfy.sh Topic:</span>
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedTopics((prev) => ({
                                    ...prev,
                                    [strat.id]: !prev[strat.id],
                                  }))
                                }
                                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                              >
                                {isTopicRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isTopicRevealed ? "Hide" : "Reveal"}</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-[#8BE000]">
                              <span>
                                {isTopicRevealed ? strat.ntfyTopic : "•••••••••••••••••••• (Trader Secret)"}
                              </span>
                              {isTopicRevealed && strat.ntfyTopic && (
                                <button
                                  onClick={() => copyToClipboard(`https://ntfy.sh/${strat.ntfyTopic}`, strat.id)}
                                  className="text-neutral-400 hover:text-white p-1"
                                  title="Copy ntfy URL"
                                >
                                  {copiedId === strat.id ? (
                                    <Check className="w-3.5 h-3.5 text-[#8BE000]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 pt-2 border-t border-[#1C1C1C]">
                            <div>Subscribers: <span className="text-white font-bold">{strat.activeSubscribers || 0}</span></div>
                            <div>Signals Pushed: <span className="text-white font-bold">{strat.signalsCount || 0}</span></div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#1E1E1E] flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedStrategyId(strat.strategyId || strat.id);
                              setActiveTab("signals");
                            }}
                            className="bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] text-white text-xs px-3 py-1.5 flex items-center gap-1.5 transition"
                          >
                            <Send className="w-3 h-3 text-[#8BE000]" />
                            <span>Broadcast Signal</span>
                          </button>

                          <button
                            onClick={() => {
                              setIssueItemId(strat.id);
                              setActiveTab("access_codes");
                            }}
                            className="text-xs text-[#8BE000] hover:underline flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Issue Single-Use Code</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. SIGNAL BROADCASTER & RECENT HISTORY TAB */}
          {activeTab === "signals" && (
            <div className="space-y-8">
              {/* Top Frequency Indicators Bar */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E1E] pb-4">
                  <div>
                    <h2 className="text-xl font-display text-white flex items-center gap-2">
                      <Radio className="w-5 h-5 text-[#8BE000] animate-pulse" />
                      <span>Signal Velocity & Frequency Statistics</span>
                    </h2>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">
                      Show frequency of signals: past 24 hours, past week (7d), and past month (30d).
                    </p>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Total Broadcasts: <span className="text-white font-bold">{signalFrequencies.totalCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#090909] border border-[#222] p-4 text-center space-y-1">
                    <div className="text-[11px] text-neutral-400 uppercase tracking-widest">Past 24 Hours</div>
                    <div className="text-3xl font-display text-[#8BE000]">
                      {signalFrequencies.frequency24h}
                    </div>
                    <div className="text-[10px] text-neutral-500">Real-time signals pushed</div>
                  </div>

                  <div className="bg-[#090909] border border-[#222] p-4 text-center space-y-1">
                    <div className="text-[11px] text-neutral-400 uppercase tracking-widest">Past Week (7 Days)</div>
                    <div className="text-3xl font-display text-white">
                      {signalFrequencies.frequency7d}
                    </div>
                    <div className="text-[10px] text-neutral-500">Rolling 7-day volume</div>
                  </div>

                  <div className="bg-[#090909] border border-[#222] p-4 text-center space-y-1">
                    <div className="text-[11px] text-neutral-400 uppercase tracking-widest">Past Month (30 Days)</div>
                    <div className="text-3xl font-display text-white">
                      {signalFrequencies.frequency30d}
                    </div>
                    <div className="text-[10px] text-neutral-500">Monthly cumulative total</div>
                  </div>
                </div>
              </div>

              {/* Signal Broadcast Form (Strategy ID, Signal -> ntfy.sh) */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <h3 className="text-lg font-display text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#8BE000]" />
                    <span>Broadcast Signal to Strategy ntfy Channel</span>
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">
                    Target: Strategy ID::string, Signal::string -&gt; ntfy.sh
                  </span>
                </div>

                {broadcastResult && (
                  <div
                    className={`p-3 text-xs border flex items-center gap-2 ${
                      broadcastResult.success
                        ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                        : "bg-red-950/40 border-red-800 text-red-400"
                    }`}
                  >
                    {broadcastResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{broadcastResult.msg}</span>
                  </div>
                )}

                <form onSubmit={handleBroadcastSignal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Strategy ID Selector */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Select Strategy (Strategy ID) *
                      </label>
                      <select
                        value={selectedStrategyId}
                        onChange={(e) => setSelectedStrategyId(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      >
                        {strategies.map((s) => (
                          <option key={s.id} value={s.strategyId || s.id}>
                            [{s.strategyId}] {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Action *
                      </label>
                      <select
                        value={signalAction}
                        onChange={(e) => setSignalAction(e.target.value as any)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      >
                        <option value="BUY">BUY (Long Entry)</option>
                        <option value="SELL">SELL (Short / Exit)</option>
                        <option value="ALERT">ALERT (Stop / Target Update)</option>
                        <option value="HOLD">HOLD (Position Update)</option>
                      </select>
                    </div>

                    {/* Symbol */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Ticker Symbol *
                      </label>
                      <input
                        type="text"
                        value={signalSymbol}
                        onChange={(e) => setSignalSymbol(e.target.value)}
                        placeholder="e.g. NVDA, AAPL, 00700.HK"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                  </div>

                  {/* Quantitative Parameters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Entry Price ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={signalEntryPrice}
                        onChange={(e) => setSignalEntryPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="128.50"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Take Profit ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={signalTargetPrice}
                        onChange={(e) => setSignalTargetPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="145.00"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Stop Loss ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={signalStopLoss}
                        onChange={(e) => setSignalStopLoss(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="122.00"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Risk : Reward</label>
                      <input
                        type="text"
                        value={signalRiskReward}
                        onChange={(e) => setSignalRiskReward(e.target.value)}
                        placeholder="1 : 2.5"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                  </div>

                  {/* Notes / Signal Description */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                      Signal Analysis / Rationale
                    </label>
                    <textarea
                      rows={2}
                      value={signalNotes}
                      onChange={(e) => setSignalNotes(e.target.value)}
                      placeholder="e.g. 4H chart breakout confirmation with 2.8x volume surge and institutional dark pool support at $127."
                      className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-neutral-400">
                      Dispatches direct push to subscriber channel topic via HTTP POST.
                    </span>
                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="bg-[#8BE000] text-black font-bold text-xs px-6 py-2.5 hover:bg-[#9BF500] transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isBroadcasting ? "Pushing Signal..." : "Broadcast Signal Now"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Historical Signals: S0, S1, S2... S16 => S3, S8 (timestamp, signal) */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E1E1E] pb-4">
                  <div>
                    <h3 className="text-lg font-display text-white">Historical Signals Log</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">
                      Historical signals: S0, S1, S2, ... S16 =&gt; Filter specific identifiers (e.g. S3, S8) with timestamp and payload.
                    </p>
                  </div>

                  {/* Quick Tag Selector Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setSelectedSignalTag(null)}
                      className={`px-2 py-0.5 border text-[11px] transition ${
                        selectedSignalTag === null
                          ? "bg-[#8BE000] text-black font-bold border-[#8BE000]"
                          : "bg-[#181818] text-neutral-400 border-[#2E2E2E] hover:text-white"
                      }`}
                    >
                      ALL
                    </button>
                    {signals.slice(0, 10).map((sig) => (
                      <button
                        key={sig.id}
                        onClick={() => setSelectedSignalTag(selectedSignalTag === sig.id ? null : sig.id)}
                        className={`px-2 py-0.5 border text-[11px] transition ${
                          selectedSignalTag === sig.id
                            ? "bg-[#8BE000] text-black font-bold border-[#8BE000]"
                            : "bg-[#181818] text-neutral-400 border-[#2E2E2E] hover:text-white"
                        }`}
                      >
                        {sig.id}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredSignals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No signals found matching the current criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E1E] text-neutral-500 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Signal ID</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Strategy ID</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Payload / Signal</th>
                          <th className="py-2.5 px-3 text-right">Delivery Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {filteredSignals.map((sig) => (
                          <tr key={sig.id} className="hover:bg-[#161616] transition">
                            <td className="py-3 px-3 font-bold text-[#8BE000] whitespace-nowrap">
                              {sig.id}
                            </td>
                            <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                              {new Date(sig.timestamp).toLocaleDateString()} {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-3 text-white font-mono whitespace-nowrap">
                              {sig.strategyId}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 font-bold ${
                                  sig.action === "BUY"
                                    ? "bg-green-950 text-green-400 border border-green-800"
                                    : sig.action === "SELL"
                                    ? "bg-red-950 text-red-400 border border-red-800"
                                    : "bg-amber-950 text-amber-400 border border-amber-800"
                                }`}
                              >
                                {sig.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-neutral-300 max-w-md font-sans">
                              {sig.signalText}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <span className="text-[10px] text-[#8BE000] bg-[#8BE000]/10 border border-[#8BE000]/30 px-2 py-0.5">
                                {sig.ntfyStatus} (ntfy.sh)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. COURSES TAB (Course :: Item) */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1E1E1E]">
                <div>
                  <h2 className="text-2xl font-display text-white">Curriculum & Courses</h2>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    Course :: Item =&gt; Full course creation option for educator studio, module design, and single-use code issuance.
                  </p>
                </div>
                <Link
                  href="/trader/courses/new"
                  className="bg-[#8BE000] text-black font-bold text-xs px-4 py-2.5 hover:bg-[#9BF500] flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-neutral-600 mx-auto" />
                  <p className="text-sm text-neutral-400">No courses published yet.</p>
                  <Link
                    href="/trader/courses/new"
                    className="btn-lime text-black font-bold text-xs px-4 py-2 inline-block"
                  >
                    Launch First Course
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((crs) => (
                    <div
                      key={crs.id}
                      className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-black text-[#8BE000] font-bold px-2 py-0.5 border border-[#222]">
                            {crs.category || "Equities"}
                          </span>
                          <span className="text-xs text-white font-bold">{formatPrice(crs.price)}</span>
                        </div>

                        <h3 className="text-lg font-display text-white">{crs.name}</h3>
                        <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{crs.description}</p>

                        <div className="pt-2 text-xs text-neutral-400 flex items-center justify-between border-t border-[#1C1C1C]">
                          <span>Enrolled: <strong className="text-white">{crs.enrolledCount || 0}</strong></span>
                          <span>Level: <strong className="text-white">{crs.level || "All Levels"}</strong></span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
                        <button
                          onClick={() => {
                            setIssueItemId(crs.id);
                            setActiveTab("access_codes");
                          }}
                          className="bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] text-[#8BE000] text-xs px-3 py-1.5 flex items-center gap-1.5 transition"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Issue Single-Use Code</span>
                        </button>
                        <Link
                          href={`/courses/${crs.slug || crs.id}`}
                          className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
                        >
                          <span>Preview</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. WEBINARS TAB (Webinar :: Item) */}
          {activeTab === "webinars" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1E1E1E]">
                <div>
                  <h2 className="text-2xl font-display text-white">Live Masterclasses & Webinars</h2>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    Webinar :: Item =&gt; Schedule interactive live rooms, set capacity, and issue single-use passes.
                  </p>
                </div>
                <Link
                  href="/trader/webinars/new"
                  className="bg-[#8BE000] text-black font-bold text-xs px-4 py-2.5 hover:bg-[#9BF500] flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Webinar</span>
                </Link>
              </div>

              {webinars.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center space-y-3">
                  <Video className="w-10 h-10 text-neutral-600 mx-auto" />
                  <p className="text-sm text-neutral-400">No live webinars scheduled yet.</p>
                  <Link
                    href="/trader/webinars/new"
                    className="btn-lime text-black font-bold text-xs px-4 py-2 inline-block"
                  >
                    Schedule Live Session
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {webinars.map((web) => (
                    <div
                      key={web.id}
                      className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] bg-red-950 text-red-400 font-bold px-2 py-0.5 border border-red-800">
                            UPCOMING
                          </span>
                          <span className="text-xs text-white font-bold">{formatPrice(web.price)}</span>
                        </div>
                        <h3 className="text-xl font-display text-white">{web.name}</h3>
                        <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{web.description}</p>
                        <div className="text-xs text-neutral-400 space-y-1 font-mono pt-2 border-t border-[#1C1C1C]">
                          <div>Schedule: <strong className="text-white">{web.date} @ {web.startTime}</strong></div>
                          <div>Duration: <strong className="text-white">{web.durationMinutes} mins</strong></div>
                          <div>Capacity: <strong className="text-white">{web.filledSeats || 0} / {web.maxAttendees || 100}</strong> seats filled</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
                        <button
                          onClick={() => {
                            setIssueItemId(web.id);
                            setActiveTab("access_codes");
                          }}
                          className="bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] text-[#8BE000] text-xs px-3 py-1.5 flex items-center gap-1.5 transition"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Issue Single-Use Code</span>
                        </button>
                        <Link
                          href={web.meetingUrl || "/webinars"}
                          className="btn-lime text-black text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5"
                        >
                          <Radio className="w-3 h-3 text-black" />
                          <span>Go Live</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. SINGLE-USE ACCESS CODES TAB */}
          {activeTab === "access_codes" && (
            <div className="space-y-8">
              {/* Code Issuance Form */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <div>
                    <h3 className="text-lg font-display text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#8BE000]" />
                      <span>Issue Single-Use Access Codes for Item</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">
                      "Traders can issue access code for an item. Each access code can only be redeemed once."
                    </p>
                  </div>
                  <span className="text-xs text-[#8BE000] font-bold bg-[#8BE000]/10 border border-[#8BE000]/30 px-2 py-0.5">
                    Single-Use Guarantee (maxUses: 1)
                  </span>
                </div>

                {issueFeedback && (
                  <div
                    className={`p-3 text-xs border flex items-center gap-2 ${
                      issueFeedback.success
                        ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                        : "bg-red-950/40 border-red-800 text-red-400"
                    }`}
                  >
                    {issueFeedback.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{issueFeedback.msg}</span>
                  </div>
                )}

                <form onSubmit={handleIssueAccessCodes} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Item Selector */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Select Target Item (Strategy, Course, Webinar) *
                      </label>
                      <select
                        value={issueItemId}
                        onChange={(e) => setIssueItemId(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      >
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{it.type}] {it.name} — {formatPrice(it.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Quantity of Single-Use Codes to Generate
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={issueQuantity}
                        onChange={(e) => setIssueQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-neutral-400 font-sans">
                      Redeeming this code by an investor automatically generates an invoice and puts platform fee debt on your trader account.
                    </span>
                    <button
                      type="submit"
                      disabled={isIssuingCodes}
                      className="bg-[#8BE000] text-black font-bold text-xs px-6 py-2.5 hover:bg-[#9BF500] transition flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isIssuingCodes ? "Generating..." : "Generate Codes"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Issued Codes Table */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <h3 className="text-lg font-display text-white">Issued Single-Use Codes Ledger</h3>
                  <div className="text-xs text-neutral-400">
                    Total Codes: <span className="text-white font-bold">{accessCodes.length}</span>
                  </div>
                </div>

                {accessCodes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No access codes issued yet. Use the generator above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E1E] text-neutral-500 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Access Code</th>
                          <th className="py-2.5 px-3">Target Item</th>
                          <th className="py-2.5 px-3">Item Price</th>
                          <th className="py-2.5 px-3">Single-Use Status</th>
                          <th className="py-2.5 px-3">Redeemed By</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {accessCodes.map((cd) => (
                          <tr key={cd.id} className="hover:bg-[#161616] transition">
                            <td className="py-3 px-3 font-bold text-[#8BE000] font-mono whitespace-nowrap">
                              {cd.code}
                            </td>
                            <td className="py-3 px-3 text-white">
                              <span className="text-[10px] text-neutral-400 mr-1.5">[{cd.itemType}]</span>
                              <span>{cd.itemName}</span>
                            </td>
                            <td className="py-3 px-3 text-neutral-300 whitespace-nowrap">
                              {formatPrice(cd.itemPrice)}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {cd.isRedeemed ? (
                                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 border border-neutral-700">
                                  CONSUMED (1/1 USED)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#8BE000]/15 text-[#8BE000] px-2 py-0.5 border border-[#8BE000]/40 font-bold">
                                  AVAILABLE (0/1 USED)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                              {cd.redeemedByUserEmail || "Not yet redeemed"}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => copyToClipboard(cd.code, cd.id)}
                                className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white px-2.5 py-1 text-[11px] border border-[#333] transition"
                              >
                                {copiedId === cd.id ? "Copied ✓" : "Copy Code"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. INVOICING & TRADER ACCOUNT DEBT LEDGER TAB */}
          {activeTab === "invoices" && (
            <div className="space-y-8">
              {/* Debt Explanation Banner */}
              <div className="border border-amber-900/50 bg-[#140F04] p-6 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>Single-Use Redemption Account Debt Rule</span>
                </div>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  "Redeem an access code =&gt; Put a debt on the trader's account. We also do invoicing on this to track application performance."
                  When an investor redeems an access code, 360° Markets records the total item value ($GMV) and registers the 20% platform commission fee as an unsettled debt on the trader's ledger.
                </p>
              </div>

              {/* Debt & Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-1">
                  <div className="text-xs text-neutral-400 uppercase tracking-widest">Total Redemptions Volume</div>
                  <div className="text-3xl font-display text-white">{formatPrice(financialStats.totalGmv)}</div>
                  <div className="text-[11px] text-neutral-500">{financialStats.totalRedemptions} Access Codes Consumed</div>
                </div>

                <div className="bg-[#111111] border border-amber-900/50 p-6 space-y-1">
                  <div className="text-xs text-amber-400 uppercase tracking-widest">Platform Debt Outstanding</div>
                  <div className="text-3xl font-display text-amber-400">{formatPrice(financialStats.totalPlatformDebt)}</div>
                  <div className="text-[11px] text-neutral-500">20% Platform Fee Debt on Redemptions</div>
                </div>

                <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-1">
                  <div className="text-xs text-neutral-400 uppercase tracking-widest">Trader Net Value</div>
                  <div className="text-3xl font-display text-[#8BE000]">
                    {formatPrice(financialStats.totalGmv - financialStats.totalPlatformDebt)}
                  </div>
                  <div className="text-[11px] text-neutral-500">80% Net Platform Realization</div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <h3 className="text-lg font-display text-white">Itemized Redemptions & Debt Invoices</h3>
                  <div className="text-xs text-neutral-400">
                    Invoices Generated: <span className="text-white font-bold">{invoices.length}</span>
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No redemption invoices generated yet. Invoices appear as subscribers redeem access codes.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E1E] text-neutral-500 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Invoice No.</th>
                          <th className="py-2.5 px-3">Redeemed At</th>
                          <th className="py-2.5 px-3">Item Unlocked</th>
                          <th className="py-2.5 px-3">Access Code</th>
                          <th className="py-2.5 px-3">Item Price</th>
                          <th className="py-2.5 px-3">Trader Net</th>
                          <th className="py-2.5 px-3">Account Debt</th>
                          <th className="py-2.5 px-3 text-right">View</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#161616] transition">
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap font-mono">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                              {new Date(inv.redeemedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-white max-w-xs truncate">
                              <span className="text-[10px] text-neutral-400 mr-1">[{inv.itemType}]</span>
                              <span>{inv.itemName}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[#8BE000] whitespace-nowrap">
                              {inv.accessCode}
                            </td>
                            <td className="py-3 px-3 text-white whitespace-nowrap">
                              {formatPrice(inv.itemPrice)}
                            </td>
                            <td className="py-3 px-3 text-neutral-300 whitespace-nowrap">
                              {formatPrice(inv.traderNet)}
                            </td>
                            <td className="py-3 px-3 font-bold text-amber-400 whitespace-nowrap">
                              {formatPrice(inv.debtAmount)}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-white px-2.5 py-1 text-[11px]"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: CREATE QUANT STRATEGY (Strategy :: Item) */}
        <AnimatePresence>
          {showCreateStrategyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111111] border border-[#2E2E2E] w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <div>
                    <h3 className="text-xl font-display text-white">Create Quantitative Strategy</h3>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">
                      Strategy :: Item =&gt; Strategy ID: string, ntfy.sh topic name: string
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateStrategyModal(false)}
                    className="text-neutral-500 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {stratError && (
                  <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs">
                    {stratError}
                  </div>
                )}

                <form onSubmit={handleCreateStrategy} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                      Strategy Name *
                    </label>
                    <input
                      type="text"
                      value={stratName}
                      onChange={(e) => setStratName(e.target.value)}
                      placeholder="e.g. NVDA Institutional Volatility Breakout"
                      className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                      Description & Quantitative Edge
                    </label>
                    <textarea
                      rows={3}
                      value={stratDescription}
                      onChange={(e) => setStratDescription(e.target.value)}
                      placeholder="e.g. Algorithmic trend following across NASDAQ-100 equities with dynamic ATR stop-loss positioning."
                      className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Access Price ($)
                      </label>
                      <input
                        type="number"
                        value={stratPrice}
                        onChange={(e) => setStratPrice(Number(e.target.value))}
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                        Custom Strategy ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={stratCustomId}
                        onChange={(e) => setStratCustomId(e.target.value)}
                        placeholder="e.g. STRAT-NVDA-QUANT"
                        className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                      Secret ntfy.sh Topic Name (Optional — Auto-generated if left blank)
                    </label>
                    <input
                      type="text"
                      value={stratCustomTopic}
                      onChange={(e) => setStratCustomTopic(e.target.value)}
                      placeholder="e.g. 360m_strat_nvda_quant_882"
                      className="w-full bg-[#181818] border border-[#2E2E2E] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8BE000]"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      * Secret topic code: only you know this until an investor redeems an access code!
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setShowCreateStrategyModal(false)}
                      className="bg-[#1A1A1A] text-neutral-300 px-4 py-2 text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingStrat}
                      className="bg-[#8BE000] text-black font-bold text-xs px-6 py-2 hover:bg-[#9BF500] transition"
                    >
                      {isCreatingStrat ? "Creating..." : "Save Strategy"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: INVOICE VIEWER */}
        <AnimatePresence>
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111111] border border-[#2E2E2E] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#222] pb-4">
                  <div>
                    <span className="text-[10px] text-[#8BE000] font-bold tracking-widest uppercase">
                      360° MARKETS OFFICIAL INVOICE
                    </span>
                    <h3 className="text-xl font-display text-white mt-0.5">{selectedInvoice.invoiceNumber}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-neutral-500 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#222]">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">REDEEMED AT</span>
                      <span className="text-white">
                        {new Date(selectedInvoice.redeemedAt).toLocaleDateString()} {new Date(selectedInvoice.redeemedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">SUBSCRIBER</span>
                      <span className="text-white truncate block">{selectedInvoice.subscriberEmail}</span>
                    </div>
                  </div>

                  <div className="space-y-2 py-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Item Name:</span>
                      <span className="text-white font-bold">{selectedInvoice.itemName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Item Type:</span>
                      <span className="text-[#8BE000] font-bold">[{selectedInvoice.itemType}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Access Code Consumed:</span>
                      <span className="text-white font-mono">{selectedInvoice.accessCode}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] border border-[#222] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Gross Item Value (GMV):</span>
                      <span className="text-white font-bold">{formatPrice(selectedInvoice.itemPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Platform Fee (20%):</span>
                      <span className="text-amber-400 font-bold">{formatPrice(selectedInvoice.platformFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#222]">
                      <span className="text-neutral-300 font-bold">Trader Net Credited:</span>
                      <span className="text-[#8BE000] font-bold text-sm">{formatPrice(selectedInvoice.traderNet)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/20 border border-amber-900/40 text-amber-400 text-[11px] leading-relaxed">
                    Account Debt Status: <strong>{selectedInvoice.debtStatus}</strong>.
                    Debt of {formatPrice(selectedInvoice.debtAmount)} placed on trader account for single-use coupon settlement.
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-white px-5 py-2 text-xs"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
