// components/LoadingStates.js — loading and error states.
//
// The rule here is that a loading state should be the shape of the thing that
// is coming, not a spinner in the middle of an empty page. A skeleton tells you
// a table is arriving and roughly how big; a spinner tells you nothing and
// makes the wait feel longer.
//
// Gone from this file: a gradient-filled circle with a spinner inside it and a
// pulsing ring around it, three bouncing dots, an indeterminate bar that
// pulsed, `animate-ping`, and every backdrop-blur. The one spinner that
// remains is inside buttons, where it marks a specific action in flight.

import { useState, useEffect } from 'react';

export const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  showText = false,
  text = 'Loading',
}) => {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-10 w-10' };
  const variantClasses = {
    primary: 'border-ftm-crimson',
    secondary: 'border-ftm-line2',
    white: 'border-white',
    success: 'border-ftm-green',
    warning: 'border-ftm-ochre',
    error: 'border-ftm-crimson',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status">
      <span
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-ftm-line ${variantClasses[variant]} border-t-transparent`}
        aria-hidden="true"
      />
      {showText && <p className="font-inter text-[13px] text-ftm-mut">{text}</p>}
    </div>
  );
};

export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`ftm-skeleton h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`border-t border-ftm-line2 pt-5 ${className}`} aria-hidden="true">
    <div className="ftm-skeleton h-5 w-40 mb-5" />
    <div className="space-y-2.5">
      <div className="ftm-skeleton h-4 w-full" />
      <div className="ftm-skeleton h-4 w-5/6" />
      <div className="ftm-skeleton h-4 w-4/6" />
    </div>
    <div className="mt-6 ftm-skeleton h-10 w-40" />
  </div>
);

// Matches the real table: a ruled header, then ruled rows.
export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={className} aria-hidden="true">
    <div className="flex gap-6 pb-2 border-b border-ftm-line2">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="ftm-skeleton h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-6 py-3.5 border-b border-ftm-line">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="ftm-skeleton h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Named stages, stated plainly, with a segmented rule for position.
export const ProgressiveLoader = ({
  stages = ['Starting', 'Loading', 'Nearly there'],
  currentStage = 0,
  className = '',
}) => {
  const [displayStage, setDisplayStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayStage(currentStage), 300);
    return () => clearTimeout(timer);
  }, [currentStage]);

  return (
    <div className={`max-w-[320px] ${className}`} role="status">
      <p className="font-inter font-semibold text-[15px] text-ftm-ink mb-3">
        {stages[displayStage] || stages[0]}
      </p>
      <div className="flex gap-1 mb-2" aria-hidden="true">
        {stages.map((stage, i) => (
          <div key={stage} className={`h-1 flex-1 ${i <= displayStage ? 'bg-ftm-crimson' : 'bg-ftm-up'}`} />
        ))}
      </div>
      <p className="font-inter text-[12px] text-ftm-mut">
        Step <span className="tabular-nums">{displayStage + 1}</span> of{' '}
        <span className="tabular-nums">{stages.length}</span>
      </p>
    </div>
  );
};

// The exam loading screen. It now shows the status band the section is about to
// have, so the layout does not jump when the content lands.
export const TestLoadingState = ({ testType = 'reading', className = '' }) => {
  const sectionName = testType.charAt(0).toUpperCase() + testType.slice(1);

  return (
    <div className={`min-h-screen bg-ftm-night ${className}`}>
      <header className="bg-ftm-bar border-b border-ftm-line2">
        <div className="max-w-shell mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-between gap-6 h-bar">
            <h1 className="font-grotesk font-bold text-[19px] text-ftm-ink">{sectionName}</h1>
            <div className="ftm-skeleton h-5 w-28" />
          </div>
        </div>
      </header>

      <main className="max-w-shell mx-auto px-6 sm:px-10 py-12" aria-busy="true" aria-label={`Loading the ${testType} section`}>
        <p className="font-inter text-[15px] text-ftm-mut mb-10">
          Loading your {testType} materials. Do not refresh.
        </p>
        <div className="ftm-skeleton h-6 w-72 mb-8" />
        <div className="space-y-3 max-w-measure mb-12">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`ftm-skeleton h-4 ${i === 5 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
        <SkeletonTable rows={3} columns={2} className="max-w-measure" />
      </main>
    </div>
  );
};

// Error state — GOV.UK pattern: a thick rule, a heading that says what failed,
// and the action. No icon medallion.
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Try again. If it keeps happening, tell the Writing Centre.',
  onRetry = null,
  className = '',
}) => (
  <div className={`min-h-[320px] flex items-center px-6 ${className}`}>
    <div className="w-full max-w-measure border-l-[6px] border-ftm-crimson pl-6 py-2" role="alert">
      <h3 className="font-grotesk font-bold text-[21px] text-ftm-ink mb-2">{title}</h3>
      <p className="font-inter text-[16px] leading-relaxed text-ftm-mut mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-inter font-bold text-[15px] text-white bg-ftm-crimson hover:bg-ftm-crimsondeep px-6 py-3 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

export const LoadingButton = ({
  children,
  isLoading = false,
  loadingText = 'Working',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = `inline-flex items-center justify-center gap-2 font-inter font-bold
    transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`;

  const variants = {
    primary: 'bg-ftm-crimson text-white hover:bg-ftm-crimsondeep',
    secondary: 'bg-ftm-up text-ftm-ink hover:bg-ftm-card border border-ftm-line',
    success: 'bg-ftm-greendeep text-white hover:brightness-110',
    danger: 'bg-ftm-crimson text-white hover:bg-ftm-crimsondeep',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[13px]',
    md: 'px-4 py-2.5 text-[14px]',
    lg: 'px-6 py-3.5 text-[15px]',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
};

export const PageTransition = ({ isLoading = false, children }) => (
  <div className="relative">
    {isLoading && (
      <div className="fixed inset-0 bg-ftm-night/90 z-50 flex items-center justify-center px-6">
        <ProgressiveLoader stages={['Loading', 'Preparing', 'Nearly there']} currentStage={1} />
      </div>
    )}
    {children}
  </div>
);

export const AppSkeleton = () => (
  <div className="min-h-screen bg-ftm-night">
    <div className="bg-ftm-bar border-b border-ftm-line">
      <div className="ftm-register" />
      <div className="max-w-shell mx-auto px-6 sm:px-10">
        <div className="flex justify-between items-center h-bar">
          <div className="ftm-skeleton h-5 w-32" />
          <div className="flex items-center gap-4">
            <div className="ftm-skeleton h-3.5 w-24" />
            <div className="ftm-skeleton h-9 w-9" />
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-shell mx-auto px-6 sm:px-10 py-12 space-y-10">
      <SkeletonCard />
      <SkeletonTable rows={3} />
    </div>
  </div>
);
