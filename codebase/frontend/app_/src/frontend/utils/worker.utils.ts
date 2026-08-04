export const isNotificationsSupported = (): boolean => {
    if (!('serviceWorker' in navigator)) {
        window?.console && console.error('Service Worker is not supported on this browser.');

        return false;
    }

    if (!('PushManager' in window)) {
        (window as Window & typeof globalThis).console && console.error('Push is not supported on this browser');

        return false;
    }

    return true;
};

export const isWorkerSupported = (): boolean => 'serviceWorker' in navigator;

export const registerServiceWorker = (swScriptUrl: string): Promise<ServiceWorkerRegistration> =>
    navigator.serviceWorker.register(swScriptUrl).then(reg => {
        const worker = reg.installing || reg.waiting || reg.active;

        // service worker is already activated
        if (worker?.state === 'activated') {
            return Promise.resolve(reg);
        }

        // error (should never happen)
        if (!worker) {
            return Promise.reject();
        }

        // wait for service worker to be activated
        return new Promise(fulfill => {
            const stateChangeListener = (ev: any) => {
                if (ev?.target?.state === 'activated') {
                    worker.removeEventListener('statechange', stateChangeListener);

                    return fulfill(reg);
                }
            };

            worker.addEventListener('statechange', stateChangeListener);
        });
    });

export const urlB64ToUint8Array = (base64String: string): BufferSource => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

export const checkIfSafari = (): boolean => 'safari' in window && 'pushNotification' in window.safari;
