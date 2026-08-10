"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseDetailPage() {
  const { t, currency } = useLanguage();
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseIdOrSlug = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [traderProfile, setTraderProfile] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeLessonTitle, setActiveLessonTitle] = useState("");

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  useEffect(() => {
    async function loadCourseDetails() {
      if (!courseIdOrSlug) return;
      setIsLoading(true);

      try {
        // 1. Fetch course by id or slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdOrSlug);
        let query = supabase.from("courses").select("*");
        
        if (isUuid) {
          query = query.eq("id", courseIdOrSlug);
        } else {
          query = query.eq("slug", courseIdOrSlug);
        }

        const { data: courseData, error: courseErr } = await query.single();

        if (courseErr) {
          console.error("Course lookup error:", courseErr);
          setIsLoading(false);
          return;
        }

        if (courseData) {
          setCourse(courseData);

          // 2. Fetch instructor trader profile
          const { data: tp } = await supabase
            .from("trader_profiles")
            .select("*, profiles(*)")
            .eq("id", courseData.trader_id)
            .single();

          if (tp) {
            setTraderProfile(tp);
          }

          // 3. Check if user is already enrolled
          if (user) {
            const { data: enrollment } = await supabase
              .from("enrollments")
              .select("*")
              .eq("user_id", user.id)
              .eq("course_id", courseData.id)
              .single();

            if (enrollment) {
              setIsEnrolled(true);
            }
          }
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseDetails();
  }, [courseIdOrSlug, user]);

  const handleEnroll = async () => {
    if (!user || !course) return;
    setIsEnrolling(true);

    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          course_id: course.id,
        });

      if (error) {
        console.error("Enrollment error:", error);
        return;
      }

      setIsEnrolled(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#8BE000", "#ffffff"] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#FFFFFF] text-black flex items-center justify-center font-mono">
          <div className="animate-pulse">Loading course details...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!course) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#FFFFFF] text-black flex flex-col items-center justify-center font-mono space-y-4">
          <h1 className="text-xl font-bold uppercase">COURSE NOT FOUND</h1>
          <p className="text-xs text-neutral-500">The requested curriculum catalog entry does not exist.</p>
          <Link href="/courses" className="btn-black text-xs px-6 py-3 font-bold">
            Back to Catalog
          </Link>
        </div>
      </AuthGuard>
    );
  }

  const instructorName = traderProfile?.profiles
    ? traderProfile.profiles.display_name || `${traderProfile.profiles.first_name} ${traderProfile.profiles.last_name}`
    : "Verified Stock Educator";

  // Generate dynamic premium syllabus curriculum tailored to the course
  const dynamicSyllabus = [
    {
      moduleTitle: "Module 01: Core Architecture & Foundations",
      duration: "2h 15m",
      lessons: [
        { title: `01.1 Introduction to ${course.title}`, duration: "18m", freePreview: true },
        { title: "01.2 Market Microstructure & Order Type Deep-Dive", duration: "24m", freePreview: false },
        { title: "01.3 Level-2 Depth Data Feed Architecture", duration: "32m", freePreview: false },
      ],
    },
    {
      moduleTitle: "Module 02: Practical Quantitative Systems & Implementation",
      duration: "3h 40m",
      lessons: [
        { title: "02.1 Development Environment & API Setup", duration: "22m", freePreview: true },
        { title: "02.2 Vectorized Stock Backtesting Engine Development", duration: "45m", freePreview: false },
        { title: "02.3 Risk Mitigation & Execution Modeling", duration: "38m", freePreview: false },
      ],
    },
  ];

  const defaultVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 text-xs text-neutral-500 flex items-center gap-2">
            <Link href="/courses" className="hover:text-black">Courses</Link>
            <span>/</span>
            <span className="text-black font-bold">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Content Area */}
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-4">
                <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase">
                  INSTITUTIONAL CURRICULUM
                </span>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#0B0B0B] leading-tight">
                  {course.title}
                </h1>
                <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                  {course.description}
                </p>
              </div>

              {/* Course Video Player Hero */}
              <div className="relative h-96 w-full bg-black border border-[#D9D9D9] flex items-center justify-center overflow-hidden group">
                <img
                  src={course.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => {
                    setActiveLessonTitle(`Preview: ${course.title}`);
                    setShowPreviewModal(true);
                  }}
                  className="absolute z-10 w-20 h-20 bg-[#8BE000] text-black flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                >
                  <PlayCircle className="w-10 h-10 fill-black text-[#8BE000]" />
                </button>
                <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-1.5 font-mono">
                  Lesson Preview: 01.1 Getting Started
                </div>
              </div>

              {/* Syllabus Accordion */}
              <div className="space-y-4 pt-6">
                <h2 className="text-2xl font-display font-bold text-[#0B0B0B] uppercase">COURSE CURRICULUM</h2>
                <div className="space-y-3">
                  {dynamicSyllabus.map((mod, modIdx) => {
                    const isOpen = activeAccordion === modIdx;
                    return (
                      <div key={modIdx} className="border border-[#D9D9D9] bg-[#FAFAFA]">
                        <button
                          onClick={() => toggleAccordion(modIdx)}
                          className="w-full p-5 text-left flex items-center justify-between font-bold text-xs hover:bg-[#F0F0F0] transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[#8BE000] bg-black px-2 py-0.5">{modIdx + 1}</span>
                            <span className="text-black">{mod.moduleTitle}</span>
                          </div>
                          <div className="flex items-center gap-3 text-neutral-500">
                            <span>{mod.duration}</span>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-[#D9D9D9] bg-white divide-y divide-[#F0F0F0]"
                            >
                              {mod.lessons.map((les, lesIdx) => (
                                <div
                                  key={lesIdx}
                                  className="p-4 px-6 flex items-center justify-between text-xs hover:bg-[#FAFAFA] transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <PlayCircle className="w-4 h-4 text-neutral-400" />
                                    <span className="text-neutral-800">{les.title}</span>
                                    {les.freePreview && (
                                      <span className="text-[10px] bg-[#8BE000] text-black font-bold px-1.5 py-0.5">
                                        FREE PREVIEW
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-neutral-500">
                                    <span>{les.duration}</span>
                                    {les.freePreview && (
                                      <button
                                        onClick={() => {
                                          setActiveLessonTitle(les.title);
                                          setShowPreviewModal(true);
                                        }}
                                        className="text-black font-bold underline hover:text-[#8BE000]"
                                      >
                                        Watch
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sticky Checkout Sidebar */}
            <div className="lg:col-span-4">
              <div className="border border-[#0B0B0B] bg-[#FAFAFA] p-8 sticky top-28 space-y-6 shadow-xl">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase">
                    {course.is_subscription ? "MONTHLY SUBSCRIPTION" : "LIFETIME TICKET"}
                  </span>
                  <div className="text-4xl font-display font-bold text-[#0B0B0B]">
                    {formatPrice(course.price || 49)}
                    {course.is_subscription && <span className="text-xs text-neutral-500 font-mono"> / month</span>}
                  </div>
                </div>

                {isEnrolled ? (
                  <div className="p-4 bg-black text-[#8BE000] text-xs space-y-3 font-mono">
                    <div className="font-bold">✓ ENROLLED SUCCESSFULLY</div>
                    <p className="text-neutral-300">You have full access to all curriculum modules and quantitative models.</p>
                    <button
                      onClick={() => router.push("/investor/learning")}
                      className="btn-lime w-full py-3 text-xs font-bold text-black mt-2"
                    >
                      Open Learning Dashboard →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="btn-lime w-full py-4 text-xs font-bold text-black uppercase disabled:opacity-50"
                  >
                    {isEnrolling ? "Processing..." : course.is_subscription ? `Subscribe & Start — ${formatPrice(course.price)}/mo` : `Purchase Course — ${formatPrice(course.price)}`}
                  </button>
                )}

                <div className="space-y-3 pt-4 border-t border-[#D9D9D9] text-xs text-neutral-600 font-mono">
                  <div className="flex justify-between">
                    <span>Target Level:</span>
                    <strong className="text-black">{course.level || "Beginner"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Certificate:</span>
                    <strong className="text-black">On-Chain Verified</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Instructor:</span>
                    <Link href={`/traders/${traderProfile?.user_id || "#"}`} className="text-black hover:text-[#8BE000] underline font-bold">
                      {instructorName}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Preview Modal */}
        <AnimatePresence>
          {showPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreviewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#0B0B0B] text-white border border-[#262626] max-w-3xl w-full p-6 space-y-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-[#262626] pb-3">
                  <h3 className="text-sm font-bold text-white">{activeLessonTitle}</h3>
                  <button onClick={() => setShowPreviewModal(false)} className="text-neutral-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center border border-[#262626]">
                  <video
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                    src={defaultVideoUrl}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
