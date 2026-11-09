import { useState, useRef } from 'react';
import { compressImageUnder300KB, MAX_PRODUCT_IMAGE_SIZE_KB } from '@/shared/lib/imageCompression';
import { cn } from '@/shared/lib/cn';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Single-image product photo uploader with mandatory validation
 * and guaranteed automatic compression under 300 KB.
 *
 * @param {Object} props
 * @param {string} [props.previewUrl] - Currently active preview URL or data URL
 * @param {(result: { file: File, dataUrl: string, sizeKb: number } | null) => void} props.onImageChange
 * @param {boolean} [props.required=true]
 * @param {string} [props.error]
 * @param {boolean} [props.disabled=false]
 */
export function ProductImageUploader({
  previewUrl,
  onImageChange,
  required = true,
  error,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMeta, setCompressionMeta] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  async function handleFileProcess(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    setUploadError('');
    setIsCompressing(true);

    try {
      const result = await compressImageUnder300KB(file);
      setCompressionMeta({
        sizeKb: result.sizeKb,
        originalSizeKb: result.originalSizeKb,
        reductionPercent: result.reductionPercent,
      });

      onImageChange({
        file: result.file,
        dataUrl: result.dataUrl,
        sizeKb: result.sizeKb,
      });
    } catch (err) {
      console.error('Image compression failed:', err);
      setUploadError(err.message || 'Failed to compress image under 300 KB. Please choose another image.');
      onImageChange(null);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // Reset file input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isCompressing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled && !isCompressing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleRemoveImage(e) {
    e.stopPropagation();
    setCompressionMeta(null);
    setUploadError('');
    onImageChange(null);
  }

  const activeError = uploadError || error;

  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text">
          Product Photo {required && <span className="text-brand-crimson">* (Mandatory)</span>}
        </label>
        <span className="text-[11px] text-muted font-medium">
          Single Image • Max 300 KB
        </span>
      </div>

      {/* Hidden single file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple={false}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isCompressing}
      />

      {/* Upload Box / Preview Card */}
      {previewUrl ? (
        <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs flex flex-col sm:flex-row items-center gap-3.5 transition-all">
          {/* Thumbnail Preview */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-border/80 bg-surface-subtle shrink-0 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full h-full object-contain p-1"
            />
          </div>

          {/* Details & Compression Stats */}
          <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <CheckCircle2 size={12} className="stroke-[2.5]" />
                Compressed Under 300 KB
              </span>
              {compressionMeta?.sizeKb != null && (
                <span className="text-xs font-mono font-bold text-text">
                  {compressionMeta.sizeKb} KB
                </span>
              )}
            </div>

            {compressionMeta?.originalSizeKb ? (
              <p className="text-[11px] text-muted">
                Original size: <span className="line-through">{compressionMeta.originalSizeKb} KB</span>{' '}
                <strong className="text-brand-sage font-semibold">
                  ({compressionMeta.reductionPercent}% smaller)
                </strong>
              </p>
            ) : (
              <p className="text-[11px] text-muted">
                Optimized web format ready for instant store loading.
              </p>
            )}

            {/* Actions: Replace or Delete */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isCompressing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw size={12} className={cn(isCompressing && 'animate-spin')} />
                <span>Replace Photo</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || isCompressing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10 active:scale-[0.99] transition-all cursor-pointer"
                title="Remove uploaded image"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'group relative p-5 sm:p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2',
            isDragging
              ? 'border-brand-sage bg-brand-sage-subtle/50'
              : activeError
              ? 'border-brand-crimson/60 bg-brand-crimson-subtle/20 hover:border-brand-crimson'
              : 'border-border bg-surface hover:border-brand-sage/60 hover:bg-surface-subtle/50',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          {isCompressing ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="text-brand-sage animate-spin" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text">Compressing Image...</p>
                <p className="text-[11px] text-muted">
                  Optimizing image file strictly under {MAX_PRODUCT_IMAGE_SIZE_KB} KB
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center text-muted group-hover:text-brand-sage group-hover:bg-brand-sage-subtle transition-colors shrink-0">
                <UploadCloud size={20} className="stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-text">
                  <span className="text-brand-sage underline decoration-brand-sage/40 underline-offset-2">
                    Click to upload
                  </span>{' '}
                  or drag and drop photo
                </p>
                <p className="text-[11px] text-muted">
                  JPG, PNG, WebP • Auto-compressed strictly <strong className="text-text font-bold">&lt; 300 KB</strong>
                </p>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider text-muted/80 bg-surface-subtle px-2 py-0.5 rounded border border-border/60">
                Single Image Only
              </span>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-brand-crimson font-medium pt-0.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
