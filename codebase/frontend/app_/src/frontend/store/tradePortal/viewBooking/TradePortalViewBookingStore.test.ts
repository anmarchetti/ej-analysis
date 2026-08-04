import { AxiosError } from 'axios';

import { mockBooking } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { IBaseViewBookingStoreInitialState } from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingErrorCodes, BookingStatus } from 'models/enum/BookingStatus';
import { SitePath } from 'models/enum/SitePath';

import { TradePortalViewBookingStore } from './TradePortalViewBookingStore';

jest.mock('frontend/utils/payment.utls');
jest.mock('frontend/services/booking.service');

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

describe('TradePortalViewBookingStore', () => {
    const initialState = {
        viewBookingPayload: {
            bookingReference: 'test booking reference',
            date: 'test date',
            lastName: 'test last name',
        },
    } as IBaseViewBookingStoreInitialState;

    const createRootStore = () =>
        ({
            userStore: {
                userData: {},
            },
            layoutStore: {
                basePath: '/en/holidays',
                getSetting: jest.fn(() => null),
            },
            routerStore: {
                isViewBookingPage: jest.fn().mockReturnValue(true),
                redirectToAmendPaymentPage: jest.fn(),
                redirectToTradePortalFindBookingPage: jest.fn(),
                redirectTo: jest.fn(),
            },
            amendSeatsStore: { newSelection: null },
            amendPaymentStore: {
                initialize: jest.fn(),
            },
        } as any);

    let rootStore;
    let tradePortalViewBookingStore;

    beforeEach(() => {
        rootStore = createRootStore();
        tradePortalViewBookingStore = new TradePortalViewBookingStore(rootStore);
    });

    describe('deserialize', () => {
        it('should correctly deserialize store', () => {
            tradePortalViewBookingStore.deserialize(initialState);

            expect(tradePortalViewBookingStore.viewBookingPayload).toEqual(initialState.viewBookingPayload);
        });

        it('should not deserialize store', () => {
            tradePortalViewBookingStore.deserialize(undefined);

            expect(tradePortalViewBookingStore.viewBookingPayload).toEqual(undefined);
        });
    });

    describe('serialize', () => {
        it('should correctly serialize empty store', () => {
            const serializedData = tradePortalViewBookingStore.serialize();

            expect(serializedData).toEqual({
                viewBookingPayload: undefined,
            });
        });

        it('should correctly serialize store', () => {
            tradePortalViewBookingStore.deserialize(initialState);

            const serializedData = tradePortalViewBookingStore.serialize();

            expect(serializedData).toEqual({
                viewBookingPayload: initialState.viewBookingPayload,
            });
        });
    });

    describe('clearGuestBookingInfo', () => {
        it('should correctly clear booking info', () => {
            tradePortalViewBookingStore.booking = {} as IBookingInfo;

            const clearDataSpy = jest.spyOn(tradePortalViewBookingStore.guestBookingInfo, 'clearData');
            const changeErrorMessageSpy = jest.spyOn(tradePortalViewBookingStore, 'changeErrorMessage');

            tradePortalViewBookingStore.clearGuestBookingInfo();

            expect(tradePortalViewBookingStore.booking).toBe(null);
            expect(clearDataSpy).toHaveBeenCalled();
            expect(changeErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('changeErrorMessage', () => {
        it('should correctly change error message', () => {
            tradePortalViewBookingStore.changeErrorMessage(BookingErrorCodes.Canceled);

            expect(tradePortalViewBookingStore.errorMessage).toBe(BookingErrorCodes.Canceled);
        });

        it('should clear error message', () => {
            tradePortalViewBookingStore.changeErrorMessage(BookingErrorCodes.Canceled);
            tradePortalViewBookingStore.changeErrorMessage(undefined);

            expect(tradePortalViewBookingStore.errorMessage).toBe(null);
        });
    });

    describe('toggleLoading', () => {
        it('should correctly change loading state', () => {
            tradePortalViewBookingStore.toggleLoading(true);

            expect(tradePortalViewBookingStore.isLoading).toBe(true);

            tradePortalViewBookingStore.toggleLoading(false);

            expect(tradePortalViewBookingStore.isLoading).toBe(false);
        });
    });

    describe('clearBooking', () => {
        it('Should call baseUpdateBookingInfo', () => {
            tradePortalViewBookingStore.baseUpdateBookingInfo = jest.fn();

            tradePortalViewBookingStore.clearBooking();

            expect(tradePortalViewBookingStore.baseUpdateBookingInfo).toBeCalledWith(null);
        });
    });

    describe('continueToPay', () => {
        it('should not redirectToAmendPaymentPage when no booking', async () => {
            tradePortalViewBookingStore.toggleAmendErrorPopup = jest.fn();
            tradePortalViewBookingStore.booking = null;
            await tradePortalViewBookingStore.continueToPay();

            expect(rootStore.routerStore.redirectToAmendPaymentPage).not.toBeCalled();
            expect(rootStore.amendPaymentStore.initialize).not.toBeCalled();
            expect(tradePortalViewBookingStore.toggleAmendErrorPopup).toBeCalledWith(true);
        });

        it('should not redirectToAmendPaymentPage when no newSelection', async () => {
            rootStore.amendSeatsStore.newSelection = null;
            await tradePortalViewBookingStore.continueToPay();

            expect(rootStore.routerStore.redirectToAmendPaymentPage).not.toBeCalled();
            expect(rootStore.amendPaymentStore.initialize).not.toBeCalled();
        });

        it('should redirectToAmendPaymentPage', async () => {
            tradePortalViewBookingStore.booking = {};
            rootStore.amendSeatsStore.newSelection = [];
            await tradePortalViewBookingStore.continueToPay();

            expect(rootStore.routerStore.redirectToAmendPaymentPage).toBeCalled();
            expect(rootStore.amendPaymentStore.initialize).toBeCalled();
        });
    });

    it('isAmendSeatsDisabled', () => {
        tradePortalViewBookingStore.booking = {
            ...initialState.viewBookingPayload,
            isLoggedInAsLeadPassenger: true,
        } as any;

        expect(tradePortalViewBookingStore.isAmendSeatsDisabled).toBe(false);

        tradePortalViewBookingStore.booking = {
            ...tradePortalViewBookingStore.booking,
            amendmentInfo: {
                amendBookingStatus: ['amendSeatsDisabled'],
            },
        } as any;
        expect(tradePortalViewBookingStore.isAmendSeatsDisabled).toBe(true);

        tradePortalViewBookingStore.booking = {
            ...tradePortalViewBookingStore.booking,
            amendmentInfo: {
                amendBookingStatus: ['amendSeatsDisabledOnSite'],
            },
        } as any;
        expect(tradePortalViewBookingStore.isAmendSeatsDisabled).toBe(true);
    });

    describe('getBooking', () => {
        it('should get booking successfully', async () => {
            const mockBooking = { bookingReference: 'test booking reference' } as IBookingInfo;
            (bookingService.sendSimpleBookingSearch as jest.Mock).mockResolvedValueOnce(mockBooking);
            tradePortalViewBookingStore.toggleLoading = jest.fn();
            tradePortalViewBookingStore.changeErrorMessage = jest.fn();
            tradePortalViewBookingStore.baseUpdateBookingInfo = jest.fn();
            tradePortalViewBookingStore.handleViewBookingRedirects = jest.fn();

            await tradePortalViewBookingStore.getBooking('test booking reference');

            expect(tradePortalViewBookingStore.toggleLoading).toHaveBeenNthCalledWith(1, true);
            expect(tradePortalViewBookingStore.toggleLoading).toHaveBeenNthCalledWith(2, false);
            expect(tradePortalViewBookingStore.changeErrorMessage).toHaveBeenCalled();
            expect(tradePortalViewBookingStore.baseUpdateBookingInfo).toHaveBeenCalledWith(mockBooking);
            expect(tradePortalViewBookingStore.handleViewBookingRedirects).toHaveBeenCalled();
        });

        it('should NOT call handleViewBookingRedirects when it is booking reload', async () => {
            const mockBooking = { bookingReference: 'test booking reference' } as IBookingInfo;
            (bookingService.sendSimpleBookingSearch as jest.Mock).mockResolvedValueOnce(mockBooking);
            tradePortalViewBookingStore.handleViewBookingRedirects = jest.fn();
            tradePortalViewBookingStore.baseUpdateBookingInfo = jest.fn();

            await tradePortalViewBookingStore.getBooking('test booking reference', true);

            expect(tradePortalViewBookingStore.baseUpdateBookingInfo).toHaveBeenCalledWith(mockBooking);
            expect(tradePortalViewBookingStore.handleViewBookingRedirects).not.toHaveBeenCalled();
        });

        it('should set up error when getBooking request is failed', async () => {
            bookingService.sendSimpleBookingSearch = jest.fn().mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: BookingErrorCodes.NotFound,
                        },
                    },
                } as AxiosError<IApiErrorData>),
            );

            await tradePortalViewBookingStore.getBooking();

            expect(tradePortalViewBookingStore.errorMessage).toBe(BookingErrorCodes.NotFound);
        });
    });

    describe('loadBooking', () => {
        it('Should get booking payload from store and call getBooking', () => {
            tradePortalViewBookingStore.viewBookingPayload = {
                bookingReference: 'BR123',
            };
            tradePortalViewBookingStore.getBooking = jest.fn();

            tradePortalViewBookingStore.loadBooking();
            expect(mockGetBookingPayloadFn).not.toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).not.toHaveBeenCalled();
            expect(tradePortalViewBookingStore.getBooking).toHaveBeenCalledWith('BR123', false);
        });

        it('Should get booking payload from storage and call getBooking', () => {
            tradePortalViewBookingStore.viewBookingPayload = null;
            tradePortalViewBookingStore.refreshBookingPayloadFromStorage = {
                bookingReference: 'BR456',
            };
            tradePortalViewBookingStore.getBooking = jest.fn();

            tradePortalViewBookingStore.loadBooking();
            expect(mockGetBookingPayloadFn).not.toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).not.toHaveBeenCalled();
            expect(tradePortalViewBookingStore.getBooking).toHaveBeenCalledWith('BR456', false);
        });

        it('Should get booking payload from booking and call getBooking when reloadBooking is true', () => {
            tradePortalViewBookingStore.viewBookingPayload = null;
            tradePortalViewBookingStore.booking = mockBooking;
            tradePortalViewBookingStore.getBooking = jest.fn();

            tradePortalViewBookingStore.loadBooking(true);

            expect(mockGetBookingPayloadFn).toHaveBeenCalledWith(mockBooking);
            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).not.toHaveBeenCalled();
            expect(tradePortalViewBookingStore.getBooking).toHaveBeenCalledWith(
                mockGetBookingPayload.bookingReference,
                true,
            );
        });

        it('Should redirect to find booking page when no booking payload', () => {
            tradePortalViewBookingStore.viewBookingPayload = null;
            tradePortalViewBookingStore.refreshBookingPayloadFromStorage = null;
            tradePortalViewBookingStore.booking = null;
            tradePortalViewBookingStore.getBooking = jest.fn();

            tradePortalViewBookingStore.loadBooking();

            expect(rootStore.routerStore.redirectToTradePortalFindBookingPage).toHaveBeenCalled();
            expect(tradePortalViewBookingStore.getBooking).not.toHaveBeenCalled();
        });
    });

    describe('handleViewBookingRedirects', () => {
        it('should redirect to View Booking Page when booking is NOT canceled', async () => {
            tradePortalViewBookingStore.handleViewBookingRedirects();

            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.TradePortalViewBooking);
        });

        it('should redirect to View Cancelled Booking Page when booking is canceled and new setting is enabled', async () => {
            rootStore.layoutStore.getSetting = jest.fn().mockReturnValueOnce(true);
            tradePortalViewBookingStore.booking = {
                bookingStatus: BookingStatus.Canceled,
            } as IBookingInfo;

            tradePortalViewBookingStore.handleViewBookingRedirects();

            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.TradePortalViewCancelledBooking);
        });
    });

    describe('isBookingPayloadClearRequired', () => {
        it('should return true if the current page is not ViewBooking', () => {
            rootStore.routerStore.pathname = SitePath.TradePortalFindBooking;
            expect(tradePortalViewBookingStore.isBookingPayloadClearRequired()).toBeTruthy();
        });

        it('should return false if the current page is ViewBooking', () => {
            rootStore.routerStore.pathname = SitePath.TradePortalViewBooking;
            expect(tradePortalViewBookingStore.isBookingPayloadClearRequired()).toBeFalsy();
        });
    });
});
