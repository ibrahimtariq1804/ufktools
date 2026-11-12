import React from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Zap,
  Lightbulb,
  FileCheck,
  Lock,
  Cpu,
  Layers,
  ArrowRight,
  Globe,
  Sparkles,
} from "lucide-react";
import { ToolItem } from "@/config/tools.config";

interface ToolEducationalContentProps {
  tool: ToolItem;
}

interface ToolEditorialData {
  title: string;
  subtitle: string;
  workingPrinciple: string;
  technicalDetails: string[];
  useCases: { title: string; desc: string }[];
  proTips: string[];
  securityNote: string;
}

const TOOL_EDITORIAL_DATA: Record<string, ToolEditorialData> = {
  "merge-pdf": {
    title: "The Definitive Guide to Merging PDF Files Securely",
    subtitle: "Combine multiple PDF documents, receipts, invoices, and contracts into one unified, perfectly formatted file.",
    workingPrinciple:
      "When you merge PDF files with UFK Tools, the operation runs directly in your browser using high-performance WebAssembly. The parser inspects the binary Cross-Reference Table (XREF) of each file, preserves all original fonts, high-resolution vector lines, and embedded images, and reassembles them sequentially into a single unified document stream. Because no files are uploaded to an external server, your sensitive business contracts, medical files, and personal records remain strictly confidential on your device.",
    technicalDetails: [
      "Zero-server upload: All processing is conducted inside browser memory using WebAssembly.",
      "Lossless page extraction: Vector paths, TrueType fonts, and CMYK/RGB color profiles are untouched.",
      "Custom page sequencing: Drag and drop files to rearrange the exact order of appearance before merging.",
      "Unlimited file capacity: Merge as many documents as needed without artificial limits or paywalls.",
    ],
    useCases: [
      {
        title: "Business Proposals & Reports",
        desc: "Consolidate executive summaries, financial spreadsheets, and marketing exhibits into a single polished proposal for clients or investors.",
      },
      {
        title: "Academic Research & Thesis",
        desc: "Combine literature reviews, methodology chapters, bibliographies, and appendixes into one cohesive dissertation ready for university submission.",
      },
      {
        title: "Tax, Accounting & Receipts",
        desc: "Collate monthly receipts, bank statements, and tax return schedules into a single chronological archive for your accountant or tax authority.",
      },
      {
        title: "Legal & Real Estate Contracts",
        desc: "Assemble lease agreements, addendums, identification records, and closing documents into one complete packet for signature.",
      },
    ],
    proTips: [
      "Ensure all individual PDFs are unlocked before merging; if password-protected, remove encryption first.",
      "Drag files into your desired reading order before clicking 'Merge' to avoid needing post-processing page reordering.",
      "Check that page dimensions are compatible if you plan to print the combined document as a physical booklet.",
    ],
    securityNote:
      "Your documents are processed locally in your web browser. UFK Tools never transmits, reads, stores, or sells any document data.",
  },

  "split-pdf": {
    title: "How to Split & Extract Pages from PDF Documents",
    subtitle: "Effortlessly isolate specific pages, remove unwanted content, or split large books into individual chapter files.",
    workingPrinciple:
      "UFK Tools Split PDF tool reads the internal page tree structure of your document, extracts the exact pages or ranges you define (such as '1-3, 5, 8-12'), and constructs lightweight, clean PDF documents containing only the selected pages. Alternatively, select 'Split Every Page' to batch-extract every single page as an individual PDF packaged neatly into an instant ZIP archive. All operations happen in local memory with zero upload lag.",
    technicalDetails: [
      "Flexible page targeting: Specify custom individual pages, continuous ranges, or batch-split every page.",
      "Automatic ZIP packaging: Multi-file splits are instantly bundled into an uncompressed or compressed ZIP for one-click downloading.",
      "Metadata and bookmark preservation: Hyperlinks and internal bookmarks on extracted pages remain intact.",
      "High-speed client execution: Split a 500-page textbook in less than three seconds without server latency.",
    ],
    useCases: [
      {
        title: "Extracting Invoices & Statements",
        desc: "Pull out only your relevant invoice from a 50-page monthly vendor billing batch without sending confidential data across the web.",
      },
      {
        title: "Sharing Specific Presentation Slides",
        desc: "Extract a 3-slide excerpt from a massive 100-slide keynote to email colleagues or share on social platforms.",
      },
      {
        title: "Removing Blank or Error Pages",
        desc: "Isolate and discard blank scanning separator sheets or misprinted pages from scanned document archives.",
      },
      {
        title: "Book Chapter Division",
        desc: "Divide lengthy digital textbooks, manuals, or research papers into bite-sized chapters for students and reading groups.",
      },
    ],
    proTips: [
      "Use commas to separate different ranges (e.g. '1-4, 7, 10-15') to extract disjointed chapters in one go.",
      "Check total page count displayed on the upload card to verify you do not specify page numbers beyond the document's end.",
      "Keep the original file intact as a backup while working with newly extracted smaller files.",
    ],
    securityNote:
      "Client-side execution guarantees your confidential documents never leave your laptop or smartphone.",
  },

  "compress-pdf": {
    title: "Smart PDF Compression Without Sacrificing Visual Quality",
    subtitle: "Shrink bloated PDF file sizes for easy email sharing, website uploading, and mobile archiving.",
    workingPrinciple:
      "PDF files often become unnecessarily large due to redundant metadata, unoptimized high-DPI raster images, and duplicate embedded font subsets. UFK Tools Compression engine intelligently parses the PDF stream, optimizes raster image DCT/Flate compression dictionaries, strips orphan objects, and repackages the document into a streamlined, web-optimized format while keeping typography sharp and readable.",
    technicalDetails: [
      "Smart raster downsampling: Balances high visual clarity with significant file size reduction.",
      "Orphan metadata stripping: Removes unneeded print crop marks, XML editing history, and redundant color profiles.",
      "Font subset deduplication: Consolidates repeated glyph tables to minimize binary overhead.",
      "100% compliant PDF/A output: Guaranteed compatibility with Adobe Acrobat, Apple Preview, and modern web browsers.",
    ],
    useCases: [
      {
        title: "Email Attachment Limit Bypassing",
        desc: "Easily reduce 40MB PDF files down below the 20MB or 25MB attachment thresholds imposed by Gmail, Outlook, and corporate exchange servers.",
      },
      {
        title: "Government & Job Portal Uploads",
        desc: "Meet strict file size caps (such as 2MB or 5MB limits) on university application portals, visa application sites, and ATS hiring systems.",
      },
      {
        title: "Faster Mobile & Web Viewing",
        desc: "Optimize whitepapers and product brochures for fast over-the-air loading on mobile phones with limited cellular bandwidth.",
      },
      {
        title: "Cloud Storage Optimization",
        desc: "Save gigabytes of space in your Google Drive, Dropbox, or OneDrive by compressing historical document archives.",
      },
    ],
    proTips: [
      "For text-heavy documents with few images, compression produces virtually identical visual quality at a fraction of the file size.",
      "Always inspect the output preview if your document contains intricate architectural blueprints or medical scans.",
      "Batch-compress older reports to save valuable disk space on portable laptops and storage drives.",
    ],
    securityNote:
      "All file stream compression algorithms run inside your device's memory. No document data is saved or indexed on our servers.",
  },

  "cv-builder": {
    title: "Build Modern, ATS-Friendly Resumes & CVs Online",
    subtitle: "Create professional, recruiter-ready resumes that pass applicant tracking systems and win interviews.",
    workingPrinciple:
      "Modern hiring relies heavily on Applicant Tracking Systems (ATS) that parse resume typography, headers, and bullet structures. UFK Tools CV Builder generates clean, semantic, vector-based PDF resumes that ensure every word, skill, and certification is 100% machine-readable. Choose from curated executive, creative, and technical layouts, customize colors, and download a print-ready vector PDF instantly without forced account signups.",
    technicalDetails: [
      "Real-time interactive preview: Instant side-by-side rendering as you edit your work experience and education.",
      "ATS-compliant typography: Structured hierarchy and clean character encoding prevent applicant parsing errors.",
      "Auto-saving local draft: Your resume content is safely preserved in browser local storage so you never lose progress.",
      "High-DPI vector PDF export: Crystal-clear printing on A4 and US Letter sizes without blurry pixelation.",
    ],
    useCases: [
      {
        title: "Job Seekers & Career Changers",
        desc: "Quickly adapt your resume for new career opportunities, highlighting transferable skills and quantifiable achievements.",
      },
      {
        title: "Recent University Graduates",
        desc: "Build your first professional CV showcasing academic projects, internships, leadership roles, and extracurricular honors.",
      },
      {
        title: "Freelancers & Contractors",
        desc: "Maintain a sharp, modern summary of your client engagements, specialized toolsets, and project deliverables.",
      },
      {
        title: "Executive & Senior Leadership",
        desc: "Showcase career milestones, corporate board directorships, revenue growth metrics, and strategic organizational impact.",
      },
    ],
    proTips: [
      "Use action verbs (e.g. 'Engineered', 'Spearheaded', 'Optimized') and quantify accomplishments with percentages and dollar figures.",
      "Keep your resume focused to one or two pages depending on your years of relevant industry experience.",
      "Review your contact details, phone number, and LinkedIn URL carefully before exporting your final PDF.",
    ],
    securityNote:
      "Your personal information, work history, and contact details remain strictly in your browser. We never collect or sell candidate profiles.",
  },

  "currency-converter": {
    title: "Real-Time Global Currency Exchange Rates & Calculator",
    subtitle: "Convert between world currencies with live market rates, historical context, and instant bidirectional calculation.",
    workingPrinciple:
      "Global currency values fluctuate continuously based on macroeconomic indicators, interest rates, trade balances, and international market liquidity. UFK Tools Currency Converter pulls live institutional exchange rates through high-availability financial feeds, providing real-time conversions across major global currencies like USD, EUR, GBP, JPY, CAD, AUD, AED, SAR, and PKR. The interface automatically calculates inverse rates and supports rapid amount typing.",
    technicalDetails: [
      "Live exchange rates: Frequently refreshed mid-market rates derived from authoritative international foreign exchange feeds.",
      "Instant inverse conversion: Toggle source and target currencies with one click to calculate reverse exchange rates.",
      "Quick amount presets: Rapidly test common amounts ($10, $50, $100, $500, $1,000) for fast budget planning.",
      "Comprehensive currency coverage: Includes North American, European, Middle Eastern, Asian, and Pacific economic zones.",
    ],
    useCases: [
      {
        title: "International Travel & Tourism",
        desc: "Calculate daily food, accommodation, and transport budgets in foreign currencies before and during overseas trips.",
      },
      {
        title: "Cross-Border E-Commerce",
        desc: "Determine the exact cost of imported goods, digital software licenses, or consumer electronics sold in foreign currencies.",
      },
      {
        title: "Freelancers & Remote Contractors",
        desc: "Compute net earnings and invoice totals when billing international clients in USD, EUR, GBP, or receiving local remittances.",
      },
      {
        title: "Financial Planning & Remittances",
        desc: "Track the best conversion windows when sending remittances to family members or transferring savings across borders.",
      },
    ],
    proTips: [
      "Note that bank credit card issuers and currency exchange booths often add a 1% to 3% markup over mid-market wholesale rates.",
      "Use the quick swap button to instantly see how much foreign currency is needed to equal a specific local sum.",
      "Bookmark the converter on your mobile phone for instant offline and travel rate lookups on the go.",
    ],
    securityNote:
      "All calculation logic runs securely in real time. We do not track your monetary amounts or financial queries.",
  },

  "measurement-converter": {
    title: "Universal Measurement Converter: Length, Mass, Temp, Volume & More",
    subtitle: "High-precision unit conversion across metric, imperial, and digital storage systems with zero rounding drift.",
    workingPrinciple:
      "Engineers, students, culinary chefs, and international travelers constantly navigate differences between metric (SI) and imperial measurement systems. UFK Tools Universal Measurement Converter employs high-precision IEEE-754 double-precision arithmetic to convert between units across seven essential categories: Length, Weight/Mass, Temperature, Area, Volume, Speed, and Digital Storage without cumulative rounding errors.",
    technicalDetails: [
      "7 Core Measurement Domains: Length, Mass, Temperature, Volume, Area, Speed, and Digital Data Storage.",
      "Bidirectional instant updates: Changing either the input quantity or unit instantly recomputes all target equivalents.",
      "Standardized conversion constants: Based on NIST (National Institute of Standards and Technology) calibration standards.",
      "Responsive category selector: Easily switch between engineering, culinary, scientific, and IT unit groups.",
    ],
    useCases: [
      {
        title: "Culinary & Baking Recipes",
        desc: "Convert American cups, ounces, and Fahrenheit oven temperatures into European grams, milliliters, and Celsius.",
      },
      {
        title: "Engineering & Construction",
        desc: "Translate architectural blueprints between feet, inches, meters, millimeters, and square footage effortlessly.",
      },
      {
        title: "Science & Academic Studies",
        desc: "Convert physical parameters like speed (mph to km/h, knots) and mass (kg to lbs, stones) for lab reports and physics problems.",
      },
      {
        title: "IT & Digital Storage Capacity",
        desc: "Accurately compute storage equivalents between Megabytes (MB), Gigabytes (GB), Terabytes (TB), and binary Gibibytes (GiB).",
      },
    ],
    proTips: [
      "Remember that Temperature conversion involves both multiplication and baseline offset (°C × 9/5 + 32 = °F).",
      "For precise construction measurements, verify whether your source plans use decimal inches or fractional sixteenths.",
      "Use digital storage conversions to understand actual usable hard drive capacity versus manufacturer decimal ratings.",
    ],
    securityNote:
      "Calculations occur entirely within your local browser JavaScript engine. No input data is transmitted to external servers.",
  },

  "jpg-to-pdf": {
    title: "Convert JPG & PNG Images into Professional PDF Documents",
    subtitle: "Combine scanned photos, receipts, identity documents, and artwork into clean, high-resolution PDF pages.",
    workingPrinciple:
      "Images captured on smartphones and scanners often suffer from orientation issues and varying aspect ratios. UFK Tools JPG to PDF converter analyzes image dimensions, applies high-fidelity canvas scaling, and encapsulates each picture into standard page geometries (such as A4 or Letter). The resulting document maintains full photographic resolution while providing universal PDF compatibility for printing, emailing, and archival.",
    technicalDetails: [
      "Multi-image batch support: Upload dozens of photos simultaneously and reorder them with drag-and-drop ease.",
      "Aspect ratio preservation: Automatic smart centering prevents stretching, distortion, or unwanted edge cropping.",
      "Supports modern image formats: Compatible with JPEG, JPG, PNG, and WebP raster images.",
      "Client-side image baking: Zero compression degradation ensures your high-definition photos remain razor-sharp.",
    ],
    useCases: [
      {
        title: "Government ID & Document Verification",
        desc: "Assemble photos of your passport, driver's license, and utility bills into a single clean PDF for identity verification.",
      },
      {
        title: "Expense Reporting & Tax Receipts",
        desc: "Photograph physical paper receipts on your phone and convert them into an orderly chronological PDF expense report.",
      },
      {
        title: "Portfolios & Photography Lookbooks",
        desc: "Package graphic design portfolios, artwork collections, and real estate photography into an elegant client document.",
      },
      {
        title: "Handwritten Notes & Whiteboard Scans",
        desc: "Digitize handwritten meeting notes, lecture blackboard photos, and study diagrams into an organized digital binder.",
      },
    ],
    proTips: [
      "Crop unnecessary background shadows from your photos before converting for a cleaner, professional look.",
      "Arrange images in logical order (e.g. Page 1, Page 2) before generating the final merged PDF.",
      "Check that lighting is uniform so text in your scanned photos remains easily readable when viewed on laptops.",
    ],
    securityNote:
      "Your private photographs and document scans never leave your device. All image encapsulation is 100% local.",
  },

  "pdf-to-jpg": {
    title: "High-Resolution PDF to JPG / PNG Page Converter",
    subtitle: "Extract crisp, high-definition image files from any PDF page for web publishing, presentations, and social media.",
    workingPrinciple:
      "Extracting pages from a PDF as images often results in blurry text if converted improperly. UFK Tools PDF to JPG engine utilizes high-resolution PDF rendering pipelines to rasterize vector strokes, typographic fonts, and embedded graphics at high DPI onto HTML5 Canvas surfaces. It then exports crisp, uncompressed JPEG or PNG images ready for embedding into websites, PowerPoint presentations, or social feeds.",
    technicalDetails: [
      "High-DPI rendering: Produces sharp, clean typography suitable for zoom-in viewing and professional presentations.",
      "Individual or batch extraction: Export specific key pages or extract all pages into an organized ZIP archive.",
      "Universal image output: Standard JPEG format ensures compatibility with photo editors, CMS platforms, and mobile galleries.",
      "No quality loss: Text edges and fine vector diagrams remain crisp without chromatic aberration.",
    ],
    useCases: [
      {
        title: "Presentation Slides (PowerPoint & Keynote)",
        desc: "Insert specific PDF document pages, charts, and diagrams directly into your presentation slide deck.",
      },
      {
        title: "Social Media & Portfolio Publishing",
        desc: "Share flyer designs, certificate awards, and infographic pages on LinkedIn, Instagram, Facebook, and Twitter.",
      },
      {
        title: "Website & Blog Graphics",
        desc: "Convert whitepapers, research figures, and magazine layouts into web-friendly images for blog articles.",
      },
      {
        title: "Photo Editing & Annotation",
        desc: "Open PDF pages in photo editing software like Photoshop, GIMP, or Canva to apply artistic filters and overlays.",
      },
    ],
    proTips: [
      "Select PNG format when extracting pages containing transparent backgrounds or intricate line drawings.",
      "Extract only the specific pages you need to save bandwidth and download time.",
      "Use high-DPI settings when preparing images for physical printing or large projection displays.",
    ],
    securityNote:
      "Document rasterization runs in your browser's local sandbox memory. Your sensitive files remain strictly private.",
  },

  "rotate-reorder-delete-pdf": {
    title: "Interactive PDF Page Organizer: Rotate, Reorder & Delete Pages",
    subtitle: "Fix upside-down scans, rearrange page sequences, and remove unwanted pages with visual drag-and-drop simplicity.",
    workingPrinciple:
      "Scanned multipage documents frequently end up with upside-down pages, out-of-order chapters, or blank divider sheets. UFK Tools Visual PDF Organizer renders thumbnail previews of every page in your file. Click the rotate controls to turn individual pages 90, 180, or 270 degrees, drag thumbnails to re-sequence them intuitively, or click the trash icon to delete unwanted pages before exporting a freshly compiled PDF.",
    technicalDetails: [
      "Live visual thumbnails: Inspect page contents visually before committing any rotation or deletion changes.",
      "Multi-angle rotation: Rotate individual pages or all pages clockwise or counterclockwise in 90-degree increments.",
      "Fluid drag-and-drop: Reorder pages naturally with animated visual feedback.",
      "Instant client compiling: Generates the updated PDF document locally in milliseconds.",
    ],
    useCases: [
      {
        title: "Correcting Scanned Documents",
        desc: "Rotate upside-down or sideways pages caused by automated duplex sheet-fed office scanners.",
      },
      {
        title: "Removing Blank & Separator Sheets",
        desc: "Delete empty back-pages, barcode covers, and scanning separator sheets from digital archives.",
      },
      {
        title: "Reorganizing Presentation Flow",
        desc: "Rearrange slide sequences or appendix pages in your final document without returning to authoring software.",
      },
      {
        title: "Preparing Clean Legal Packets",
        desc: "Ensure every exhibit, contract amendment, and signature page is upright and in strict numerical sequence.",
      },
    ],
    proTips: [
      "Rotate landscape tables and financial charts so readers don't have to tilt their heads when viewing on screens.",
      "Double-check page numbers after deleting pages to confirm you did not remove necessary exhibits.",
      "Save the newly organized file under a distinct name to preserve your original document as a reference.",
    ],
    securityNote:
      "Thumbnail generation and page manipulation occur purely in your browser memory with zero server data storage.",
  },
};

