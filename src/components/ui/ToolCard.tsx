import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { DynamicIcon } from "./DynamicIcon";

interface ToolCardProps {
  tool: ToolItem;
  featured?: boolean;
}

export function ToolCard({ tool, featured = false }: ToolCardProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-white p-6 transition-all duration-300 border border-slate-200/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 ${
        featured ? "ring-2 ring-blue-500/20 bg-gradient-to-br from-white to-blue-50/30" : ""
      }`}
    >
      <div>
        {/* Header row: Icon & Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-md shadow-blue-900/10 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-blue-600/20">
            <DynamicIcon name={tool.iconName} className="h-6 w-6" />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {tool.popular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
                <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500" />
                Popular
              </span>
            )}
            {tool.badge && !tool.popular && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/60">
                {tool.badge}
              </span>
            )}
          </div>
        </div>

        {/* Category label */}
        <div className="mb-1 text-xs font-semibold tracking-wider text-blue-600 uppercase">
          {category?.name || "Utility"}
        </div>

        {/* Tool Name */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {tool.name}
        </h3>

        {/* Short Description */}
        <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {tool.shortDescription}
        </p>
      </div>

      {/* Footer link indicator */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
        <span>Open Tool</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
