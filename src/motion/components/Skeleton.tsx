"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-[#161616] via-[#262626] to-[#161616] bg-[length:200%_100%] animate-pulse border border-[#262626] ${className}`}
    />
  );
}

export function SkeletonCourseCard() {
  return (
    <div className="border border-[#D9D9D9] p-6 space-y-4 bg-[#FAFAFA]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="pt-4 border-t border-[#D9D9D9] flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
