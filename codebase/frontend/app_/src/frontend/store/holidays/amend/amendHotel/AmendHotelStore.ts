import Axios from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    IObservablePromise,
    observableFromPromise,
} from 'frontend/utils/observerablePromise/observerablePromise.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { IAmendHotelOffer, IAmendHotelOfferResponce } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendSelectedHotelDetails } from 'models/data/bookingAmendment/AmendSelectedHotelDetails';
import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import { TAmendHotelRestrictions } from 'models/data/IBookingInfo';
import { IFilters } from 'models/data/IFilters';
import { IHotel } from 'models/data/IHotel';
import { IOffersStatus } from 'models/data/IOffersStatus';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { LocalStorageType } from 'models/enum/LocalStorageType';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';

import { AmendHotelStoreFilters } from './AmendHotelStore.filters';
import { AmendHotelStoreTransfer } from './AmendHotelStore.transfer';

const INITIAL_PAGE_NUMBER = 1;

export class AmendHotelStore {
    @observable alternativeHotels: IAmendHotelOffer[] = [];
    @observable pageNumber = INITIAL_PAGE_NUMBER;
    @observable selectedSortingOption = AlternativeHotelsSortingOptions.TripAdvisor;
    @observable newlySelectedHotelOffer: Nullable<IAmendHotelOffer>;
    @observable prevSelectedHotelOffer: Nullable<IAmendHotelOffer>;
    @observable isLoadingSummaryPage = false;
    @observable selectedHotelDetails: Nullable<IAmendSelectedHotelDetails>;
    @observable offersStatus: Nullable<IOffersStatus> = null;
    @observable alternativeHotelsRequest: Nullable<IObservablePromise<IAmendHotelOfferResponce>>;

    @observable isNoAvailabilityError = false;

