import { cn } from '@/shared/lib/cn';

/**
 * Standard Consistent Loading Screen / Spinner for Star Enterprises
 * Provides a unified visual loading state across pages, cards, and dialogs.
 *
 * @param {Object} props
 * @param {string} [props.title] - Bold header message
 * @param {string} [props.message='Loading verified data...'] - Explanatory subtext
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner dimensions
 * @param {boolean} [props.fullScreen=false] - Whether to expand vertically to full container
 * @param {string} [props.className] - Extra Tailwind styling
 */
export function LoadingState({
  title,
  message = 'Loading verified data...',
  size = 'md',
  fullScreen = false,
  className,
}) {
  const spinnerSizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-[2.5px]',
  };

  return (
    <div
      className={cn(
        'text-center space-y-3.5 select-none flex flex-col items-center justify-center animate-in fade-in duration-200',
        fullScreen ? 'py-20 sm:py-28 w-full' : 'py-14 sm:py-16',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Consistent Star Enterprises Accent Spinner */}
      <div
        className={cn(
          'rounded-full border-accent border-t-transparent animate-spin mx-auto shrink-0 shadow-2xs',
          spinnerSizes[size] || spinnerSizes.md
        )}
      />

      <div className="space-y-1 max-w-sm mx-auto px-4">
        {title && (
          <h3 className="text-sm font-semibold text-text tracking-tight">
            {title}
          </h3>
        )}
        {message && (
          <p className="text-xs text-muted font-medium leading-relaxed">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
