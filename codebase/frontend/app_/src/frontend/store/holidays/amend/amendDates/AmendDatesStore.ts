import Axios, { CancelTokenSource } from 'axios';
import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import bookingService from 'frontend/services/booking.service';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getAccommodationGuestsCount } from 'frontend/utils/accommodation.utils';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { deepClone, hasIntersection } from 'frontend/utils/array.utils';
import { formatDateL10n, formatDateToQuery, getDaysDifference } from 'frontend/utils/date.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import {
    IAmendDatesOfferPrices,
    IAmendDatesResponseItem,
    IAmendDatesSubmitPayload,
    IRequestDatesResponseData,
} from 'models/data/bookingAmendment/AmendDates';
import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import { IBookingInfo, TAmendDatesRestrictions } from 'models/data/IBookingInfo';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { AmendEventActions, AmendEventLabels, GenericValues } from 'models/data/tracking/AmendEvent';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { GuestType } from 'models/enum/GuestType';
import HttpStatusCodes from 'models/enum/HttpStatusCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { SubmitPayload } from 'models/enum/SubmitPayload';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import AmendDatesFlights from './AmendDates.flights';
import AmendDatesSeats from './AmendDates.seats';
import { AmendDatesTransfer } from './AmendDates.transfer';
import {
    amendDatesDisableErrors,
    clearSeatSelectionFromOffer,
    getRoomDetailsForAmendDates,
} from './AmendDatesStore.utils';

const DEFAULT_NUMBER_OF_MONTHS_FOR_DATES_RANGE = 18;

class AmendDatesStore {
    @observable.ref booking: Nullable<IBookingInfo>;
    @observable initialDepartureDate: Nullable<Date>;
    @observable initialArrivalDate: Nullable<Date>;
    @observable selectedDepartureDate: Nullable<Date>;
    @observable selectedArrivalDate: Nullable<Date>;
    @observable calendarStartDate: Date;
    @observable calendarEndDate: Date;
    @observable selectedMonth: Date;
    @observable isError: Nullable<boolean> = false;
    @observable isSummaryRequestError: Nullable<boolean> = false;
    @observable isNoAvailableDates: Nullable<boolean> = false;
    @observable availableDates: Nullable<string[]>;
    @observable availableMonths: Nullable<string[]>;
    @observable datesRequest: Nullable<Promise<IRequestDatesResponseData>>;
    @observable isInitialDataLoading: boolean;
    @observable isSubmitDatesLoading: boolean;
    @observable isSelectedDatesUnavailable: boolean;
    @observable isCalendarAvailabilityChecked: boolean = false;
    @observable isAlternativePackagePopupShown: boolean = false;
    @observable isValidatedOfferUnavailable: boolean = false;

    @observable offerWithPrices: Nullable<IAmendDatesResponseItem> = null;
    @observable prevOfferWithPrices: Nullable<IAmendDatesResponseItem> = null;

    submitDatesCancelToken: Nullable<CancelTokenSource> = null;

