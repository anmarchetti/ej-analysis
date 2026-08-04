import Axios from 'axios';

import {
    createMockStores,
    mockAmendBookingPayload,
    mockAmendDatesOffer,
    mockAmendDatesOfferWithPrice,
    mockAmendPaymentInfo,
    mockBillingInfo,
    mockBooking,
    mockFlightsOffers,
    mockInboundFlight,
    mockOutboundFlight,
    userLoginMockInfo,
} from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { submitForm } from 'frontend/utils/submitForm';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { GuestType } from 'models/enum/GuestType';
import HttpStatusCodes from 'models/enum/HttpStatusCodes';
import SitePath from 'models/enum/SitePath';

import AmendDatesStore from './AmendDatesStore';
import { amendDatesDisableErrors } from './AmendDatesStore.utils';
import MockedFn = jest.MockedFn;

import { extraLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import { AmendEventActions, AmendEventLabels, GenericValues } from 'models/data/tracking/AmendEvent';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { EventTypes } from 'models/enum/tracking/EventTypes';

jest.mock('frontend/utils/submitForm', () => ({
    __esModule: true,
    submitForm: jest.fn(),
}));
jest.mock('frontend/services/booking.service');

const createAmendDatesStore = () =>
    new AmendDatesStore(
        createMockStores({
            routerStore: {
                redirectToAmendDatesPage: jest.fn(),
                redirectToAmendDatesSummaryPage: jest.fn(),
            },
            trackingStore: {
                trackDateChangeConfirmAction: jest.fn(),
                setPreviousPage: jest.fn(),
            },
            amendFlightsStore: {
                startAmendBookingFlights: jest.fn(),
                setScenario: jest.fn(),
                clearStore: jest.fn(),
                allowanceRestrictions: {
                    byFlightManinfested: false,
                },
            },
            amendTransfersStore: {
                setScenario: jest.fn(),
                clearStore: jest.fn(),
                isAmendCTAVisible: true,
            },
            viewBookingStore: {
                initBookingFromPayload: jest.fn().mockImplementation(cb => cb(mockBooking)),
                amendBookingStatuses: [],
                extraLuggage: {
                    SportEquipmentNumber: 0,
                },
            },
            userStore: {
                userData: userLoginMockInfo,
                billingInfo: mockBillingInfo,
            },
            amendSeatsStore: {
                clearStore: jest.fn(),
            },
            layoutStore: {
                basePath: '',
            },
            queryParamsStore: {
                isFlightPlusHotelFunnel: false,
            },
            amendPaymentStore: {
                amendPaymentPayload: {},
            },
            appStore: {
                setAmendBookingItemPayload: jest.fn(),
            },
            seatMapStore: {
                setValidatedSelectedSeats: jest.fn(),
            },
        }),
    );

let amendDatesStore: AmendDatesStore;

jest.mock('frontend/utils/submitForm');
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        CancelToken: {
            source: jest.fn(() => ({ token: 'token', cancel: jest.fn() })),
        },
        isCancel: jest.fn(),
    },
}));

