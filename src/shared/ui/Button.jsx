import { cn } from '@/shared/lib/cn';

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium ' +
  'transition-all duration-150 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap shrink-0 select-none';

const variants = {
  solid: 'bg-accent text-accent-fg hover:opacity-95 active:scale-[0.99] shadow-2xs',
  outline: 'border border-border text-text bg-surface hover:bg-surface-subtle hover:border-border-strong active:scale-[0.99] shadow-2xs',
  danger: 'bg-danger text-white hover:opacity-95 active:scale-[0.99]',
  subtle: 'bg-surface-subtle text-text border border-border hover:bg-surface-hover active:scale-[0.99]',
  sage: 'bg-brand-sage text-white hover:bg-brand-sage-hover active:scale-[0.99] shadow-2xs',
};

const sizes = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-9 px-3.5 text-xs sm:text-sm rounded-lg',
  lg: 'h-10 px-4 text-sm rounded-lg',
  pill: 'h-9 px-4 text-xs sm:text-sm rounded-full',
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
        <span className="inline-block animate-spin mr-1.5">⟳</span>
      ) : null}
      {children}
    </Tag>
  );
}
