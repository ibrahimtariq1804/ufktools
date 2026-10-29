import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getPopularTools } from "@/config/tools.config";
import { ToolCard } from "@/components/ui/ToolCard";

export function PopularTools() {
  const popularTools = getPopularTools();

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
              <span>Most Frequently Used</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Popular Tools
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-xl">
              Quick access to our highest-demand utilities. Fast, client-accelerated, and free without limits.
            </p>
          </div>

          <Link
            href="#all-tools"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>View All 19 Tools</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} featured={true} />
          ))}
        </div>
      </div>
    </section>
  );
}
