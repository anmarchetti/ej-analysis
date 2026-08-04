import { action, computed, makeObservable, observable, runInAction, when } from 'mobx';

import { CurrencyCode } from 'code/currency';
import bookingService from 'frontend/services/booking.service';
import { TRootStore } from 'frontend/store/IStores';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { countSum, isPremiumSeat, parseSeats } from 'frontend/utils/seatAndBags.utils';
import { generateSeatsFlightKey, getSeatPrice, getSeatProducts } from 'frontend/utils/seatMap.utils';
import { getSelectedSeatsQueryParams } from 'frontend/utils/url.utils';
import { IRoute } from 'models/data/IRoute';
import {
    IAircraftType,
    IFlightInitialSelection,
    IFlightSeatsResponse,
    ISeatMapRow,
    ISeatMapStore,
    ISelectedSeat,
    ISingleSeat,
} from 'models/data/ISeatMapStore';
import { GuestType } from 'models/enum/GuestType';
import { QueryParamName } from 'models/enum/QueryParamName';
import { SeatsAndBagsSettings } from 'models/enum/SeatsAndBagsSettings';
import SiteSettings from 'models/enum/SiteSettings';

class BaseSeatMapStore {
    @observable isSeatMapOpened: boolean = false;
    @observable rowsDeparture: ISeatMapRow[];
    @observable rowsReturn: ISeatMapRow[];

    @observable isSeatMapFailed: boolean = false;
    @observable isDepartureDataLoaded: boolean = false;
    @observable isReturnDataLoaded: boolean = false;

    @observable isSelectedSeatsUnavailableError: boolean = false;
    @observable isSeatMapFlowDisabledError: boolean = false;

    @observable shouldOpenSeatMapForced: boolean = false;

    @observable public validatedSelectedSeats: ISelectedSeat[] = [];
    @observable isProcessingSeatSelection: boolean = false;

    // save seats response for later use in seat map widget to eliminate duplicated requests
    @observable.ref seatsResponse: { flightKey: string; response: IFlightSeatsResponse }[] = [];

    @observable seatWidgetWasLoadedOnce: boolean = false;

    @observable currency: CurrencyCode;

    @computed get isSeatDataLoaded(): boolean {
        return this.isDepartureDataLoaded && this.isReturnDataLoaded;
    }

