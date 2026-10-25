import { cn } from '@/shared/lib/cn';

const variants = {
  default: 'border-border bg-surface text-text',
  success: 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium',
  sage: 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium',
  danger: 'border-danger/30 bg-danger/10 text-danger font-medium',
  accent: 'border-accent bg-accent text-accent-fg font-medium',
};

/**
 * Modern pill-shaped status badge.
 * @param {Object} props
 * @param {'default'|'success'|'sage'|'danger'|'accent'} [props.variant]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Badge({ variant = 'default', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
