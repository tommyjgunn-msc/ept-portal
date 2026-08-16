// components/UIDesignSystem.js — shared UI primitives, Futurimi standards.
//
// Component APIs are unchanged so call sites keep working. What changed is the
// visual layer:
//   - No shadows and no glows. Depth comes from a hairline and a value step.
//   - One radius (2px, from the config) and no pills. Status is a square
//     swatch plus a word, so it never depends on colour alone.
//   - One accent. Crimson is a FILL on the dark ground and only ever carries
//     white text; as text on near-black it measures 2.8:1, which is why the
//     old red-on-dark labels were hard to read. Accent *text* on dark is ochre.
//   - Transitions name their properties. `transition-all` no longer covers
//     transform or shadow (see tailwind.config.ts), so nothing can lift.

import { useState, useEffect, useRef } from 'react';

// Card — a hairline and a surface step. `gradient` and `elevation` are kept in
// the signature so existing call sites don't break; both are now no-ops.
export const Card = ({
  children,
  className = '',
  hover = true,
  clickable = false,
  gradient = false, // eslint-disable-line no-unused-vars
  elevation = 'md', // eslint-disable-line no-unused-vars
  ...props
}) => {
  const base = `bg-ftm-card border border-ftm-line transition-colors duration-150
    ${hover || clickable ? 'hover:border-ftm-line2' : ''}
    ${clickable ? 'cursor-pointer' : ''}`;

  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  loading = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-ftm-crimson text-white hover:bg-ftm-crimsondeep',
    secondary: 'bg-ftm-up text-ftm-ink hover:bg-ftm-card border border-ftm-line',
    success: 'bg-ftm-greendeep text-white hover:brightness-110',
    danger: 'bg-ftm-crimson text-white hover:bg-ftm-crimsondeep',
    ghost: 'text-ftm-link hover:text-ftm-ink underline underline-offset-4',
    outline: 'border border-ftm-line2 text-ftm-ink hover:bg-ftm-up',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[13px]',
    md: 'px-4 py-2.5 text-[14px]',
    lg: 'px-6 py-3.5 text-[15px]',
    xl: 'px-8 py-4 text-[17px]',
  };

  const base = `inline-flex items-center justify-center gap-2 font-inter font-bold
    transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {icon && iconPosition === 'left' && !loading && icon}
      {children}
      {icon && iconPosition === 'right' && !loading && icon}
    </button>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-shell',
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 120);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-150 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        {/* No backdrop blur — a plain scrim reads the same and costs nothing. */}
        <div className="fixed inset-0 bg-black/70" onClick={onClose} />

        <div
          ref={modalRef}
          className={`relative w-full bg-ftm-card border border-ftm-line2 text-left ${sizes[size]} ${className}`}
        >
          {title && (
            <div className="bg-ftm-up px-6 py-4 border-b border-ftm-line flex items-center justify-between gap-4">
              <h3 className="font-grotesk text-[17px] font-bold text-ftm-ink">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="font-inter text-[13px] font-semibold text-ftm-mut hover:text-ftm-ink transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const FormField = ({
  label,
  error,
  children,
  required = false,
  helpText = null,
  className = '',
}) => (
  <div className={className}>
    {label && (
      <label className="block font-inter font-bold text-[15px] text-ftm-ink mb-1">
        {label}
        {required && <span className="text-ftm-ochre ml-1" aria-hidden="true">*</span>}
      </label>
    )}
    {helpText && <p className="font-inter text-[13px] text-ftm-mut mb-2">{helpText}</p>}
    {error && <p className="font-inter font-semibold text-[13px] text-ftm-ochre mb-2">{error}</p>}
    {children}
  </div>
);

export const Input = ({
  className = '',
  error = false,
  icon = null,           // eslint-disable-line no-unused-vars
  iconPosition = 'left', // eslint-disable-line no-unused-vars
  ...props
}) => {
  // Icons inside inputs were decorative — they carried no information the label
  // did not already give, and they pushed the value off the field's left edge.
  const base = `block w-full font-inter text-[15px] bg-ftm-night text-ftm-ink placeholder-ftm-dim
    border-2 px-3.5 py-2.5 transition-colors duration-150
    ${error ? 'border-ftm-crimson' : 'border-ftm-line2 focus:border-ftm-ink'}`;

  return <input className={`${base} ${className}`} {...props} />;
};

// Toast — enters by opacity only. Nothing slides.
//
// `stacked` lets ToastProvider own the positioning so several toasts queue
// down the corner instead of landing on the same fixed coordinates.
export const Toast = ({
  type = 'info',
  title,
  message,
  isVisible = false,
  onClose,
  autoClose = true,
  duration = 5000,
  stacked = false,
}) => {
  const [isShowing, setIsShowing] = useState(false);

  const accents = {
    success: 'border-ftm-green text-ftm-green',
    error: 'border-ftm-crimson text-ftm-ochre',
    warning: 'border-ftm-ochre text-ftm-ochre',
    info: 'border-ftm-slate text-ftm-slate',
  };

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsShowing(false);
          setTimeout(onClose, 150);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowing(false);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      className={`transition-opacity duration-150 ${isShowing ? 'opacity-100' : 'opacity-0'}
        ${stacked ? '' : 'fixed top-4 right-4 z-50 max-w-sm w-full'}`}
    >
      <div className={`bg-ftm-card border border-ftm-line border-l-[6px] px-4 py-3.5 ${accents[type]}`}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {title && <p className="font-inter font-bold text-[14px]">{title}</p>}
            {message && <p className={`font-inter text-[14px] text-ftm-mut ${title ? 'mt-0.5' : ''}`}>{message}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Dismiss"
            className="font-inter text-[12px] font-semibold text-ftm-dim hover:text-ftm-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ProgressBar — a square track. Rounded ends make a bar look decorative and
// make the last few percent impossible to read.
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'bg-ftm-crimson',
    success: 'bg-ftm-green',
    warning: 'bg-ftm-ochre',
    danger: 'bg-ftm-crimson',
  };

  const sizes = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between font-inter text-[12px] text-ftm-mut mb-1.5">
          <span>Progress</span>
          <span className="tabular-nums">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full bg-ftm-up overflow-hidden ${sizes[size]}`}
      >
        <div className={`${variants[variant]} ${sizes[size]} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// Badge — was a rounded pill with a 14%-opacity tint, which is both the pastel
// tell and a colour-only signal. Now a square swatch plus the word.
export const Badge = ({ children, variant = 'default', size = 'md', icon = null, className = '' }) => {
  const variants = {
    default: 'text-ftm-slate',
    secondary: 'text-ftm-slate',
    primary: 'text-ftm-ochre',
    success: 'text-ftm-green',
    warning: 'text-ftm-ochre',
    danger: 'text-ftm-ochre',
    info: 'text-ftm-slate',
  };

  const sizes = { sm: 'text-[11px]', md: 'text-[12px]', lg: 'text-[13px]' };

  return (
    <span className={`ftm-status font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

// Alert — GOV.UK pattern: a thick left rule in the signal colour, a bold
// heading, plain body. No icon, no tinted panel.
export const Alert = ({ type = 'info', title, children, dismissible = false, onDismiss, className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const types = {
    info: { rule: 'border-ftm-slate', head: 'text-ftm-slate' },
    success: { rule: 'border-ftm-green', head: 'text-ftm-green' },
    warning: { rule: 'border-ftm-ochre', head: 'text-ftm-ochre' },
    error: { rule: 'border-ftm-crimson', head: 'text-ftm-ochre' },
  };

  if (!isVisible) return null;
  const config = types[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`border-l-[6px] bg-ftm-card px-5 py-4 ${config.rule} ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          {title && <h3 className={`font-grotesk font-bold text-[15px] mb-1 ${config.head}`}>{title}</h3>}
          <div className="font-inter text-[14px] leading-relaxed text-ftm-mut">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="font-inter text-[12px] font-semibold text-ftm-dim hover:text-ftm-ink transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export const LoadingButton = ({
  children,
  isLoading = false,
  loadingText = 'Working',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => (
  <Button variant={variant} size={size} loading={isLoading} className={className} {...props}>
    {isLoading ? loadingText : children}
  </Button>
);
