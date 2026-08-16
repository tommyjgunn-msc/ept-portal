// components/ProctoringWrapper.js
import { useEffect, useState } from 'react';
import { useProctoring } from '../context/ProctoringContext';

export default function ProctoringWrapper({ children, onForcedSubmit }) {
  const { 
    isProctoringActive, 
    isFullscreen, 
    warnings, 
    multipleMonitorsDetected,
    shouldForceSubmit,
    requestFullscreen,
    toggleProctoring,
    clearWarnings
  } = useProctoring();

  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [countdownToSubmit, setCountdownToSubmit] = useState(null);

  // Store fullscreen state when unmounting
  useEffect(() => {
    return () => {
      // Store the fullscreen state in sessionStorage to maintain it across component rerenders
      if (isFullscreen) {
        sessionStorage.setItem('maintain_fullscreen', 'true');
      }
      clearWarnings();
      
      // Don't call toggleProctoring(false) here as it would exit fullscreen
      // We'll let the test-portal component handle this when appropriate
    };
  }, [isFullscreen, clearWarnings]);

  // Restore fullscreen state when mounting
  useEffect(() => {
    // Check if we need to maintain fullscreen from a previous test
    const shouldMaintainFullscreen = sessionStorage.getItem('maintain_fullscreen') === 'true';
    
    if (shouldMaintainFullscreen && !isFullscreen) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        requestFullscreen();
        toggleProctoring(true);
        setShowStartPrompt(false);
        sessionStorage.removeItem('maintain_fullscreen');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, requestFullscreen, toggleProctoring]);

  useEffect(() => {
    if (isProctoringActive && !isFullscreen && !showStartPrompt) {
      setWarningMessage('Please return to fullscreen mode to continue the test.');
      setShowWarning(true);
      
      const timer = setTimeout(() => {
        requestFullscreen();
        setShowWarning(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      if (isFullscreen && showWarning && warningMessage.includes('fullscreen')) {
        setShowWarning(false);
      }
    }
  }, [isProctoringActive, isFullscreen, requestFullscreen, showStartPrompt, showWarning, warningMessage]);

  useEffect(() => {
    if (shouldForceSubmit()) {
      setWarningMessage('Due to multiple suspicious activities, your test will be submitted automatically.');
      setShowWarning(true);
      setCountdownToSubmit(10);
    } else if (multipleMonitorsDetected) {
      setWarningMessage('Multiple monitors detected. Please disconnect additional monitors before continuing.');
      setShowWarning(true);
    }
    
    return () => {
      setShowWarning(false);
      setCountdownToSubmit(null);
    };
  }, [warnings, multipleMonitorsDetected, shouldForceSubmit]);

  useEffect(() => {
    if (countdownToSubmit === null) return;
    
    if (countdownToSubmit <= 0) {
      if (onForcedSubmit) {
        onForcedSubmit();
        setCountdownToSubmit(null);
        setShowWarning(false);
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdownToSubmit(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdownToSubmit, onForcedSubmit]);

  const handleStartTest = () => {
    requestFullscreen();
    toggleProctoring(true);
    setShowStartPrompt(false);
  };

  return (
    <div className="proctoring-wrapper">
      {/* Anti-copy CSS */}
      <style jsx global>{`
        body {
          user-select: ${isProctoringActive ? 'none' : 'auto'};
        }
        .test-content * {
          user-select: ${isProctoringActive ? 'none' : 'auto'};
        }
      `}</style>
      
      {/* Start prompt. The old copy said the test "will monitor for … use of
          multiple monitors" as though that were a settled fact; the detector is
          a width heuristic. Say what is actually recorded, and link the page
          that lists all of it. */}
      {showStartPrompt && !sessionStorage.getItem('maintain_fullscreen') && (
        <div className="fixed inset-0 bg-ftm-night flex items-center justify-center z-50 px-6">
          <div className="w-full max-w-measure border-t-2 border-ftm-crimson pt-6">
            <h2 className="font-grotesk font-bold text-[28px] text-ftm-ink mb-4">
              This section is proctored
            </h2>
            <p className="font-inter text-[16px] leading-relaxed text-ftm-mut mb-4">
              It runs in fullscreen. While it is open the portal records:
            </p>
            <ul className="list-none p-0 m-0 border-t border-ftm-line2 mb-6">
              {[
                'Leaving fullscreen.',
                'Switching to another tab or application.',
                'Attempts to copy, cut or paste, which are also blocked.',
                'A guess at whether a second screen is attached.',
              ].map((item) => (
                <li key={item} className="font-inter text-[15px] text-ftm-mut py-2.5 border-b border-ftm-line">
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-inter text-[15px] leading-relaxed text-ftm-mut mb-8">
              Three of any one of these submits the section automatically. There is no camera and
              no screen recording.{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="text-ftm-ink underline underline-offset-4 hover:text-ftm-ochre transition-colors">
                What the exam records
              </a>
              .
            </p>
            <button
              onClick={handleStartTest}
              className="font-inter font-bold text-[16px] text-white bg-ftm-crimson hover:bg-ftm-crimsondeep px-7 py-3.5 transition-colors"
            >
              Enter fullscreen and begin
            </button>
          </div>
        </div>
      )}

      {/* Warning. Was a full-screen crimson wash — the single most alarming
          thing the product could do to someone mid-exam, for something as
          ordinary as a dropped fullscreen. Now a plain panel on the page
          ground; the severity is in the words. */}
      {showWarning && (
        <div className="fixed inset-0 bg-ftm-night/95 flex items-center justify-center z-50 px-6" role="alertdialog" aria-label="Proctoring warning">
          <div className="w-full max-w-measure border-l-[6px] border-ftm-crimson bg-ftm-card px-6 py-6">
            <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink mb-3">
              {countdownToSubmit !== null ? 'This section is about to be submitted' : 'Return to fullscreen'}
            </h2>
            <p className="font-inter text-[16px] leading-relaxed text-ftm-mut">{warningMessage}</p>

            {countdownToSubmit !== null && (
              <p className="font-grotesk font-bold text-[34px] text-ftm-ochre tabular-nums my-5" aria-live="assertive">
                {countdownToSubmit}s
              </p>
            )}

            {!isFullscreen && (
              <button
                onClick={() => {
                  requestFullscreen();
                  setShowWarning(false);
                }}
                className="mt-6 font-inter font-bold text-[15px] text-white bg-ftm-crimson hover:bg-ftm-crimsondeep px-6 py-3 transition-colors"
              >
                Return to fullscreen
              </button>
            )}
          </div>
        </div>
      )}

      {/* The fullscreen indicator used to be a chip pinned to the top-right
          corner of the viewport, floating over the exam's own status band and
          colliding with the timer on narrower screens. It now lives inside
          that band (see TestPortalComponent) — one bar, fixed positions.

          The diagonal "EPT TEST - SECURE MODE" watermark is also gone. It
          deterred nobody (a screenshot at 4% opacity is trivially readable),
          and it sat over the passage a candidate had to read. */}
      
      {/* Main Content */}
      <div className="test-content">
        {children}
      </div>
    </div>
  );
}