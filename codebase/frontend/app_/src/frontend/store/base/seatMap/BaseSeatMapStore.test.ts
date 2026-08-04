import { createMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';
import { SeatType } from 'models/enum/SeatType';
import SiteSettings from 'models/enum/SiteSettings';

import BaseSeatMapStore from './BaseSeatMapStore';

jest.mock('frontend/services/booking.service');

describe('BaseSeatMapStore', () => {
    const createRootStore = () =>
        createMockStores({
            routerStore: { updateCurrentPage: jest.fn() },
            queryParamsStore: { buildHotelDetailsQuery: jest.fn() },
            bookingStore: {},
            viewBookingStore: {
                viewBookingPayload: { shouldOpenSeatMapForced: false },
            },
            layoutStore: {
                getSetting: s => settings[s],
                isViewBookingPage: false,
            },
            flightsPassengersStore: {
                inBoundPassengers: [],
                outBoundPassengers: [],
                outboundFlightNumber: '2291',
                inboundFlightNumber: '2292',
            },
            amendDatesStore: mockAmendDatesStore,
        } as any);

    const createSettings = () => ({
        [SiteSettings.EnableSeatMapFlow]: true,
        [SiteSettings.EnableSeatMapPostBookingFlow]: true,
    });

    let store;
    let rootStore = createRootStore();
    let settings = createSettings();

    beforeEach(() => {
        settings = createSettings();
        rootStore = createRootStore();
        store = new BaseSeatMapStore(rootStore);
    });

    describe('isPostBooking', () => {
        it('Should return true if isViewBookingPage', () => {
            rootStore.layoutStore.isViewBookingPage = true;

            expect(store.isPostBooking).toBe(true);
        });

        it('Should return true if isAmendDatesSummaryPage', () => {
            rootStore.layoutStore.isAmendDatesSummaryPage = true;

            expect(store.isPostBooking).toBe(true);
        });

        it('Should return false if neither isViewBookingPage nor isAmendDatesSummaryPage not true', () => {
            rootStore.layoutStore.isViewBookingPage = false;
            rootStore.layoutStore.isAmendDatesSummaryPage = false;

            expect(store.isPostBooking).toBe(false);
        });
    });

    describe('shouldOpenSeatMapForced', () => {
        it('should set shouldOpenSeatMapForced when it exists in viewBookingPayload during store creation', () => {
            const newRootStore = createRootStore();

            newRootStore.viewBookingStore.viewBookingPayload.shouldOpenSeatMapForced = true;

            const seatStore = new BaseSeatMapStore(newRootStore);

            expect(seatStore.shouldOpenSeatMapForced).toBeTruthy();
        });

        it('should set shouldOpenSeatMapForced when it exists in viewBookingPayload during store creation', () => {
            const newRootStore = createRootStore();
            const seatStore = new BaseSeatMapStore(newRootStore);

            expect(seatStore.shouldOpenSeatMapForced).toBeFalsy();
        });
    });

    describe('setOpenSeatMapForced', () => {
        it('should set shouldOpenSeatMapForced', () => {
            expect(store.shouldOpenSeatMapForced).toBeFalsy();

            store.setOpenSeatMapForced(true);

            expect(store.shouldOpenSeatMapForced).toBeTruthy();
        });
    });

    describe('selectedSeats', () => {
        it('should return [] when isSeatMapFlowEnabled is true', () => {
            rootStore.queryParamsStore.seatSelectionFromUrl = undefined;
            store.validatedSelectedSeats = [];
            store.setSeatMapFlowDisabledError = jest.fn();
            settings[SiteSettings.EnableSeatMapFlow] = true;

            expect(store.selectedSeats).toEqual([]);
            expect(store.setSeatMapFlowDisabledError).not.toHaveBeenCalled();
        });

        it('should call setSeatMapFlowDisabledError when isSeatMapFlowEnabled is false and we have seats', () => {
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };
            store.validatedSelectedSeats = [];
            store.setSeatMapFlowDisabledError = jest.fn();
            settings[SiteSettings.EnableSeatMapFlow] = false;

            expect(store.selectedSeats).toEqual([]);
            expect(store.setSeatMapFlowDisabledError).toHaveBeenCalledWith();
        });

        it('should not call setSeatMapFlowDisabledError when isSeatMapFlowEnabled is false and we do NOT have seats', () => {
            rootStore.queryParamsStore.seatSelectionFromUrl = undefined;
            store.validatedSelectedSeats = [];
            store.setSeatMapFlowDisabledError = jest.fn();
            settings[SiteSettings.EnableSeatMapFlow] = false;

            expect(store.selectedSeats).toEqual([]);
            expect(store.setSeatMapFlowDisabledError).not.toHaveBeenCalled();
        });

        it('should return validatedSelectedSeats when validatedSelectedSeats is not empty', () => {
            store.validatedSelectedSeats = [{ s1: '1-2E|2-3A', s2: '1-5B|2-2D' }];
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };
            store.setSeatMapFlowDisabledError = jest.fn();
            settings[SiteSettings.EnableSeatMapFlow] = true;

            expect(store.selectedSeats).toEqual(store.validatedSelectedSeats);
            expect(store.setSeatMapFlowDisabledError).not.toHaveBeenCalled();
        });

        it('should return seatSelectionFromUrl when validatedSelectedSeats is empty', () => {
            store.validatedSelectedSeats = [];
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };
            store.setSeatMapFlowDisabledError = jest.fn();
            settings[SiteSettings.EnableSeatMapFlow] = true;

            expect(store.selectedSeats).toEqual(store.seatSelectionFromUrl);
            expect(store.setSeatMapFlowDisabledError).not.toHaveBeenCalled();
        });
    });

    describe('fetchSeatMap', () => {
        let mockedFlights: IRoute[];

        beforeEach(() => {
            mockedFlights = [
                {
                    arrDate: '2023-05-02T23:55:00+00:00',
                    arrLocation: 'Spain',
                    arrName: 'Tenerife South',
                    arrPt: 'TFS',
                    avail: 4,
                    car: 'EZY',
                    cycDate: '2023-05-02',
                    depDate: '2023-05-02T19:25:00+00:00',
                    depLocation: 'London',
                    depName: 'London Gatwick',
                    depPt: 'LGW',
                    direction: RouteDirection.Outbound,
                    fltNo: 'EZY8037',
                    id: 'E10048699835b72d521f2824f9dcbffaa',
                    isExt: true,
                    routeCd: 'TFSLGW2T',
                },
                {
                    arrDate: '2023-05-10T05:00:00+00:00',
                    arrLocation: 'London',
                    arrName: 'London Gatwick',
                    arrPt: 'LGW',
                    avail: 8,
                    car: 'EZY',
                    cycDate: '2023-05-09',
                    depDate: '2023-05-10T00:50:00+00:00',
                    depLocation: 'Spain',
                    depName: 'Tenerife South',
                    depPt: 'TFS',
                    direction: RouteDirection.Inbound,
                    fltNo: 'EZY8038',
                    id: 'E9714670b0a851283033fbe61e76f5868',
                    isExt: true,
                    routeCd: 'LGWTFS3T',
                },
            ];
        });

        it('should fetch correct departure date when flight is on the next day', async () => {
            await store.fetchSeatMap(mockedFlights, 'PROMO123');

            expect(bookingService.fetchSeatMap).toHaveBeenCalledTimes(2);
            expect(bookingService.fetchSeatMap).toHaveBeenCalledWith(
                'LGW',
                'TFS',
                '2023-05-02',
                '8037',
                true,
                'PROMO123',
            );
            expect(bookingService.fetchSeatMap).toHaveBeenCalledWith(
                'TFS',
                'LGW',
                '2023-05-10',
                '8038',
                false,
                'PROMO123',
            );
        });

        it('should clear flags when request is failed', async () => {
            store.isSeatMapFailed = false;
            store.isSelectedSeatsUnavailableError = true;
            store.shouldOpenSeatMapForced = true;
            store.isSeatMapOpened = true;

            (bookingService.fetchSeatMap as any).mockReturnValueOnce(Promise.reject());

            await store.fetchSeatMap(mockedFlights);

            expect(store.isSeatMapFailed).toBe(true);
            expect(store.isSelectedSeatsUnavailableError).toBe(false);
            expect(store.shouldOpenSeatMapForced).toBe(false);
            expect(store.isSeatMapOpened).toBe(false);
        });

        it('should not fetch seats when seats are not dynamic AND not on view booking page with possible seats reservation', async () => {
            mockedFlights[0].isExt = false;

            await store.fetchSeatMap(mockedFlights);

            expect(bookingService.fetchSeatMap).not.toHaveBeenCalled();
        });

        it('should fetch when seat reservation is possible in view booking', async () => {
            rootStore.layoutStore.isViewBookingPage = true;
            rootStore.viewBookingStore.isBookingOutOfSync = false;
            mockedFlights[0].isExt = false;

            await store.fetchSeatMap(mockedFlights);

            expect(bookingService.fetchSeatMap).toHaveBeenCalledTimes(2);
            expect(bookingService.fetchSeatMap).toHaveBeenCalledWith(
                'TFS',
                'LGW',
                '2023-05-10',
                '8038',
                false,
                undefined,
            );
            expect(bookingService.fetchSeatMap).toHaveBeenCalledWith(
                'TFS',
                'LGW',
                '2023-05-10',
                '8038',
                false,
                undefined,
            );
        });

        it('should NOT fetch if seat reservation is possible in payment confirmation page', async () => {
            rootStore.viewBookingStore.isBookingOutOfSync = false;
            mockedFlights[0].isExt = false;

            await store.fetchSeatMap(mockedFlights);

            expect(bookingService.fetchSeatMap).not.toHaveBeenCalled();
        });

        it('should set isSeatDataLoaded to true when seat map is fetched successfully', async () => {
            (bookingService.fetchSeatMap as any).mockReturnValue({ rows: [{ rowNumber: '1', seats: [] }] });

            expect(store.isSeatDataLoaded).toBeFalsy();

            await store.fetchSeatMap(mockedFlights);

            expect(store.isSeatDataLoaded).toBeTruthy();
        });
    });

    describe('outboundFlight', () => {
        it('should return outboundFlight from ViewBookingStore', () => {
            rootStore.viewBookingStore.outboundFlight = 'view booking outbound flight';
            rootStore.bookingStore.outboundFlight = 'booking flight';

            expect(store.outboundFlight).toEqual(rootStore.viewBookingStore.outboundFlight);
        });

        it('should return outboundFlight from BookingStore when no flight in viewBookingStore', () => {
            rootStore.bookingStore.outboundFlight = 'flight';

            expect(store.outboundFlight).toEqual(rootStore.bookingStore.outboundFlight);
        });

        it('should return outboundFlight from amendDatesStore if it exists', () => {
            expect(store.outboundFlight).toEqual(rootStore.amendDatesStore.outboundFlight);
        });
    });

    describe('inboundFlight', () => {
        it('should return inboundFlight from ViewBookingStore', () => {
            rootStore.viewBookingStore.inboundFlight = 'view booking inbound flight';
            rootStore.bookingStore.inboundFlight = 'booking inbound flight';

            expect(store.inboundFlight).toEqual(rootStore.viewBookingStore.inboundFlight);
        });

        it('should return inboundFlight from BookingStore when no flight in viewBookingStore', () => {
            rootStore.bookingStore.inboundFlight = 'flight';

            expect(store.inboundFlight).toEqual(rootStore.bookingStore.inboundFlight);
        });

        it('should return inboundFlight from amendDatesStore if it exists', () => {
            expect(store.inboundFlight).toEqual(rootStore.amendDatesStore.inboundFlight);
        });
    });

    describe('seatSelectionFromUrl', () => {
        it('should call parseSeats correctly', () => {
            rootStore.layoutStore.isSeatMapFlowEnabled = true;
            rootStore.flightsPassengersStore.inboundFlightNumber = '';
            rootStore.flightsPassengersStore.outboundFlightNumber = '';
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };

            expect(store.seatSelectionFromUrl).toEqual([
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '3A',
                        },
                    ],
                    sectorId: '1',
                },
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '2D',
                        },
                    ],
                    sectorId: '2',
                },
            ]);
        });

        it('should NOT call parseSeats when seatSelectionFromUrl is empty', () => {
            rootStore.layoutStore.isSeatMapFlowEnabled = true;
            rootStore.bookingStore.outboundFlightNumber = '';
            rootStore.bookingStore.inboundFlightNumber = '';
            rootStore.queryParamsStore.seatSelectionFromUrl = undefined;

            expect(store.seatSelectionFromUrl).toBeUndefined();
        });

        it('should add outboundFlightNumber', () => {
            rootStore.layoutStore.isSeatMapFlowEnabled = true;
            rootStore.flightsPassengersStore.inboundFlightNumber = '';
            rootStore.flightsPassengersStore.outboundFlightNumber = '1232';
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };

            expect(store.seatSelectionFromUrl).toEqual([
                {
                    flightNumber: '1232',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '3A',
                        },
                    ],
                    sectorId: '1',
                },
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '2D',
                        },
                    ],
                    sectorId: '2',
                },
            ]);
        });

        it('should add inboundFlightNumber', () => {
            rootStore.layoutStore.isSeatMapFlowEnabled = true;
            rootStore.flightsPassengersStore.outboundFlightNumber = '';
            rootStore.flightsPassengersStore.inboundFlightNumber = '1233';
            rootStore.queryParamsStore.seatSelectionFromUrl = { s1: '1-2E|2-3A', s2: '1-5B|2-2D' };

            expect(store.seatSelectionFromUrl).toEqual([
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '3A',
                        },
                    ],
                    sectorId: '1',
                },
                {
                    flightNumber: '1233',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '2D',
                        },
                    ],
                    sectorId: '2',
                },
            ]);
        });
    });

    describe('selectedSeatsPrice', () => {
        it('should return zero selectedSeatsPrice', () => {
            store.validatedSelectedSeats = [
                {
                    flightNumber: '1232',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '3A',
                        },
                    ],
                    sectorId: '1',
                },
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '2D',
                        },
                    ],
                    sectorId: '2',
                },
            ];
            expect(store.selectedSeatsPrice).toEqual(0);
        });

        it('should return non zero selectedSeatsPrice', () => {
            store.validatedSelectedSeats = [
                {
                    flightNumber: '1232',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                            price: 0.99,
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '3A',
                            price: 0.99,
                        },
                    ],
                    sectorId: '1',
                },
                {
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                        {
                            paxIndex: 2,
                            seatNumber: '2D',
                            price: 0.99,
                        },
                    ],
                    sectorId: '2',
                },
            ];
            expect(store.selectedSeatsPrice).toEqual(1.98);
        });
    });

    describe('seatMapInitialSelection', () => {
        const outboundFlight = {
            arrDate: '2023-02-04T11:35:00+00:00',
            arrLocation: 'Spain',
            arrName: 'Fuerteventura',
            arrPt: 'FUE',
            arrTime: '1135',
            avail: 6,
            bkgCls: 'Z',
            car: 'EZY',
            cycDate: '2023-02-04',
            depDate: '2023-02-04T07:15:00+00:00',
            depLocation: 'London',
            depName: 'London Luton',
            depPt: 'LTN',
            depTime: '0715',
            direction: 'outbound',
            fltNo: 'EZY2291',
            id: 'E83a0aa4156a958884c8d90fd9fa80728',
            isExt: true,
            routeCd: 'FUELTN6T',
        };
        const inboundFlight = {
            arrDate: '2023-02-11T16:30:00+00:00',
            arrLocation: 'London',
            arrName: 'London Luton',
            arrPt: 'LTN',
            arrTime: '1630',
            avail: 96,
            bkgCls: 'Y',
            car: 'EZY',
            cycDate: '2023-02-11',
            depDate: '2023-02-11T12:15:00+00:00',
            depLocation: 'Spain',
            depName: 'Fuerteventura',
            depPt: 'FUE',
            depTime: '1215',
            direction: 'inbound',
            fltNo: 'EZY2292',
            id: 'E27cd7e60933dec6de93d062256d89a1a',
            isExt: true,
            routeCd: 'LTNFUE6T',
        };
        const passenger = {
            age: 30,
            index: '1',
            isLead: true,
            notBornYet: false,
            passengerId: '1',
            sex: 'SEX_UNKNOWN',
            type: 'ADULT',
            withInfant: false,
            name: 'Name',
        };

        it('should return empty string for name passenger when no data about name', () => {
            rootStore.bookingStore.outboundFlightNumber = '2291';
            rootStore.bookingStore.outboundFlight = outboundFlight;
            rootStore.bookingStore.inboundFlightNumber = '2292';
            rootStore.bookingStore.inboundFlight = inboundFlight;
            rootStore.flightsPassengersStore.outBoundPassengers = [
                {
                    ...passenger,
                    seat: {
                        seatNumber: '2E',
                    },
                },
            ];
            rootStore.flightsPassengersStore.inBoundPassengers = [
                {
                    ...passenger,
                    seat: {
                        seatNumber: '5B',
                    },
                    title: 'Mr',
                    firstName: 'Bob',
                    lastName: 'Black',
                },
            ];

            store.validatedSelectedSeats = [
                {
                    flightNumber: '2291',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '2E',
                            products: [{}, {}],
                        },
                    ],
                    sectorId: '1',
                },
                {
                    flightNumber: '2292',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '5B',
                        },
                    ],
                    sectorId: '2',
                },
            ];

            const result = store.seatMapInitialSelection;

            expect(result[0].flightNumber).toEqual('2291');
            expect(result[0].flightDate).toEqual('2023-02-04');
            expect(result[0].seats[0].name).toEqual('');
            expect(result[0].seats[0].products).toHaveLength(2);

            expect(result[1].flightNumber).toEqual('2292');
            expect(result[1].flightDate).toEqual('2023-02-11');
            expect(result[1].seats[0].products).toHaveLength(0);
        });

        it('should return initialSelection on post booking page when no seats have been selected', () => {
            rootStore.layoutStore.isViewBookingPage = true;
            rootStore.bookingStore.outboundFlightNumber = '2291';
            rootStore.bookingStore.outboundFlight = outboundFlight;
            rootStore.bookingStore.inboundFlightNumber = '2292';
            rootStore.bookingStore.inboundFlight = inboundFlight;
            rootStore.flightsPassengersStore.outBoundPassengers = [passenger];
            rootStore.flightsPassengersStore.inBoundPassengers = [passenger];

            const result = store.seatMapInitialSelection;

            expect(result).toHaveLength(2);
        });
    });

    describe('haveOutboundSelectedSeats', () => {
        const passenger = {
            age: 30,
            index: '1',
            isLead: true,
            notBornYet: false,
            passengerId: '1',
            sex: 'SEX_UNKNOWN',
            type: 'ADULT',
            withInfant: false,
        };

        it('should be false when there are NOT outbound seats are selected', () => {
            rootStore.flightsPassengersStore.outBoundPassengers = [passenger];

            expect(store.haveOutboundSelectedSeats).toBe(false);
        });

        it('should be false when outBoundPassengers is an empty array', () => {
            rootStore.flightsPassengersStore.outBoundPassengers = [];

            expect(store.haveOutboundSelectedSeats).toBe(false);
        });

        it('should be true when there are outbound seats are selected', () => {
            rootStore.flightsPassengersStore.outBoundPassengers = [
                {
                    ...passenger,
                    seat: {
                        seatNumber: '1A',
                    },
                },
            ];

            expect(store.haveOutboundSelectedSeats).toBe(true);
        });
    });

    describe('haveInboundSelectedSeats', () => {
        const passenger = {
            age: 30,
            index: '1',
            isLead: true,
            notBornYet: false,
            passengerId: '1',
            sex: 'SEX_UNKNOWN',
            type: 'ADULT',
            withInfant: false,
        };

        it('should be false when there are NOT inbound seats are selected', () => {
            rootStore.flightsPassengersStore.inBoundPassengers = [passenger];

            expect(store.haveInboundSelectedSeats).toBe(false);
        });

        it('should be false when inBoundPassengers is an empty array', () => {
            rootStore.flightsPassengersStore.inBoundPassengers = [];

            expect(store.haveInboundSelectedSeats).toBe(false);
        });

        it('should be true when there are inbound seats are selected', () => {
            rootStore.flightsPassengersStore.inBoundPassengers = [
                {
                    ...passenger,
                    seat: {
                        seatNumber: '1A',
                    },
                },
            ];

            expect(store.haveInboundSelectedSeats).toBe(true);
        });
    });

    describe('onclearSelectedSeatsUnavailableError', () => {
        it('should run callback when selectedSeatsUnavailableError is set to false', () => {
            let guard = false;
            store.setIsSelectedSeatsUnavailableError(true);
            store.onclearSelectedSeatsUnavailableError(() => (guard = true));

            expect(guard).toBe(false);
            store.clearSelectedSeatsUnavailableError();
            expect(guard).toBe(true);
        });
    });

    describe('isSeatMapFlowDisabledError', () => {
        it('should set isSeatMapFlowDisabledError', () => {
            store.isSeatMapFlowDisabledError = false;
            store.setSeatMapFlowDisabledError();

            expect(store.isSeatMapFlowDisabledError).toBeTruthy();
        });

        it('should clear isSeatMapFlowDisabledError', () => {
            store.isSeatMapFlowDisabledError = true;
            store.clearSeatMapFlowDisabledError();

            expect(store.isSeatMapFlowDisabledError).toBeFalsy();
        });
    });

    describe('setSeatMapOpened', () => {
        it('should set isSeatMapOpened to true', () => {
            expect(store.isSeatMapOpened).toBeFalsy();

            store.setSeatMapOpened(true);

            expect(store.isSeatMapOpened).toBeTruthy();
        });
    });

    describe('setSeatWidgetWasLoadedOnce', () => {
        it('should set seatWidgetWasLoadedOnce to true', () => {
            expect(store.seatWidgetWasLoadedOnce).toBeFalsy();

            store.setSeatWidgetWasLoadedOnce();

            expect(store.seatWidgetWasLoadedOnce).toBeTruthy();
        });
    });

    describe('isSeatMapPostBookingFlowEnabled', () => {
        it('should return true when isAmendSeatsDisabled is false and isSeatMapFlowEnabled is true', () => {
            expect(store.isSeatMapPostBookingFlowEnabled).toBeTruthy();
        });

        it('should return false when isAmendSeatsDisabled is true', () => {
            rootStore.viewBookingStore.isAmendSeatsDisabled = true;

            expect(store.isSeatMapPostBookingFlowEnabled).toBeFalsy();
        });

        it('should return false when isSeatMapFlowEnabled is false', () => {
            rootStore.viewBookingStore.isAmendSeatsDisabled = false;
            settings.EnableSeatMapPostBookingFlow = false;

            expect(store.isSeatMapPostBookingFlowEnabled).toBeFalsy();
        });
    });

    describe('isPremiumSeatsSelected', () => {
        it('should return true when UpFront seats selected', () => {
            store.validatedSelectedSeats = [
                {
                    seats: [
                        {
                            priceBand: SeatType.UpFront,
                        },
                    ],
                },
                {
                    seats: [
                        {
                            priceBand: SeatType.Standard,
                        },
                    ],
                },
            ];

            expect(store.isPremiumSeatsSelected).toBe(true);
        });

        it('should return false when there are no UpFront seats selected', () => {
            store.validatedSelectedSeats = [
                {
                    seats: [
                        {
                            priceBand: SeatType.Standard,
                        },
                    ],
                },
            ];

            expect(store.isPremiumSeatsSelected).toBe(false);
        });
    });

    describe('isAllSelectedSeatsPremium', () => {
        it('should return true when only UpFront/ExtraLegroom seats selected', () => {
            store.validatedSelectedSeats = [
                {
                    seats: [
                        {
                            priceBand: SeatType.UpFront,
                        },
                    ],
                },
                {
                    seats: [
                        {
                            priceBand: SeatType.ExtraLegroom,
                        },
                    ],
                },
            ];

            expect(store.isAllSelectedSeatsPremium).toBe(true);
        });

        it('should return false when there at least one standard seat selected', () => {
            store.validatedSelectedSeats = [
                {
                    seats: [
                        {
                            priceBand: SeatType.UpFront,
                        },
                    ],
                },
                {
                    seats: [
                        {
                            priceBand: SeatType.ExtraLegroom,
                        },
                    ],
                },
                {
                    seats: [
                        {
                            priceBand: SeatType.Standard,
                        },
                    ],
                },
            ];

            expect(store.isAllSelectedSeatsPremium).toBe(false);
        });
    });
});
