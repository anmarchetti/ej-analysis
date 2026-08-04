import { renderHook, waitFor } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';
import { IBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { useChatbotTracking } from './useChatbotTracking/useChatbotTracking';
import { useBoard, useDatesLabel, useGuests, useNightsLabel, useViewBookingPageInit } from './viewBooking.hooks';

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            isPostTravelPage: false,
            isViewBookingStatusPage: false,
            isPreTravelPage: false,
            isInDestinationPage: false,
            isLoadingTransfers: false,
            clearViewBookingPayload: jest.fn(),
            isBookingClearRequired: jest.fn().mockReturnValue(false),
            isBookingPayloadClearRequired: jest.fn().mockReturnValue(false),
            setIsViewBookingStatusPage: jest.fn(),
            readRefreshBookingPayloadFromStorage: jest.fn(),
            loadBookingTransfers: jest.fn().mockResolvedValue({}),
        },
        userStore: {
            setUserDetails: jest.fn().mockResolvedValue({}),
        },
        amendRoomAndBoardStore: {
            clearStore: jest.fn(),
        },
        amendTransfersStore: {
            clearStore: jest.fn(),
        },
        amendFlightsStore: {
            clearStore: jest.fn(),
        },
        amendHotelStore: {
            clearStore: jest.fn(),
        },
        flightsPassengersStore: {
            setPassengersStore: jest.fn(),
        },
        hotelReviewsStore: {
            fetchReviews: jest.fn().mockResolvedValue({}),
        },
    });

let mockStores = createStores();

