import { mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import bookingService from 'frontend/services/booking.service';
import { BookingStatus } from 'models/enum/BookingStatus';
import { RefundOption } from 'models/enum/RefundOptions';
import SitePath from 'models/enum/SitePath';

import { TradePortalCreditStore } from './TradePortalCreditStore';

const createRootStore = () => ({
    viewBookingStore: {
        booking: mockBooking,
        getBooking: jest.fn(),
    },
    routerStore: {
        redirectTo: jest.fn(),
        redirectToTradePortalFindBookingPage: jest.fn(),
    },
    layoutStore: {
        getSettingAsNumber: jest.fn(() => 28),
    },
    userStore: {
        agentInfo: {
            number: 'agentCode',
            name: 'agentName',
            ref: 'agentRef',
        },
    },
    engageStore: {
        sendOrderCancelEvent: jest.fn(),
    },
});

let rootStore;

const mockGetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: (...params) => mockGetWebStorageItem(...params),
}));

const mockGetBookingPayload = {
    bookingReference: mockBooking.bookingReference,
    lastName: mockBooking.guests.find(g => g.isLead)?.lastName,
    date: mockBooking.package?.accom?.startDate,
    package: mockBooking.package,
    paymentInfo: mockBooking.paymentInfo,
};

const mockGetBookingPayloadFn = jest.fn().mockReturnValue(mockGetBookingPayload);
jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingPayload: booking => mockGetBookingPayloadFn(booking),
    getDaysBeforeDeparture: jest.fn(() => 0),
}));

describe('TradePortalCreditStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('initializeCancellation', () => {
        it('should reset cancellationSummary and set booking from viewBooking store', async () => {
            const store = new TradePortalCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(true);

            store.initializeCancellationSummaryFetch = jest.fn();
            await store.initializeCancellation();

            expect(store.cancellationSummary).toStrictEqual(undefined);
            expect(store.booking).toStrictEqual(mockBooking);
            expect(store.initializeCancellationSummaryFetch).toHaveBeenCalled();
        });

        it('should NOT call initializeCancellationSummaryFetch when booking cannot be cancelled', async () => {
            const store = new TradePortalCreditStore(rootStore);
            rootStore.viewBookingStore.booking = {
                ...mockBooking,
                amendmentInfo: {
                    ...mockBooking.amendmentInfo!,
                    canBookingCancelled: false,
                },
            };

            store.initializeCancellationSummaryFetch = jest.fn();
            await store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });

        it('should NOT call initializeCancellationSummaryFetch when booking can not be cancelled from website', async () => {
            const store = new TradePortalCreditStore(rootStore);

            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(false);
            store.initializeCancellationSummaryFetch = jest.fn();
            await store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });
    });

    describe('initializeCancellationSummaryFetch', () => {
        it('should call fetchCancellationSummary when booking is defined', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = mockBooking;

            store.fetchCancellationSummary = jest.fn();
            await store.initializeCancellationSummaryFetch();

            expect(store.fetchCancellationSummary).toHaveBeenCalledWith(true);
        });

        it('should NOT call fetchCancellationSummary if booking is canceled', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = { ...mockBooking, bookingStatus: BookingStatus.Canceled };

            store.fetchCancellationSummary = jest.fn();
            await store.initializeCancellationSummaryFetch();

            expect(store.fetchCancellationSummary).not.toHaveBeenCalled();
        });
    });

    describe('initializeFromPayload', () => {
        it('should call viewBookingStore.getBooking and apply booking to self', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            rootStore.viewBookingStore.getBooking.mockImplementationOnce(
                () => (rootStore.viewBookingStore.booking = mockBooking),
            );
            const store = new TradePortalCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(store.booking).toStrictEqual(mockBooking);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).not.toHaveBeenCalled();
        });

        it('should NOT call viewBookingStore.getBooking if no bookingPayload', async () => {
            const store = new TradePortalCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(store.booking).toBeNull();
            expect(rootStore.viewBookingStore.getBooking).not.toHaveBeenCalled();
        });

        it('should call redirectToViewBookingsPage if viewBookingStore has no booking', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            const store = new TradePortalCreditStore(rootStore);
            rootStore.viewBookingStore.booking = null;

            await store.initializeFromPayload();

            expect(store.booking).toBeNull();
            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).toHaveBeenCalled();
        });

        it('should redirect to TradePortalViewCancelledBooking if booking is canceled', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            rootStore.viewBookingStore.getBooking.mockImplementationOnce(
                () =>
                    (rootStore.viewBookingStore.booking = {
                        ...mockBooking,
                        bookingStatus: BookingStatus.Canceled,
                    }),
            );
            const store = new TradePortalCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.TradePortalViewCancelledBooking);
        });
    });

    describe('cancelBooking()', () => {
        it('should successfully cancel booking and send order cancel event', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = mockBooking;
            store.cancellationSummary = mockCancellationSummary;
            store.selectedRefundOTUC = mockCancellationSummary.refunds[0];
            bookingService.cancelBooking = jest.fn().mockResolvedValue({});

            await store.cancelBooking();

            expect(bookingService.cancelBooking).toHaveBeenCalledWith(
                store.selectedRefundOTUC.refundOption,
                store.cancellationSummary.refundBreakdownValidationHash,
                mockGetBookingPayload.bookingReference,
                mockGetBookingPayload.lastName,
                mockGetBookingPayload.date,
                true,
                rootStore.userStore.agentInfo,
            );

            expect(rootStore.engageStore.sendOrderCancelEvent).toHaveBeenCalledTimes(1);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalledWith(mockGetBookingPayload.bookingReference);

            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.isCreditBookingFailed).toBe(false);
        });

        it('should send None as a refund option if no refund options available and send order cancel event', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = mockBooking;
            store.cancellationSummary = mockCancellationSummary;
            bookingService.cancelBooking = jest.fn().mockResolvedValue({});

            await store.cancelBooking();

            expect(bookingService.cancelBooking).toHaveBeenCalledWith(
                RefundOption.None,
                store.cancellationSummary.refundBreakdownValidationHash,
                mockGetBookingPayload.bookingReference,
                mockGetBookingPayload.lastName,
                mockGetBookingPayload.date,
                true,
                rootStore.userStore.agentInfo,
            );

            expect(rootStore.engageStore.sendOrderCancelEvent).toHaveBeenCalledTimes(1);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalledWith(mockGetBookingPayload.bookingReference);

            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.isCreditBookingFailed).toBe(false);
        });

        it('should fail booking cancellation and NOT send order cancel event', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = mockBooking;
            store.cancellationSummary = mockCancellationSummary;
            bookingService.cancelBooking = jest.fn().mockRejectedValue(null);

            await store.cancelBooking();

            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
            expect(store.isCreditBookingFailed).toBe(true);
            expect(store.isCreditBookingLoading).toBe(false);
        });

        it('should NOT cancel booking if no booking data and NOT send order cancel event', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.booking = null;

            await store.cancelBooking();

            expect(bookingService.cancelBooking).not.toHaveBeenCalled();
            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
        });

        it('should NOT cancel booking if no cancellation summary data and NOT send order cancel event', async () => {
            const store = new TradePortalCreditStore(rootStore);
            store.cancellationSummary = null;

            await store.cancelBooking();

            expect(bookingService.cancelBooking).not.toHaveBeenCalled();
            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
        });
    });
});
