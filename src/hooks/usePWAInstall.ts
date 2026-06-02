import { useEffect, useState } from 'react';

// El navegador dispara `beforeinstallprompt` una sola vez y temprano, así que lo
// capturamos a nivel de módulo (al cargar el bundle) y no dentro de un componente
// que podría montarse tarde y perdérselo. Los hooks que lo consumen se suscriben
// vía listeners para enterarse de cambios.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari expone `navigator.standalone`.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// iOS no soporta `beforeinstallprompt`: la instalación es manual vía "Compartir →
// Agregar a inicio". Detectamos el dispositivo para mostrar esas instrucciones.
function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ se reporta como Mac; lo distinguimos por la pantalla táctil.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

export function usePWAInstall() {
  const [installable, setInstallable] = useState(!!deferredPrompt);
  const [done, setDone] = useState(installed || isStandalone());

  useEffect(() => {
    const update = () => {
      setInstallable(!!deferredPrompt);
      setDone(installed || isStandalone());
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      // El prompt solo puede usarse una vez; lo descartamos pase lo que pase.
      deferredPrompt = null;
      notify();
    }
  };

  return { installable, installed: done, isIOS: detectIOS(), promptInstall };
}
