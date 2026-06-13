import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Afficher après 3s de navigation
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show || installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setShow(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 text-white font-black text-lg">
          E
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text">Installer Elengi</p>
          <p className="text-xs text-text-3 mt-0.5">
            Installez l'app pour un accès rapide depuis votre bureau
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Installer
          </button>
        </div>
        <button onClick={() => setShow(false)} className="text-text-3 shrink-0 active:opacity-60">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
