import { mockBooking, mockFlightsRoutes } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { cancelPaymentError, commitBookingError } from 'frontend/store/holidays/payment/payment-failures.config';
import {
    getTransaction,
    setTransactionDone,
    setTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { submitForm } from 'frontend/utils/submitForm';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitePath from 'models/enum/SitePath';

import { IPayBalancePayload, PayBalanceStore } from './PayBalanceStore';

jest.mock('frontend/utils/submitForm');
jest.mock('frontend/services/booking.service');
jest.mock('frontend/services/logging');
jest.mock('frontend/utils/paymentTransaction', () => ({
    getTransaction: jest.fn(),
    setTransactionProcessing: jest.fn(),
    setTransactionDone: jest.fn(),
    startNewTransaction: jest.fn(),
    getTransactionId: jest.fn(),
    isTransactionDone: jest.requireActual('frontend/utils/paymentTransaction').isTransactionDone,
    isTransactionProcessing: jest.requireActual('frontend/utils/paymentTransaction').isTransactionProcessing,
}));

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

describe('PayBalanceStore', () => {
    const initStoreProperties = {
        isPaying: false,
        isPaySuccess: false,
        remainingAmount: 0,
        paidCardDetails: undefined,
        isAmountPayValid: true,
        amountForPayInFocus: false,
    } as any;

    const createRootStore = () =>
        ({
            layoutStore: {
                basePath: '/en/holidays',
            },
            routerStore: {
                redirectToHomePage: jest.fn(),
            },
            payStore: {
                sessionId: 'Test session id',
                canPay: true,
                amount: 12,
                cardInfo: {
                    cardType: 'visa',
                },
                forceFieldErrors: false,
                onForceErrors: jest.fn(),
                clearStore: jest.fn(),
                setAmount: jest.fn(),
                setCurrency: jest.fn(),
                setBillingInfo: jest.fn(),
                clearUI: jest.fn(),
                setPaymentError: jest.fn(),
                setPaymentAuthorization: jest.fn(),
                setFailedToPay: jest.fn(),
                setPaymentErrors: jest.fn(),
                setSessionId: jest.fn(),
                clearCardInfo: jest.fn(),
                setIsUseCreditAllowed: jest.fn(),
                getCredit: jest.fn(),
            },
            holidayCreditStore: {
                isCreditBookingEnabled: true,
            },
            bookingStore: {
                extraLuggage: {
                    setExtraLuggageInfo: jest.fn(),
                },
            },
        } as any);

    const createInitialState = () =>
        ({
            payBalancePayload: {
                billingInfo: {
                    fullName: 'Test fullname',
                    address: 'Test address',
                    city: 'Test city',
                    postCode: 'Test postCode',
                    address2: 'Test address2',
                },
                bookingReference: 'Test booking reference',
                date: 'Test date',
                lastName: 'Test last name',
                isFromCheckAndConfirm: true,
            },
        } as any);

    const createTransaction = () => ({
        i: 'Test i',
        s: 2,
        q: 'Test q',
        t: 'Test t',
        p: 123123,
    });

    let rootStore = createRootStore();
    let initialState = createInitialState();
    let transaction = createTransaction();

    beforeEach(() => {
        rootStore = createRootStore();
        initialState = createInitialState();
        transaction = createTransaction();
    });

    describe('deserialize', () => {
        it('should correctly deserialize store from initial data', () => {
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            expect(store.payBalancePayload).toEqual(initialState.payBalancePayload);
        });

        it('should avoid deserialization beacause of invalid data', () => {
            const store = new PayBalanceStore(rootStore);
            store.deserialize(undefined);

            expect(store.payBalancePayload).toEqual(undefined);
        });
    });

    describe('serialize', () => {
        it('should correctly serialize store data', () => {
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);
            const serializedData = store.serialize();

            expect(serializedData).toEqual(initialState);
        });
    });

    describe('canPay', () => {
        it('should return correct ability to pay from paystore', () => {
            const store = new PayBalanceStore(rootStore);

            expect(store.canPay).toBe(rootStore.payStore.canPay);
        });

        it('should return correct ability if amount to pay is valid', () => {
            rootStore.payStore.canPay = false;
            const store = new PayBalanceStore(rootStore);

            expect(store.canPay).toBe(false);
        });

        it('should return correct ability if amount to pay more than 0', () => {
            rootStore.payStore.canPay = false;
            const store = new PayBalanceStore(rootStore);
            store.isAmountPayValid = false;

            expect(store.canPay).toBe(false);
        });
    });

    describe('isFromCheckAndConfirm', () => {
        it('should return that data is from checkAndConfirm', () => {
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            expect(store.isFromCheckAndConfirm).toBe(initialState.payBalancePayload.isFromCheckAndConfirm);
        });

        it('should return that data is NOT from checkAndConfirm', () => {
            const store = new PayBalanceStore(rootStore);
            initialState.payBalancePayload.isFromCheckAndConfirm = false;
            store.deserialize(initialState);

            expect(store.isFromCheckAndConfirm).toBe(initialState.payBalancePayload.isFromCheckAndConfirm);
        });

        it('should correctly return that checkAndConfirm is NOT defined', () => {
            const store = new PayBalanceStore(rootStore);
            initialState.payBalancePayload.isFromCheckAndConfirm = undefined;
            store.deserialize(initialState);

            expect(store.isFromCheckAndConfirm).toBe(false);
        });

        it('should return false because of invalid data', () => {
            const store = new PayBalanceStore(rootStore);
            store.deserialize(undefined);
            expect(store.isFromCheckAndConfirm).toBe(false);
        });
    });

    describe('toggleFocusAmountForPay', () => {
        it('should set the value for amountForPayInFocus correctly', () => {
            const store = new PayBalanceStore(rootStore);

            expect(store.amountForPayInFocus).toBe(initStoreProperties.amountForPayInFocus);

            store.toggleFocusAmountForPay(true);

            expect(store.amountForPayInFocus).toBe(true);

            store.toggleFocusAmountForPay(false);

            expect(store.amountForPayInFocus).toBe(false);
        });
    });

    describe('onAmountPayValidChange', () => {
        it('should correctly set the value for isAmountPayValid', () => {
            const store = new PayBalanceStore(rootStore);

            expect(store.isAmountPayValid).toBe(initStoreProperties.isAmountPayValid);

            store.onAmountPayValidChange(true);

            expect(store.isAmountPayValid).toBe(true);

            store.onAmountPayValidChange(false);

            expect(store.isAmountPayValid).toBe(false);
        });
    });

    describe('onForceErrors', () => {
        it('should NOT force payStore error and focus amount for pay', () => {
            const store = new PayBalanceStore(rootStore);
            store.isAmountPayValid = false;

            const testValue = true;

            store.onForceErrors(testValue);

            expect(rootStore.payStore.forceFieldErrors).toBe(testValue);
            expect(store.amountForPayInFocus).toBe(true);
            expect(rootStore.payStore.onForceErrors).not.toHaveBeenCalled();
        });

        it('should NOT focus amount for pay because of payAmount validity', () => {
            const store = new PayBalanceStore(rootStore);
            store.isAmountPayValid = true;

            const testValues = false;

            store.onForceErrors(testValues);

            expect(rootStore.payStore.forceFieldErrors).toBe(testValues);
            expect(store.amountForPayInFocus).toBe(false);
            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
        });

        it('should force error in payStore because of invalid payAmount and', () => {
            const store = new PayBalanceStore(rootStore);
            store.isAmountPayValid = false;

            const testValue = false;

            store.onForceErrors(testValue);

            expect(rootStore.payStore.forceFieldErrors).toBe(testValue);
            expect(store.amountForPayInFocus).toBe(initStoreProperties.amountForPayInFocus);
            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
        });
    });

    describe('goBackToViewBooking', () => {
        beforeEach(() => {
            // mocked module
            (submitForm as any).mockReset();
        });

        it('should correctly submit form with lead guest', () => {
            const leadGuest = {
                lastName: 'Test lead last name',
                isLead: true,
            };
            const booking = {
                bookingReference: 'Test booking reference',
                package: {
                    accom: {
                        startDate: 'Test start date',
                    },
                    transport: {
                        routes: mockFlightsRoutes,
                    },
                },
                guests: [
                    {
                        isLead: false,
                    },
                    { ...leadGuest },
                ],
            };

            const submitValue = {
                bookingReference: booking.bookingReference,
                date: '2023-05-11',
                lastName: leadGuest.lastName,
                isBackToPageClicked: true,
                package: {
                    accom: {
                        startDate: 'Test start date',
                    },
                    transport: booking.package.transport,
                },
            };

            const store = new PayBalanceStore(rootStore);
            store.booking = { ...booking } as IBookingInfo;

            store.goBackToViewBooking();

            expect(submitForm).toHaveBeenCalledWith(
                `/en/holidays${SitePath.ViewBooking}`,
                'view-booking-payload',
                submitValue,
            );
        });

        it('should correctly submit form with lead guest', () => {
            const store = new PayBalanceStore(rootStore);

            store.goBackToViewBooking();

            expect(submitForm).not.toHaveBeenCalled();
        });
    });

    describe('initialize', () => {
        const viewBookingResponseMock = {
            data: {
                paymentInfo: {
                    balanceDueAmount: 123123,
                },
            },
        };

        beforeEach(() => {
            // mocked module
            (getTransaction as any).mockReset();
            (bookingService.viewBooking as any).mockReset();
        });

        it('should redirect to home page because of invalid data during initialization', async () => {
            const store = new PayBalanceStore(rootStore);

            await store.initialize();

            expect(rootStore.payStore.clearStore).toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
            expect(bookingService.viewBooking).not.toHaveBeenCalled();
        });

        it('should NOT set billing info to PayStore', async () => {
            initialState.payBalancePayload.billingInfo = null;
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.resolve(viewBookingResponseMock));

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.initialize();

            expect(rootStore.payStore.setAmount).toHaveBeenCalledWith(
                viewBookingResponseMock.data.paymentInfo.balanceDueAmount,
            );
            expect(rootStore.payStore.setBillingInfo).not.toHaveBeenCalled();
            expect(getTransaction).toHaveBeenCalled();
        });

        it('should redirect to home page in case of service error', async () => {
            initialState.payBalancePayload.billingInfo = null;
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.reject(new Error()));

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.initialize();

            expect(rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
        });

        it('should NOT call pay remaining balance because of invalid transaction data', async () => {
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.resolve(viewBookingResponseMock));
            (getTransaction as any).mockReturnValueOnce(null);

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            const payRemainingBalanceSpy = jest.spyOn(store, 'payRemainingBalance');

            await store.initialize();

            expect(getTransaction).toHaveBeenCalled();
            expect(payRemainingBalanceSpy).not.toHaveBeenCalled();

            payRemainingBalanceSpy.mockRestore();
        });

        it('should NOT call pay remaining balance because of different booking references', async () => {
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.resolve(viewBookingResponseMock));
            (getTransaction as any).mockReturnValueOnce(transaction);

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            const payRemainingBalanceSpy = jest.spyOn(store, 'payRemainingBalance');

            await store.initialize();

            expect(getTransaction).toHaveBeenCalled();
            expect(payRemainingBalanceSpy).not.toHaveBeenCalled();

            payRemainingBalanceSpy.mockRestore();
        });

        it('should NOT call pay remaining balance because of NEW transaction state', async () => {
            transaction.q = initialState.payBalancePayload.bookingReference;
            // transaction with status NEW
            transaction.s = 0;
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.resolve(viewBookingResponseMock));
            (getTransaction as any).mockReturnValueOnce(transaction);

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            const payRemainingBalanceSpy = jest.spyOn(store, 'payRemainingBalance');

            await store.initialize();

            expect(getTransaction).toHaveBeenCalled();
            expect(payRemainingBalanceSpy).not.toHaveBeenCalled();

            payRemainingBalanceSpy.mockRestore();
        });

        it('should call pay remaining balance because of PROCESSING transaction state', async () => {
            transaction.q = initialState.payBalancePayload.bookingReference;
            // transaction with status PROCESSING
            transaction.s = 1;
            // mocked module
            (bookingService.viewBooking as any).mockReturnValueOnce(Promise.resolve(viewBookingResponseMock));
            (getTransaction as any).mockReturnValueOnce(transaction);

            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            const payRemainingBalanceSpy = jest.spyOn(store, 'payRemainingBalance');

            await store.initialize();

            expect(getTransaction).toHaveBeenCalled();
            expect(payRemainingBalanceSpy).toHaveBeenCalled();

            payRemainingBalanceSpy.mockRestore();
        });

        it('should set currency', async () => {
            const store = new PayBalanceStore(rootStore);
            store.payBalancePayload = { bookingReference: '' } as IPayBalancePayload;
            bookingService.viewBooking = jest
                .fn()
                .mockResolvedValue({ data: { isLoggedInAsLeadPassenger: true, paymentInfo: { currency: 'CHF' } } });
            await store.initialize(true);

            expect(rootStore.payStore.setCurrency).toBeCalledWith('CHF');
        });

        it('should call setExtraLuggageInfo when booking is fetched', async () => {
            const store = new PayBalanceStore(rootStore);
            store.payBalancePayload = { bookingReference: '' } as IPayBalancePayload;
            bookingService.viewBooking = jest.fn().mockResolvedValue({
                data: {
                    extraLuggageInfo: { items: [] },
                    isLoggedInAsLeadPassenger: true,
                    paymentInfo: { currency: 'CHF' },
                },
            });
            await store.initialize(true);

            expect(store.rootStore.bookingStore.extraLuggage.setExtraLuggageInfo).toBeCalledWith({ items: [] });
        });
    });

    describe('payRemainingBalance', () => {
        const createPayRemainingBalanceResponse = () =>
            ({
                data: {
                    resultCode: 'Identify', //  Identify, Challenge, Redirect
                    bookingReference: 'bookingReference',
                },
            } as any);

        const crateApiError = () => ({
            additionalData: {
                sessionId: 'Test error session id',
            },
            errorCode: ApiErrors.CommitBookingError,
            correlationId: 'test correlation id',
        });

        let payRemainingBalanceResponse = createPayRemainingBalanceResponse();
        let apiError = crateApiError();

        beforeEach(() => {
            payRemainingBalanceResponse = createPayRemainingBalanceResponse();
            apiError = crateApiError();
            (bookingService.payRemainingBalance as any).mockReset();
        });

        it('should force error because of inability to pay', async () => {
            rootStore.payStore.canPay = false;
            const store = new PayBalanceStore(rootStore);

            await store.payRemainingBalance();

            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
            expect(store.isPaying).toBe(false);
        });

        it('should force error because of paying', async () => {
            rootStore.payStore.canPay = false;
            const store = new PayBalanceStore(rootStore);
            store.isPaying = true;

            await store.payRemainingBalance();

            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
        });

        it('should correctly handle finished transaction', async () => {
            payRemainingBalanceResponse.data.resultCode = null;
            (bookingService.payRemainingBalance as any).mockReturnValueOnce(
                Promise.resolve(payRemainingBalanceResponse),
            );
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.payRemainingBalance();

            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith(null);
            expect(store.booking).toEqual(payRemainingBalanceResponse.data);
            // expect(store.paidCardDetails).toEqual(rootStore.payStore.cardInfo);
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(false);
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.clearCardInfo).toHaveBeenCalled();
            expect(store.isPaySuccess).toBe(true);
            expect(setTransactionDone).toHaveBeenCalled();
        });

        it('should correctly handle service error', async () => {
            const apiError = new Error();
            (bookingService.payRemainingBalance as any).mockReturnValueOnce(Promise.reject(apiError));
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.payRemainingBalance();

            expect(startNewTransaction).toHaveBeenCalledWith(initialState.payBalancePayload.bookingReference);
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentErrors).toHaveBeenCalledWith(apiError);
            expect(store.isPaying).toBe(false);
            expect(rootStore.payStore.setSessionId).not.toHaveBeenCalled();
        });

        it('should handle commit booking error correctly', async () => {
            apiError.errorCode = ApiErrors.CommitBookingError;
            (bookingService.payRemainingBalance as any).mockReturnValueOnce(Promise.reject(apiError));
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.payRemainingBalance();

            const [error] = (rootStore.payStore.setPaymentError as any).mock.calls[0];

            expect(startNewTransaction).toHaveBeenCalledWith(initialState.payBalancePayload.bookingReference);
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith(apiError.additionalData.sessionId);
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(error.correlationId).toBe(apiError.correlationId);
            expect(store.isPaying).toBe(false);
        });

        it('should handle cancel payment error correctly', async () => {
            apiError.errorCode = ApiErrors.CancelPaymentError;
            (bookingService.payRemainingBalance as any).mockReturnValueOnce(Promise.reject(apiError));
            const store = new PayBalanceStore(rootStore);
            store.deserialize(initialState);

            await store.payRemainingBalance();

            const [error] = (rootStore.payStore.setPaymentError as any).mock.calls[0];

            expect(error.correlationId).toBe(apiError.correlationId);
        });
    });

    describe('payRemainingBalanceWithApplePay', () => {
        const mockApplePayEvent = {
            payment: {
                token: {
                    paymentData: 'testPaymentData',
                },
            },
        } as ApplePayJS.ApplePayPaymentAuthorizedEvent;

        let store: PayBalanceStore;

        beforeEach(() => {
            rootStore.payStore.canPay = true;
            rootStore.payStore.applePayPaymentInfo = jest.fn().mockReturnValue({
                type: 'ApplePay',
                amount: 100,
            });
            store = new PayBalanceStore(rootStore);
            store.isPaying = false;
            (window.scrollTo as jest.Mock).mockClear();
        });

        it('should NOT process the transaction and should force errors if canPay is false', async () => {
            rootStore.payStore.canPay = false;

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();
            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
            expect(bookingService.payRemainingBalance).not.toHaveBeenCalled();
        });

        it('should NOT process transaction and should NOT force errors if a payment authorisation is already in process', async () => {
            store.isPaying = true;

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();
            expect(rootStore.payStore.onForceErrors).not.toHaveBeenCalledWith(true);
            expect(bookingService.payRemainingBalance).not.toHaveBeenCalled();
        });

        it('should successfully process Apple Pay payment and handle state transitions', async () => {
            rootStore.payStore.applePayPaymentInfo = jest.fn().mockReturnValue({
                type: 'ApplePay',
                amount: 100,
            });

            store.payBalancePayload = { bookingReference: 'testRef' } as IPayBalancePayload;

            const response = {
                data: {
                    bookingReference: 'testRef',
                    status: 'confirmed',
                },
            };

            (bookingService.payRemainingBalance as jest.Mock).mockResolvedValue(response);

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();

            expect(setTransactionProcessing).toHaveBeenCalled();
            expect(bookingService.payRemainingBalance).toHaveBeenCalled();
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith(null);
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(false);
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(store.booking).toEqual(response.data);
            expect(store.isPaySuccess).toBe(true);
            expect(setTransactionDone).toHaveBeenCalled();
            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
            expect(store.isPaying).toBe(false);
        });

        it('should handle commit booking payment error correctly', async () => {
            const error = {
                errorCode: ApiErrors.CommitBookingError,
                additionalData: { sessionId: 'testSessionID' },
                correlationId: 'testCorrelationID',
            };
            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(error);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith('testSessionID');
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentError).toHaveBeenCalledWith({
                correlationId: 'testCorrelationID',
                ...commitBookingError,
            });
            expect(store.isPaying).toBe(false);
        });

        it('should handle cancel payment error correctly', async () => {
            const error = {
                errorCode: ApiErrors.CancelPaymentError,
                additionalData: { sessionId: 'testSessionID' },
                correlationId: 'testCorrelationID',
            };

            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(error);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith('testSessionID');
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentError).toHaveBeenCalledWith({
                correlationId: 'testCorrelationID',
                ...cancelPaymentError,
            });
            expect(store.isPaying).toBe(false);
        });

        it('should handle unexpected errors during Apple Pay payment', async () => {
            const unexpectedError = new Error('Unexpected error');
            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(unexpectedError);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).not.toHaveBeenCalled();
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentErrors).toHaveBeenCalledWith(unexpectedError);
            expect(store.isPaying).toBe(false);
        });
    });

    describe('isFlightExternal', () => {
        let store: PayBalanceStore;

        beforeEach(() => {
            store = new PayBalanceStore(rootStore);
            store.booking = mockBooking;
        });

        it('should return true if flight is external', () => {
            expect(store.isFlightExternal).toBe(true);
        });

        it('should return false if flight is internal', () => {
            store.booking.package.transport.routes[0]!.isExt = false;
            expect(store.isFlightExternal).toBe(false);
        });
    });

    describe('isLuxuryPackage', () => {
        let store: PayBalanceStore;

        beforeEach(() => {
            store = new PayBalanceStore(rootStore);
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

    describe('payRemainingBalanceWithApplePay', () => {
        const mockApplePayEvent = {
            payment: {
                token: {
                    paymentData: 'testPaymentData',
                },
            },
        } as ApplePayJS.ApplePayPaymentAuthorizedEvent;

        let store: PayBalanceStore;

        beforeEach(() => {
            rootStore.payStore.canPay = true;
            rootStore.payStore.applePayPaymentInfo = jest.fn().mockReturnValue({
                type: 'ApplePay',
                amount: 100,
            });
            store = new PayBalanceStore(rootStore);
            store.isPaying = false;
            (window.scrollTo as jest.Mock).mockClear();
        });

        it('should NOT process the transaction and should force errors if canPay is false', async () => {
            rootStore.payStore.canPay = false;

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();
            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
            expect(bookingService.payRemainingBalance).not.toHaveBeenCalled();
        });

        it('should NOT process transaction and should NOT force errors if a payment authorisation is already in process', async () => {
            store.isPaying = true;

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();
            expect(rootStore.payStore.onForceErrors).not.toHaveBeenCalledWith(true);
            expect(bookingService.payRemainingBalance).not.toHaveBeenCalled();
        });

        it('should successfully process Apple Pay payment and handle state transitions', async () => {
            rootStore.payStore.applePayPaymentInfo = jest.fn().mockReturnValue({
                type: 'ApplePay',
                amount: 100,
            });

            store.payBalancePayload = { bookingReference: 'testRef' } as IPayBalancePayload;

            const response = {
                data: {
                    bookingReference: 'testRef',
                    status: 'confirmed',
                },
            };

            (bookingService.payRemainingBalance as jest.Mock).mockResolvedValue(response);

            await expect(store.payRemainingBalanceWithApplePay(mockApplePayEvent)).resolves.not.toThrow();

            expect(setTransactionProcessing).toHaveBeenCalled();
            expect(bookingService.payRemainingBalance).toHaveBeenCalled();
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith(null);
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(false);
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(store.booking).toEqual(response.data);
            expect(store.isPaySuccess).toBe(true);
            expect(setTransactionDone).toHaveBeenCalled();
            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
            expect(store.isPaying).toBe(false);
        });

        it('should handle commit booking payment error correctly', async () => {
            const error = {
                errorCode: ApiErrors.CommitBookingError,
                additionalData: { sessionId: 'testSessionID' },
                correlationId: 'testCorrelationID',
            };
            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(error);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith('testSessionID');
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentError).toHaveBeenCalledWith({
                correlationId: 'testCorrelationID',
                ...commitBookingError,
            });
            expect(store.isPaying).toBe(false);
        });

        it('should handle cancel payment error correctly', async () => {
            const error = {
                errorCode: ApiErrors.CancelPaymentError,
                additionalData: { sessionId: 'testSessionID' },
                correlationId: 'testCorrelationID',
            };

            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(error);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith('testSessionID');
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentError).toHaveBeenCalledWith({
                correlationId: 'testCorrelationID',
                ...cancelPaymentError,
            });
            expect(store.isPaying).toBe(false);
        });

        it('should handle unexpected errors during Apple Pay payment', async () => {
            const unexpectedError = new Error('Unexpected error');
            (bookingService.payRemainingBalance as jest.Mock).mockRejectedValueOnce(unexpectedError);

            store.payBalancePayload = { bookingReference: 'testBookingReference' } as IPayBalancePayload;

            await store.payRemainingBalanceWithApplePay(mockApplePayEvent);

            expect(startNewTransaction).toHaveBeenCalledWith('testBookingReference');
            expect(rootStore.payStore.setSessionId).not.toHaveBeenCalled();
            expect(rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(rootStore.payStore.setPaymentErrors).toHaveBeenCalledWith(unexpectedError);
            expect(store.isPaying).toBe(false);
        });
    });
});