describe('AmendDatesStore', () => {
    beforeEach(() => {
        amendDatesStore = createAmendDatesStore();
    });

    describe('setInitialDates', () => {
        it('Should set dates methods be called with booking passed in params', () => {
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();
            const { startDate, endDate } = mockBooking.package.accom;

            amendDatesStore.setInitialDates(mockBooking);

            expect(amendDatesStore.setInitialDepartureDate).toHaveBeenCalledWith(new Date(startDate));
            expect(amendDatesStore.setInitialArrivalDate).toHaveBeenCalledWith(new Date(endDate));
        });

        it('Should set dates methods be called', () => {
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();
            amendDatesStore.booking = mockBooking;
            const { startDate, endDate } = amendDatesStore.booking.package.accom;

            amendDatesStore.setInitialDates();

            expect(amendDatesStore.setInitialDepartureDate).toHaveBeenCalledWith(new Date(startDate));
            expect(amendDatesStore.setInitialArrivalDate).toHaveBeenCalledWith(new Date(endDate));
        });

        it('Should NOT been called if no booking in store', () => {
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();

            amendDatesStore.setInitialDates();

            expect(amendDatesStore.setInitialDepartureDate).not.toHaveBeenCalled();
            expect(amendDatesStore.setInitialArrivalDate).not.toHaveBeenCalled();
        });
    });

    describe('breakSubmitRequest', () => {
        it('It should invoke the cancel token and clear the property', () => {
            const mockCancel = jest.fn();
            (Axios.CancelToken.source as MockedFn<any>) = jest.fn(() => ({ token: 'token', cancel: mockCancel }));
            amendDatesStore.submitDatesCancelToken = Axios.CancelToken.source();
            amendDatesStore.breakSubmitRequest();

            expect(mockCancel).toHaveBeenCalled();
            expect(amendDatesStore.submitDatesCancelToken).toBeNull();
        });
    });

    describe('confirmChosenDates', () => {
        it('Clear all related stores and invoke submitForm function and track action', () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            amendDatesStore.confirmChosenDates();

            expect(amendDatesStore.rootStore.amendTransfersStore.clearStore).toHaveBeenCalled();
            expect(amendDatesStore.rootStore.amendFlightsStore.clearStore).toHaveBeenCalled();
            expect(amendDatesStore.rootStore.amendSeatsStore.clearStore).toHaveBeenCalled();
            expect(amendDatesStore.rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment',
                'amend-payment-payload',
                expect.objectContaining({
                    amendDatesOffer: mockAmendDatesOfferWithPrice,
                    billingInfo: {
                        fullName: mockBillingInfo.fullName,
                        address: userLoginMockInfo.address1,
                        address2: userLoginMockInfo.address2,
                        city: userLoginMockInfo.city,
                        postCode: userLoginMockInfo.postalCode,
                    },
                }),
            );
            expect(amendDatesStore.rootStore.trackingStore.trackDateChangeConfirmAction).toHaveBeenCalledWith(
                EventTypes.PostBookingChangeDatesUpdate,
            );
        });

        it('submitForm should be called without billing info when billingInfo is not defined', () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            (amendDatesStore.rootStore.userStore as any).billingInfo = undefined;
            amendDatesStore.confirmChosenDates();

            expect(submitForm).toHaveBeenCalledWith('/booking/amend-payment', 'amend-payment-payload', {
                ...getBookingPayload(mockBooking),
                amendDatesOffer: mockAmendDatesOfferWithPrice,
            });
        });

        it('should append ?ecp=fph to amend-payment url when in FPH funnel', () => {
            (amendDatesStore.rootStore as any).queryParamsStore = {
                ...amendDatesStore.rootStore.queryParamsStore,
                isFlightPlusHotelFunnel: true,
            };
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            amendDatesStore.confirmChosenDates();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment?ecp=fph',
                'amend-payment-payload',
                expect.objectContaining({
                    amendDatesOffer: mockAmendDatesOfferWithPrice,
                }),
            );
        });
    });

    describe('initAmendDatesPage', () => {
        it('Set booking and redirect to the appropriate page', async () => {
            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.booking?.bookingReference).toBe(mockBooking.bookingReference);
        });

        it('Should skip availability check if it has been already done', async () => {
            amendDatesStore.isCalendarAvailabilityChecked = true;
            amendDatesStore.initializeCalendarData = jest.fn();
            amendDatesStore.setSelectedDatesIfAvailable = jest.fn();
            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.setSelectedDatesIfAvailable).toHaveBeenCalled();
            expect(amendDatesStore.initializeCalendarData).not.toHaveBeenCalled();
        });

        it('Redirect if no booking in ViewBookingStore', async () => {
            amendDatesStore.rootStore.viewBookingStore.booking = null;
            amendDatesStore.redirectFromAmendDatesPageIfNoBooking = jest.fn();
            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.redirectFromAmendDatesPageIfNoBooking).toHaveBeenCalled();
        });

        it('Call initializeCalendarData if availability has not been checked', async () => {
            amendDatesStore.isCalendarAvailabilityChecked = false;
            amendDatesStore.initializeCalendarData = jest.fn();

            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.initializeCalendarData).toHaveBeenCalled();
        });

        it('Should set isError if no avaiable dates', async () => {
            amendDatesStore.isNoAvailableDates = true;

            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.isError).toBe(true);
        });

        it('Should handle amendBookingItemPayload when it exists', async () => {
            amendDatesStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            amendDatesStore.setInitialDates = jest.fn();
            amendDatesStore.rootStore.appStore.setAmendBookingItemPayload = jest.fn();
            amendDatesStore.rootStore.viewBookingStore.initBookingFromPayload = jest
                .fn()
                .mockImplementation(cb => cb(mockBooking));

            await amendDatesStore.initAmendDatesPage();

            expect(amendDatesStore.setInitialDates).toHaveBeenCalled();
            expect(amendDatesStore.rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(amendDatesStore.rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalled();
            expect(amendDatesStore.booking).toStrictEqual(mockBooking);
        });
    });

    describe('initializeCalendarData', () => {
        it('Set initial dates and invoke getAvailableDates', async () => {
            await amendDatesStore.initializeCalendarData(mockBooking);

            const bookingStartDate = new Date(mockBooking.package.accom.startDate);
            const bookingEndDate = new Date(mockBooking.package.accom.endDate);
            const bookingMonth = new Date(bookingStartDate);
            bookingMonth.setDate(1);

            expect(amendDatesStore.initialDepartureDate).toEqual(bookingStartDate);
            expect(amendDatesStore.initialArrivalDate).toEqual(bookingEndDate);
            expect(amendDatesStore.selectedDepartureDate).toEqual(bookingStartDate);
            expect(amendDatesStore.selectedArrivalDate).toEqual(bookingEndDate);
            expect(amendDatesStore.isCalendarAvailabilityChecked).toBe(true);
            expect(amendDatesStore.selectedMonth).toEqual(bookingMonth);
        });

        it('If no selected dates, set them from offer', async () => {
            amendDatesStore.selectedDepartureDate = null;
            amendDatesStore.selectedArrivalDate = null;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            amendDatesStore.setSelectedDatesIfAvailable = jest.fn();

            await amendDatesStore.initializeCalendarData(mockBooking);

            expect(amendDatesStore.selectedDates[0]).toEqual(new Date(mockFlightsOffers[0].accom.date));
        });

        it('Set selected dates from booking if no offer', () => {
            amendDatesStore.offerWithPrices = null;
            amendDatesStore.setSelectedDatesIfAvailable = jest.fn();

            amendDatesStore.initializeCalendarData(mockBooking);

            expect(amendDatesStore.selectedDates[0]).toEqual(new Date(mockBooking.package.accom.startDate));
        });
    });

    describe('onAmendDatesButtonClick', () => {
        it('Set booking and redirect to the appropriate page', async () => {
            amendDatesStore.initializeCalendarData = jest.fn();

            await amendDatesStore.onAmendDatesButtonClick();

            expect(amendDatesStore.initializeCalendarData).toHaveBeenCalled();

            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesPage).toHaveBeenCalled();
        });

        it('Should not redirect if no booking', async () => {
            amendDatesStore.rootStore.viewBookingStore.booking = null;
            await amendDatesStore.onAmendDatesButtonClick();

            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesPage).not.toHaveBeenCalled();
        });

        it('Should not redirect if no available dates', () => {
            amendDatesStore.isNoAvailableDates = true;
            amendDatesStore.onAmendDatesButtonClick();

            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesPage).not.toHaveBeenCalled();
        });

        it('Should not redirect if error', () => {
            amendDatesStore.isError = true;
            amendDatesStore.onAmendDatesButtonClick();

            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesPage).not.toHaveBeenCalled();
        });
    });

    describe('initCalendarSearchDates', () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        });

        it('Set calendarStartDate and calendarEndDate for default 18 months', () => {
            amendDatesStore.initCalendarSearchDates();
            const endDate = new Date();

            endDate.setMonth(endDate.getMonth() + 18);

            expect(amendDatesStore.calendarStartDate).toEqual(new Date('2020-01-01'));
            expect(amendDatesStore.calendarEndDate).toEqual(endDate);
        });

        it('Set calendarStartDate and calendarEndDate for 12 months', () => {
            amendDatesStore.rootStore.layoutStore.getSetting = jest.fn(() => 12);
            amendDatesStore.initCalendarSearchDates();
            const endDate = new Date();

            endDate.setMonth(endDate.getMonth() + 12);

            expect(amendDatesStore.calendarStartDate).toEqual(new Date('2020-01-01'));
            expect(amendDatesStore.calendarEndDate).toEqual(endDate);
        });
    });

    describe('Amend CTA State', () => {
        it('Visible when lead passenger and allow in viewBooking', () => {
            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
        });

        it('Visible if only non-lead passenger logged in', () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.booking.isLoggedInAsLeadPassenger = false;
            amendDatesStore.booking.amendmentInfo!.amendBookingStatus = [];
            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
        });

        it('Not visible if non-lead passenger logged in and status contain disabled code', () => {
            amendDatesStore.rootStore.viewBookingStore.booking!.isLoggedInAsLeadPassenger = false;
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [amendDatesDisableErrors[0]];

            expect(amendDatesStore.isAmendCTAVisible).toBe(false);
        });

        it('Visible but disabled if disrupted booking', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.ChangeDateDisabledByFlightDisruption];
            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
            expect(amendDatesStore.isAmendCTADisabled).toBe(true);
        });

        it('Visible but disabled for Trade Booking', () => {
            amendDatesStore.rootStore.viewBookingStore.allowanceRestrictions.byExternalAgency = true;

            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
            expect(amendDatesStore.isAmendCTADisabled).toBe(true);
        });

        it('Visible but disabled for out of sync error', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendDateDisabledByOutOfSync];

            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
            expect(amendDatesStore.isAmendCTADisabled).toBe(true);
        });

        it('Visible but disabled for manifested flights', () => {
            amendDatesStore.rootStore.amendFlightsStore.allowanceRestrictions.byFlightManifested = true;

            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
            expect(amendDatesStore.isAmendCTADisabled).toBe(true);
        });

        it('Visible but disabled for bookings with sports equipment', () => {
            amendDatesStore.rootStore.viewBookingStore.extraLuggage = {
                sportEquipmentNumber: 5,
            } as ExtraLuggage;

            expect(amendDatesStore.isAmendCTAVisible).toBe(true);
            expect(amendDatesStore.isAmendCTADisabled).toBe(true);
        });
    });

    describe('setDates', () => {
        it('set departure and arrival dates and return them for use in calendar', () => {
            const departureDate = new Date();
            const arrivalDate = new Date(departureDate);
            arrivalDate.setDate(departureDate.getDate() + amendDatesStore.numberOfNights);
            const returnedDates = amendDatesStore.setDates([departureDate]);

            expect(amendDatesStore.selectedDepartureDate).toBe(departureDate);
            expect(amendDatesStore.selectedArrivalDate?.toString()).toBe(arrivalDate.toString());
            expect(returnedDates).toEqual([departureDate, arrivalDate]);
        });

        it('set to null if no dates are passed', () => {
            amendDatesStore.setDates([null, null] as any);

            expect(amendDatesStore.selectedDepartureDate).toBe(null);
            expect(amendDatesStore.selectedArrivalDate).toBe(null);
        });
    });

    describe('setSelectedMonth', () => {
        it('Should set date with first date of month', () => {
            const date = new Date('2020-11-13');
            amendDatesStore.setSelectedMonth(date);

            expect(amendDatesStore.selectedMonth.getDate()).toBe(1);
            expect(amendDatesStore.selectedMonth.getFullYear()).toBe(2020);
            expect(amendDatesStore.selectedMonth.getMonth()).toBe(10);
        });
    });

    describe('get currentDates', () => {
        it('return departure and arrival dates', async () => {
            await amendDatesStore.onAmendDatesButtonClick();
            await amendDatesStore.initAmendDatesPage();
            expect(amendDatesStore.initialDates).toEqual([
                new Date(mockBooking.package.accom.startDate),
                new Date(mockBooking.package.accom.endDate),
            ]);
        });

        it('return empty array if no dates', () => {
            expect(amendDatesStore.initialDates).toEqual([]);
        });
    });

    describe('numberOfNights', () => {
        it('return number of nights', async () => {
            await amendDatesStore.onAmendDatesButtonClick();
            await amendDatesStore.initAmendDatesPage();
            expect(amendDatesStore.numberOfNights).toBe(30);
        });

        it('return 0 if no dates', () => {
            expect(amendDatesStore.numberOfNights).toBe(0);
        });
    });

    describe('initiateSummaryPage', () => {
        it('Redirect when no booking has been applied', async () => {
            amendDatesStore.redirectFromAmendDatesPageIfNoBooking = jest.fn();
            await amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.redirectFromAmendDatesPageIfNoBooking).toHaveBeenCalled();
        });

        it('Redirect when no offer has been applied', async () => {
            amendDatesStore.redirectFromAmendDatesPageIfNoBooking = jest.fn();
            amendDatesStore.booking = mockBooking;
            await amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.redirectFromAmendDatesPageIfNoBooking).toHaveBeenCalled();
        });

        it('Invoke the transfer fetch and set availability as checked', async () => {
            amendDatesStore.transfer.getTransferOffers = jest.fn();
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;

            await amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.transfer.getTransferOffers).toHaveBeenCalled();
            expect(amendDatesStore.isCalendarAvailabilityChecked).toBe(false);
        });

        it('It should be invoked when a payload item exist', async () => {
            amendDatesStore.initializeSummaryPageFromPayload = jest.fn();
            amendDatesStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;

            await amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.initializeSummaryPageFromPayload).toHaveBeenCalled();
        });

        it('Redirect when changeDates is disallowed by the setting', async () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.booking.amendmentInfo!.changeDates = false;
            amendDatesStore.redirectFromAmendDatesPageIfNoBooking = jest.fn();
            await amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.redirectFromAmendDatesPageIfNoBooking).toHaveBeenCalled();
        });

        it('getTransferOffers should not be invoked', () => {
            amendDatesStore.transfer.getTransferOffers = jest.fn();
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;

            amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.transfer.getTransferOffers).not.toHaveBeenCalled();
        });

        it('Should clearStore from flights store be called', () => {
            amendDatesStore.flights.clearStore = jest.fn();

            amendDatesStore.initiateSummaryPage();

            expect(amendDatesStore.flights.clearStore).toHaveBeenCalled();
        });

        it('should call set scenarios for transfer and flight stores', async () => {
            const transfersStoreSetScenario = jest.spyOn(amendDatesStore.rootStore.amendTransfersStore, 'setScenario');
            const flightsStoreSetScenario = jest.spyOn(amendDatesStore.rootStore.amendTransfersStore, 'setScenario');

            await amendDatesStore.initiateSummaryPage();

            expect(transfersStoreSetScenario).toHaveBeenCalledWith(AmendScenarios.FromChangeDate);
            expect(flightsStoreSetScenario).toHaveBeenCalledWith(AmendScenarios.FromChangeDate);
        });
    });

    describe('getAvailableDates', () => {
        it('should update availableDates when service returns availableDates', async () => {
            const availableDates = [
                { date: '2023-06-28', isAvailable: true },
                { date: '2023-06-29', isAvailable: false },
            ];
            amendDatesStore.calendarEndDate = new Date('2023-12-30');

            (bookingService.getAvailableAmendDates as jest.Mock).mockResolvedValue({
                availableHoliday: true,
                amendDates: availableDates,
            });

            await amendDatesStore.getAvailableDates(
                new Date(availableDates[0].date),
                new Date(availableDates[1].date),
                7,
            );

            expect(amendDatesStore.availableDates).toEqual(['2023-06-28']);
            expect(amendDatesStore.isError).toBe(false);
        });

        it('should always set initial departure as available, even when API returns otherwise', async () => {
            const availableDates = [
                { date: '2023-06-27', isAvailable: false },
                { date: '2023-06-28', isAvailable: false },
                { date: '2023-06-29', isAvailable: false },
                { date: '2023-06-30', isAvailable: false },
            ];
            amendDatesStore.calendarEndDate = new Date('2023-12-30');
            amendDatesStore.initialDepartureDate = new Date('2023-06-27');

            (bookingService.getAvailableAmendDates as jest.Mock).mockResolvedValue({
                availableHoliday: true,
                amendDates: availableDates,
            });

            await amendDatesStore.getAvailableDates(
                new Date(availableDates[0].date),
                new Date(availableDates[3].date),
                7,
            );

            expect(amendDatesStore.availableDates).toEqual(['2023-06-27']);
        });

        it('should set isNoAvailableDates to true when no one date is available and track error', async () => {
            (bookingService.getAvailableAmendDates as jest.Mock).mockResolvedValue({
                availableHoliday: false,
                amendDates: [],
            });

            await amendDatesStore.getAvailableDates(new Date(), new Date(), 7);

            expect(amendDatesStore.isNoAvailableDates).toBe(true);
            expect(amendDatesStore.rootStore.trackingStore.trackCustomError).toHaveBeenCalledWith(
                'NoDatesError',
                'Sorry, No Dates Available',
            );
        });

        it('should set isError to true when an error is thrown', async () => {
            (bookingService.getAvailableAmendDates as jest.Mock).mockRejectedValue(new Error('service error'));

            await amendDatesStore.getAvailableDates(new Date(), new Date(), 7);

            expect(amendDatesStore.isError).toBe(true);
        });
    });

    describe('getAvailableDatesList', () => {
        beforeEach(() => {
            amendDatesStore.calendarEndDate = new Date('2023-12-30');
        });

        it('should return available dates list from amendDates response', () => {
            const availableDates = [
                { date: '2023-06-28', isAvailable: true },
                { date: '2023-06-29', isAvailable: false },
            ];

            expect(amendDatesStore.getAvailableDatesList(availableDates)).toEqual(['2023-06-28']);
        });

        it('should always set initial departure date as available, even when API returns otherwise', () => {
            const availableDates = [
                { date: '2023-06-27', isAvailable: false },
                { date: '2023-06-28', isAvailable: false },
                { date: '2023-06-29', isAvailable: false },
                { date: '2023-06-30', isAvailable: false },
            ];
            amendDatesStore.initialDepartureDate = new Date('2023-06-27');

            expect(amendDatesStore.getAvailableDatesList(availableDates)).toEqual(['2023-06-27']);
        });

        it('should return empty array when no dates are available', () => {
            const availableDates = [
                { date: '2023-06-28', isAvailable: false },
                { date: '2023-06-29', isAvailable: false },
            ];

            expect(amendDatesStore.getAvailableDatesList(availableDates)).toEqual([]);
        });

        it('should set dates as unavailable if they are in the last month of the calendar', () => {
            const availableDates = [
                { date: '2023-11-30', isAvailable: true },
                { date: '2023-12-01', isAvailable: true },
                { date: '2023-12-02', isAvailable: true },
            ];

            expect(amendDatesStore.getAvailableDatesList(availableDates)).toEqual(['2023-11-30']);
        });
    });

    test('should return correct initial dates', () => {
        const initialDepartureDate = new Date('2023-01-01');
        const initialArrivalDate = new Date('2023-01-02');

        amendDatesStore.initialDepartureDate = initialDepartureDate;
        amendDatesStore.initialArrivalDate = initialArrivalDate;

        expect(amendDatesStore.initialDates).toEqual([initialDepartureDate, initialArrivalDate]);
    });

    test('should return correct selected dates', () => {
        const selectedDepartureDate = new Date('2023-02-01');
        const selectedArrivalDate = new Date('2023-02-02');

        amendDatesStore.selectedDepartureDate = selectedDepartureDate;
        amendDatesStore.selectedArrivalDate = selectedArrivalDate;

        expect(amendDatesStore.selectedDates).toEqual([selectedDepartureDate, selectedArrivalDate]);
    });

    test('should correctly determine if dates have changed', () => {
        const initialDepartureDate = new Date('2023-01-01, 08:00:00');
        const initialArrivalDate = new Date('2023-01-02, 08:00:00');
        const selectedDepartureDate = new Date('2023-02-01');
        const selectedArrivalDate = new Date('2023-02-02');

        amendDatesStore.initialDepartureDate = initialDepartureDate;
        amendDatesStore.initialArrivalDate = initialArrivalDate;
        amendDatesStore.selectedDepartureDate = selectedDepartureDate;
        amendDatesStore.selectedArrivalDate = selectedArrivalDate;

        expect(amendDatesStore.isDatesChanged).toBe(true);

        amendDatesStore.selectedDepartureDate = new Date('2023-01-01');
        amendDatesStore.selectedArrivalDate = new Date('2023-01-02');

        expect(amendDatesStore.isDatesChanged).toBe(false);

        amendDatesStore.selectedDepartureDate = null;
        amendDatesStore.selectedArrivalDate = null;

        expect(amendDatesStore.isDatesChanged).toBe(false);
    });

    describe('redirectFromAmendDatesPageIfNoBooking', () => {
        it('redirect to the appropriate page', () => {
            amendDatesStore.rootStore.viewBookingStore.booking = null;
            amendDatesStore.redirectFromAmendDatesPageIfNoBooking();

            expect(amendDatesStore.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBookings);
        });
    });

    describe('guestsCounts', () => {
        it('Return passengers counts', () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;

            expect(amendDatesStore.guestsCounts[GuestType.Adult]).toBe(1);
            expect(amendDatesStore.guestsCounts[GuestType.Child]).toBe(2);
            expect(amendDatesStore.guestsCounts[GuestType.Infant]).toBe(1);
        });

        it('Return passengers counts as 0 without booking', () => {
            expect(amendDatesStore.guestsCounts[GuestType.Adult]).toBe(0);
            expect(amendDatesStore.guestsCounts[GuestType.Child]).toBe(0);
            expect(amendDatesStore.guestsCounts[GuestType.Infant]).toBe(0);
        });
    });

    describe('getAvailableMonths', () => {
        it('should return available months', () => {
            amendDatesStore.availableDates = ['2023-01-01', '2023-01-02', '2023-02-01', '2023-03-01'];

            expect(amendDatesStore.getAvailableMonths(amendDatesStore.availableDates, new Date('2023-10-23'))).toEqual([
                'Sun Jan 01 2023',
                'Wed Feb 01 2023',
                'Wed Mar 01 2023',
            ]);
        });

        it('should return empty array if no available dates', () => {
            amendDatesStore.availableDates = [];

            expect(amendDatesStore.getAvailableMonths(amendDatesStore.availableDates, new Date('2023-10-23'))).toEqual(
                [],
            );
        });

        it('should make last month of calendar unavailable even if it has available dates', () => {
            amendDatesStore.availableDates = ['2023-01-01', '2023-01-02', '2023-02-01', '2023-03-01'];

            expect(
                amendDatesStore.getAvailableMonths(amendDatesStore.availableDates, new Date('2023-03-01')),
            ).not.toContain('Wed Mar 01 2023');
        });
    });

    describe('refreshAvailableDates', () => {
        let initialDepartureDate;
        let initialArrivalDate;
        let endDate;

        beforeEach(() => {
            initialDepartureDate = new Date('2022-01-01');
            initialArrivalDate = new Date('2022-01-02');
            amendDatesStore.initialDepartureDate = initialDepartureDate;
            amendDatesStore.initialArrivalDate = initialArrivalDate;
            amendDatesStore.isSelectedDatesUnavailable = true;
            amendDatesStore.calendarStartDate = initialDepartureDate;
            endDate = new Date('2023-12-30');
            amendDatesStore.calendarEndDate = endDate;
            amendDatesStore.getAvailableDates = jest.fn();
            amendDatesStore.setSelectedMonth = jest.fn();
        });

        it('should refresh dates correctly', async () => {
            jest.useFakeTimers();

            await amendDatesStore.refreshAvailableDates();

            expect(amendDatesStore.isSelectedDatesUnavailable).toBe(false);
            expect(amendDatesStore.getAvailableDates).toHaveBeenCalledWith(initialDepartureDate, endDate, 1);
            expect(amendDatesStore.selectedDates).toEqual([initialDepartureDate, initialArrivalDate]);

            jest.runAllTimers();
            expect(amendDatesStore.setSelectedMonth).toHaveBeenCalled();
        });

        it('should set isError to true if no available dates', async () => {
            amendDatesStore.getAvailableDates = jest.fn(() => {
                amendDatesStore.isNoAvailableDates = true;
            }) as any;

            await amendDatesStore.refreshAvailableDates();

            expect(amendDatesStore.isSelectedDatesUnavailable).toBe(false);
            expect(amendDatesStore.getAvailableDates).toHaveBeenCalledWith(initialDepartureDate, endDate, 1);
            expect(amendDatesStore.isError).toBe(true);
        });

        it('Should set dates to correct one if it was pass with params', async () => {
            const date = new Date('2020-12-12');
            amendDatesStore.setDates = jest.fn();
            amendDatesStore.setSelectedDatesToInitialDates = jest.fn();
            await amendDatesStore.refreshAvailableDates(date);

            expect(amendDatesStore.setSelectedDatesToInitialDates).not.toHaveBeenCalled();
            expect(amendDatesStore.setDates).toHaveBeenCalledWith([date]);
        });

        it('Should drop date to initial', async () => {
            amendDatesStore.setSelectedDatesToInitialDates = jest.fn();
            amendDatesStore.setDates = jest.fn();
            await amendDatesStore.refreshAvailableDates();

            expect(amendDatesStore.setSelectedDatesToInitialDates).toHaveBeenCalled();
            expect(amendDatesStore.setDates).not.toHaveBeenCalled();
        });
    });

    describe('submitDates', () => {
        it('Should setIsAlternativePackagePopupShown, and call tracking event when offer parameters has been changed', async () => {
            amendDatesStore.setIsAlternativePackagePopupShown = jest.fn();
            amendDatesStore.setValidatedSeatsToSeatMap = jest.fn();
            amendDatesStore.booking = mockBooking;
            amendDatesStore.selectedDepartureDate = new Date('2024-02-17T00:00:00.000Z');
            (bookingService.getAmendDatesBooking as jest.MockedFn<any>).mockImplementationOnce(() => ({
                offer: mockAmendDatesOffer,
                unhappyPathOffer: true,
            }));

            await amendDatesStore.submitDates();

            expect(amendDatesStore.setIsAlternativePackagePopupShown).toHaveBeenCalledWith(true);
            expect(amendDatesStore.rootStore.trackingStore.trackCustomError).toHaveBeenCalledWith(
                GenericValues.NoMatchingDates,
                GenericValues.AlternativeAvailable,
            );
            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesSummaryPage).not.toHaveBeenCalled();
            expect(amendDatesStore.setValidatedSeatsToSeatMap).toHaveBeenCalledWith(mockAmendDatesOffer.seatSelection);
        });

        it('Prevent fetch if no booking applied', async () => {
            bookingService.getAmendDatesBooking = jest.fn();
            await amendDatesStore.submitDates();

            expect(bookingService.getAmendDatesBooking).not.toHaveBeenCalled();
        });

        it('Prevent fetch if no departure date applied', async () => {
            bookingService.getAmendDatesBooking = jest.fn();
            amendDatesStore.booking = mockBooking;
            await amendDatesStore.submitDates();

            expect(bookingService.getAmendDatesBooking).not.toHaveBeenCalled();
        });

        it('Invoke with common params and tracking', async () => {
            bookingService.getAmendDatesBooking = jest.fn(() => ({ offer: mockAmendDatesOffer } as any));
            const selectedDepartureDate = new Date('2024-02-17T00:00:00.000Z');
            const selectedArrivalDate = new Date('2024-02-24T00:00:00.000Z');
            amendDatesStore.booking = mockBooking;
            amendDatesStore.breakSubmitRequest = jest.fn();
            amendDatesStore.selectedDepartureDate = selectedDepartureDate;
            amendDatesStore.selectedArrivalDate = selectedArrivalDate;
            amendDatesStore.setSelectedMonth = jest.fn();
            amendDatesStore.extraLuggage.setExtraLuggageInfo = jest.fn();

            await amendDatesStore.submitDates();

            expect(bookingService.getAmendDatesBooking).toHaveBeenCalledWith(
                {
                    bookingRef: mockBooking.bookingReference,
                    accomId: 'accom-code',
                    boardType: 'HB',
                    duration: 0,
                    inboundDepTime: mockInboundFlight.depDate,
                    outboundDepTime: mockOutboundFlight.depDate,
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            childrenAges: [],
                            infants: 0,
                            roomCode: 'DB01',
                        },
                    ],
                    selectedDate: '2024-02-17',
                    transferCode: 'ABCN0/LCO',
                },
                'token',
            );
            expect(amendDatesStore.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(
                mockAmendDatesOffer.extraLuggageInfo,
            );
            expect(amendDatesStore.setSelectedMonth).toHaveBeenCalledWith(selectedDepartureDate);
            expect(amendDatesStore.offer).toStrictEqual(mockAmendDatesOffer);
            expect(amendDatesStore.rootStore.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventActions.ViewBooking,
                AmendEventLabels.NewDateSelection,
                {
                    genericValue1: formatDateToQuery(selectedDepartureDate),
                    genericValue2: formatDateToQuery(selectedArrivalDate),
                },
            );
            expect(amendDatesStore.rootStore.routerStore.redirectToAmendDatesSummaryPage).toHaveBeenCalled();
            expect(amendDatesStore.breakSubmitRequest).toHaveBeenCalled();
        });

        it('Throw an error if no offer was returned', async () => {
            bookingService.getAmendDatesBooking = jest.fn(() => ({} as any));
            amendDatesStore.booking = mockBooking;
            amendDatesStore.selectedDepartureDate = new Date('2024-02-17T00:00:00.000Z');
            amendDatesStore.selectedArrivalDate = new Date('2024-02-24T00:00:00.000Z');
            await amendDatesStore.submitDates();

            expect(bookingService.getAmendDatesBooking).toHaveBeenCalled();
            expect(amendDatesStore.isError).toBe(true);
        });

        it('Invoke setIsSelectedDatesUnavailable if has appropriate error code', async () => {
            bookingService.getAmendDatesBooking = jest.fn(() => {
                throw { response: { status: HttpStatusCodes.BadRequest } };
            });
            amendDatesStore.setIsSelectedDatesUnavailable = jest.fn();
            amendDatesStore.booking = mockBooking;
            amendDatesStore.selectedDepartureDate = new Date('2024-02-17T00:00:00.000Z');
            amendDatesStore.selectedArrivalDate = new Date('2024-02-24T00:00:00.000Z');
            await amendDatesStore.submitDates();

            expect(amendDatesStore.setIsSelectedDatesUnavailable).toHaveBeenCalledWith(true);
        });

        it('Handle axios cancel token error', async () => {
            amendDatesStore.booking = mockBooking;
            amendDatesStore.selectedDepartureDate = new Date('2024-02-17T00:00:00.000Z');
            bookingService.getAmendDatesBooking = jest.fn().mockRejectedValue(new Error());
            (Axios.isCancel as unknown as MockedFn<any>).mockImplementation(() => true);

            await amendDatesStore.submitDates();

            expect(Axios.isCancel).toHaveBeenCalled();
            expect(amendDatesStore.isSubmitDatesLoading).toBe(false);
            expect(amendDatesStore.isError).toBe(false);
        });
    });

    describe('setOfferWithPrices', () => {
        it('should set offer', () => {
            amendDatesStore.offerWithPrices = null;
            amendDatesStore.extraLuggage.setExtraLuggageInfo = jest.fn();
            amendDatesStore.setIsValidatedOfferUnavailable = jest.fn();

            amendDatesStore.setOfferWithPrices(mockAmendDatesOfferWithPrice);

            expect(amendDatesStore.offerWithPrices).toEqual(mockAmendDatesOfferWithPrice);
            expect(amendDatesStore.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(
                mockAmendDatesOfferWithPrice.offer.extraLuggageInfo,
            );
            expect(amendDatesStore.setIsValidatedOfferUnavailable).toHaveBeenCalledWith(false);
        });

        it('should call setIsValidatedOfferUnavailable with true if no offer', () => {
            amendDatesStore.setIsValidatedOfferUnavailable = jest.fn();

            amendDatesStore.setOfferWithPrices(null as any);

            expect(amendDatesStore.setIsValidatedOfferUnavailable).toHaveBeenCalledWith(true);
        });
    });

    describe('offerPrices', () => {
        it('should return offer prices', () => {
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;

            expect(amendDatesStore.offerPrices).toEqual(
                expect.objectContaining({
                    bookingPrice: amendDatesStore.offerWithPrices.bookingPrice,
                    offerPrice: amendDatesStore.offerWithPrices.offerPrice,
                    amendmentDatesCharges: amendDatesStore.offerWithPrices.amendmentDatesCharges,
                    amendmentDatesFees: amendDatesStore.offerWithPrices.amendmentDatesFees,
                    amendmentFlowCharges: amendDatesStore.offerWithPrices.amendmentFlowCharges,
                    discountCode: amendDatesStore.offerWithPrices.discountCode,
                    amendmentPaymentInfo: amendDatesStore.offerWithPrices.amendmentPaymentInfo,
                }),
            );
        });

        it('should return null if no offer', () => {
            amendDatesStore.offerWithPrices = null;

            expect(amendDatesStore.offerPrices).toBeNull();
        });
    });

    describe('clearStore', () => {
        it('removes data from store', () => {
            amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            amendDatesStore.setAvailableDates(['2024-02-24T00:00:00.000']);
            amendDatesStore.isError = true;
            amendDatesStore.flights.clearStore = jest.fn();
            amendDatesStore.setIsValidatedOfferUnavailable = jest.fn();
            amendDatesStore.setValidatedSeatsToSeatMap = jest.fn();
            amendDatesStore.setPrevOfferWithPrices = jest.fn();
            amendDatesStore.datesRequest = {} as any;
            amendDatesStore.booking = mockBooking;
            amendDatesStore.isInitialDataLoading = true;
            amendDatesStore.isNoAvailableDates = true;
            amendDatesStore.selectedDepartureDate = new Date('2024-02-24T00:00:00.000');
            amendDatesStore.selectedArrivalDate = new Date('2024-02-24T00:00:00.000');
            amendDatesStore.isSummaryRequestError = true;
            amendDatesStore.extraLuggage.setExtraLuggageInfo(extraLuggageInfoMock);

            amendDatesStore.clearStore();

            expect(amendDatesStore.availableDates).toBeNull();
            expect(amendDatesStore.isError).toBeFalsy();
            expect(amendDatesStore.datesRequest).toBeNull();
            expect(amendDatesStore.booking).toBeNull();
            expect(amendDatesStore.offerWithPrices).toBeNull();
            expect(amendDatesStore.isInitialDataLoading).toBeFalsy();
            expect(amendDatesStore.isNoAvailableDates).toBeFalsy();
            expect(amendDatesStore.selectedDepartureDate).toBeNull();
            expect(amendDatesStore.selectedArrivalDate).toBeNull();
            expect(amendDatesStore.flights.clearStore).toHaveBeenCalled();
            expect(amendDatesStore.setIsValidatedOfferUnavailable).toHaveBeenCalled();
            expect(amendDatesStore.isSummaryRequestError).toBe(false);
            expect(amendDatesStore.extraLuggage.extraLuggageInfo).toBe(null);
            expect(amendDatesStore.setPrevOfferWithPrices).toHaveBeenCalledWith(null);
            expect(amendDatesStore.setValidatedSeatsToSeatMap).toHaveBeenCalledWith(
                amendDatesStore.rootStore.viewBookingStore.booking?.seatSelection,
            );
        });
    });

    describe('handleChangeTransfer', () => {
        it('should call redirectTo with AmendTransfer', () => {
            amendDatesStore.transfer.handleChangeTransfer();

            expect(amendDatesStore.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.AmendTransfer);
        });
    });

    describe('setSelectedDatesToInitialDates', () => {
        it('sets selected dates to initial dates', () => {
            amendDatesStore.selectedDepartureDate = new Date('2023-01-01');
            amendDatesStore.selectedArrivalDate = new Date('2023-01-02');
            amendDatesStore.initialDepartureDate = new Date('2022-01-01');
            amendDatesStore.initialArrivalDate = new Date('2022-01-02');

            expect(amendDatesStore.selectedDepartureDate).toEqual(new Date('2023-01-01'));
            expect(amendDatesStore.selectedArrivalDate).toEqual(new Date('2023-01-02'));

            amendDatesStore.setSelectedDatesToInitialDates();

            expect(amendDatesStore.selectedDepartureDate).toEqual(new Date('2022-01-01'));
            expect(amendDatesStore.selectedArrivalDate).toEqual(new Date('2022-01-02'));
        });
    });

    describe('onDayCreate', () => {
        it('should add notAllowed class for unavailable date', () => {
            amendDatesStore.availableDates = ['2024-02-24', '2024-02-25'];
            const day = {
                dateObj: new Date('2024-02-26'),
                classList: {
                    add: jest.fn(),
                },
            } as any;

            amendDatesStore.onDayCreate([], 'abc', {} as any, day);
            expect(day.classList.add).toHaveBeenCalledWith('notAllowed');
        });

        it('should not add notAllowed or notAllowedMonth class for available date', () => {
            amendDatesStore.availableMonths = [new Date('2024-02-01').toDateString()];
            amendDatesStore.availableDates = ['2024-02-24', '2024-02-25'];
            const day = {
                dateObj: new Date('2024-02-24'),
                classList: {
                    add: jest.fn(),
                },
            } as any;

            amendDatesStore.onDayCreate([], 'abc', {} as any, day);
            expect(day.classList.add).not.toHaveBeenCalled();
        });

        it('should add notAllowedMonth class for unavailable month', () => {
            amendDatesStore.availableMonths = [new Date('2024-02-01').toDateString()];
            const day = {
                dateObj: new Date('2024-03-24'),
                classList: {
                    add: jest.fn(),
                },
            } as any;

            amendDatesStore.onDayCreate([], 'abc', {} as any, day);
            expect(day.classList.add).toHaveBeenCalledWith('notAllowedMonth');
        });
    });

    describe('onChangeDatesAmendFlightClick', () => {
        it('should call startAmendBookingFlights and track action', async () => {
            await amendDatesStore.initAmendDatesPage();

            amendDatesStore.onChangeDatesAmendFlightClick();

            expect(amendDatesStore.rootStore.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventActions.ChangeDates,
                AmendEventLabels.EditProducts,
                {
                    genericValue1: AmendEventLabels.ChangeFlights,
                },
            );
            expect(amendDatesStore.rootStore.amendFlightsStore.startAmendBookingFlights).toHaveBeenCalledWith(
                mockBooking,
                AmendScenarios.FromChangeDate,
            );
        });

        it('should return if no booking', () => {
            amendDatesStore.rootStore.viewBookingStore.booking = null;
            amendDatesStore.onChangeDatesAmendFlightClick();

            expect(amendDatesStore.rootStore.amendFlightsStore.startAmendBookingFlights).not.toHaveBeenCalled();
            expect(amendDatesStore.rootStore.amendFlightsStore.setScenario).not.toHaveBeenCalled();
            expect(amendDatesStore.rootStore.routerStore.redirectTo).toHaveBeenCalled();
        });
    });

    describe('initializeSummaryPageFromPayload', () => {
        it('should call viewBooking initBookingFromPayload and call success callback', async () => {
            bookingService.getAmendDatesValidatedOffer = jest.fn().mockResolvedValue(mockAmendDatesOfferWithPrice);
            amendDatesStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();
            amendDatesStore.setValidatedSeatsToSeatMap = jest.fn();
            amendDatesStore.setPrevOfferWithPrices = jest.fn();
            jest.spyOn(amendDatesStore, 'setOfferWithPrices');
            amendDatesStore.setIsValidatedOfferUnavailable = jest.fn();

            await amendDatesStore.initializeSummaryPageFromPayload();

            expect(amendDatesStore.rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(bookingService.getAmendDatesValidatedOffer).toHaveBeenCalled();
            expect(amendDatesStore.setOfferWithPrices).toHaveBeenCalledWith(mockAmendDatesOfferWithPrice);
            expect(amendDatesStore.booking).toStrictEqual(mockBooking);
            expect(amendDatesStore.setInitialDepartureDate).toHaveBeenCalledWith(
                new Date(mockBooking.package.accom.startDate),
            );
            expect(amendDatesStore.setInitialArrivalDate).toHaveBeenCalledWith(
                new Date(mockBooking.package.accom.endDate),
            );
            expect(amendDatesStore.rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalledWith(undefined);
            expect(amendDatesStore.setPrevOfferWithPrices).toHaveBeenCalledWith(mockAmendDatesOfferWithPrice);
            expect(amendDatesStore.setValidatedSeatsToSeatMap).toHaveBeenCalledWith(
                mockAmendDatesOfferWithPrice.offer.seatSelection,
            );
        });

        it('success callback should return early if no amendBookingPayload amendDatesOffer', async () => {
            bookingService.getAmendDatesValidatedOffer = jest.fn().mockResolvedValue(mockAmendDatesOfferWithPrice);
            amendDatesStore.rootStore.appStore.amendBookingItemPayload = undefined;
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();

            await amendDatesStore.initializeSummaryPageFromPayload();

            expect(bookingService.getAmendDatesValidatedOffer).not.toHaveBeenCalled();
        });

        it('should handle error', async () => {
            bookingService.getAmendDatesValidatedOffer = jest.fn().mockRejectedValue(new Error());
            amendDatesStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            amendDatesStore.setInitialDepartureDate = jest.fn();
            amendDatesStore.setInitialArrivalDate = jest.fn();

            await amendDatesStore.initializeSummaryPageFromPayload();

            expect(amendDatesStore.rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(amendDatesStore.offerWithPrices).toStrictEqual(
                expect.objectContaining(mockAmendDatesOfferWithPrice),
            );
            expect(bookingService.getAmendDatesValidatedOffer).toHaveBeenCalled();
            expect(amendDatesStore.booking).toStrictEqual(mockBooking);
            expect(amendDatesStore.setInitialDepartureDate).toHaveBeenCalledWith(
                new Date(mockBooking.package.accom.startDate),
            );
            expect(amendDatesStore.setInitialArrivalDate).toHaveBeenCalledWith(
                new Date(mockBooking.package.accom.endDate),
            );
            expect(amendDatesStore.isSummaryRequestError).toBe(true);
        });
    });

    describe('initializeAmendDatesPaymentPage', () => {
        it('Invoke the function with the passed parameters', async () => {
            bookingService.getAmendDatesValidatedOffer = jest.fn().mockResolvedValue(mockAmendDatesOfferWithPrice);
            amendDatesStore.setIsValidatedOfferUnavailable = jest.fn();
            amendDatesStore.setOfferWithPrices = jest.fn();

            await amendDatesStore.initializeAmendDatesPaymentPage(mockBooking, mockAmendDatesOfferWithPrice);

            expect(amendDatesStore.booking).toStrictEqual(expect.objectContaining(mockBooking));

            expect(bookingService.getAmendDatesValidatedOffer).toHaveBeenCalledWith(
                expect.objectContaining(mockAmendDatesOfferWithPrice),
            );
            expect(amendDatesStore.setOfferWithPrices).toHaveBeenCalledWith(mockAmendDatesOfferWithPrice);
        });

        it('Should update amendPaymentPayload to remove seats when isSeatsUnavailable', async () => {
            (bookingService.getAmendDatesValidatedOffer as jest.Mock).mockResolvedValue({
                ...mockAmendDatesOfferWithPrice,
                isSeatsUnavailable: true,
            });

            await amendDatesStore.initializeAmendDatesPaymentPage(mockBooking, mockAmendDatesOfferWithPrice);

            expect(amendDatesStore.rootStore.amendPaymentStore.amendPaymentPayload!.amendDatesOffer).toStrictEqual({
                ...mockAmendDatesOfferWithPrice,
                offer: { ...mockAmendDatesOfferWithPrice.offer, seatSelection: [] },
                isSeatsUnavailable: true,
            });
        });
    });

    describe('isSummaryRequestError', () => {
        it('has right initial value', () => {
            expect(amendDatesStore.isSummaryRequestError).toBe(false);
        });

        it('setIsSummaryRequestError change value', () => {
            amendDatesStore.setIsSummaryRequestError(true);

            expect(amendDatesStore.isSummaryRequestError).toBe(true);

            amendDatesStore.setIsSummaryRequestError(false);

            expect(amendDatesStore.isSummaryRequestError).toBe(false);
        });
    });

    describe('allowanceRestrictions', () => {
        it('should return initial allowance state', () => {
            expect(amendDatesStore.allowanceRestrictions.byOutOfSync).toBe(false);
            expect(amendDatesStore.allowanceRestrictions.byDisruption).toBe(false);
            expect(amendDatesStore.allowanceRestrictions.byTimeBound).toBe(false);
            expect(amendDatesStore.allowanceRestrictions.byAirportParking).toBe(false);
        });

        it('should return byTimeBound as true when booking has ChangeDateDisabledByTimeBound status', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.ChangeDateDisabledByTimeBound];

            const { byTimeBound } = amendDatesStore.allowanceRestrictions;

            expect(byTimeBound).toBe(true);
        });

        it('should return byOutOfSync as true when booking has amendDateDisabledByOutOfSync status', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendDateDisabledByOutOfSync];

            const { byOutOfSync } = amendDatesStore.allowanceRestrictions;

            expect(byOutOfSync).toBe(true);
        });

        it('should return byDisruption as true when booking has amendDateDisabledByFlightDisruption status', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.ChangeDateDisabledByFlightDisruption];

            const { byDisruption } = amendDatesStore.allowanceRestrictions;

            expect(byDisruption).toBe(true);
        });

        it('should return byAirportParking as true when booking has changeDateDisabledByAirportParking status', () => {
            (amendDatesStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.ChangeDateDisabledByAirportParking];

            const { byAirportParking } = amendDatesStore.allowanceRestrictions;

            expect(byAirportParking).toBe(true);
        });
    });

    describe('amendCTAState', () => {
        it('should return isVisible == false, when restriction by time bound', () => {
            const spy = jest.spyOn(amendDatesStore, 'allowanceRestrictions', 'get');
            spy.mockReturnValue({
                byOutOfSync: false,
                byDisruption: false,
                byTimeBound: true,
                byAirportParking: false,
            });

            expect(amendDatesStore.amendCTAState).toStrictEqual({ isVisible: false });
        });

        it('should be visible and disabled when restricted by airport parking', () => {
            const spy = jest.spyOn(amendDatesStore, 'allowanceRestrictions', 'get');
            spy.mockReturnValue({
                byOutOfSync: false,
                byDisruption: false,
                byTimeBound: false,
                byAirportParking: true,
            });

            expect(amendDatesStore.amendCTAState.isVisible).toBe(true);
            expect(amendDatesStore.amendCTAState.isDisabled).toBe(true);
        });
    });

    describe('setIsAlternativePackagePopupShown', () => {
        it('Should apply a value', () => {
            expect(amendDatesStore.isAlternativePackagePopupShown).toBe(false);

            amendDatesStore.setIsAlternativePackagePopupShown(true);

            expect(amendDatesStore.isAlternativePackagePopupShown).toBe(true);
        });
    });

    describe('setIsValidatedOfferUnavailable', () => {
        it('Should set isValidatedOfferUnavailable to true', () => {
            expect(amendDatesStore.isValidatedOfferUnavailable).toBe(false);

            amendDatesStore.setIsValidatedOfferUnavailable(true);

            expect(amendDatesStore.isValidatedOfferUnavailable).toBe(true);
        });
    });

    it('should return outboundFlight and inboundFlight from offer', () => {
        amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;

        expect(amendDatesStore.outboundFlight).toEqual(mockFlightsOffers[0].transport.routes[0]);
        expect(amendDatesStore.inboundFlight).toEqual(mockFlightsOffers[0].transport.routes[1]);
    });

    describe('setValidatedSeatsToSeatMap', () => {
        it('should set validated seats to seat map store', () => {
            amendDatesStore.setValidatedSeatsToSeatMap(mockAmendDatesOffer.seatSelection);

            expect(amendDatesStore.rootStore.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith(
                mockAmendDatesOffer.seatSelection,
            );
        });

        it('should set empty array to seat map store if no seatSection is passed', () => {
            amendDatesStore.setValidatedSeatsToSeatMap();

            expect(amendDatesStore.rootStore.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith([]);
        });
    });

    it('feePP should return per person fee', () => {
        amendDatesStore.offerWithPrices = {
            ...mockAmendDatesOfferWithPrice,
            amendmentPaymentInfo: mockAmendPaymentInfo,
        };

        expect(amendDatesStore.feePP).toBe(10);
    });

    describe('setPrevOfferWithPrices', () => {
        it('update prevOfferWithPrices value', () => {
            expect(amendDatesStore.prevOfferWithPrices).toBe(null);

            amendDatesStore.setPrevOfferWithPrices(mockAmendDatesOfferWithPrice);

            expect(amendDatesStore.prevOfferWithPrices).toStrictEqual(mockAmendDatesOfferWithPrice);
        });
    });
});
