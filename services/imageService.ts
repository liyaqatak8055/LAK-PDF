import JSZip from 'jszip';

export interface CompressedImage {
  file: File;
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
}

export const compressImage = async (
  file: File, 
  quality: number = 0.8, 
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Maintain dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // White background for transparent PNGs converting to JPEG
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

export const compressImages = async (
  files: File[], 
  quality: number,
  outputFormat: 'original' | 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<CompressedImage[]> => {
  const results: CompressedImage[] = [];

  for (const file of files) {
    let targetFormat = outputFormat;
    
    if (targetFormat === 'original') {
      // Default to jpeg if original is not png/webp, or keep original
      if (file.type === 'image/png') targetFormat = 'image/png';
      else if (file.type === 'image/webp') targetFormat = 'image/webp';
      else targetFormat = 'image/jpeg';
    }

    try {
      const blob = await compressImage(file, quality, targetFormat as any);
      results.push({
        file,
        compressedBlob: blob,
        originalSize: file.size,
        compressedSize: blob.size
      });
    } catch (e) {
      console.error(`Failed to compress ${file.name}`, e);
    }
  }

  return results;
};

/**
 * Attempts to compress an image to be under a specific target size in KB.
 * Uses binary search on quality.
 */
export const compressImageToTarget = async (
  file: File,
  targetKB: number
): Promise<Blob> => {
  const targetBytes = targetKB * 1024;
  
  // Load image
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  await new Promise((resolve) => { img.onload = resolve; });
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Canvas context failed");
  }

  // Draw mostly for JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  URL.revokeObjectURL(objectUrl);

  let min = 0.01;
  let max = 1.0;
  let bestBlob: Blob | null = null;
  let iteration = 0;

  // Binary search for optimal quality
  while (iteration < 7) { // 7 iterations provides roughly 1% precision
    const mid = (min + max) / 2;
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', mid));
    
    if (!blob) break;

    if (blob.size <= targetBytes) {
      // It fits, try to get better quality (go higher)
      bestBlob = blob;
      min = mid;
    } else {
      // Too big, go lower
      max = mid;
    }
    
    iteration++;
  }

  // If even the lowest quality didn't fit, just return the lowest quality blob we managed to make
  // or if we found a best match, return that.
  if (!bestBlob) {
      // Try one last time at absolute minimum
      bestBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.01));
  }

  return bestBlob || new Blob();
};

export const compressImagesToTarget = async (
  files: File[],
  targetKB: number
): Promise<CompressedImage[]> => {
  const results: CompressedImage[] = [];

  for (const file of files) {
    try {
      const blob = await compressImageToTarget(file, targetKB);
      results.push({
        file,
        compressedBlob: blob,
        originalSize: file.size,
        compressedSize: blob.size
      });
    } catch (e) {
      console.error(`Failed to compress ${file.name}`, e);
    }
  }

  return results;
};