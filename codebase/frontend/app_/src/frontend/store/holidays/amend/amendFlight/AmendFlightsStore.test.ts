import { jest } from '@jest/globals';
import { runInAction } from 'mobx';

import settings from 'code/settings';
import {
    createMockStores,
    mockAmendDatesOfferWithPrice,
    mockAmendDatesStore,
    mockBooking,
    mockFlightsOffers,
    mockValidatedFlights,
} from 'frontend/__mocks__';
import { mockAltFlightsFilters, mockFilterDepartureAirport } from 'frontend/__mocks__/filters';
import bookingService from 'frontend/services/booking.service';
import { AmendFlightsStore } from 'frontend/store/holidays/amend/amendFlight/AmendFlightsStore';
import { IAmendBookingFlightPromoDataResponse, IAmendTransport } from 'models/data/IAmendBookingFlights';
import { BookingAllowanceRestrictions, IBookingInfo, TViewBookingRestrictions } from 'models/data/IBookingInfo';
import { ITransport } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ApiErrors } from 'models/enum/ApiErrors';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitePath from 'models/enum/SitePath';

import { checkForOrderIncorrect } from './AmendFlightsStore.utils';
import { AMEND_FLIGHTS_DISABLED_STATUSES } from './constants';

jest.mock('frontend/services/booking.service');

const getBooking = () => ({
    bookingReference: 'bookingReference',
    sessionId: 'sessionId',
    requestId: 'requestId',
    bookingStatus: 'bookingStatus',
    leadPassenger: {
        email: 'email',
        address: 'address',
    },
    isLoggedInAsLeadPassenger: true,
    guests: [
        {
            index: 0,
            isLead: true,
            firstName: 'firstName',
            lastName: 'lastName',
        },
        {
            index: 1,
            isLead: false,
            firstName: 'firstName',
            lastName: 'lastName',
        },
    ],
    package: {
        transport: mockValidatedFlights.transports[0],
    },
});

let rootStore;
let amendFlightStore: AmendFlightsStore;
let booking;

jest.mock('frontend/utils/filter.utils', () => ({
    buildAirportsFilterOptionsFromOffers: jest.fn(v => v),
    buildTimeFilterOptions: jest.fn(v => v),
}));

const mockAxiosCancel = jest.fn();
const mockAxiosIsCancel = jest.fn();
const mockAxiosCancelSource = jest.fn(() => ({
    token: 'axiosToken',
    cancel: () => mockAxiosCancel(),
}));
jest.mock('axios', () => ({
    CancelToken: {
        source: () => mockAxiosCancelSource(),
    },
    isCancel: () => mockAxiosIsCancel(),
}));

jest.mock('./AmendFlightsStore.utils');
const mockedCheckForOrderIncorrect = checkForOrderIncorrect as jest.MockedFunction<typeof checkForOrderIncorrect>;

describe('<ViewBookingsStore />', () => {
    const rootStore = createMockStores({
        userStore: {
            isLoggedIn: true,
            checkIfUserLoggedIn: jest.fn(() => Promise.resolve(true)),
        },
        routerStore: {
            redirectToLoginPage: jest.fn(),
        },
        trackingStore: {
            trackChangeSortTypeFlightAmendment: jest.fn(),
        },
    });

    it('should change sortBy value and make request', () => {
        const amendStore = new AmendFlightsStore(rootStore);
        amendStore.flightOffersCount = 2;

        const loadInitialAlternativeFlightsSpy = jest.spyOn(amendStore, 'loadInitialAlternativeFlights');
        amendStore.onChangeSortBy(AlternativeFlightsSortBy.OutboundEarliestDeparture);

        expect(loadInitialAlternativeFlightsSpy).toHaveBeenCalled();
        expect(amendStore.sorting.sortBy).toBe(AlternativeFlightsSortBy.OutboundEarliestDeparture);
        expect(amendStore.rootStore.trackingStore.trackChangeSortTypeFlightAmendment).not.toHaveBeenCalled();
    });

    it('should change sortBy value and NOT make request', () => {
        const amendStore = new AmendFlightsStore(rootStore);
        amendStore.flightOffersCount = 1;

        const loadInitialAlternativeFlightsSpy = jest.spyOn(amendStore, 'loadInitialAlternativeFlights');
        amendStore.onChangeSortBy(AlternativeFlightsSortBy.OutboundEarliestDeparture);

        expect(loadInitialAlternativeFlightsSpy).not.toHaveBeenCalled();
        expect(amendStore.sorting.sortBy).toBe(AlternativeFlightsSortBy.OutboundEarliestDeparture);
    });

    it('Should trackChangeSortTypeFlightAmendment be called during change sorting', () => {
        const amendStore = new AmendFlightsStore(rootStore);
        amendStore.flightOffersCount = 2;
        amendStore.booking = mockBooking;

        amendStore.onChangeSortBy(AlternativeFlightsSortBy.OutboundEarliestDeparture);

        expect(amendStore.rootStore.trackingStore.trackChangeSortTypeFlightAmendment).toHaveBeenCalledWith(
            AlternativeFlightsSortBy.OutboundEarliestDeparture,
            mockBooking.bookingReference,
        );
    });
});

