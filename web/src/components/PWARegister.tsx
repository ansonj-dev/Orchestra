'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [iosInstallHelp, setIosInstallHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

    setInstalled(standalone);
    setOnline(navigator.onLine);
    setIosInstallHelp(isIOS && isSafari && !standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setIosInstallHelp(false);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
          console.error('Orchestra service worker registration failed:', error);
        });
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (document.readyState === 'complete') registerServiceWorker();
    else window.addEventListener('load', registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <>
      {!online && <div className="pwa-status" role="status">Offline mode · cached pages only</div>}
      {installPrompt && !installed && (
        <aside className="pwa-install" aria-label="Install Orchestra">
          <div className="pwa-install-copy">
            INSTALL ORCHESTRA
            <small>Keep your agent workspace one tap away.</small>
          </div>
          <button onClick={install}>Install</button>
          <button className="pwa-dismiss" aria-label="Dismiss install prompt" onClick={() => setInstallPrompt(null)}>×</button>
        </aside>
      )}
      {iosInstallHelp && !installed && (
        <aside className="pwa-install" aria-label="Add Orchestra to your Home Screen">
          <div className="pwa-install-copy">
            ADD TO HOME SCREEN
            <small>Tap Share in Safari, then choose “Add to Home Screen”.</small>
          </div>
          <button className="pwa-dismiss" aria-label="Dismiss install instructions" onClick={() => setIosInstallHelp(false)}>×</button>
        </aside>
      )}
    </>
  );
}
