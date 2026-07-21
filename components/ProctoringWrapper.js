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
      
      {/* Start Test Prompt */}
      {showStartPrompt && !sessionStorage.getItem('maintain_fullscreen') && (
        <div className="fixed inset-0 bg-ftm-night/95 flex items-center justify-center z-50">
          <div className="bg-ftm-card border border-white/[.08] p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="font-grotesk text-2xl text-ftm-ink mb-4">Ready to Begin Your Test</h2>
            <p className="mb-4 text-ftm-slate">
              This test requires fullscreen mode and will monitor for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-ftm-slate">
              <li>Exiting fullscreen mode</li>
              <li>Switching to other applications</li>
              <li>Copy/paste attempts</li>
              <li>Use of multiple monitors</li>
            </ul>
            <p className="mb-6 text-ftm-red font-medium">
              Multiple violations will result in automatic test submission.
            </p>
            <button
              onClick={handleStartTest}
              className="w-full bg-ftm-red text-white py-3 px-4 rounded-md hover:bg-ftm-red/90 font-medium"
            >
              Enter Fullscreen & Start Test
            </button>
          </div>
        </div>
      )}

      {/* Warning Dialog */}
      {showWarning && (
        <div className="fixed inset-0 bg-ftm-red/95 flex items-center justify-center z-50">
          <div className="bg-ftm-card border border-white/[.08] p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="font-grotesk text-xl text-ftm-red mb-4">Warning</h2>
            <p className="mb-4 text-ftm-slate">{warningMessage}</p>

            {countdownToSubmit !== null && (
              <p className="font-bold text-2xl text-center my-4 text-ftm-red">
                Submitting in {countdownToSubmit} seconds
              </p>
            )}

            {!isFullscreen && (
              <button
                onClick={() => {
                  requestFullscreen();
                  setShowWarning(false);
                }}
                className="mt-4 w-full bg-ftm-red text-white py-2 px-4 rounded-md hover:bg-ftm-red/90"
              >
                Return to Fullscreen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Indicator - only show after start prompt */}
      {!showStartPrompt && (
        <div className="fixed top-0 right-0 p-2 bg-ftm-card border-l border-b border-white/[.08] rounded-bl-lg shadow z-40 text-xs flex items-center text-ftm-slate">
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isFullscreen ? 'bg-ftm-green' : 'bg-ftm-red'}`}></span>
          <span>{isFullscreen ? 'Secure Mode' : 'Insecure'}</span>
        </div>
      )}

      {/* Watermark Overlay - only show when proctoring is active */}
      {isProctoringActive && (
        <div
          className="fixed inset-0 pointer-events-none z-30 opacity-[.04] flex items-center justify-center"
          style={{ transform: 'rotate(-45deg)' }}
        >
          <div className="text-6xl font-bold text-white whitespace-nowrap">
            EPT TEST - SECURE MODE
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="test-content">
        {children}
      </div>
    </div>
  );
}