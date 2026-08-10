"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_USERS } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { setUserProfile } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Localized Login Content Dictionary
  const LOGIN_TRANSLATIONS = {
    EN: {
      secureSession: "SECURE SESSION AUTHENTICATION",
      title1: "SIGN IN TO",
      title2: "TERMINAL.",
      subText: "Access your stock knowledge portfolio, trading models, and live sessions.",
      labelEmail: "EMAIL ADDRESS",
      labelPass: "PASSWORD",
      btnText: "Sign In",
      authenticating: "Authenticating...",
      noAccount: "Don't have an account?",
      createAccount: "Create account →",
      errorDefault: "Authentication failed.",
    },
    JA: {
      secureSession: "セキュアセッション認証",
      title1: "ターミナルに",
      title2: "サインイン。",
      subText: "株式知識ポートフォリオ、トレードモデル、ライブ配信にアクセスします。",
      labelEmail: "メールアドレス",
      labelPass: "パスワード",
      btnText: "サインイン",
      authenticating: "認証中...",
      noAccount: "アカウントをお持ちでないですか？",
      createAccount: "アカウントを作成 →",
      errorDefault: "認証に失敗しました。",
    },
    ZH: {
      secureSession: "安全会话身份验证",
      title1: "登录到您的",
      title2: "交易终端。",
      subText: "访问您的股票知识投资组合、交易模型和实时研讨会直播。",
      labelEmail: "电子邮箱",
      labelPass: "密码",
      btnText: "登录",
      authenticating: "正在验证身份...",
      noAccount: "还没有账号？",
      createAccount: "创建账号 →",
      errorDefault: "身份验证失败。",
    },
  };

  const ot = LOGIN_TRANSLATIONS[language] || LOGIN_TRANSLATIONS.EN;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Supabase Real Database Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Invalid email or password credentials.");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Fetch real database profile from Supabase
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        const userRole = profile?.role || "INVESTOR";
        setUserProfile({
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.display_name || "User",
          firstName: profile?.first_name || "User",
          lastName: profile?.last_name || "",
          displayName: profile?.display_name || "User",
          role: userRole,
          title: userRole === "TRADER" ? "Stock Educator" : userRole === "ADMIN" ? "Head of Operations" : "Stock Investor",
          avatarUrl: profile?.avatar_url || DEMO_USERS.investor.avatarUrl,
          country: profile?.country || "United States",
          language: profile?.language || "EN",
          onboardingCompleted: profile?.onboarding_completed ?? true,
          onboardingStep: 4,
        });

        setIsLoading(false);
        // Default redirect on login: Launch Home Page (/)
        router.push("/");
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMsg(e.message || ot.errorDefault);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-between p-6 sm:p-12 font-mono relative overflow-hidden select-none">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8BE000]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Shell Bar */}
      <header className="w-full flex items-center justify-between z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#8BE000] text-black font-bold text-lg flex items-center justify-center tracking-tighter group-hover:scale-105 transition-transform">
            360°
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            MARKETS
          </span>
        </Link>

        {/* Global Language Selector (EN, JA, ZH) */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#222] p-1 text-[10px]">
          {(["EN", "JA", "ZH"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 font-bold transition-all ${
                language === lang ? "bg-[#8BE000] text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Full-Screen Production Login Body */}
      <main className="my-auto py-12 max-w-md w-full mx-auto z-20 space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 border border-[#8BE000] bg-black px-3 py-1 text-xs text-[#8BE000] font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>{ot.secureSession}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-display font-light text-white tracking-tight leading-none pt-2 uppercase">
            {ot.title1}<br />
            <span className="text-[#8BE000] font-normal">{ot.title2}</span>
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {ot.subText}
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-950/90 border border-red-500 text-red-200 text-xs font-mono"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 text-xs">
          <div className="space-y-2">
            <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              {ot.labelEmail}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="palash@investor.io"
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-4 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                {ot.labelPass}
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-4 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-lime w-full py-4 font-bold text-sm text-black flex items-center justify-center gap-2 group"
          >
            <span>{isLoading ? ot.authenticating : ot.btnText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
          </button>
        </form>

        <div className="text-center text-xs text-neutral-400 pt-2">
          {ot.noAccount}{" "}
          <Link href="/register" className="text-[#8BE000] underline font-semibold hover:text-white">
            {ot.createAccount}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex items-center justify-between text-xs text-neutral-500 z-20 border-t border-[#262626] pt-6">
        <div>360° MARKETS PLATFORM • FINRA / SEC COMPLIANT SESSION</div>
      </footer>
    </div>
  );
}
