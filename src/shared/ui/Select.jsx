import { useState, useRef, useEffect, useCallback, useId, Children, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Premium custom dropdown Select component.
 * Uses a fixed portal to render over modals and scroll containers without clipping,
 * automatically detects space to open upwards or downwards, and supports full keyboard nav.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {string|number} [props.value]
 * @param {(e: { target: { value: string, id?: string, name?: string } }) => void} [props.onChange]
 * @param {Array<{value: string|number, label: string}>} [props.options]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {import('react').ReactNode} [props.children]
 */
export function Select({
  id: explicitId,
  name,
  label,
  placeholder = 'Select an option...',
  hint,
  error,
  value,
  onChange,
  options: propOptions = [],
  className,
  disabled = false,
  children,
  ...rest
}) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Parse options from prop or children
  let options = propOptions;
  if ((!options || options.length === 0) && children) {
    options = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.props) {
        options.push({
          value: child.props.value ?? '',
          label: child.props.children || String(child.props.value ?? ''),
        });
      }
    });
  }

  // Find currently selected option
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  // Calculate coordinates to float accurately and determine direction (dropup vs dropdown)
  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const numItems = Math.max(options.length, 1);
    const targetMenuHeight = Math.min(numItems * 38 + 16, 260);

    // Prefer opening downwards unless space below is tight and space above is larger
    const openAbove = spaceBelow < targetMenuHeight && spaceAbove > spaceBelow;

    const availableHeight = openAbove ? spaceAbove - 16 : spaceBelow - 16;
    const maxHeight = Math.max(Math.min(availableHeight, 260), 120);

    setCoords({
      openAbove,
      left: rect.left,
      width: rect.width,
      top: openAbove ? undefined : rect.bottom + 6,
      bottom: openAbove ? viewportHeight - rect.top + 6 : undefined,
      maxHeight,
    });
  }, [options.length]);

  // Listeners for click-outside, scroll, and resize
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateCoords();

    function handlePointerDown(e) {
      if (
        (buttonRef.current && buttonRef.current.contains(e.target)) ||
        (menuRef.current && menuRef.current.contains(e.target))
      ) {
        return;
      }
      setIsOpen(false);
    }

    function handleScroll() {
      // If user scrolls inside the menu itself, do not close or re-evaluate
      if (menuRef.current && menuRef.current.contains(document.activeElement)) {
        return;
      }
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // If trigger has scrolled completely offscreen, close menu
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
        updateCoords();
      }
    }

    function handleResize() {
      updateCoords();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateCoords]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (disabled) return;

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
      let nextIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }
      const nextOption = options[nextIndex];
      if (nextOption) {
        triggerChange(nextOption.value);
      }
    }
  }

  function triggerChange(nextValue) {
    if (onChange) {
      onChange({
        target: {
          value: nextValue,
          id,
          name: name || id,
        },
      });
    }
    setIsOpen(false);
  }

  return (
    <div className="relative flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-text uppercase tracking-wider block"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full min-h-10 rounded-lg border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text',
          'flex items-center justify-between gap-2 cursor-pointer transition-all',
          'border-border hover:border-text/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:border-brand-sage',
          isOpen && 'border-brand-sage ring-1 ring-brand-sage shadow-2xs',
          disabled && 'opacity-50 cursor-not-allowed bg-bg/50',
          error && 'border-danger focus-visible:ring-danger',
          className
        )}
        {...rest}
      >
        <span
          title={selectedOption ? selectedOption.label : placeholder}
          className={cn(
            'truncate block text-left min-w-0 flex-1',
            selectedOption ? 'text-text font-medium' : 'text-muted'
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-text'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Hidden Native Input for standard forms */}
      <input
        type="hidden"
        name={name || id}
        value={value ?? ''}
        id={`${id}-native`}
      />

      {/* Floating Dropdown Popover Menu mounted directly to document.body */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={label ? id : undefined}
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className={cn(
            'rounded-xl border border-border bg-surface text-text shadow-sm p-1.5',
            'overflow-y-auto animate-in fade-in-0 duration-150',
            coords.openAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2',
            'focus:outline-none'
          )}
        >
          {options.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-muted text-center">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => triggerChange(opt.value)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer',
                    'transition-colors select-none',
                    isSelected
                      ? 'bg-brand-sage-subtle font-medium text-text'
                      : 'text-text hover:bg-bg/80 hover:text-text'
                  )}
                >
                  <span className="truncate min-w-0 flex-1 text-left" title={opt.label}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={15} className="text-brand-sage shrink-0 ml-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}

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
}
