import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Send,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { WhatsAppIcon, YoutubeIcon } from "@/components/ui/BrandIcons";

export const metadata: Metadata = {
  title: "Contact Us — UFK Tools Support & Inquiries",
  description:
    "Contact the UFK Tools support team. Reach us directly via Phone (03338600011), official WhatsApp, or Email (ufk.channel@gmail.com) for tool assistance, feedback, or partnerships.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us — UFK Tools",
    description:
      "Get in touch with UFK Tools. Official telephone, WhatsApp, and email contact channels.",
    type: "website",
  },
};

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact UFK Tools",
    url: "https://www.ufktools.com/contact",
    description:
      "Official support and contact channels for UFK Tools online document and productivity suite.",
    mainEntity: {
      "@type": "Organization",
      name: "UFK Tools",
      url: "https://www.ufktools.com",
      telephone: "+923338600011",
      email: "ufk.channel@gmail.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+92-333-8600011",
          contactType: "customer service",
          availableLanguage: ["English", "Urdu"],
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Contact Us</span>
          </nav>

          {/* Header Banner */}
          <div className="rounded-3xl bg-white p-8 sm:p-12 shadow-sm border border-slate-200/80 text-center sm:text-left relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>We’re Here to Help</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Contact & Support Center
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Have questions about our PDF tools, suggestions for a new utility, or need technical assistance? Our dedicated support team is ready to assist you via phone, WhatsApp, and email.
              </p>
            </div>
          </div>

          {/* Primary Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Phone Support */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Phone Support</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct helpline for immediate assistance
                  </p>
                </div>
                <div className="text-lg font-black text-blue-600 tracking-tight">
                  0333 8600011
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monday to Saturday: 9:00 AM – 9:00 PM (PKT).
                </p>
              </div>
              <div className="pt-6">
                <a
                  href="tel:03338600011"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call 0333 8600011</span>
                </a>
              </div>
            </div>

            {/* Card 2: WhatsApp Chat */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <WhatsAppIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">WhatsApp Support</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast messaging & document help
                  </p>
                </div>
                <div className="text-lg font-black text-emerald-600 tracking-tight">
                  0333 8600011
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chat with our support rep directly on WhatsApp for quick responses.
                </p>
              </div>
              <div className="pt-6">
                <a
                  href="https://wa.me/923338600011"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card 3: Email Inquiries */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-400 hover:shadow-md transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Email Address</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official business & technical contact
                  </p>
                </div>
                <div className="text-sm font-extrabold text-slate-900 break-all">
                  ufk.channel@gmail.com
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send your inquiries, partnership proposals, or bug reports anytime. Typical reply within 24 hours.
                </p>
              </div>
              <div className="pt-6">
                <a
                  href="mailto:ufk.channel@gmail.com"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Secondary Details & Operating Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hours of Operation</h3>
                  <p className="text-xs text-slate-500">Live representative availability</p>
                </div>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-slate-900">Monday – Friday:</span>
                  <span>9:00 AM – 9:00 PM PKT</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-slate-900">Saturday:</span>
                  <span>10:00 AM – 6:00 PM PKT</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-slate-900">Sunday:</span>
                  <span>WhatsApp & Email Support Active</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <YoutubeIcon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Channel & Community</h3>
                  <p className="text-xs text-slate-500">Video tutorials & geopolitical insights</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                UFK Tools is proudly brought to you by the team behind the UFK YouTube channel. Subscribe for regular analyses, technology breakdowns, and platform announcements.
              </p>
              <div className="pt-1">
                <a
                  href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <span>Visit UFK YouTube Channel</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Privacy & Guarantee Note */}
          <div className="rounded-2xl bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <ShieldCheck className="h-8 w-8 text-blue-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Safe & Respectful Communication</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  We never share your email, phone number, or messages with third-party advertisers.
                </p>
              </div>
            </div>
            <Link
              href="/privacy"
              className="shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

