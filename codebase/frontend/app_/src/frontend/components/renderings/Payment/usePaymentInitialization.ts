import { useEffect, useState } from 'react';

import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { usePaymentTracking } from './trackingHooks/usePaymentTracking';

export const usePaymentInitialization = (initialize: (isCreditShown?: boolean) => Promise<void>): void => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const init = async () => {
            await initialize();
            setIsInitialized(true);
        };
        init();

        return () => {
            sessionStorage.removeItem(WebStorageKeys.PrevPage);
        };
    }, []);

    usePaymentTracking(isInitialized);
};
