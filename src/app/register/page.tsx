"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, Role, UserProfile } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function FullScreenOnboardingPage() {
  const router = useRouter();
  const { setUserProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Directional Animation State (+1 for Next, -1 for Back)
  const [direction, setDirection] = useState<number>(1);

  // Current Onboarding Step Index
  const [step, setStep] = useState<number>(0);

  // Form Fields State
  const [role, setRole] = useState<Role>("INVESTOR");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Investor Personalization
  const [interests, setInterests] = useState<string[]>(["Stock Trading", "Options Strategies"]);
  const [goal, setGoal] = useState<string>("Build new skills");
  const [timeCommitment, setTimeCommitment] = useState<string>("30 MIN / DAY");

  // Trader Personalization
  const [traderTitle, setTraderTitle] = useState("");
  const [traderBio, setTraderBio] = useState("");
  const [traderExp, setTraderExp] = useState("3–5 YEARS");
  const [traderWebsite, setTraderWebsite] = useState("");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccessThreshold, setIsSuccessThreshold] = useState(false);

  const TOTAL_STEPS = 9;

  const INTERESTS_LIST = [
    "Stock Trading",
    "Options Strategies",
    "Quantitative Finance",
    "Equity Valuation (DCF)",
    "High-Frequency Trading",
    "Technical Analysis",
    "Portfolio Management",
  ];

  const GOALS_LIST = [
    "BUILD NEW SKILLS",
    "ADVANCE MY CAREER",
    "START TRADING STOCKS",
    "LEARN OPTIONS PRICING",
    "EXPLORE QUANTITATIVE MODELS",
  ];

  const TIME_OPTIONS = [
    "15 MIN / DAY",
    "30 MIN / DAY",
    "1 HOUR / DAY",
    "2+ HOURS / DAY",
    "WEEKENDS",
  ];

  const EXP_OPTIONS = ["0–2 YEARS", "3–5 YEARS", "6–10 YEARS", "10+ YEARS"];

  // Auto-focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  // Keyboard navigation (ENTER to continue, ESC to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (step > 0 && step < 9) {
          e.preventDefault();
          goNext();
        }
      } else if (e.key === "Escape") {
        if (step > 0 && step < 10) {
          e.preventDefault();
          goBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, firstName, lastName, email, password, role]);

  const goNext = () => {
    setErrorMsg("");

    // Step Validation
    if (step === 2 && !firstName.trim()) {
      setErrorMsg("Please enter your first name.");
      return;
    }
    if (step === 3 && !lastName.trim()) {
      setErrorMsg("Please enter your last name.");
      return;
    }
    if (step === 4 && (!email.trim() || !email.includes("@"))) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (step === 5 && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 9));
  };

  const goBack = () => {
    setErrorMsg("");
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Supabase Auth Sign Up
      let userId = `user-${Date.now()}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            role,
          },
        },
      });

      if (data?.user) {
        userId = data.user.id;
      }

      // 2. Build Profile Object
      const newProfile: UserProfile = {
        id: userId,
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        role,
        title: role === "TRADER" ? traderTitle || "Stock Educator" : "Stock Investor",
        avatarUrl:
          role === "TRADER"
            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
            : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
        country: "United States",
        language: "EN",
        onboardingCompleted: true,
        onboardingStep: 4,
        isCertified: role === "TRADER" ? false : undefined,
        certificationStatus: role === "TRADER" ? "pending" : undefined,
      };

      // 3. Save profile in Supabase profiles & role tables
      await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        country: "United States",
        language: "EN",
        role,
        onboarding_completed: true,
        onboarding_step: 4,
      });

      if (role === "INVESTOR") {
        await supabase.from("investor_profiles").upsert({
          user_id: userId,
          learning_interests: interests,
          learning_goals: [goal],
        });
      } else if (role === "TRADER") {
        await supabase.from("trader_profiles").upsert({
          user_id: userId,
          professional_title: traderTitle,
          bio: traderBio,
          expertise: interests,
          years_experience: parseInt(traderExp) || 3,
          website: traderWebsite,
          certification_status: "pending",
        });

        await supabase.from("trader_applications").insert({
          user_id: userId,
          full_name: `${firstName} ${lastName}`,
          expertise: interests.join(", "),
          experience_years: parseInt(traderExp) || 3,
          bio: traderBio || "Stock Educator Applicant",
          portfolio_url: traderWebsite,
          status: "pending",
        });
      }

      setUserProfile(newProfile);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      // Trigger Threshold Screen
      setStep(10);
      setIsLoading(false);
      setIsSuccessThreshold(true);

      // Launch Home Page by default after onboarding completion
      setTimeout(() => {
        router.push("/");
      }, 1400);
    } catch (e: any) {
      setIsLoading(false);
      setErrorMsg(e.message || "An unexpected error occurred.");
    }
  };

  // Directional Framer Motion Variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-between p-6 sm:p-12 font-mono relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
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

        {step > 0 && step < 10 && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-neutral-500 font-medium">0{step} / 0{TOTAL_STEPS}</span>
            <div className="w-24 bg-[#262626] h-1 rounded-full overflow-hidden">
              <motion.div
                className="bg-[#8BE000] h-full"
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Full-Screen Conversational Body */}
      <main className="my-auto py-12 max-w-3xl w-full mx-auto z-20">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-950/90 border border-red-500 text-red-200 text-xs font-mono"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {/* SCREEN 00: WELCOME */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#8BE000] border border-[#8BE000] px-3 py-1 bg-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>INSTITUTIONAL KNOWLEDGE PORTAL</span>
                </div>
                <h1 className="text-6xl sm:text-8xl font-display font-light leading-[0.95] tracking-tighter text-white">
                  WELCOME<br />
                  <span className="text-[#8BE000] font-normal">TO 360° MARKETS.</span>
                </h1>
                <p className="text-neutral-300 text-xl font-light max-w-lg leading-relaxed pt-2">
                  A better way to learn, share stock trading knowledge, and build your quantitative portfolio.
                </p>
              </div>

              <div className="pt-6 space-y-4 max-w-xs">
                <button
                  onClick={() => {
                    setDirection(1);
                    setStep(1);
                  }}
                  className="btn-lime w-full text-base py-4 font-bold flex items-center justify-between px-6 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="text-xs text-neutral-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#8BE000] underline font-semibold hover:text-white">
                    Sign in →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 01: WHAT ARE YOU HERE TO DO? */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-xs text-[#8BE000] font-bold">01 / 0{TOTAL_STEPS}</span>
                <h2 className="text-5xl sm:text-7xl font-display font-light tracking-tight text-white leading-none">
                  WHAT ARE YOU<br />
                  <span className="text-[#8BE000] font-normal">HERE TO DO?</span>
                </h2>
                <p className="text-xs text-neutral-400">Choose how you'll use the platform to customize your experience.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                {/* LEARN CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("INVESTOR");
                    setDirection(1);
                    setStep(2);
                  }}
                  className={`text-left p-10 border transition-all duration-200 flex flex-col justify-between h-72 space-y-4 group ${
                    role === "INVESTOR"
                      ? "border-[#8BE000] bg-[#161616] ring-1 ring-[#8BE000]"
                      : "border-[#262626] bg-[#0F0F0F] hover:border-[#8BE000] hover:-translate-y-1"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-black border border-[#262626] text-[#8BE000] flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-4xl font-display font-bold text-white group-hover:text-[#8BE000]">LEARN</h3>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                      Discover verified stock courses, quantitative models, options pricing strategies, and live market webinars.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8BE000] font-bold pt-2">
                    <span>Continue as Investor</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* TEACH CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("TRADER");
                    setDirection(1);
                    setStep(2);
                  }}
                  className={`text-left p-10 border transition-all duration-200 flex flex-col justify-between h-72 space-y-4 group ${
                    role === "TRADER"
                      ? "border-[#8BE000] bg-[#161616] ring-1 ring-[#8BE000]"
                      : "border-[#262626] bg-[#0F0F0F] hover:border-[#8BE000] hover:-translate-y-1"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-black border border-[#262626] text-[#8BE000] flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-4xl font-display font-bold text-white group-hover:text-[#8BE000]">TEACH</h3>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                      Share your stock trading expertise, build masterclasses, sell Python algorithms, and host live sessions.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8BE000] font-bold pt-2">
                    <span>Continue as Trader</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 02: FIRST NAME */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-xs text-[#8BE000] font-bold">02 / 0{TOTAL_STEPS}</span>
                <h2 className="text-5xl sm:text-7xl font-display font-light text-white tracking-tight leading-none">
                  WHAT SHOULD<br />
                  <span className="text-[#8BE000] font-normal">WE CALL YOU?</span>
                </h2>
                <p className="text-xs text-neutral-400">Enter your first name to get started.</p>
              </div>

              <div className="space-y-4 pt-4">
                <input
                  ref={inputRef as any}
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Palash"
                  className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-3xl sm:text-5xl font-display font-light text-white py-4 focus:outline-none transition-colors placeholder-neutral-700"
                />

                <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
                  <span>Press <kbd className="bg-[#262626] text-white px-2 py-0.5 rounded">Enter ↵</kbd> to continue</span>
                  <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 03: LAST NAME */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#8BE000]">
                  <span>03 / 0{TOTAL_STEPS}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-bold">{firstName} ✓</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-display font-light text-white tracking-tight leading-none">
                  AND YOUR<br />
                  <span className="text-[#8BE000] font-normal">LAST NAME?</span>
                </h2>
              </div>

              <div className="space-y-4 pt-4">
                <input
                  ref={inputRef as any}
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Shah"
                  className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-3xl sm:text-5xl font-display font-light text-white py-4 focus:outline-none transition-colors placeholder-neutral-700"
                />

                <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
                  <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 04: EMAIL ADDRESS */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#8BE000]">
                  <span>04 / 0{TOTAL_STEPS}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-bold">{firstName} {lastName} ✓</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-display font-light text-white tracking-tight leading-none">
                  WHERE SHOULD WE<br />
                  <span className="text-[#8BE000] font-normal">SEND UPDATES?</span>
                </h2>
                <p className="text-xs text-neutral-400">Enter your primary email address for session authentication.</p>
              </div>

              <div className="space-y-4 pt-4">
                <input
                  ref={inputRef as any}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="palash@investor.io"
                  className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-3xl sm:text-5xl font-display font-light text-white py-4 focus:outline-none transition-colors placeholder-neutral-700"
                />

                <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
                  <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 05: PASSWORD */}
          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#8BE000]">
                  <span>05 / 0{TOTAL_STEPS}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="font-bold">{email} ✓</span>
                </div>
                <h2 className="text-5xl sm:text-7xl font-display font-light text-white tracking-tight leading-none">
                  CREATE A<br />
                  <span className="text-[#8BE000] font-normal">SECURE PASSWORD.</span>
                </h2>
                <p className="text-xs text-neutral-400">Minimum 6 characters for encrypted session storage.</p>
              </div>

              <div className="space-y-4 pt-4">
                <input
                  ref={inputRef as any}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-3xl sm:text-5xl font-display font-light text-white py-4 focus:outline-none transition-colors placeholder-neutral-700"
                />

                <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
                  <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 06: ROLE PERSONALIZATION A */}
          {step === 6 && (
            <motion.div
              key="step6"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {role === "INVESTOR" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">06 / 0{TOTAL_STEPS}</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      NICE TO MEET YOU, {firstName.toUpperCase()}.<br />
                      <span className="text-[#8BE000] font-normal">WHAT ARE YOU INTERESTED IN?</span>
                    </h2>
                    <p className="text-xs text-neutral-400">Select topics to personalize your marketplace feed.</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {INTERESTS_LIST.map((item) => {
                      const isSelected = interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className={`px-5 py-3 text-xs font-bold transition-all border flex items-center gap-2 ${
                            isSelected
                              ? "bg-[#8BE000] text-black border-[#8BE000]"
                              : "bg-[#161616] text-neutral-300 border-[#262626] hover:border-[#8BE000]"
                          }`}
                        >
                          <span>{item}</span>
                          {isSelected && <Check className="w-4 h-4 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {role === "TRADER" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">06 / 0{TOTAL_STEPS}</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      LET'S BUILD YOUR<br />
                      <span className="text-[#8BE000] font-normal">EDUCATOR PROFILE.</span>
                    </h2>
                    <p className="text-xs text-neutral-400">Enter your professional title and background.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={traderTitle}
                      onChange={(e) => setTraderTitle(e.target.value)}
                      placeholder="Ex-Hedge Fund Stock Quant"
                      className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-2xl sm:text-4xl font-display font-light text-white py-3 focus:outline-none placeholder-neutral-700"
                    />

                    <textarea
                      rows={3}
                      value={traderBio}
                      onChange={(e) => setTraderBio(e.target.value)}
                      placeholder="Specializing in US equity order execution, algorithmic momentum strategies, and Level-2 microstructure..."
                      className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-xs text-white p-4 focus:outline-none font-mono placeholder-neutral-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-neutral-500 pt-6">
                <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 07: ROLE PERSONALIZATION B */}
          {step === 7 && (
            <motion.div
              key="step7"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {role === "INVESTOR" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">07 / 09</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      WHAT ARE YOU<br />
                      <span className="text-[#8BE000] font-normal">LOOKING TO ACHIEVE?</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {GOALS_LIST.map((g) => {
                      const isSelected = goal === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGoal(g)}
                          className={`p-5 text-left border text-xs font-bold transition-all flex justify-between items-center ${
                            isSelected
                              ? "bg-[#8BE000] text-black border-[#8BE000]"
                              : "bg-[#161616] text-neutral-300 border-[#262626] hover:border-[#8BE000]"
                          }`}
                        >
                          <span>{g}</span>
                          {isSelected && <Check className="w-4 h-4 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {role === "TRADER" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">07 / 09</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      HOW LONG HAVE YOU<br />
                      <span className="text-[#8BE000] font-normal">BEEN TRADING?</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {EXP_OPTIONS.map((exp) => {
                      const isSelected = traderExp === exp;
                      return (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setTraderExp(exp)}
                          className={`p-6 text-center border text-sm font-bold transition-all ${
                            isSelected
                              ? "bg-[#8BE000] text-black border-[#8BE000]"
                              : "bg-[#161616] text-neutral-300 border-[#262626] hover:border-[#8BE000]"
                          }`}
                        >
                          {exp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-neutral-500 pt-6">
                <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 08: ROLE PERSONALIZATION C */}
          {step === 8 && (
            <motion.div
              key="step8"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {role === "INVESTOR" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">08 / 09</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      HOW MUCH TIME DO YOU<br />
                      <span className="text-[#8BE000] font-normal">HAVE TO LEARN?</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    {TIME_OPTIONS.map((time) => {
                      const isSelected = timeCommitment === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setTimeCommitment(time)}
                          className={`p-5 text-center border text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-[#8BE000] text-black border-[#8BE000]"
                              : "bg-[#161616] text-neutral-300 border-[#262626] hover:border-[#8BE000]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {role === "TRADER" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-[#8BE000] font-bold">08 / 09</span>
                    <h2 className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none">
                      WHERE CAN PEOPLE<br />
                      <span className="text-[#8BE000] font-normal">LEARN MORE ABOUT YOU?</span>
                    </h2>
                    <p className="text-xs text-neutral-400">Enter your professional website or portfolio link.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <input
                      ref={inputRef as any}
                      type="url"
                      value={traderWebsite}
                      onChange={(e) => setTraderWebsite(e.target.value)}
                      placeholder="https://alexmorgan.io"
                      className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#8BE000] text-2xl sm:text-4xl font-display font-light text-white py-3 focus:outline-none placeholder-neutral-700"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-neutral-500 pt-6">
                <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext} className="btn-lime px-6 py-3 font-bold text-black flex items-center gap-1">
                  <span>Review Profile →</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 09: EDITORIAL PROFILE REVIEW */}
          {step === 9 && (
            <motion.div
              key="step9"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-xs text-[#8BE000] font-bold">YOU'RE ALL SET</span>
                <h2 className="text-5xl sm:text-7xl font-display font-light text-white tracking-tight leading-none">
                  CONFIRM YOUR<br />
                  <span className="text-[#8BE000] font-normal">PROFILE DETAILS.</span>
                </h2>
              </div>

              <div className="border border-[#262626] bg-[#161616] p-8 space-y-5 text-xs font-mono">
                <div className="flex justify-between border-b border-[#262626] pb-3">
                  <span className="text-neutral-400">FULL NAME</span>
                  <span className="text-white font-bold text-sm">{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between border-b border-[#262626] pb-3">
                  <span className="text-neutral-400">EMAIL ADDRESS</span>
                  <span className="text-white">{email}</span>
                </div>
                <div className="flex justify-between border-b border-[#262626] pb-3">
                  <span className="text-neutral-400">ACCOUNT TYPE</span>
                  <span className="text-[#8BE000] font-bold">{role}</span>
                </div>

                {role === "INVESTOR" && (
                  <>
                    <div className="flex justify-between border-b border-[#262626] pb-3">
                      <span className="text-neutral-400">INTERESTS</span>
                      <span className="text-white">{interests.join(" · ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">GOAL</span>
                      <span className="text-[#8BE000]">{goal}</span>
                    </div>
                  </>
                )}

                {role === "TRADER" && (
                  <>
                    <div className="flex justify-between border-b border-[#262626] pb-3">
                      <span className="text-neutral-400">TITLE</span>
                      <span className="text-white">{traderTitle || "Stock Educator"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">CERTIFICATION STATUS</span>
                      <span className="text-amber-400 font-bold">PENDING VERIFICATION</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
                <button onClick={goBack} className="text-neutral-400 hover:text-white flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Edit Answers
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="btn-lime px-8 py-4 font-bold text-black text-sm flex items-center gap-2"
                >
                  <span>{isLoading ? "Creating Account..." : `Create ${role} Account →`}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 10: THRESHOLD ENTRANCE INTO PRODUCT */}
          {step === 10 && (
            <motion.div
              key="step10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-8 py-16"
            >
              <div className="w-20 h-20 bg-[#8BE000] text-black font-mono font-bold text-3xl flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                360°
              </div>

              <div className="space-y-3">
                <h2 className="text-5xl font-display font-light text-white">YOU'RE READY. ✓</h2>
                <p className="text-xs text-[#8BE000] font-mono uppercase tracking-widest">
                  INITIALIZING YOUR DATABASE SESSION...
                </p>
              </div>

              <div className="w-48 bg-[#262626] h-1.5 rounded-full mx-auto overflow-hidden">
                <div className="bg-[#8BE000] h-full animate-pulse" style={{ width: "100%" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="w-full flex items-center justify-between text-xs text-neutral-500 z-20 border-t border-[#262626] pt-6">
        <div>360° MARKETS PLATFORM • FINRA / SEC COMPLIANT SESSION</div>
        <div>Press <kbd className="bg-[#262626] text-white px-1.5 py-0.5 rounded">ESC</kbd> to go back</div>
      </footer>
    </div>
  );
}
