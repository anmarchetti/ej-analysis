import { action, makeObservable, observable, runInAction } from 'mobx';

import { AirportParkingService } from 'frontend/services/externalExtras/airportParking/airportParking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { QueryParamName } from 'models/enum/QueryParamName';

export class AirportParkingStore {
    @observable airportParkings: IAirportParking[] | null = null;
    @observable isAirportParkingsInitialized: boolean = false;
    @observable selectedAirportParking: IAirportParking | null = null;
    @observable selectedAirportParkingDetails: IAirportParking | null = null;
    @observable isParkingPopupOpened: boolean = false;
    @observable isParkingDetailsPopupOpened: boolean = false;
    @observable isSelectedParkingUnavailableError: boolean = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action initializeAirportParkings = (
        selectedOffer: IOfferWithoutAltBoards,
        trackError: (errMessage: string) => void,
    ): void => {
        this.fetchAirportParkings(selectedOffer, trackError);
        this.isAirportParkingsInitialized = true;
    };

    @action fetchAirportParkings = async (
        selectedOffer: IOfferWithoutAltBoards | null | undefined,
        trackError: (errMessage: string) => void,
    ): Promise<void> => {
        try {
            this.rootStore.appStore.setNavigationBooking(true);

            if (!selectedOffer) {
                this.setAirportParkings(null);

                return;
            }

            const airportParkings = await AirportParkingService.getAirportParkings(selectedOffer);

            runInAction(() => {
                this.setAirportParkings(airportParkings);
            });
        } catch (e) {
            runInAction(() => {
                console.error(e);
                this.setAirportParkings(null);
                trackError(e?.message);
            });
        } finally {
            runInAction(() => {
                this.rootStore.appStore.setNavigationBooking(false);
            });
        }
    };

    @action setAirportParkings = (value: IAirportParking[] | null): void => {
        this.airportParkings = value;
    };

    @action setSelectedAirportParking = (value: IAirportParking | null): void => {
        this.selectedAirportParking = value;
    };

    @action setSelectedAirportParkingDetails = (value: IAirportParking | null): void => {
        this.selectedAirportParkingDetails = value;
    };

    @action toggleIsParkingPopupOpened = (): void => {
        this.isParkingPopupOpened = !this.isParkingPopupOpened;
    };

    @action toggleIsParkingDetailsPopupOpened = (): void => {
        this.isParkingDetailsPopupOpened = !this.isParkingDetailsPopupOpened;
    };

    @action validateParking = async (
        itemToValidate: IAirportParking | null,
        onSuccessAction: () => void,
    ): Promise<void> => {
        const { validatePackage, togglePriceManipulating } = this.rootStore.bookingStore;
        const { updateCurrentPage } = this.rootStore.routerStore;
        const { buildHotelDetailsQuery } = this.rootStore.queryParamsStore;

        const onSuccess = (): void => {
            if (itemToValidate) {
                this.toggleIsParkingPopupOpened();
            }

            updateCurrentPage(buildHotelDetailsQuery());
            onSuccessAction();
        };

        const onError = (): void => {
            this.clearSelectedAirportParkingAndUpdateUrl();
        };

        this.setSelectedAirportParking(itemToValidate);

        togglePriceManipulating(true);
        await validatePackage(undefined, undefined, undefined, onSuccess, onError);
    };

    @action setIsSelectedParkingUnavailableError = (state: boolean): void => {
        this.isSelectedParkingUnavailableError = state;
    };

    @action clearAirportParking = (): void => {
        this.clearSelectedAirportParkingAndUpdateUrl();
        this.setAirportParkings(null);
        this.isAirportParkingsInitialized = false;
    };

    // use this func to update airport parking not only in airportParkingStore, but in QueryParamsStore too
    @action clearSelectedAirportParkingAndUpdateUrl = async (): Promise<void> => {
        const { parkingCodeFromUrl, buildHotelDetailsQuery } = this.rootStore.queryParamsStore;

        this.setSelectedAirportParking(null);

        if (parkingCodeFromUrl) {
            const newQuery = buildHotelDetailsQuery(undefined, {
                [QueryParamName.AirportParkingCode]: '',
            });

            await this.rootStore.routerStore.updateCurrentPage(newQuery, true);
        }
    };
}
