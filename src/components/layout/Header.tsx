"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  Search,
  ChevronDown,
  Zap,
} from "lucide-react";
import { CommandPalette } from "@/motion/components/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut listener for Mac (⌘K) and Windows (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (!user) {
          router.push("/login");
        } else {
          setCommandPaletteOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, router]);

  // Adaptive navbar compression on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide header completely during dedicated full-screen onboarding & login (AFTER all hooks)
  if (pathname === "/register" || pathname === "/login") {
    return null;
  }

  const NAV_LINKS = [
    { href: "/courses", label: t.navCourses, isPro: false },
    { href: "/pro-masterclass", label: t.navProTrading, isPro: true },
    { href: "/materials", label: t.navMaterials, isPro: false },
    { href: "/webinars", label: t.navWebinars, isPro: false },
    { href: "/traders", label: t.navTraders, isPro: false },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      router.push("/login");
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-[#0B0B0B]/95 backdrop-blur-md text-white border-b border-[#262626] transition-all duration-300 ${
          isScrolled ? "h-16 shadow-2xl" : "h-20"
        }`}
      >
        {/* Full-Bleed Edge-to-Edge Production Navbar */}
        <div className="w-full px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between gap-4 lg:gap-8">
          {/* Left Side: Pushed Brand Logo & Compact Single-Line Navigation */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0 focus:outline-none">
              <div className="w-9 h-9 bg-[#8BE000] text-black font-mono font-bold text-lg flex items-center justify-center tracking-tighter group-hover:scale-105 transition-transform">
                360°
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-xl tracking-tight text-white">
                  MARKETS
                </span>
                <span className="text-[9px] text-[#8BE000] tracking-widest font-mono uppercase mt-0.5">
                  STOCKS
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-mono min-w-0">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={user ? link.href : "/login"}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`transition-colors py-1 flex items-center gap-1.5 whitespace-nowrap font-medium relative focus:outline-none ${
                      isActive ? "text-[#8BE000] font-bold" : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#8BE000]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side: Raycast Search + Language Selector + User Profile Badge */}
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            {/* Sleek Raycast-Style Command Palette Trigger */}
            <button
              onClick={() => {
                if (!user) {
                  router.push("/login");
                } else {
                  setCommandPaletteOpen(true);
                }
              }}
              className="hidden md:flex items-center gap-2 bg-[#161616] border border-[#262626] hover:border-[#8BE000] px-3 py-2 text-xs font-mono text-neutral-400 transition group rounded-none h-9 w-44 lg:w-56 justify-between focus:outline-none"
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Search className="w-3.5 h-3.5 text-[#8BE000] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate whitespace-nowrap text-neutral-300 text-xs font-mono">
                  {language === "JA" ? "検索..." : language === "ZH" ? "搜索..." : "Search..."}
                </span>
              </div>
              <span className="bg-[#262626] border border-[#333333] text-[10px] text-white px-1.5 py-0.5 rounded-none font-bold shrink-0 font-mono">
                ⌘K
              </span>
            </button>

            {/* Minimal Language Selector */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 text-xs font-mono text-neutral-300 hover:text-[#8BE000] transition py-2 px-2.5 border border-[#262626] bg-[#161616] h-9 focus:outline-none"
              >
                {language === "EN" && <span className="font-bold text-white">EN $</span>}
                {language === "JA" && <span className="font-bold text-[#8BE000]">JA ¥</span>}
                {language === "ZH" && <span className="font-bold text-[#8BE000]">ZH ¥</span>}
                <ChevronDown className="w-3 h-3 text-neutral-500 ml-0.5" />
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-[#161616] border border-[#262626] shadow-2xl p-1 z-50 text-xs font-mono"
                  >
                    <button
                      onClick={() => {
                        setLanguage("EN");
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition focus:outline-none ${
                        language === "EN" ? "bg-[#8BE000] text-black font-bold" : "text-neutral-300 hover:bg-[#262626]"
                      }`}
                    >
                      <span>EN $ (USD)</span>
                      {language === "EN" && <span>✓</span>}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("JA");
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition focus:outline-none ${
                        language === "JA" ? "bg-[#8BE000] text-black font-bold" : "text-neutral-300 hover:bg-[#262626]"
                      }`}
                    >
                      <span>JA ¥ (JPY)</span>
                      {language === "JA" && <span>✓</span>}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("ZH");
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition focus:outline-none ${
                        language === "ZH" ? "bg-[#8BE000] text-black font-bold" : "text-neutral-300 hover:bg-[#262626]"
                      }`}
                    >
                      <span>ZH ¥ (CNY)</span>
                      {language === "ZH" && <span>✓</span>}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Badge or Sign In CTA */}
            {user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2.5 bg-[#161616] border border-[#262626] hover:border-[#8BE000] px-3 py-1.5 transition text-left h-9 shadow-lg focus:outline-none"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 object-cover border border-[#333333] shrink-0"
                  />
                  <div className="flex flex-col text-left leading-tight min-w-0">
                    <span className="text-xs font-semibold text-white flex items-center gap-1 font-sans truncate max-w-[100px] sm:max-w-[120px]">
                      {user.name}
                      {user.isCertified && <span className="text-[#8BE000] font-bold text-[10px]">✓</span>}
                    </span>
                    <span className="text-[9px] text-[#8BE000] uppercase font-mono font-bold tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5 shrink-0" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#161616] border border-[#262626] shadow-2xl p-2 z-50 text-xs font-mono">
                    <div className="p-3 border-b border-[#262626] bg-[#0B0B0B]">
                      <p className="font-semibold text-white font-sans text-sm">{user.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-2 space-y-1">
                      {role === "INVESTOR" && (
                        <Link href="/investor" onClick={() => setShowRoleMenu(false)} className="block px-3 py-2 text-neutral-300 hover:bg-[#262626] hover:text-[#8BE000] focus:outline-none">
                          {t.navTerminal}
                        </Link>
                      )}
                      {role === "TRADER" && (
                        <Link href="/trader" onClick={() => setShowRoleMenu(false)} className="block px-3 py-2 text-neutral-300 hover:bg-[#262626] hover:text-[#8BE000] focus:outline-none">
                          {t.navTraderHub}
                        </Link>
                      )}
                      {role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setShowRoleMenu(false)} className="block px-3 py-2 text-red-400 hover:bg-[#262626] focus:outline-none">
                          {t.navAdmin}
                        </Link>
                      )}

                      <div className="border-t border-[#262626] pt-1">
                        <button
                          onClick={async () => {
                            await signOut();
                            setShowRoleMenu(false);
                            router.push("/login");
                          }}
                          className="w-full text-left px-3 py-2 text-red-400 hover:bg-[#262626] focus:outline-none"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                <Link href="/login" className="text-neutral-300 hover:text-white px-3 py-1.5 focus:outline-none font-semibold">
                  Sign In
                </Link>
                <Link href="/register" className="btn-lime px-4 py-2 focus:outline-none font-bold">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal (⌘K on Mac) */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
}
