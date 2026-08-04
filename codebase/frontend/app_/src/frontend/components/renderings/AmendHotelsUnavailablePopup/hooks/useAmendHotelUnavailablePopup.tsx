import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';

export const useAmendHotelUnavailablePopup = (): {
    isLoading: boolean;
    isShown: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
} => {
    const {
        setIsNoAvailabilityError,
        isNoAvailabilityError,
        onAmendDatesButtonClick,
        isInitialDatesLoading,
        isAmendPaymentPage,
        isAmendHotelSummaryPage,
        redirectToAmendHotelPage,
        isRedirectionLoading,
        isAmendHotelPage,
    } = useStore((stores: IHolidaysStores) => ({
        onAmendDatesButtonClick: stores.amendDatesStore.onAmendDatesButtonClick,
        isInitialDatesLoading: stores.amendDatesStore.isInitialDataLoading,
        isNoAvailabilityError: stores.amendHotelStore.isNoAvailabilityError,
        setIsNoAvailabilityError: stores.amendHotelStore.setIsNoAvailabilityError,
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
        isAmendHotelSummaryPage: stores.layoutStore.isAmendHotelSummaryPage,
        isAmendHotelPage: stores.layoutStore.isAmendHotelPage,
        redirectToAmendHotelPage: stores.routerStore.redirectToAmendHotelPage,
        isRedirectionLoading: stores.routerStore.isRedirectionLoading,
    }));

    const onClose = (): void => {
        setIsNoAvailabilityError(false);
    };

    const onConfirm = async (): Promise<void> => {
        if (!isAmendHotelPage) {
            const isEdgePage = isAmendPaymentPage || isAmendHotelSummaryPage;
            const handler = isEdgePage ? redirectToAmendHotelPage : onAmendDatesButtonClick;

            await handler();
        }

        onClose();
    };

    return {
        onClose,
        onConfirm,
        isLoading: isRedirectionLoading || isInitialDatesLoading,
        isShown: isNoAvailabilityError,
    };
};
