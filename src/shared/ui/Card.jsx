import { cn } from '@/shared/lib/cn';

/**
 * Modern rounded card with 1px border and soft 2xl radius.
 * @param {Object} props
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ElementType} [props.as]
 */
export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-border bg-surface p-5 sm:p-6 text-text transition-all shadow-2xs',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