jest.mock('./useChatbotTracking/useChatbotTracking', () => ({
    useChatbotTracking: jest.fn(),
}));

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => true),
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingPayload: jest.fn(() => ({
        lastName: 'Brown',
        date: '2023-05-11',
    })),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('viewBooking.hooks', () => {
    describe('useNightsLabel', () => {
        it('should return the result', () => {
            const { result } = renderHook(() => useNightsLabel('2019-06-01', '2019-06-02', el => el));

            expect(result.current).toEqual('1 Globals.Labels.NightSingular');
        });

        it('should return the result for multiple nights', () => {
            const { result } = renderHook(() => useNightsLabel('2019-06-01', '2019-06-03', el => el));

            expect(result.current).toEqual('2 Globals.Labels.NightsPlural');
        });

        it('should return null when no start date', () => {
            const { result } = renderHook(() => useNightsLabel('', '2019-06-03', el => el));

            expect(result.current).toBeNull();
        });

        it('should return null when no end date', () => {
            const { result } = renderHook(() => useNightsLabel('2019-06-02', '', el => el));

            expect(result.current).toBeNull();
        });
    });

    describe('useGuests', () => {
        it('should return the result', () => {
            const { result } = renderHook(() =>
                useGuests(
                    { ...mockBooking, guests: [mockBooking.guests[0]] },
                    el => el,
                    SitecoreDictionary.BookingSummaryLabelsForPerson,
                    SitecoreDictionary.BookingSummaryLabelsForPeople,
                ),
            );

            expect(result.current).toEqual('BookingSummary.Labels.ForPerson');
        });

        it('should return the result for multiple guests', () => {
            const { result } = renderHook(() =>
                useGuests(
                    mockBooking,
                    el => el,
                    SitecoreDictionary.BookingSummaryLabelsForPerson,
                    SitecoreDictionary.BookingSummaryLabelsForPeople,
                ),
            );

            expect(result.current).toEqual('BookingSummary.Labels.ForPeople');
        });
    });

    describe('useDatesLabel', () => {
        const mockGetPhrase = jest.fn(p => p);

        it('should return the result when is trade', () => {
            const { result } = renderHook(() => useDatesLabel(mockBooking, true, mockGetPhrase));

            expect(result.current).toEqual(['Globals.Labels.From Tue 19 Jun - Thu 19 Jul 2029']);
        });

        it('should return correct result when is not trade', () => {
            const { result } = renderHook(() => useDatesLabel(mockBooking, false, mockGetPhrase));

            expect(result.current).toEqual(['Tue 19 Jun 2029', 'Thu 19 Jul 2029']);
        });

        it('should return an empty when no start date', () => {
            const { result } = renderHook(() =>
                useDatesLabel(
                    {
                        ...mockBooking,
                        package: { ...mockBooking.package, accom: { ...mockBooking.package.accom, startDate: '' } },
                    },
                    false,
                    mockGetPhrase,
                ),
            );

            expect(result.current).toStrictEqual([]);
        });

        it('should return an empty array when no end date and isTradePortal', () => {
            const { result } = renderHook(() =>
                useDatesLabel(
                    {
                        ...mockBooking,
                        package: { ...mockBooking.package, accom: { ...mockBooking.package.accom, endDate: '' } },
                    },
                    true,
                    mockGetPhrase,
                ),
            );

            expect(result.current).toStrictEqual([]);
        });

        it('should NOT return an empty array when no end date and is not TradePortal', () => {
            const { result } = renderHook(() =>
                useDatesLabel(
                    {
                        ...mockBooking,
                        package: { ...mockBooking.package, accom: { ...mockBooking.package.accom, endDate: '' } },
                    },
                    false,
                    mockGetPhrase,
                ),
            );

            expect(result.current).toEqual(['Tue 19 Jun 2029', '']);
        });

        it('Should return start and end dates with custom dates format', () => {
            const { result } = renderHook(() =>
                useDatesLabel(mockBooking, false, mockGetPhrase, {
                    holiday: {
                        end: 'ddd DD MMM YYYY',
                        start: 'ddd DD MMM',
                    },
                    tradePortal: {
                        end: 'ddd DD MMM YYYY',
                        start: 'ddd DD MMM YYYY',
                    },
                }),
            );

            expect(result.current).toStrictEqual(['Tue 19 Jun', 'Thu 19 Jul 2029']);
        });
    });

    describe('useBoard', () => {
        it('should return the result', () => {
            const { result } = renderHook(() => useBoard(mockBooking));

            expect(result.current).toEqual({
                iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
                label: 'Half board',
            });
        });
    });

    describe('useViewBookingPageInit', () => {
        beforeEach(() => {
            mockStores = createStores();
            (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(true);
        });

        it('should return a booking from the viewBooking store and booking loading state', () => {
            const { result } = renderHook(() => useViewBookingPageInit());

            expect(result.current.booking).toEqual(mockStores.viewBookingStore.booking);
            expect(result.current.isLoading).toBeFalsy;
        });

        it('should call useChatbotTracking with booking', () => {
            renderHook(() => useViewBookingPageInit());

            expect(useChatbotTracking).toHaveBeenCalledWith(mockBooking);
        });

        it('should reset stores and set user details on init', () => {
            renderHook(() => useViewBookingPageInit());

            expect(mockStores.amendDatesStore.clearStore).toHaveBeenCalled();
            expect(mockStores.amendTransfersStore.clearStore).toHaveBeenCalled();
            expect(mockStores.amendFlightsStore.clearStore).toHaveBeenCalled();
            expect(mockStores.amendRoomAndBoardStore.clearStore).toHaveBeenCalled();
            expect(mockStores.amendHotelStore.clearStore).toHaveBeenCalled();

            expect(mockStores.userStore.setUserDetails).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.loadBooking).not.toHaveBeenCalled();
        });

        it('should set isViewBookingStatusPage to true when hook called with true param', () => {
            renderHook(() => useViewBookingPageInit(true));

            expect(mockStores.viewBookingStore.setIsViewBookingStatusPage).toHaveBeenCalledWith(true);
        });

        it('should call fetchReview if isPostTravelPage', async () => {
            mockStores.viewBookingStore.isPostTravelPage = true;

            renderHook(() => useViewBookingPageInit(true));

            await waitFor(() => expect(mockStores.hotelReviewsStore.fetchReviews).toHaveBeenCalled());
        });

        it('should load booking and read refresh booking payload when there is no booking in the store', async () => {
            (mockStores.viewBookingStore.booking as Nullable<IBookingInfo>) = null;

            renderHook(() => useViewBookingPageInit());

            await waitFor(() => {
                expect(mockStores.viewBookingStore.loadBooking).toHaveBeenCalled();
            });
            expect(mockStores.viewBookingStore.readRefreshBookingPayloadFromStorage).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.toggleLoading).toHaveBeenCalledWith(false);
        });

        it('should not clear a booking payload or a booking on unmount when isBookingPayloadClearRequired or isBookingClearRequired is false', () => {
            const { unmount } = renderHook(() => useViewBookingPageInit());

            unmount();

            expect(mockStores.viewBookingStore.clearViewBookingPayload).not.toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).not.toHaveBeenCalled();
        });

        it('should clear a booking payload or a booking on unmount, setIsViewBookingStatusPage to false', () => {
            mockStores.viewBookingStore.isBookingPayloadClearRequired.mockReturnValueOnce(true);
            mockStores.viewBookingStore.isBookingClearRequired.mockReturnValueOnce(true);

            const { unmount } = renderHook(() => useViewBookingPageInit());

            unmount();

            expect(mockStores.viewBookingStore.clearViewBookingPayload).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).toHaveBeenCalled();

            expect(mockStores.viewBookingStore.setIsViewBookingStatusPage).toHaveBeenCalledWith(false);
        });

        it('should set passengers store when booking is present', () => {
            renderHook(() => useViewBookingPageInit());

            expect(mockStores.flightsPassengersStore.setPassengersStore).toHaveBeenCalledWith(mockBooking);
        });

        it('should load booking transfers when booking exists and isPreTravelPage is true', async () => {
            mockStores.viewBookingStore.isPreTravelPage = true;

            renderHook(() => useViewBookingPageInit());

            await waitFor(() => {
                expect(mockStores.viewBookingStore.loadBookingTransfers).toHaveBeenCalledWith(
                    mockBooking.bookingReference,
                    'Brown',
                    '2023-05-11',
                );
            });
        });

        it('should load booking transfers when booking exists and isInDestinationPage is true', async () => {
            mockStores.viewBookingStore.isInDestinationPage = true;

            renderHook(() => useViewBookingPageInit());

            await waitFor(() => {
                expect(mockStores.viewBookingStore.loadBookingTransfers).toHaveBeenCalledWith(
                    mockBooking.bookingReference,
                    'Brown',
                    '2023-05-11',
                );
            });
        });

        it('should not load booking transfers when isPreTravelPage and isInDestinationPage are both false', () => {
            mockStores.viewBookingStore.isPreTravelPage = false;
            mockStores.viewBookingStore.isInDestinationPage = false;

            renderHook(() => useViewBookingPageInit());

            expect(mockStores.viewBookingStore.loadBookingTransfers).not.toHaveBeenCalled();
        });

        it('should not load booking transfers when booking is null', () => {
            mockStores.viewBookingStore.booking = null;
            mockStores.viewBookingStore.isPreTravelPage = true;

            renderHook(() => useViewBookingPageInit());

            expect(mockStores.viewBookingStore.loadBookingTransfers).not.toHaveBeenCalled();
        });

        it('should not load booking transfers when transfer type is NoTransfer', () => {
            mockStores.viewBookingStore.isPreTravelPage = true;
            mockStores.viewBookingStore.booking = {
                ...mockBooking,
                transfers: [{ ...mockBooking.transfers![0], type: TransferType.NoTransfer }],
            };

            renderHook(() => useViewBookingPageInit());

            expect(mockStores.viewBookingStore.loadBookingTransfers).not.toHaveBeenCalled();
        });

        it('should not load booking transfers when loadBookingTransfers is not available (non-holiday store)', () => {
            (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(false);
            mockStores = createStores();
            mockStores.viewBookingStore.loadBookingTransfers = undefined;
            mockStores.viewBookingStore.isPreTravelPage = true;

            renderHook(() => useViewBookingPageInit());

            expect(mockStores.viewBookingStore.loadBookingTransfers).toBeUndefined();
        });

        it('should return isLoading true when isLoadingTransfers is true', () => {
            mockStores.viewBookingStore.isLoading = false;
            mockStores.viewBookingStore.isLoadingTransfers = true;

            const { result } = renderHook(() => useViewBookingPageInit());

            expect(result.current.isLoading).toBe(true);
        });

        it('should return isLoading true when store isLoading is true and isLoadingTransfers is false', () => {
            mockStores.viewBookingStore.isLoading = true;
            mockStores.viewBookingStore.isLoadingTransfers = false;

            const { result } = renderHook(() => useViewBookingPageInit());

            expect(result.current.isLoading).toBe(true);
        });

        it('should return isLoading false when both isLoading and isLoadingTransfers are false', () => {
            mockStores.viewBookingStore.isLoading = false;
            mockStores.viewBookingStore.isLoadingTransfers = false;

            const { result } = renderHook(() => useViewBookingPageInit());

            expect(result.current.isLoading).toBe(false);
        });

        it('should return isLoading false when isLoadingTransfers is undefined (non-holiday store)', () => {
            (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(false);
            mockStores = createStores();
            mockStores.viewBookingStore.isLoading = false;
            mockStores.viewBookingStore.isLoadingTransfers = undefined;

            const { result } = renderHook(() => useViewBookingPageInit());

            expect(result.current.isLoading).toBe(false);
        });
    });
});
