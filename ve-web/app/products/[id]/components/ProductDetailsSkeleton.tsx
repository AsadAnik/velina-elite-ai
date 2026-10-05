"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";

export default function ProductDetailsSkeleton() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
        {/* Top Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 w-16 bg-surface-2 rounded-full" />
          <div className="h-3 w-3 bg-surface-2 rounded-full" />
          <div className="h-3 w-24 bg-surface-2 rounded-full" />
          <div className="h-3 w-3 bg-surface-2 rounded-full" />
          <div className="h-3 w-36 bg-surface-2 rounded-full" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Left Column: Image Gallery Skeleton */}
          <div>
            <div className="relative aspect-square w-full rounded-2xl bg-surface-2 border border-border/60 overflow-hidden shadow-sm" />
            <div className="mt-3 flex gap-3">
              <div className="h-20 w-20 rounded-xl bg-surface-2 border border-border/60 shrink-0" />
              <div className="h-20 w-20 rounded-xl bg-surface-2 border border-border/60 shrink-0" />
              <div className="h-20 w-20 rounded-xl bg-surface-2 border border-border/60 shrink-0" />
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="space-y-6">
            <div>
              <div className="h-4 w-28 bg-surface-2 rounded-md mb-3" />
              <div className="h-8 w-4/5 bg-surface-2 rounded-lg mb-2" />
              <div className="h-8 w-2/3 bg-surface-2 rounded-lg" />
            </div>

            {/* Rating Stars Skeleton */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="h-4 w-4 rounded bg-surface-2" />
                ))}
              </div>
              <div className="h-3.5 w-24 bg-surface-2 rounded-full" />
            </div>

            {/* Price Box Skeleton */}
            <div className="flex items-baseline gap-3 pt-2">
              <div className="h-9 w-32 bg-surface-2 rounded-xl" />
              <div className="h-6 w-20 bg-surface-2 rounded-lg" />
              <div className="h-6 w-16 bg-surface-2 rounded-full" />
            </div>

            {/* Size & Stock Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-7 w-20 bg-surface-2 rounded-full" />
              <div className="h-4 w-28 bg-surface-2 rounded-md" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-12 flex-1 bg-surface-2 rounded-2xl" />
              <div className="h-12 flex-1 bg-surface-2 rounded-2xl" />
            </div>

            {/* Guarantee / Features Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
              <div className="h-14 bg-surface rounded-2xl border border-border/60" />
              <div className="h-14 bg-surface rounded-2xl border border-border/60" />
            </div>

            {/* Description Skeleton */}
            <div className="pt-4 space-y-2.5">
              <div className="h-4 w-24 bg-surface-2 rounded-md mb-2" />
              <div className="h-3.5 w-full bg-surface-2 rounded-md" />
              <div className="h-3.5 w-full bg-surface-2 rounded-md" />
              <div className="h-3.5 w-3/4 bg-surface-2 rounded-md" />
            </div>
          </div>
        </div>

        {/* Reviews Section Skeleton */}
        <div className="mt-16 pt-8 border-t border-border/60 space-y-6">
          <div className="h-7 w-48 bg-surface-2 rounded-lg" />
          <div className="h-28 w-full max-w-md bg-surface-2 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-24 w-full bg-surface-2 rounded-2xl" />
            <div className="h-24 w-full bg-surface-2 rounded-2xl" />
          </div>
        </div>
      </main>
    </>
  );
}
