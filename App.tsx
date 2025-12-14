import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MergePdf } from './pages/MergePdf';
import { ImageToPdf } from './pages/ImageToPdf';
import { SplitPdf } from './pages/SplitPdf';
import { CompressPdf } from './pages/CompressPdf';
import { CompressImage } from './pages/CompressImage';
import { AdvanceCompressImage } from './pages/AdvanceCompressImage';
import { EditPdf } from './pages/EditPdf';
import { ConvertPdf } from './pages/ConvertPdf';
import { PdfToJpg } from './pages/PdfToJpg';
import { RotatePdf } from './pages/RotatePdf';
import { PageNumbers } from './pages/PageNumbers';
import { UnlockPdf } from './pages/UnlockPdf';
import { WatermarkPdf } from './pages/WatermarkPdf';
import { OrganizePdf } from './pages/OrganizePdf';
import { PdfToWord } from './pages/PdfToWord';
import { PdfToExcel } from './pages/PdfToExcel';
import { PdfToPowerPoint } from './pages/PdfToPowerPoint';
import { WordToPdf } from './pages/WordToPdf';
import { ExcelToPdf } from './pages/ExcelToPdf';
import { PowerPointToPdf } from './pages/PowerPointToPdf';
import { ScanPdf } from './pages/ScanPdf';
import { SignPdf } from './pages/SignPdf';
import { CropPdf } from './pages/CropPdf';
import { OcrPdf } from './pages/OcrPdf';
import { ComparePdf } from './pages/ComparePdf';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<MergePdf />} />
          <Route path="/img-to-pdf" element={<ImageToPdf />} />
          <Route path="/split" element={<SplitPdf />} />
          <Route path="/compress" element={<CompressPdf />} />
          <Route path="/compress-img" element={<CompressImage />} />
          <Route path="/advance-compress-img" element={<AdvanceCompressImage />} />
          
          {/* Conversions */}
          <Route path="/convert" element={<ConvertPdf />} />
          <Route path="/pdf-to-img" element={<PdfToJpg />} />
          
          {/* Office Conversions */}
          <Route path="/pdf-to-word" element={<PdfToWord />} />
          <Route path="/pdf-to-powerpoint" element={<PdfToPowerPoint />} />
          <Route path="/pdf-to-excel" element={<PdfToExcel />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/powerpoint-to-pdf" element={<PowerPointToPdf />} />
          <Route path="/excel-to-pdf" element={<ExcelToPdf />} />

          {/* Modification Tools */}
          <Route path="/rotate" element={<RotatePdf />} />
          <Route path="/page-number" element={<PageNumbers />} />
          <Route path="/edit-pdf" element={<EditPdf />} />
          <Route path="/sign-pdf" element={<SignPdf />} />
          <Route path="/watermark" element={<WatermarkPdf />} />
          <Route path="/organize-pdf" element={<OrganizePdf />} />
          <Route path="/crop-pdf" element={<CropPdf />} />
          
          {/* Advanced/Other */}
          <Route path="/scan-pdf" element={<ScanPdf />} />
          <Route path="/ocr-pdf" element={<OcrPdf />} />
          <Route path="/compare-pdf" element={<ComparePdf />} />
          <Route path="/unlock" element={<UnlockPdf />} />

          {/* Company */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;