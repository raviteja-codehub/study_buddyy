import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info as InfoIcon } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = 't_' + Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="sb-toast-container">
        {toasts.map((toast) => {
          const { id, message, type } = toast;
          const Icon =
            type === 'success'
              ? CheckCircle
              : type === 'error'
              ? AlertCircle
              : InfoIcon;

          return (
            <div key={id} className={`sb-toast sb-toast-${type} sb-fade-in`}>
              <Icon size={16} className="sb-toast-icon" />
              <span className="sb-toast-message">{message}</span>
              <button onClick={() => removeToast(id)} className="sb-toast-close" title="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
