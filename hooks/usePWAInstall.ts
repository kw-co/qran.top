import { useState, useEffect, useCallback } from 'react';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
        return typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt || null : null;
    });
    const [isInstallable, setIsInstallable] = useState<boolean>(() => {
        return typeof window !== 'undefined' && !!(window as any).__deferredPwaPrompt;
    });
    const [isInstalled, setIsInstalled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        );
    });

    useEffect(() => {
        // Check again in case __deferredPwaPrompt was set right before mount
        if ((window as any).__deferredPwaPrompt && !deferredPrompt) {
            setDeferredPrompt((window as any).__deferredPwaPrompt);
            setIsInstallable(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            (window as any).__deferredPwaPrompt = e;
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            (window as any).__deferredPwaPrompt = null;
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [deferredPrompt]);

    const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
        const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null);
        if (!activePrompt) {
            return 'unavailable';
        }
        try {
            await activePrompt.prompt();
            const { outcome } = await activePrompt.userChoice;
            if (outcome === 'accepted') {
                (window as any).__deferredPwaPrompt = null;
                setDeferredPrompt(null);
                setIsInstallable(false);
                setIsInstalled(true);
                return 'accepted';
            }
            return 'dismissed';
        } catch {
            return 'unavailable';
        }
    }, [deferredPrompt]);

    return { isInstallable, isInstalled, promptInstall };
};
