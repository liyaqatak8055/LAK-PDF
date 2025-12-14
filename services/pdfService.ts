import { PDFDocument, degrees, StandardFonts, rgb, grayscale, PDFImage } from 'pdf-lib';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfFile } from '../types';

// Handle ESM/CJS interop for pdfjs-dist
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF.js worker
// We use a specific version from cdnjs to match the library version
if (typeof window !== 'undefined' && pdfjs) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

// Export pdfjs for use in components
export { pdfjs };

/**
 * Helper to safely load a PDFDocument with basic error checking.
 */
const safeLoadPdf = async (buffer: ArrayBuffer): Promise<PDFDocument> => {
  try {
    return await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch (error: any) {
    if (error.message && error.message.includes('Invalid PDF structure')) {
       throw new Error('Invalid PDF structure. The file might be corrupted, or it is not a valid PDF.');
    }
    throw error;
  }
};

/**
 * Merges multiple PDF files into a single PDF.
 */
export const mergePdfs = async (files: PdfFile[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();

  for (const pdfFile of files) {
    const fileArrayBuffer = await pdfFile.file.arrayBuffer();
    try {
      const pdf = await safeLoadPdf(fileArrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
      console.error(`Failed to load PDF ${pdfFile.name}:`, e);
      // Skip invalid files or throw? Let's throw to inform user.
      throw new Error(`Failed to merge ${pdfFile.name}: Invalid PDF structure.`);
    }
  }

  return await mergedPdf.save();
};

/**
 * Splits a PDF into individual pages and returns a ZIP file.
 */
export const splitPdf = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();
  const zip = new JSZip();

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    zip.file(`page_${i + 1}.pdf`, pdfBytes);
  }

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Advanced PDF compression.
 * @param file The PDF file to compress
 * @param quality 0.0 to 1.0. If 1.0, performs lossless optimization. < 1.0 performs rasterization (lossy).
 */
export const compressPdf = async (file: File, quality: number = 0.7): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();

  // If quality is 1.0, we treat it as "Lossless" (just structural optimization)
  if (quality >= 1.0) {
    const pdfDoc = await safeLoadPdf(arrayBuffer);
    return await pdfDoc.save({ useObjectStreams: true });
  }

  // Rasterization Approach for significant compression
  // This converts pages to JPEG images and places them in a new PDF
  try {
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const newPdfDoc = await PDFDocument.create();

    // Scale factor determines resolution
    const scale = quality < 0.6 ? 1.0 : 1.5;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        
        // Convert canvas to JPEG with specified quality
        const imgDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Decode Base64 to Uint8Array
        const base64 = imgDataUrl.split(',')[1];
        if (!base64) continue; // Skip if empty

        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        const jpgImage = await newPdfDoc.embedJpg(bytes);
        
        // Add page with original dimensions
        const originalViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
        
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });
      }
    }
    return await newPdfDoc.save();
  } catch (e: any) {
    console.error("Compression failed:", e);
    // Fallback: If rasterization fails (e.g. password protected), try lossless load
    if (e.name === 'PasswordException') {
       throw new Error('PDF is password protected. Please unlock it first.');
    }
    // Try basic save as fallback
    try {
       const pdfDoc = await safeLoadPdf(arrayBuffer);
       return await pdfDoc.save({ useObjectStreams: true });
    } catch (loadErr) {
       throw new Error('Failed to process PDF. Invalid structure.');
    }
  }
};

/**
 * Rotates all pages in a PDF by a specified degree.
 */
export const rotatePdf = async (file: File, rotation: number): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  pages.forEach(page => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotation));
  });

  return await pdfDoc.save();
};

/**
 * Adds page numbers to a PDF.
 */
export const addPageNumbers = async (file: File, position: 'bottom-center' | 'bottom-right' = 'bottom-center'): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const fontSize = 12;
    const text = `${idx + 1}/${totalPages}`;
    const textWidth = courierFont.widthOfTextAtSize(text, fontSize);
    
    let x = 0;
    let y = 20; // Bottom margin

    if (position === 'bottom-center') {
      x = (width / 2) - (textWidth / 2);
    } else if (position === 'bottom-right') {
      x = width - textWidth - 20;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: courierFont,
      color: rgb(0, 0, 0),
    });
  });

  return await pdfDoc.save();
};

/**
 * Protect PDF with password
 */
export const protectPdf = async (file: File, password: string): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  // Load original doc
  const srcPdfDoc = await safeLoadPdf(arrayBuffer);
  
  // Create a new document to ensure clean encryption state
  const newPdfDoc = await PDFDocument.create();
  
  // Copy all pages from source to new doc
  const indices = srcPdfDoc.getPageIndices();
  const copiedPages = await newPdfDoc.copyPages(srcPdfDoc, indices);
  copiedPages.forEach(page => newPdfDoc.addPage(page));

  // Save with encryption
  const encryptedPdfBytes = await newPdfDoc.save({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: false,
      documentAssembly: false,
    },
  });
  return encryptedPdfBytes;
};

