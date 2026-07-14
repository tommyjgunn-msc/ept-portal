// components/UIDesignSystem.js - Futurimi dark-theme UI components
// Same component APIs as before; visual layer follows the Futurimi tokens
// (see design_handoff_futurimi_redesign).

import { useState, useEffect, useRef } from 'react';

// Card
export const Card = ({
  children,
  className = '',
  hover = true,
  clickable = false,
  gradient = false,
  elevation = 'md',
  ...props
}) => {
  const elevations = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const baseClasses = `
    bg-ftm-card rounded-[10px] border border-white/[.08] transition-all duration-300 ease-out
    ${elevations[elevation]}
    ${hover ? 'hover:border-white/[.14]' : ''}
    ${clickable ? 'cursor-pointer hover:border-white/[.18]' : ''}
    ${gradient ? 'bg-gradient-to-br from-ftm-up to-ftm-bar' : ''}
  `;

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Button
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
    primary: 'bg-ftm-red text-white hover:bg-[#C51F35] focus:ring-ftm-red shadow-redglow',
    secondary: 'bg-ftm-slate/[.14] text-ftm-slate hover:bg-ftm-slate/[.22] focus:ring-ftm-slate',
    success: 'bg-ftm-green/[.14] text-ftm-green hover:bg-ftm-green/[.22] focus:ring-ftm-green',
    danger: 'bg-ftm-red text-white hover:bg-[#C51F35] focus:ring-ftm-red',
    ghost: 'text-ftm-slate hover:bg-white/5 focus:ring-ftm-slate',
    outline: 'border border-ftm-red/60 text-ftm-red hover:bg-ftm-red/10 focus:ring-ftm-red'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center font-inter font-semibold rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ftm-night
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

// Modal
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div
          ref={modalRef}
          className={`
            relative inline-block align-bottom bg-ftm-card border border-white/[.08] rounded-[10px] text-left overflow-hidden shadow-2xl
            transform transition-all duration-300 sm:my-8 sm:align-middle w-full
            ${sizes[size]} ${className}
            ${isOpen ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-4 opacity-0 sm:scale-95'}
          `}
        >
          {/* Header */}
          {title && (
            <div className="bg-ftm-up px-6 py-4 border-b border-white/[.07] flex items-center justify-between">
              <h3 className="font-grotesk text-lg font-semibold text-ftm-ink">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-ftm-dim hover:text-ftm-slate transition-colors p-1 rounded-full hover:bg-white/5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form field wrapper
export const FormField = ({
  label,
  error,
  children,
  required = false,
  helpText = null,
  className = ''
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-ftm-slate">
        {label}
        {required && <span className="text-ftm-red ml-1">*</span>}
      </label>
    )}
    {children}
    {helpText && (
      <p className="text-xs text-ftm-dim">{helpText}</p>
    )}
    {error && (
      <p className="text-sm text-ftm-red flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

export const Input = ({
  className = '',
  error = false,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = `
    block w-full rounded-md bg-ftm-night border border-white/[.16] text-ftm-ink placeholder-ftm-dim
    focus:border-ftm-red focus:ring-ftm-red transition-colors duration-200
    ${error ? 'border-ftm-red/60 focus:border-ftm-red focus:ring-ftm-red' : ''}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
  `;

  return (
    <div className="relative">
      {icon && iconPosition === 'left' && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-ftm-dim">{icon}</span>
        </div>
      )}
      <input className={`${baseClasses} ${className}`} {...props} />
      {icon && iconPosition === 'right' && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-ftm-dim">{icon}</span>
        </div>
      )}
    </div>
  );
};

// Toast
export const Toast = ({
  type = 'info',
  title,
  message,
  isVisible = false,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isShowing, setIsShowing] = useState(false);

  const types = {
    success: {
      bgColor: 'bg-ftm-card border-ftm-green/30',
      iconColor: 'text-ftm-green',
      titleColor: 'text-ftm-green',
      messageColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-ftm-card border-ftm-red/30',
      iconColor: 'text-ftm-red',
      titleColor: 'text-ftm-red',
      messageColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-ftm-card border-ftm-amber/30',
      iconColor: 'text-ftm-amber',
      titleColor: 'text-ftm-amber',
      messageColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    info: {
      bgColor: 'bg-ftm-card border-ftm-slate/30',
      iconColor: 'text-ftm-slate',
      titleColor: 'text-ftm-slate',
      messageColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsShowing(false);
          setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowing(false);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const typeConfig = types[type];

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-out
      ${isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        rounded-lg border p-4 shadow-lg backdrop-blur-sm
        ${typeConfig.bgColor}
      `}>
        <div className="flex">
          <div className={`flex-shrink-0 ${typeConfig.iconColor}`}>
            {typeConfig.icon}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${typeConfig.titleColor}`}>
                {title}
              </h3>
            )}
            {message && (
              <p className={`text-sm ${title ? 'mt-1' : ''} ${typeConfig.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ftm-red ${typeConfig.iconColor}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress bar
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'bg-ftm-red',
    success: 'bg-ftm-green',
    warning: 'bg-ftm-amber',
    danger: 'bg-ftm-red'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-ftm-mut mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Badge
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon = null,
  className = ''
}) => {
  const variants = {
    default: 'bg-ftm-slate/[.14] text-ftm-slate',
    secondary: 'bg-ftm-slate/[.14] text-ftm-slate',
    primary: 'bg-ftm-red/[.14] text-ftm-red',
    success: 'bg-ftm-green/[.14] text-ftm-green',
    warning: 'bg-ftm-amber/[.14] text-ftm-amber',
    danger: 'bg-ftm-red/[.14] text-ftm-red',
    info: 'bg-ftm-indigo/[.14] text-ftm-indigo'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

// Alert
export const Alert = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const types = {
    info: {
      bgColor: 'bg-ftm-slate/10 border-ftm-slate/30',
      iconColor: 'text-ftm-slate',
      textColor: 'text-ftm-slate',
      bodyColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-ftm-green/10 border-ftm-green/30',
      iconColor: 'text-ftm-green',
      textColor: 'text-ftm-green',
      bodyColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-ftm-amber/10 border-ftm-amber/30',
      iconColor: 'text-ftm-amber',
      textColor: 'text-ftm-amber',
      bodyColor: 'text-ftm-amberdim',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-ftm-red/10 border-ftm-red/30',
      iconColor: 'text-ftm-red',
      textColor: 'text-ftm-red',
      bodyColor: 'text-ftm-mut',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
  };

  if (!isVisible) return null;

  const typeConfig = types[type];

  return (
    <div className={`
      border rounded-lg p-4 transition-all duration-300
      ${typeConfig.bgColor} ${className}
    `}>
      <div className="flex">
        <div className={`flex-shrink-0 ${typeConfig.iconColor}`}>
          {typeConfig.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${typeConfig.textColor}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${title ? 'mt-2' : ''} ${typeConfig.bodyColor}`}>
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ftm-red ${typeConfig.iconColor}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Button loading states
export const LoadingButton = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-inter font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ftm-night transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-ftm-red text-white hover:bg-[#C51F35] focus:ring-ftm-red shadow-redglow",
    secondary: "bg-ftm-slate/[.14] text-ftm-slate hover:bg-ftm-slate/[.22] focus:ring-ftm-slate",
    success: "bg-ftm-green/[.14] text-ftm-green hover:bg-ftm-green/[.22] focus:ring-ftm-green",
    danger: "bg-ftm-red text-white hover:bg-[#C51F35] focus:ring-ftm-red"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};
