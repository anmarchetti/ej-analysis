import { useCallback, useEffect } from 'react';

import { envPublic } from 'code/env';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getCookie } from 'frontend/utils/cookies.utils';
import {
    IFullPaymentTrackingData,
    IPaymentGAParams,
    IPaymentTrackingData,
    IPaymentTrackingEvent,
    PaymentTrackingEventType,
} from 'models/data/IPaymentInfo';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { sendTrackingEvent } from 'frontend/components/renderings/Payment/Payment.utils';

interface IParamsType {
    apiSecret?: string;
    clientId?: string;
    measurementId?: string;
    params?: IFullPaymentTrackingData;
}

const RANDOM_NUMBER = 1000000000;
const RANDOM_NUMBER_MAX = 9999999999;

export const buildParams = async (
    getTrackPaymentData: () => Promise<IPaymentTrackingData>,
    referralUrl: string,
): Promise<IParamsType> => {
    const performanceCookies = getCookie(CookiesKeys.EjPersonalisationCookie);

    if (performanceCookies === '1') {
        const measurementId = envPublic.GA_MEASUREMENT_ID ?? '';
        const marketingCookies = getCookie(CookiesKeys.EjMarketingCookie);
        let clientId =
            Math.floor(Math.random() * RANDOM_NUMBER_MAX) +
            RANDOM_NUMBER +
            '.' +
            (Math.floor(Math.random() * RANDOM_NUMBER_MAX) + RANDOM_NUMBER);

        if (getCookie('_ga') !== '') {
            clientId = getCookie('_ga').split('.')[2] + '.' + getCookie('_ga').split('.')[3];
        }

        //function for page_location parameter
        function whiteListParams() {
            const params = [
                'gclid',
                'dclid',
                'utm_source',
                'utm_medium',
                'utm_campaign',
                'utm_content',
                'utm_term',
                'utm_id',
            ];
            const search = document.location.search;
            let acceptedqps = '';
            let param, // parameter to add in loop
                qps, //list of all query parameters
                iop, //index of parameter start
                ioe, //index of end of parameter
                i, //for loop
                acceptedqp,
                newURL;

            if (search) {
                qps = '&' + search.replace('?', '') + '&';
                for (i = 0; i < params.length; i++) {
                    param = params[i];
                    iop = qps.indexOf('&' + param + '=');

                    if (iop > -1) {
                        ioe = qps.indexOf('&', iop + 1);
                        acceptedqp = qps.slice(iop, ioe);
                        acceptedqps = acceptedqps.concat(acceptedqp);
                    }
                }
                newURL =
                    document.location.protocol +
                    '//' +
                    document.location.hostname +
                    document.location.pathname +
                    '?' +
                    acceptedqps.slice(1) +
                    document.location.hash;

                if (acceptedqps != '') {
                    return newURL;
                }
            }

            return (
                document.location.protocol +
                '//' +
                document.location.hostname +
                document.location.pathname +
                document.location.hash
            );
        }

        const params = {
            ...(await getTrackPaymentData()),
            session_id: getSessionId(measurementId),
            timestamp: Date.now(),
            user_agent: window.navigator.userAgent,
            page_location: whiteListParams(),
            page_referral_url: document.referrer || referralUrl, //the URL of the previous page
            page_url: window.location.href,
            consent_config: '1' + '|' + performanceCookies + '|' + marketingCookies,
        };

        return { params, clientId };
    }

    return {};
};

const getSessionId = (measurementId: string): string => {
    const cookieValue = getCookie('_ga_' + measurementId.split('-')[1]);

    if (cookieValue.indexOf('$') > -1) {
        return cookieValue.split('.s')[1].split('$')[0];
    }

    return cookieValue.split('.')[2];
};

/**
 * Handles the preparation and sending of payment tracking events.
 *
 * This function retrieves necessary tracking data via `getTrackPaymentData`, constructs the tracking
 * event parameters, and sends the tracking event using the `sendTrackingEvent` function. The function
 * handles two types of events: a default `PageView` event and a more generic event if additional parameters
 * (`eventParams`) are provided.
 *
 * @param {() => Promise<IPaymentTrackingData>} getTrackPaymentData - Function that returns a promise resolving to payment tracking data.
 * @param {IPaymentGAParams} [eventParams] - Optional additional parameters to be merged into the tracking event.
 */

const request = async (
    getTrackPaymentData: () => Promise<IPaymentTrackingData>,
    referralUrl: string,
    eventParams?: IPaymentGAParams,
) => {
    if (!getTrackPaymentData) return;

    const { params, clientId } = await buildParams(getTrackPaymentData, referralUrl);

    if (!params || !clientId) return;

    let eventName = PaymentTrackingEventType.PageView;
    let mergedParams = { ...params };

    if (eventParams) {
        eventName = PaymentTrackingEventType.PageGenericEvent;
        mergedParams = {
            ...params,
            ...eventParams,
            ...(eventParams.event_currency && { currency: eventParams.event_currency }),
            event_category: params.page_title?.split('|')[0],
        };
    }

    if ('event_currency' in mergedParams) {
        delete mergedParams.event_currency;
    }

    const eventList: IPaymentTrackingEvent[] = [
        {
            name: eventName,
            params: mergedParams,
        },
    ];

    sendTrackingEvent(clientId, eventList);
};

const usePaymentLanding = (
    isInitialized: boolean,
    referralUrl: string,
    getTrackPaymentData: () => Promise<IPaymentTrackingData>,
) => {
    useEffect(() => {
        if (isInitialized) {
            request(getTrackPaymentData, referralUrl);
        }
    }, [isInitialized, referralUrl, getTrackPaymentData]);
};

export const usePaymentTracking = (
    isInitialized: boolean = false,
): { pushTrackingEvent: (event: IPaymentGAParams) => any } => {
    const { getTrackPaymentData, referralUrl } = useStore((stores: IHolidaysStores) => ({
        getTrackPaymentData: stores.trackingStore.getTrackPaymentData,
        referralUrl: stores.routerStore.referralUrl,
    }));

    const referralUrlParam = referralUrl || '';

    usePaymentLanding(isInitialized, referralUrlParam, getTrackPaymentData);

    const pushTrackingEvent = useCallback(
        (eventParams: IPaymentGAParams) => {
            request(getTrackPaymentData, referralUrlParam, eventParams);
        },
        [getTrackPaymentData, referralUrlParam],
    );

    return {
        pushTrackingEvent,
    };
};

export const usePaymentPriceJumpTracking = (): { trackPaymentPriceJump: (event: IPaymentGAParams) => void } => {
    const { getTrackPaymentData, referralUrl } = useStore((stores: IHolidaysStores) => ({
        getTrackPaymentData: stores.trackingStore.getTrackPaymentData,
        referralUrl: stores.routerStore.referralUrl,
    }));

    const referralUrlParam = referralUrl ?? '';

    const trackPaymentPriceJump = useCallback(
        (eventParams: IPaymentGAParams) => {
            request(getTrackPaymentData, referralUrlParam, eventParams);
        },
        [getTrackPaymentData, referralUrlParam],
    );

    return {
        trackPaymentPriceJump,
    };
};
