import { cn } from '@/shared/lib/cn';

/**
 * Base shimmer pulse skeleton element
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-subtle border border-border/40', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Professional loading spinner using project tokens
 */
export function Spinner({ size = 'md', className, ...props }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'rounded-full border-accent border-t-transparent animate-spin inline-block shrink-0',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Table skeleton with configurable rows and column widths
 */
export function TableSkeleton({ rows = 5, cols = 5, className }) {
  return (
    <div className={cn('w-full border border-border rounded-xl bg-surface overflow-hidden shadow-2xs', className)}>
      {/* Table Header placeholder */}
      <div className="bg-surface-subtle border-b border-border p-3.5 flex items-center gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={`td-${r}-${c}`}
                className={cn('h-4 flex-1', c === 0 && 'max-w-28', c === cols - 1 && 'max-w-24')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * KPI Grid Skeleton matching Dashboard and Reports metric ribbons
 */
export function KpiGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`kpi-skel-${i}`}
          className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/**
 * Product & Inventory Card Skeleton
 */
export function CardSkeleton({ className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-3 space-y-3 shadow-2xs flex flex-col justify-between', className)}>
      <div className="space-y-2.5">
        <Skeleton className="w-full aspect-[16/10] rounded-lg" />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * POS Catalog Skeleton Grid
 */
export function PosCatalogSkeleton({ count = 8, className }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`pos-skel-${i}`}
          className="rounded-xl border border-border bg-surface p-3 space-y-2.5 shadow-2xs"
        >
          <Skeleton className="w-full aspect-square rounded-lg" />
          <Skeleton className="h-3.5 w-4/5" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
