// context/ProctoringContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProctoringContext = createContext();

export function ProctoringProvider({ children, isActive = false }) {
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState({ 
    fullscreen: 0, 
    windowFocus: 0, 
    copyPaste: 0,
    multipleMonitors: false 
  });
  const [multipleMonitorsDetected, setMultipleMonitorsDetected] = useState(false);
  const [focusEvents, setFocusEvents] = useState([]);
  const [hasStartedTest, setHasStartedTest] = useState(false);
  const maxWarnings = 3;

  useEffect(() => {
    setIsProctoringActive(isActive);
    
    return () => {
      if (isFullscreen) {
        exitFullscreen();
      }
      clearWarnings();
    };
  }, [isActive]);

  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof window === 'undefined') return;

    const checkMonitors = () => {
      if (window.screen && window.screen.availWidth) {
        const isMultipleMonitors = 
          window.screen.availWidth > 2560 || 
          window.outerWidth < window.screen.availWidth * 0.95;
        
        setMultipleMonitorsDetected(isMultipleMonitors);
        
        if (isMultipleMonitors) {
          setWarnings(prev => ({ ...prev, multipleMonitors: true }));
        }
      }
    };

    checkMonitors();
    window.addEventListener('resize', checkMonitors);
    
    return () => {
      window.removeEventListener('resize', checkMonitors);
    };
  }, [isProctoringActive, hasStartedTest]);

  const requestFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;

    const docEl = document.documentElement;

    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      const isDocFullscreen = 
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement;
      
      setIsFullscreen(!!isDocFullscreen);
      
      // Only log warning if proctoring is active, has started the test, and exiting fullscreen
      if (!isDocFullscreen && isProctoringActive && hasStartedTest) {
        const timestamp = new Date().toISOString();
        setFocusEvents(prev => [...prev, { type: 'fullscreen_exit', timestamp }]);
        
        setWarnings(prev => ({
          ...prev,
          fullscreen: prev.fullscreen + 1
        }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isProctoringActive, hasStartedTest]);

  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timestamp = new Date().toISOString();
        setFocusEvents(prev => [...prev, { type: 'blur', timestamp }]);
        
        setWarnings(prev => ({
          ...prev,
          windowFocus: prev.windowFocus + 1
        }));
      } else if (document.visibilityState === 'visible') {
        const timestamp = new Date().toISOString();
        setFocusEvents(prev => [...prev, { type: 'focus', timestamp }]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isProctoringActive, hasStartedTest]);

  // Copy-paste prevention
  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof window === 'undefined') return;

    const preventCopyPaste = (e) => {
      e.preventDefault();
      const timestamp = new Date().toISOString();
      setFocusEvents(prev => [...prev, { type: 'copy_paste', action: e.type, timestamp }]);
      
      setWarnings(prev => ({
        ...prev,
        copyPaste: prev.copyPaste + 1
      }));
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      const timestamp = new Date().toISOString();
      setFocusEvents(prev => [...prev, { type: 'right_click', timestamp }]);
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      // Detect common keyboard shortcuts for copy/paste/print/etc.
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (
        (modifier && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen' || 
        e.key === 'F12'
      ) {
        e.preventDefault();
        const timestamp = new Date().toISOString();
        setFocusEvents(prev => [...prev, { 
          type: 'keyboard_shortcut', 
          key: e.key,
          modifier: modifier ? (isMac ? 'meta' : 'ctrl') : 'none',
          timestamp 
        }]);
        
        setWarnings(prev => ({
          ...prev,
          copyPaste: prev.copyPaste + 1
        }));
        return false;
      }
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    
    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [isProctoringActive, hasStartedTest]);

  // Check if we should force submit
  const shouldForceSubmit = useCallback(() => {
    return (
      warnings.fullscreen >= maxWarnings ||
      warnings.windowFocus >= maxWarnings ||
      warnings.copyPaste >= maxWarnings
    );
  }, [warnings, maxWarnings]);

  // Clear all warnings
  const clearWarnings = useCallback(() => {
    setWarnings({ 
      fullscreen: 0, 
      windowFocus: 0, 
      copyPaste: 0,
      multipleMonitors: false 
    });
    setFocusEvents([]);
  }, []);

  const toggleProctoring = useCallback((active) => {
    setIsProctoringActive(active);
    
    if (active) {
      clearWarnings();
      setHasStartedTest(true);
    } else {
      setHasStartedTest(false);
    }
  }, [clearWarnings]);

  const startProctoringCheck = useCallback(() => {
    setHasStartedTest(true);
  }, []);

  const stopProctoringCheck = useCallback(() => {
    setHasStartedTest(false);
    clearWarnings();
  }, [clearWarnings]);

  const getProctoringData = useCallback(() => {
    return {
      warnings,
      focusEvents,
      multipleMonitorsDetected,
      hasStartedTest,
      shouldForceSubmit: shouldForceSubmit(),
      timestamp: new Date().toISOString()
    };
  }, [warnings, focusEvents, multipleMonitorsDetected, hasStartedTest, shouldForceSubmit]);

  return (
    <ProctoringContext.Provider
      value={{
        isProctoringActive,
        isFullscreen,
        warnings,
        multipleMonitorsDetected,
        focusEvents,
        hasStartedTest,
        requestFullscreen,
        exitFullscreen,
        toggleProctoring,
        getProctoringData,
        shouldForceSubmit,
        clearWarnings,
        startProctoringCheck,
        stopProctoringCheck
      }}
    >
      {children}
    </ProctoringContext.Provider>
  );
}

export const useProctoring = () => useContext(ProctoringContext);