import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOOLS, getToolBySlug } from "@/config/tools.config";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

// Phase 3 Specialized Tool Implementations
import { MergePdfTool } from "@/features/pdf-tools/MergePdfTool";
import { SplitPdfTool } from "@/features/pdf-tools/SplitPdfTool";
import { RotateReorderTool } from "@/features/pdf-tools/RotateReorderTool";
import { JpgToPdfTool } from "@/features/image-tools/JpgToPdfTool";
import { PdfToJpgTool } from "@/features/image-tools/PdfToJpgTool";
import { MeasurementConverterTool } from "@/features/converters/MeasurementConverterTool";
import { CurrencyConverterTool } from "@/features/converters/CurrencyConverterTool";

// Phase 4 Specialized Tool Implementations
import { CvBuilderTool } from "@/features/cv-builder/CvBuilderTool";
import { CompressPdfTool } from "@/features/pdf-tools/CompressPdfTool";
import { WordToPdfTool } from "@/features/pdf-tools/WordToPdfTool";
import { FillSignPdfTool } from "@/features/pdf-tools/FillSignPdfTool";
import { UnlockProtectPdfTool } from "@/features/pdf-tools/UnlockProtectPdfTool";

// Phase 5 Specialized Tool Implementations
import { PdfToWordTool } from "@/features/pdf-tools/PdfToWordTool";
import { EditPdfTool } from "@/features/pdf-tools/EditPdfTool";
import { OcrPdfTool } from "@/features/pdf-tools/OcrPdfTool";
import { PdfToExcelTool } from "@/features/pdf-tools/PdfToExcelTool";
import { PowerpointToPdfTool } from "@/features/pdf-tools/PowerpointToPdfTool";
import { ChatPdfTool } from "@/features/pdf-tools/ChatPdfTool";
import { NicheConvertersTool } from "@/features/converters/NicheConvertersTool";

interface ToolPageProps {
  params: Promise<{
    toolSlug: string;
  }>;
}

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({
    toolSlug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    return {
      title: "Tool Not Found — UFK Tools",
      description: "The requested tool could not be found.",
    };
  }

  return {
    title: `${tool.name} — Free Online Tool | UFK Tools`,
    description: tool.fullDescription,
    keywords: [
      tool.name,
      "free online tools",
      "PDF tools",
      "UFK tools",
      tool.category,
      ...tool.features,
    ],
    openGraph: {
      title: `${tool.name} — Free Online Utility | UFK Tools`,
      description: tool.shortDescription,
      type: "website",
      siteName: "UFK Tools",
    },
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    notFound();
  }

  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    operatingSystem: "All",
    applicationCategory: "UtilitiesApplication",
    description: tool.fullDescription,
    url: `https://ufktools.com/tools/${tool.slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tool.features.join(", "),
  };

  const renderToolComponent = () => {
    switch (tool.slug) {
      // Phase 3 Tools
      case "merge-pdf":
        return <MergePdfTool tool={tool} />;
      case "split-pdf":
        return <SplitPdfTool tool={tool} />;
      case "jpg-to-pdf":
        return <JpgToPdfTool tool={tool} />;
      case "pdf-to-jpg":
        return <PdfToJpgTool tool={tool} />;
      case "rotate-reorder-delete-pdf":
        return <RotateReorderTool tool={tool} />;
      case "measurement-converter":
        return <MeasurementConverterTool tool={tool} />;
      case "currency-converter":
        return <CurrencyConverterTool tool={tool} />;

      // Phase 4 Tools
      case "cv-builder":
        return <CvBuilderTool tool={tool} />;
      case "compress-pdf":
        return <CompressPdfTool tool={tool} />;
      case "word-to-pdf":
        return <WordToPdfTool tool={tool} />;
      case "fill-and-sign-pdf":
        return <FillSignPdfTool tool={tool} />;
      case "unlock-protect-pdf":
        return <UnlockProtectPdfTool tool={tool} />;

      // Phase 5 Tools
      case "pdf-to-word":
        return <PdfToWordTool tool={tool} />;
      case "edit-pdf":
        return <EditPdfTool tool={tool} />;
      case "ocr-pdf":
        return <OcrPdfTool tool={tool} />;
      case "pdf-to-excel":
        return <PdfToExcelTool tool={tool} />;
      case "powerpoint-to-pdf":
        return <PowerpointToPdfTool tool={tool} />;
      case "chat-pdf":
        return <ChatPdfTool tool={tool} />;
      case "niche-converters":
        return <NicheConvertersTool tool={tool} />;

      default:
        return <ToolPageShell tool={tool} />;
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      {renderToolComponent()}
    </>
  );
}
