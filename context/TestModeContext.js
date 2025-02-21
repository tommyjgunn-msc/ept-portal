// context/TestModeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const TestModeContext = createContext();

const ProductionProvider = ({ children }) => (
  <TestModeContext.Provider value={{
    getCurrentTime: () => new Date(),
    getTimerSpeed: () => 1,
    isTestMode: false
  }}>
    {children}
  </TestModeContext.Provider>
);

const DevelopmentProvider = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTestMode = window?.localStorage?.getItem('testMode');
    if (savedTestMode) {
      setIsTestMode(savedTestMode === 'true');
    }
  }, []);

  const getCurrentTime = () => {
    if (!isTestMode) return new Date();
    let bookingDetails;
    try {
      bookingDetails = JSON.parse(window?.sessionStorage?.getItem('bookingDetails') || '{}');
    } catch (e) {
      return new Date();
    }
    if (!bookingDetails?.selectedDate) return new Date();
    const [, day, month] = bookingDetails.selectedDate.match(/(\d+)\s+(\w+)/);
    const testDate = new Date(`${month} ${day}, 2025 10:00:00`);
    return testDate;
  };

  const getTimerSpeed = () => 1;

  const toggleTestMode = () => {
    setIsTestMode(prev => !prev);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('testMode', (!isTestMode).toString());
    }
  };

  return (
    <>
      <TestModeContext.Provider value={{
        getCurrentTime,
        getTimerSpeed,
        isTestMode,
        toggleTestMode
      }}>
        {children}
      </TestModeContext.Provider>
      {isMounted && process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isTestMode}
              onChange={toggleTestMode}
              style={{
                width: '16px',
                height: '16px'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1a202c'
            }}>
              Test Mode {isTestMode ? 'ON' : 'OFF'}
            </span>
          </label>
          <p style={{
            fontSize: '12px',
            color: '#718096',
            margin: 0
          }}>
            Bypasses date/time restrictions
          </p>
        </div>
      )}
    </>
  );
};

export const TestModeProvider = process.env.NODE_ENV === 'development' 
  ? DevelopmentProvider 
  : ProductionProvider;

export const useTestMode = () => useContext(TestModeContext);