import { createContext, useContext, useState } from 'react';
import { Toast } from '../components/UIDesignSystem';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Toasts stack downward instead of piling up at the same fixed coordinates.
  // Two at once used to render exactly on top of each other, so the second
  // message hid the first — which mattered most when both were errors.
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              stacked
              isVisible={true}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
