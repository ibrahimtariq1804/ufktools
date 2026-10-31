"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layout,
  HelpCircle,
  Shield,
  RotateCcw,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  User,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { trackToolAction } from "@/lib/analytics";

interface CvBuilderToolProps {
  tool: ToolItem;
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  graduationYear: string;
  honors: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  description: string;
}

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: WorkExperience[];
  education: EducationItem[];
  projects: ProjectItem[];
}

const DEFAULT_SAMPLE_RESUME: ResumeData = {
  fullName: "Alexander Wright",
  jobTitle: "Senior Systems Engineer & Aerospace Specialist",
  email: "alexander.wright@defense-systems.com",
  phone: "+1 (555) 349-8821",
  location: "Washington, D.C., USA",
  website: "https://alexanderwright.dev",
  linkedin: "linkedin.com/in/alex-wright-systems",
  summary:
    "Rigorous, results-oriented systems engineer with 8+ years of expertise in avionics integration, real-time distributed telemetry, and mission-critical hardware-in-the-loop validation. Experienced in driving military-grade software compliance, multi-sensor data fusion, and high-reliability embedded architectures.",
  skills:
    "C/C++, Python, Rust, Linux Kernel, AESA Radar Telemetry, RTOS (FreeRTOS, VxWorks), MIL-STD-1553, DO-178C, Git, Docker, System Architecture, RF Communications",
  experiences: [
    {
      id: "exp-1",
      role: "Lead Avionics Software Architect",
      company: "Advanced Aerospace Dynamics",
      location: "Arlington, VA",
      startDate: "2021",
      endDate: "Present",
      current: true,
      description:
        "Architected next-generation sensor fusion algorithms for electro-optical distributed aperture systems.\nSpearheaded a team of 12 engineers in achieving DO-178C Level A certification for tactical flight telemetry.\nReduced optical sensor data latency by 34% through zero-copy ring buffer pipelines.",
    },
    {
      id: "exp-2",
      role: "Embedded Systems Engineer",
      company: "Apex Defense Technologies",
      location: "Huntsville, AL",
      startDate: "2018",
      endDate: "2021",
      current: false,
      description:
        "Developed low-level device drivers for FPGA-accelerated radar signal processing units.\nEngineered automated hardware-in-the-loop (HIL) test harness simulating high-G acoustic environments.\nCollaborated directly with Department of Defense program managers to deliver milestones on schedule.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "M.S. in Electrical & Computer Engineering",
      school: "Georgia Institute of Technology",
      location: "Atlanta, GA",
      graduationYear: "2018",
      honors: "Summa Cum Laude, Defense Robotics Fellow",
    },
    {
      id: "edu-2",
      degree: "B.S. in Aerospace Engineering",
      school: "Purdue University",
      location: "West Lafayette, IN",
      graduationYear: "2016",
      honors: "Dean's High Honors List",
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "Real-Time Telemetry Ground Station",
      techStack: "Rust, WebAssembly, WebSockets, Three.js",
      link: "github.com/alexwright/ground-station",
      description:
        "Open-source 60 FPS 3D spatial aircraft visualizer processing high-frequency UDP packets with sub-millisecond jitter.",
    },
    {
      id: "proj-2",
      title: "SDR Multi-Channel Signal Demodulator",
      techStack: "Python, GNU Radio, NumPy",
      link: "github.com/alexwright/sdr-demod",
      description:
        "Autonomous software-defined radio receiver pipeline decoding ADS-B transponder packets with automated aircraft tracking.",
    },
  ],
};

const EMPTY_RESUME: ResumeData = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  summary: "",
  skills: "",
  experiences: [],
  education: [],
  projects: [],
};

type TemplateId = "executive" | "tech" | "clean";