/**
 * Unlock PDF (Remove password)
 */
export const unlockPdf = async (file: File, password: string): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { password });
    return await pdfDoc.save();
  } catch (e) {
    throw new Error('Incorrect password or invalid PDF.');
  }
};

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageBytes?: ArrayBuffer;
  imageType?: 'png' | 'jpg';
  color?: string;
  opacity: number;
  size?: number; // Text size or Image scale
  position: number; // 1-9 grid position
  isMosaic: boolean;
  rotation: number;
}

/**
 * Add Watermark (Text or Image)
 */
export const watermarkPdf = async (
  file: File, 
  options: WatermarkOptions
): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const pages = pdfDoc.getPages();

  let font;
  let embeddedImage: PDFImage | undefined;
  
  // Pre-load resources
  if (options.type === 'text') {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  } else if (options.type === 'image' && options.imageBytes) {
    if (options.imageType === 'png') {
        embeddedImage = await pdfDoc.embedPng(options.imageBytes);
    } else {
        embeddedImage = await pdfDoc.embedJpg(options.imageBytes);
    }
  }

  // Helper to calculate coordinates based on 3x3 grid (1-9)
  const getCoordinates = (
    pos: number, 
    pageW: number, 
    pageH: number, 
    objW: number, 
    objH: number
  ) => {
    const margin = 20;
    let x = 0;
    let y = 0;

    // Horizontal
    if ([1, 4, 7].includes(pos)) x = margin; // Left
    else if ([2, 5, 8].includes(pos)) x = (pageW - objW) / 2; // Center
    else if ([3, 6, 9].includes(pos)) x = pageW - objW - margin; // Right

    // Vertical (PDF coordinate system: 0,0 is bottom-left)
    if ([7, 8, 9].includes(pos)) y = margin; // Bottom
    else if ([4, 5, 6].includes(pos)) y = (pageH - objH) / 2; // Middle
    else if ([1, 2, 3].includes(pos)) y = pageH - objH - margin; // Top
    
    return { x, y };
  };

  // Parse color
  const colorHex = options.color || '#FF0000';
  const r = parseInt(colorHex.slice(1, 3), 16) / 255;
  const g = parseInt(colorHex.slice(3, 5), 16) / 255;
  const b = parseInt(colorHex.slice(5, 7), 16) / 255;
  const colorRgb = rgb(r, g, b);

  pages.forEach(page => {
    const { width, height } = page.getSize();
    
    // Draw Text
    if (options.type === 'text' && font && options.text) {
        const textSize = options.size || 60;
        const textWidth = font.widthOfTextAtSize(options.text, textSize);
        const textHeight = font.heightAtSize(textSize);
        
        const draw = (x: number, y: number) => {
            page.drawText(options.text!, {
                x,
                y,
                size: textSize,
                font: font,
                color: colorRgb,
                opacity: options.opacity,
                rotate: degrees(options.rotation),
            });
        };

        if (options.isMosaic) {
            // Simple grid for mosaic
            const gapX = textWidth + 100;
            const gapY = textHeight + 100;
            for (let mx = 0; mx < width; mx += gapX) {
                for (let my = 0; my < height; my += gapY) {
                    draw(mx, my);
                }
            }
        } else {
            const { x, y } = getCoordinates(options.position, width, height, textWidth, textHeight);
            draw(x, y);
        }
    }

    // Draw Image
    if (options.type === 'image' && embeddedImage) {
        const scale = (options.size || 50) / 100; // 0.1 to 1.0 based on percentage
        const imgDims = embeddedImage.scale(scale);
        
        const draw = (x: number, y: number) => {
            page.drawImage(embeddedImage!, {
                x,
                y,
                width: imgDims.width,
                height: imgDims.height,
                opacity: options.opacity,
                rotate: degrees(options.rotation),
            });
        };

        if (options.isMosaic) {
             const gapX = imgDims.width + 50;
             const gapY = imgDims.height + 50;
             for (let mx = 0; mx < width; mx += gapX) {
                 for (let my = 0; my < height; my += gapY) {
                     draw(mx, my);
                 }
             }
        } else {
            const { x, y } = getCoordinates(options.position, width, height, imgDims.width, imgDims.height);
            draw(x, y);
        }
    }
  });

  return await pdfDoc.save();
};

/**
 * Organize PDF (Reorder/Delete pages)
 */
export const organizePdf = async (file: File, pageIndices: number[]): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const newPdf = await PDFDocument.create();
  
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach(page => newPdf.addPage(page));

  return await newPdf.save();
};

/**
 * Convert PDF pages to Images (JPG) and return as ZIP.
 */
export const convertPdfToImages = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (blob) {
        zip.file(`page_${i}.jpg`, blob);
      }
    }
  }

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Converts a list of image files to a single PDF.
 */
