import { cn } from '@/shared/lib/cn';

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium ' +
  'transition-all duration-150 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-brand-sage ' +
  'disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

const variants = {
  solid: 'bg-accent text-accent-fg hover:opacity-90 active:opacity-80 shadow-2xs',
  outline: 'border border-border text-text bg-surface hover:bg-bg active:opacity-70 shadow-2xs',
  danger: 'bg-danger text-accent-fg hover:opacity-90 active:opacity-80',
  subtle: 'bg-surface-subtle text-text border border-border hover:opacity-80',
  sage: 'bg-brand-sage text-white hover:bg-brand-sage-hover active:opacity-85 shadow-2xs',
};

const sizes = {
  sm: 'min-h-8 px-3 text-xs rounded-lg',
  md: 'min-h-10 px-4 text-xs sm:text-sm rounded-lg',
  lg: 'min-h-11 px-5 text-sm rounded-lg',
  pill: 'min-h-10 px-4 text-xs sm:text-sm rounded-full',
};

/**
 * @param {Object} props
 * @param {'solid'|'outline'|'danger'|'subtle'|'sage'} [props.variant]
 * @param {'sm'|'md'|'lg'|'pill'} [props.size]
 * @param {boolean} [props.pending]
 * @param {import('react').ElementType} [props.as]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.children]
 */
export function Button({
  variant = 'solid',
  size = 'md',
  pending = false,
  as: Tag = 'button',
  className,
  children,
  ...rest
}) {
  const isButton = Tag === 'button';
  return (
    <Tag
      className={cn(base, variants[variant], sizes[size], className)}
      {...(isButton ? { type: rest.type ?? 'button', disabled: pending || rest.disabled } : {})}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? (
        <span className="inline-block animate-spin mr-2">⟳</span>
      ) : null}
      {children}
    </Tag>
  );
}
