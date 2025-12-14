import React from 'react';
import { Link } from 'react-router-dom';
import { AdUnit } from '../components/AdUnit';
import { 
  Files, 
  Scissors, 
  Minimize2, 
  Image, 
  FileImage, 
  Shield, 
  RotateCw,
  FileText,
  ArrowRight,
  Presentation,
  FileSpreadsheet,
  FileType2,
  PenTool,
  Signature,
  Scan,
  Hash,
  Search,
  GitCompare,
  Crop,
  Zap,
  Lock,
  Unlock,
  Type,
  LayoutGrid,
  Sliders
} from 'lucide-react';

const ToolCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
  popular?: boolean;
}> = ({ title, description, icon, to, color, popular }) => {
  return (
    <Link 
      to={to} 
      className={`group relative bg-white p-3 md:p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full overflow-hidden ${popular ? 'border-primary-200 shadow-lg ring-1 ring-primary-100 hover:shadow-2xl hover:-translate-y-1' : 'border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}
    >
      <div className={`absolute top-0 right-0 p-20 rounded-full opacity-5 blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 ${color}`}></div>
      
      {popular && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-primary-50 text-primary-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
          <Zap className="w-3 h-3 fill-current" /> <span className="hidden md:inline">Popular</span>
        </div>
      )}

      <div className={`mb-3 md:mb-6 inline-flex p-2 md:p-4 rounded-xl transition-colors ${popular ? 'bg-primary-50 text-primary-500' : 'bg-slate-50 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-500'}`}>
        {icon}
      </div>
      
      <h3 className="text-base md:text-xl font-bold text-slate-900 mb-1 md:mb-2">{title}</h3>
      <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-3 md:mb-6 flex-grow line-clamp-2 md:line-clamp-none">{description}</p>
      
      <div className="flex items-center font-semibold text-xs md:text-sm text-primary-400 group-hover:text-primary-500 mt-auto">
        Open <span className="hidden md:inline ml-1">Tool</span> <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

export const Home: React.FC = () => {
  const allTools = [
    {
      title: "Merge PDF",
      description: "Combine multiple PDF files into one single document in seconds.",
      icon: <Files className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/merge",
      color: "bg-red-500",
      id: "merge"
    },
    {
      title: "Split PDF",
      description: "Separate one page or a whole set for easy conversion into independent PDF files.",
      icon: <Scissors className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/split",
      color: "bg-orange-500",
      id: "split"
    },
    {
      title: "Compress PDF",
      description: "Reduce file size while optimizing for maximal PDF quality.",
      icon: <Minimize2 className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/compress",
      color: "bg-green-500",
      id: "compress"
    },
    {
      title: "Image to PDF",
      description: "Convert JPG, PNG, BMP, GIF, and TIFF images to PDF.",
      icon: <Image className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/img-to-pdf",
      color: "bg-blue-400",
      id: "img-to-pdf"
    },
    {
      title: "PDF to Image",
      description: "Extract images from your PDF or save each page as a separate image.",
      icon: <FileImage className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/pdf-to-img",
      color: "bg-yellow-500",
      id: "pdf-to-img"
    },
    {
      title: "Compress Image",
      description: "Reduce image size while maintaining the best quality.",
      icon: <Minimize2 className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/compress-img",
      color: "bg-teal-400",
      id: "compress-img"
    },
    {
      title: "Advance Compress",
      description: "Compress images to a specific target size (KB) automatically.",
      icon: <Sliders className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/advance-compress-img",
      color: "bg-indigo-400",
      id: "advance-compress"
    },
    {
      title: "Unlock PDF",
      description: "Remove password security from PDF files.",
      icon: <Unlock className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/unlock",
      color: "bg-gray-500",
      id: "unlock"
    },
    {
      title: "Edit PDF",
      description: "Add text, images, shapes or freehand annotations to a PDF document.",
      icon: <PenTool className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/edit-pdf",
      color: "bg-pink-500",
      id: "edit-pdf"
    },
    {
      title: "Watermark PDF",
      description: "Stamp an image or text over your PDF in seconds.",
      icon: <Type className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/watermark",
      color: "bg-red-400",
      id: "watermark"
    },
    {
      title: "Organize PDF",
      description: "Sort pages of your PDF file however you like. Delete PDF pages.",
      icon: <LayoutGrid className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/organize-pdf",
      color: "bg-purple-600",
      id: "organize-pdf"
    },
    {
      title: "Rotate PDF",
      description: "Rotate your PDF files as you want. Rotate multiple PDF at the same time!",
      icon: <RotateCw className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/rotate",
      color: "bg-purple-500",
      id: "rotate"
    },
    {
      title: "Page Numbers",
      description: "Add page numbers into your PDFs with ease. Choose position, dimensions, typography.",
      icon: <Hash className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/page-number",
      color: "bg-teal-500",
      id: "page-number"
    },
    {
      title: "PDF to Word",
      description: "Convert your PDF to editable Word documents with incredible accuracy.",
      icon: <FileText className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/pdf-to-word",
      color: "bg-blue-600",
      id: "pdf-to-word"
    },
    {
      title: "PDF to PowerPoint",
      description: "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
      icon: <Presentation className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/pdf-to-powerpoint",
      color: "bg-orange-600",
      id: "pdf-to-ppt"
    },
    {
      title: "PDF to Excel",
      description: "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
      icon: <FileSpreadsheet className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/pdf-to-excel",
      color: "bg-green-600",
      id: "pdf-to-excel"
    },
    {
      title: "Word to PDF",
      description: "Make DOC and DOCX files easy to read by converting them to PDF.",
      icon: <FileType2 className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/word-to-pdf",
      color: "bg-blue-500",
      id: "word-to-pdf"
    },
    {
      title: "PowerPoint to PDF",
      description: "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
      icon: <Presentation className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/powerpoint-to-pdf",
      color: "bg-orange-500",
      id: "ppt-to-pdf"
    },
    {
      title: "Excel to PDF",
      description: "Make EXCEL spreadsheets easy to read by converting them to PDF.",
      icon: <FileSpreadsheet className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/excel-to-pdf",
      color: "bg-green-500",
      id: "excel-to-pdf"
    },
    {
      title: "Sign PDF",
      description: "Sign yourself or request electronic signatures from others.",
      icon: <Signature className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/sign-pdf",
      color: "bg-indigo-600",
      id: "sign-pdf"
    },
    {
      title: "Scan to PDF",
      description: "Capture document scans from your mobile device and send them instantly to your browser.",
      icon: <Scan className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/scan-pdf",
      color: "bg-slate-600",
      id: "scan-pdf"
    },
    {
      title: "OCR PDF",
      description: "Convert scanned PDFs and images into searchable and selectable documents.",
      icon: <Search className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/ocr-pdf",
      color: "bg-cyan-600",
      id: "ocr-pdf"
    },
    {
      title: "Compare PDF",
      description: "Show side-by-side comparison of two similar PDF documents to find changes.",
      icon: <GitCompare className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/compare-pdf",
      color: "bg-violet-600",
      id: "compare-pdf"
    },
    {
      title: "Crop PDF",
      description: "Crop your PDF pages to a selected area, adjust margins size.",
      icon: <Crop className="w-6 h-6 md:w-8 md:h-8" />,
      to: "/crop-pdf",
      color: "bg-emerald-600",
      id: "crop-pdf"
    },
  ];

  // Specific IDs for the popular tools
  const popularIds = ["img-to-pdf", "compress", "compress-img", "merge"];
  
  const popularTools = allTools.filter(t => popularIds.includes(t.id));
  const otherTools = allTools.filter(t => !popularIds.includes(t.id));

  return (
    <>
      <section className="relative py-12 md:py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-[#f6f7f9] -z-10"></div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Every tool you need to <span className="text-primary-400">master</span> your PDFs
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your all-in-one LAK PDF suite. Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks. 100% Free and Secure.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <span className="font-bold text-slate-800 text-sm py-2">Most Popular:</span>
            {popularTools.map((tool) => (
              <Link 
                key={tool.id} 
                to={tool.to}
                className="text-sm px-4 py-2 rounded-full border bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-500 cursor-pointer transition-colors"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
             <Zap className="w-5 h-5 fill-current" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Most Popular Tools</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
          {popularTools.map((tool) => (
            <ToolCard key={tool.to} {...tool} popular={true} />
          ))}
        </div>
      </section>

      {/* Ad Space 1 */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <AdUnit slotId="YOUR_AD_SLOT_ID_1" />
      </div>

      {/* All Tools Section */}
      <section className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">All PDF Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {otherTools.map((tool) => (
            <ToolCard key={tool.to} {...tool} />
          ))}
        </div>
      </section>

      {/* Ad Space 2 */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <AdUnit slotId="YOUR_AD_SLOT_ID_2" />
      </div>

      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">100% Secure</h3>
            <p className="text-slate-500">We do not store your files. All processing happens in your browser, ensuring your data remains private.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Lightning Fast</h3>
            <p className="text-slate-500">Powered by modern web technologies to process your documents instantly without server uploads.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Free Forever</h3>
            <p className="text-slate-500">Enjoy all our PDF tools completely free of charge. No hidden fees or limits.</p>
          </div>
        </div>
      </section>
    </>
  );
};