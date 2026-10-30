import { cn } from '@/shared/lib/cn';

/**
 * Responsive data table wrapper that isolates horizontal scrolling to its container with rounded curves.
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string} [props.containerClassName]
 * @param {import('react').ReactNode} props.children
 */
export function Table({ className, containerClassName, children, ...rest }) {
  const isAuto = className?.includes('table-auto');
  const layoutClass = isAuto ? '' : className?.includes('table-fixed') ? '' : 'table-fixed';

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border bg-surface min-w-0 shadow-2xs',
        containerClassName?.includes('overflow-') ? '' : 'overflow-x-auto',
        containerClassName
      )}
    >
      <table className={cn('w-full text-left border-collapse text-sm', layoutClass, className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, children, ...rest }) {
  return (
    <thead
      className={cn(
        'bg-surface-subtle border-b border-border text-[11px] sm:text-xs uppercase font-medium text-muted tracking-wider select-none whitespace-nowrap',
        className
      )}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...rest }) {
  return (
    <tbody className={cn('divide-y divide-border text-text', className)} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...rest }) {
  return (
    <tr className={cn('hover:bg-surface-subtle/50 transition-colors', className)} {...rest}>
      {children}
    </tr>
  );
}

export function TableCell({ className, children, ...rest }) {
  return (
    <td className={cn('px-3.5 sm:px-4 py-3 sm:py-3.5 align-middle font-normal', className)} {...rest}>
      {children}
    </td>
  );
}

export function TableHeaderCell({ className, children, ...rest }) {
  return (
    <th className={cn('h-11 px-3.5 sm:px-4 py-2.5 align-middle font-medium whitespace-nowrap', className)} {...rest}>
      {children}
    </th>
  );
}
