import { action, makeObservable } from 'mobx';

import BaseSeatMapStore from 'frontend/store/base/seatMap/BaseSeatMapStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getSelectedSeatsFromWidgetData } from 'frontend/utils/seatMap.utils';
import { getSelectedSeatsQueryParams } from 'frontend/utils/url.utils';
import { ApiError } from 'models/data/ApiError';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { AMEND_SEATS_UNAVAILABLE_API_ERRORS, ApiErrors } from 'models/enum/ApiErrors';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export class TradePortalSeatMapStore extends BaseSeatMapStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    @action onSelectSeats = async (
        widgetData: ISelectedSeat[],
        callback: () => void | undefined,
        onError: (e: any) => void | undefined,
    ): Promise<void> => {
        // lock screen with overlay
        this.setIsProcessingSeatSelection(true);
        const widgetSeats = getSelectedSeatsFromWidgetData(widgetData, this.rootStore.layoutStore.isViewBookingPage);
        const widgetSeatsQuery = getSelectedSeatsQueryParams(widgetSeats);
        const currentSeatsQuery = getSelectedSeatsQueryParams(this.validatedSelectedSeats);

        if (JSON.stringify(currentSeatsQuery) === JSON.stringify(widgetSeatsQuery)) {
            callback?.();
            this.setIsProcessingSeatSelection(false);

            return;
        }

        const { updateCurrentPage } = this.rootStore.routerStore;
        const { buildHotelDetailsQuery } = this.rootStore.queryParamsStore;
        const { validatePackage, togglePriceManipulating } = this.rootStore.bookingStore;

        togglePriceManipulating(true);
        this.setValidatedSelectedSeats(widgetSeats);

        if (this.rootStore.layoutStore.isViewBookingPage) {
            const onSuccess = (): void => {
                callback?.();
                this.rootStore.viewBookingStore.continueToPay();
            };

            const handleError = (e: ApiError): void => {
                if (AMEND_SEATS_UNAVAILABLE_API_ERRORS.includes(e.errorCode as ApiErrors)) {
                    this.setIsSelectedSeatsUnavailableError(true);
                } else {
                    this.rootStore.viewBookingStore.toggleAmendErrorPopup(true);
                }

                onError(e);
            };

            await this.rootStore.amendSeatsStore.confirmAmendment(this.validatedSelectedSeats, onSuccess, handleError);
        } else {
            const onSuccess = (): void => {
                updateCurrentPage(buildHotelDetailsQuery());
                callback?.();
                this.rootStore.trackingStore.trackBookingExtrasUpdate(EventTypes.ExtrasSeatUpdate);
            };

            await validatePackage(undefined, undefined, undefined, onSuccess, onError);
        }

        this.setIsProcessingSeatSelection(false);
    };
}
