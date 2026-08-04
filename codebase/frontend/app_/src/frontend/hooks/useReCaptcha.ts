import { useEffect } from 'react';

import { IHolidaysStores } from 'frontend/store/holidays';
import isBackend from 'frontend/utils/isBackend';

import useStore from './useStore';

/**
 * Hook for loading reCAPTCHA script on mount (or if enabled flag is true) and removing it on unmount
 * @param enabled - flag to enable load recaptcha
 * @returns executeReCaptcha - promise that returns reCaptcha token
 */

export default function useReCaptcha(enabled = true, overrideDefault = false): Promise<any> {
    const { loadReCaptcha, removeReCaptcha, executeReCaptcha } = useStore((stores: IHolidaysStores) => ({
        loadReCaptcha: stores.reCaptchaStore.loadReCaptcha,
        removeReCaptcha: stores.reCaptchaStore.removeReCaptcha,
        executeReCaptcha: stores.reCaptchaStore.executeReCaptcha,
    }));

    useEffect(() => {
        if (!isBackend || !enabled) return;

        const isLoaded = loadReCaptcha(overrideDefault);

        return () => {
            /** Remove recaptcha only if it was loaded in current component. */
            isLoaded && removeReCaptcha();
        };
    }, [enabled]);

    // FIXME: remove any
    return executeReCaptcha as any;
}
