// components/LoadingStates.js - V4 Enhanced Loading System

import { useState, useEffect } from 'react';

// Base Loading Spinner with variants
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  showText = false,
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const variantClasses = {
    primary: 'border-ftm-red',
    secondary: 'border-white/[.24]',
    white: 'border-white',
    success: 'border-ftm-green',
    warning: 'border-ftm-amber',
    error: 'border-ftm-red'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        animate-spin rounded-full border-2 border-white/[.08] 
        ${variantClasses[variant]}
        border-t-transparent
      `} />
      {showText && (
        <p className="mt-2 text-sm text-ftm-mut animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Skeleton components for different content types
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`h-4 bg-white/10 rounded animate-pulse ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`} 
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-ftm-card p-6 rounded-lg shadow-sm border border-white/[.08] ${className}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-4 bg-white/10 rounded w-4/6"></div>
      </div>
      <div className="mt-6 flex space-x-4">
        <div className="h-8 bg-white/10 rounded w-20"></div>
        <div className="h-8 bg-white/10 rounded w-24"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-ftm-card rounded-lg shadow-sm border border-white/[.08] overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-white/[.08]">
      <div className="animate-pulse flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded flex-1"></div>
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="animate-pulse flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-white/10 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Progressive Loading with stages
export const ProgressiveLoader = ({ 
  stages = ['Initializing...', 'Loading content...', 'Almost ready...'],
  currentStage = 0,
  className = ''
}) => {
  const [displayStage, setDisplayStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayStage(currentStage);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentStage]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <div className="relative">
        <LoadingSpinner size="lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-ftm-red rounded-full animate-ping opacity-20"></div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-ftm-ink mb-2">
          {stages[displayStage] || stages[0]}
        </p>
        
        {/* Progress indicator */}
        <div className="w-64 bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className="h-2 bg-ftm-red rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((displayStage + 1) / stages.length) * 100}%` }}
          />
        </div>
        
        <p className="text-sm text-ftm-mut mt-2">
          Step {displayStage + 1} of {stages.length}
        </p>
      </div>
    </div>
  );
};

// Test-specific loading states
export const TestLoadingState = ({ testType = 'reading', className = '' }) => (
  <div className={`min-h-screen bg-ftm-night flex items-center justify-center ${className}`}>
    <div className="bg-ftm-card rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-ftm-red to-[#C51F35] rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-ftm-red/30 rounded-full animate-pulse mx-auto"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-ftm-ink mb-2">
          Preparing {testType.charAt(0).toUpperCase() + testType.slice(1)} Test
        </h2>
        
        <p className="text-ftm-mut mb-6">
          Please wait while we load your test materials...
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ftm-mut">Loading questions</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-ftm-red rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-ftm-red rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-ftm-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 bg-ftm-red rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Error state with retry functionality
export const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry = null,
  className = ''
}) => (
  <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
    <div className="text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-ftm-red/[.14] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-ftm-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-ftm-ink mb-2">{title}</h3>
      <p className="text-ftm-mut mb-6">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-ftm-red text-white rounded-lg hover:bg-[#C51F35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ftm-red transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  </div>
);

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
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-ftm-red text-white hover:bg-[#C51F35] focus:ring-ftm-red",
    secondary: "bg-white/10 text-ftm-ink hover:bg-white/[.14] focus:ring-ftm-slate",
    success: "bg-ftm-green text-white hover:bg-[#3D9A6C] focus:ring-ftm-green",
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
          <LoadingSpinner size="sm" variant="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Page transition loading
export const PageTransition = ({ isLoading = false, children }) => (
  <div className="relative">
    {isLoading && (
      <div className="fixed inset-0 bg-ftm-card/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-ftm-card rounded-lg shadow-lg p-6">
          <ProgressiveLoader 
            stages={['Loading page...', 'Preparing content...', 'Almost ready...']}
            currentStage={1}
          />
        </div>
      </div>
    )}
    {children}
  </div>
);

// Full page skeleton for initial app load
export const AppSkeleton = () => (
  <div className="min-h-screen bg-ftm-night">
    {/* Navigation skeleton */}
    <div className="bg-ftm-card shadow-sm border-b border-white/[.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Main content skeleton */}
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonTable rows={3} />
        </div>
      </div>
    </div>
  </div>
);