describe('AmendFlightsStore', () => {
    beforeEach(() => {
        rootStore = createMockStores({
            appStore: {
                setAmendBookingItemPayload: jest.fn(),
                amendBookingItemPayload: {
                    selectedFlight: mockValidatedFlights.transports[0],
                    date: 'date',
                    bookingReference: 'bookingReference',
                    lastName: 'lastName',
                },
            },
            trackingStore: {
                trackFlightAmendment: jest.fn(),
                trackWrongPriceSortingAlternativeFlights: jest.fn(),
            },
            viewBookingStore: {
                updateBookingInfo: jest.fn(),
                continueToPay: jest.fn(),
                //@ts-expect-error mock implementation
                initBookingFromPayload: jest.fn().mockImplementation(cb => cb(mockBooking)),
                amendBookingStatuses: [],
                allowanceRestrictions: {},
            },
            routerStore: {
                redirectToLoginPage: jest.fn(),
                redirectToViewBookingsPage: jest.fn(),
                redirectToViewBookingPage: jest.fn(),
                redirectToAmendDatesSummaryPage: jest.fn(),
                redirectToAmendFlightsPage: jest.fn(),
            },
            userStore: {
                isLoggedIn: true,
                checkIfUserLoggedIn: jest.fn(() => true),
            },
            amendDatesStore: {
                ...mockAmendDatesStore,
                flights: {
                    getChangeDateAmendFlightsOffers: jest.fn(() => [mockFlightsOffers[0]]),
                    getAlternativeFlightsFromAmendDatesOffers: jest.fn(),
                    getAlternativeFlightFromAmendDatesOffer: jest.fn(),
                    submitFlightChangeSelection: jest.fn(),
                    getValidatedFlightsAndUpdateOffers: jest.fn(),
                },
            },
        });
        booking = getBooking();
        amendFlightStore = new AmendFlightsStore(rootStore);
        bookingService.viewBooking = jest.fn(() => ({ data: 'bookingResult' })) as any;
        bookingService.getAmendAlternativeFlights = jest.fn(() => ({
            offers: [
                { transport: mockValidatedFlights.transports[0] },
                { transport: mockValidatedFlights.transports[1] },
            ],
        })) as any;
    });

    describe('haveChosenSeatsBeenDropped', () => {
        it('Should be early return without any further actions when selected flight has not been chosen and return false status', () => {
            amendFlightStore.setShowSeatDropPopup = jest.fn();

            expect(amendFlightStore.haveChosenSeatsBeenDropped).toBe(false);
            expect(amendFlightStore.setShowSeatDropPopup).not.toHaveBeenCalled();
            expect(amendFlightStore.rootStore.trackingStore.trackFlightAmendment).not.toHaveBeenCalled();
        });

        it('Should not call setShowSeatDropPopup when seats has not been chosen', () => {
            amendFlightStore.setShowSeatDropPopup = jest.fn();
            amendFlightStore.booking = mockBooking;
            amendFlightStore.selectedFlight = mockValidatedFlights.transports[0];

            amendFlightStore.haveChosenSeatsBeenDropped;

            expect(amendFlightStore.setShowSeatDropPopup).not.toHaveBeenCalled();
        });

        it('Should call setShowSeatDropPopup and return true status', () => {
            amendFlightStore.setShowSeatDropPopup = jest.fn();
            amendFlightStore.booking = mockBooking;
            amendFlightStore.selectedFlight = mockValidatedFlights.transports[0];
            amendFlightStore.booking!.package!.transport!.routes[0].paxs![0].seat = 'seat';

            expect(amendFlightStore.haveChosenSeatsBeenDropped).toBe(true);
            expect(amendFlightStore.setShowSeatDropPopup).toHaveBeenCalled();
        });

        it('Should not call setShowSeatDropPopup when popup has been already shown', () => {
            amendFlightStore.setShowSeatDropPopup = jest.fn();
            amendFlightStore.booking = mockBooking;
            amendFlightStore.selectedFlight = mockValidatedFlights.transports[0];
            amendFlightStore.isSeatDropPopupWasShown = true;
            amendFlightStore.booking!.package!.transport!.routes[0].paxs![0].seat = 'seat';

            amendFlightStore.haveChosenSeatsBeenDropped;
            expect(amendFlightStore.setShowSeatDropPopup).not.toHaveBeenCalled();
        });

        it('Should tracking event be called when flight has been selected and booking exists, and popup already has been shown, and return false status', () => {
            amendFlightStore.booking = mockBooking;
            amendFlightStore.selectedFlight = mockValidatedFlights.transports[0];
            amendFlightStore.isSeatDropPopupWasShown = true;

            expect(amendFlightStore.haveChosenSeatsBeenDropped).toBe(false);
            expect(amendFlightStore.rootStore.trackingStore.trackFlightAmendment).toHaveBeenCalledWith(
                'post_booking_change_flights_update',
                expect.objectContaining(mockValidatedFlights.transports[0].routes),
                expect.objectContaining(mockBooking.package.transport.routes),
                amendFlightStore.selectedFlight.amendmentPaymentInfo,
            );
        });
    });

    it('initAmendFlightsPage - initFlightsPageFromPayload', () => {
        amendFlightStore.initFlightsPageFromPayload = jest.fn(() => Promise.resolve());
        amendFlightStore.initAmendFlightsPage(null, null, null, null);

        expect(amendFlightStore.initFlightsPageFromPayload).toHaveBeenCalled();
    });

    it('initAmendFlightsPage - goToAmendFlightsRedirectPage', () => {
        amendFlightStore.goToAmendFlightsRedirectPage = jest.fn();
        amendFlightStore.rootStore.appStore.amendBookingItemPayload = undefined;
        amendFlightStore.initAmendFlightsPage(null, null, null, null);

        expect(amendFlightStore.goToAmendFlightsRedirectPage).toHaveBeenCalled();
    });

    it('initAmendFlightsPage - with booking', async () => {
        amendFlightStore.booking = {} as IBookingInfo;
        amendFlightStore.rootStore.appStore.amendBookingItemPayload = undefined;
        amendFlightStore.setTimesFilters = jest.fn();
        amendFlightStore.setFiltersOrder = jest.fn();
        amendFlightStore.sorting.setSortByInitially = jest.fn();
        amendFlightStore.togglePreFilteredMessage = jest.fn();
        amendFlightStore.alternativeFlights = mockValidatedFlights.transports;
        amendFlightStore.loadInitialAlternativeFlights = jest.fn() as any;

        await amendFlightStore.initAmendFlightsPage(
            'orderSettings' as any,
            'timeFilters' as any,
            'sortOrder' as any,
            'sortDefault' as any,
        );

        expect(amendFlightStore.setTimesFilters).toHaveBeenCalledWith('timeFilters', []);
        expect(amendFlightStore.setFiltersOrder).toHaveBeenCalledWith('orderSettings');
        expect(amendFlightStore.sorting.setSortByInitially).toHaveBeenCalledWith('sortOrder', 'sortDefault');
        expect(amendFlightStore.togglePreFilteredMessage).toHaveBeenCalledWith(true);
    });

    it('initAmendFlightsPage - from date change journey - should set booking', async () => {
        amendFlightStore.scenario = AmendScenarios.FromChangeDate;
        amendFlightStore.changeSelectedFlight = jest.fn();

        await amendFlightStore.initAmendFlightsPage(null, null, null, null);

        expect(amendFlightStore.booking).toBe(mockBooking);
    });

    it('goToAmendFlightsRedirectPage', () => {
        amendFlightStore.goToAmendFlightsRedirectPage();

        expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBookings);
    });

    describe('initFlightsPageFroPayload', () => {
        it('should call viewBookingStore initBookingFromPayload and call callback', async () => {
            amendFlightStore.getAmendFlightsOffers = jest.fn().mockReturnValue(mockFlightsOffers) as any;
            await amendFlightStore.initFlightsPageFromPayload(null, null, null, null);

            expect(rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();

            expect(amendFlightStore.booking).toBe(mockBooking);
            expect(amendFlightStore.getAmendFlightsOffers).toBeCalled();
        });
    });

    it('toggleNoAvailableFlightsPopup', async () => {
        amendFlightStore.toggleNoAvailableFlightsPopup(true);

        expect(amendFlightStore.isNoAvailableFlightsPopupShown).toBe(true);
    });

    it('toggleOtherDepartureAirportsPopup', async () => {
        amendFlightStore.toggleOtherDepartureAirportsPopup(true);

        expect(amendFlightStore.isOtherDepartureAirportsPopupShown).toBe(true);
    });

    it('togglePreFilteredMessage', async () => {
        amendFlightStore.togglePreFilteredMessage(true);

        expect(amendFlightStore.isPreFilteredMessageShown).toBe(true);
    });

    it('updateFlightsDataStatus', async () => {
        amendFlightStore.updateFlightsDataStatus(DataStatus.Loading);

        expect(amendFlightStore.status).toBe(DataStatus.Loading);
    });

    it('getSelectedTimeSlots', async () => {
        amendFlightStore.getSelectedFiltersByGroupCode = jest.fn(v => v) as any;

        expect(amendFlightStore.getSelectedTimeSlots([{ timeSlot: { start: 1, end: 1 } }] as any).length).toBe(1);
    });

    describe('setBookingDepartureAirport', () => {
        it('should add filter', () => {
            amendFlightStore.addSelectedFilter = jest.fn();
            amendFlightStore.booking = {
                package: {
                    transport: {
                        routes: mockValidatedFlights.transports[0].routes,
                    },
                },
            } as any;
            amendFlightStore.setBookingDepartureAirport(mockFilterDepartureAirport.options);

            expect(amendFlightStore.addSelectedFilter).toHaveBeenCalledWith({
                code: 'LGW',
                name: 'London Gatwick',
                groupCode: 'altFlightsDepartureAirport',
                count: 10,
            });
        });

        it('should add options to group', () => {
            amendFlightStore.addFilterOptionsToGroup = jest.fn();
            amendFlightStore.booking = {
                package: {
                    transport: {
                        routes: mockValidatedFlights.transports[0].routes,
                    },
                },
            } as any;
            amendFlightStore.setBookingDepartureAirport([
                { ...mockFilterDepartureAirport.options[0], code: 'test_code' },
            ]);

            expect(amendFlightStore.addFilterOptionsToGroup).toHaveBeenCalled();
        });
    });

    it('hideUnavailablePopup', async () => {
        amendFlightStore.hideUnavailablePopup();
        expect(amendFlightStore.isPrevSelectedFlightUnavailable).toBe(false);
    });

    it('resetSelectedFlight', async () => {
        amendFlightStore.changeSelectedFlight = jest.fn();
        amendFlightStore.changePrevSelectedFlight = jest.fn();

        amendFlightStore.resetSelectedFlight();

        expect(amendFlightStore.changeSelectedFlight).toHaveBeenCalledWith(null);
        expect(amendFlightStore.changePrevSelectedFlight).toHaveBeenCalledWith(null);
        expect(amendFlightStore.rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalledWith(undefined);
    });

    it('changePrevSelectedFlight', async () => {
        amendFlightStore.changePrevSelectedFlight('flight' as any);
        expect(amendFlightStore.prevSelectedFlight).toBe('flight');
    });

    it('changeSelectedFlight', async () => {
        amendFlightStore.changeSelectedFlight('flight' as any);
        expect(amendFlightStore.selectedFlight).toBe('flight');
    });

    it('loadMoreAlternativeFlightsWithLivePrice', async () => {
        bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => ({
            transports: [],
        })) as any;
        amendFlightStore.updateFlightsDataStatus = jest.fn();
        amendFlightStore.alternativeFlights = mockValidatedFlights.transports as any;
        amendFlightStore.booking = {
            bookingReference: 'bookingReference',
            package: {
                transport: {
                    routes: mockValidatedFlights.transports[0].routes,
                },
            },
        } as any;

        await amendFlightStore.loadMoreAlternativeFlightsWithLivePrice();

        // Catch error
        bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => {
            throw new Error();
        }) as () => Promise<IAmendBookingFlightPromoDataResponse>;
        await amendFlightStore.loadMoreAlternativeFlightsWithLivePrice();

        // Wrong alternative flights response
        bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => ({
            transports: 'transports',
        })) as any;
        await amendFlightStore.loadMoreAlternativeFlightsWithLivePrice();
        expect(amendFlightStore.updateFlightsDataStatus).toHaveBeenCalledWith(DataStatus.Loaded);
    });

    describe('getValidatedFlight', () => {
        it('regular journey', async () => {
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn((_, v) => ({ transports: v })) as any;
            amendFlightStore.booking = {
                package: {
                    transport: {
                        routes: mockValidatedFlights.transports[0].routes,
                    },
                },
            } as IBookingInfo;
            const res: any = await amendFlightStore.getValidatedFlight(mockValidatedFlights.transports[0]!);

            expect(res!.transport.routes[0].id).toBe(mockValidatedFlights.transports[0].routes[0].id);
        });

        it('date change journey', async () => {
            bookingService.getAmendDatesValidatedFlights = jest.fn(() => [mockAmendDatesOfferWithPrice]) as any;
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;
            amendFlightStore.rootStore.amendDatesStore.flights.flightOffers = [mockAmendDatesOfferWithPrice];
            amendFlightStore.booking = {
                package: {
                    transport: {
                        routes: mockAmendDatesOfferWithPrice.offer.transport.routes,
                    },
                },
            } as IBookingInfo;

            const res = await amendFlightStore.getValidatedFlight(mockFlightsOffers[0].transport! as IAmendTransport);

            expect(res!.routes[0].id).toBe(mockAmendDatesOfferWithPrice.offer.transport.routes[0].id);
        });

        it('return undefined if no booking', async () => {
            const res: any = await amendFlightStore.getValidatedFlight(
                mockFlightsOffers[0].transport! as IAmendTransport,
            );

            expect(res).toBe(undefined);
        });

        it('return undefined if no amendDatesOffer in date change journey', async () => {
            bookingService.getAmendDatesValidatedFlights = jest.fn(() => []) as any;
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;
            amendFlightStore.rootStore.amendDatesStore.flights.flightOffers = [];

            const res = await amendFlightStore.getValidatedFlight(mockFlightsOffers[0].transport! as IAmendTransport);

            expect(res).toBe(undefined);
        });
    });

    describe('startAmendBookingFlights', () => {
        beforeEach(() => {
            amendFlightStore.clearStore = jest.fn();
            amendFlightStore.setDepartureFilters = jest.fn();
            amendFlightStore.toggleOtherDepartureAirportsPopup = jest.fn();
            rootStore.layoutStore.getSetting = jest.fn().mockReturnValue(true);
            amendFlightStore.toggleNoAvailableFlightsPopup = jest.fn();
            amendFlightStore.updateFlightsDataStatus = jest.fn();
            rootStore.viewBookingStore.toggleAmendErrorPopup = jest.fn();
            amendFlightStore.checkFlightOffersForBookingAirport = jest.fn(() => false);
            bookingService.getAmendAlternativeFlights = jest.fn(() => ({
                offers: [
                    { transport: mockValidatedFlights.transports[0] },
                    { transport: mockValidatedFlights.transports[1] },
                ],
            })) as any;
        });

        it('success response', async () => {
            await amendFlightStore.startAmendBookingFlights(booking);

            expect(amendFlightStore.clearStore).toHaveBeenCalled();
            expect(amendFlightStore.setDepartureFilters).toHaveBeenCalled();
            expect(amendFlightStore.toggleOtherDepartureAirportsPopup).toHaveBeenCalledWith(true);
            expect(amendFlightStore.booking?.bookingReference).toBe(booking.bookingReference);
            expect(amendFlightStore.alternativeOffers[0].transport.routes[0].id).toBe(
                mockValidatedFlights.transports[0].routes[0].id,
            );
        });

        it('departure content disabled', async () => {
            rootStore.layoutStore.getSetting = jest.fn(() => false);
            rootStore.routerStore.redirectToAmendFlightsPage = jest.fn();
            await amendFlightStore.startAmendBookingFlights(booking);

            expect(amendFlightStore.toggleNoAvailableFlightsPopup).toBeCalledWith(true);

            // No need offers
            amendFlightStore.checkFlightOffersForBookingAirport = jest.fn(() => true);
            await amendFlightStore.startAmendBookingFlights(booking);

            expect(amendFlightStore.rootStore.routerStore.redirectToAmendFlightsPage).toHaveBeenCalled();
        });

        it('calls callbacks if FromChangeDate and no flights', async () => {
            //@ts-expect-error return no flights
            amendFlightStore.getFlightOffers = jest.fn().mockReturnValue([]);
            const setNoAvailableFlightOffers = (rootStore.amendDatesStore.flights.setNoAvailableFlightOffers =
                jest.fn());
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;

            await amendFlightStore.startAmendBookingFlights(booking, AmendScenarios.FromChangeDate);

            expect(setNoAvailableFlightOffers).toBeCalledWith(true);
            expect(amendFlightStore.toggleNoAvailableFlightsPopup).toBeCalledWith(true);
        });

        it('handle error for booking flow', async () => {
            rootStore.layoutStore.getSetting = jest.fn(() => false);
            bookingService.getAmendAlternativeFlights = jest.fn(() => {
                throw new Error('Test error');
            });

            await amendFlightStore.startAmendBookingFlights(booking);

            expect(amendFlightStore.updateFlightsDataStatus).toBeCalledWith(DataStatus.Error);
            expect(amendFlightStore.rootStore.viewBookingStore.toggleAmendErrorPopup).toBeCalledWith(true);
        });

        it('handle error for amend dates flow', async () => {
            rootStore.layoutStore.getSetting = jest.fn(() => false);
            bookingService.getAmendAlternativeFlights = jest.fn(() => {
                throw new Error('Test error');
            });

            await amendFlightStore.startAmendBookingFlights(booking, AmendScenarios.FromChangeDate);

            expect(amendFlightStore.updateFlightsDataStatus).toHaveBeenCalledWith(DataStatus.Error);
            expect(amendFlightStore.rootStore.amendDatesStore.setIsSummaryRequestError).toHaveBeenCalledWith(true);
        });
    });

    it('goToAmendFlightsRedirectPage', () => {
        amendFlightStore.goToAmendFlightsRedirectPage();

        expect(rootStore.routerStore.redirectTo).toHaveBeenCalled();
    });

    it('clearStore', () => {
        amendFlightStore.changeSelectedFlight = jest.fn();
        amendFlightStore.clearStore();

        expect(amendFlightStore.booking).toBe(null);
        expect(amendFlightStore.alternativeFlights.length).toBe(0);
        expect(amendFlightStore.changeSelectedFlight).toHaveBeenCalled();
        expect(amendFlightStore.filters.length).toBe(0);
        expect(amendFlightStore.selectedFilters.length).toBe(0);
        expect(amendFlightStore.isPrevSelectedFlightUnavailable).toBe(false);
        expect(amendFlightStore.scenario).toBe(AmendScenarios.FromBooking);
    });

    it('goToAmendFlightsRedirectPage', () => {
        amendFlightStore.sorting.sortOptions = [
            { value: AlternativeFlightsSortBy.OutboundEarliestDeparture, label: 'label' },
        ];
        amendFlightStore.sorting.sortBy = AlternativeFlightsSortBy.OutboundEarliestDeparture;

        expect(amendFlightStore.sorting.selectedSortOption?.value).toBe(
            AlternativeFlightsSortBy.OutboundEarliestDeparture,
        );
    });

    it('selectedDepartureAirports', () => {
        amendFlightStore.selectedFilters = [{ groupCode: FilterGroupCodes.AltFlightsDepartureAirports }] as any;
        expect(amendFlightStore.selectedDepartureAirports[0].groupCode).toBe(
            FilterGroupCodes.AltFlightsDepartureAirports,
        );
    });

    it('departureAirports', () => {
        amendFlightStore.getFiltersGroup = jest.fn(v => ({ options: v })) as any;

        expect(amendFlightStore.departureAirports).toBe(FilterGroupCodes.AltFlightsDepartureAirports);
    });

    it('errataFlightInfo', () => {
        amendFlightStore.booking = booking;

        expect(amendFlightStore.errataFlightInfo).toBe(booking.package.transport.errataFlightInfo);
    });

    it('bookingRoutes', () => {
        amendFlightStore.booking = booking;

        expect(amendFlightStore.bookingRoutes[0].id).toBe(booking.package.transport.routes[0].id);
    });

    describe('loadInitialAlternativeFlights', () => {
        it('Should not call fetchAlternativeFlights when no booking', async () => {
            amendFlightStore.fetchAlternativeFlights = jest.fn() as jest.Mocked<any>;

            await amendFlightStore.loadInitialAlternativeFlights();
            expect(amendFlightStore.fetchAlternativeFlights).not.toHaveBeenCalled();
        });

        it('Should cancel axios token when it exists', async () => {
            const cancelSource = jest.fn();
            amendFlightStore.validateFlightsCancelSource = {
                cancel: cancelSource,
            } as jest.Mocked<any>;

            await amendFlightStore.loadInitialAlternativeFlights();

            expect(cancelSource).toHaveBeenCalled();
        });

        it('Should not set updateFlightsDataStatus to error state when axios cancel was called', async () => {
            amendFlightStore.booking = booking;
            mockAxiosIsCancel.mockImplementationOnce(() => true);
            amendFlightStore.changeSelectedFlight = jest.fn();
            amendFlightStore.changePrevSelectedFlight = jest.fn();
            amendFlightStore.fetchAlternativeFlights = jest.fn().mockImplementation(() => {
                throw new Error();
            }) as jest.Mocked<any>;

            try {
                await amendFlightStore.loadInitialAlternativeFlights();
            } catch (e) {
                expect(mockAxiosIsCancel).toHaveBeenCalled();
                expect(amendFlightStore.updateFlightsDataStatus).not.toHaveBeenCalled();
            }
        });

        it('Should load alternative flight', async () => {
            amendFlightStore.booking = booking;
            amendFlightStore.changeSelectedFlight = jest.fn();
            amendFlightStore.changePrevSelectedFlight = jest.fn();
            amendFlightStore.fetchAlternativeFlights = jest.fn(() => ({
                alternativeFlights: mockValidatedFlights.transports,
                alternativeOffers: mockFlightsOffers,
            })) as any;

            await amendFlightStore.loadInitialAlternativeFlights();
            expect(amendFlightStore.changeSelectedFlight).toHaveBeenCalled();
            expect(amendFlightStore.changePrevSelectedFlight).toHaveBeenCalled();
            expect(mockAxiosCancelSource).toHaveBeenCalled();
        });

        it('Clear alternative offers as no validated flights were get', async () => {
            amendFlightStore.booking = booking;
            amendFlightStore.alternativeOffers = mockFlightsOffers;
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => ({
                transports: [],
            })) as any;

            expect(amendFlightStore.alternativeOffers.length).toBe(2);
            amendFlightStore.getValidatedFlight = jest.fn(() => null) as any;
            await amendFlightStore.loadInitialAlternativeFlights();

            expect(amendFlightStore.alternativeOffers.length).toBe(0);
        });

        it('Getting validated noAvailable flight', async () => {
            amendFlightStore.booking = booking;
            amendFlightStore.selectedFlight = mockValidatedFlights.transports[0];
            amendFlightStore.resetSelectedFlight = jest.fn();
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => ({ transports: [] })) as any;

            amendFlightStore.getValidatedFlight = jest.fn(() => null) as any;
            await amendFlightStore.loadInitialAlternativeFlights();

            expect(amendFlightStore.resetSelectedFlight).toHaveBeenCalled();
            expect(amendFlightStore.alternativeFlights[0].notAvailable).toBe(true);
        });

        it('Getting invalid flight', async () => {
            amendFlightStore.booking = booking;

            amendFlightStore.getValidatedFlight = jest.fn((data: IAmendTransport) =>
                Promise.resolve({ ...data, notAvailable: true } as IAmendTransport),
            );
            amendFlightStore.fetchAlternativeFlights = jest.fn(() => ({
                alternativeFlights: [],
                alternativeOffers: mockFlightsOffers,
            })) as any;

            await amendFlightStore.loadInitialAlternativeFlights();

            expect(amendFlightStore.alternativeFlights.length).toBe(1);
            expect(amendFlightStore.alternativeFlights[0].notAvailable).toBe(true);
        });

        it('should set to true isPrevSelectedFlightUnavailable property', async () => {
            amendFlightStore.booking = booking;

            amendFlightStore.getValidatedFlight = jest.fn((data: IAmendTransport) =>
                Promise.resolve({
                    ...data,
                    notAvailable: true,
                } as IAmendTransport),
            );
            amendFlightStore.fetchAlternativeFlights = jest.fn(() => ({
                alternativeFlights: [],
                alternativeOffers: mockFlightsOffers,
            })) as any;

            expect(amendFlightStore.isPrevSelectedFlightUnavailable).toBeFalsy();
            await amendFlightStore.loadInitialAlternativeFlights();

            expect(amendFlightStore.isPrevSelectedFlightUnavailable).toBe(true);
        });
    });

    it('checkFlightOffersForBookingAirport', async () => {
        amendFlightStore.booking = booking;

        const offers = mockValidatedFlights.transports.map(({ routes }) => routes[0]) as IRoute[];
        const result = amendFlightStore.checkFlightOffersForBookingAirport(offers as any);

        expect(result).toBe(true);
    });

    it('getAmendFlightsOffers - Fetch with airports filter', async () => {
        amendFlightStore.booking = booking;
        amendFlightStore.selectedFilters = mockAltFlightsFilters[0].options;
        bookingService.getAmendAlternativeFlights = jest.fn(v => ({ offers: v })) as any;

        await amendFlightStore.getAmendFlightsOffers();

        expect(bookingService.getAmendAlternativeFlights).toBeCalledWith(booking, undefined);
    });

    it('getAmendFlightsOffers - Fetch with booking departure filter', async () => {
        amendFlightStore.booking = booking;
        amendFlightStore.selectedFilters = mockAltFlightsFilters[0].options;
        bookingService.getAmendAlternativeFlights = jest.fn(v => ({ offers: v })) as any;

        await amendFlightStore.getAmendFlightsOffers(undefined);

        expect(bookingService.getAmendAlternativeFlights).toBeCalledWith(booking, undefined);
    });

    it('fetchAlternativeFlights', async () => {
        settings.AmendFlights.itemsPerPage = 2;
        amendFlightStore.alternativeOffers = mockValidatedFlights.transports.map(transport => ({
            transport,
        })) as any;

        bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(
            (_, transports: { price: number; pricePP: number; transport: ITransport }[]) => ({
                transports: transports.slice(0, 1).map(({ transport }) => transport),
            }),
        ) as any;

        const { alternativeFlights } = await amendFlightStore.fetchAlternativeFlights(booking);

        expect(alternativeFlights.length).toBe(2);
    });

    describe('getValidatedFlights', () => {
        it('Should call amendDatesFlightStore mapping functions before and after API call and save validated offers', async () => {
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;

            bookingService.getAmendDatesValidatedFlights = jest.fn(() => [mockAmendDatesOfferWithPrice]) as any;

            await amendFlightStore.getValidatedFlights([mockFlightsOffers[0]], mockBooking);

            expect(
                amendFlightStore.rootStore.amendDatesStore.flights.getValidatedFlightsAndUpdateOffers,
            ).toHaveBeenCalledWith([mockFlightsOffers[0]], undefined);
        });

        it('handle validate for regular amend', async () => {
            amendFlightStore.scenario = AmendScenarios.FromBooking;

            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => ({
                transports: [mockValidatedFlights.transports[0]],
            })) as any;

            const validatedFlights = await amendFlightStore.getValidatedFlights([mockFlightsOffers[0]], mockBooking);

            expect(validatedFlights).toEqual([mockValidatedFlights.transports[0]]);
        });
    });

    it('getFlightOffers for regular amend', async () => {
        amendFlightStore.scenario = AmendScenarios.FromBooking;
        amendFlightStore.booking = mockBooking;
        bookingService.getAmendAlternativeFlights = jest.fn(() => ({
            offers: [mockFlightsOffers[0]],
        })) as any;

        const flightOffers = await amendFlightStore.getFlightOffers();

        expect(flightOffers).toEqual([mockFlightsOffers[0]]);
    });

    it('getFlightOffers for amend dates', async () => {
        amendFlightStore.scenario = AmendScenarios.FromChangeDate;
        amendFlightStore.booking = mockBooking;

        const flightOffers = await amendFlightStore.getFlightOffers();

        expect(amendFlightStore.rootStore.amendDatesStore.flights.getChangeDateAmendFlightsOffers).toHaveBeenCalled();

        expect(flightOffers).toEqual([mockFlightsOffers[0]]);
    });

    it('submitFlightChangeSelection - regular journey - should call continueToPay', () => {
        amendFlightStore.scenario = AmendScenarios.FromBooking;
        amendFlightStore.selectedFlight = mockFlightsOffers[0].transport as IAmendTransport;

        amendFlightStore.submitFlightChangeSelection();

        expect(amendFlightStore.rootStore.viewBookingStore.continueToPay).toHaveBeenCalled();
    });

    it('submitFlightChangeSelection - amend dates journey - should call amendDatesStore function', () => {
        amendFlightStore.scenario = AmendScenarios.FromChangeDate;
        amendFlightStore.selectedFlight = mockFlightsOffers[0].transport as IAmendTransport;

        amendFlightStore.submitFlightChangeSelection();

        expect(amendFlightStore.rootStore.amendDatesStore.flights.submitFlightChangeSelection).toHaveBeenCalledWith(
            mockFlightsOffers[0].transport,
        );
    });

    it('getBackLink - regular journey', () => {
        amendFlightStore.scenario = AmendScenarios.FromBooking;

        expect(amendFlightStore.backLink).toBe(SitePath.ViewBooking);
    });

    it('getBackLink - amend dates journey', () => {
        amendFlightStore.scenario = AmendScenarios.FromChangeDate;

        expect(amendFlightStore.backLink).toBe(SitePath.AmendDatesSummary);
    });

    describe('isFromChangeDate', () => {
        it('returns right value', () => {
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;

            expect(amendFlightStore.isFromChangeDate).toBe(true);

            amendFlightStore.scenario = AmendScenarios.FromBooking;

            expect(amendFlightStore.isFromChangeDate).toBe(false);
        });
    });

    describe('isFromBooking', () => {
        it('returns right value', () => {
            amendFlightStore.scenario = AmendScenarios.FromChangeDate;

            expect(amendFlightStore.isFromBooking).toBe(false);

            amendFlightStore.scenario = AmendScenarios.FromBooking;

            expect(amendFlightStore.isFromBooking).toBe(true);
        });
    });

    describe('Catching an error', () => {
        it('Should catch RoutesModifyProhibited error', async () => {
            amendFlightStore.booking = booking;
            amendFlightStore.goToAmendFlightsRedirectPage = jest.fn();
            amendFlightStore.updateFlightsDataStatus = jest.fn();
            amendFlightStore.alternativeOffers = mockValidatedFlights.transports.map(transport => ({
                transport,
            })) as any;
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => {
                throw { errorCode: ApiErrors.RoutesModifyProhibited };
            }) as () => Promise<IAmendBookingFlightPromoDataResponse>;

            await amendFlightStore.loadInitialAlternativeFlights();
            expect(amendFlightStore.goToAmendFlightsRedirectPage).toHaveBeenCalled();
        });

        it('Should catch any other error', async () => {
            amendFlightStore.alternativeOffers = mockValidatedFlights.transports.map(transport => ({
                transport,
            })) as any;
            amendFlightStore.booking = booking;
            amendFlightStore.goToAmendFlightsRedirectPage = jest.fn();
            amendFlightStore.updateFlightsDataStatus = jest.fn();
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(() => {
                throw { errorCode: 'errorCode' };
            }) as () => Promise<IAmendBookingFlightPromoDataResponse>;

            await amendFlightStore.loadInitialAlternativeFlights();
            expect(amendFlightStore.alternativeFlights.length).toBe(0);
            expect(amendFlightStore.updateFlightsDataStatus).toHaveBeenCalledWith(DataStatus.Error);
        });
    });

    describe('Amend CTA state', () => {
        it('should be visible byAtcom reason when lead passenger is logged in', () => {
            (amendFlightStore.rootStore.viewBookingStore as any).isLeadLoggedIn = true;
            amendFlightStore.rootStore.viewBookingStore!.booking!.amendmentInfo!.route = true;

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
        });

        it('should be visible when non lead passenger has been logged in and one of disabled statuses is not present', () => {
            (amendFlightStore.rootStore.viewBookingStore
                .allowanceRestrictions as jest.MockedObject<TViewBookingRestrictions>) = {
                [BookingAllowanceRestrictions.ByLeadPassenger]: true,
                [BookingAllowanceRestrictions.ByExternalAgency]: true,
            };

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
        });

        it('should not be visible when non lead passenger has been logged in and one of disabled statuses is present', () => {
            (amendFlightStore.rootStore.viewBookingStore
                .allowanceRestrictions as jest.MockedObject<TViewBookingRestrictions>) = {
                [BookingAllowanceRestrictions.ByLeadPassenger]: true,
                [BookingAllowanceRestrictions.ByExternalAgency]: false,
            };
            (amendFlightStore.rootStore.viewBookingStore.isLeadLoggedIn as boolean) = false;
            (amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AMEND_FLIGHTS_DISABLED_STATUSES[0]];

            expect(amendFlightStore.isAmendCTAVisible).toBe(false);
        });

        it('should be visible but disabled when flight disabled by disruption', () => {
            ((amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendFlightsDisabledByFlightDisruption]),
                expect(amendFlightStore.isAmendCTAVisible).toBe(true);
            expect(amendFlightStore.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled for Trade Booking', () => {
            amendFlightStore.rootStore.viewBookingStore.allowanceRestrictions.byExternalAgency = true;

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
            expect(amendFlightStore.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled for out of sync error', () => {
            (amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendFlightsDisabledByOutOfSync];

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
            expect(amendFlightStore.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled for manifested flights', () => {
            (amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendFlightsDisabledManifestedFlights];

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
            expect(amendFlightStore.isAmendCTADisabled).toBe(true);
        });

        it('should be visible but disabled because of airport parking', () => {
            (amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [AmendBookingStatus.AmendFlightsDisabledByAirportParking];

            expect(amendFlightStore.isAmendCTAVisible).toBe(true);
            expect(amendFlightStore.isAmendCTADisabled).toBe(true);
        });
    });

    describe('allowanceRestrictions', () => {
        it('should return true for all fields', () => {
            (amendFlightStore.rootStore.viewBookingStore.amendBookingStatuses as jest.MockedObject<
                AmendBookingStatus[]
            >) = [
                AmendBookingStatus.AmendFlightsDisabledByOutOfSync,
                AmendBookingStatus.AmendFlightsDisabledManifestedFlights,
                AmendBookingStatus.AmendFlightsDisabledByTimeBound,
                AmendBookingStatus.AmendFlightsDisabledByFlightDisruption,
                AmendBookingStatus.AmendFlightsDisabledByAirportParking,
            ];

            const { byAtcom, byFlightManifested, byOutOfSync, byTimeBound, byDisruption, byAirportParking } =
                amendFlightStore.allowanceRestrictions;

            expect(byAtcom).toBe(true);
            expect(byFlightManifested).toBe(true);
            expect(byOutOfSync).toBe(true);
            expect(byTimeBound).toBe(true);
            expect(byDisruption).toBe(true);
            expect(byAirportParking).toBe(true);
        });
    });

    it('cancelFlightsValidation', () => {
        amendFlightStore.clearValidateFlightsToken = jest.fn();
        amendFlightStore.updateFlightsDataStatus = jest.fn();
        amendFlightStore.cancelFlightsValidation();

        expect(amendFlightStore.clearValidateFlightsToken).toBeCalled();
        expect(amendFlightStore.updateFlightsDataStatus).toBeCalledWith(DataStatus.NotLoaded);
    });

    describe('handleTrackIncorrectPriceSorting', () => {
        it('Should not be called when sorting is not by price', () => {
            amendFlightStore.trackIncorrectPriceSorting(
                mockValidatedFlights.transports,
                AlternativeFlightsSortBy.OutboundEarliestDeparture,
            );

            expect(
                amendFlightStore.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights,
            ).not.toHaveBeenCalled();
        });

        it('Should not be called when no flights were provided', () => {
            amendFlightStore.trackIncorrectPriceSorting([], AlternativeFlightsSortBy.PriceLowToHigh);

            expect(
                amendFlightStore.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights,
            ).not.toHaveBeenCalled();
        });

        it('Should not be called if incorrect order', () => {
            mockedCheckForOrderIncorrect.mockReturnValue(true);
            amendFlightStore.trackIncorrectPriceSorting(
                [mockValidatedFlights.transports[0], mockValidatedFlights.transports[1]],
                AlternativeFlightsSortBy.OutboundEarliestDeparture,
            );

            expect(
                amendFlightStore.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights,
            ).not.toHaveBeenCalled();
        });

        it('Should track event when sorting is by price', () => {
            mockedCheckForOrderIncorrect.mockReturnValue(true);
            amendFlightStore.trackIncorrectPriceSorting(
                mockValidatedFlights.transports,
                AlternativeFlightsSortBy.PriceLowToHigh,
            );

            expect(
                amendFlightStore.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights,
            ).toHaveBeenCalledWith(AlternativeFlightsSortBy.PriceLowToHigh);

            amendFlightStore.trackIncorrectPriceSorting(
                mockValidatedFlights.transports,
                AlternativeFlightsSortBy.PriceHightToLow,
            );

            expect(
                amendFlightStore.rootStore.trackingStore.trackWrongPriceSortingAlternativeFlights,
            ).toHaveBeenCalledWith(AlternativeFlightsSortBy.PriceHightToLow);
        });
    });

    it('Should call trackIncorrectPriceSorting during reaction to alternativeFlights change', () => {
        amendFlightStore.trackIncorrectPriceSorting = jest.fn();
        runInAction(() => {
            amendFlightStore.alternativeFlights = mockValidatedFlights.transports;
        });

        expect(amendFlightStore.trackIncorrectPriceSorting).toHaveBeenCalledWith(
            amendFlightStore.alternativeFlights,
            AlternativeFlightsSortBy.PriceLowToHigh,
        );
    });

    describe('feePP computed property', () => {
        it('should return null when alternativeFlights is empty', () => {
            amendFlightStore.alternativeFlights = [];
            expect(amendFlightStore.feePP).toBeFalsy();
        });

        test('should return null when amendmentPaymentInfo does not have feesPerPersons', () => {
            amendFlightStore.alternativeFlights = mockValidatedFlights.transports;
            amendFlightStore.alternativeFlights[0].amendmentPaymentInfo!.feesPerPersons = null as any;
            expect(amendFlightStore.feePP).toBeFalsy();
        });

        test('should return null when feesPerPersons does not have items in the array', () => {
            amendFlightStore.alternativeFlights = mockValidatedFlights.transports;
            amendFlightStore.alternativeFlights[0].amendmentPaymentInfo!.feesPerPersons = [];
            expect(amendFlightStore.feePP).toBeFalsy();
        });

        test('should return the feesPerPersonAmount when available', () => {
            amendFlightStore.alternativeFlights = mockValidatedFlights.transports;
            expect(amendFlightStore.feePP).toBe(2);
        });
    });
});
