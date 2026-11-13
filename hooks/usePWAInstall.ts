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
        const syncPrompt = () => {
            const globalPrompt = (window as any).__deferredPwaPrompt;
            if (globalPrompt) {
                setDeferredPrompt(globalPrompt);
                setIsInstallable(true);
            }
        };

        syncPrompt();

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
        window.addEventListener('pwa-prompt-ready', syncPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('pwa-prompt-ready', syncPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'already_installed' | 'unavailable'> => {
        let activePrompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null);

        // If prompt hasn't arrived yet (e.g. user tapped within 1s of opening page), ensure SW is registered and wait briefly
        if (!activePrompt && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' });
            } catch {}

            activePrompt = await new Promise<any>((resolve) => {
                if ((window as any).__deferredPwaPrompt) {
                    resolve((window as any).__deferredPwaPrompt);
                    return;
                }
                const timeout = setTimeout(() => {
                    window.removeEventListener('beforeinstallprompt', onPrompt);
                    resolve((window as any).__deferredPwaPrompt || null);
                }, 1400);
                function onPrompt(e: any) {
                    e.preventDefault();
                    clearTimeout(timeout);
                    (window as any).__deferredPwaPrompt = e;
                    window.removeEventListener('beforeinstallprompt', onPrompt);
                    resolve(e);
                }
                window.addEventListener('beforeinstallprompt', onPrompt);
            });
        }

        if (!activePrompt) {
            if (
                typeof window !== 'undefined' &&
                (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true)
            ) {
                return 'already_installed';
            }
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