export function CvBuilderTool({ tool }: CvBuilderToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);

  // Resume state with localStorage support (lazy initial state)
  const [resume, setResume] = useState<ResumeData>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ufk_cv_data");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Fall back to sample
      }
    }
    return DEFAULT_SAMPLE_RESUME;
  });

  const [template, setTemplate] = useState<TemplateId>("executive");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [activeSection, setActiveSection] = useState<string>("contact");
  const [isExporting, setIsExporting] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  const handleUpdate = (updater: (prev: ResumeData) => ResumeData) => {
    setResume((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("ufk_cv_data", JSON.stringify(next));
        setSavedBadge(true);
        setTimeout(() => setSavedBadge(false), 2000);
      } catch {
        // quota exceeded or private mode
      }
      return next;
    });
  };

  const loadSample = () => {
    handleUpdate(() => DEFAULT_SAMPLE_RESUME);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to reset and clear all CV fields?")) {
      handleUpdate(() => EMPTY_RESUME);
    }
  };

  // Add items
  const addExperience = () => {
    handleUpdate((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}`,
          role: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const addEducation = () => {
    handleUpdate((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          degree: "",
          school: "",
          location: "",
          graduationYear: "",
          honors: "",
        },
      ],
    }));
  };

  const removeEducation = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const addProject = () => {
    handleUpdate((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          title: "",
          techStack: "",
          link: "",
          description: "",
        },
      ],
    }));
  };

  const removeProject = (id: string) => {
    handleUpdate((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  // High-Resolution Vector PDF Generation via pdf-lib
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
      const { width, height } = page.getSize();

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const margin = 45;
      let y = height - margin;

      // Color scheme based on template
      const primaryColor =
        template === "executive"
          ? rgb(0.08, 0.16, 0.35) // Deep Navy
          : template === "tech"
          ? rgb(0.12, 0.12, 0.14) // Dark Slate
          : rgb(0.05, 0.45, 0.4); // Emerald Slate

      const textColor = rgb(0.15, 0.17, 0.2);
      const mutedColor = rgb(0.45, 0.48, 0.52);

      const checkPageBreak = (neededHeight: number) => {
        if (y - neededHeight < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
      };

      // Header: Name & Title
      page.drawText(resume.fullName || "Your Full Name", {
        x: margin,
        y: y - 18,
        size: 20,
        font: fontBold,
        color: primaryColor,
      });
      y -= 26;

      if (resume.jobTitle) {
        page.drawText(resume.jobTitle, {
          x: margin,
          y: y - 10,
          size: 11,
          font: fontBold,
          color: mutedColor,
        });
        y -= 18;
      }

      // Contact info bar
      const contactParts = [
        resume.email,
        resume.phone,
        resume.location,
        resume.website,
        resume.linkedin,
      ].filter(Boolean);

      if (contactParts.length > 0) {
        const contactLine = contactParts.join("   •   ");
        page.drawText(contactLine, {
          x: margin,
          y: y - 8,
          size: 8.5,
          font: fontRegular,
          color: mutedColor,
        });
        y -= 18;
      }

      // Header dividing rule
      page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: primaryColor,
      });
      y -= 16;

      // Helper for Section Titles
      const drawSectionHeader = (title: string) => {
        checkPageBreak(30);
        page.drawText(title.toUpperCase(), {
          x: margin,
          y: y - 8,
          size: 10,
          font: fontBold,
          color: primaryColor,
        });
        y -= 12;
        page.drawLine({
          start: { x: margin, y: y },
          end: { x: width - margin, y: y },
          thickness: 0.5,
          color: rgb(0.85, 0.87, 0.9),
        });
        y -= 12;
      };

      // Helper for word wrapping text
      const drawWrappedText = (
        text: string,
        fontSize: number,
        font: typeof fontRegular,
        color = textColor,
        indent = 0,
        lineSpacing = 13
      ) => {
        const maxWidth = width - margin * 2 - indent;
        const words = text.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > maxWidth && currentLine) {
            checkPageBreak(lineSpacing);
            page.drawText(currentLine, {
              x: margin + indent,
              y: y - fontSize,
              size: fontSize,
              font,
              color,
            });
            y -= lineSpacing;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          checkPageBreak(lineSpacing);
          page.drawText(currentLine, {
            x: margin + indent,
            y: y - fontSize,
            size: fontSize,
            font,
            color,
          });
          y -= lineSpacing;
        }
      };

      // Summary Section
      if (resume.summary) {
        drawSectionHeader("Professional Summary");
        drawWrappedText(resume.summary, 9, fontRegular, textColor, 0, 13);
        y -= 8;
      }

      // Skills Section
      if (resume.skills) {
        drawSectionHeader("Core Competencies & Technical Skills");
        drawWrappedText(resume.skills, 8.5, fontRegular, textColor, 0, 12);
        y -= 8;
      }

      // Experience Section
      if (resume.experiences.length > 0) {
        drawSectionHeader("Work Experience");
        for (const exp of resume.experiences) {
          checkPageBreak(35);
          // Role & Company
          page.drawText(exp.role || "Role Title", {
            x: margin,
            y: y - 9,
            size: 10,
            font: fontBold,
            color: textColor,
          });

          const dateStr = `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`;
          const dateWidth = fontBold.widthOfTextAtSize(dateStr, 8.5);
          page.drawText(dateStr, {
            x: width - margin - dateWidth,
            y: y - 9,
            size: 8.5,
            font: fontBold,
            color: primaryColor,
          });
          y -= 14;

          // Company & Location
          const compLoc = [exp.company, exp.location].filter(Boolean).join("  •  ");
          if (compLoc) {
            page.drawText(compLoc, {
              x: margin,
              y: y - 8,
              size: 8.5,
              font: fontOblique,
              color: mutedColor,
            });
            y -= 12;
          }

          // Bullet points
          if (exp.description) {
            const lines = exp.description.split("\n").filter(Boolean);
            for (const line of lines) {
              const cleaned = line.replace(/^[•\-\*]\s*/, "");
              checkPageBreak(14);
              page.drawText("•", {
                x: margin + 4,
                y: y - 8,
                size: 8.5,
                font: fontBold,
                color: primaryColor,
              });
              drawWrappedText(cleaned, 8.5, fontRegular, textColor, 14, 12);
            }
          }
          y -= 8;
        }
      }

      // Education Section
      if (resume.education.length > 0) {
        drawSectionHeader("Education");
        for (const edu of resume.education) {
          checkPageBreak(25);
          page.drawText(edu.degree || "Degree", {
            x: margin,
            y: y - 9,
            size: 9.5,
            font: fontBold,
            color: textColor,
          });

          if (edu.graduationYear) {
            const yearWidth = fontRegular.widthOfTextAtSize(edu.graduationYear, 8.5);
            page.drawText(edu.graduationYear, {
              x: width - margin - yearWidth,
              y: y - 9,
              size: 8.5,
              font: fontRegular,
              color: mutedColor,
            });
          }
          y -= 13;

          const schoolStr = [edu.school, edu.location].filter(Boolean).join("  •  ");
          if (schoolStr) {
            page.drawText(schoolStr, {
              x: margin,
              y: y - 8,
              size: 8.5,
              font: fontRegular,
              color: mutedColor,
            });
            y -= 11;
          }

          if (edu.honors) {
            page.drawText(`Honors: ${edu.honors}`, {
              x: margin,
              y: y - 8,
              size: 8,
              font: fontOblique,
              color: primaryColor,
            });
            y -= 11;
          }
          y -= 6;
        }
      }

      // Projects Section
      if (resume.projects.length > 0) {
        drawSectionHeader("Key Projects");
        for (const proj of resume.projects) {
          checkPageBreak(25);
          page.drawText(proj.title || "Project Title", {
            x: margin,
            y: y - 9,
            size: 9.5,
            font: fontBold,
            color: textColor,
          });

          if (proj.link) {
            const linkWidth = fontRegular.widthOfTextAtSize(proj.link, 8);
            page.drawText(proj.link, {
              x: width - margin - linkWidth,
              y: y - 9,
              size: 8,
              font: fontRegular,
              color: primaryColor,
            });
          }
          y -= 13;

          if (proj.techStack) {
            page.drawText(`Technologies: ${proj.techStack}`, {
              x: margin,
              y: y - 8,
              size: 8,
              font: fontBold,
              color: mutedColor,
            });
            y -= 11;
          }

          if (proj.description) {
            drawWrappedText(proj.description, 8.5, fontRegular, textColor, 0, 12);
          }
          y -= 6;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (resume.fullName || "Resume").replace(/\s+/g, "_");
      a.download = `${cleanName}_CV.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      trackToolAction("cv-builder", "download_resume_pdf");
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF. Please try browser print instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    trackToolAction("cv-builder", "print_resume");
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/#category-${category?.slug || ""}`}
            className="hover:text-blue-600 transition-colors"
          >
            {category?.name || "Career"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Header Bar */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-700 to-cyan-600 text-white shadow-md shadow-emerald-600/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  ATS-Optimized Builder
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  100% Free & Private
                </span>
                {savedBadge && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 animate-in fade-in">
                    Auto-Saved
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {tool.name}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                Build high-impact, professional resumes with live formatting, modern ATS templates, and instant vector PDF export.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Load Sample</span>
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Compiling PDF..." : "Export Vector PDF"}</span>
            </button>
          </div>
        </div>

        {/* View Toggle on Mobile/Tablet */}
        <div className="flex md:hidden items-center rounded-xl bg-slate-200 p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "edit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Edit Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Live Preview
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200/80 p-3.5 px-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Layout className="h-4 w-4 text-blue-600" />
            <span>Select Style Template:</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "executive", name: "Modern Executive" },
              { id: "tech", name: "Tech Minimalist" },
              { id: "clean", name: "Creative Emerald" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id as TemplateId)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border ${
                  template === t.id
                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Work Area: 2-Column Split Screen on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* LEFT: Accordion Editor Form (7 Cols) */}
          <div
            className={`lg:col-span-6 space-y-4 ${
              activeTab === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {/* 1. Contact & Personal Info */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "contact" ? "" : "contact")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Personal & Contact Info</span>
                </div>
                {activeSection === "contact" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "contact" && (
                <div className="p-5 pt-2 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={resume.fullName}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="e.g., Alexander Wright"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={resume.jobTitle}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, jobTitle: e.target.value }))
                        }
                        placeholder="e.g., Senior Systems Engineer"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={resume.email}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="alexander@domain.com"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={resume.phone}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={resume.location}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="City, State"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Portfolio / Website
                      </label>
                      <input
                        type="text"
                        value={resume.website}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, website: e.target.value }))
                        }
                        placeholder="website.com"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        value={resume.linkedin}
                        onChange={(e) =>
                          handleUpdate((prev) => ({ ...prev, linkedin: e.target.value }))
                        }
                        placeholder="linkedin.com/in/..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Professional Summary */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "summary" ? "" : "summary")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Professional Summary</span>
                </div>
                {activeSection === "summary" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "summary" && (
                <div className="p-5 pt-2 border-t border-slate-100">
                  <textarea
                    rows={4}
                    value={resume.summary}
                    onChange={(e) =>
                      handleUpdate((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    placeholder="Brief 3-4 sentence pitch describing your career strengths, key domain expertise, and high-impact accomplishments..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 3. Skills */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "skills" ? "" : "skills")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Skills & Technologies</span>
                </div>
                {activeSection === "skills" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "skills" && (
                <div className="p-5 pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Comma-separated skills
                  </label>
                  <textarea
                    rows={3}
                    value={resume.skills}
                    onChange={(e) =>
                      handleUpdate((prev) => ({ ...prev, skills: e.target.value }))
                    }
                    placeholder="e.g., C++, Python, Linux, Radar Telemetry, System Architecture, Docker, Git"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. Work Experience */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "experience" ? "" : "experience")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    Work Experience ({resume.experiences.length})
                  </span>
                </div>
                {activeSection === "experience" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "experience" && (
                <div className="p-5 pt-2 border-t border-slate-100 space-y-5">
                  {resume.experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Role #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, role: val } : item
                              ),
                            }));
                          }}
                          placeholder="Job Title / Role"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, company: val } : item
                              ),
                            }));
                          }}
                          placeholder="Company Name"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, startDate: val } : item
                              ),
                            }));
                          }}
                          placeholder="Start Date"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={exp.current ? "Present" : exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, endDate: val } : item
                              ),
                            }));
                          }}
                          placeholder="End Date"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900 disabled:opacity-50"
                        />
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, location: val } : item
                              ),
                            }));
                          }}
                          placeholder="City, State"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`curr-${exp.id}`}
                          checked={exp.current}
                          onChange={(e) => {
                            const val = e.target.checked;
                            handleUpdate((prev) => ({
                              ...prev,
                              experiences: prev.experiences.map((item) =>
                                item.id === exp.id ? { ...item, current: val } : item
                              ),
                            }));
                          }}
                          className="h-3.5 w-3.5 rounded text-blue-600"
                        />
                        <label
                          htmlFor={`curr-${exp.id}`}
                          className="text-[11px] text-slate-600 cursor-pointer"
                        >
                          I currently work here
                        </label>
                      </div>

                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate((prev) => ({
                            ...prev,
                            experiences: prev.experiences.map((item) =>
                              item.id === exp.id ? { ...item, description: val } : item
                            ),
                          }));
                        }}
                        placeholder="Bullet points / achievements (one per line)..."
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900 leading-relaxed"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExperience}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Another Experience</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Education */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "education" ? "" : "education")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Education ({resume.education.length})</span>
                </div>
                {activeSection === "education" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "education" && (
                <div className="p-5 pt-2 border-t border-slate-100 space-y-4">
                  {resume.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Education #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEducation(edu.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, degree: val } : item
                              ),
                            }));
                          }}
                          placeholder="Degree / Certificate"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, school: val } : item
                              ),
                            }));
                          }}
                          placeholder="Institution / University"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.graduationYear}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, graduationYear: val } : item
                              ),
                            }));
                          }}
                          placeholder="Graduation Year (e.g., 2018)"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={edu.honors}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, honors: val } : item
                              ),
                            }));
                          }}
                          placeholder="Honors / Highlights (Optional)"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEducation}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Key Projects */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setActiveSection(activeSection === "projects" ? "" : "projects")
                }
                className="w-full flex items-center justify-between p-4 px-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderGit2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Key Projects ({resume.projects.length})</span>
                </div>
                {activeSection === "projects" ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeSection === "projects" && (
                <div className="p-5 pt-2 border-t border-slate-100 space-y-4">
                  {resume.projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Project #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProject(proj.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          placeholder="Project Name"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdate((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, link: val } : item
                              ),
                            }));
                          }}
                          placeholder="Link / URL (github.com/...)"
                          className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <input
                        type="text"
                        value={proj.techStack}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id ? { ...item, techStack: val } : item
                            ),
                          }));
                        }}
                        placeholder="Technologies (e.g., Rust, WebSockets, Python)"
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900"
                      />

                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id ? { ...item, description: val } : item
                            ),
                          }));
                        }}
                        placeholder="Brief project overview & results..."
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-900 leading-relaxed"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addProject}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Visual Resume Preview (5-6 Cols) */}
          <div
            className={`lg:col-span-6 sticky top-24 ${
              activeTab === "edit" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-200/50 p-2 sm:p-4 shadow-inner">
              <div
                ref={previewRef}
                id="resume-print-area"
                className={`bg-white shadow-xl rounded-xl p-8 sm:p-10 font-sans min-h-[700px] border border-slate-100 ${
                  template === "executive"
                    ? "border-t-8 border-t-blue-900"
                    : template === "clean"
                    ? "border-t-8 border-t-emerald-700"
                    : "border-t-8 border-t-slate-900"
                }`}
              >
                {/* Header */}
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <h2
                    className={`text-2xl font-black tracking-tight ${
                      template === "executive"
                        ? "text-blue-950"
                        : template === "clean"
                        ? "text-emerald-950"
                        : "text-slate-900"
                    }`}
                  >
                    {resume.fullName || "Your Full Name"}
                  </h2>
                  <div className="text-sm font-bold text-slate-500 mt-0.5">
                    {resume.jobTitle || "Your Professional Title"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                    {[
                      resume.email,
                      resume.phone,
                      resume.location,
                      resume.website,
                      resume.linkedin,
                    ]
                      .filter(Boolean)
                      .map((val, idx) => (
                        <span key={idx} className="flex items-center gap-2">
                          {idx > 0 && <span>•</span>}
                          <span>{val}</span>
                        </span>
                      ))}
                  </div>
                </div>

                {/* Summary */}
                {resume.summary && (
                  <div className="mb-4">
                    <h4
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                        template === "executive"
                          ? "text-blue-900"
                          : template === "clean"
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {resume.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {resume.skills && (
                  <div className="mb-4">
                    <h4
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${
                        template === "executive"
                          ? "text-blue-900"
                          : template === "clean"
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      Technical Skills & Competencies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skills.split(",").map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {resume.experiences.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <h4
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1 ${
                        template === "executive"
                          ? "text-blue-900"
                          : template === "clean"
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      Work Experience
                    </h4>
                    {resume.experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            {exp.role || "Role"}
                          </span>
                          <span className="font-semibold text-blue-700 text-[11px]">
                            {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {[exp.company, exp.location].filter(Boolean).join(" • ")}
                        </div>
                        {exp.description && (
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 leading-relaxed">
                            {exp.description.split("\n").filter(Boolean).map((bullet, bidx) => (
                              <li key={bidx}>{bullet.replace(/^[•\-\*]\s*/, "")}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {resume.education.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1 ${
                        template === "executive"
                          ? "text-blue-900"
                          : template === "clean"
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      Education
                    </h4>
                    {resume.education.map((edu) => (
                      <div key={edu.id} className="text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{edu.degree}</span>
                          <span className="text-slate-500 text-[11px] font-normal">
                            {edu.graduationYear}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {[edu.school, edu.location].filter(Boolean).join(" • ")}
                        </div>
                        {edu.honors && (
                          <div className="text-[11px] italic text-blue-700">
                            Honors: {edu.honors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {resume.projects.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4
                      className={`text-[11px] font-extrabold uppercase tracking-wider mb-1 ${
                        template === "executive"
                          ? "text-blue-900"
                          : template === "clean"
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      Key Projects
                    </h4>
                    {resume.projects.map((proj) => (
                      <div key={proj.id} className="text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{proj.title}</span>
                          <span className="text-blue-600 text-[11px] font-normal">
                            {proj.link}
                          </span>
                        </div>
                        {proj.techStack && (
                          <div className="text-[11px] font-medium text-slate-500">
                            {proj.techStack}
                          </div>
                        )}
                        {proj.description && (
                          <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Build Your CV in 3 Steps
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tool.howToSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm relative overflow-hidden"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm mb-4">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-14 rounded-3xl bg-white p-8 sm:p-10 border border-slate-200/80 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Key Features of {tool.name}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tool.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        {tool.faqs.length > 0 && (
          <div className="mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Notice Banner */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Shield className="h-8 w-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">100% Private In-Browser Storage</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Your career history, contact details, and resume files never leave your computer. Auto-saved locally in your browser.
              </p>
            </div>
          </div>
          <Link
            href="/privacy"
            className="shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Read Privacy Guarantee →
          </Link>
        </div>
      </div>
    </div>
  );
}