export const imagesToPdf = async (files: PdfFile[]): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();

  for (const imgFile of files) {
    const buffer = await imgFile.file.arrayBuffer();
    let image;
    
    if (imgFile.file.type === 'image/jpeg' || imgFile.file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(buffer);
    } else if (imgFile.file.type === 'image/png') {
      image = await pdfDoc.embedPng(buffer);
    } else {
      continue;
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
};

export interface EditorAction {
  id: string;
  type: 'text' | 'draw' | 'image' | 'rectangle' | 'circle';
  pageIndex: number;
  x?: number; // Normalized 0-1
  y?: number; // Normalized 0-1
  width?: number; // Normalized 0-1
  height?: number; // Normalized 0-1
  text?: string;
  size?: number;
  color?: string;
  paths?: { x: number; y: number }[]; // Normalized 0-1
  strokeWidth?: number;
  imageData?: string; // Base64
  imageWidth?: number; // Normalized (Legacy, prefer width)
  imageHeight?: number; // Normalized (Legacy, prefer height)
}

/**
 * Applies text, drawing, and image annotations to a PDF.
 */
export const saveEditedPdf = async (file: File, actions: EditorAction[]): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const parseColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  for (const action of actions) {
    if (action.pageIndex >= pages.length) continue;
    const page = pages[action.pageIndex];
    const { width, height } = page.getSize();

    if (action.type === 'text' && action.text && action.x !== undefined && action.y !== undefined) {
      const pdfX = action.x * width;
      const pdfY = height - (action.y * height); // Flip Y
      const fontSize = action.size || 12;
      
      page.drawText(action.text, {
        x: pdfX,
        y: pdfY - fontSize, // Adjust for top-left anchor vs bottom-left PDF
        size: fontSize,
        font: helveticaFont,
        color: action.color ? parseColor(action.color) : rgb(0, 0, 0),
      });
    }

    if (action.type === 'draw' && action.paths && action.paths.length > 1) {
      const pathColor = action.color ? parseColor(action.color) : rgb(0, 0, 0);
      const thickness = action.strokeWidth || 2;

      for (let i = 0; i < action.paths.length - 1; i++) {
        const p1 = action.paths[i];
        const p2 = action.paths[i+1];

        page.drawLine({
          start: { x: p1.x * width, y: height - (p1.y * height) },
          end: { x: p2.x * width, y: height - (p2.y * height) },
          thickness: thickness,
          color: pathColor,
        });
      }
    }
    
    if (action.type === 'rectangle' && action.x !== undefined && action.y !== undefined && action.width !== undefined && action.height !== undefined) {
      const rectColor = action.color ? parseColor(action.color) : rgb(1, 1, 1);
      
      page.drawRectangle({
        x: action.x * width,
        y: height - (action.y * height) - (action.height * height),
        width: action.width * width,
        height: action.height * height,
        color: rectColor,
      });
    }

    if (action.type === 'circle' && action.x !== undefined && action.y !== undefined && action.width !== undefined && action.height !== undefined) {
      const circleColor = action.color ? parseColor(action.color) : rgb(0, 0, 0);
      const w = action.width * width;
      const h = action.height * height;
      
      page.drawEllipse({
        x: (action.x * width) + (w / 2),
        y: height - (action.y * height) - (h / 2),
        xScale: w / 2,
        yScale: h / 2,
        color: circleColor,
      });
    }
    
    if (action.type === 'image' && action.imageData && action.x !== undefined && action.y !== undefined) {
      let embeddedImage;
      if (action.imageData.startsWith('data:image/png')) {
        embeddedImage = await pdfDoc.embedPng(action.imageData);
      } else {
        embeddedImage = await pdfDoc.embedJpg(action.imageData);
      }

      let finalW, finalH;
      
      if (action.width !== undefined && action.height !== undefined) {
         finalW = action.width * width;
         finalH = action.height * height;
      } else {
         // Legacy fallback or initial creation fallback
         finalW = (action.imageWidth || 0.2) * width;
         const aspect = embeddedImage.width / embeddedImage.height;
         finalH = action.imageHeight ? action.imageHeight * height : finalW / aspect;
      }

      page.drawImage(embeddedImage, {
        x: action.x * width,
        y: height - (action.y * height) - finalH,
        width: finalW,
        height: finalH
      });
    }
  }

  return await pdfDoc.save();
};

/**
 * Crop PDF pages.
 * cropRect: { x, y, width, height } normalized 0-1
 */
export const cropPdf = async (file: File, cropRect: { x: number, y: number, width: number, height: number }): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await safeLoadPdf(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();
    
    // Convert normalized coordinates to PDF points
    const cropX = cropRect.x * width;
    const cropW = cropRect.width * width;
    const cropH = cropRect.height * height;
    
    const cropY = height - (cropRect.y * height) - cropH;

    page.setCropBox(cropX, cropY, cropW, cropH);
  });

  return await pdfDoc.save();
};

/**
 * Extracts text from a PDF file using PDF.js
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return fullText;
};

export const downloadPdf = (data: Uint8Array | Blob, filename: string) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadFile = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};