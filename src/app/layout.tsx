import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ufktools.com"),
  title: {
    default: "UFK Tools — Free PDF, AI, Converter & Productivity Tools",
    template: "%s | UFK Tools",
  },
  description:
    "All the online tools you need in one place. Convert, compress, edit, create and manage your files with free online tools designed for everyone.",
  keywords: [
    "PDF tools",
    "free PDF editor",
    "resume builder",
    "currency converter",
    "image to PDF",
    "UFK tools",
    "Picture of the Day",
  ],
  authors: [{ name: "UFK Tools Team" }],
  creator: "UFK Tools",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ufktools.com",
    title: "UFK Tools — Free Online Tools for Everyone",
    description:
      "All the online tools you need in one place. Convert, compress, edit, create and manage your files with free online tools.",
    siteName: "UFK Tools",
  },
  twitter: {
    card: "summary_large_image",
    title: "UFK Tools — Free Online Tools for Everyone",
    description: "Free PDF tools, converters, resume builder, and daily facts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://ufktools.com/#website",
        "url": "https://ufktools.com",
        "name": "UFK Tools",
        "description":
          "All the online tools you need in one place. Convert, compress, edit, create and manage your files with free online tools designed for everyone.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://ufktools.com/?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://ufktools.com/#organization",
        "name": "UFK Tools",
        "url": "https://ufktools.com",
        "logo": "https://ufktools.com/globe.svg",
        "sameAs": ["https://youtube.com/@ufk"],
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AnalyticsProvider />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
