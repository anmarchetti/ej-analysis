import { mockBooking } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { mockPendingObservablePromise } from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { getWebStorageItem, removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IApolloBookingItem } from 'models/data/IApolloBooking';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { BookingsTabs, ViewBookingsStore } from './ViewBookingsStore';

jest.mock('frontend/services/booking.service');

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(),
    removeWebStorageItem: jest.fn(),
}));

describe('<ViewBookingsStore />', () => {
    const rootStore = {
        userStore: {
            isLoggedIn: true,
            checkIfUserLoggedIn: jest.fn(() => Promise.resolve(true)),
        },
        holidayCreditStore: { fetchMyCreditBalance: jest.fn(), fetchBalanceHistory: jest.fn() },
        routerStore: { redirectToLoginPage: jest.fn() },
        queryParamsStore: { query: {} },
    } as any;

    const departureDateSortBy = {
        fields: {
            Code: { value: 'DEPARTUREDATE' },
            Title: { value: 'Departure date' },
        },
    };

    const mockFields = {
        BookingsSortOrder: [
            {
                fields: {
                    Code: {
                        value: 'BOOKINGDATE',
                    },
                    Title: {
                        value: 'Booking date',
                    },
                },
            },
            departureDateSortBy,
        ],
        BookingsSortDefault: departureDateSortBy,
        CancelledBookingsSortOrder: [
            {
                fields: {
                    Code: {
                        value: 'CANCELLATIONDATE',
                    },
                    Title: {
                        value: 'Cancellation date',
                    },
                },
            },
        ],
    } as any;

    const resetMocks = () => [
        {
            bookingDate: '2023-05-26T15:24:27+00:00',
            package: {
                accom: {
                    code: 'ESCD0007',
                    isExt: false,
                    startDate: '2030-04-17',
                    prom: 'EUBF',
                    endDate: '2030-04-24',
                },
            } as any,
            bookingStatus: '',
            cancellationDate: '',
        },
        {
            bookingDate: '2023-05-20T15:24:27+00:00',
            package: {
                accom: {
                    code: 'ESCD0007',
                    isExt: false,
                    startDate: '2030-04-20',
                    prom: 'EUBF',
                    endDate: '2000-04-24',
                },
            } as any,
        },
    ];

    const getApolloBookingMock = (overrides: Partial<IApolloBookingItem> = {}): IApolloBookingItem => ({
        bookingReference: 'REF001',
        hotelCode: 'ESMJ0047',
        hotelName: 'Test Hotel',
        hotelLocation: 'Majorca, Spain',
        holidayDateStartLocal: '2030-05-15T00:00:00Z',
        holidayDateEndLocal: '2030-05-22T00:00:00Z',
        holidayNightsCount: 7,
        resortCode: 'ESBABA',
        ...overrides,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2023, 6, 6) });
        mocks = resetMocks();
    });

    describe('Tab change', () => {
        it('should be upcoming', () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            viewBookingsStore.onTabChange(BookingsTabs.Upcoming);
            expect(viewBookingsStore.activeTab).toBe('Upcoming');
        });

        it('should be previous', () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            viewBookingsStore.onTabChange(BookingsTabs.Previous);
            expect(viewBookingsStore.activeTab).toBe('Previous');
        });

        it('should be canceled and disable sort by', () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            viewBookingsStore.onTabChange(BookingsTabs.Canceled);
            expect(viewBookingsStore.activeTab).toBe('Canceled');
            expect(viewBookingsStore.isSortByDisabled).toBeTruthy();
        });

        it('should return early if tab is the same', () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            viewBookingsStore.onTabChange(BookingsTabs.Upcoming);
            expect(viewBookingsStore.activeTab).toBe('Upcoming');
            viewBookingsStore.onTabChange(BookingsTabs.Upcoming);
            expect(viewBookingsStore.activeTab).toBe('Upcoming');
        });

        it('should reset sortBy to default if sortBy is not in availableSortOptions', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            await viewBookingsStore.initialize(mockFields);
            viewBookingsStore.onTabChange(BookingsTabs.Canceled);
            expect(viewBookingsStore.activeTab).toBe('Canceled');
            expect(viewBookingsStore.isSortByDisabled).toBeTruthy();
            expect(viewBookingsStore.sortBy).toEqual({ value: 'CANCELLATIONDATE', label: 'Cancellation date' });
            viewBookingsStore.onTabChange(BookingsTabs.Upcoming);
            expect(viewBookingsStore.activeTab).toBe('Upcoming');
            expect(viewBookingsStore.sortBy).toEqual({ value: 'DEPARTUREDATE', label: 'Departure date' });
        });
    });

    describe('fetch bookings', () => {
        it('should fetch upcoming bookings', async () => {
            jest.useFakeTimers({ now: new Date(2026, 4, 17) });
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [
                        {
                            package: {
                                accom: {
                                    code: 'ESCD0007',
                                    isExt: false,
                                    startDate: '2030-04-17',
                                    prom: 'EUBF',
                                    endDate: '2030-04-24',
                                },
                            } as any,
                        } as any,
                    ],
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.upcomingBookings).toHaveLength(1);
            expect(viewBookingsStore.upcomingCount).toBe(1);
        });

        it('should fetch previous bookings', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [
                        {
                            package: {
                                accom: {
                                    code: 'ESCD0007',
                                    isExt: false,
                                    startDate: '2000-04-17',
                                    prom: 'EUBF',
                                    endDate: '2000-04-24',
                                },
                                transport: {
                                    routes: [{ depDate: '2000-04-17' }, { depDate: '2000-04-21' }],
                                },
                            } as any,
                        } as any,
                    ],
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.previousBookings).toHaveLength(1);
            expect(viewBookingsStore.previousCount).toBe(1);
        });

        it('should show canceled bookings', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [
                        {
                            package: {
                                accom: {
                                    code: 'ESCD0007',
                                    isExt: false,
                                    startDate: '2000-04-17',
                                    prom: 'EUBF',
                                    endDate: '2000-04-24',
                                },
                            } as any,
                            bookingStatus: 'CANCELED',
                        } as any,
                    ],
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.canceledBookings).toHaveLength(1);
            expect(viewBookingsStore.canceledCount).toBe(1);
        });

        it('should return empty list', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [],
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.hasNoBookings).toBeTruthy();
        });

        it('should handle request error', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(Promise.reject({}));
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.hasNoBookings).toBeTruthy();
        });

        it('should get latest confirmed booking from storage and fetch info for it if this booking is NOT presented in the list', async () => {
            const mockFutureBooking = {
                ...mockBooking,
                package: {
                    ...mockBooking.package,
                    transport: {
                        routes: [{ depDate: '2000-04-17' }, { depDate: '2030-04-17' }],
                    },
                } as any,
            };
            jest.useFakeTimers({ now: new Date(2026, 4, 17) });
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            const latestConfirmedBooking = {
                bookingReference: '12345',
                date: '01/01/2026',
                lastName: 'Smith',
            };
            (getWebStorageItem as jest.Mock).mockReturnValue(latestConfirmedBooking);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [],
                }),
            );
            bookingService.viewBooking = jest.fn().mockResolvedValueOnce({ data: mockFutureBooking });
            await viewBookingsStore.initialize(mockFields);
            expect(getWebStorageItem as jest.Mock).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                true,
                sessionStorage,
            );
            expect(bookingService.viewBooking).toHaveBeenCalledWith(
                latestConfirmedBooking.date,
                latestConfirmedBooking.bookingReference,
                latestConfirmedBooking.lastName,
            );

            expect(viewBookingsStore.upcomingBookings).toEqual([mockFutureBooking]);
            expect(viewBookingsStore.upcomingCount).toBe(1);
        });

        it('should NOT fetch latest confirmed booking if this booking is presented in the list', async () => {
            jest.useFakeTimers({ now: new Date(2026, 4, 17) });
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            const mockFutureBooking = {
                ...mockBooking,
                bookingReference: '12345',
                package: {
                    ...mockBooking.package,
                    transport: {
                        routes: [{ depDate: '2000-04-17' }, { depDate: '2030-04-17' }],
                    },
                } as any,
            };
            const latestConfirmedBooking = {
                bookingReference: '12345',
                date: '01/01/2026',
                lastName: 'Smith',
            };
            (getWebStorageItem as jest.Mock).mockReturnValue(latestConfirmedBooking);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [mockFutureBooking],
                }),
            );
            bookingService.viewBooking = jest.fn();
            await viewBookingsStore.initialize(mockFields);
            expect(getWebStorageItem as jest.Mock).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                true,
                sessionStorage,
            );
            expect(removeWebStorageItem as jest.Mock).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                sessionStorage,
            );
            expect(bookingService.viewBooking).not.toHaveBeenCalled();
            expect(viewBookingsStore.upcomingBookings).toEqual([mockFutureBooking]);
            expect(viewBookingsStore.upcomingCount).toBe(1);
        });
    });

    describe('user is NOT auth', () => {
        const rootStore = {
            userStore: {
                isLoggedIn: false,
                checkIfUserLoggedIn: jest.fn(() => Promise.resolve(false)),
                onLogout: jest.fn(),
            },
            routerStore: { redirectToLoginPage: jest.fn() },
            queryParamsStore: { buildQuery: jest.fn(() => 'my_bookings=1') },
        } as any;

        it('should hard redirect to login page', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);

            await viewBookingsStore.initialize(mockFields);

            expect(rootStore.routerStore.redirectToLoginPage).toHaveBeenCalledWith(true, undefined);
        });

        it('should soft redirect to login page when firebase source query param are present', async () => {
            rootStore.queryParamsStore.firebaseSource = 'push';
            const viewBookingsStore = new ViewBookingsStore(rootStore);

            await viewBookingsStore.initialize(mockFields);

            expect(rootStore.routerStore.redirectToLoginPage).toHaveBeenCalledWith(false, 'my_bookings=1');
        });
    });

    describe('sort', () => {
        it('should sort by departure date by default', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: mocks,
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.upcomingBookings).toHaveLength(2);
            expect(viewBookingsStore.upcomingCount).toBe(2);
            expect(viewBookingsStore.sortBy).toEqual({ value: 'DEPARTUREDATE', label: 'Departure date' });
            expect(viewBookingsStore.upcomingBookings).toEqual(mocks);
        });

        it('should be disabled for one booking', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: [mocks[0]],
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.upcomingBookings).toHaveLength(1);
            expect(viewBookingsStore.upcomingCount).toBe(1);
            expect(viewBookingsStore.isSortByDisabled).toBeTruthy();
        });

        it('should sort by booking date', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: mocks,
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.upcomingBookings).toHaveLength(2);
            expect(viewBookingsStore.upcomingCount).toBe(2);
            viewBookingsStore.setSortBy({ value: 'BOOKINGDATE', label: 'Booking date' });
            expect(viewBookingsStore.sortBy).toEqual({ value: 'BOOKINGDATE', label: 'Booking date' });
            expect(viewBookingsStore.upcomingBookings).toEqual(mocks.reverse());
        });

        // @TODO: Sort this out
        it('should sort cancelled bookings by cancelled date', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            mocks = [
                {
                    ...mocks[0],
                    bookingStatus: 'CANCELED',
                    cancellationDate: '2023-05-20T15:24:27+00:00',
                },
                {
                    ...mocks[1],
                    bookingStatus: 'CANCELED',
                    cancellationDate: '2023-05-26T15:24:27+00:00',
                },
            ];
            bookingService.fetchBookings = jest.fn().mockReturnValue(
                Promise.resolve({
                    data: mocks,
                }),
            );
            await viewBookingsStore.initialize(mockFields);
            expect(viewBookingsStore.canceledBookings).toHaveLength(2);
            expect(viewBookingsStore.canceledCount).toBe(2);
            viewBookingsStore.setSortBy({ value: 'CANCELLATIONDATE', label: 'Cancellation date' });
            expect(viewBookingsStore.sortBy).toEqual({ value: 'CANCELLATIONDATE', label: 'Cancellation date' });
            expect(viewBookingsStore.canceledBookings).toEqual(mocks.reverse());
        });
    });

    describe('cancelFetchBookings', () => {
        it('should cancel the fetch bookings request if it is pending', async () => {
            const viewBookingsStore = new ViewBookingsStore(rootStore);
            viewBookingsStore.bookingsRequest = mockPendingObservablePromise();
            jest.spyOn(viewBookingsStore.bookingsRequest, 'cancel');
            viewBookingsStore.cancelFetchBookings();

            expect(viewBookingsStore.bookingsRequest.cancel).toHaveBeenCalled();
        });
    });

    describe('Apollo bookings', () => {
        describe('fetchBookingsFromApollo', () => {
            it('should fetch and store Apollo bookings when user is logged in', async () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                const mockApolloData = {
                    data: {
                        bookings: [
                            getApolloBookingMock(),
                            getApolloBookingMock({
                                bookingReference: 'REF002',
                                hotelName: 'Another Hotel',
                                hotelLocation: 'Greece',
                                holidayDateStartLocal: '2030-06-20T00:00:00Z',
                                holidayDateEndLocal: '2030-07-04T00:00:00Z',
                                holidayNightsCount: 14,
                            }),
                        ],
                    },
                };

                bookingService.fetchBookingsFromApollo = jest.fn().mockResolvedValue(mockApolloData);

                await viewBookingsStore.fetchBookingsFromApollo();

                expect(bookingService.fetchBookingsFromApollo).toHaveBeenCalled();
                expect(viewBookingsStore.apolloBookings).toHaveLength(2);
                expect(viewBookingsStore.apolloBookings[0].bookingReference).toBe('REF001');
                expect(viewBookingsStore.apolloBookings[1].bookingReference).toBe('REF002');
            });

            it('should not fetch when user is not logged in', async () => {
                const notLoggedInRootStore = {
                    ...rootStore,
                    userStore: { ...rootStore.userStore, isLoggedIn: false },
                };
                const viewBookingsStore = new ViewBookingsStore(notLoggedInRootStore);

                bookingService.fetchBookingsFromApollo = jest.fn();

                await viewBookingsStore.fetchBookingsFromApollo();

                expect(bookingService.fetchBookingsFromApollo).not.toHaveBeenCalled();
                expect(viewBookingsStore.apolloBookings).toHaveLength(0);
            });

            it('should handle errors and set apolloBookings to empty array', async () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);

                bookingService.fetchBookingsFromApollo = jest.fn().mockRejectedValue(new Error('Network error'));

                await viewBookingsStore.fetchBookingsFromApollo();

                expect(viewBookingsStore.apolloBookings).toHaveLength(0);
            });
        });

        describe('clearApolloBookings', () => {
            it('should clear Apollo bookings', () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                viewBookingsStore.apolloBookings = [getApolloBookingMock()];

                viewBookingsStore.clearApolloBookings();

                expect(viewBookingsStore.apolloBookings).toHaveLength(0);
            });

            it('should clear upcoming hotel image', () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                viewBookingsStore.apolloBookings = [getApolloBookingMock()];
                viewBookingsStore.upcomingHotelImagePath = '/-/jssmedia/test123.ashx';

                viewBookingsStore.clearApolloBookings();

                expect(viewBookingsStore.upcomingHotelImagePath).toBeNull();
            });
        });

        describe('fetchUpcomingHotelImage', () => {
            it('should fetch and store hotel image path successfully', async () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                const mockImagePath = '/-/jssmedia/test123.ashx';

                const sitecoreService = require('frontend/services/sitecore.service').default;
                jest.spyOn(sitecoreService, 'getHotelImage').mockResolvedValue(mockImagePath);

                await viewBookingsStore.fetchUpcomingHotelImage('ESMJ0047', 'ESBABA');

                expect(viewBookingsStore.upcomingHotelImagePath).toBe(mockImagePath);
            });

            it('should handle errors and set upcomingHotelImagePath to null', async () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);

                const sitecoreService = require('frontend/services/sitecore.service').default;
                jest.spyOn(sitecoreService, 'getHotelImage').mockRejectedValue(new Error('Image not found'));

                await viewBookingsStore.fetchUpcomingHotelImage('INVALID_CODE', 'INVALID_RESORT');

                expect(viewBookingsStore.upcomingHotelImagePath).toBeNull();
            });
        });

        describe('apolloUpcomingBooking computed', () => {
            it('should return null when apolloBookings is empty', () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);

                expect(viewBookingsStore.apolloUpcomingBooking).toBeNull();
            });

            it('should return the soonest confirmed future booking', () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                viewBookingsStore.apolloBookings = [
                    getApolloBookingMock({
                        bookingReference: 'REF001',
                        hotelLocation: 'Greece',
                        holidayDateStartLocal: '2030-06-20T00:00:00Z',
                        holidayDateEndLocal: '2030-07-04T00:00:00Z',
                        holidayNightsCount: 14,
                    }),
                    getApolloBookingMock({
                        bookingReference: 'REF002',
                    }),
                ];

                const upcomingBooking = viewBookingsStore.apolloUpcomingBooking;

                expect(upcomingBooking).not.toBeNull();
                expect(upcomingBooking?.bookingReference).toBe('REF002');
                expect(upcomingBooking?.holidayDateStartLocal).toBe('2030-05-15T00:00:00Z');
            });

            it('should filter out past bookings', () => {
                const viewBookingsStore = new ViewBookingsStore(rootStore);
                viewBookingsStore.apolloBookings = [
                    getApolloBookingMock({
                        holidayDateStartLocal: '2020-05-15T00:00:00Z',
                        holidayDateEndLocal: '2020-05-22T00:00:00Z',
                    }),
                ];

                expect(viewBookingsStore.apolloUpcomingBooking).toBeNull();
            });
        });
    });
});
