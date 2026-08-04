import bookingService from 'frontend/services/booking.service';
import { getBrowserInfo } from 'frontend/utils/payment.utls';
import {
    getTransactionId,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { AmendmentType } from 'models/data/IBookingInfo';
import { ApiErrors } from 'models/enum/ApiErrors';

import { TradePortalAmendPaymentStore } from './TradePortalAmendPaymentStore';

const mockedAmendPaymentPayload = {
    selectedSeats: {
        amendmentCharges: 0,
        guests: undefined,
        inboundFlightNum: '',
        newSeatSelection: [],
        outboundFlightNum: '',
        prevSeatSelection: [],
        validatedSeatsWithPrices: undefined,
    },
};

const createRootStore = () =>
    ({
        amendSeatsStore: {
            amendmentCharges: 0,
            initFromPayload: jest.fn(),
        },
        layoutStore: {
            lang: 'en',
        },
        routerStore: {
            redirectToLoginPage: jest.fn(),
        },
        userStore: {
            checkIfUserLoggedIn: jest.fn(() => true),
        },
        payStore: {
            onForceErrors: jest.fn(),
            setAmount: jest.fn(),
            amount: 120,
            sessionId: '999',
        },
        seatMapStore: {
            setIsSelectedSeatsUnavailableError: jest.fn(),
            setOpenSeatMapForced: jest.fn(),
        },
        viewBookingStore: {
            toggleAmendedSeats: jest.fn(),
            getBooking: jest.fn(),
            setSuccessfulAmendmentStatus: jest.fn(),
        },
    } as any);

let rootStore;

jest.mock('frontend/services/booking.service', () => ({
    amendCommitBooking: jest.fn(data => ({ data: { ...data, resultCode: 'resultCode' } })),
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingPayload: jest.fn(),
}));

jest.mock('frontend/utils/paymentTransaction', () => ({
    __esModule: true,
    getTransactionId: jest.fn(() => '333'),
    setTransactionDone: jest.fn(),
    setTransactionProcessing: jest.fn(),
    startNewTransaction: jest.fn(),
}));

jest.mock('frontend/utils/payment.utls', () => ({
    __esModule: true,
    getBrowserInfo: jest.fn(() => ({
        lang: 'lang',
    })),
}));

jest.mock('frontend/utils/payment.utls');

describe('TradePortalAmendPaymentStore', () => {
    let store;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new TradePortalAmendPaymentStore(rootStore);
    });

    describe('totalPrice', () => {
        it('should return totalPrice for seats', () => {
            rootStore.amendSeatsStore.amendmentCharges = 10;
            store.deserialize();

            expect(store.totalPrice).toEqual(10);
        });
    });

    describe('initialize', () => {
        it('should redirectToLoginPage when not logged in', async () => {
            // Not logged
            store.rootStore.userStore.checkIfUserLoggedIn = jest.fn(async () => false);
            await store.initialize();

            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should redirectToLoginPage when no booking found', async () => {
            store.rootStore.viewBookingStore.booking = null;
            store.rootStore.amendSeatsStore.newSelection = [] as any;
            await store.initialize();

            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should redirectToLoginPage when no newSelection found', async () => {
            store.rootStore.viewBookingStore.booking = {
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.amendSeatsStore.newSelection = null;
            await store.initialize();

            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should set amendPaymentPayload', async () => {
            store.rootStore.viewBookingStore.booking = {
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.amendSeatsStore.newSelection = [] as any;

            await store.initialize();

            expect(store.amendPaymentPayload).toEqual(mockedAmendPaymentPayload);
        });

        it('should call initFromPayload', async () => {
            store.rootStore.viewBookingStore.booking = {
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.amendSeatsStore.newSelection = [] as any;

            await store.initialize();

            expect(store.rootStore.amendSeatsStore.initFromPayload).toBeCalled();
        });

        it('should call setAmount', async () => {
            store.rootStore.viewBookingStore.booking = {
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.amendSeatsStore.newSelection = [] as any;

            await store.initialize();
            expect(store.rootStore.payStore.setAmount).toBeCalledWith(0);
        });

        it('should set booking', async () => {
            const booking = {
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.viewBookingStore.booking = booking;
            store.rootStore.amendSeatsStore.newSelection = [] as any;

            await store.initialize();

            expect(store.booking).toEqual(booking);
        });

        it('should start new transaction', async () => {
            store.rootStore.viewBookingStore.booking = {
                bookingReference: '1234',
                package: { transport: { routes: [] } },
            } as any;
            store.rootStore.amendSeatsStore.newSelection = [] as any;

            await store.initialize();

            expect(startNewTransaction).toBeCalledWith('1234');
        });
    });

    it('onForceErrors', async () => {
        store.onForceErrors(true);
        expect(store.rootStore.payStore.onForceErrors).toHaveBeenCalled();
    });

    describe('goBackToPreviousPage', () => {
        it('should not call goBackToViewBooking when bookingReference is not set', () => {
            store.amendPaymentPayload = { bookingReference: undefined } as any;
            store.goBackToViewBooking = jest.fn();

            store.goBackToPreviousPage();

            expect(store.goBackToViewBooking).not.toBeCalled();
        });

        it('should call goBackToViewBooking when bookingReference is set', () => {
            store.amendPaymentPayload = { bookingReference: '12345' } as any;
            store.goBackToViewBooking = jest.fn();

            store.goBackToPreviousPage();

            expect(store.goBackToViewBooking).toBeCalledWith(true, true);
        });
    });

    describe('onPay', () => {
        it('should do nothing if no amendPaymentPayload', () => {
            store.onPay();

            expect(bookingService.amendCommitBooking).not.toBeCalled();
        });

        it('should call amendCommitBooking with correct arguments', () => {
            store.amendPaymentPayload = {
                bookingReference: '12345',
                lastName: 'Black',
                date: '01-01-2023',
            };

            store.onPay();

            expect(getBrowserInfo).toBeCalled();
            expect(setTransactionProcessing).toBeCalled();
            expect(getTransactionId).toBeCalledWith(store.amendPaymentPayload.bookingReference);
            expect(bookingService.amendCommitBooking).toBeCalledWith(
                {
                    browserInfo: {
                        lang: 'lang',
                    },
                    paymentInfo: { amount: 120 },
                    sessionId: '999',
                    deviceId: '333',
                    ...store.amendPaymentPayload,
                },
                '333',
            );
        });

        it('should set seatSelection to payBody when there is selectedSeats in payload', () => {
            store.amendPaymentPayload = {
                bookingReference: '12345',
                lastName: 'Black',
                date: '01-01-2023',
                selectedSeats: {
                    validatedSeatsWithPrices: [{ seats: [{ seatNumber: '1A' }] }],
                },
            };

            store.onPay();

            expect(bookingService.amendCommitBooking).toBeCalledWith(
                {
                    browserInfo: {
                        lang: 'lang',
                    },
                    paymentInfo: {
                        amount: 120,
                    },
                    sessionId: '999',
                    deviceId: '333',
                    seatSelection: [{ seats: [{ seatNumber: '1A' }] }],
                    bookingReference: '12345',
                    lastName: 'Black',
                    date: '01-01-2023',
                },
                '333',
            );
        });

        it('should call goBackToViewBooking after successful commiting', async () => {
            store.amendPaymentPayload = {};
            store.goBackToViewBooking = jest.fn();

            const promise = store.onPay();

            expect(store.isPaying).toBe(true);

            await promise;

            expect(store.isPaying).toBe(false);
            expect(store.goBackToViewBooking).toBeCalled();
            expect(setTransactionDone).toBeCalled();
        });

        it('should NOT call setIsSelectedSeatsUnavailableError when commit is failed NOT with AMEND_SEATS_UNAVAILABLE_API_ERRORS code', async () => {
            store.amendPaymentPayload = { bookingReference: '12345' };
            store.goBackToViewBooking = jest.fn();
            bookingService.amendCommitBooking = jest.fn().mockReturnValue(Promise.reject({ errorCode: '12345' }));

            const promise = store.onPay();

            expect(store.isPaying).toBe(true);

            await promise;

            expect(store.isPaying).toBe(false);
            expect(startNewTransaction).toBeCalledWith(store.amendPaymentPayload.bookingReference);
            expect(store.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).not.toBeCalled();
        });

        it('should call setIsSelectedSeatsUnavailableError when commit is failed with AMEND_SEATS_UNAVAILABLE_API_ERRORS code', async () => {
            store.amendPaymentPayload = { bookingReference: '12345' };
            store.goBackToViewBooking = jest.fn();
            bookingService.amendCommitBooking = jest
                .fn()
                .mockReturnValue(Promise.reject({ errorCode: ApiErrors.SelectedSeatsUnavailableAmendFlow }));

            const promise = store.onPay();

            expect(store.isPaying).toBe(true);

            await promise;

            expect(store.isPaying).toBe(false);
            expect(startNewTransaction).toBeCalledWith(store.amendPaymentPayload.bookingReference);
            expect(store.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
        });
    });

    describe('goBackToViewBooking', () => {
        it('should do nothing if NO booking', () => {
            store.goBackToViewBooking();

            expect(store.rootStore.viewBookingStore.toggleAmendedSeats).not.toBeCalled();
            expect(store.rootStore.viewBookingStore.getBooking).not.toBeCalled();
        });

        describe('toggleAmendedSeats', () => {
            it('should not call setSuccessfulAmendmentStatus if hideAmendedSeatsPopup', () => {
                store.booking = {};

                const hideAmendedSeatsPopup = true;

                store.goBackToViewBooking(false, hideAmendedSeatsPopup);

                expect(store.rootStore.viewBookingStore.setSuccessfulAmendmentStatus).not.toBeCalled();
            });

            it('should call setSuccessfulAmendmentStatus with Seats if hideAmendedSeatsPopup = false', () => {
                store.booking = {};

                const hideAmendedSeatsPopup = false;

                store.goBackToViewBooking(false, hideAmendedSeatsPopup);

                expect(store.rootStore.viewBookingStore.setSuccessfulAmendmentStatus).toBeCalledWith(
                    AmendmentType.Seats,
                );
            });
        });

        describe('setOpenSeatMapForced', () => {
            it('should call setOpenSeatMapForced when shouldOpenSeatMapWidget=true', () => {
                store.booking = {};

                store.goBackToViewBooking(true, false);

                expect(store.rootStore.seatMapStore.setOpenSeatMapForced).toBeCalledWith(true);
            });

            it('should NOT call setOpenSeatMapForced when shouldOpenSeatMapWidget=false', () => {
                store.booking = {};

                store.goBackToViewBooking(false, false);

                expect(store.rootStore.seatMapStore.setOpenSeatMapForced).not.toBeCalled();
            });
        });

        it('should call getBooking', () => {
            store.booking = { bookingReference: '12345' };

            store.goBackToViewBooking();

            expect(store.rootStore.viewBookingStore.getBooking).toBeCalledWith('12345');
        });

        describe('viewBookingPayload', () => {
            it('should set viewBookingPayload with amendPaymentPayload', () => {
                store.booking = {};
                store.amendPaymentPayload = mockedAmendPaymentPayload;

                expect(store.rootStore.viewBookingStore.viewBookingPayload).toBeUndefined();

                store.goBackToViewBooking();

                expect(store.rootStore.viewBookingStore.viewBookingPayload).toEqual({
                    amendPaymentPayload: mockedAmendPaymentPayload,
                });
            });
        });
    });

    it('clearAmendPaymentStore should clear store values', () => {
        store.booking = {};
        store.amendPaymentPayload = {};

        store.clearAmendPaymentStore();

        expect(store.booking).toBeNull();
        expect(store.amendPaymentPayload).toBeUndefined();
    });
});