    transfer: AmendDatesTransfer;
    flights: AmendDatesFlights;
    seats: AmendDatesSeats;
    @observable extraLuggage: ExtraLuggage;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
        this.transfer = new AmendDatesTransfer(rootStore);
        this.flights = new AmendDatesFlights(rootStore);
        this.seats = new AmendDatesSeats(rootStore);
        this.extraLuggage = new ExtraLuggage(rootStore);
    }

    breakSubmitRequest = (): void => {
        this.submitDatesCancelToken?.cancel();
        this.submitDatesCancelToken = null;
    };

    @action initiateSummaryPage = async (): Promise<void> => {
        try {
            this.flights.clearStore();
            this.isError = false;

            this.rootStore.amendTransfersStore.setScenario(AmendScenarios.FromChangeDate);
            this.rootStore.amendFlightsStore.setScenario(AmendScenarios.FromChangeDate);

            // Reset the flag for availability checked - any time we go back to calendar page we need to check availability again
            this.setIsCalendarAvailabilityChecked(false);
            this.setIsValidatedOfferUnavailable(false);

            if (this.rootStore.appStore.amendBookingItemPayload) {
                await this.initializeSummaryPageFromPayload();
            }

            if (!this.booking || !this.offerWithPrices || !this.booking.amendmentInfo?.changeDates) {
                this.redirectFromAmendDatesPageIfNoBooking();

                return;
            }

            if (this.rootStore.amendTransfersStore.isAmendCTAVisible) {
                await this.transfer.getTransferOffers(this.offerWithPrices);
            }
        } catch (e) {
            runInAction(() => {
                this.isError = true;
            });
        }
    };

    @action initAmendDatesPage = async (): Promise<void> => {
        this.isError = false;
        this.isInitialDataLoading = true;
        const {
            appStore: { amendBookingItemPayload, setAmendBookingItemPayload },
            viewBookingStore: { initBookingFromPayload },
        } = this.rootStore;

        if (amendBookingItemPayload) {
            await initBookingFromPayload(async booking => {
                this.booking = booking;
                this.setInitialDates();
                // Clear payload cause next step is summary page which use this payload as well
                setAmendBookingItemPayload(undefined);
            });
        } else {
            this.booking = deepClone(this.rootStore.viewBookingStore.booking);
        }

        if (!this.booking) {
            this.redirectFromAmendDatesPageIfNoBooking();

            return;
        }

        // If the availability has been checked we can skip the rest of the init, i.e. if coming from view booking page, since availability was checked there
        if (this.isCalendarAvailabilityChecked) {
            this.setSelectedDatesIfAvailable();

            return;
        }

        await this.initializeCalendarData(this.booking);

        runInAction(() => {
            if (this.isNoAvailableDates) {
                this.isError = true;
            }
        });
    };

    @action initializeCalendarData = async (booking: IBookingInfo): Promise<void> => {
        this.initCalendarSearchDates();

        // Set initial booking dates
        this.setInitialDates(booking);

        // If there are no selected dates (when coming back from payment page) set them to offer dates
        if (!this.selectedDates.length) {
            this.setDates([new Date(this.offer?.accom.date ?? booking.package.accom.startDate)]);
        }

        // Fetching available dates based on booking dates
        await this.getAvailableDates(this.calendarStartDate, this.calendarEndDate, this.numberOfNights);

        this.setIsCalendarAvailabilityChecked(true);

        this.setSelectedDatesIfAvailable();

        // Set month for month picker
        this.setSelectedMonth(this.selectedDepartureDate!);
    };

    @action onAmendDatesButtonClick = async (): Promise<void> => {
        this.isInitialDataLoading = true;
        this.booking = deepClone(this.rootStore.viewBookingStore.booking);

        if (!this.booking) {
            return;
        }

        await this.initializeCalendarData(this.booking);

        if (this.isNoAvailableDates || this.isError) {
            return;
        }

        this.rootStore.routerStore.redirectToAmendDatesPage();
    };

    @action deselectDates = (): void => {
        this.setSelectedDepartureDate(null);
        this.setSelectedArrivalDate(null);
    };

    @action initCalendarSearchDates = (): void => {
        const todayDate = new Date();
        const endDate = new Date();
        this.calendarStartDate = todayDate;

        const numberOfMonths =
            // We add 1 to the number of months so we can have the last month unavailable
            // But in this sequence we include current month as well
            Number(this.rootStore.layoutStore.getSetting(SiteSettings.AmendDatesSearchDuration)) ||
            DEFAULT_NUMBER_OF_MONTHS_FOR_DATES_RANGE;

        endDate.setMonth(endDate.getMonth() + numberOfMonths);
        this.calendarEndDate = endDate;
    };

    @action setSelectedDatesIfAvailable = (): void => {
        const chosenDepDate = this.selectedDates[0] || this.initialDepartureDate;
        const chosenArrDate = this.selectedDates[1] || this.initialArrivalDate;
        const isChosenDateAvailable = this.availableDates?.includes(formatDateL10n(chosenDepDate, 'YYYY-MM-DD'));

        runInAction(() => {
            if (!isChosenDateAvailable) {
                this.setSelectedDatesToInitialDates();
                this.isInitialDataLoading = false;

                return;
            }

            // Set chosen dates
            this.setSelectedDepartureDate(chosenDepDate);
            this.setSelectedArrivalDate(chosenArrDate);

            this.isInitialDataLoading = false;
        });
    };

    getAvailableMonths = (availableDates: string[], calendarEndDate: Date): string[] => {
        const availableMonths: string[] = [];

        availableDates.forEach(date => {
            const parsedDate = dayjs(date);
            const month = parsedDate.month();
            const year = parsedDate.year();

            // If month is already in the available months list, skip it, we only need one date per month
            if (availableMonths.some(m => m === new Date(year, month, 1).toDateString())) {
                return;
            }

            // We always want to have 1 month unavailable at the end of the calendar
            if (month === calendarEndDate.getMonth() && year === calendarEndDate.getFullYear()) {
                return;
            }

            // If month is not in the available months list, add it
            availableMonths.push(new Date(year, month, 1).toDateString());
        });

        return availableMonths;
    };

    getAvailableDatesList = (dates: { date: string; isAvailable: boolean }[]): string[] =>
        dates
            .filter(({ isAvailable, date }) => {
                const parsedDate = dayjs(date);

                // Always show initial departure date as available
                if (parsedDate.isSame(this.initialDepartureDate, 'day')) {
                    return true;
                }

                const month = parsedDate.month();
                const year = parsedDate.year();
                const isTheLatestMonth =
                    month === this.calendarEndDate.getMonth() && year === this.calendarEndDate.getFullYear();

                return isAvailable && !isTheLatestMonth;
            })
            .map(({ date }) => date);

    @action getAvailableDates = async (
        startInitialDate: Date,
        endInitialDate: Date,
        duration: number | string,
    ): Promise<void> => {
        this.setAvailableDates(null);
        this.setIsNoAvailableDates(false);

        try {
            const startDate = formatDateToQuery(startInitialDate);
            const endDate = formatDateToQuery(endInitialDate);

            const accommodationId = this.booking?.package.accom.code ?? '';
            const departure = getRouteByDirection(this.booking?.package.transport.routes || []).outbound?.depPt ?? '';
            const rooms = getRoomDetailsForAmendDates(this.booking);

            this.datesRequest = bookingService.getAvailableAmendDates({
                startDate,
                endDate,
                accommodationId,
                departure,
                rooms,
                duration: String(duration),
            });

            const availableDatesResponse = await this.datesRequest;

            if (!availableDatesResponse.availableHoliday) {
                this.rootStore.trackingStore.trackCustomError('NoDatesError', 'Sorry, No Dates Available');
                this.setIsNoAvailableDates(true);

                return;
            }

            const availableDates: string[] = this.getAvailableDatesList(availableDatesResponse.amendDates);

            const availableMonths = this.getAvailableMonths(availableDates, this.calendarEndDate);

            this.setAvailableDates(availableDates);
            this.setAvailableMonths(availableMonths);
        } catch (err) {
            runInAction(() => {
                this.isError = true;
            });
        }
    };

    @action refreshAvailableDates = async (startDate?: Nullable<Date>): Promise<void> => {
        const prevSelectedMonth = this.selectedMonth;

        this.setIsSelectedDatesUnavailable(false);

        if (startDate) {
            this.setDates([new Date(startDate)]);
        } else {
            this.setSelectedDatesToInitialDates();
        }

        await this.getAvailableDates(this.calendarStartDate, this.calendarEndDate, this.numberOfNights);

        // After unsuccessful date validation, and  selecting a default date,
        // we should scroll to the month whitch was previosly selected.
        // setTimeout is needed because Calendar useEffects races
        setTimeout(() => {
            this.setSelectedMonth(new Date(prevSelectedMonth));
        });

        runInAction(() => {
            if (this.isNoAvailableDates) {
                this.isError = true;
            }
        });
    };

    @action onChangeDatesAmendFlightClick = async (): Promise<void> => {
        if (!this.booking) {
            this.redirectFromAmendDatesPageIfNoBooking();

            return;
        }

        this.rootStore.trackingStore.trackGenericAmendmentActionWithGuests(
            AmendEventActions.ChangeDates,
            AmendEventLabels.EditProducts,
            {
                genericValue1: AmendEventLabels.ChangeFlights,
            },
        );
        await this.rootStore.amendFlightsStore.startAmendBookingFlights(this.booking, AmendScenarios.FromChangeDate);
    };

    @action clearStore = (): void => {
        this.setAvailableDates(null);
        this.isError = false;
        this.datesRequest = null;
        this.booking = null;

        this.offerWithPrices = null;
        this.transfer.clearStore();
        this.isInitialDataLoading = false;
        this.setIsNoAvailableDates(false);
        this.deselectDates();
        this.flights.clearStore();
        this.setIsSummaryRequestError(false);
        this.setIsValidatedOfferUnavailable(false);
        this.extraLuggage.setExtraLuggageInfo(null);
        this.setPrevOfferWithPrices(null);
        this.setValidatedSeatsToSeatMap(this.rootStore.viewBookingStore.booking?.seatSelection);
    };

    onDayCreate: flatpickr.Options.Hook = (dayElement, date, instance, dayElem) => {
        const parsedDate = dayjs(dayElem.dateObj);
        const queryDate = parsedDate.format(DATE_FORMATS.query);

        if (!this.availableMonths?.includes(new Date(parsedDate.year(), parsedDate.month(), 1).toDateString())) {
            dayElem.classList.add('notAllowedMonth');
        }

        if (!this.availableDates?.includes(queryDate)) {
            dayElem.classList.add('notAllowed');
        }
    };

    @action redirectFromAmendDatesPageIfNoBooking = (): void => {
        if (!this.rootStore.viewBookingStore.booking) {
            const url =
                this.rootStore.layoutStore.getSetting(SiteSettings.AmendDatesRedirectPage)?.value?.href ||
                SitePath.ViewBookings;

            this.clearStore();
            this.rootStore.routerStore.redirectTo(url);
        }
    };

    initializeAmendDatesPaymentPage = async (booking: IBookingInfo, offer: IAmendDatesResponseItem): Promise<void> => {
        this.booking = booking;
        const validatedOffer = await bookingService.getAmendDatesValidatedOffer(offer);

        runInAction(() => {
            this.setOfferWithPrices(validatedOffer);

            if (validatedOffer?.isSeatsUnavailable) {
                this.seats.setIsSeatNoLongerAvailable(true);
                // Remove seat selection from offer for when going back to summary
                this.rootStore.amendPaymentStore.amendPaymentPayload!.amendDatesOffer =
                    clearSeatSelectionFromOffer(validatedOffer);
            }
        });
    };

    @action setOfferWithPrices = (offerWithPrices: IAmendDatesResponseItem): void => {
        this.offerWithPrices = offerWithPrices;
        this.extraLuggage.setExtraLuggageInfo(offerWithPrices?.offer?.extraLuggageInfo);
        this.setIsValidatedOfferUnavailable(!this.offerWithPrices);
    };

    @action confirmChosenDates = (): void => {
        this.rootStore.amendTransfersStore.clearStore();
        this.rootStore.amendFlightsStore.clearStore();
        this.rootStore.amendSeatsStore.clearStore();
        const { billingInfo } = this.rootStore.userStore;
        const baseUrl = this.rootStore.layoutStore.basePath + SitePath.AmendPayment;
        const separator = baseUrl.includes('?') ? '&' : '?';

        const ecpSuffix = this.rootStore.queryParamsStore.isFlightPlusHotelFunnel
            ? `${separator}${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`
            : '';

        submitForm<IAmendDatesSubmitPayload>(`${baseUrl}${ecpSuffix}`, SubmitPayload.AmendPaymentInfo, {
            ...getBookingPayload(this.booking!),
            billingInfo,
            amendDatesOffer: this.offerWithPrices!,
        });
        this.rootStore.trackingStore.setPreviousPage();
        this.rootStore.trackingStore.trackDateChangeConfirmAction(EventTypes.PostBookingChangeDatesUpdate);
    };

    @action setInitialDates = (booking?: IBookingInfo): void => {
        const bookingData = booking || this.booking;

        if (!bookingData) {
            return;
        }

        const { startDate, endDate } = bookingData.package.accom;
        this.setInitialDepartureDate(new Date(startDate));
        this.setInitialArrivalDate(new Date(endDate));
    };

    initializeSummaryPageFromPayload = async (): Promise<void> => {
        const {
            appStore: { amendBookingItemPayload },
            viewBookingStore: { initBookingFromPayload },
        } = this.rootStore;

        await initBookingFromPayload(async booking => {
            if (!amendBookingItemPayload?.amendDatesOffer) {
                return;
            }

            try {
                this.setPrevOfferWithPrices(amendBookingItemPayload.amendDatesOffer);

                const offerWithPrices = await bookingService.getAmendDatesValidatedOffer(
                    amendBookingItemPayload.amendDatesOffer,
                );

                this.setOfferWithPrices(offerWithPrices);
            } catch (e) {
                runInAction(() => {
                    this.offerWithPrices = amendBookingItemPayload.amendDatesOffer;
                    this.isSummaryRequestError = true;
                });
            }

            runInAction(() => {
                this.booking = booking;
                this.setInitialDates();
                this.setValidatedSeatsToSeatMap(this.offerWithPrices?.offer.seatSelection);
                // Clear booking item payload here so it doesn't interfere with flight or transfer amendments
                this.rootStore.appStore.setAmendBookingItemPayload(undefined);
            });
        });
    };

    @action setValidatedSeatsToSeatMap = (seatSelection?: ISelectedSeat[]): void => {
        this.rootStore.seatMapStore.setValidatedSelectedSeats(seatSelection || []);
    };

    @action submitDates = async (): Promise<void> => {
        if (!this.booking || !this.selectedDepartureDate) return;

        const { inbound, outbound } = getRouteByDirection(this.booking.package?.transport?.routes);

        // Set month so we can come back to it if we need to
        this.setSelectedMonth(this.selectedDepartureDate);

        this.isSubmitDatesLoading = true;
        this.submitDatesCancelToken = Axios.CancelToken.source();

        try {
            const response = await bookingService.getAmendDatesBooking(
                {
                    bookingRef: this.booking.bookingReference,
                    selectedDate: formatDateToQuery(this.selectedDepartureDate),
                    boardType: this.booking.package.accom.rooms[0].board,
                    transferCode: this.booking.transfers[0].code,
                    duration: this.numberOfNights,
                    accomId: this.booking.package.accom.code,
                    rooms: getRoomDetailsForAmendDates(this.booking),
                    outboundDepTime: outbound?.depDate ?? '',
                    inboundDepTime: inbound?.depDate ?? '',
                },
                this.submitDatesCancelToken.token,
            );

            if (!response.offer) {
                throw new Error();
            }

            const { extraLuggageInfo } = response.offer;

            if (extraLuggageInfo) {
                this.extraLuggage.setExtraLuggageInfo(extraLuggageInfo);
            }

            this.setOfferWithPrices(response);
            this.setValidatedSeatsToSeatMap(this.offerWithPrices?.offer.seatSelection);

            this.rootStore.trackingStore.trackGenericAmendmentActionWithGuests(
                AmendEventActions.ViewBooking,
                AmendEventLabels.NewDateSelection,
                {
                    genericValue1: formatDateToQuery(this.selectedDepartureDate),
                    genericValue2: formatDateToQuery(this.selectedArrivalDate),
                },
            );

            // If original booking parameters and offer has difference
            if (response.unhappyPathOffer) {
                this.rootStore.trackingStore.trackCustomError(
                    GenericValues.NoMatchingDates,
                    GenericValues.AlternativeAvailable,
                );
                this.setIsAlternativePackagePopupShown(true);

                return;
            }

            this.rootStore.routerStore.redirectToAmendDatesSummaryPage();
        } catch (e) {
            if (Axios.isCancel(e)) {
                return;
            }

            if (e?.response?.status === HttpStatusCodes.BadRequest) {
                this.setIsSelectedDatesUnavailable(true);

                return;
            }

            this.isError = true;
        } finally {
            this.isSubmitDatesLoading = false;
            this.breakSubmitRequest();
        }
    };

    @action setDates = ([startDate]: Date[]): Nullable<Date[]> => {
        if (!startDate) {
            this.setSelectedDepartureDate(null);
            this.setSelectedArrivalDate(null);

            return null;
        }

        const endDate = new Date(startDate);

        endDate.setDate(startDate.getDate() + this.numberOfNights);

        this.setSelectedDepartureDate(startDate);
        this.setSelectedArrivalDate(endDate);

        return [startDate, endDate];
    };

    @action setInitialDepartureDate = (date: Date): void => {
        this.initialDepartureDate = date;
    };

    @action setInitialArrivalDate = (date: Date): void => {
        this.initialArrivalDate = date;
    };

    @action setSelectedDepartureDate = (date: Nullable<Date>): void => {
        this.selectedDepartureDate = date;
    };

    @action setSelectedArrivalDate = (date: Nullable<Date>): void => {
        this.selectedArrivalDate = date;
    };

    @action setSelectedDatesToInitialDates = (): void => {
        this.setSelectedDepartureDate(this.initialDepartureDate);
        this.setSelectedArrivalDate(this.initialArrivalDate);
    };

    @action setIsCalendarAvailabilityChecked = (value: boolean): void => {
        this.isCalendarAvailabilityChecked = value;
    };

    @action setSelectedMonth = (date: Date): void => {
        const monthDate = new Date(date);
        monthDate.setDate(1);
        this.selectedMonth = monthDate;
    };

    @action setAvailableDates = (dates: Nullable<string[]>): void => {
        this.availableDates = dates;
    };

    @action setIsValidatedOfferUnavailable = (value: boolean): void => {
        this.isValidatedOfferUnavailable = value;
    };

    @action setIsNoAvailableDates = (isNoAvailableDates: boolean): void => {
        this.isNoAvailableDates = isNoAvailableDates;
    };

    @action setAvailableMonths = (months: Nullable<string[]>): void => {
        this.availableMonths = months;
    };

    @action setIsSelectedDatesUnavailable = (isUnavailable: boolean): void => {
        this.isSelectedDatesUnavailable = isUnavailable;
    };

    @action setIsSummaryRequestError = (value: boolean): void => {
        this.isSummaryRequestError = value;
    };

    @action setIsAlternativePackagePopupShown = (value: boolean): void => {
        this.isAlternativePackagePopupShown = value;
    };

    @action setPrevOfferWithPrices = (offer: Nullable<IAmendDatesResponseItem>): void => {
        this.prevOfferWithPrices = offer;
    };

    @computed get allowanceRestrictions(): TAmendDatesRestrictions {
        const { amendBookingStatuses } = this.rootStore.viewBookingStore;

        return {
            byOutOfSync: amendBookingStatuses.includes(AmendBookingStatus.AmendDateDisabledByOutOfSync),
            byDisruption: amendBookingStatuses.includes(AmendBookingStatus.ChangeDateDisabledByFlightDisruption),
            byTimeBound: amendBookingStatuses.includes(AmendBookingStatus.ChangeDateDisabledByTimeBound),
            byAirportParking: amendBookingStatuses.includes(AmendBookingStatus.ChangeDateDisabledByAirportParking),
        };
    }

    @computed get amendCTAState(): TAmendCTAState {
        const { byOutOfSync, byDisruption, byTimeBound, byAirportParking } = this.allowanceRestrictions;
        const { byFlightManifested } = this.rootStore.amendFlightsStore.allowanceRestrictions;
        const {
            booking,
            amendBookingStatuses,
            isLeadLoggedIn,
            extraLuggage,
            allowanceRestrictions: { byExternalAgency },
        } = this.rootStore.viewBookingStore;

        if (!booking || byTimeBound) {
            return { isVisible: false };
        }

        if (
            byDisruption ||
            byOutOfSync ||
            byFlightManifested ||
            byExternalAgency ||
            byAirportParking ||
            extraLuggage.sportEquipmentNumber
        ) {
            return { isVisible: true, isDisabled: true };
        }

        if (isLeadLoggedIn && booking.amendmentInfo?.changeDates) {
            return { isVisible: true };
        }

        if (!hasIntersection(amendBookingStatuses, amendDatesDisableErrors)) {
            return { isVisible: true };
        }

        return { isVisible: false };
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get offerPrices(): Nullable<IAmendDatesOfferPrices> {
        if (!this.offerWithPrices) {
            return null;
        }

        const {
            bookingPrice,
            offerPrice,
            amendmentDatesCharges,
            amendmentDatesFees,
            amendmentFlowCharges,
            discountCode,
            amendmentPaymentInfo,
        } = this.offerWithPrices;

        return {
            bookingPrice,
            offerPrice,
            amendmentDatesCharges,
            amendmentDatesFees,
            amendmentFlowCharges,
            discountCode,
            amendmentPaymentInfo,
        };
    }

    @computed get offer(): IOffer | undefined {
        return this.offerWithPrices?.offer;
    }

    @computed get numberOfNights(): number {
        if (!this.initialDepartureDate || !this.initialArrivalDate) {
            return 0;
        }

        return getDaysDifference(this.initialArrivalDate, this.initialDepartureDate);
    }

    @computed get availableMonthsDate(): string[] {
        return this.availableMonthsDate.map(Date);
    }

    @computed get initialDates(): Date[] {
        return [
            ...(this.initialDepartureDate ? [this.initialDepartureDate] : []),
            ...(this.initialArrivalDate ? [this.initialArrivalDate] : []),
        ];
    }

    @computed get selectedDates(): Date[] {
        return [
            ...(this.selectedDepartureDate ? [this.selectedDepartureDate] : []),
            ...(this.selectedArrivalDate ? [this.selectedArrivalDate] : []),
        ];
    }

    @computed get isDatesChanged(): boolean {
        if (!this.selectedDepartureDate || !this.selectedArrivalDate) return false;

        return (
            this.initialDepartureDate?.toDateString() !== this.selectedDepartureDate?.toDateString() ||
            this.initialArrivalDate?.toDateString() !== this.selectedArrivalDate?.toDateString()
        );
    }

    @computed get guestsCounts(): Record<GuestType, number> {
        let units;

        if (this.booking && this.offer) {
            units = this.offer.accom.unit;
        }

        return getAccommodationGuestsCount(units);
    }

    @computed get outboundFlight(): IRoute | undefined {
        return this.offer?.transport.routes[0];
    }

    @computed get inboundFlight(): IRoute | undefined {
        return this.offer?.transport.routes[1];
    }

    @computed get totalPrice(): number {
        return this.offerPrices?.amendmentDatesCharges ?? 0;
    }

    @computed get promocodeBreakdown(): IAmendBookingPromoBreakDown | undefined {
        return this.offerWithPrices?.promoCodeBreakDown;
    }

    @computed get feePP(): Nullable<number> {
        return this.offerPrices?.amendmentPaymentInfo?.feesPerPersons?.[0]?.feesPerPersonAmount;
    }
}

export default AmendDatesStore;
