import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx';

import { CurrencyCode } from 'code/currency';
import settings from 'code/settings';
import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { hasIntersection } from 'frontend/utils/array.utils';
import { buildAirportsFilterOptionsFromOffers } from 'frontend/utils/filter.utils';
import { checkForEqualTransports } from 'frontend/utils/route.utils';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { IAmendBookingPromoBreakDown, IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IBookingInfo, TAmendFlightsRestrictions } from 'models/data/IBookingInfo';
import { IFilterOption, IFilterOrderSetting, ISelectedFilter, ITimeFilterOptionSetting } from 'models/data/IFilters';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { AlternativeFlightsSortBy, TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ApiErrors } from 'models/enum/ApiErrors';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { AmendFlightsFilterStore } from './AmendFlightsFilterStore';
import { AmendFlightsSortStore } from './AmendFlightsSortStore';
import { checkForOrderIncorrect } from './AmendFlightsStore.utils';
import { AMEND_FLIGHTS_DISABLED_STATUSES } from './constants';

export class AmendFlightsStore extends AmendFlightsFilterStore {
    private flightsCancelSource: Nullable<CancelTokenSource>;
    validateFlightsCancelSource?: CancelTokenSource;

    @observable.ref booking: Nullable<IBookingInfo>;

    @observable alternativeOffers: IOffer[] = [];
    @observable alternativeFlights: IAmendTransport[] = [];
    @observable selectedFlight: Nullable<IAmendTransport>;
    @observable prevSelectedFlight: Nullable<IAmendTransport>;
    @observable status: DataStatus = DataStatus.NotLoaded;
    @observable isSeatDropPopupWasShown = false;
    @observable showSeatDropPopup = false;
    @observable flightOffersCount = 0;

    sorting: AmendFlightsSortStore;

    // Popups / Messages
    @observable isNoAvailableFlightsPopupShown: boolean = false;
    @observable isOtherDepartureAirportsPopupShown: boolean = false;
    @observable isPreFilteredMessageShown: boolean = false;
    @observable isPrevSelectedFlightUnavailable: boolean = false;

    @observable scenario: AmendScenarios = AmendScenarios.FromBooking;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        this.sorting = new AmendFlightsSortStore();
        makeObservable(this);