    transfer: AmendHotelStoreTransfer;
    filters: AmendHotelStoreFilters;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);

        this.transfer = new AmendHotelStoreTransfer(rootStore);
        this.filters = new AmendHotelStoreFilters(rootStore);
    }

    dropRequest = (): void => {
        if (this.alternativeHotelsRequest?.isPending) {
            this.alternativeHotelsRequest.cancel();
        }
    };

    fetchAlternativeHotels = async (): Promise<{
        amendHotelOffers: IAmendHotelOffer[];
        filters: IFilters[];
        status: IOffersStatus;
    } | void> => {
        try {
            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                this.rootStore.routerStore.redirectToViewBookingPage();

                return;
            }

            this.dropRequest();

            this.alternativeHotelsRequest = observableFromPromise(ct =>
                bookingService.getAlternativeAmendHotels(
                    booking.bookingReference,
                    {
                        sortingBy: this.selectedSortingOption,
                        facilities: this.filters.facilitiesFilters,
                        starRating: this.filters.starRatingFilters,
                        TripAdvisorRating: this.filters.tripAdvisorRatingFilters,
                        boardType: this.filters.boardTypeFilters,
                        priceFrom: this.filters.filterPriceFrom ?? undefined,
                        priceTo: this.filters.filterPriceTo ?? undefined,
                        packageTheme: this.filters.themeFilters,
                    },
                    this.pageNumber,
                    undefined,
                    ct.token,
                ),
            );

            return await this.alternativeHotelsRequest.originalPromise;
        } catch (e) {
            logger.error({ e });
        }
    };

    @action requsetHotels = async () => {
        const response = await this.fetchAlternativeHotels();

        if (!response) return;

        this.setOffersStatus(response.status);
        this.filters.saveFilters(response.filters);

        return response;
    };

    @action getInitialAlternativeHotels = async (
        onSuccess: (hotelOffers: IAmendHotelOffer[]) => void = () => {},
    ): Promise<void> => {
        this.setAlternativeHotels([]);
        this.setInitialPageNumber();

        const response = await this.requsetHotels();

        if (!response) return;

        this.setAlternativeHotels(response.amendHotelOffers);
        onSuccess(response.amendHotelOffers);
    };

    @action getNextPageOfHotels = async (): Promise<void> => {
        try {
            this.incrementPageNumber();

            const response = await this.requsetHotels();

            if (!response) return;

            this.setAlternativeHotels(this.alternativeHotels.concat(response.amendHotelOffers));
            this.rootStore.trackingStore.changeHotel.trackLoadMoreAmendHotelList(response.amendHotelOffers);
        } catch (e) {
            this.decrementPageNumber();
        }
    };

    @action onAmendHotelButtonClick = async (): Promise<void> => {
        try {
            this.filters.onClearAllSelectedFilters();
            await this.getInitialAlternativeHotels();

            if (this.alternativeHotels.length > 0) {
                this.rootStore.routerStore.redirectToAmendHotelPage();

                return;
            }

            this.setIsNoAvailabilityError(true);
        } catch (e) {
            this.setIsNoAvailabilityError(!Axios.isCancel(e));
        }
    };

    @action initializeHotelChangePage = async (
        onSuccess?: (amendHotels: IAmendHotelOffer[]) => void,
    ): Promise<void> => {
        try {
            if (!this.alternativeHotels.length) {
                await this.getInitialAlternativeHotels();
            }

            if (!this.alternativeHotels.length) {
                this.rootStore.routerStore.redirectToViewBookingPage();

                return;
            }

            onSuccess?.(this.alternativeHotels);
        } catch (e) {
            this.rootStore.routerStore.redirectToViewBookingPage();
        }
    };

    @action setOffersStatus = (status: Nullable<IOffersStatus>): void => {
        this.offersStatus = status;
    };

    @action clearStore = (): void => {
        this.setPrevSelectedHotelOffer(null);
        this.setIsNoAvailabilityError(false);
        this.clearHotelSearchResults();
        this.clearSelectedHotelDetails();
    };

    @action clearHotelSearchResults = (): void => {
        this.setAlternativeHotels([]);
        this.selectedSortingOption = AlternativeHotelsSortingOptions.TripAdvisor;
        this.setOffersStatus(null);
        this.setInitialPageNumber();
        this.filters.onClearAllSelectedFilters();
    };

    @action clearSelectedHotelDetails = (): void => {
        this.selectedHotelDetails = null;
    };

    @action selectNewHotel = async (hotelOffer: IAmendHotelOffer): Promise<void> => {
        try {
            this.setIsLoadingSummaryPage(true);
            const { booking } = this.rootStore.viewBookingStore;

            if (!booking) {
                this.rootStore.routerStore.redirectToViewBookingPage();

                return;
            }

            const { amendHotelOffer } = await bookingService.validateAlternativeAmendHotel(
                booking.bookingReference,
                hotelOffer,
            );

            runInAction(() => {
                this.setPrevSelectedHotelOffer(hotelOffer);
                this.setNewlySelectedHotelOffer(amendHotelOffer);
                this.rootStore.routerStore.redirectToAmendHotelSummaryPage();

                this.rootStore.trackingStore.changeHotel.updateInitialDataFromHotelOffer(amendHotelOffer);
            });
        } catch (e) {
            this.setIsNoAvailabilityError(true);
        } finally {
            this.setIsLoadingSummaryPage(false);
        }
    };

    @action confirmChosenHotel = (): void => {
        const { billingInfo } = this.rootStore.userStore;
        const baseUrl = this.rootStore.layoutStore.basePath + SitePath.AmendPayment;
        const separator = baseUrl.includes('?') ? '&' : '?';
        const ecpSuffix = this.rootStore.queryParamsStore.isFlightPlusHotelFunnel
            ? `${separator}${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`
            : '';

        const {
            trackingSecondaryProducts,
            initialOfferData: initialTrackOfferData,
            trackHotelConfirm,
        } = this.rootStore.trackingStore.changeHotel;

        trackHotelConfirm();

        submitForm(`${baseUrl}${ecpSuffix}`, SubmitPayload.AmendPaymentInfo, {
            ...getBookingPayload(this.rootStore.viewBookingStore.booking!),
            billingInfo,
            amendHotelOffer: this.newlySelectedHotelOffer,
            trackingData: {
                initialData: initialTrackOfferData,
                secondaryProducts: trackingSecondaryProducts,
            },
        });
    };

    @action initializeSummaryPage = async (): Promise<void> => {
        if (this.rootStore.appStore.amendBookingItemPayload) {
            await this.initializeSummaryPageFromPayload();
        }

        if (!this.rootStore.viewBookingStore.booking) {
            this.rootStore.routerStore.redirectToViewBookingPage();
        }
    };

    @action initializeSummaryPageFromPayload = async (): Promise<void> => {
        const {
            appStore: { amendBookingItemPayload, setAmendBookingItemPayload },
            viewBookingStore: { initBookingFromPayload },
        } = this.rootStore;

        await initBookingFromPayload(async booking => {
            if (!amendBookingItemPayload?.amendHotelOffer) {
                return;
            }

            try {
                const { amendHotelOffer } = await bookingService.validateAlternativeAmendHotel(
                    booking.bookingReference,
                    amendBookingItemPayload.amendHotelOffer,
                );

                runInAction(() => {
                    this.setPrevSelectedHotelOffer(amendBookingItemPayload.amendHotelOffer);
                    this.setNewlySelectedHotelOffer(amendHotelOffer);

                    this.rootStore.trackingStore.changeHotel.initializeFromPaymentPayload(
                        amendBookingItemPayload.trackingData,
                    );
                });
            } catch (e) {
                runInAction(() => {
                    this.setNewlySelectedHotelOffer(amendBookingItemPayload.amendHotelOffer);
                    this.setIsNoAvailabilityError(true);
                });
            }

            runInAction(() => {
                // Clear booking item payload here so it doesn't interfere with transfer or room and board amendments
                setAmendBookingItemPayload(undefined);
            });
        });
    };

    @action setIsNoAvailabilityError = (isNoAvailabilityError: boolean): void => {
        this.isNoAvailabilityError = isNoAvailabilityError;
    };

    @action setSelectedHotelDetailsOffer = (
        amendHotelOffer: IAmendHotelOffer,
        hotel: IHotel,
        backLink = this.rootStore.routerStore.router?.asPath,
    ): void => {
        this.selectedHotelDetails = {
            amendHotelOffer: amendHotelOffer,
            hotel: hotel,
        };

        setWebStorageItem(
            LocalStorageType.HotelMobileBasket,
            {
                backLink,
                hotelOffer: amendHotelOffer,
                booking: this.rootStore.viewBookingStore.booking,
                isOnlyGoBack: this.rootStore.layoutStore.isAmendHotelSummaryPage,
            },
            sessionStorage,
        );
    };

    @action setSortingOption = (sortingOption: AlternativeHotelsSortingOptions): void => {
        if (this.selectedSortingOption === sortingOption) return;

        this.selectedSortingOption = sortingOption;
        this.setInitialPageNumber();

        this.getInitialAlternativeHotels(this.rootStore.trackingStore.changeHotel.trackSortHotelList);
    };

    @action setAlternativeHotels = (alternativeHotels: IAmendHotelOffer[]): void => {
        this.alternativeHotels = alternativeHotels;
    };

    @action setInitialPageNumber = (): void => {
        this.setPageNumber(INITIAL_PAGE_NUMBER);
    };

    @action setPageNumber = (pageNumber: number): void => {
        this.pageNumber = pageNumber;
    };

    @action incrementPageNumber = (): void => {
        this.pageNumber++;
    };

    @action decrementPageNumber = (): void => {
        this.pageNumber--;
    };

    @action setNewlySelectedHotelOffer = (hotelOffer: Nullable<IAmendHotelOffer>): void => {
        this.newlySelectedHotelOffer = hotelOffer;
    };

    @action setIsLoadingSummaryPage = (isLoading: boolean): void => {
        this.isLoadingSummaryPage = isLoading;
    };

    @computed get allowanceRestrictions(): TAmendHotelRestrictions {
        const { amendBookingStatuses } = this.rootStore.viewBookingStore;

        return {
            byMultipleRooms: amendBookingStatuses.includes(AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms),
            bySportEquipment: amendBookingStatuses.includes(AmendBookingStatus.AmendHotelDisabledBySportEquipment),
            byTimeBound: amendBookingStatuses.includes(AmendBookingStatus.AmendHotelDisabledByTimeBound),
            byDisabledOnSite: amendBookingStatuses.includes(AmendBookingStatus.AmendHotelDisabledOnSite),
        };
    }

    @computed get amendCTAState(): TAmendCTAState {
        const { booking } = this.rootStore.viewBookingStore;
        const { amendmentInfo: { isHotelChangeEnabled = false } = {} } = booking || {};
        const { byMultipleRooms, bySportEquipment, byTimeBound, byDisabledOnSite } = this.allowanceRestrictions;

        if (!isHotelChangeEnabled) {
            if (byTimeBound || byDisabledOnSite) {
                return { isVisible: false };
            }

            if (bySportEquipment || byMultipleRooms) {
                return { isVisible: true, isDisabled: true };
            }

            return { isVisible: false };
        }

        return { isVisible: true, isDisabled: false };
    }

    @computed get totalNumberOfHotels(): number {
        return this.offersStatus?.total ?? 0;
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get totalNumberOfHotelsDisplayed(): number {
        return this.alternativeHotels.length;
    }

    @computed get hasMoreHotelsToLoad(): boolean {
        return this.totalNumberOfHotelsDisplayed < this.totalNumberOfHotels;
    }

    @computed get totalPrice(): number {
        return this.newlySelectedHotelOffer?.amendmentChargesInfo?.fullAmendmentCharges ?? 0;
    }

    @computed get promocodeBreakdown(): IAmendBookingPromoBreakDown | undefined {
        return this.newlySelectedHotelOffer?.amendmentChargesInfo?.promoCodeBreakDown;
    }

    @action setPrevSelectedHotelOffer = (hotelOffer: Nullable<IAmendHotelOffer>): void => {
        this.prevSelectedHotelOffer = hotelOffer;
    };

    @computed get feePP(): Nullable<number> {
        return this.newlySelectedHotelOffer?.amendmentPaymentInfo?.feesPerPersons?.[0]?.feesPerPersonAmount;
    }

    @computed get isLoadingAlternativeHotels(): boolean {
        return this.pageNumber === INITIAL_PAGE_NUMBER && !!this.alternativeHotelsRequest?.isPending;
    }

    @computed get isLoadingNextPage(): boolean {
        return this.pageNumber > INITIAL_PAGE_NUMBER && !!this.alternativeHotelsRequest?.isPending;
    }

    @computed get isLoading(): boolean {
        return !!this.alternativeHotelsRequest?.isPending;
    }
}
