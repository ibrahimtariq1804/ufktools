export interface ToolItem {
  id: string;
  slug: string;
  name: string;
  category: "cv-career" | "pdf-tools" | "converters" | "image-tools" | "picture-of-day";
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  popular?: boolean;
  processingMode: "client" | "server" | "hybrid";
  badge?: string;
  acceptedFormats: string[];
  maxFileSizeMB: number;
  features: string[];
  howToSteps: { step: number; title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

export interface ToolCategory {
  id: "cv-career" | "pdf-tools" | "converters" | "image-tools" | "picture-of-day";
  name: string;
  slug: string;
  description: string;
  iconName: string;
  badgeColor: string;
  gradient: string;
}

export const CATEGORIES: ToolCategory[] = [
  {
    id: "cv-career",
    name: "CV & Career",
    slug: "cv-career",
    description: "Build ATS-friendly modern resumes and CVs with instant PDF export.",
    iconName: "FileSpreadsheet",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    id: "pdf-tools",
    name: "PDF Tools",
    slug: "pdf-tools",
    description: "Merge, compress, convert, split, edit, sign, and OCR your PDF files securely.",
    iconName: "FileText",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    id: "converters",
    name: "Converters & Calculators",
    slug: "converters",
    description: "Live real-time currency exchange rates and high-precision unit converters.",
    iconName: "Calculator",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    id: "image-tools",
    name: "Image & File Tools",
    slug: "image-tools",
    description: "Transform images to PDF, extract high-res pages, and convert niche document formats.",
    iconName: "Image",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "picture-of-day",
    name: "Picture / Fact of the Day",
    slug: "picture-of-day",
    description: "Daily curated defense technology, aerospace engineering, naval systems, and geopolitical insights presented by the UFK Channel.",
    iconName: "Sparkles",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    gradient: "from-rose-500 to-red-600",
  },
];

export const TOOLS: ToolItem[] = [
  // CATEGORY 1: CV & CAREER
  {
    id: "cv-builder",
    slug: "cv-builder",
    name: "Make Your CV / Resume",
    category: "cv-career",
    shortDescription: "Create a standout, job-winning CV or resume with customizable modern templates.",
    fullDescription: "Design professional, ATS-compliant resumes with our interactive live builder. Choose between executive, modern, and minimal templates, customize sections effortlessly, and download a crisp vector PDF instantly without creating an account.",
    iconName: "Briefcase",
    popular: true,
    processingMode: "client",
    badge: "Interactive Builder",
    acceptedFormats: [".json"],
    maxFileSizeMB: 5,
    features: [
      "Multiple professionally styled templates",
      "Live interactive preview as you type",
      "Auto-save drafts locally in your browser",
      "Download high-resolution print-ready PDF",
      "100% free with no watermark or registration",
    ],
    howToSteps: [
      { step: 1, title: "Choose a Template", description: "Select from modern, executive, or clean minimalist resume designs." },
      { step: 2, title: "Fill in Details", description: "Enter your contact info, experience, education, skills, and accomplishments." },
      { step: 3, title: "Live Preview & Export", description: "Review your live document in real-time and export directly to clean PDF." },
    ],
    faqs: [
      { question: "Is my personal data saved on your servers?", answer: "No. Your resume data is saved only in your browser's local storage and never transmitted to our servers." },
      { question: "Are the generated resumes ATS-friendly?", answer: "Yes! All templates use clean semantic hierarchy and standard fonts readable by Applicant Tracking Systems." },
    ],
  },

  // CATEGORY 2: PDF TOOLS
  {
    id: "pdf-to-word",
    slug: "pdf-to-word",
    name: "PDF to Word",
    category: "pdf-tools",
    shortDescription: "Convert PDF documents into editable Microsoft Word (.docx) files.",
    fullDescription: "Transform read-only PDF documents into fully editable Microsoft Word DOCX files. Preserves paragraphs, tables, images, and text layouts with exceptional fidelity.",
    iconName: "FileType",
    popular: true,
    processingMode: "server",
    badge: "High Accuracy",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 25,
    features: [
      "Accurate table and text structure reconstruction",
      "Outputs standard Microsoft Word (.docx) format",
      "Retains embedded images and formatting",
      "Immediate automated file cleanup after download",
    ],
    howToSteps: [
      { step: 1, title: "Select PDF File", description: "Drag and drop or browse your PDF file from your device." },
      { step: 2, title: "Automatic Processing", description: "Our engine analyzes text streams, tables, and document hierarchies." },
      { step: 3, title: "Download DOCX", description: "Save your editable Word document immediately." },
    ],
    faqs: [
      { question: "Can I convert scanned PDFs into Word?", answer: "For scanned documents that are pure images, run them through our OCR PDF tool first to ensure text can be extracted." },
      { question: "How long are my files kept?", answer: "Files are processed in an isolated sandbox and permanently purged immediately after download." },
    ],
  },
  {
    id: "compress-pdf",
    slug: "compress-pdf",
    name: "Compress PDF",
    category: "pdf-tools",
    shortDescription: "Reduce PDF file size significantly while retaining maximum visual quality.",
    fullDescription: "Optimize and shrink large PDF documents for quick email attachments or web publishing. Choose between Recommended, Extreme, or Light compression profiles.",
    iconName: "Minimize2",
    popular: true,
    processingMode: "server",
    badge: "Popular",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    features: [
      "Selectable compression levels (Recommended, Extreme, Light)",
      "Optimizes both embedded images and internal stream fonts",
      "Shows exact file size savings percentage",
      "Completely free with no file count limits",
    ],
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop your large PDF file into the dropzone." },
      { step: 2, title: "Select Compression Level", description: "Choose the balance between size reduction and visual resolution." },
      { step: 3, title: "Download Smaller PDF", description: "Get your optimized PDF ready for email sharing." },
    ],
    faqs: [
      { question: "Will compression ruin my document quality?", answer: "Recommended compression retains crisp text and sharp imagery while reducing file size by up to 70%." },
    ],
  },
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    name: "Merge PDF",
    category: "pdf-tools",
    shortDescription: "Combine multiple PDF files into a single organized document in seconds.",
    fullDescription: "Effortlessly merge multiple PDF documents into one cohesive file. Drag and drop to reorder files before merging. 100% processed client-side in your browser for instant speed and complete privacy.",
    iconName: "Layers",
    popular: true,
    processingMode: "client",
    badge: "Ultra Fast",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    features: [
      "Drag-and-drop to reorder files intuitively",
      "100% in-browser processing via WebAssembly",
      "Zero upload wait times and zero server storage",
      "Combines unlimited pages and documents",
    ],
    howToSteps: [
      { step: 1, title: "Select Files", description: "Choose two or more PDF files from your computer or phone." },
      { step: 2, title: "Order Documents", description: "Drag and drop the file cards into your desired sequence." },
      { step: 3, title: "Merge & Save", description: "Click Merge to instantly download the combined PDF." },
    ],
    faqs: [
      { question: "Do my files get uploaded to a server?", answer: "No! Merge PDF runs entirely in your local browser using client-side JavaScript. Your files never leave your computer." },
    ],
  },
  {
    id: "word-to-pdf",
    slug: "word-to-pdf",
    name: "Word to PDF",
    category: "pdf-tools",
    shortDescription: "Convert Microsoft Word (.docx, .doc) files into print-ready PDF format.",
    fullDescription: "Turn Microsoft Word documents into universal, unalterable PDF files. Ensures identical typography, margins, tables, and pagination across every computer and mobile device.",
    iconName: "FileCheck",
    popular: false,
    processingMode: "server",
    badge: "Precise",
    acceptedFormats: [".docx", ".doc"],
    maxFileSizeMB: 25,
    features: [
      "Supports modern DOCX and legacy DOC files",
      "Perfect font embedding and margin retention",
      "Ensures documents look identical on every screen",
      "Fast conversion with zero watermarks",
    ],
    howToSteps: [
      { step: 1, title: "Upload Word Document", description: "Select the .doc or .docx file you want to convert." },
      { step: 2, title: "Generate PDF", description: "Our engine renders the document faithfully." },
      { step: 3, title: "Download PDF", description: "Receive your clean, formatted PDF file." },
    ],
    faqs: [
      { question: "Will my custom fonts be preserved?", answer: "Yes, standard document fonts and layout structures are rendered with high fidelity." },
    ],
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    name: "Split PDF",
    category: "pdf-tools",
    shortDescription: "Extract specific pages or split a PDF into separate individual documents.",
    fullDescription: "Separate one or multiple pages from your PDF file. Specify page ranges (e.g. 1-5, 8, 11-14) or extract every single page as a standalone PDF. Runs 100% in your browser.",
    iconName: "Scissors",
    popular: false,
    processingMode: "client",
    badge: "Client-Side",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 100,
    features: [
      "Custom page range extraction (e.g., 1-3, 5, 8-10)",
      "Extract each page as an individual file",
      "Instant client-side extraction with zero upload wait",
      "Download extracted files individually or as a ZIP archive",
    ],
    howToSteps: [
      { step: 1, title: "Upload Document", description: "Select the PDF file you wish to split." },
      { step: 2, title: "Specify Pages", description: "Enter the page numbers or ranges you want to extract." },
      { step: 3, title: "Download Result", description: "Save your separated PDF pages instantly." },
    ],
    faqs: [
      { question: "Is there a limit on how many pages I can split?", answer: "Because this runs in your browser, you can split PDFs of virtually any page count without server throttling." },
    ],
  },
  {
    id: "edit-pdf",
    slug: "edit-pdf",
    name: "Edit PDF",
    category: "pdf-tools",
    shortDescription: "Add custom text, annotations, shapes, stamps, and highlights to your PDF.",
    fullDescription: "An intuitive web-based PDF editor. Overlay text boxes, highlight key paragraphs, draw freehand annotations, insert shapes, and stamp approvals directly onto any PDF page.",
    iconName: "PenTool",
    popular: false,
    processingMode: "client",
    badge: "Annotate & Mark",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    features: [
      "Add custom text overlays with font size and color controls",
      "Freehand highlighter and drawing tools",
      "Insert shapes, checkmarks, and approval stamps",
      "Privacy-first editing directly in your web browser",
    ],
    howToSteps: [
      { step: 1, title: "Open PDF", description: "Load the PDF you want to annotate or mark up." },
      { step: 2, title: "Add Annotations", description: "Use the toolbar to place text, highlights, shapes, or stamps." },
      { step: 3, title: "Save & Download", description: "Export the modified PDF with all annotations permanently baked in." },
    ],
    faqs: [
      { question: "Can I edit the original text in the PDF?", answer: "This tool allows adding text overlays, annotations, stamps, and shapes. To modify underlying existing text, use our PDF to Word converter." },
    ],
  },
  {
    id: "fill-and-sign-pdf",
    slug: "fill-and-sign-pdf",
    name: "Fill & Sign PDF",
    category: "pdf-tools",
    shortDescription: "Complete PDF forms and draw or upload your digital signature securely.",
    fullDescription: "Fill out interactive PDF forms and place legal signatures onto contracts, leases, and agreements. Draw your signature with your mouse or touchscreen, type a styled signature, or upload a signature image.",
    iconName: "FileSignature",
    popular: false,
    processingMode: "client",
    badge: "Sign Instantly",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    features: [
      "Detects and populates interactive AcroForm fields",
      "Touch-friendly signature drawing pad",
      "Type to sign with elegant cursive typography",
      "Flatten form fields and signatures into an unalterable PDF",
    ],
    howToSteps: [
      { step: 1, title: "Upload Agreement", description: "Select your PDF contract or form." },
      { step: 2, title: "Fill & Sign", description: "Complete text inputs and place your custom signature." },
      { step: 3, title: "Export Signed Document", description: "Download the completed, signed document." },
    ],
    faqs: [
      { question: "Is my signature stored on your server?", answer: "Never. Your signature is drawn on an in-browser HTML5 canvas and embedded directly into the PDF on your computer." },
    ],
  },
  {
    id: "unlock-protect-pdf",
    slug: "unlock-protect-pdf",
    name: "Unlock / Protect PDF",
    category: "pdf-tools",
    shortDescription: "Encrypt your PDF with strong passwords or remove owner restrictions.",
    fullDescription: "Safeguard sensitive financial, legal, or personal documents with military-grade AES-128/256 bit encryption, or unlock password-restricted PDFs when you have permission.",
    iconName: "Lock",
    popular: false,
    processingMode: "hybrid",
    badge: "Security",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    features: [
      "Industry-standard AES encryption with custom user passwords",
      "Remove owner printing, copying, and modification restrictions",
      "High speed client-side protection",
      "Ensures maximum privacy for sensitive documents",
    ],
    howToSteps: [
      { step: 1, title: "Choose Action", description: "Select whether you want to Protect (add password) or Unlock (remove password)." },
      { step: 2, title: "Set/Enter Password", description: "Provide the secret password for encryption or decryption." },
      { step: 3, title: "Download", description: "Save your newly secured or unlocked PDF." },
    ],
    faqs: [
      { question: "Can you crack an unknown user password?", answer: "No, AES encryption is mathematically secure. You must know the password to decrypt a password-locked PDF." },
    ],
  },
  {
    id: "ocr-pdf",
    slug: "ocr-pdf",
    name: "OCR PDF — Make Scans Searchable",
    category: "pdf-tools",
    shortDescription: "Convert scanned paper documents and photo PDFs into searchable, selectable text.",
    fullDescription: "Leverage advanced optical character recognition (OCR) to turn non-selectable image scans into fully searchable PDFs. Allows copying text and searching keywords with Ctrl+F.",
    iconName: "ScanText",
    popular: false,
    processingMode: "server",
    badge: "OCR Engine",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 20,
    features: [
      "High-accuracy optical character recognition powered by Tesseract",
      "Creates searchable sandwich PDFs with selectable text layers",
      "Preserves original scan visuals while adding text indexing",
      "Supports English and major Latin alphabets",
    ],
    howToSteps: [
      { step: 1, title: "Upload Scanned PDF", description: "Select the scan or photo document." },
      { step: 2, title: "Run OCR Recognition", description: "Our server analyzes letter shapes and generates text layers." },
      { step: 3, title: "Download Searchable PDF", description: "Open the PDF and search or copy text freely." },
    ],
    faqs: [
      { question: "Why is OCR limited to 10 pages per upload?", answer: "To ensure fair usage on our free service and keep the website fast for everyone, jobs are capped at 10 pages per batch." },
    ],
  },
  {
    id: "rotate-reorder-delete-pdf",
    slug: "rotate-reorder-delete-pdf",
    name: "Rotate, Reorder & Delete PDF Pages",
    category: "pdf-tools",
    shortDescription: "Visually organize your PDF pages with drag-and-drop reordering and rotation.",
    fullDescription: "View visual thumbnails of every page in your document. Rotate upside-down scans by 90° or 180°, drag pages to fix their sequence, and trash unwanted pages before saving.",
    iconName: "RefreshCw",
    popular: false,
    processingMode: "client",
    badge: "Visual Organizer",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 75,
    features: [
      "Visual grid showing every page preview thumbnail",
      "Rotate individual pages or entire documents",
      "Drag-and-drop page sorting",
      "One-click page deletion",
    ],
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop your PDF file to generate live page thumbnails." },
      { step: 2, title: "Organize", description: "Rotate, drag to reorder, or delete unnecessary pages." },
      { step: 3, title: "Save PDF", description: "Click Apply to export your cleaned, correctly oriented PDF." },
    ],
    faqs: [
      { question: "Is this done on my device?", answer: "Yes, thumbnails and page modifications are rendered 100% locally in your browser." },
    ],
  },
  {
    id: "chat-pdf",
    slug: "chat-pdf",
    name: "Chat with PDF / AI Summarizer",
    category: "pdf-tools",
    shortDescription: "Summarize long documents and extract key answers with intelligent NLP.",
    fullDescription: "Instantly digest lengthy PDF research papers, manuals, reports, and contracts. Get concise bulleted executive summaries and search for key facts quickly without reading hundreds of pages.",
    iconName: "Bot",
    popular: false,
    processingMode: "hybrid",
    badge: "Smart Summarizer",
    acceptedFormats: [".pdf", ".txt"],
    maxFileSizeMB: 20,
    features: [
      "Instant extractive text summarization",
      "Keyword extraction and key takeaways",
      "Works 100% free with zero token limits",
      "Optional BYOK (Bring Your Own Key) for deep conversational Q&A",
    ],
    howToSteps: [
      { step: 1, title: "Select Document", description: "Upload the PDF or text file you want to analyze." },
      { step: 2, title: "Generate Summary", description: "Our NLP engine extracts core themes and crucial sentences." },
      { step: 3, title: "Ask Questions", description: "Review findings or search specific sections effortlessly." },
    ],
    faqs: [
      { question: "Is there a subscription fee for this AI tool?", answer: "No! Basic summarization and extraction are 100% free and run locally without commercial AI subscriptions." },
    ],
  },
  {
    id: "pdf-to-excel",
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    category: "pdf-tools",
    shortDescription: "Extract tables from PDF files into editable Excel spreadsheets (.xlsx).",
    fullDescription: "Extract financial tables, invoices, statements, and tabular data from PDF files directly into structured Microsoft Excel spreadsheets with separate columns and rows.",
    iconName: "FileSpreadsheet",
    popular: false,
    processingMode: "server",
    badge: "Data Extraction",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 25,
    features: [
      "Accurate table boundary detection",
      "Outputs native Microsoft Excel (.xlsx) files",
      "Separates multi-page tables into organized sheets",
      "Safe and automated ephemeral document handling",
    ],
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop the PDF containing tables and data." },
      { step: 2, title: "Extract Tables", description: "Our algorithm locates grid lines and cell data." },
      { step: 3, title: "Download Excel", description: "Open your formatted spreadsheet in Excel or Google Sheets." },
    ],
    faqs: [
      { question: "Does this work on scans without visible grid lines?", answer: "It works best on digital PDFs. For scanned receipts or non-bordered tables, OCR helps achieve the cleanest extraction." },
    ],
  },
  {
    id: "powerpoint-to-pdf",
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF / PDF to PowerPoint",
    category: "pdf-tools",
    shortDescription: "Convert presentations (.pptx) to PDF or convert PDF pages into slides.",
    fullDescription: "Effortlessly convert Microsoft PowerPoint slide decks (.pptx, .ppt) into universal PDF files, or transform PDF document pages into presentation slide decks ready for presentation.",
    iconName: "Presentation",
    popular: false,
    processingMode: "server",
    badge: "Two-Way Convert",
    acceptedFormats: [".pptx", ".ppt", ".pdf"],
    maxFileSizeMB: 35,
    features: [
      "Convert PPTX presentations into crisp PDF slide decks",
      "Turn PDF pages into PowerPoint presentation slides",
      "Preserves presentation layout, aspect ratio, and typography",
      "Free with no account required",
    ],
    howToSteps: [
      { step: 1, title: "Upload Presentation or PDF", description: "Select your PPTX file or PDF document." },
      { step: 2, title: "Choose Conversion Direction", description: "Select PPT to PDF or PDF to PPT." },
      { step: 3, title: "Download File", description: "Get your converted presentation ready to present." },
    ],
    faqs: [
      { question: "Will slide animations be included in the PDF?", answer: "PDF is a static document format, so animations will be frozen in their final visible layout." },
    ],
  },

  // CATEGORY 3: CONVERTERS & CALCULATORS
  {
    id: "currency-converter",
    slug: "currency-converter",
    name: "Currency Converter",
    category: "converters",
    shortDescription: "Calculate live foreign exchange rates across 150+ world currencies.",
    fullDescription: "Quickly convert between world currencies with continuously updated foreign exchange rates. Includes currency swap, searchable currency selectors, and historical indicators.",
    iconName: "Coins",
    popular: true,
    processingMode: "hybrid",
    badge: "Live Rates",
    acceptedFormats: [],
    maxFileSizeMB: 0,
    features: [
      "Supports 150+ global currencies including USD, EUR, GBP, JPY, CAD, AUD, PKR, INR",
      "Server-cached rates refreshed regularly for zero-cost reliability",
      "Instant real-time currency swap button",
      "Clean, responsive calculator interface",
    ],
    howToSteps: [
      { step: 1, title: "Enter Amount", description: "Type the monetary amount you want to convert." },
      { step: 2, title: "Choose Currencies", description: "Select the source currency and target currency." },
      { step: 3, title: "Instant Result", description: "View the converted total and current exchange rate." },
    ],
    faqs: [
      { question: "How often are exchange rates updated?", answer: "Rates are refreshed automatically from central bank feeds every 12 hours." },
    ],
  },
  {
    id: "measurement-converter",
    slug: "measurement-converter",
    name: "Measurement & Volume Converter",
    category: "converters",
    shortDescription: "Convert units across length, weight, volume, temperature, area, speed, and time.",
    fullDescription: "An all-in-one universal unit converter. Easily switch between metric and imperial units across 8 measurement classes with pinpoint mathematical precision.",
    iconName: "Ruler",
    popular: false,
    processingMode: "client",
    badge: "Instant Math",
    acceptedFormats: [],
    maxFileSizeMB: 0,
    features: [
      "8 Unit Categories: Length, Weight, Temperature, Area, Volume, Speed, Time, Digital Storage",
      "Interactive instant calculation as you type",
      "Bidirectional conversion and swapping",
      "100% client-side with zero latency",
    ],
    howToSteps: [
      { step: 1, title: "Select Category", description: "Choose Length, Weight, Volume, Temperature, etc." },
      { step: 2, title: "Input Number", description: "Enter your value and choose input/output units." },
      { step: 3, title: "Copy Result", description: "Click to copy the calculated conversion." },
    ],
    faqs: [
      { question: "Does this require an internet connection?", answer: "Once the page is loaded, calculations occur entirely in your browser without any network requests." },
    ],
  },

  // CATEGORY 4: IMAGE & FILE TOOLS
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "image-tools",
    shortDescription: "Transform JPG, PNG, and WebP images into a single polished PDF document.",
    fullDescription: "Convert multiple images into a clean, standardized PDF file. Reorder photos, adjust page orientation (portrait/landscape), select page margins, and compress output directly in your browser.",
    iconName: "Images",
    popular: true,
    processingMode: "client",
    badge: "Multi-Image",
    acceptedFormats: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSizeMB: 50,
    features: [
      "Supports JPG, PNG, and WebP image formats",
      "Drag-and-drop to reorder images into page sequence",
      "Configurable margins (None, Small, Big) and page sizes (A4, Letter)",
      "Processed locally on your device for absolute privacy",
    ],
    howToSteps: [
      { step: 1, title: "Upload Images", description: "Select one or more photos from your device." },
      { step: 2, title: "Customize Layout", description: "Arrange the image sequence and set margins." },
      { step: 3, title: "Download PDF", description: "Save your freshly generated PDF document." },
    ],
    faqs: [
      { question: "Are my photos uploaded to a cloud server?", answer: "No. All image-to-PDF compilation happens locally within your web browser." },
    ],
  },
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    name: "PDF to JPG / PNG",
    category: "image-tools",
    shortDescription: "Extract PDF pages as high-resolution JPG or PNG pictures.",
    fullDescription: "Convert PDF pages into high-definition image files (JPG or PNG). Extract every page as an individual image or download all pages bundled in a convenient ZIP archive.",
    iconName: "FileImage",
    popular: false,
    processingMode: "client",
    badge: "High Resolution",
    acceptedFormats: [".pdf"],
    maxFileSizeMB: 50,
    features: [
      "High-DPI rendering for ultra-crisp text and images",
      "Choice between JPG (compact) and PNG (lossless transparency)",
      "Download individual images or all pages as a ZIP bundle",
      "100% client-side processing with zero server load",
    ],
    howToSteps: [
      { step: 1, title: "Select PDF", description: "Choose the document you want to convert into images." },
      { step: 2, title: "Select Format & Quality", description: "Choose between JPG or PNG." },
      { step: 3, title: "Download Images", description: "Save individual pages or the complete ZIP package." },
    ],
    faqs: [
      { question: "Can I extract images on mobile devices?", answer: "Yes, our client-side canvas engine works smoothly on iOS and Android mobile browsers." },
    ],
  },
  {
    id: "niche-converters",
    slug: "niche-converters",
    name: "Niche Format Converters",
    category: "image-tools",
    shortDescription: "Convert Markdown, TXT, SVG, and EPUB files into clean, readable PDFs.",
    fullDescription: "A curated suite of specialized document converters. Seamlessly convert developer-friendly Markdown (.md), plain text (.txt), vector graphics (.svg), and eBooks (.epub) into universal PDFs.",
    iconName: "Boxes",
    popular: false,
    processingMode: "client",
    badge: "Specialty Tools",
    acceptedFormats: [".md", ".txt", ".svg", ".epub", ".html"],
    maxFileSizeMB: 20,
    features: [
      "Markdown (.md) to styled PDF with syntax highlighting",
      "Plain Text (.txt) to clean formatted PDF",
      "Vector SVG to high-resolution PNG or vector PDF",
      "Fast conversion with zero software installation",
    ],
    howToSteps: [
      { step: 1, title: "Choose Format", description: "Select Markdown, Text, SVG, or EPUB." },
      { step: 2, title: "Upload File", description: "Drop your niche format document." },
      { step: 3, title: "Export to PDF", description: "Download your beautifully formatted PDF." },
    ],
    faqs: [
      { question: "Can I convert GitHub Markdown files?", answer: "Yes, GitHub-flavored Markdown including tables and code blocks is fully supported." },
    ],
  },
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(categoryId: string): ToolItem[] {
  return TOOLS.filter((tool) => tool.category === categoryId);
}

export function getPopularTools(): ToolItem[] {
  return TOOLS.filter((tool) => tool.popular);
}
