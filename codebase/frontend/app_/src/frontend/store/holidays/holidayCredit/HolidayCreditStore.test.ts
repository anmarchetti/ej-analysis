import { CurrencyCode } from 'code/currency';
import { mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import bookingService from 'frontend/services/booking.service';
import creditManagementService from 'frontend/services/creditManagement.service';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { CreditType } from 'models/enum/CreditType';
import { RefundOption } from 'models/enum/RefundOptions';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ViewBookingPageStates } from 'models/enum/ViewBookingPageStates';

import { HolidayCreditStore } from './HolidayCreditStore';

jest.mock('frontend/services/logging');

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
}));

let mockContainsLuxuryPromoCode = false;
let mockContainsFAndHPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
    containsFAndHPromoCode: jest.fn(() => mockContainsFAndHPromoCode),
}));

const mockGetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: (...params) => mockGetWebStorageItem(...params),
}));

describe('<HolidayCreditStore />', () => {
    const booking = {
        bookingReference: '111',
        package: { accom: { startDate: '2021-01-01' } },
        guests: [
            { lastName: 'Lead', isLead: true },
            { lastName: 'Guest', isLead: false },
        ],
        refund: {
            credit: {
                isEligible: true,
                credit: 2100,
            },
            refund: {
                isEligible: true,
                credit: 100,
                cash: 2000,
            },
        },
    } as IBookingInfo;
    let rootStore;

    const createRootStore = () => ({
        routerStore: {
            redirectTo: jest.fn(),
            redirectToLoginPage: jest.fn(),
            redirectToViewBookingsPage: jest.fn(),
            isPaymentPage: jest.fn().mockResolvedValue(false),
            isPayRemainingBalancePage: jest.fn().mockReturnValue(false),
            isBookingConfirmationPage: jest.fn().mockReturnValue(false),
            redirectToHolidayCreditPage: jest.fn(),
        },
        layoutStore: {
            getSetting: jest.fn(s => s === SiteSettings.EnableCreditBooking),
            getSettingAsBoolean: jest.fn(s => s === SiteSettings.EnableOneTimeUseCredit),
            viewBookingLinks: {
                preTravel: SitePath.PreTravel,
            },
        },
        userStore: {
            onLogout: jest.fn(),
            checkIfUserLoggedIn: jest.fn().mockResolvedValue(true),
        },
        marketStore: { currency: CurrencyCode.GBP },
        viewBookingStore: {
            getBooking: jest.fn().mockResolvedValue({}),
            booking: undefined,
            viewBookingPageState: ViewBookingPageStates.PreTravel,
            viewBookingLinks: {
                cancelled: '/cancelled-booking',
            },
        },
        engageStore: {
            sendOrderCancelEvent: jest.fn(),
        },
    });

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('initializeFromPayload', () => {
        it('should call viewBookingStore.getBooking and apply booking to self', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            rootStore.viewBookingStore.getBooking.mockImplementationOnce(
                () => (rootStore.viewBookingStore.booking = mockBooking),
            );
            const store = new HolidayCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(store.booking).toStrictEqual(mockBooking);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
        });

        it('should redirect to Cancelled Booking Page if booking is cancelled', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            rootStore.viewBookingStore.getBooking.mockImplementationOnce(
                () => (rootStore.viewBookingStore.booking = { ...mockBooking, bookingStatus: BookingStatus.Canceled }),
            );

            const store = new HolidayCreditStore(rootStore);
            await store.initializeFromPayload();

            expect(store.booking).toBeNull();
            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                rootStore.layoutStore.viewBookingLinks.cancelled,
            );
        });

        it('should NOT call viewBookingStore.getBooking if no bookingPayload', async () => {
            const store = new HolidayCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(store.booking).toBeNull();
            expect(rootStore.viewBookingStore.getBooking).not.toHaveBeenCalled();
        });

        it('should call redirectToViewBookingsPage if viewBookingStore has no booking', async () => {
            mockGetWebStorageItem.mockReturnValueOnce('bookingPayload');
            const store = new HolidayCreditStore(rootStore);

            await store.initializeFromPayload();

            expect(store.booking).toBeNull();
            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });
    });

    describe('initialize()', () => {
        it('should redirect to Login Page if user not logged in', async () => {
            rootStore.userStore.checkIfUserLoggedIn.mockResolvedValueOnce(false);
            const store = new HolidayCreditStore(rootStore);
            await store.initialize();

            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should redirect to Login Page if credit is disabled', async () => {
            rootStore.layoutStore.getSetting.mockReturnValueOnce(false);
            const store = new HolidayCreditStore(rootStore);
            await store.initialize();

            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should fetch history and credit balance', async () => {
            const store = new HolidayCreditStore(rootStore);
            const clearStoreSpy = jest.spyOn(store, 'clearStore');
            store.fetchBalanceHistory = jest.fn();
            store.fetchMyCreditBalance = jest.fn();
            await store.initialize();

            expect(clearStoreSpy).toHaveBeenCalled();
            expect(store.fetchBalanceHistory).toHaveBeenCalledWith(true);
            expect(store.fetchMyCreditBalance).toHaveBeenCalledWith(true, true);
        });

        it('should logOut and redirect to Login Page if response status is 401', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.fetchBalanceHistory = jest.fn().mockRejectedValue({ response: { status: 401 } });
            store.fetchMyCreditBalance = jest.fn();

            await store.initialize();

            expect(store.rootStore.userStore.onLogout).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should NOT do anything if response status is NOT 401', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.fetchBalanceHistory = jest.fn().mockRejectedValue({ response: { status: 500 } });
            store.fetchMyCreditBalance = jest.fn();

            await store.initialize();

            expect(store.rootStore.userStore.onLogout).not.toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToLoginPage).not.toHaveBeenCalled();
        });
    });

    describe('initializeCreditConfirmPage()', () => {
        it('should redirect to View Bookings Page if there is not booking', () => {
            const store = new HolidayCreditStore(rootStore);
            store.initializeCreditConfirmPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should redirect to View Bookings Page if booking is not elegible for credit and refund', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = {
                refund: {
                    credit: { isEligible: false },
                    refund: { isEligible: false },
                },
            } as IBookingInfo;
            store.initializeCreditConfirmPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should redirect to View Bookings Page if credit is disabled globally', () => {
            rootStore.layoutStore.getSetting.mockReturnValue(false);
            const store = new HolidayCreditStore(rootStore);
            store.initializeCreditConfirmPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should initialize variables if there is booking eligible for credit', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = booking;
            store.initializeCreditConfirmPage();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
            expect(store.isCreditBookingFailed).toBe(false);
            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.confirmPolicy).toBe(false);
            expect(store.forcePolicyError).toBe(false);
            expect(store.recentRefund).toBeNull();
            expect(store.selectedRefundType).toBe(CreditType.Credit);
        });

        it('should set refund type as default refund option when credit type is not available', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = {
                ...booking,
                refund: {
                    credit: {
                        isEligible: false,
                        credit: 2100,
                    },
                    refund: {
                        isEligible: true,
                        credit: 100,
                        cash: 2000,
                    },
                },
            };
            store.initializeCreditConfirmPage();

            expect(store.selectedRefundType).toBe(CreditType.Refund);
        });

        it('should set isCreditBookingFailed to true when cancellation is blocked', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = { ...booking, cancellationIsBlocked: true } as IBookingInfo;
            store.initializeCreditConfirmPage();

            expect(store.isCreditBookingFailed).toBe(true);
            expect(store.rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
        });
    });

    describe('initializeCancellationSummaryFetch()', () => {
        it('should redirect to View Bookings Page if credit is disabled globally', () => {
            rootStore.layoutStore.getSetting.mockReturnValue(false);
            const store = new HolidayCreditStore(rootStore);
            store.initializeCancellationSummaryFetch();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should fetch cancellation summary and initialize variables when credit is enabled globally', async () => {
            const store = new HolidayCreditStore(rootStore);
            const mockResponse = {
                currency: 'GBP',
                daysBeforeDeparture: 10,
                oneTimeUseCreditTotalPaid: 0,
                refundBreakdownValidationHush: 0,
                refunds: [
                    {
                        credit: 100,
                        oneTimeUseCredit: 0,
                        refundOption: 'credit',
                        total: 0,
                    },
                ],
            };
            store.booking = mockBooking;
            bookingService.getCancellationSummary = jest.fn().mockResolvedValue(mockResponse);
            await store.initializeCancellationSummaryFetch();

            expect(store.rootStore.routerStore.redirectToViewBookingsPage).not.toHaveBeenCalled();
            expect(store.isCancellationSummaryIsLoading).toBe(false);
            expect(store.confirmPolicy).toBe(false);
            expect(store.forcePolicyError).toBe(false);
            expect(store.selectedRefundType).toBe(undefined);
            expect(store.selectedRefundOTUC).toEqual(mockResponse.refunds[0]);
            expect(store.isCreditBookingFailed).toBe(false);
            expect(store.isCreditBookingLoading).toBe(false);
        });

        it('should NOT fetch cancellation summary if booking is canceled', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = { ...mockBooking, bookingStatus: BookingStatus.Canceled };
            store.fetchCancellationSummary = jest.fn();
            await store.initializeCancellationSummaryFetch();

            expect(store.fetchCancellationSummary).not.toHaveBeenCalled();
        });
    });

    describe('initializeCancellation()', () => {
        it('should NOT call fetch cancellation summary if booking was made by external agency', () => {
            rootStore.layoutStore.getSetting.mockReturnValue(false);
            const store = new HolidayCreditStore(rootStore);
            store.booking = { ...mockBooking, isExternalAgency: true };
            store.initializeCancellationSummaryFetch = jest.fn();
            store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });

        it('should NOT call fetch cancellation summary if booking cannot be cancelled (less then X hours after booking was made)', () => {
            rootStore.layoutStore.getSetting.mockReturnValue(false);
            rootStore.viewBookingStore.booking = {
                ...mockBooking,
                amendmentInfo: { ...mockBooking.amendmentInfo, canBookingCancelled: false },
            };
            const store = new HolidayCreditStore(rootStore);

            store.initializeCancellationSummaryFetch = jest.fn();
            store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });

        it('should NOT call fetch cancellation summary if booking cannot be cancelled from website', () => {
            rootStore.viewBookingStore.booking = {
                ...mockBooking,
                isDestinationRulesApplied: false,
            };
            const store = new HolidayCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(false);

            store.initializeCancellationSummaryFetch = jest.fn();
            store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });

        it('should call initializeCancellationSummaryFetch when booking can not be cancelled from website but destination rules applied', async () => {
            rootStore.viewBookingStore.booking = {
                ...mockBooking,
                isDestinationRulesApplied: true,
            };
            const store = new HolidayCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(false);
            store.initializeCancellationSummaryFetch = jest.fn();
            store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).toHaveBeenCalled();
        });

        it('should call initializeCancellationSummaryFetch when all conditions met', async () => {
            rootStore.viewBookingStore.booking = {
                ...mockBooking,
                amendmentInfo: { ...mockBooking.amendmentInfo, canBookingCancelled: true },
            };
            const store = new HolidayCreditStore(rootStore);
            jest.spyOn(store, 'canBeBookingCancelledFromWebsite', 'get').mockReturnValue(true);

            store.initializeCancellationSummaryFetch = jest.fn();
            store.initializeCancellation();

            expect(store.initializeCancellationSummaryFetch).toHaveBeenCalled();
        });
    });

    describe('creditBooking()', () => {
        it('should successfully credit booking', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = mockBooking;
            bookingService.creditBooking = jest.fn().mockResolvedValue({ data: { credits: 100 } });

            await store.creditBooking(true);

            expect(bookingService.creditBooking).toHaveBeenCalledWith(
                CreditType.Credit,
                mockGetBookingPayload.bookingReference,
                mockGetBookingPayload.lastName,
                mockGetBookingPayload.date,
            );

            expect(rootStore.routerStore.redirectToHolidayCreditPage).toHaveBeenCalled();

            expect(store.recentRefund).toEqual({ credits: 100 });
            expect(store.isRefundSuccessPopupShown).toBe(true);
            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.isCreditBookingFailed).toBe(false);
        });

        it('should failed credit booking', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = booking;
            bookingService.creditBooking = jest.fn().mockRejectedValue(null);

            await store.creditBooking(true);

            expect(store.isCreditBookingFailed).toBe(true);
        });

        it('should not credit if booking is null', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = null;

            await store.creditBooking(true);

            expect(bookingService.creditBooking).not.toHaveBeenCalled();
        });
    });

    describe('cancelBooking()', () => {
        it('should successfully cancel booking and send order cancel event', async () => {
            const store = new HolidayCreditStore(rootStore);
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
            );

            expect(rootStore.engageStore.sendOrderCancelEvent).toHaveBeenCalledTimes(1);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalledWith(mockGetBookingPayload);

            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.isCreditBookingFailed).toBe(false);
        });

        it('should send None as a refund option if no refund options available and send order cancel event', async () => {
            const store = new HolidayCreditStore(rootStore);
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
            );

            expect(rootStore.engageStore.sendOrderCancelEvent).toHaveBeenCalledTimes(1);
            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalledWith(mockGetBookingPayload);

            expect(store.isCreditBookingLoading).toBe(false);
            expect(store.isCreditBookingFailed).toBe(false);
        });

        it('should fail booking cancellation and NOT send order cancel event', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = booking;
            store.cancellationSummary = mockCancellationSummary;
            bookingService.cancelBooking = jest.fn().mockRejectedValue(null);

            await store.cancelBooking();

            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
            expect(store.isCreditBookingFailed).toBe(true);
            expect(store.isCreditBookingLoading).toBe(false);
        });

        it('should NOT cancel booking if no booking data and NOT send order cancel event', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = null;

            await store.cancelBooking();

            expect(bookingService.cancelBooking).not.toHaveBeenCalled();
            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
        });

        it('should NOT cancel booking if no cancellation summary data and NOT send order cancel event', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.cancellationSummary = null;

            await store.cancelBooking();

            expect(bookingService.cancelBooking).not.toHaveBeenCalled();
            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
        });

        it('should NOT cancel booking when cancellation is blocked', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = { ...mockBooking, cancellationIsBlocked: true } as IBookingInfo;
            store.cancellationSummary = mockCancellationSummary;
            bookingService.cancelBooking = jest.fn();

            await store.cancelBooking();

            expect(bookingService.cancelBooking).not.toHaveBeenCalled();
            expect(rootStore.engageStore.sendOrderCancelEvent).not.toHaveBeenCalled();
        });
    });

    describe('clearRecentRefund()', () => {
        it('should clear refund, booking and close popup', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = booking;
            store.recentRefund = { credits: 100, refund: 200 } as any;
            store.isRefundSuccessPopupShown = true;

            store.clearRecentRefund();

            expect(store.booking).toBeNull();
            expect(store.recentRefund).toBeNull();
            expect(store.isRefundSuccessPopupShown).toBe(false);
            expect(store.selectedRefundOTUC).toBe(undefined);
            expect(store.cancellationSummary).toBe(undefined);
            expect(store.isCancellationSummaryFailed).toBe(false);
            expect(store.isCancellationSummaryIsLoading).toBe(true);
        });
    });

    describe('shouldConfirmPolicy', () => {
        it('should be true if policy is not confirmed and force error', () => {
            const store = new HolidayCreditStore(rootStore);
            store.confirmPolicy = false;
            store.forcePolicyError = true;

            expect(store.shouldConfirmPolicy).toBe(true);
        });

        it('should be false if policy has already confirmed', () => {
            const store = new HolidayCreditStore(rootStore);
            store.confirmPolicy = true;

            expect(store.shouldConfirmPolicy).toBe(false);
        });

        it('should be false if no force error', () => {
            const store = new HolidayCreditStore(rootStore);
            store.forcePolicyError = false;

            expect(store.shouldConfirmPolicy).toBe(false);
        });
    });

    describe('fetchBalanceHistory()', () => {
        it('should successfully load history', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.balanceHistory = {};
            const history = [{ id: '1' }, { id: '2' }];
            creditManagementService.loadBalanceHistory = jest.fn().mockResolvedValue(history);

            await store.fetchBalanceHistory();
            expect(store.isHistoryLoading).toBe(false);
            expect(store.balanceHistory).toEqual(history);
        });

        it('should failed load history', async () => {
            const store = new HolidayCreditStore(rootStore);
            store.balanceHistory = {};
            creditManagementService.loadBalanceHistory = jest.fn().mockRejectedValue('error');

            await store.fetchBalanceHistory();

            expect(store.isHistoryLoading).toBe(false);
            expect(store.balanceHistory).toEqual({});
        });
    });

    describe('fetchMyCreditBalance()', () => {
        it('should successfully get credit balance', async () => {
            const store = new HolidayCreditStore(rootStore);
            const balances = [
                { balance: 100, hasCreditHistory: true },
                { balance: 0, hasCreditHistory: false },
            ];
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(balances);

            await store.fetchMyCreditBalance();
            expect(store.isCreditLoading).toBe(false);
            expect(store.creditBalance).toEqual(balances);
        });

        it('should set hasCreditHistory true when one of balances had credit history ', async () => {
            const store = new HolidayCreditStore(rootStore);
            const balances = [
                { balance: 100, hasCreditHistory: true },
                { balance: 0, hasCreditHistory: false },
            ];
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(balances);

            await store.fetchMyCreditBalance();
            expect(store.hasCreditHistory).toBe(true);
        });

        it('should set hasCreditHistory false when all balances do not have credit history ', async () => {
            const store = new HolidayCreditStore(rootStore);
            const balances = [
                { balance: 100, hasCreditHistory: false },
                { balance: 0, hasCreditHistory: false },
            ];
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(balances);

            await store.fetchMyCreditBalance();
            expect(store.hasCreditHistory).toBe(false);
        });

        it('should set isCreditEnabledApiSettings false when one of balances have creditIsEnabled false ', async () => {
            const store = new HolidayCreditStore(rootStore);
            const balances = [
                { balance: 100, creditIsEnabled: true },
                { balance: 0, creditIsEnabled: false },
            ];
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(balances);

            await store.fetchMyCreditBalance();
            expect(store.isCreditEnabledApiSettings).toBe(false);
        });

        it('should set isCreditEnabledApiSettings true when all balances have creditIsEnabled true', async () => {
            const store = new HolidayCreditStore(rootStore);
            const balances = [
                { balance: 100, creditIsEnabled: true },
                { balance: 0, creditIsEnabled: true },
            ];
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(balances);

            await store.fetchMyCreditBalance();
            expect(store.isCreditEnabledApiSettings).toBe(true);
        });

        it('should de-dupe concurrent calls to a single request even when cache is disabled', async () => {
            // Payment pages disable cache; concurrent callers must still collapse to one fetch.
            rootStore.routerStore.isPaymentPage = jest.fn().mockReturnValue(true);
            const store = new HolidayCreditStore(rootStore);
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue([{ balance: 100 }]);

            await Promise.all([store.fetchMyCreditBalance(false, true), store.fetchMyCreditBalance(false, true)]);

            expect(creditManagementService.loadCreditBalance).toHaveBeenCalledTimes(1);
        });
    });

    describe('setSelectedRefundType()', () => {
        it('should set selected refund type', () => {
            const store = new HolidayCreditStore(rootStore);
            store.setSelectedRefundType(CreditType.Refund);

            expect(store.selectedRefundType).toBe(CreditType.Refund);
        });
    });

    describe('isOneTimeUseCreditEnabled', () => {
        it('should return true when isOneTimeUseCreditEnabled setting is true', () => {
            const store = new HolidayCreditStore(rootStore);

            expect(store.isOneTimeUseCreditEnabled).toEqual(true);
        });

        it('should return false when isOneTimeUseCreditEnabled setting is false', () => {
            const store = new HolidayCreditStore(rootStore);
            store.rootStore.layoutStore.getSettingAsBoolean = jest.fn(() => false);

            expect(store.isOneTimeUseCreditEnabled).toEqual(false);
        });
    });

    describe('showCreditExpiryInfoPopupBeforeCancellation', () => {
        it('should return true when showCreditExpiryInfoPopupBeforeCancellation setting is true', () => {
            const store = new HolidayCreditStore(rootStore);
            store.rootStore.layoutStore.getSettingAsBoolean = jest.fn(() => true);

            expect(store.showCreditExpiryInfoPopupBeforeCancellation).toEqual(true);
        });

        it('should return false when showCreditExpiryInfoPopupBeforeCancellation setting is false', () => {
            const store = new HolidayCreditStore(rootStore);
            store.rootStore.layoutStore.getSettingAsBoolean = jest.fn(() => false);

            expect(store.showCreditExpiryInfoPopupBeforeCancellation).toEqual(false);
        });
    });

    describe('isFlightExternal', () => {
        let store: HolidayCreditStore;

        beforeEach(() => {
            store = new HolidayCreditStore(rootStore);
            store.booking = mockBooking;
        });

        it('should return true if flight is external', () => {
            expect(store.isFlightExternal).toBe(true);
        });

        it('should return false if flight is internal', () => {
            store.booking!.package.transport.routes[0]!.isExt = false;
            expect(store.isFlightExternal).toBe(false);
        });
    });

    describe('isLuxuryPackage', () => {
        let store: HolidayCreditStore;

        beforeEach(() => {
            store = new HolidayCreditStore(rootStore);
            store.booking = mockBooking;
        });

        it('should return true when it is luxury offer', () => {
            mockContainsLuxuryPromoCode = true;

            expect(store.isLuxuryPackage).toBe(true);
        });

        it('should return false when it is NOT luxury offer', () => {
            mockContainsLuxuryPromoCode = false;

            expect(store.isLuxuryPackage).toBe(false);
        });
    });

    describe('isEligibleForCreditRefund', () => {
        it('should return true if one-time-use credit is enabled and there is credit refund option', () => {
            const store = new HolidayCreditStore(rootStore);
            store.cancellationSummary = mockCancellationSummary;
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(true);

            expect(store.isEligibleForCreditRefund).toBe(true);
        });

        it('should return false if one-time-use credit is enabled and there is NO credit refund option', () => {
            const store = new HolidayCreditStore(rootStore);
            store.cancellationSummary = {
                ...mockCancellationSummary,
                refunds: mockCancellationSummary.refunds.filter(refund => refund.refundOption !== RefundOption.Credit),
            };
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(true);

            expect(store.isEligibleForCreditRefund).toBe(false);
        });

        it('should return true if one-time-use credit is disabled and booking refund credit is eligible', () => {
            const store = new HolidayCreditStore(rootStore);
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(false);
            store.booking = {
                ...mockBooking,
                refund: {
                    credit: { isEligible: true },
                    refund: { isEligible: false },
                },
            };

            expect(store.isEligibleForCreditRefund).toBe(true);
        });

        it('should return false if one-time-use credit is disabled and booking refund credit is NOT eligible', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = {
                ...mockBooking,
                refund: {
                    credit: { isEligible: false },
                    refund: { isEligible: false },
                },
            };
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(false);

            expect(store.isEligibleForCreditRefund).toBe(false);
        });
    });

    describe('isEligibleForOriginalPaymentRefund', () => {
        it('should return true if one-time-use credit is enabled and there is original method refund option', () => {
            const store = new HolidayCreditStore(rootStore);
            store.cancellationSummary = mockCancellationSummary;
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(true);

            expect(store.isEligibleForOriginalPaymentRefund).toBe(true);
        });

        it('should return false if one-time-use credit is enabled and there is NO original payment refund option', () => {
            const store = new HolidayCreditStore(rootStore);
            store.cancellationSummary = {
                ...mockCancellationSummary,
                refunds: mockCancellationSummary.refunds.filter(
                    refund => refund.refundOption !== RefundOption.OriginalPayment,
                ),
            };
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(true);

            expect(store.isEligibleForOriginalPaymentRefund).toBe(false);
        });

        it('should return true if one-time-use credit is disabled and booking refund original payment is eligible', () => {
            const store = new HolidayCreditStore(rootStore);
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(false);
            store.booking = {
                ...mockBooking,
                refund: {
                    credit: { isEligible: true },
                    refund: { isEligible: true },
                },
            };

            expect(store.isEligibleForOriginalPaymentRefund).toBe(true);
        });

        it('should return false if one-time-use credit is disabled and booking refund original payment is NOT eligible', () => {
            const store = new HolidayCreditStore(rootStore);
            store.booking = {
                ...mockBooking,
                refund: {
                    credit: { isEligible: false },
                    refund: { isEligible: false },
                },
            };
            jest.spyOn(store, 'isOneTimeUseCreditEnabled', 'get').mockReturnValue(false);

            expect(store.isEligibleForOriginalPaymentRefund).toBe(false);
        });
    });

    describe('isFlightAndHotelPackage', () => {
        let store: HolidayCreditStore;

        beforeEach(() => {
            store = new HolidayCreditStore(rootStore);
            store.booking = mockBooking;
        });

        it('should return true when booking has F+H promo code', () => {
            mockContainsFAndHPromoCode = true;

            expect(store.isFlightAndHotelPackage).toBe(true);
        });

        it('should return false when booking does NOT have F+H promo code', () => {
            mockContainsFAndHPromoCode = false;

            expect(store.isFlightAndHotelPackage).toBe(false);
        });

        it('should return false when booking is null', () => {
            mockContainsFAndHPromoCode = false;
            store.booking = null;

            expect(store.isFlightAndHotelPackage).toBe(false);
        });
    });

    describe('showCreditExpiresSoonBannerWithinDays', () => {
        it('should return value of setting', () => {
            const store = new HolidayCreditStore(rootStore);
            store.rootStore.layoutStore.getSetting = jest.fn().mockReturnValueOnce(10);

            expect(store.showCreditExpiresSoonBannerWithinDays).toEqual(10);
            expect(store.rootStore.layoutStore.getSetting).toHaveBeenCalledWith(
                SiteSettings.ShowCreditExpiresSoonBannerWithinDays,
            );
        });

        it('should return 0 by default', () => {
            const store = new HolidayCreditStore(rootStore);
            store.rootStore.layoutStore.getSetting = jest.fn().mockReturnValueOnce(0);

            expect(store.showCreditExpiresSoonBannerWithinDays).toEqual(0);
            expect(store.rootStore.layoutStore.getSetting).toHaveBeenCalledWith(
                SiteSettings.ShowCreditExpiresSoonBannerWithinDays,
            );
        });
    });
});
