// context/TestModeContext.js
import { createContext, useContext } from 'react';

const TestModeContext = createContext();

export function TestModeProvider({ children }) {
  // Simple implementations that just return current values
  const getCurrentTime = () => new Date();
  const getTimerSpeed = () => 1;  // Always return normal speed

  return (
    <TestModeContext.Provider value={{ getCurrentTime, getTimerSpeed }}>
      {children}
    </TestModeContext.Provider>
  );
}

export const useTestMode = () => useContext(TestModeContext);