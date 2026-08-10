"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, AlertTriangle, Lock, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface ApplicationRecord {
  id: string;
  user_id: string;
  full_name: string;
  expertise: string;
  experience_years: number;
  bio: string;
  portfolio_url?: string;
  documents_url?: string;
  status: string;
  certification_id?: string;
  submitted_at?: string;
  created_at?: string;
}

export default function TraderCertificationPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [certId, setCertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form fields — matching actual DB columns
  const [fullName, setFullName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState("5");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [documentsUrl, setDocumentsUrl] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.displayName || "");
      fetchApplication();
    }
  }, [user]);

  const fetchApplication = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch all applications for this user (no ordering to avoid column mismatch)
      const { data, error } = await supabase
        .from("trader_applications")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Application fetch error:", error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Sort client-side by submitted_at or created_at, newest first
        const sorted = [...data].sort((a, b) => {
          const da = new Date(a.submitted_at || a.created_at || 0).getTime();
          const db = new Date(b.submitted_at || b.created_at || 0).getTime();
          return db - da;
        });
        const latest = sorted[0];
        setApplication(latest);

        // If approved, also pull certification_id from trader_profiles
        if (latest.status === "approved") {
          const certFromApp = latest.certification_id;
          if (certFromApp) {
            setCertId(certFromApp);
          } else {
            try {
              const { data: tp } = await supabase
                .from("trader_profiles")
                .select("certification_id")
                .eq("user_id", user.id)
                .single();
              if (tp?.certification_id) setCertId(tp.certification_id);
            } catch (e) {
              // no trader_profiles row
            }
          }
        }
      } else {
        setApplication(null);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const { data, error } = await supabase
        .from("trader_applications")
        .insert({
          user_id: user.id,
          full_name: fullName,
          expertise,
          experience_years: parseInt(experienceYears) || 5,
          bio,
          portfolio_url: portfolioUrl || null,
          documents_url: documentsUrl || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        setSubmitError(error.message);
        return;
      }

      if (data) {
        setApplication(data);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#8BE000", "#ffffff"] });
      }
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = application?.status;
  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";
  const hasNoApplication = !application;

  return (
    <AuthGuard allowedRoles={["TRADER"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Header */}
          <div className="pb-8 border-b border-[#1E1E1E] space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
              <span>CREDENTIAL VERIFICATION</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
              TRADER CERTIFICATION.
            </h1>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Submit your trading credentials and brokerage track record for administrative verification. Once approved, your certification ID is generated and course creation is unlocked.
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="border border-[#1E1E1E] bg-[#111111] p-8 space-y-4 animate-pulse">
              <div className="h-5 bg-[#1E1E1E] w-1/3" />
              <div className="h-3 bg-[#1E1E1E] w-2/3" />
              <div className="h-40 bg-[#1E1E1E] w-full" />
            </div>
          ) : isApproved ? (
            /* APPROVED — Show certification badge */
            <div className="border border-[#8BE000]/30 bg-[#0A1202] p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-14 h-14 border-2 border-[#8BE000] flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-[#8BE000]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                    CERTIFIED STOCK EDUCATOR
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans">
                    Your trading dossier has been verified and approved by platform administration.
                  </p>
                </div>

                <div className="w-full bg-[#080808] border border-[#1E1E1E] p-6 flex flex-col items-center space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">CERTIFICATION ID</span>
                  <span className="text-xl font-mono text-[#8BE000] tracking-widest font-bold">
                    {certId || application?.certification_id || "TRD-VERIFIED"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full text-xs">
                  <div className="bg-[#080808] border border-[#1E1E1E] p-3 text-center">
                    <span className="text-neutral-500 block text-[10px]">NAME</span>
                    <span className="text-white font-bold">{application?.full_name}</span>
                  </div>
                  <div className="bg-[#080808] border border-[#1E1E1E] p-3 text-center">
                    <span className="text-neutral-500 block text-[10px]">EXPERTISE</span>
                    <span className="text-white font-bold">{application?.expertise}</span>
                  </div>
                  <div className="bg-[#080808] border border-[#1E1E1E] p-3 text-center">
                    <span className="text-neutral-500 block text-[10px]">EXPERIENCE</span>
                    <span className="text-white font-bold">{application?.experience_years} Years</span>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-600 font-mono uppercase">
                  Certification maintains active status pending annual review
                </p>

                <Link href="/trader" className="btn-lime text-xs px-8 py-3 text-black font-bold">
                  Return to Educator Hub
                </Link>
              </div>
            </div>
          ) : isPending ? (
            /* PENDING — Under Admin Review */
            <div className="border border-amber-600/40 bg-[#141005] p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-amber-900/30 pb-4">
                <div className="w-3 h-3 bg-amber-500 animate-pulse" />
                <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                  UNDER ADMIN REVIEW
                </h2>
              </div>

              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                Your credentials dossier has been submitted and is currently being reviewed by the administration team. Course creation will be unlocked once your certification is approved.
              </p>

              <div className="bg-[#080808] border border-[#1E1E1E] p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Applicant</span>
                    <span className="text-white font-bold">{application?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Expertise</span>
                    <span className="text-white font-bold">{application?.expertise}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Experience</span>
                    <span className="text-white font-bold">{application?.experience_years} Years</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Submitted</span>
                    <span className="text-white font-bold">
                      {new Date(application?.submitted_at || application?.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {application?.portfolio_url && (
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Portfolio Link</span>
                    <a href={application.portfolio_url} target="_blank" rel="noreferrer" className="text-[#8BE000] underline text-xs">
                      {application.portfolio_url}
                    </a>
                  </div>
                )}

                {application?.documents_url && (
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Submitted Documents</span>
                    <a href={application.documents_url} target="_blank" rel="noreferrer" className="text-[#8BE000] underline text-xs">
                      {application.documents_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchApplication}
                  className="flex items-center gap-2 bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] px-4 py-2 text-xs text-neutral-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Refresh Status</span>
                </button>
                <Link href="/trader" className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-white text-xs px-4 py-2 transition">
                  Back to Educator Hub
                </Link>
              </div>
            </div>
          ) : (
            /* NO APPLICATION or REJECTED — Show submission form */
            <form onSubmit={handleSubmitDossier} className="border border-[#1E1E1E] bg-[#111111] p-8 space-y-6">
              {isRejected && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 space-y-1">
                  <h3 className="text-xs text-red-400 font-bold uppercase tracking-wider">APPLICATION DECLINED</h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Your previous submission was not approved. You may submit a revised dossier below.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <h2 className="text-xl font-display font-medium text-white">SUBMIT CERTIFICATION DOSSIER</h2>
                <p className="text-xs text-neutral-400 font-sans">
                  Provide your trading credentials and track record for admin verification. All fields marked are required.
                </p>
              </div>

              {submitError && (
                <div className="p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs">
                  {submitError}
                </div>
              )}

              <div className="space-y-5 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full legal name"
                      className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">PRIMARY EXPERTISE</label>
                    <input
                      type="text"
                      required
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Quantitative Trading, Options"
                      className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">YEARS OF PROFESSIONAL EXPERIENCE</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                  />
                </div>

                <div className="pt-4 border-t border-[#1E1E1E] space-y-4">
                  <div>
                    <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">PORTFOLIO / BROKERAGE VERIFICATION URL</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://myportfolio.com or brokerage verification link"
                      className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                    />
                    <p className="mt-1 text-[10px] text-neutral-600">Link to your public portfolio or brokerage verification service</p>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">TRACK RECORD / DOCUMENTS URL</label>
                    <input
                      type="url"
                      value={documentsUrl}
                      onChange={(e) => setDocumentsUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or documents link"
                      className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000]"
                    />
                    <p className="mt-1 text-[10px] text-neutral-600">Secure link to brokerage statements, P/L history, or certifications (CFA, Series 65)</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E1E1E]">
                  <label className="block text-neutral-400 mb-1.5 uppercase text-[10px] tracking-wider">BIOGRAPHY AND BACKGROUND SUMMARY</label>
                  <textarea
                    required
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your trading background, strategy specialization, and risk management approach."
                    className="w-full bg-[#080808] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#8BE000] font-sans text-xs leading-relaxed resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-lime w-full py-4 text-xs font-bold text-black uppercase tracking-wider focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Dossier..." : "Submit Certification Dossier for Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
