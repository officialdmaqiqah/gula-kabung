import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);
  const cancelRef = useRef(null);

  const confirmAction = useCallback((options) => new Promise((resolve) => {
    resolveRef.current = resolve;
    setDialog(options);
  }), []);

  const close = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    cancelRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialog, close]);

  const isWarning = dialog?.tone === 'warning';
  const Icon = isWarning ? AlertTriangle : Trash2;

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {dialog && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isWarning ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-lg font-black text-brand-brown">{dialog.title}</h2>
                <p id="confirm-description" className="text-sm text-brand-brown/60 mt-1">{dialog.description}</p>
              </div>
            </div>

            {dialog.details?.length > 0 && (
              <dl className="mt-5 bg-brand-brown/[0.03] border border-brand-brown/5 rounded-2xl p-4 space-y-2">
                {dialog.details.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-brand-brown/50 shrink-0">{label}</dt>
                    <dd className="font-bold text-brand-brown text-right break-words min-w-0">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex gap-3 mt-6">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="flex-1 py-3 bg-brand-brown/5 text-brand-brown rounded-xl font-bold hover:bg-brand-brown/10 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors ${isWarning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {dialog.confirmLabel || 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}
