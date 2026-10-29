import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — UFK Tools",
  description: "Terms and conditions of using UFK Tools free online utility platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200 mb-3">
            <FileText className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Clear, transparent guidelines for using the UFK Tools platform.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing and using UFK Tools, you agree to comply with and be bound by these terms. If you do not agree, you should not use our services.
          </p>

          <h2 className="text-xl font-bold text-slate-900">2. Free Use & Fair Usage</h2>
          <p>
            All tools are offered free of charge. Users agree not to misuse our infrastructure through automated scraping, denial of service attacks, or bypassing upload limits.
          </p>

          <h2 className="text-xl font-bold text-slate-900">3. Intellectual Property Rights</h2>
          <p>
            You retain 100% full ownership, rights, and title to all documents, images, and content you upload or process through UFK Tools. UFK Tools claims zero ownership over your files.
          </p>

          <h2 className="text-xl font-bold text-slate-900">4. Disclaimer of Warranties</h2>
          <p>
            Our services are provided &ldquo;as is&rdquo; without warranties of any kind. While we strive for high conversion fidelity, users are encouraged to maintain backups of critical original documents.
          </p>
        </div>
      </div>
    </div>
  );
}
