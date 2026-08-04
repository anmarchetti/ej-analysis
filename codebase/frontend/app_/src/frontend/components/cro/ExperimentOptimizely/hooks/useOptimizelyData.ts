import { useEffect, useState } from 'react';

import settings from 'code/settings';
import { getCookie, listenCookieChange } from 'frontend/utils/cookies.utils';
import { TOptimizelyData } from 'frontend/components/cro/ExperimentOptimizely/models';

const INTERVAL_TIME = 100;
const INTERVAL_TIME_COOKIE = 1000;

const useOptimizelyData = (): Nullable<TOptimizelyData> => {
    const [optimizelyData, setOptimizelyData] = useState<Nullable<TOptimizelyData>>(null);
    const [isPersonalizationEnabled, setPersonalizationEnabled] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const personalizationCookieValue = getCookie(settings.Cookies.Personalization);

        if (personalizationCookieValue) {
            if (personalizationCookieValue === '1') {
                // There is a delay between accepting the cookie and receiving data from Optimizely.
                // Waits for Optimizely data layer to be declared
                const intervalId = setInterval(() => {
                    if (window['optimizely']?.get) {
                        setOptimizelyData(window['optimizely']);
                        clearInterval(intervalId);
                    }
                }, INTERVAL_TIME);

                return () => {
                    clearInterval(intervalId);
                };
            }

            return;
        }

        //waits for Personalization cookie to be accepted or Rejected
        const clearIntervalCallback = listenCookieChange(
            settings.Cookies.Personalization,
            () => {
                setPersonalizationEnabled(getCookie(settings.Cookies.Personalization) === '1');
            },
            INTERVAL_TIME_COOKIE,
        );

        return clearIntervalCallback;
    }, [isPersonalizationEnabled]);

    return optimizelyData;
};

export default useOptimizelyData;
