"use client";

import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs animate-pulse flex flex-col justify-between">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-800">
        <div className="absolute top-3 left-3 w-16 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Brand */}
          <div className="w-1/3 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          {/* Title */}
          <div className="w-full h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-2/3 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Price & Rating */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="w-16 h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-10 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="w-full h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 mt-2" />
        </div>
      </div>
    </div>
  );
}
