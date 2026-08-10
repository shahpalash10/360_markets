"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  BookOpen,
  FileText,
  Video,
  Layers,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "NAVIGATION" | "TRADING PORTALS" | "PRODUCTS";
  icon: React.ReactNode;
  url: string;
  badge?: string;
  shortcut?: string;
  allowedRoles?: ("INVESTOR" | "TRADER" | "ADMIN")[];
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user, role } = useAuth();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ALL_COMMAND_ITEMS: CommandItem[] = [
    {
      id: "courses",
      title: t.navCourses || "Courses",
      subtitle: "Quantitative Stock Trading & Options Curriculum",
      category: "NAVIGATION",
      icon: <BookOpen className="w-4 h-4 text-[#8BE000]" />,
      url: "/courses",
      shortcut: "⌘1",
    },
    {
      id: "pro",
      title: t.navProTrading || "Pro Live",
      subtitle: "Real-Time Stock Market Open & Level-2 Stream",
      category: "TRADING PORTALS",
      icon: <Zap className="w-4 h-4 text-[#8BE000] fill-[#8BE000]" />,
      url: "/pro-masterclass",
      badge: "PRO MODE",
      shortcut: "⌘2",
    },
    {
      id: "materials",
      title: t.navMaterials || "Code & Models",
      subtitle: "Python Backtesting Engines & Options XLSX Models",
      category: "PRODUCTS",
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      url: "/materials",
      shortcut: "⌘3",
    },
    {
      id: "webinars",
      title: t.navWebinars || "Webinars",
      subtitle: "Live US Stock Open Sessions & Options Webinars",
      category: "PRODUCTS",
      icon: <Video className="w-4 h-4 text-red-400" />,
      url: "/webinars",
      shortcut: "⌘4",
    },
    {
      id: "traders",
      title: t.navTraders || "Traders",
      subtitle: "FINRA / SEC Verified Equity Educators Directory",
      category: "NAVIGATION",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      url: "/traders",
      shortcut: "⌘5",
    },
    {
      id: "investor",
      title: t.navTerminal || "Investor Terminal",
      subtitle: "Track Your Active Stock Courses & Certificates",
      category: "TRADING PORTALS",
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      url: "/investor",
      allowedRoles: ["INVESTOR"],
    },
    {
      id: "trader",
      title: t.navTraderHub || "Educator Hub",
      subtitle: "Educator Revenue Share & Course Analytics",
      category: "TRADING PORTALS",
      icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
      url: "/trader",
      allowedRoles: ["TRADER"],
    },
    {
      id: "admin",
      title: t.navAdmin || "Admin Governance Console",
      subtitle: "Platform Oversight, Audits & Financial Ledger",
      category: "TRADING PORTALS",
      icon: <ShieldCheck className="w-4 h-4 text-red-400" />,
      url: "/admin",
      allowedRoles: ["ADMIN"],
    },
  ];

  // Filter items strictly by active user role
  const roleFilteredItems = ALL_COMMAND_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(role);
  });

  const filteredItems = roleFilteredItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          router.push(filteredItems[selectedIndex].url);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, router, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        />

        {/* Solid Opaque Dark Centered Dialogue Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden text-white my-auto font-mono"
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#262626] bg-[#141414]">
            <Search className="w-5 h-5 text-[#8BE000] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === "JA"
                  ? "コース、コマンドを検索..."
                  : language === "ZH"
                  ? "搜索课程或命令..."
                  : "Search stock courses, traders, or commands..."
              }
              className="w-full bg-[#141414] text-white font-sans text-lg font-light focus:outline-none border-none ring-0 placeholder-neutral-500 tracking-tight"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 bg-[#262626] border border-[#333333] text-[10px] text-neutral-400 px-2 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1 font-mono text-xs bg-[#0F0F0F]">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 font-mono">
                No matching commands found.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.url);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-150 relative ${
                      isSelected
                        ? "bg-[#1E1E1E] border-l-2 border-[#8BE000] text-white shadow-md pl-3.5"
                        : "hover:bg-[#161616] text-neutral-300 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-md ${isSelected ? "bg-[#262626]" : "bg-[#161616]"}`}>
                        {item.icon}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-sans text-sm tracking-tight ${isSelected ? "text-white font-bold" : "text-neutral-200 font-medium"}`}>
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="bg-[#8BE000] text-black font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-none">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="text-[11px] text-neutral-400 truncate font-mono mt-0.5">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.shortcut && (
                        <span className="hidden sm:inline text-[10px] text-neutral-400 font-mono bg-[#161616] px-1.5 py-0.5 rounded border border-[#262626]">
                          {item.shortcut}
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-[#8BE000] translate-x-0.5" : "text-neutral-600"}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 bg-[#0A0A0A] border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <div className="flex items-center gap-4">
              <span><kbd className="bg-[#262626] px-1.5 py-0.5 rounded text-neutral-200">↑</kbd> <kbd className="bg-[#262626] px-1.5 py-0.5 rounded text-neutral-200">↓</kbd> Navigate</span>
              <span><kbd className="bg-[#262626] px-1.5 py-0.5 rounded text-neutral-200">↵</kbd> Select</span>
            </div>
            <div className="text-neutral-500 text-[10px]">
              Press <kbd className="bg-[#262626] px-1 py-0.5 rounded text-neutral-300">ESC</kbd> to exit
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