// Generic fallback editorial data for tools that have specialized client tools
const DEFAULT_EDITORIAL_DATA: ToolEditorialData = {
  title: "Professional, Secure & Free Online Document Utility",
  subtitle: "Process your files with blazing speed, total privacy, and zero software installation required.",
  workingPrinciple:
    "UFK Tools provides an advanced suite of document and file manipulation utilities built to operate seamlessly inside modern web browsers. Leveraging cutting-edge WebAssembly and client-side processing, our tools deliver workstation-grade performance without sending your sensitive data over the internet. Whether you are formatting resumes, converting currencies, or manipulating PDFs, you enjoy uncompromising privacy, zero subscription fees, and instant download speeds.",
  technicalDetails: [
    "Browser-native execution: Critical data processing executes inside your local device sandbox.",
    "Zero data retention: Your files are never stored, logged, indexed, or shared with third parties.",
    "Cross-platform compatibility: Works flawlessly on Windows, macOS, Linux, iOS, Android, and ChromeOS.",
    "High-fidelity output: Retains standard formatting, fonts, vectors, and metadata without watermarks.",
  ],
  useCases: [
    {
      title: "Students & Academic Researchers",
      desc: "Prepare, convert, and format research papers, project reports, and homework assignments with ease.",
    },
    {
      title: "Remote Workers & Small Businesses",
      desc: "Handle daily paperwork, contracts, invoices, and foreign currency calculations without expensive software licenses.",
    },
    {
      title: "Designers & Content Creators",
      desc: "Transform images, optimize file weights, and prepare clean vector documents for clients and publishing.",
    },
    {
      title: "Daily Office & Administrative Tasks",
      desc: "Streamline repetitive document management workflows with intuitive one-click web utilities.",
    },
  ],
  proTips: [
    "Bookmark this utility for instant access whenever you need fast, private file handling.",
    "Check your device download folder after processing to find your completed, clean document.",
    "Feel confident using this tool for confidential personal, financial, and legal documents thanks to client-side isolation.",
  ],
  securityNote:
    "Your privacy is our core guarantee. All client operations run locally on your device with zero server storage.",
};

