import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    IObservablePromise,
    observableFromPromise,
} from 'frontend/utils/observerablePromise/observerablePromise.utils';
import { ApiError } from 'models/data/ApiError';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { ISelectedSeat } from 'models/data/ISeatMapStore';

import { clearSeatSelectionFromOffer } from './AmendDatesStore.utils';

class AmendDatesSeats {
    @observable fetchSeatMapsRequest: Nullable<IObservablePromise<void>> = null;
    @observable isSeatMapShown = false;
    @observable isSeatNoLongerAvailable = false;
    @observable hasSeatsPriceChanged = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action checkForSeatsAvailability = (): void => {
        const { offerWithPrices, booking } = this.rootStore.amendDatesStore;

        if (!booking || this.isDisabledBySitecore) return;

        this.rootStore.flightsPassengersStore.setPassengersStore({
            ...booking,
            seatSelection: offerWithPrices?.offer.seatSelection,
        });
        this.fetchSeatMapsRequest = observableFromPromise(() =>
            this.rootStore.seatMapStore.fetchSeatMap(
                offerWithPrices?.offer.transport.routes || [],
                offerWithPrices?.offer.accom.prom,
            ),
        );
    };

    @action clearStore = (): void => {
        this.rootStore.seatMapStore.isSeatMapFailed = false;
        this.setIsSeatNoLongerAvailable(false);
        this.setIsSeatMapShown(false);
    };

    @action handleSelectSeats = async (
        seatSelection: ISelectedSeat[],
        handleError: (e: ApiError) => void,
    ): Promise<void> => {
        try {
            const {
                amendDatesStore: { offerWithPrices, booking },
            } = this.rootStore;

            if (!offerWithPrices) return;

            const updatedOfferWithPrices = await bookingService.getAmendDatesValidatedOffer({
                ...offerWithPrices,
                offer: { ...offerWithPrices.offer, seatSelection },
            });

            if (updatedOfferWithPrices?.isSeatsUnavailable) {
                runInAction(() => {
                    this.setIsSeatNoLongerAvailable(true);
                    this.rootStore.seatMapStore.clearValidatedSeats();
                    window.SeatsMapWidget?.clearAllSeats();
                });

                return;
            }

            if (updatedOfferWithPrices?.isSeatsPriceChanged) {
                runInAction(() => {
                    this.setHasSeatsPriceChanged(true);
                    this.rootStore.seatMapStore.clearValidatedSeats();
                    window.SeatsMapWidget?.clearAllSeats();
                });

                return;
            }

            runInAction(() => {
                this.rootStore.amendDatesStore.offerWithPrices = updatedOfferWithPrices;

                if (booking) {
                    this.rootStore.flightsPassengersStore.setPassengersStore({
                        ...booking,
                        seatSelection: updatedOfferWithPrices.offer.seatSelection,
                    });
                }
            });
        } catch (e) {
            handleError(e);
        } finally {
            if (!this.isSeatNoLongerAvailable && !this.hasSeatsPriceChanged) {
                runInAction(() => {
                    this.setIsSeatMapShown(false);
                });
            }
        }
    };

    // Revalidate amend dates offer but without seats when user clicks continue without seats
    @action handleContinueWithoutSeats = async (): Promise<void> => {
        this.setIsSeatNoLongerAvailable(false);
        this.rootStore.amendPaymentStore.isLoadingData = true;

        const offerWithoutSeats = clearSeatSelectionFromOffer(this.rootStore.amendDatesStore.offerWithPrices);
        this.rootStore.amendDatesStore.offerWithPrices = offerWithoutSeats;
        this.rootStore.amendDatesStore.offerWithPrices = await bookingService.getAmendDatesValidatedOffer(
            offerWithoutSeats,
        );

        this.rootStore.amendPaymentStore.isLoadingData = false;
    };

    @action setIsSeatMapShown = (value: boolean): void => {
        this.isSeatMapShown = value;
    };

    @action setIsSeatNoLongerAvailable = (value: boolean): void => {
        this.isSeatNoLongerAvailable = value;
    };

    @action setHasSeatsPriceChanged = (value: boolean): void => {
        this.hasSeatsPriceChanged = value;
    };

    @computed get isDisabledBySitecore(): boolean {
        return !this.rootStore.amendDatesStore.offerWithPrices?.seatsChangeEnabled;
    }

    @computed get amendCTAState(): TAmendCTAState {
        const { amendDatesStore, seatMapStore } = this.rootStore;
        const isSeatReservationDisabled =
            !amendDatesStore?.offerWithPrices?.offer.seatSelection?.[0].isSeatReservationPossible;

        return {
            isVisible: !this.isDisabledBySitecore && !seatMapStore.isSeatMapFailed && !isSeatReservationDisabled,
            isDisabled: false,
        };
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }
}

export default AmendDatesSeats;
