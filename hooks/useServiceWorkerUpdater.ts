import { useEffect, useCallback } from 'react';

export const useServiceWorkerUpdater = () => {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js', { scope: './' })
                .then(() => console.log('Service Worker registered successfully.'))
                .catch(error => console.warn('Service Worker registration failed:', error));
        }
    }, []);

    const handleUpdate = useCallback(() => {
        window.location.reload();
    }, []);

    return { showUpdateNotification: false, handleUpdate };
};
