import React from "react";
import { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FeaturedHighlight } from "@/components/home/FeaturedHighlight";
import { PopularTools } from "@/components/home/PopularTools";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ToolDirectory } from "@/components/home/ToolDirectory";
import { ValueProps } from "@/components/home/ValueProps";

export const metadata: Metadata = {
  title: "UFK Tools — All the Online Tools You Need in One Place",
  description:
    "Free PDF tools, document converters, image utilities, resume builder, calculators, and daily featured facts. 100% free with no registration required.",
  keywords: [
    "UFK Tools",
    "Free online tools",
    "PDF tools",
    "Merge PDF",
    "Compress PDF",
    "PDF to Word",
    "Resume Builder",
    "Currency Converter",
    "Fact of the Day",
  ],
  openGraph: {
    title: "UFK Tools — Free PDF, AI, Converter & Productivity Tools",
    description: "All the online tools you need in one place. Free online tools for everyone.",
    url: "https://ufktools.com",
    siteName: "UFK Tools",
    locale: "en_US",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Flagship Highlight: Picture / Fact of the Day */}
      <FeaturedHighlight />

      {/* 3. Popular Tools Grid */}
      <PopularTools />

      {/* 4. Browse by Category */}
      <CategoryShowcase />

      {/* 5. Complete Searchable All Tools Directory (19 Tools) */}
      <ToolDirectory />

      {/* 6. Why Choose UFK Tools */}
      <ValueProps />
    </div>
  );
}