        reaction(
            () => this.alternativeFlights,
            alternativeFlights => {
                this.trackIncorrectPriceSorting(alternativeFlights, this.sorting.sortBy);
            },
        );
    }

    trackIncorrectPriceSorting = (alternativeFlights: IAmendTransport[], sortType: AlternativeFlightsSortBy): void => {
        const isSortingByPrice = [
            AlternativeFlightsSortBy.PriceLowToHigh,
            AlternativeFlightsSortBy.PriceHightToLow,
        ].includes(sortType);

        if (!isSortingByPrice || !alternativeFlights.length) {
            return;
        }

        const isOrderIncorrect = checkForOrderIncorrect(alternativeFlights, sortType);

        if (!isOrderIncorrect) {
            return;
        }

        this.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights(sortType);
    };

    clearValidateFlightsToken = (): void => {
        if (this.validateFlightsCancelSource) {
            this.validateFlightsCancelSource.cancel();
            this.validateFlightsCancelSource = undefined;
        }
    };

    @computed get currency(): CurrencyCode | undefined {
        return this.booking?.currency?.code;
    }

    private getFilteredAndSortedOffers = (altOffers: IOffer[]) => {
        const filteredOffers = this.getFilteredOffers(altOffers);

        return this.sorting.getSortedOffers(filteredOffers);
    };

    private updateAlternativeOffers = (offers: IOffer[]) => {
        this.alternativeOffers = offers;
        this.flightOffersCount = this.getFilteredOffers(offers).length;
        this.setInitiateFilters(offers, { setDepartureFilter: this.isDepartureAirportContentEnabled });
    };

    @action setScenario = (scenario: AmendScenarios): void => {
        this.scenario = scenario;
    };

    getValidatedFlights = async (flightsToValidate: IOffer[], booking: IBookingInfo): Promise<IAmendTransport[]> => {
        if (this.isFromChangeDate) {
            return this.rootStore.amendDatesStore.flights.getValidatedFlightsAndUpdateOffers(
                flightsToValidate,
                this.validateFlightsCancelSource,
            );
        }

        if (this.isFromBooking) {
            const response = await bookingService.getAmendAlternativeFlightsWithLivePrice(
                booking,
                flightsToValidate,
                this.validateFlightsCancelSource,
            );

            return response.transports;
        }

        return [];
    };

    private fetchRecursiveFlights = async (data: {
        accumulator: IAmendTransport[];
        booking: IBookingInfo;
        countToFetch: number;
        endIndex: number;
        maxSize: number;
        offers: IOffer[];
        removeAccumulator: IOffer[];
        startIndex: number;
    }) => {
        const { startIndex, endIndex, maxSize, countToFetch, offers, booking, accumulator, removeAccumulator } = data;

        if (startIndex >= maxSize) {
            return;
        }

        const flightsToValidate = offers.slice(startIndex, endIndex);

        const transports = await this.getValidatedFlights(flightsToValidate, booking);

        if (!transports || !Array.isArray(transports)) {
            throw new Error();
        }

        accumulator.push(...transports);

        const differenceInReceivedFlights = flightsToValidate.filter(
            offer => !transports.find(flight => checkForEqualTransports(flight, offer.transport)),
        );
        const nextEndIndex = Math.min(endIndex + differenceInReceivedFlights.length, maxSize);
        const isNeedToLoadMore = accumulator.length < countToFetch && differenceInReceivedFlights.length > 0;

        if (isNeedToLoadMore) {
            removeAccumulator.push(...differenceInReceivedFlights);

            return this.fetchRecursiveFlights({ ...data, startIndex: endIndex, endIndex: nextEndIndex });
        }
    };

    @computed get bookingRoutes(): IRoute[] {
        if (this.isFromChangeDate) {
            return this.rootStore.amendDatesStore.offer?.transport?.routes || [];
        }

        return this.booking?.package?.transport?.routes || [];
    }

    @computed get isDepartureAirportContentEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsDepartureAirportContentEnabled);
    }

    @computed get haveSelectedSeats(): boolean {
        return !!this.booking?.package?.transport?.routes?.some(route => route.paxs?.some(pax => !!pax.seat));
    }

    @computed get errataFlightInfo(): string[] {
        return this.booking?.package?.transport?.errataFlightInfo || [];
    }

    @computed get departureAirports(): IFilterOption[] {
        return this.getFiltersGroup(FilterGroupCodes.AltFlightsDepartureAirports)?.options || [];
    }

    @computed get selectedDepartureAirports(): ISelectedFilter[] {
        return this.getSelectedFiltersByGroupCode(FilterGroupCodes.AltFlightsDepartureAirports);
    }

    @action clearStore = (): void => {
        this.booking = null;
        this.alternativeFlights = [];
        this.alternativeOffers = [];
        this.changeSelectedFlight(null);
        this.filters = [];
        this.selectedFilters = [];
        this.isPrevSelectedFlightUnavailable = false;
        this.setScenario(AmendScenarios.FromBooking);
    };

    @action initAmendFlightsPage = async (
        orderSettings: Nullable<IFilterOrderSetting[]>,
        timeFilters: Nullable<ITimeFilterOptionSetting[]>,
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
        skipPayloadCheck = false, // we should payload check if it called from initialize from payload method
        payload: Partial<{ filters: ISelectedFilter[] }> = {},
    ): Promise<void> => {
        if (this.isFromChangeDate) {
            this.booking = this.rootStore.amendDatesStore.booking;
        }

        if (this.rootStore.appStore.amendBookingItemPayload?.selectedFlight && !skipPayloadCheck) {
            this.initFlightsPageFromPayload(orderSettings, timeFilters, sortOrder, sortDefault);

            return;
        }

        if (!this.booking || !this.rootStore.userStore.isLoggedIn) {
            this.goToAmendFlightsRedirectPage();

            return;
        }

        this.filterSettings = { timeFilters, orderSettings };
        this.setInitiateFilters(this.alternativeOffers, { setDepartureFilter: this.isDepartureAirportContentEnabled });
        this.sorting.setSortByInitially(sortOrder, sortDefault);

        if (payload.filters) {
            this.selectedFilters = payload.filters;
        }

        if (!payload.filters && this.isDepartureAirportContentEnabled) {
            const departureFilters = this.getFiltersGroup(FilterGroupCodes.AltFlightsDepartureAirports);
            this.setBookingDepartureAirport(departureFilters?.options || []);
        }

        await this.loadInitialAlternativeFlights();

        if (this.alternativeFlights.length > 0) {
            this.togglePreFilteredMessage(true);
        }
    };

    goToAmendFlightsRedirectPage(): void {
        const url =
            this.rootStore.layoutStore.getSetting(SiteSettings.AmendFlightsRedirectPage)?.Url || SitePath.ViewBookings;
        this.rootStore.routerStore.redirectTo(url);
    }

    @action setIsSeatDropPopupWasShown = (value: boolean): void => {
        this.isSeatDropPopupWasShown = value;
    };

    @action setShowSeatDropPopup = (value: boolean): void => {
        this.showSeatDropPopup = value;
    };

    @action initFlightsPageFromPayload = async (
        orderSettings: Nullable<IFilterOrderSetting[]>,
        timeFilters: Nullable<ITimeFilterOptionSetting[]>,
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
    ): Promise<void> => {
        const {
            viewBookingStore,
            routerStore,
            appStore: { amendBookingItemPayload },
        } = this.rootStore;

        await viewBookingStore.initBookingFromPayload(async booking => {
            this.booking = booking;
            this.alternativeOffers = await this.getAmendFlightsOffers();

            if (!this.alternativeOffers.length) {
                routerStore.redirectToViewBookingPage();

                return;
            }
        });

        // continue our default flow for amend flights page
        this.initAmendFlightsPage(orderSettings, timeFilters, sortOrder, sortDefault, true, {
            filters: amendBookingItemPayload?.selectedFlightFilters,
        });
    };

    /**
     * Check the alternative flights for current booking.
     * If there are available flights, go to Amend Flights Page.
     */
    @action startAmendBookingFlights = async (
        booking: IBookingInfo,
        scenario: AmendScenarios = AmendScenarios.FromBooking,
    ): Promise<void> => {
        try {
            if (this.flightsCancelSource) {
                this.flightsCancelSource.cancel();
            }

            this.clearStore();
            this.setScenario(scenario);
            this.updateFlightsDataStatus(DataStatus.Loading);
            this.flightsCancelSource = Axios.CancelToken.source();
            this.booking = booking;

            const alternativeOffers = await this.getFlightOffers(this.flightsCancelSource);

            runInAction(() => {
                this.updateFlightsDataStatus(DataStatus.Loaded);

                const isOffersWithBookingAirport = this.checkFlightOffersForBookingAirport(alternativeOffers);
                const isShowUnavailablePopupWithDisabledContent =
                    !this.isDepartureAirportContentEnabled && !isOffersWithBookingAirport;
                const isShowUnavailablePopup =
                    alternativeOffers.length < 1 || isShowUnavailablePopupWithDisabledContent;

                // If there are no available flights at all,
                // show the popup explaining that no flights
                if (isShowUnavailablePopup) {
                    if (this.isFromChangeDate) {
                        this.rootStore.amendDatesStore.flights.setNoAvailableFlightOffers(true);
                    }

                    this.toggleNoAvailableFlightsPopup(true);

                    return;
                }

                // this.alternativeGenericOffers = alternativeOffers;
                this.alternativeOffers = alternativeOffers;

                // If flights are NOT available from booking departure airport,
                // show the popup to select other departure airport.
                if (!isOffersWithBookingAirport && this.isDepartureAirportContentEnabled) {
                    this.setDepartureFilters(alternativeOffers);
                    this.toggleOtherDepartureAirportsPopup(true);

                    return;
                }

                // If flights are available from booking departure airport,
                // go to Amend Flights Page.
                this.rootStore.routerStore.redirectToAmendFlightsPage();
            });
        } catch (e) {
            runInAction(() => {
                this.updateFlightsDataStatus(DataStatus.Error);

                if (this.isFromBooking) {
                    this.rootStore.viewBookingStore.toggleAmendErrorPopup(true);
                }

                if (this.isFromChangeDate) {
                    this.rootStore.amendDatesStore.setIsSummaryRequestError(true);
                }
            });
        }
    };

    getFlightOffers = async (cancelToken?: CancelTokenSource): Promise<IOffer[]> => {
        if (this.isFromChangeDate) {
            return await this.rootStore.amendDatesStore.flights.getChangeDateAmendFlightsOffers();
        }

        if (this.isFromBooking) {
            return await this.getAmendFlightsOffers(cancelToken);
        }

        return [];
    };

    getAmendFlightsOffers = async (cancelToken?: CancelTokenSource): Promise<IOffer[]> => {
        if (!this.booking) {
            return [];
        }

        const response = await bookingService.getAmendAlternativeFlights(this.booking, cancelToken);
        let altFlightsOffers = response?.offers || [];

        // If "Departure content" disabled we filter airports by departure of booking outbound airport
        if (!this.isDepartureAirportContentEnabled && this.bookingRoute?.depPt) {
            altFlightsOffers = altFlightsOffers.filter(offer =>
                this.onFilterItem(offer, FilterGroupCodes.AltFlightsDepartureAirports, [this.bookingRoute!.depPt]),
            );
        }

        return altFlightsOffers;
    };

    @action getValidatedFlight = async (flight: IAmendTransport): Promise<IAmendTransport | undefined> => {
        if (!this.booking) return;

        if (this.isFromChangeDate) {
            // Get amend dates offer item from store for given flight, as this shape is required for /validate call
            const amendDatesOfferItem = this.rootStore.amendDatesStore.flights.flightOffers.find(amendDatesOffer =>
                checkForEqualTransports(amendDatesOffer.offer.transport, flight),
            );

            if (!amendDatesOfferItem) {
                return;
            }

            const amendDatesOffers = await bookingService.getAmendDatesValidatedFlights([amendDatesOfferItem]);

            return amendDatesOffers[0]?.offer.transport as IAmendTransport;
        }

        const transport = { transport: flight, price: flight.packagePrice, pricePP: flight.packagePricePP };
        const data = await bookingService.getAmendAlternativeFlightsWithLivePrice(this.booking, [transport]);

        return data.transports[0];
    };

    @action private checkForMissingFlight = async (selectedFlight: IAmendTransport) => {
        const validatedFlight = await this.getValidatedFlight(selectedFlight);

        if (validatedFlight && !validatedFlight.notAvailable) {
            return;
        }

        // add previously selected flight to top, to show user that is now not available
        selectedFlight.notAvailable = true;
        this.alternativeFlights = [selectedFlight, ...this.alternativeFlights];

        // Show unavailable popup
        this.isPrevSelectedFlightUnavailable = true;

        // Remove previously selected flight from alternative offers
        this.alternativeOffers = this.alternativeOffers.filter(
            offer => !checkForEqualTransports(selectedFlight, offer.transport),
        );
    };

    /**
     * Get all Alternative Flights, but only first N items will be with live price
     * (N - itemsPerPage)
     */
    @action loadInitialAlternativeFlights = async (): Promise<void> => {
        this.clearValidateFlightsToken();

        if (!this.booking) return;

        try {
            this.validateFlightsCancelSource = Axios.CancelToken.source();
            this.updateFlightsDataStatus(DataStatus.Loading);

            this.alternativeFlights = [];
            const { alternativeFlights, alternativeOffers } = await this.fetchAlternativeFlights(this.booking);
            runInAction(async () => {
                const { amendBookingItemPayload } = this.rootStore.appStore;
                this.alternativeFlights = alternativeFlights;
                this.updateAlternativeOffers(alternativeOffers);

                const selectedFlight = this.selectedFlight || amendBookingItemPayload?.selectedFlight;
                // select previously selected flight
                const flight = this.alternativeFlights.find(transport =>
                    checkForEqualTransports(transport, selectedFlight),
                );

                if (flight?.amendmentCharges) {
                    this.changeSelectedFlight(flight);
                    this.changePrevSelectedFlight(selectedFlight);
                    this.updateFlightsDataStatus(DataStatus.Loaded);

                    return;
                }

                // If selected flight not in fetched list, check for it's availability
                if (selectedFlight) {
                    // If it not exists in fetched list - drop to previous one
                    this.resetSelectedFlight();
                    await this.checkForMissingFlight(selectedFlight);
                }

                this.updateFlightsDataStatus(DataStatus.Loaded);
            });
        } catch (e) {
            if (Axios.isCancel(e)) {
                return;
            }

            const errorCode = e?.errorCode;

            // Redirect from flights page if amendment is prohibited
            if (errorCode === ApiErrors.RoutesModifyProhibited || errorCode === ApiErrors.NotLeadPassengerLogged) {
                this.goToAmendFlightsRedirectPage();

                return;
            }

            runInAction(() => {
                this.alternativeFlights = [];
                this.updateFlightsDataStatus(DataStatus.Error);
            });
        }
    };

    fetchAlternativeFlights = async (
        booking: IBookingInfo,
    ): Promise<{
        alternativeFlights: IAmendTransport[];
        alternativeOffers: IOffer[];
    }> => {
        const alternativeFlights: IAmendTransport[] = [];
        const filteredOffers = this.getFilteredAndSortedOffers(this.alternativeOffers);
        this.flightOffersCount = filteredOffers.length;
        const offersNeedToRemove: IOffer[] = [];

        const countToFetch = settings.AmendFlights.itemsPerPage;
        const firstStartIndex = this.alternativeFlights.length;
        const firstEndIndex = firstStartIndex + countToFetch;

        await this.fetchRecursiveFlights({
            startIndex: firstStartIndex,
            endIndex: firstEndIndex,
            countToFetch,
            accumulator: alternativeFlights,
            removeAccumulator: offersNeedToRemove,
            booking,
            maxSize: filteredOffers.length,
            offers: filteredOffers,
        });

        const newAlternativeOffers = this.alternativeOffers.filter(
            offer => !offersNeedToRemove.find(flight => checkForEqualTransports(flight.transport, offer.transport)),
        );

        return { alternativeFlights, alternativeOffers: newAlternativeOffers };
    };

    /**
     * Load next N flights and validate live price for them
     * (N - itemsPerPage)
     */
    @action loadMoreAlternativeFlightsWithLivePrice = async (): Promise<void> => {
        if (!this.booking) return;

        try {
            this.updateFlightsDataStatus(DataStatus.LoadingMore);

            const { alternativeFlights, alternativeOffers } = await this.fetchAlternativeFlights(this.booking);

            runInAction(() => {
                this.alternativeFlights = [...this.alternativeFlights, ...alternativeFlights];
                this.updateAlternativeOffers(alternativeOffers);
                this.updateFlightsDataStatus(DataStatus.Loaded);
            });
        } catch (e) {
            runInAction(() => {
                this.updateFlightsDataStatus(DataStatus.Error);
            });
        }
    };

    @action changeSelectedFlight = (flight: Nullable<IAmendTransport>): void => {
        this.selectedFlight = flight;
    };

    @action changePrevSelectedFlight = (flight: Nullable<IAmendTransport>): void => {
        this.prevSelectedFlight = flight;
    };

    @action resetSelectedFlight = (): void => {
        this.changeSelectedFlight(null);
        this.changePrevSelectedFlight(null);
        this.rootStore.appStore.setAmendBookingItemPayload(undefined);
    };

    @action hideUnavailablePopup = (): void => {
        this.isPrevSelectedFlightUnavailable = false;
    };

    @action setBookingDepartureAirport = (airportsFilterOptions: IFilterOption[]): void => {
        if (!this.bookingRoute) {
            return;
        }

        const airportFilter = airportsFilterOptions.find(a => a.code === this.bookingRoute!.depPt);

        if (airportFilter) {
            // If there is filter option (i.e. flights are available from the booking airport),
            // select the booking airport.
            this.addSelectedFilter(airportFilter);
        } else {
            // Else the booking airport should be disabled and unselected.
            // So add it to filter options with count = 0.
            this.addFilterOptionsToGroup(FilterGroupCodes.AltFlightsDepartureAirports, [
                {
                    code: this.bookingRoute.depPt,
                    name: this.bookingRoute.depName,
                    count: 0,
                    groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
                },
            ]);
        }
    };

    @computed get bookingRoute(): IRoute | undefined {
        return this.bookingRoutes.find(r => r.direction === RouteDirection.Outbound);
    }

    checkFlightOffersForBookingAirport = (offers: IOffer[]): boolean => {
        const options: IFilterOption[] = buildAirportsFilterOptionsFromOffers(
            offers,
            FilterGroupCodes.AltFlightsDepartureAirports,
        );

        return options?.some(({ code }) => code === this.bookingRoute?.depPt);
    };

    @action onChangeSortBy = async (sortBy: AlternativeFlightsSortBy): Promise<void> => {
        if (this.status === DataStatus.Loading || this.sorting.sortBy === sortBy) {
            return;
        }

        if (this.booking) {
            this.rootStore.trackingStore.trackChangeSortTypeFlightAmendment(sortBy, this.booking.bookingReference);
        }

        this.sorting.onChangeSortBy(sortBy);

        if (this.flightOffersCount > 1) {
            await this.loadInitialAlternativeFlights();
        }
    };

    getSelectedTimeSlots(groupCode: FilterGroupCodes): ITimeSlot[] {
        return this.getSelectedFiltersByGroupCode(groupCode)
            .map(f => f.timeSlot)
            .filter(t => t?.start && t.end) as ITimeSlot[];
    }

    @action toggleNoAvailableFlightsPopup = (state: boolean): void => {
        this.isNoAvailableFlightsPopupShown = state;
    };

    @action toggleOtherDepartureAirportsPopup = (state: boolean): void => {
        this.isOtherDepartureAirportsPopupShown = state;
    };

    @action togglePreFilteredMessage = (state: boolean): void => {
        this.isPreFilteredMessageShown = state;
    };

    @action updateFlightsDataStatus = (status: DataStatus): void => {
        this.status = status;
    };

    @action submitFlightChangeSelection = (): void => {
        if (!this.selectedFlight) {
            return;
        }

        if (this.isFromChangeDate) {
            this.rootStore.amendDatesStore.flights.submitFlightChangeSelection(this.selectedFlight);

            return;
        }

        this.rootStore.viewBookingStore.continueToPay();
    };

    @action cancelFlightsValidation = (): void => {
        this.clearValidateFlightsToken();
        this.updateFlightsDataStatus(DataStatus.NotLoaded);
    };

    @computed get isFromChangeDate(): boolean {
        return this.scenario === AmendScenarios.FromChangeDate;
    }

    @computed get isFromBooking(): boolean {
        return this.scenario === AmendScenarios.FromBooking;
    }

    @computed get backLink(): SitePath {
        if (this.isFromChangeDate) {
            return SitePath.AmendDatesSummary;
        }

        return SitePath.ViewBooking;
    }

    @computed get haveChosenSeatsBeenDropped(): boolean {
        if (!this.selectedFlight) {
            return false;
        }

        if (this.haveSelectedSeats && !this.isSeatDropPopupWasShown) {
            this.setShowSeatDropPopup(true);

            return true;
        }

        if (this.selectedFlight && this.booking) {
            this.rootStore.trackingStore.trackFlightAmendment(
                EventTypes.PostBookingChangeFlightsUpdate,
                this.selectedFlight.routes,
                this.booking.package?.transport?.routes,
                this.selectedFlight.amendmentPaymentInfo,
            );
        }

        return false;
    }

    @computed get feePP(): Nullable<number> {
        return this.alternativeFlights.find(el => el.amendmentPaymentInfo?.feesPerPersons)?.amendmentPaymentInfo
            ?.feesPerPersons?.[0]?.feesPerPersonAmount;
    }

    @computed get amendCTAState(): TAmendCTAState {
        const {
            isLeadLoggedIn,
            allowanceRestrictions: { byLeadPassenger, byExternalAgency },
            hasBookingAtcomError,
            amendBookingStatuses,
        } = this.rootStore.viewBookingStore;
        const { byAtcom, byOutOfSync, byFlightManifested, byDisruption, byAirportParking } = this.allowanceRestrictions;

        if (byDisruption || byOutOfSync || byFlightManifested || byExternalAgency || byAirportParking) {
            return { isVisible: true, isDisabled: true };
        }

        if (hasBookingAtcomError) {
            return { isVisible: false };
        }

        if (isLeadLoggedIn && byAtcom) {
            return { isVisible: true };
        }

        if (byLeadPassenger && !hasIntersection(amendBookingStatuses, AMEND_FLIGHTS_DISABLED_STATUSES)) {
            return { isVisible: true };
        }

        return { isVisible: false };
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get allowanceRestrictions(): TAmendFlightsRestrictions {
        const { amendBookingStatuses, booking } = this.rootStore.viewBookingStore;

        return {
            byAtcom: !!booking?.amendmentInfo?.route,
            byOutOfSync: amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledByOutOfSync),
            byFlightManifested: amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledManifestedFlights),
            byTimeBound: amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledByTimeBound),
            byDisruption: amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledByFlightDisruption),
            byAirportParking: amendBookingStatuses.includes(AmendBookingStatus.AmendFlightsDisabledByAirportParking),
        };
    }

    @computed get totalPrice(): number {
        return this.selectedFlight?.amendmentCharges ?? 0;
    }

    @computed get promocodeBreakdown(): IAmendBookingPromoBreakDown | undefined {
        return this.selectedFlight?.promoCodeBreakDown;
    }
}
