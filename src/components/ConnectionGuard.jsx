import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { NETWORK_READ_ERROR_EVENT } from '../lib/supabase';

export default function ConnectionGuard({ children }) {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    const handleReadError = () => setLoadFailed(true);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener(NETWORK_READ_ERROR_EVENT, handleReadError);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(NETWORK_READ_ERROR_EVENT, handleReadError);
    };
  }, []);

  const handleRetry = () => {
    setLoadFailed(false);
    setRetryKey((key) => key + 1);
  };

  const showWarning = isOffline || loadFailed;

  return (
    <>
      {showWarning && (
        <section role="alert" className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-28 text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-brand-brown text-brand-gold flex items-center justify-center">
              <WifiOff className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-brand-brown mb-3">Tidak ada koneksi</h1>
            <p className="text-brand-brown/60 leading-relaxed mb-6">
              Data belum bisa dimuat. Periksa internet Anda, lalu coba lagi.
            </p>
            {loadFailed || !isOffline ? (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isOffline}
                className="w-full min-h-12 px-4 bg-brand-brown text-white rounded-xl font-bold transition-colors hover:bg-brown-800 disabled:opacity-50"
              >
                {isOffline ? 'Menunggu koneksi...' : 'Coba Lagi'}
              </button>
            ) : (
              <p className="text-sm font-bold text-brand-brown/50">Menunggu koneksi...</p>
            )}
          </div>
        </section>
      )}
      <div key={retryKey} className={showWarning ? 'hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
