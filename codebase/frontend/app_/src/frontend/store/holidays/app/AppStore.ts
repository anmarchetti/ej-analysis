import { action, makeObservable } from 'mobx';

import BaseAppStore from 'frontend/store/base/app/BaseAppStore';
import { TRootStore } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { getWebStorageItem, removeWebStorageItem } from 'frontend/utils/webStorage.utils';

class AppStore extends BaseAppStore {
    constructor(public rootStore: TRootStore) {
        super();

        if (!isBackend()) {
            this.checkPayloadsFromStorage();
        }

        makeObservable(this);
    }

    @action checkPayloadsFromStorage = (): void => {
        const {
            isAmendTransfersPage,
            isAmendFlightsPage,
            isViewBookingPage,
            isAmendDatesSummaryPage,
            isAmendDatesPage,
            isAmendRoomAndBoardPage,
            isAmendHotelSummaryPage,
        } = this.rootStore.layoutStore;

        const amendBookingPayload = getWebStorageItem('amend-booking-payload', true, sessionStorage);

        if (!amendBookingPayload) {
            return;
        }

        const isAmendDatesFlow = isAmendDatesPage || isAmendDatesSummaryPage;
        const isAmendTransferPayload = isAmendTransfersPage && amendBookingPayload.isFromAmendTransfer;
        const isAmendFlightsPayload = isAmendFlightsPage && amendBookingPayload.isFromAmendFlight;
        const isAmendSeatsPayload = isViewBookingPage && amendBookingPayload.isFromAmendSeats;
        const isAmendDatesPayload = isAmendDatesFlow && amendBookingPayload.amendDatesOffer;
        const isAmendRoomAndBoardPayload = isAmendRoomAndBoardPage && amendBookingPayload.amendRoomAndBoardOffer;
        const isAmendHotelPayload = isAmendHotelSummaryPage && amendBookingPayload.amendHotelOffer;

        const isPayloadInitiatedByEntity =
            isAmendTransferPayload ||
            isAmendFlightsPayload ||
            isAmendSeatsPayload ||
            isAmendDatesPayload ||
            isAmendRoomAndBoardPayload ||
            isAmendHotelPayload;
        const isPayloadInitiatedByBookingData =
            amendBookingPayload?.bookingReference && amendBookingPayload?.date && amendBookingPayload?.lastName;

        if (isPayloadInitiatedByBookingData && isPayloadInitiatedByEntity) {
            this.setAmendBookingItemPayload(amendBookingPayload);
        }

        removeWebStorageItem('amend-booking-payload', sessionStorage);
    };
}

export default AppStore;
