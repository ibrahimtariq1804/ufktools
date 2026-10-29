import React from "react";
import {
  ShieldCheck,
  Zap,
  UserX,
  Lock,
  Globe2,
  Cpu,
  CheckCircle2,
} from "lucide-react";

export function ValueProps() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "100% Free Forever",
      description:
        "No hidden paywalls, no trial limits, and no watermarks placed on your documents. All utilities are free to use.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 border-emerald-200/60",
    },
    {
      icon: UserX,
      title: "Zero Registration Required",
      description:
        "Skip lengthy sign-up forms, password logins, and email verification. Launch any tool and download results instantly.",
      color: "text-blue-500",
      bgColor: "bg-blue-50 border-blue-200/60",
    },
    {
      icon: Lock,
      title: "Absolute File Privacy",
      description:
        "Client-side processing keeps your documents inside your web browser. Any temporary server processing is immediately deleted.",
      color: "text-purple-500",
      bgColor: "bg-purple-50 border-purple-200/60",
    },
    {
      icon: Zap,
      title: "Blazing Client-Side Speed",
      description:
        "Built with modern WebAssembly and HTML5 canvas engines. Merge, reorder, convert, and sign files with zero upload waiting.",
      color: "text-amber-500",
      bgColor: "bg-amber-50 border-amber-200/60",
    },
    {
      icon: Globe2,
      title: "All-in-One Utility Suite",
      description:
        "From professional resume builders to PDF operations, currency calculators, and OCR—everything in a single clean portal.",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 border-cyan-200/60",
    },
    {
      icon: Cpu,
      title: "Mobile & Desktop Optimized",
      description:
        "Designed to operate seamlessly on smartphones, tablets, and full desktop workstations with zero app download needed.",
      color: "text-rose-500",
      bgColor: "bg-rose-50 border-rose-200/60",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Built For Everyone</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Why Choose UFK Tools?
          </h2>
          <p className="mt-3 text-base text-slate-600">
            We believe everyday productivity utilities should be simple, private, fast, and accessible to anyone without subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="flex flex-col rounded-3xl bg-slate-50/70 p-8 border border-slate-200/70 transition-all duration-300 hover:bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${benefit.bgColor} border mb-6 shadow-sm`}
                >
                  <Icon className={`h-6 w-6 ${benefit.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