    @computed get isSeatMapFlowEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.EnableSeatMapFlow);
    }

    @computed get isSeatMapPostBookingFlowEnabled(): boolean {
        return (
            !!this.rootStore.layoutStore.getSetting(SiteSettings.EnableSeatMapPostBookingFlow) &&
            !this.rootStore.viewBookingStore.isAmendSeatsDisabled
        );
    }

    // viewBooking store is used for Post Booking flow
    @computed get outboundFlight(): IRoute | undefined {
        const { bookingStore, viewBookingStore } = this.rootStore;

        if ('amendDatesStore' in this.rootStore && this.rootStore.amendDatesStore.outboundFlight) {
            return this.rootStore.amendDatesStore.outboundFlight;
        }

        return viewBookingStore.outboundFlight ?? bookingStore.outboundFlight;
    }

    @computed get inboundFlight(): IRoute | undefined {
        const { bookingStore, viewBookingStore } = this.rootStore;

        if ('amendDatesStore' in this.rootStore && this.rootStore.amendDatesStore.inboundFlight) {
            return this.rootStore.amendDatesStore.inboundFlight;
        }

        return viewBookingStore.inboundFlight ?? bookingStore.inboundFlight;
    }

    @computed get isPostBooking(): boolean {
        return this.rootStore.layoutStore.isViewBookingPage || this.rootStore.layoutStore.isAmendDatesSummaryPage;
    }

    // generate initial selection for seat map widget
    @computed get seatMapInitialSelection(): IFlightInitialSelection[] | undefined {
        if (!this.validatedSelectedSeats) {
            return undefined;
        }

        const { outBoundPassengers, inBoundPassengers } = this.rootStore.flightsPassengersStore;

        const flightsData = [
            { flight: this.outboundFlight, passengers: outBoundPassengers },
            { flight: this.inboundFlight, passengers: inBoundPassengers },
        ];

        const selection = flightsData.reduce((acc, { flight, passengers }) => {
            if (!flight) return acc;

            const flightNumber = getFlightDigitalNumber(flight);

            const seats = passengers
                .filter(pax => !!(pax.seat?.seatNumber && pax.index) || (this.isPostBooking && !!pax.index))
                .map(pax => ({
                    passengerId: +(pax.index ?? 0) - 1, // our indexes are 1-based, but seat map expects 0-based
                    seatNumber: pax.seat?.seatNumber ?? '',
                    type: (pax.type as GuestType) ?? GuestType.Adult,
                    price: getSeatPrice(this.selectedSeats, flight.fltNo, pax.seat?.seatNumber), // seat price from booking - it can differ if user had downgraded this seat before
                    name:
                        pax.title && pax.firstName && pax.lastName
                            ? [pax.title, pax.firstName, pax.lastName].join(' ')
                            : '',
                    withInfant: pax.withInfant,
                    products: getSeatProducts(this.selectedSeats, flightNumber, pax.seat?.seatNumber),
                }));

            if (seats.length > 0) {
                acc.push({
                    flightNumber,
                    flightDate: formatDateToQuery(flight.depDate),
                    seats,
                });
            }

            return acc;
        }, [] as IFlightInitialSelection[]);

        return selection.length ? selection : undefined;
    }

    /** get parsed seat selection from url */
    // TODO: make it work even in case of faulty data
    @computed get seatSelectionFromUrl(): ISelectedSeat[] | undefined {
        const { queryParamsStore } = this.rootStore;

        if (!queryParamsStore.seatSelectionFromUrl) {
            return undefined;
        }

        try {
            const selectedSeats: ISelectedSeat[] = parseSeats(queryParamsStore.seatSelectionFromUrl);
            const { outboundFlightNumber, inboundFlightNumber } = this.rootStore.flightsPassengersStore;

            if (selectedSeats[0] && outboundFlightNumber) {
                selectedSeats[0].flightNumber = outboundFlightNumber;
            }

            if (selectedSeats[1] && inboundFlightNumber) {
                selectedSeats[1].flightNumber = inboundFlightNumber;
            }

            return selectedSeats;
        } catch (e) {
            return undefined;
        }
    }

    @computed get haveSelectedSeats(): boolean {
        return this.validatedSelectedSeats.some(selection => !!selection.seats?.length);
    }

    @computed get haveOutboundSelectedSeats(): boolean {
        const { outBoundPassengers } = this.rootStore.flightsPassengersStore;

        const passengersAmount = outBoundPassengers.length;
        const selectedSeatsAmount = outBoundPassengers.filter(p => p.seat?.seatNumber).length;

        if (!passengersAmount) {
            return false;
        }

        return selectedSeatsAmount === passengersAmount;
    }

    @computed get haveInboundSelectedSeats(): boolean {
        const { inBoundPassengers } = this.rootStore.flightsPassengersStore;

        const passengersAmount = inBoundPassengers.length;
        const selectedSeatsAmount = inBoundPassengers.filter(p => p.seat?.seatNumber).length;

        if (!passengersAmount) {
            return false;
        }

        return selectedSeatsAmount === passengersAmount;
    }

    @computed get selectedSeatsPrice(): number {
        const [outFlight, inFlight] = this.validatedSelectedSeats;

        return countSum(outFlight?.seats || []) + countSum(inFlight?.seats || []);
    }

    @computed get selectedSeatsPricePP(): number {
        return Math.ceil(this.selectedSeatsPrice / this.rootStore.searchStore.searchWho.totalPaidGuestPlaces);
    }

    /** Enable to book seats if they are dynamic and seats flow enabled in Sitecore */
    @computed get isEnabledToBookSeats(): boolean {
        const isDynamicSeats = this.outboundFlight?.isExt ?? false;

        return this.isSeatMapFlowEnabled && isDynamicSeats && !this.isSeatMapFailed;
    }

    @computed get seatsMapTimeBannerAutoHide(): number {
        return this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.SeatsMapTimeBannerAutoHide);
    }

    @computed get minNumberOfDaysToDeparture() {
        const minNumberOfDays = parseInt(
            this.rootStore.layoutStore.getSetting(SiteSettings.MinNumberOfDaysToDeparture),
        );

        return !isNaN(minNumberOfDays) ? minNumberOfDays : SeatsAndBagsSettings.DefaultMinNumberOfDays;
    }

    /**
     * If isSeatMapFlowEnabled sitecore setting is disabled AND seats selected, then show error popup
     * else return actual value
     */
    @computed get selectedSeats(): ISelectedSeat[] {
        if (this.isSeatMapFlowEnabled) {
            return this.accumulatedSeatsSelection;
        }

        if (this.accumulatedSeatsSelection.length) {
            this.setSeatMapFlowDisabledError();
        }

        return [];
    }

    /**
     * Returns values from this.validatedSelectedSeats OR this.seatSelectionFromUrl
     */
    @computed private get accumulatedSeatsSelection(): ISelectedSeat[] {
        if (this.validatedSelectedSeats.length) {
            return this.validatedSelectedSeats;
        }

        if (this.seatSelectionFromUrl?.length) {
            return this.seatSelectionFromUrl;
        }

        return [];
    }

    constructor(public rootStore: TRootStore) {
        makeObservable(this);

        if (rootStore.viewBookingStore.viewBookingPayload?.shouldOpenSeatMapForced) {
            this.setOpenSeatMapForced(true);
        }
    }

    @action setSeatMapOpened = (state: boolean) => {
        this.isSeatMapOpened = state;
    };

    @action setOpenSeatMapForced = (state: boolean) => {
        this.shouldOpenSeatMapForced = state;
    };

    @action setValidatedSelectedSeats = (value: ISelectedSeat[]) => {
        this.validatedSelectedSeats = value;
    };

    @action clearValidatedSeats = () => {
        this.validatedSelectedSeats = [];
    };

    // use this func for update seat selection not only in SeatMapStore, but in QueryParamsStore too
    @action clearSelectedSeatsAndUpdateUrl = async () => {
        if (this.seatSelectionFromUrl) {
            const newQuery = this.rootStore.queryParamsStore.buildHotelDetailsQuery(undefined, {
                [QueryParamName.SelectedSeats]: getSelectedSeatsQueryParams([]),
            });

            await this.rootStore.routerStore.updateCurrentPage(newQuery, true);
        }

        this.clearValidatedSeats();
    };

    @action setSeatMapStoreDeparture = (data: ISeatMapStore) => {
        this.rowsDeparture = data.rows;
        this.isSeatMapFailed = false;
        this.isDepartureDataLoaded = true;
    };

    @action setSeatMapStoreReturn = (data: ISeatMapStore) => {
        this.rowsReturn = data.rows;
        this.isSeatMapFailed = false;
        this.isReturnDataLoaded = true;
    };

    @action setCurrency = (currency: CurrencyCode) => {
        this.currency = currency;
    };

    @action fetchSeatMap = async (flights: IRoute[], offerPromoCode?: string) => {
        if (!this.isSeatMapFlowEnabled) {
            return;
        }

        this.seatsResponse = [];

        try {
            const isDynamicSeats = flights[0].isExt;
            const viewBookingSeatReservationPossible =
                this.rootStore.layoutStore.isViewBookingPage && !this.rootStore.viewBookingStore.isBookingOutOfSync;

            if (!isDynamicSeats) {
                this.isSeatMapFailed = false;
            }

            if (isDynamicSeats || viewBookingSeatReservationPossible) {
                const [outboundFlight, inboundFlight] = await Promise.all([
                    bookingService.fetchSeatMap(
                        flights[0].depPt,
                        flights[0].arrPt,
                        formatDateToQuery(flights[0].depDate),
                        getFlightDigitalNumber(flights[0]),
                        true,
                        offerPromoCode,
                    ),
                    bookingService.fetchSeatMap(
                        flights[1].depPt,
                        flights[1].arrPt,
                        formatDateToQuery(flights[1].depDate),
                        getFlightDigitalNumber(flights[1]),
                        false,
                        offerPromoCode,
                    ),
                ]);

                if (!outboundFlight.rows.length || !inboundFlight.rows.length) {
                    throw new Error();
                }

                runInAction(() => {
                    this.seatsResponse = [
                        {
                            flightKey: generateSeatsFlightKey(flights[0]),
                            response: outboundFlight,
                        },
                        {
                            flightKey: generateSeatsFlightKey(flights[1]),
                            response: inboundFlight,
                        },
                    ];
                    this.setCurrency(outboundFlight.currency);
                });

                this.setSeatMapStoreDeparture(outboundFlight);
                this.setSeatMapStoreReturn(inboundFlight);
            }
        } catch (error) {
            this.isSeatMapFailed = true;
            this.isSelectedSeatsUnavailableError = false;
            this.shouldOpenSeatMapForced = false;
            this.isSeatMapOpened = false;
        }
    };

    @action setIsSelectedSeatsUnavailableError = (state: boolean) => {
        this.isSelectedSeatsUnavailableError = state;
    };

    @action clearSelectedSeatsUnavailableError = () => {
        this.isSelectedSeatsUnavailableError = false;
    };

    @action private setSeatMapFlowDisabledError = (state = true): void => {
        this.isSeatMapFlowDisabledError = state;
    };

    @action clearSeatMapFlowDisabledError = () => {
        this.isSeatMapFlowDisabledError = false;
    };

    @action onclearSelectedSeatsUnavailableError = (callback: () => void) => {
        when(() => !this.isSelectedSeatsUnavailableError, callback);
    };

    @action setIsProcessingSeatSelection(value: boolean) {
        this.isProcessingSeatSelection = value;
    }

    /** Find aircraft type in saved seats response */
    getFlightAircraftType = (flight: IRoute): Nullable<IAircraftType> => {
        if (this.seatsResponse) {
            const flightKey = generateSeatsFlightKey(flight);
            const flightSeats = this.seatsResponse.find(r => r.flightKey === flightKey);

            return flightSeats?.response?.aircraftType;
        }

        return null;
    };

    @action setSeatWidgetWasLoadedOnce = () => {
        this.seatWidgetWasLoadedOnce = true;
    };

    private readonly getAvailableSeats = (rows: ISeatMapRow[]): number => {
        const calculateRowAvailableSeats = (row: ISeatMapRow): number =>
            row.blocks.reduce(
                (acc, block) => acc + block.seats.filter((seat: ISingleSeat) => seat.isAvailable).length,
                0,
            );

        return rows?.reduce((acc, row) => acc + calculateRowAvailableSeats(row), 0) ?? 0;
    };

    @computed get availableDepartureSeats(): number {
        return this.getAvailableSeats(this.rowsDeparture);
    }

    @computed get availableReturnSeats(): number {
        return this.getAvailableSeats(this.rowsReturn);
    }

    @computed get isPremiumSeatsSelected(): boolean {
        return this.validatedSelectedSeats.some(selection =>
            selection.seats?.some(seat => isPremiumSeat(seat.priceBand)),
        );
    }

    @computed get isAllSelectedSeatsPremium(): boolean {
        return this.validatedSelectedSeats.every(selection =>
            selection.seats?.every(seat => isPremiumSeat(seat.priceBand)),
        );
    }
}

export default BaseSeatMapStore;
