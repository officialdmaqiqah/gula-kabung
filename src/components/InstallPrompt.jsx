import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'gula_kabung_install_dismissed_at';
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
const STORE_PATHS = ['/', '/catalog', '/about', '/education'];

let deferredPrompt = null;
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener(deferredPrompt));

window.addEventListener('beforeinstallprompt', (event) => {
  if (window.location.pathname.startsWith('/admin')) return;
  event.preventDefault();
  deferredPrompt = event;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

const wasDismissed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS;
  } catch {
    return false;
  }
};

const saveDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Banner tetap bisa ditutup untuk kunjungan ini.
  }
};

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallPrompt() {
  const { pathname } = useLocation();
  const [installEvent, setInstallEvent] = useState(deferredPrompt);
  const [dismissed, setDismissed] = useState(wasDismissed);

  useEffect(() => {
    listeners.add(setInstallEvent);
    setInstallEvent(deferredPrompt);
    return () => listeners.delete(setInstallEvent);
  }, []);

  const showIosHelp = !installEvent && isIos();
  if (!STORE_PATHS.includes(pathname) || dismissed || isInstalled() || (!installEvent && !showIosHelp)) {
    return null;
  }

  const handleDismiss = () => {
    saveDismissed();
    setDismissed(true);
  };

  const handleInstall = async () => {
    const event = installEvent;
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferredPrompt = null;
    notify();
    if (outcome === 'dismissed') handleDismiss();
  };

  return (
    <aside
      aria-label="Pasang aplikasi"
      className="md:hidden fixed left-4 right-4 z-40 bg-white border border-brand-brown/10 rounded-2xl shadow-2xl p-4"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1 pr-6">
          <h2 className="text-sm font-black text-brand-brown">Pasang aplikasi Gula Kabung</h2>
          {showIosHelp ? (
            <p className="text-xs text-brand-brown/70 mt-1 leading-relaxed">
              Ketuk <Share className="inline w-3.5 h-3.5 mx-0.5 align-text-bottom" aria-label="Bagikan" /> lalu pilih <strong>Tambah ke Layar Utama</strong>.
            </p>
          ) : (
            <p className="text-xs text-brand-brown/70 mt-1">Buka toko lebih cepat dari layar HP.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown rounded-xl"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {!showIosHelp && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full min-h-11 bg-brand-brown text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brown-800 transition-colors"
        >
          <Download className="w-4 h-4" /> Pasang
        </button>
      )}
    </aside>
  );
}
