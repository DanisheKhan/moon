import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
import { X } from 'lucide-react';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

/**
 * Standardized enterprise modal dialog card.
 * Features comfortable generous sizing, clean borders, backdrop blur, and accessible keyboard dismissal.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'full'} [props.size='lg']
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function Modal({ isOpen, onClose, title, size = 'lg', className, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedSizeClass = SIZE_MAP[size] || SIZE_MAP.lg;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in-0 duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full rounded-xl border border-border bg-surface text-text',
          'max-h-[92vh] flex flex-col min-w-0 shadow-2xs animate-in zoom-in-95 duration-150',
          resolvedSizeClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4.5 sm:px-8 sm:py-5 border-b border-border bg-surface rounded-t-xl shrink-0">
            {title ? (
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-text truncate pr-4">
                {title}
              </h3>
            ) : (
              <div />
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted hover:text-text rounded-lg hover:bg-bg transition-colors cursor-pointer ml-auto shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
