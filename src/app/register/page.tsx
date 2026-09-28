"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, Role, UserProfile, DEMO_USERS } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  User,
  GraduationCap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { setUserProfile, unlockWithCode } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Form Fields State
  const [role, setRole] = useState<Role>("INVESTOR");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Multi-Language Registration Content
  const TRANSLATIONS = {
    EN: {
      badge: "INSTANT ACCESS REGISTRATION",
      title1: "JOIN",
      title2: "360° MARKETS.",
      subText: "Start learning from certified stock educators or host live quantitative masterclasses.",
      roleInvestor: "Investor / Student",
      roleInvestorDesc: "Learn quant trading, download models & join live streams",
      roleTrader: "Educator / Quant",
      roleTraderDesc: "Host masterclasses, sell algorithms & monetize expertise",
      labelFirstName: "FIRST NAME",
      labelLastName: "LAST NAME",
      labelEmail: "EMAIL ADDRESS",
      labelPass: "PASSWORD (MIN 6 CHARACTERS)",
      labelInviteCode: "INVITATION CODE (OPTIONAL — UNLOCKS ALL COURSES & SIGNALS)",
      btnCreate: "Create Free Account",
      btnCreating: "Creating Session...",
      hasAccount: "Already have an account?",
      signIn: "Sign in →",
      orDivider: "OR CONTINUE WITH EMAIL",
      googleSSO: "Continue with Google",
      githubSSO: "Continue with GitHub",
      termsNotice: "By signing up, you agree to our Terms of Service & Privacy Policy.",
      valFields: "Please fill in all required fields.",
      valPass: "Password must be at least 6 characters.",
    },
    JA: {
      badge: "インスタントアクセス登録",
      title1: "360° MARKETSに",
      title2: "参加する。",
      subText: "認証済み株式エデュケーターから学ぶか、クオンツマスタークラスを主催します。",
      roleInvestor: "受講生 / 個人投資家",
      roleInvestorDesc: "クオンツトレードを学び、モデルをダウンロード、ライブ配信に参加",
      roleTrader: "エデュケーター / クオンツ",
      roleTraderDesc: "マスタークラスの主催、アルゴリズムの販売、収益化",
      labelFirstName: "名（FIRST NAME）",
      labelLastName: "姓（LAST NAME）",
      labelEmail: "メールアドレス",
      labelPass: "パスワード（6文字以上）",
      labelInviteCode: "招待コード（任意 — すべてのコース＆シグナルを解除）",
      btnCreate: "無料アカウントを作成",
      btnCreating: "セッション作成中...",
      hasAccount: "すでにアカウントをお持ちですか？",
      signIn: "ログイン →",
      orDivider: "またはメールアドレスで登録",
      googleSSO: "Googleで続ける",
      githubSSO: "GitHubで続ける",
      termsNotice: "登録することで、利用規約およびプライバシーポリシーに同意したものとみなされます。",
      valFields: "すべての必須項目を入力してください。",
      valPass: "パスワードは6文字以上である必要があります。",
    },
    ZH: {
      badge: "即时注册体验",
      title1: "加入",
      title2: "360° MARKETS。",
      subText: "向经认证的股票交易导师学习，或主办实时量化交易大师班。",
      roleInvestor: "投资者 / 学员",
      roleInvestorDesc: "学习量化交易、下载代码模型、参加盘前实盘直播",
      roleTrader: "导师 / 量化交易员",
      roleTraderDesc: "主办大师班、出售量化算法、分享专业知识变现",
      labelFirstName: "名",
      labelLastName: "姓",
      labelEmail: "电子邮箱",
      labelPass: "密码（至少6位）",
      labelInviteCode: "专属邀请码（选填 — 免费解锁所有研报、课程与技术信号）",
      btnCreate: "立即免费创建账号",
      btnCreating: "正在创建会话...",
      hasAccount: "已有账号？",
      signIn: "直接登录 →",
      orDivider: "或使用电子邮箱注册",
      googleSSO: "通过 Google 账号登录",
      githubSSO: "通过 GitHub 账号登录",
      termsNotice: "注册即表示您同意我们的服务条款和隐私政策。",
      valFields: "请填写所有必填字段。",
      valPass: "密码长度必须至少为 6 个字符。",
    },
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}${redirectTarget}` : undefined,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "OAuth login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !email.trim() || !password) {
      setErrorMsg(t.valFields);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t.valPass);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase Auth Sign Up
      let userId = `user-${Date.now()}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            role,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        userId = data.user.id;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "User";

      // 2. Set Local User Profile Session State
      const newProfile: UserProfile = {
        id: userId,
        email,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: fullName,
        role,
        title: role === "TRADER" ? "Certified Stock Educator" : "Stock Investor",
        avatarUrl:
          role === "TRADER"
            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
            : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
        country: "United States",
        language,
        onboardingCompleted: true,
        onboardingStep: 4,
        isCertified: role === "TRADER" ? false : undefined,
        certificationStatus: role === "TRADER" ? "pending" : undefined,
      };

      setUserProfile(newProfile);

      // 3. Upsert Profile in Supabase
      try {
        await supabase.from("profiles").upsert({
          id: userId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: fullName,
          country: "United States",
          language,
          role,
          onboarding_completed: true,
          onboarding_step: 4,
        });

        if (role === "INVESTOR") {
          await supabase.from("investor_profiles").upsert({
            user_id: userId,
            learning_interests: ["Stock Trading", "Options Strategies"],
            learning_goals: ["Build new quantitative trading skills"],
          });
        } else if (role === "TRADER") {
          await supabase.from("trader_profiles").upsert({
            user_id: userId,
            professional_title: "Stock Educator & Quant",
            bio: "Quantitative Stock Trading & Execution Specialist.",
            expertise: ["Equities", "Options", "Algorithms"],
            years_experience: 3,
            certification_status: "pending",
          });
        }
      } catch (dbErr) {
        console.warn("Database profile sync notice:", dbErr);
      }

      // 4. If invitation code was entered, unlock content
      if (inviteCode.trim()) {
        try {
          await unlockWithCode(inviteCode.trim());
        } catch (uErr) {
          console.warn("Unlock code error during signup:", uErr);
        }
      }

      // Celebrate & Redirect
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      router.push(redirectTarget);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "An unexpected error occurred during signup.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between p-6 sm:p-12 font-mono relative overflow-hidden select-none">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#8BE000]/5 rounded-full blur-3xl pointer-events-none" />

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
              className={`px-2.5 py-1 transition ${
                language === lang ? "bg-[#8BE000] text-black font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="max-w-lg w-full mx-auto my-8 z-20 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[#8BE000] text-xs font-mono tracking-wider uppercase bg-[#141414] px-3 py-1 border border-[#262626]">
            <Sparkles className="w-3.5 h-3.5 text-[#8BE000]" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-white tracking-tight leading-none">
            {t.title1} <span className="font-bold text-[#8BE000]">{t.title2}</span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            {t.subText}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Account Role Selector Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("INVESTOR")}
            className={`p-3.5 text-left border transition flex flex-col justify-between relative ${
              role === "INVESTOR"
                ? "bg-[#161616] border-[#8BE000] text-white shadow-lg"
                : "bg-[#111111] border-[#262626] text-neutral-400 hover:border-neutral-700"
            }`}
          >
            {role === "INVESTOR" && (
              <span className="absolute top-2 right-2 text-[#8BE000] text-xs">✓</span>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <User className={`w-4 h-4 ${role === "INVESTOR" ? "text-[#8BE000]" : "text-neutral-500"}`} />
              <span className="text-xs font-bold font-sans text-white">{t.roleInvestor}</span>
            </div>
            <span className="text-[10px] text-neutral-400 leading-snug">{t.roleInvestorDesc}</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("TRADER")}
            className={`p-3.5 text-left border transition flex flex-col justify-between relative ${
              role === "TRADER"
                ? "bg-[#161616] border-[#8BE000] text-white shadow-lg"
                : "bg-[#111111] border-[#262626] text-neutral-400 hover:border-neutral-700"
            }`}
          >
            {role === "TRADER" && (
              <span className="absolute top-2 right-2 text-[#8BE000] text-xs">✓</span>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <GraduationCap className={`w-4 h-4 ${role === "TRADER" ? "text-[#8BE000]" : "text-neutral-500"}`} />
              <span className="text-xs font-bold font-sans text-white">{t.roleTrader}</span>
            </div>
            <span className="text-[10px] text-neutral-400 leading-snug">{t.roleTraderDesc}</span>
          </button>
        </div>

        {/* Quick SSO Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#161616] border border-[#262626] hover:border-neutral-500 text-neutral-200 text-xs py-3 px-3 transition font-sans font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#161616] border border-[#262626] hover:border-neutral-500 text-neutral-200 text-xs py-3 px-3 transition font-sans font-medium"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#262626] w-full" />
          <span className="bg-[#080808] px-3 text-[10px] text-neutral-500 font-mono tracking-widest shrink-0">
            {t.orDivider}
          </span>
        </div>

        {/* Email & Password Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                {t.labelFirstName}
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                {t.labelLastName}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Chen"
                className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              {t.labelEmail}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@quantmarkets.io"
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3.5 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              {t.labelPass}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3.5 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                {t.labelInviteCode}
              </label>
              <span className="text-[9px] text-[#8BE000] font-mono">e.g. TRADINGEASY</span>
            </div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="TRADINGEASY"
              className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-[#8BE000] p-3.5 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700 uppercase font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-lime w-full py-4 font-bold text-sm text-black flex items-center justify-center gap-2 group mt-4 shadow-xl"
          >
            <span>{isLoading ? t.btnCreating : t.btnCreate}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
          </button>
        </form>

        <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
          {t.termsNotice}
        </p>

        <div className="text-center text-xs text-neutral-400 pt-1 border-t border-[#262626]">
          {t.hasAccount}{" "}
          <Link
            href={redirectTarget !== "/" ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"}
            className="text-[#8BE000] underline font-semibold hover:text-white"
          >
            {t.signIn}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex items-center justify-between text-xs text-neutral-500 z-20 border-t border-[#262626] pt-6">
        <div>360° MARKETS PLATFORM • INSTANT ONBOARDING ENGINE</div>
      </footer>
    </div>
  );
}

export default function FullScreenOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center text-white font-mono text-xs">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
