import { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { ApiError } from 'models/data/ApiError';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';

export class AmendHotelStoreTransfer {
    @observable alternativeHotelOffers: IAmendHotelOffer[] = [];
    @observable isLoading = false;
    @observable error: Nullable<ApiError> = null;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action
    fetchAlternativeTransfers = async (cancelSource?: CancelTokenSource): Promise<void | { error: ApiError }> => {
        const {
            amendHotelStore: { newlySelectedHotelOffer },
            viewBookingStore: { booking },
        } = this.rootStore;
        try {
            if (!booking || !newlySelectedHotelOffer) return;

            this.isLoading = true;
            this.error = null;

            const response = await bookingService.getAmendHotelTransfers(
                booking.bookingReference,
                newlySelectedHotelOffer,
                cancelSource,
            );

            runInAction(() => {
                this.alternativeHotelOffers = response.map(({ amendHotelOffer }) => amendHotelOffer);
            });
        } catch (e) {
            runInAction(() => {
                this.error = e;
            });

            return { error: e };
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    };

    @action dropStoreState = (): void => {
        this.alternativeHotelOffers = [];
        this.isLoading = false;
        this.error = null;
    };

    @action
    changeTransfer = (selectedTransfer: ITransferWithAmendmentCharges): void => {
        const altHotelOffer = this.alternativeHotelOffers.find(
            ({ transfers }) => transfers[0].code === selectedTransfer?.transfer.code,
        );

        this.rootStore.amendHotelStore.newlySelectedHotelOffer = altHotelOffer;
        this.rootStore.amendHotelStore.prevSelectedHotelOffer = altHotelOffer;
        this.alternativeHotelOffers = [];
    };

    @computed get alternativeTransfers(): ITransferWithAmendmentCharges[] {
        return this.alternativeHotelOffers
            .filter(({ amendmentChargesInfo }) => !!amendmentChargesInfo)
            .map(({ transfers, amendmentChargesInfo }) => ({
                transfer: transfers[0],
                amendmentCharges: getAmendmentRoundedPrice(
                    amendmentChargesInfo.amendmentCharges,
                    amendmentChargesInfo.amendmentCharges < 0,
                ),
            }));
    }

    @computed get selectedTransfer(): Nullable<ITransfer> {
        return this.rootStore.amendHotelStore.newlySelectedHotelOffer?.transfers[0];
    }
}
