import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';

export const usePriceJumpPopupTracking = (): {
    trackAppear: (priceDelta: number) => void;
    trackInteraction: (priceDelta: number, isAccepted?: boolean) => void;
} => {
    const {
        trackAmendHotelPriceJumpPopupAppearEvent,
        trackAmendHotelPriceJumpPopupInteractionEvent,
        isAmendHotelSummaryPage,
    } = useStore(({ layoutStore, trackingStore }: IHolidaysStores) => ({
        isAmendHotelSummaryPage: layoutStore.isAmendHotelSummaryPage,
        trackAmendHotelPriceJumpPopupAppearEvent: trackingStore.changeHotel.priceJumpPopupAppearEvent,
        trackAmendHotelPriceJumpPopupInteractionEvent: trackingStore.changeHotel.priceJumpPopupInteractionEvent,
    }));

    if (isAmendHotelSummaryPage) {
        return {
            trackInteraction: trackAmendHotelPriceJumpPopupInteractionEvent,
            trackAppear: trackAmendHotelPriceJumpPopupAppearEvent,
        };
    }

    return {
        trackInteraction: (): void => {},
        trackAppear: (): void => {},
    };
};
