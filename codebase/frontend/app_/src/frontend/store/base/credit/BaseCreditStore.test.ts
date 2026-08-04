import { mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import bookingService from 'frontend/services/booking.service';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IRefundOption } from 'models/data/MyCreditInfo';
import { GuestType } from 'models/enum/GuestType';
import { RefundOption } from 'models/enum/RefundOptions';
import SitePath from 'models/enum/SitePath';

import { BaseCreditStore } from './BaseCreditStore';

const mockGetBookingPayload = {
    bookingReference: mockBooking.bookingReference,
    lastName: mockBooking.guests.find(g => g.isLead)?.lastName,
    date: mockBooking.package?.accom?.startDate,
    package: mockBooking.package,
    paymentInfo: mockBooking.paymentInfo,
};

const mockGetBookingPayloadFn = jest.fn().mockReturnValue(mockGetBookingPayload);
let mockDaysBeforeDeparture: number | undefined = 15;
jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingPayload: booking => mockGetBookingPayloadFn(booking),
    getDaysBeforeDeparture: jest.fn(() => mockDaysBeforeDeparture),
}));

const mockSetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,

    setWebStorageItem: (...params) => mockSetWebStorageItem(...params),
}));

describe('<BaseCreditStore />', () => {
    const createRootStore = () => ({
        routerStore: {
            redirectTo: jest.fn(),
        },
        layoutStore: {
            getSettingAsNumber: jest.fn(() => 28),
            viewBookingLinks: {
                preTravel: SitePath.PreTravel,
            },
        },
        viewBookingStore: {
            booking: mockBooking,
        },
        queryParamsStore: {
            isFlightPlusHotelFunnel: false,
        },
    });

    let rootStore;

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('startBookingCancellation()', () => {
        it('should set booking and redirect to Confirm Holiday Credit Page', () => {
            const store = new BaseCreditStore(rootStore);
            store.startBookingCancellation();

            expect(store.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.CancelBooking);
            expect(mockSetWebStorageItem).toHaveBeenCalledWith('BookingPayload', mockGetBookingPayload, {});
            expect(mockGetBookingPayloadFn).toHaveBeenCalledWith(mockBooking);
            expect(store.booking).toEqual(mockBooking);
        });

        it('should redirect to FlightPlusHotel cancel booking URL when isFlightPlusHotelFunnel is true', () => {
            const store = new BaseCreditStore(rootStore);
            Object.defineProperty(store.rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => true,
            });
            store.startBookingCancellation();

            expect(store.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(`${SitePath.CancelBooking}?ecp=fph`);
            expect(store.booking).toEqual(mockBooking);
        });
    });

    describe('setPrevPagePath', () => {
        it('should set prev page path', () => {
            const store = new BaseCreditStore(rootStore);

            store.setPrevPagePath(SitePath.ViewBooking);

            expect(store.prevPagePath).toEqual(SitePath.ViewBooking);
        });
    });

    describe('setSelectedRefundOTUC()', () => {
        it('should set selected refund type for One Time Use Credit refund', () => {
            const store = new BaseCreditStore(rootStore);
            const mockRefund: IRefundOption = {
                credit: 100,
                oneTimeUseCredit: 0,
                refundOption: RefundOption.Credit,
                total: 0,
            };
            store.setSelectedRefundOTUC(mockRefund);

            expect(store.selectedRefundOTUC).toEqual(mockRefund);
        });
    });

    describe('daysBeforeDepartureWhenBookingCanBeCancelled', () => {
        it('should return amount of days before departure when booking can be cancelled from sitecore settings', () => {
            const store = new BaseCreditStore(rootStore);

            expect(store.daysBeforeDepartureWhenBookingCanBeCancelled).toEqual(28);
        });
    });

    describe('canBeBookingCancelledFromWebsite', () => {
        it('should return false when no booking', () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = null;

            expect(store.canBeBookingCancelledFromWebsite).toBe(false);
        });

        it('should return false when days before departure is undefined', () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = mockBooking;
            jest.spyOn(store, 'daysBeforeDepartureWhenBookingCanBeCancelled', 'get').mockReturnValue(10);
            mockDaysBeforeDeparture = undefined;
            expect(store.canBeBookingCancelledFromWebsite).toBe(false);
        });

        it('should return false when days before departure is less than setting', () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = mockBooking;
            jest.spyOn(store, 'daysBeforeDepartureWhenBookingCanBeCancelled', 'get').mockReturnValue(10);
            mockDaysBeforeDeparture = 5;

            expect(store.canBeBookingCancelledFromWebsite).toBe(false);
        });

        it('should return true when days before departure is more than setting', () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = mockBooking;
            jest.spyOn(store, 'daysBeforeDepartureWhenBookingCanBeCancelled', 'get').mockReturnValue(10);
            mockDaysBeforeDeparture = 15;

            expect(store.canBeBookingCancelledFromWebsite).toBe(true);
        });
    });

    describe('clearFetchCancellationSummary()', () => {
        it('should clear refund, booking and close popup', () => {
            const store = new BaseCreditStore(rootStore);

            store.clearFetchCancellationSummary();

            expect(store.isCancellationSummaryFailed).toBe(false);
            expect(store.isCancellationSummaryIsLoading).toBe(true);
        });
    });

    describe('fetchCancellationSummary()', () => {
        it('should NOT call getCancellationSummary when no booking information', async () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = null;
            bookingService.getCancellationSummary = jest.fn();

            await store.fetchCancellationSummary();
            expect(bookingService.getCancellationSummary).not.toHaveBeenCalled();
        });

        it('should NOT call getCancellationSummary when cancellation summary was fetched', async () => {
            const store = new BaseCreditStore(rootStore);
            store.cancellationSummary = {
                currency: 'GBP',
                daysBeforeDeparture: 10,
                oneTimeUseCreditTotalPaid: 0,
                refundBreakdownValidationHash: 0,
                isDestinationRulesApplied: false,
                refunds: [],
                amendmentFeeAmount: 0,
            };
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(false);

            bookingService.getCancellationSummary = jest.fn();

            await store.fetchCancellationSummary();
            expect(bookingService.getCancellationSummary).not.toHaveBeenCalled();
        });

        it('should successfully get cancellation summary data', async () => {
            const store = new BaseCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(true);
            store.booking = mockBooking;
            const mockResponse = {
                currency: 'GBP',
                daysBeforeDeparture: 10,
                oneTimeUseCreditTotalPaid: 0,
                refundBreakdownValidationHash: 0,
                refunds: [],
            };
            bookingService.getCancellationSummary = jest.fn().mockResolvedValue(mockResponse);

            await store.fetchCancellationSummary();
            expect(store.isCancellationSummaryIsLoading).toBe(false);
            expect(store.isCancellationSummaryFailed).toBe(false);
            expect(bookingService.getCancellationSummary).toHaveBeenCalledWith(
                mockGetBookingPayload.bookingReference,
                mockGetBookingPayload.lastName,
                mockGetBookingPayload.date,
                false,
            );
            expect(store.cancellationSummary).toEqual(mockResponse);
        });

        it('should return the error when cancellation summary endpoint give an error', async () => {
            const store = new BaseCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(true);
            store.booking = mockBooking;
            bookingService.getCancellationSummary = jest.fn().mockRejectedValue(new Error('error'));

            await store.fetchCancellationSummary();

            expect(bookingService.getCancellationSummary).toHaveBeenCalledWith(
                mockGetBookingPayload.bookingReference,
                mockGetBookingPayload.lastName,
                mockGetBookingPayload.date,
                false,
            );
            expect(store.isCancellationSummaryFailed).toBe(true);
            expect(store.isCancellationSummaryIsLoading).toBe(false);
            expect(store.cancellationSummary).toBe(undefined);
        });
    });

    describe('depositPerPassenger', () => {
        it('should return 0 when there is NO info booking', () => {
            const store = new BaseCreditStore(rootStore);

            expect(store.depositPerPassenger).toBe(0);
        });

        it('should return correct amount of deposit based on passengers', () => {
            const store = new BaseCreditStore(rootStore);

            store.booking = mockBooking;
            store.booking.guests = [
                { type: GuestType.Adult },
                { type: GuestType.Child },
                { type: GuestType.Infant },
            ] as IGuestPassenger[];

            expect(store.depositPerPassenger).toBe(150);
        });

        it('should return 0 when there is NO adults and children', () => {
            const store = new BaseCreditStore(rootStore);
            store.booking = mockBooking;
            store.booking.guests = [{ type: GuestType.Infant }] as IGuestPassenger[];
            expect(store.depositPerPassenger).toBe(0);
        });
    });

    describe('clearCreditStore()', () => {
        it('should clear refund, booking and close popup', () => {
            const store = new BaseCreditStore(rootStore);
            store.selectedRefundOTUC = mockCancellationSummary.refunds[0];
            store.cancellationSummary = mockCancellationSummary;
            store.isCancellationSummaryFailed = true;
            store.isCancellationSummaryIsLoading = false;
            store.isCreditBookingFailed = true;
            store.isCreditBookingLoading = true;
            store.booking = mockBooking;
            store.prevPagePath = 'site-path';

            store.clearCreditStore();

            expect(store.selectedRefundOTUC).toBe(undefined);
            expect(store.cancellationSummary).toBe(undefined);
            expect(store.isCancellationSummaryFailed).toBe(false);
            expect(store.isCancellationSummaryIsLoading).toBe(true);
            expect(store.isCreditBookingFailed).toBe(false);
            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.booking).toBe(null);
            expect(store.prevPagePath).toBe(undefined);
        });
    });
});
