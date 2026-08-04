import { useEffect } from 'react';
import { useRouter } from 'next/router';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getChatbotViewBookingEventParams } from 'frontend/utils/tracking/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export const useChatbotTracking = (booking: Nullable<IBookingInfo>, enabled = true): void => {
    const { removeFromDataLayer, fireChatbotViewBookingEvent } = useStore((stores: TStores) => ({
        ...(isHolidayStore(stores) && {
            removeFromDataLayer: stores.trackingStore.removeFromDataLayer,
            fireChatbotViewBookingEvent: stores.trackingStore.fireChatbotViewBookingEvent,
        }),
    }));

    const router = useRouter();

    useEffect(() => {
        if (enabled && booking) {
            // We provide Booking data for the Travel Companion Chatbot (CET-55) using GTM dataLayer
            fireChatbotViewBookingEvent?.(getChatbotViewBookingEventParams(booking));
        }
    }, [enabled, booking, fireChatbotViewBookingEvent]);

    // We should remove Booking data from the dataLayer after user leaves View Booking page to prevent leaks of personal data
    useEffect(() => {
        if (!enabled) return;

        const removeChatbotBookingDataFromDataLayer = (): void => {
            removeFromDataLayer?.(EventTypes.ChatbotViewBooking);
        };

        router.events.on('routeChangeStart', removeChatbotBookingDataFromDataLayer);

        return () => router.events.off('routeChangeStart', removeChatbotBookingDataFromDataLayer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
};
