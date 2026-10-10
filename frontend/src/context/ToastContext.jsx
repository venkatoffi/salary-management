import React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const notify = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.type}`} key={toast.id} role="status">
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
            <button className="icon-button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
