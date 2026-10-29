import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-16 text-center bg-slate-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-6 border border-blue-100">
        <FileQuestion className="h-10 w-10" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Page or Tool Not Found
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
        The tool or page you requested could not be located. Browse all 19 free utilities on the homepage.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to All Tools</span>
      </Link>
    </div>
  );
}
