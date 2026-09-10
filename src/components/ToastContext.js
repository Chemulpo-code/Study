import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (message) => console.log('Toast:', message) };
  }
  return context;
}
