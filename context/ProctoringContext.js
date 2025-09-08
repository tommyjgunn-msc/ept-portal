// context/ProctoringContext.js
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
  
  // Refs to track cleanup state
  const cleanupRef = useRef({ isCleanedUp: false });
  const eventListenersRef = useRef(new Set());
  const timersRef = useRef(new Set());
  
  const maxWarnings = 3;
  const MAX_FOCUS_EVENTS = 100; // Prevent unlimited memory growth

  // Cleanup function to remove all event listeners and timers
  const cleanup = useCallback(() => {
    if (cleanupRef.current.isCleanedUp) return;
    
    cleanupRef.current.isCleanedUp = true;
    
    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    
    // Remove all event listeners
    eventListenersRef.current.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    eventListenersRef.current.clear();
    
    // Exit fullscreen if active
    if (isFullscreen && typeof document !== 'undefined') {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (e) {
        console.warn('Failed to exit fullscreen during cleanup:', e);
      }
    }
  }, [isFullscreen]);

  // Helper to register event listener with cleanup tracking
  const addEventListenerWithCleanup = useCallback((element, event, handler, options) => {
    if (cleanupRef.current.isCleanedUp) return;
    
    element.addEventListener(event, handler, options);
    eventListenersRef.current.add({ element, event, handler });
  }, []);

  // Helper to add timer with cleanup tracking
  const addTimerWithCleanup = useCallback((callback, delay) => {
    if (cleanupRef.current.isCleanedUp) return null;
    
    const timer = setTimeout(callback, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  // Initialize proctoring state
  useEffect(() => {
    setIsProctoringActive(isActive);
    return cleanup;
  }, [isActive, cleanup]);

  // Monitor screen changes (debounced)
  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof window === 'undefined') return;

    let debounceTimer = null;
    
    const checkMonitors = () => {
      if (cleanupRef.current.isCleanedUp) return;
      
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = addTimerWithCleanup(() => {
        if (window.screen && window.screen.availWidth) {
          const isMultipleMonitors = 
            window.screen.availWidth > 2560 || 
            window.outerWidth < window.screen.availWidth * 0.95;
          
          setMultipleMonitorsDetected(prev => {
            if (prev !== isMultipleMonitors) {
              if (isMultipleMonitors) {
                setWarnings(prev => ({ ...prev, multipleMonitors: true }));
              }
              return isMultipleMonitors;
            }
            return prev;
          });
        }
      }, 300);
    };

    checkMonitors();
    addEventListenerWithCleanup(window, 'resize', checkMonitors);
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isProctoringActive, hasStartedTest, addEventListenerWithCleanup, addTimerWithCleanup]);

  // Fullscreen management
  const requestFullscreen = useCallback(() => {
    if (typeof document === 'undefined' || cleanupRef.current.isCleanedUp) return;

    const docEl = document.documentElement;

    try {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Failed to request fullscreen:', e);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (typeof document === 'undefined' || cleanupRef.current.isCleanedUp) return;

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (e) {
      console.warn('Failed to exit fullscreen:', e);
    }
  }, []);

  // Fullscreen change monitoring
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      if (cleanupRef.current.isCleanedUp) return;
      
      const isDocFullscreen = 
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement;
      
      const newFullscreenState = !!isDocFullscreen;
      
      setIsFullscreen(prev => {
        if (prev !== newFullscreenState) {
          // Only log warning if proctoring is active, has started the test, and exiting fullscreen
          if (!newFullscreenState && isProctoringActive && hasStartedTest) {
            const timestamp = new Date().toISOString();
            
            setFocusEvents(prev => {
              const newEvents = [...prev, { type: 'fullscreen_exit', timestamp }];
              // Limit array size to prevent memory leaks
              return newEvents.slice(-MAX_FOCUS_EVENTS);
            });
            
            setWarnings(prev => ({
              ...prev,
              fullscreen: prev.fullscreen + 1
            }));
          }
          return newFullscreenState;
        }
        return prev;
      });
    };

    // Register all fullscreen event listeners
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => {
      addEventListenerWithCleanup(document, event, handleFullscreenChange);
    });
  }, [isProctoringActive, hasStartedTest, addEventListenerWithCleanup]);

  // Visibility change monitoring (debounced)
  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof document === 'undefined') return;

    let debounceTimer = null;
    
    const handleVisibilityChange = () => {
      if (cleanupRef.current.isCleanedUp) return;
      
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = addTimerWithCleanup(() => {
        const timestamp = new Date().toISOString();
        const isHidden = document.visibilityState === 'hidden';
        
        setFocusEvents(prev => {
          const newEvents = [...prev, { 
            type: isHidden ? 'blur' : 'focus', 
            timestamp 
          }];
          return newEvents.slice(-MAX_FOCUS_EVENTS);
        });
        
        if (isHidden) {
          setWarnings(prev => ({
            ...prev,
            windowFocus: prev.windowFocus + 1
          }));
        }
      }, 100);
    };

    addEventListenerWithCleanup(document, 'visibilitychange', handleVisibilityChange);
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [isProctoringActive, hasStartedTest, addEventListenerWithCleanup, addTimerWithCleanup]);

  // Copy-paste and keyboard monitoring (optimized)
  useEffect(() => {
    if (!isProctoringActive || !hasStartedTest || typeof document === 'undefined') return;

    const preventCopyPaste = (e) => {
      if (cleanupRef.current.isCleanedUp) return;
      
      e.preventDefault();
      const timestamp = new Date().toISOString();
      
      setFocusEvents(prev => {
        const newEvents = [...prev, { type: 'copy_paste', action: e.type, timestamp }];
        return newEvents.slice(-MAX_FOCUS_EVENTS);
      });
      
      setWarnings(prev => ({
        ...prev,
        copyPaste: prev.copyPaste + 1
      }));
      return false;
    };

    const preventContextMenu = (e) => {
      if (cleanupRef.current.isCleanedUp) return;
      
      e.preventDefault();
      const timestamp = new Date().toISOString();
      
      setFocusEvents(prev => {
        const newEvents = [...prev, { type: 'right_click', timestamp }];
        return newEvents.slice(-MAX_FOCUS_EVENTS);
      });
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      if (cleanupRef.current.isCleanedUp) return;
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (
        (modifier && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen' || 
        e.key === 'F12'
      ) {
        e.preventDefault();
        const timestamp = new Date().toISOString();
        
        setFocusEvents(prev => {
          const newEvents = [...prev, { 
            type: 'keyboard_shortcut', 
            key: e.key,
            modifier: modifier ? (isMac ? 'meta' : 'ctrl') : 'none',
            timestamp 
          }];
          return newEvents.slice(-MAX_FOCUS_EVENTS);
        });
        
        setWarnings(prev => ({
          ...prev,
          copyPaste: prev.copyPaste + 1
        }));
        return false;
      }
    };

    // Register prevention events
    const events = [
      { type: 'copy', handler: preventCopyPaste },
      { type: 'paste', handler: preventCopyPaste },
      { type: 'cut', handler: preventCopyPaste },
      { type: 'contextmenu', handler: preventContextMenu },
      { type: 'keydown', handler: preventKeyboardShortcuts }
    ];

    events.forEach(({ type, handler }) => {
      addEventListenerWithCleanup(document, type, handler);
    });
  }, [isProctoringActive, hasStartedTest, addEventListenerWithCleanup]);

  // Memoized callbacks to prevent unnecessary re-renders
  const shouldForceSubmit = useCallback(() => {
    return (
      warnings.fullscreen >= maxWarnings ||
      warnings.windowFocus >= maxWarnings ||
      warnings.copyPaste >= maxWarnings
    );
  }, [warnings, maxWarnings]);

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
      cleanupRef.current.isCleanedUp = false;
    } else {
      setHasStartedTest(false);
      cleanup();
    }
  }, [clearWarnings, cleanup]);

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
      focusEvents: focusEvents.slice(-50), // Only return recent events to reduce payload
      multipleMonitorsDetected,
      hasStartedTest,
      shouldForceSubmit: shouldForceSubmit(),
      timestamp: new Date().toISOString()
    };
  }, [warnings, focusEvents, multipleMonitorsDetected, hasStartedTest, shouldForceSubmit]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <ProctoringContext.Provider value={contextValue}>
      {children}
    </ProctoringContext.Provider>
  );
}

export const useProctoring = () => useContext(ProctoringContext);
