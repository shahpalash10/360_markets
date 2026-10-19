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
  KeyRound,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import { CommandPalette } from "@/motion/components/CommandPalette";
import { UnlockModal } from "@/components/modals/UnlockModal";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut, isUnlocked, unlockedCode } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  // Close mobile drawer and menus on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowRoleMenu(false);
    setShowLangMenu(false);
  }, [pathname]);

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

  // Hide header completely during dedicated full-screen onboarding & login
  if (pathname === "/register" || pathname === "/login") {
    return null;
  }

  const NAV_LINKS = [
    { href: "/user", label: "User App", isPro: false },
    { href: "/trader", label: "Trader App", isPro: true },
    { href: "/admin", label: "Admin App", isPro: false },
    { href: "/courses", label: t.navCourses, isPro: false },
    { href: "/signals", label: t.navSignals || "Signals", isPro: false },
    { href: "/pro-masterclass", label: t.navProTrading, isPro: true },
    { href: "/webinars", label: t.navWebinars, isPro: false },
  ];

  // Active VIP invitation status only applies when a user is authenticated
  const activeUnlocked = Boolean(user && isUnlocked);
  const activeCode = user ? unlockedCode : null;

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-[#0B0B0B]/95 backdrop-blur-md text-white border-b border-[#262626] transition-all duration-300 ${
          isScrolled ? "h-16 shadow-2xl" : "h-20"
        }`}
      >
        {/* Full-Bleed Edge-to-Edge Production Navbar */}
        <div className="w-full px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between gap-3 lg:gap-8">
          {/* Left Side: Brand Logo & Desktop Navigation */}
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
                  {t.headerStocks}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-mono min-w-0">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
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

          {/* Right Side: Command Trigger + Invitation Code + Language + User Profile + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Sleek Raycast-Style Command Palette Trigger (Desktop / Tablet) */}
            <button
              onClick={() => {
                if (!user) {
                  router.push("/login");
                } else {
                  setCommandPaletteOpen(true);
                }
              }}
              className="hidden md:flex items-center gap-2 bg-[#161616] border border-[#262626] hover:border-[#8BE000] px-3 py-2 text-xs font-mono text-neutral-400 transition group rounded-none h-9 w-40 lg:w-56 justify-between focus:outline-none"
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Search className="w-3.5 h-3.5 text-[#8BE000] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate whitespace-nowrap text-neutral-300 text-xs font-mono">
                  {t.headerSearch}
                </span>
              </div>
              <span className="bg-[#262626] border border-[#333333] text-[10px] text-white px-1.5 py-0.5 rounded-none font-bold shrink-0 font-mono">
                ⌘K
              </span>
            </button>

            {/* Role-Aware Invitation Code Action (Hidden on small mobile to prevent overlap; accessible via mobile menu) */}
            {role === "TRADER" ? (
              <Link
                href="/trader"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#8BE000]/40 bg-[#8BE000]/10 text-[#8BE000] hover:bg-[#8BE000]/20 transition shrink-0 h-9"
                title="Manage & Issue Subscriber VIP Passes"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#8BE000]" />
                <span className="font-bold">{t.headerIssueCodes}</span>
              </Link>
            ) : role === "ADMIN" ? (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#8BE000]/40 bg-[#8BE000]/10 text-[#8BE000] hover:bg-[#8BE000]/20 transition shrink-0 h-9"
                title="Manage All Platform Invitation Codes"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#8BE000]" />
                <span className="font-bold">{t.headerManageCodes}</span>
              </Link>
            ) : (
              <button
                onClick={() => setUnlockModalOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition shrink-0 h-9 focus:outline-none ${
                  activeUnlocked
                    ? "bg-[#8BE000]/15 border-[#8BE000] text-[#8BE000] hover:bg-[#8BE000]/25"
                    : "bg-[#161616] border-[#262626] hover:border-[#8BE000] text-neutral-300 hover:text-white"
                }`}
                title={activeUnlocked ? `Active VIP: ${activeCode}` : "Enter Educator Invitation Code"}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#8BE000]" />
                <span className="font-bold">
                  {activeUnlocked ? (activeCode ? `VIP: ${activeCode}` : `${t.commonActive} ✓`) : t.headerRedeemCode}
                </span>
              </button>
            )}

            {/* Language Selector */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 text-xs font-mono text-neutral-300 hover:text-[#8BE000] transition py-2 px-2 sm:px-2.5 border border-[#262626] bg-[#161616] h-9 focus:outline-none"
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
                  className="flex items-center gap-2 bg-[#161616] border border-[#262626] hover:border-[#8BE000] px-2.5 sm:px-3 py-1.5 transition text-left h-9 shadow-lg focus:outline-none"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 sm:w-6 sm:h-6 object-cover border border-[#333333] shrink-0"
                  />
                  <div className="hidden sm:flex flex-col text-left leading-tight min-w-0">
                    <span className="text-xs font-semibold text-white flex items-center gap-1 font-sans truncate max-w-[90px] sm:max-w-[120px]">
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
                          className="w-full text-left px-3 py-2 text-red-400 hover:bg-[#262626] focus:outline-none flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.headerSignOut}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs shrink-0">
                <Link href="/login" className="text-neutral-300 hover:text-white px-2.5 py-1.5 focus:outline-none font-semibold">
                  {t.headerSignIn}
                </Link>
                <Link href="/register" className="btn-lime px-3.5 py-2 focus:outline-none font-bold">
                  {t.headerGetStarted}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button (Visible on screens < lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden flex items-center justify-center w-9 h-9 bg-[#161616] border border-[#262626] hover:border-[#8BE000] text-neutral-200 hover:text-white transition focus:outline-none shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-[#8BE000]" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer Menu (No overlapping, full item access) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-b border-[#262626] bg-[#0E0E0E]/98 backdrop-blur-2xl px-5 py-6 space-y-6 overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              {/* Quick Search trigger */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!user) router.push("/login");
                  else setCommandPaletteOpen(true);
                }}
                className="w-full flex items-center justify-between bg-[#161616] border border-[#262626] p-3 text-xs font-mono text-neutral-300 hover:border-[#8BE000] transition"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#8BE000]" />
                  <span>{t.headerSearch}</span>
                </div>
                <span className="bg-[#262626] text-[10px] text-white px-2 py-0.5 font-bold font-mono">⌘K</span>
              </button>

              {/* Navigation Links */}
              <div className="space-y-1 font-mono text-xs">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block px-3 py-1 font-bold">
                  MENU DIRECTORY
                </span>
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-3 transition flex items-center justify-between border-l-2 ${
                        isActive
                          ? "border-[#8BE000] bg-[#161616] text-[#8BE000] font-bold"
                          : "border-transparent text-neutral-300 hover:bg-[#161616] hover:text-white"
                      }`}
                    >
                      <span className="text-sm">{link.label}</span>
                      {link.isPro && (
                        <span className="text-[10px] bg-[#8BE000] text-black font-bold px-2 py-0.5">PRO</span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Invitation Code Action */}
              <div className="pt-2 border-t border-[#222]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setUnlockModalOpen(true);
                  }}
                  className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-mono border transition ${
                    activeUnlocked
                      ? "bg-[#8BE000]/15 border-[#8BE000] text-[#8BE000]"
                      : "bg-[#161616] border-[#262626] hover:border-[#8BE000] text-neutral-300"
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-[#8BE000]" />
                  <span className="font-bold">
                    {activeUnlocked ? (activeCode ? `VIP ACCESS: ${activeCode}` : `${t.commonActive} ✓`) : t.headerRedeemCode}
                  </span>
                </button>
              </div>

              {/* User Account / Auth Section */}
              {user ? (
                <div className="pt-2 border-t border-[#222] space-y-3">
                  <div className="flex items-center gap-3 bg-[#161616] p-3 border border-[#262626]">
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 object-cover border border-[#333] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate flex items-center gap-1">
                        {user.name}
                        {user.isCertified && <span className="text-[#8BE000] font-bold text-xs">✓</span>}
                      </div>
                      <div className="text-[10px] text-[#8BE000] font-mono uppercase font-bold tracking-wider">{user.role}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {role === "INVESTOR" && (
                      <Link href="/investor" onClick={() => setMobileMenuOpen(false)} className="btn-black p-3 text-center border border-[#333] text-white">
                        {t.navTerminal}
                      </Link>
                    )}
                    {role === "TRADER" && (
                      <Link href="/trader" onClick={() => setMobileMenuOpen(false)} className="btn-black p-3 text-center border border-[#333] text-white">
                        {t.navTraderHub}
                      </Link>
                    )}
                    {role === "ADMIN" && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="btn-black p-3 text-center border border-[#333] text-red-400">
                        {t.navAdmin}
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await signOut();
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="p-3 text-center border border-red-900/60 bg-red-950/20 text-red-400 font-mono text-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.headerSignOut}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#222]">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-black p-3 text-center border border-[#333] text-white text-xs font-mono"
                  >
                    {t.headerSignIn}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-lime p-3 text-center text-black font-bold text-xs font-mono"
                  >
                    {t.headerGetStarted}
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Command Palette Modal (⌘K on Mac) */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Invitation Code Unlock Modal */}
      <UnlockModal isOpen={unlockModalOpen} onClose={() => setUnlockModalOpen(false)} />
    </>
  );
}