export function ToolEducationalContent({ tool }: ToolEducationalContentProps) {
  const editorial = TOOL_EDITORIAL_DATA[tool.slug] || DEFAULT_EDITORIAL_DATA;

  return (
    <section className="mt-12 space-y-12 border-t border-slate-200/80 pt-12 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-4">
          <BookOpen className="h-3.5 w-3.5" />
          <span>User Guide & Educational Documentation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {editorial.title}
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          {editorial.subtitle}
        </p>
      </div>

      {/* How it Works In-Depth Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              How {tool.name} Operates Under the Hood
            </h3>
            <p className="text-xs text-slate-500">
              Technical transparency and architectural breakdown
            </p>
          </div>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          {editorial.workingPrinciple}
        </p>
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {editorial.technicalDetails.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-World Use Cases Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <span>Common Practical Use Cases</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Discover how professionals, students, and businesses leverage {tool.name} daily
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {editorial.useCases.map((useCase, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {useCase.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-10">
                {useCase.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips & Best Practices */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-bold">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              Pro Tips & Best Practices for Best Results
            </h3>
            <p className="text-xs text-slate-400">
              Expert recommendations for optimizing output quality and workflow efficiency
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {editorial.proTips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Verification Guarantee */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Enterprise Privacy & Data Integrity
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              {editorial.securityNote}
            </p>
          </div>
        </div>
        <Link
          href="/privacy"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
        >
          <span>Read Privacy Policy</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

