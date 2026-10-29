import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { CATEGORIES, getToolsByCategory } from "@/config/tools.config";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

export function CategoryShowcase() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 mb-3">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>Comprehensive Directory</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Find the exact utility you need, logically sorted across five core functional areas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const toolCount =
              category.id === "picture-of-day"
                ? 1
                : getToolsByCategory(category.id).length;

            return (
              <div
                key={category.id}
                id={`category-${category.slug}`}
                className="group relative flex flex-col justify-between rounded-3xl bg-slate-50 p-8 border border-slate-200/80 transition-all duration-300 hover:bg-white hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <DynamicIcon name={category.iconName} className="h-7 w-7" />
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm border border-slate-200">
                      {toolCount} {toolCount === 1 ? "Tool" : "Tools"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>

                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/60">
                  <Link
                    href={
                      category.id === "picture-of-day"
                        ? "/picture-of-the-day"
                        : `/#all-tools`
                    }
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors"
                  >
                    <span>Explore Tools in {category.name}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
