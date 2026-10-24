import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {string} [props.className]
 */
export const Input = forwardRef(function Input(
  { id, label, hint, error, className, ...rest },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-text uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full min-h-10 rounded-lg border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text transition-colors',
          'border-border placeholder:text-muted',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          error && 'border-danger focus-visible:outline-danger',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger font-medium">
          {error}
        </p>
      )}
    </div>
  );
});
