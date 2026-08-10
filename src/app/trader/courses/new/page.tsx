"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Video,
  FileCode,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion } from "framer-motion";

interface LessonDraft {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string;
  resourceFileUrl: string;
}

interface ModuleDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
}

export default function CourseBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currency } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Certification check
  const [isCertified, setIsCertified] = useState(false);
  const [traderProfileId, setTraderProfileId] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(true);

  // Step 1: Course Overview
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Quantitative Trading");
  const [level, setLevel] = useState("Beginner");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Step 2: Modules
  const [modules, setModules] = useState<ModuleDraft[]>([
    {
      id: "mod-1",
      title: "Module 1: Introduction",
      lessons: [
        { id: "les-1", title: "Getting Started", durationMinutes: 30, videoUrl: "", resourceFileUrl: "" },
      ],
    },
  ]);
  const [expandedModuleId, setExpandedModuleId] = useState<string>("mod-1");

  // Step 3: Pricing
  const [price, setPrice] = useState<number>(49);
  const [isSubscription, setIsSubscription] = useState(false);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const educatorShare = price * 0.7;
  const platformShare = price * 0.3;

  // Check certification status on mount
  useEffect(() => {
    async function checkCertification() {
      if (!user) return;
      setCertLoading(true);
      try {
        // Check profiles.is_certified
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_certified")
          .eq("id", user.id)
          .single();

        // Check trader_profiles
        const { data: tp } = await supabase
          .from("trader_profiles")
          .select("id, is_certified, certification_status")
          .eq("user_id", user.id)
          .single();

        const certified =
          prof?.is_certified === true ||
          tp?.is_certified === true ||
          tp?.certification_status === "certified";

        setIsCertified(certified);
        if (tp?.id) setTraderProfileId(tp.id);
      } catch (e) {
        console.warn("Certification check:", e);
      } finally {
        setCertLoading(false);
      }
    }
    checkCertification();
  }, [user]);

  // Module management
  const handleAddModule = () => {
    const mod: ModuleDraft = {
      id: `mod-${Date.now()}`,
      title: `Module ${modules.length + 1}: New Section`,
      lessons: [],
    };
    setModules([...modules, mod]);
    setExpandedModuleId(mod.id);
  };

  const handleRemoveModule = (id: string) => setModules(modules.filter((m) => m.id !== id));

  const handleUpdateModuleTitle = (id: string, t: string) =>
    setModules(modules.map((m) => (m.id === id ? { ...m, title: t } : m)));

  const handleAddLesson = (modId: string) => {
    const les: LessonDraft = {
      id: `les-${Date.now()}`,
      title: "New Lecture",
      durationMinutes: 25,
      videoUrl: "",
      resourceFileUrl: "",
    };
    setModules(modules.map((m) => (m.id === modId ? { ...m, lessons: [...m.lessons, les] } : m)));
  };

  const handleRemoveLesson = (modId: string, lesId: string) =>
    setModules(modules.map((m) => (m.id === modId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lesId) } : m)));

  const handleUpdateLesson = (modId: string, lesId: string, updates: Partial<LessonDraft>) =>
    setModules(
      modules.map((m) =>
        m.id === modId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lesId ? { ...l, ...updates } : l)) }
          : m
      )
    );

  // Publish course to Supabase
  const handlePublishCourse = async () => {
    if (!user || !isCertified) return;
    setIsSubmitting(true);
    setPublishError("");

    try {
      const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      // We need trader_profiles.id as the foreign key
      let traderId = traderProfileId;

      if (!traderId) {
        // Try to get or create trader_profiles row
        const { data: existingTp } = await supabase
          .from("trader_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (existingTp?.id) {
          traderId = existingTp.id;
        } else {
          // Create one
          const { data: newTp, error: tpErr } = await supabase
            .from("trader_profiles")
            .insert({
              user_id: user.id,
              certification_status: "certified",
              is_certified: true,
            })
            .select("id")
            .single();

          if (tpErr) {
            setPublishError(`Failed to create trader profile: ${tpErr.message}`);
            return;
          }
          traderId = newTp?.id || null;
        }
      }

      if (!traderId) {
        setPublishError("Could not resolve trader profile. Please contact admin.");
        return;
      }

      // Insert into courses with trader_profiles.id as trader_id
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .insert({
          trader_id: traderId,
          title,
          slug: generatedSlug,
          description,
          category,
          level,
          price,
          is_subscription: isSubscription,
          thumbnail: thumbnailUrl || null,
          published: false, // Courses start unpublished, admin approves
          rating: 5.0,
        })
        .select()
        .single();

      if (courseErr) {
        setPublishError(`Course creation failed: ${courseErr.message}`);
        return;
      }

      confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
      setTimeout(() => router.push("/trader"), 1200);
    } catch (err: any) {
      setPublishError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not certified, show locked state
  if (certLoading) {
    return (
      <AuthGuard allowedRoles={["TRADER"]}>
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
          <div className="animate-pulse text-xs text-neutral-500 font-mono">Checking certification status...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!isCertified) {
    return (
      <AuthGuard allowedRoles={["TRADER"]}>
        <div className="min-h-screen bg-[#080808] text-white py-16 font-mono">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
            <Lock className="w-12 h-12 text-neutral-600 mx-auto" />
            <h1 className="text-3xl font-display font-bold text-white">COURSE CREATION LOCKED</h1>
            <p className="text-sm text-neutral-400 font-sans max-w-md mx-auto">
              You must be a certified educator to create courses. Submit your certification dossier and wait for admin approval before publishing.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/trader/certification" className="btn-lime px-6 py-3 text-xs font-bold text-black">
                Submit Certification Dossier
              </Link>
              <Link href="/trader" className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-white px-6 py-3 text-xs transition">
                Back to Educator Hub
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["TRADER"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
                <span>COURSE STUDIO</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
                CREATE COURSE.
              </h1>
              <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
                Build your course curriculum, add video lectures and resources, set pricing, and submit for admin approval.
              </p>
            </div>
            <div className="text-xs text-neutral-400">Step {step} of 4</div>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-4 gap-2 border-b border-[#1E1E1E] pb-3 text-xs font-mono">
            {[
              { n: 1, label: "OVERVIEW" },
              { n: 2, label: "CURRICULUM" },
              { n: 3, label: "PRICING" },
              { n: 4, label: "PUBLISH" },
            ].map((s) => (
              <button
                key={s.n}
                onClick={() => setStep(s.n as any)}
                className={`text-left pb-2 border-b-2 transition ${
                  step >= s.n ? "border-[#8BE000] text-white font-bold" : "border-transparent text-neutral-500"
                }`}
              >
                0{s.n} {s.label}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {publishError && (
            <div className="p-4 bg-red-950/30 border border-red-900 text-red-400 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">PUBLISH ERROR</div>
                <div className="mt-1">{publishError}</div>
              </div>
            </div>
          )}

          {/* STEP 1: OVERVIEW */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-[#111111] border border-[#1E1E1E] p-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium text-white">COURSE DETAILS</h3>
                <p className="text-xs text-neutral-400 font-sans">Define the scope, category, and objectives of your course.</p>
              </div>

              <div className="space-y-6 text-xs font-mono">
                <div>
                  <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">COURSE TITLE</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Options Trading" className="w-full bg-[#080808] border border-[#262626] p-3.5 text-sm text-white focus:outline-none focus:border-[#8BE000]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">CATEGORY</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#080808] border border-[#262626] p-3.5 text-white focus:outline-none focus:border-[#8BE000]">
                      <option>Quantitative Trading</option>
                      <option>Options Strategies</option>
                      <option>Level-2 Order Flow</option>
                      <option>High-Frequency Systems</option>
                      <option>Equity Valuation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">LEVEL</label>
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-[#080808] border border-[#262626] p-3.5 text-white focus:outline-none focus:border-[#8BE000]">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">URL SLUG</label>
                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-from-title" className="w-full bg-[#080808] border border-[#262626] p-3.5 text-white focus:outline-none focus:border-[#8BE000]" />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">DESCRIPTION</label>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what students will learn..." className="w-full bg-[#080808] border border-[#262626] p-3.5 text-white focus:outline-none focus:border-[#8BE000] font-sans text-xs leading-relaxed" />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider">COVER IMAGE URL (OPTIONAL)</label>
                  <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#080808] border border-[#262626] p-3.5 text-white focus:outline-none focus:border-[#8BE000]" />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[#1E1E1E]">
                <Link href="/trader" className="bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 px-5 py-3 text-xs">Cancel</Link>
                <button type="button" onClick={() => setStep(2)} disabled={!title.trim()} className="btn-lime px-8 py-3 text-xs font-bold text-black flex items-center gap-2 disabled:opacity-40">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CURRICULUM */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-[#111111] border border-[#1E1E1E] p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-medium text-white">MODULES AND LECTURES</h3>
                  <p className="text-xs text-neutral-400 font-sans">Structure your curriculum into modules with video lectures and downloadable resources.</p>
                </div>
                <button type="button" onClick={handleAddModule} className="btn-lime px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 shrink-0">
                  <Plus className="w-4 h-4" />
                  <span>Add Module</span>
                </button>
              </div>

              <div className="space-y-6">
                {modules.map((mod, mi) => {
                  const isExpanded = expandedModuleId === mod.id;
                  return (
                    <div key={mod.id} className="border border-[#1E1E1E] bg-[#0A0A0A] overflow-hidden">
                      <div className="p-5 flex items-center justify-between bg-[#141414] border-b border-[#1E1E1E]">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs text-[#8BE000] font-bold">{String(mi + 1).padStart(2, "0")}</span>
                          <input type="text" value={mod.title} onChange={(e) => handleUpdateModuleTitle(mod.id, e.target.value)} className="bg-transparent border-b border-transparent hover:border-[#333] focus:border-[#8BE000] text-sm font-bold text-white font-display focus:outline-none flex-1 py-1" />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-neutral-500">{mod.lessons.length} Lectures</span>
                          <button type="button" onClick={() => setExpandedModuleId(isExpanded ? "" : mod.id)} className="text-neutral-400 hover:text-white p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {modules.length > 1 && (
                            <button type="button" onClick={() => handleRemoveModule(mod.id)} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6 space-y-5 bg-[#0D0D0D]">
                          {mod.lessons.map((les, li) => (
                            <div key={les.id} className="border border-[#1E1E1E] bg-[#121212] p-5 space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1E1E1E] pb-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="text-[10px] bg-black text-neutral-400 font-bold px-2 py-0.5 border border-[#262626]">LECTURE {li + 1}</span>
                                  <input type="text" value={les.title} onChange={(e) => handleUpdateLesson(mod.id, les.id, { title: e.target.value })} className="bg-transparent border-b border-transparent hover:border-[#333] focus:border-[#8BE000] text-sm text-white font-medium focus:outline-none flex-1" />
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                    <input type="number" value={les.durationMinutes} onChange={(e) => handleUpdateLesson(mod.id, les.id, { durationMinutes: parseInt(e.target.value) || 10 })} className="w-14 bg-[#080808] border border-[#262626] px-2 py-1 text-right text-white" />
                                    <span>min</span>
                                  </div>
                                  <button type="button" onClick={() => handleRemoveLesson(mod.id, les.id)} className="text-neutral-500 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <label className="block text-neutral-400 mb-1 flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-[#8BE000]" />
                                    <span>VIDEO URL</span>
                                  </label>
                                  <input type="url" placeholder="https://..." value={les.videoUrl} onChange={(e) => handleUpdateLesson(mod.id, les.id, { videoUrl: e.target.value })} className="w-full bg-[#080808] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#8BE000]" />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 mb-1 flex items-center gap-1.5">
                                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                                    <span>RESOURCE / DOWNLOAD URL</span>
                                  </label>
                                  <input type="url" placeholder="https://..." value={les.resourceFileUrl} onChange={(e) => handleUpdateLesson(mod.id, les.id, { resourceFileUrl: e.target.value })} className="w-full bg-[#080808] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#8BE000]" />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button type="button" onClick={() => handleAddLesson(mod.id)} className="w-full py-3 border border-dashed border-[#2E2E2E] hover:border-[#8BE000] text-xs font-bold text-neutral-300 hover:text-[#8BE000] transition bg-[#080808] flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span>Add Lecture</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-6 border-t border-[#1E1E1E]">
                <button type="button" onClick={() => setStep(1)} className="bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 px-5 py-3 text-xs flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-lime px-8 py-3 text-xs font-bold text-black flex items-center gap-2">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PRICING */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-[#111111] border border-[#1E1E1E] p-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium text-white">PRICING AND REVENUE SPLIT</h3>
                <p className="text-xs text-neutral-400 font-sans">Set your course price. You receive 70% of every sale automatically.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-neutral-400 mb-2 uppercase text-[10px] tracking-wider font-mono">PRICE (USD)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-[#8BE000] font-bold font-display">$</span>
                      <input type="number" min="0" step="5" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="bg-[#080808] border border-[#262626] p-4 text-3xl font-display font-bold text-white w-48 focus:outline-none focus:border-[#8BE000]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-neutral-400 uppercase text-[10px] tracking-wider font-mono">BILLING MODEL</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setIsSubscription(false)} className={`p-4 border text-left transition ${!isSubscription ? "border-[#8BE000] bg-[#121808] text-white" : "border-[#262626] bg-[#080808] text-neutral-400"}`}>
                        <div className="font-bold text-sm">One-Time</div>
                        <div className="text-[10px] text-neutral-400 mt-1">Lifetime access</div>
                      </button>
                      <button type="button" onClick={() => setIsSubscription(true)} className={`p-4 border text-left transition ${isSubscription ? "border-[#8BE000] bg-[#121808] text-white" : "border-[#262626] bg-[#080808] text-neutral-400"}`}>
                        <div className="font-bold text-sm">Monthly</div>
                        <div className="text-[10px] text-neutral-400 mt-1">Recurring billing</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-[#1E1E1E] bg-[#080808] p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-3">
                    <span className="text-xs text-neutral-400 uppercase font-mono">PER SALE SETTLEMENT</span>
                    <span className="text-[10px] bg-black text-[#8BE000] font-bold px-2 py-0.5 border border-[#262626]">70/30 SPLIT</span>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">Student Pays:</span>
                      <strong className="text-white text-lg font-display">{formatPrice(price)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#8BE000]">
                      <span className="font-bold">Your Payout (70%):</span>
                      <strong className="text-xl font-display font-bold">{formatPrice(educatorShare)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>Platform Fee (30%):</span>
                      <span>{formatPrice(platformShare)}</span>
                    </div>

                    <div className="pt-4 border-t border-[#1E1E1E] space-y-2">
                      <div className="text-[11px] text-neutral-400">Projected Earnings:</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        {[50, 250, 1000].map((n) => (
                          <div key={n} className="p-2 bg-[#121212] border border-[#222]">
                            <span className="text-neutral-500 block">{n} Students</span>
                            <strong className="text-[#8BE000]">{formatPrice(educatorShare * n)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[#1E1E1E]">
                <button type="button" onClick={() => setStep(2)} className="bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 px-5 py-3 text-xs flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-lime px-8 py-3 text-xs font-bold text-black flex items-center gap-2">
                  <span>Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW AND PUBLISH */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-[#111111] border border-[#1E1E1E] p-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium text-white">REVIEW AND SUBMIT</h3>
                <p className="text-xs text-neutral-400 font-sans">Confirm details before submitting. Your course will be reviewed by admin before going live.</p>
              </div>

              <div className="border border-[#1E1E1E] bg-[#080808] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E1E1E] pb-4">
                  <div>
                    <span className="text-[10px] bg-black text-[#8BE000] font-bold px-2 py-0.5 border border-[#262626]">{category}</span>
                    <h4 className="text-2xl font-display font-bold text-white mt-1">{title || "Untitled Course"}</h4>
                    <p className="text-xs text-neutral-400 mt-1 font-sans">{description || "No description provided"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-display font-bold text-[#8BE000]">{formatPrice(price)}</span>
                    <span className="text-[10px] text-neutral-400 block font-mono">{isSubscription ? "Monthly" : "One-Time"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[#111] border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">MODULES</span>
                    <strong className="text-white">{modules.length}</strong>
                  </div>
                  <div className="p-3 bg-[#111] border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">LECTURES</span>
                    <strong className="text-white">{modules.reduce((a, m) => a + m.lessons.length, 0)}</strong>
                  </div>
                  <div className="p-3 bg-[#111] border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">RUNTIME</span>
                    <strong className="text-white">{modules.reduce((a, m) => a + m.lessons.reduce((la, l) => la + l.durationMinutes, 0), 0)} min</strong>
                  </div>
                  <div className="p-3 bg-[#111] border border-[#1E1E1E]">
                    <span className="text-neutral-500 block text-[10px]">YOUR PAYOUT</span>
                    <strong className="text-[#8BE000]">{formatPrice(educatorShare)}</strong>
                  </div>
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300">
                  Your course will be submitted for admin review. Once approved, it will appear in the platform catalog.
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[#1E1E1E]">
                <button type="button" onClick={() => setStep(3)} className="bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 px-5 py-3 text-xs flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handlePublishCourse}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="btn-lime px-10 py-4 text-sm font-bold text-black flex items-center gap-2 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Course for Review"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
