// components/UIDesignSystem.js - V4 Enhanced UI Components

import { useState, useEffect, useRef } from 'react';

// Enhanced Card Components with micro-interactions
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
    bg-white rounded-xl border border-gray-200 transition-all duration-300 ease-out
    ${elevations[elevation]}
    ${hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
    ${clickable ? 'cursor-pointer hover:shadow-xl' : ''}
    ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
  `;

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Enhanced Button System
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
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-lg',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 shadow-lg',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500 shadow-lg',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    transition-all duration-200 transform hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
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

// Enhanced Modal Component
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
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        <div 
          ref={modalRef}
          className={`
            relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl 
            transform transition-all duration-300 sm:my-8 sm:align-middle w-full
            ${sizes[size]} ${className}
            ${isOpen ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-4 opacity-0 sm:scale-95'}
          `}
        >
          {/* Header */}
          {title && (
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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

// Enhanced Form Components
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
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {helpText && (
      <p className="text-xs text-gray-500">{helpText}</p>
    )}
    {error && (
      <p className="text-sm text-red-600 flex items-center">
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
    block w-full rounded-lg border-gray-300 shadow-sm 
    focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
  `;

  return (
    <div className="relative">
      {icon && iconPosition === 'left' && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">{icon}</span>
        </div>
      )}
      <input className={`${baseClasses} ${className}`} {...props} />
      {icon && iconPosition === 'right' && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-400">{icon}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Toast Notification System
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
      bgColor: 'bg-green-50 border-green-200',
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50 border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    info: {
      bgColor: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
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
              className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${typeConfig.iconColor}`}
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

// Enhanced Progress Components
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
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Enhanced Badge Component
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  icon = null,
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
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

// Enhanced Alert Component
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
      bgColor: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-green-50 border-green-200',
      iconColor: 'text-green-400',
      textColor: 'text-green-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50 border-red-200',
      iconColor: 'text-red-400',
      textColor: 'text-red-800',
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
          <div className={`text-sm ${title ? 'mt-2' : ''} ${typeConfig.textColor}`}>
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${typeConfig.iconColor}`}
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
