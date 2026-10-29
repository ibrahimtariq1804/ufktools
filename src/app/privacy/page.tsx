import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Trash2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy & Document Security — UFK Tools",
  description:
    "Our ironclad commitment to file privacy. Learn how client-side processing keeps your documents private on your device, and how temporary server processing is immediately purged.",
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-3">
            <Lock className="h-3.5 w-3.5" />
            <span>Strict Privacy Standards</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Privacy Policy & File Security
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            We believe your personal documents, contracts, CVs, and records belong exclusively to you.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>1. Client-Side Processing by Default</span>
            </h2>
            <p>
              Whenever technologically feasible (such as in Merge PDF, Split PDF, Rotate PDF, JPG to PDF, CV Builder, and Measurement Converters), all data processing executes 100% inside your local web browser using WebAssembly and HTML5 Canvas.
            </p>
            <p className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-sm border border-emerald-200">
              <strong>Your files never travel over the internet to our servers</strong> for client-side operations. They remain securely inside your computer or mobile device memory.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-blue-600" />
              <span>2. Automated Ephemeral Server Processing</span>
            </h2>
            <p>
              For advanced operations requiring server-level engines (such as PDF to Word, LibreOffice conversions, or Tesseract OCR), files are transmitted over encrypted TLS connections to an isolated sandbox environment.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              <li>Files are assigned random, non-guessable UUIDs.</li>
              <li>Documents are permanently and immediately erased the moment your download starts.</li>
              <li>An automated cleanup daemon continuously scans and purges any orphaned temporary files older than 15 minutes.</li>
              <li>We never read, inspect, archive, or train AI models on user documents.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              3. No Accounts & No Tracking
            </h2>
            <p>
              Public users do not create accounts, passwords, or profiles to use UFK Tools. We do not track your identity across sessions or sell advertising profiles to third-party data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              4. Contact Our Team
            </h2>
            <p>
              If you have any questions regarding file privacy or security architecture, feel free to reach out via our community channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
