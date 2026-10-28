import { cn } from '@/shared/lib/cn';

const variants = {
  default: 'border-border bg-surface-subtle text-text',
  success: 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium',
  sage: 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium',
  amber: 'border-pastel-amber-border bg-pastel-amber text-pastel-amber-text font-medium',
  warning: 'border-pastel-amber-border bg-pastel-amber text-pastel-amber-text font-medium',
  danger: 'border-danger/20 bg-danger/10 text-danger font-medium',
  accent: 'border-accent bg-accent text-accent-fg font-medium',
};

/**
 * Modern status badge.
 * @param {Object} props
 * @param {'default'|'success'|'sage'|'amber'|'warning'|'danger'|'accent'} [props.variant]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Badge({ variant = 'default', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 select-none',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
