import React from "react";
import { Wrench } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 animate-bounce">
        <Wrench className="h-7 w-7" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-bold text-slate-800">Loading UFK Tools</h3>
        <p className="text-xs text-slate-400 mt-1">Preparing your workspace...</p>
      </div>
    </div>
  );
}
