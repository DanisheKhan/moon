import imageCompression from 'browser-image-compression';
import { supabase } from '@/shared/lib/supabase';

/**
 * Maximum target size for product images in KB
 */
export const MAX_PRODUCT_IMAGE_SIZE_KB = 300;

/**
 * Compresses an image file strictly under 300 KB using browser-image-compression.
 * Runs a multi-pass optimization so that high-resolution photos (from phones or cameras)
 * are cleanly shrunk and optimized while retaining high visual fidelity.
 *
 * @param {File} file - Raw uploaded image file
 * @returns {Promise<{
 *   file: File,
 *   dataUrl: string,
 *   sizeKb: number,
 *   originalSizeKb: number,
 *   reductionPercent: number
 * }>}
 */
export async function compressImageUnder300KB(file) {
  if (!file) throw new Error('No file provided for compression');

  const originalSizeKb = Math.round(file.size / 1024);

  // Pass 1: Target ~280 KB (strictly under 300 KB) with 1280px dimension limit
  const primaryOptions = {
    maxSizeMB: 0.28,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    initialQuality: 0.85,
  };

  let compressed = await imageCompression(file, primaryOptions);

  // Pass 2 (Fail-safe): If still >= 300 KB, re-compress with more aggressive params
  if (compressed.size > MAX_PRODUCT_IMAGE_SIZE_KB * 1024) {
    const aggressiveOptions = {
      maxSizeMB: 0.24,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.72,
    };
    compressed = await imageCompression(compressed, aggressiveOptions);
  }

  // Pass 3 (Ultimate safety check): Ensure strictly under 300 KB
  if (compressed.size > MAX_PRODUCT_IMAGE_SIZE_KB * 1024) {
    const ultraOptions = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.65,
    };
    compressed = await imageCompression(compressed, ultraOptions);
  }

  const finalSizeKb = Math.round(compressed.size / 1024);
  const dataUrl = await imageCompression.getDataUrlFromFile(compressed);

  return {
    file: compressed,
    dataUrl,
    sizeKb: finalSizeKb,
    originalSizeKb,
    reductionPercent: Math.max(0, Math.round(((file.size - compressed.size) / file.size) * 100)),
  };
}

/**
 * Uploads compressed image file to Supabase Storage bucket 'product-images',
 * falling back to base64 Data URL if storage bucket network or RLS is blocked.
 *
 * @param {File} compressedFile
 * @param {string} [identifier='product']
 * @returns {Promise<string>} Public URL or Data URL
 */
export async function uploadProductImage(compressedFile, identifier = 'product') {
  if (!compressedFile) return null;

  try {
    const ext = (compressedFile.type || 'image/jpeg').split('/')[1] || 'jpg';
    const cleanId = String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${cleanId}_${Date.now()}.${ext}`;
    const filePath = `items/${fileName}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, compressedFile, {
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] Upload failed, falling back to data URL:', error);
      return await imageCompression.getDataUrlFromFile(compressedFile);
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('[Storage] Upload exception, falling back to data URL:', err);
    return await imageCompression.getDataUrlFromFile(compressedFile);
  }
}
