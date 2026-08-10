"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, PlayCircle, CheckCircle2, Award, Clock } from "lucide-react";

const MY_COURSES = [
  {
    id: "c1",
    title: "ADVANCED MACHINE LEARNING",
    slug: "advanced-machine-learning",
    trader: "Alex Morgan",
    isCertified: true,
    progress: 82,
    completedModules: 19,
    totalModules: 24,
    nextLesson: "02.1 Transformer Attention Mechanics",
  },
  {
    id: "c2",
    title: "BUILDING AI AGENTS",
    slug: "building-ai-agents",
    trader: "Alex Morgan",
    isCertified: true,
    progress: 100,
    completedModules: 16,
    totalModules: 16,
    completedAt: "01 Aug 2026",
    certificateId: "CERT-928184",
  },
  {
    id: "c3",
    title: "FINANCIAL TECHNOLOGY ARCHITECTURE",
    slug: "fintech-architecture",
    trader: "Daniel Wright",
    isCertified: true,
    progress: 45,
    completedModules: 8,
    totalModules: 18,
    nextLesson: "01.2 Double-Entry Accounting Ledgers",
  },
];

export default function InvestorLearningPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] pb-24">
      <div className="bg-[#0B0B0B] text-white border-b border-[#262626] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-mono text-[#8BE000] uppercase tracking-widest">
            KNOWLEDGE VAULT
          </span>
          <h1 className="text-5xl lg:text-7xl font-display font-light tracking-tighter mt-2">
            MY LEARNING &<br />
            <span className="font-normal text-[#8BE000]">ENROLLMENTS.</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MY_COURSES.map((course) => (
            <div
              key={course.id}
              className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-semibold">
                    {course.progress === 100 ? "COMPLETED ✓" : "ACTIVE ENROLLMENT"}
                  </span>
                  <span className="text-neutral-500">{course.trader} ✓</span>
                </div>

                <h3 className="text-2xl font-display font-semibold text-[#0B0B0B]">
                  {course.title}
                </h3>

                {/* Progress bar */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>PROGRESS</span>
                    <span className="text-[#8BE000] bg-black px-1.5">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#D9D9D9]">
                    <div className="h-full bg-[#8BE000]" style={{ width: `${course.progress}%` }} />
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    {course.completedModules} / {course.totalModules} Modules Finished
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#D9D9D9] flex justify-between items-center bg-white p-4">
                {course.progress === 100 ? (
                  <Link href={`/certificate/${course.certificateId}`} className="btn-lime text-xs px-4 py-2.5">
                    View Certificate →
                  </Link>
                ) : (
                  <Link href={`/courses/${course.slug}`} className="btn-black text-xs px-5 py-2.5">
                    Resume Lesson →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
