import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";
import { YoutubeIcon } from "@/components/ui/BrandIcons";

export const metadata: Metadata = {
  title: "About UFK Tools — Free Online Tools for Everyone",
  description:
    "Learn about UFK Tools, our mission to provide high-performance, private, zero-cost productivity utilities, and our connection to the UFK YouTube community.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-4">
            <Wrench className="h-3.5 w-3.5" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            About UFK Tools
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            All the online tools you need in one place. Engineered to be 100% free, blazingly fast, and respectful of your document privacy.
          </p>
        </div>

        {/* Story Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed mb-12">
          <h2 className="text-2xl font-bold text-slate-900">
            Why We Built UFK Tools
          </h2>
          <p>
            Too many everyday document tasks—merging a few PDF receipts, shrinking a file for email, converting an image, or drafting a clean resume—are blocked behind aggressive paywalls, mandatory account creations, and deceptive free trials.
          </p>
          <p>
            <strong>UFK Tools</strong> was established with a singular principle: <em>essential utility software should be accessible to everyone, everywhere, at zero cost.</em> By leveraging modern browser technologies like WebAssembly, client-side canvas rendering, and optimized open-source engines, we deliver professional-grade capabilities without passing server costs on to users.
          </p>
          
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-black text-blue-600">19</div>
              <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Core Utilities</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600">0$</div>
              <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Cost To Use</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-600">0</div>
              <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Accounts Required</div>
            </div>
          </div>
        </div>

        {/* UFK Community Card */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-10 text-white shadow-xl mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 border border-red-500/30">
                <YoutubeIcon className="h-4 w-4 text-red-400" />
                <span>UFK YouTube Channel</span>
              </div>
              <h3 className="text-2xl font-bold">
                Proudly Supported by the UFK Community
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                UFK Tools is proudly built in tandem with the UFK YouTube channel, dedicated to delivering helpful tutorials, tech insights, and empowering productivity software for students and professionals worldwide.
              </p>
            </div>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-bold text-white transition-colors shadow-lg shadow-red-600/30"
            >
              <span>Visit Channel</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Explore All 19 Tools</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
