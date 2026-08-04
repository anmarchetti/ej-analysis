import clearAllMocks = jest.clearAllMocks;

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (selector: (stores: any) => any) => selector(mockStores),
}));

jest.mock('frontend/services/validation.service', () => ({
    validateModel: jest.fn(),
}));

jest.mock('frontend/services/applePayService/applePay.service', () => {
    const mockApplePayCommitBooking = jest.fn();

    return {
        __esModule: true,
        default: {
            validateMerchant: jest.fn(),
            applePayCommitBooking: mockApplePayCommitBooking,
        },
    };
});

import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import applePayService from 'frontend/services/applePayService/applePay.service';
import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import {
    gaApplePayButtonClicked,
    gaApplePayPaymentCancelled,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { getMockFunctionCallsWithSpecificParam } from 'frontend/components/renderings/Payment/testUtils';

import { ApplePayButton } from './ApplePayButton';

import styles from './ApplePayButton.module.scss';

const mockPushTrackingEvent = jest.fn();
const onForceErrorsMock = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: jest.fn(() => ({
        pushTrackingEvent: mockPushTrackingEvent,
    })),
}));

const mockApplePayError = jest.fn();
const applePaySessionConstructorSpy = jest.fn();
const completeMerchantValidationMock = jest.fn();
const paymentAuthorizationMock = jest.fn();

const beginMock = jest.fn();

class ApplePaySessionMock {
    constructor(version: number, paymentRequest: object) {
        applePaySessionConstructorSpy({ version, paymentRequest });
        (global as any).__lastApplePaySession__ = this;
    }

    begin = () => beginMock();

    completeMerchantValidation = (session: any) => completeMerchantValidationMock(session);

    static canMakePayments = () => {
        throw new Error('canMakePayments');
    };
}

global.window.ApplePaySession = ApplePaySessionMock;

const createStore = () => {
    (validationService.validateModel as jest.Mock).mockReturnValue([]);

    return createMockStores({
        payStore: {
            onForceErrors: onForceErrorsMock,
            setMerchantValidationFailure: jest.fn(),
            billingInfo: new BillingInfo('Test User', 'Street 1', 'City', '12345', 'Extra'),
            isBillingInfoValid: true,
        },
        paymentStore: {
            confirmPolicy: true,
        },
        paymentTypeStore: {
            setSelectedPaymentType: jest.fn(),
        },
        bookingStore: {
            commitApplePayBooking: jest.fn(),
        },
    });
};

let mockStores: IHolidaysStores = createStore();

jest.mock('frontend/components/renderings/Payment/components/ApplePay/ApplePayError/ApplePayError', () => ({
    __esModule: true,
    default: () => {
        mockApplePayError();

        return <div data-tid='apple-pay-error' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const onPayMock = jest.fn();

describe('ApplePayButton', () => {
    beforeEach(() => {
        mockStores = createStore();
        Object.defineProperty(mockStores.payStore, 'isBillingInfoValid', {
            get: () => true,
        });
    });

    it('Should have disabled class applied when hasDisabledOverlay is true', () => {
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={jest.fn()} hasDisabledOverlay />);
        const applePayButton = screen.getByTestId('apple-pay-button');
        expect(applePayButton).toHaveClass(styles.applePayButtonDisabled);
    });

    it('Should have disabled class NOT applied when hasDisabledOverlay is false', () => {
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={jest.fn()} />);
        const applePayButton = screen.getByTestId('apple-pay-button');
        expect(applePayButton).not.toHaveClass(styles.applePayButtonDisabled);
    });

    it('should open the payment sheet when the Apple Pay button is clicked', async () => {
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
        const buttonContainer = screen.getByTestId('apple-pay-button');
        const applePayButton = buttonContainer.querySelector('apple-pay-button');

        await userEvent.click(applePayButton!);

        expect(beginMock).toHaveBeenCalled();
        expect(onPayMock).not.toHaveBeenCalled();
    });

    it('should receive the correct data in the payment sheet', async () => {
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
        const buttonContainer = screen.getByTestId('apple-pay-button');
        const applePayButton = buttonContainer.querySelector('apple-pay-button');

        await userEvent.click(applePayButton!);

        expect(applePaySessionConstructorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentRequest: expect.objectContaining({
                    countryCode: 'GB',
                    currencyCode: 'GBP',
                    total: expect.objectContaining({ label: 'easyJet Holidays' }),
                    merchantCapabilities: ['supports3DS'],
                    supportedNetworks: expect.arrayContaining(['amex', 'maestro', 'masterCard', 'visa']),
                }),
            }),
        );
        const supportedNetworksSpy = applePaySessionConstructorSpy.mock.calls[0][0].paymentRequest.supportedNetworks;
        expect(supportedNetworksSpy).toHaveLength(4);
    });

    describe('amount to pay', () => {
        it('should be correct in the payment sheet', async () => {
            render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button');

            await userEvent.click(applePayButton!);

            expect(applePaySessionConstructorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentRequest: expect.objectContaining({
                        total: expect.objectContaining({ amount: '10' }),
                    }),
                }),
            );
        });

        it('should be correct in the payment sheet upon re-rendering', async () => {
            const { rerender } = render(
                <ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />,
            );
            rerender(<ApplePayButton amountToPay={20} onPaymentAuthorised={paymentAuthorizationMock} />);
            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button');

            await userEvent.click(applePayButton!);

            expect(applePaySessionConstructorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentRequest: expect.objectContaining({
                        total: expect.objectContaining({ amount: '20' }),
                    }),
                }),
            );
        });
    });

    it('should call validateMerchant and completeMerchantValidation on onvalidatemerchant', async () => {
        const mockSessionResponse = { merchantSession: 'mocked-session' };
        (applePayService.validateMerchant as jest.Mock).mockResolvedValue(mockSessionResponse);
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
        const buttonContainer = screen.getByTestId('apple-pay-button');
        const applePayButton = buttonContainer.querySelector('apple-pay-button');

        await userEvent.click(applePayButton!);
        await waitFor(() => expect(applePaySessionConstructorSpy).toHaveBeenCalled());
        const validationURL = 'https://apple-pay-gateway.apple.com/paymentservices/startSession';
        const session = (global as any).__lastApplePaySession__;
        await session?.onvalidatemerchant?.({ validationURL });

        expect(applePayService.validateMerchant).toHaveBeenCalledWith(validationURL);
        expect(completeMerchantValidationMock).toHaveBeenCalledWith(mockSessionResponse);
    });

    it('should handle merchant validation failure and call setMerchantValidationFailure and abort', async () => {
        const abortMock = jest.fn();
        const errorMessage = new Error('Validation failed');
        (applePayService.validateMerchant as jest.Mock).mockRejectedValue(errorMessage);

        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
        const buttonContainer = screen.getByTestId('apple-pay-button');
        const applePayButton = buttonContainer.querySelector('apple-pay-button');
        await userEvent.click(applePayButton!);

        await waitFor(() => expect(applePaySessionConstructorSpy).toHaveBeenCalled());

        const session = (global as any).__lastApplePaySession__;
        session.abort = abortMock;

        await session?.onvalidatemerchant?.({ validationURL: 'https://fail' });

        expect(abortMock).toHaveBeenCalled();
        expect(mockStores.payStore.setMerchantValidationFailure).toHaveBeenCalledWith(errorMessage);
    });

    it('should call ApplePayError', () => {
        render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
        expect(mockApplePayError).toHaveBeenCalled();
    });

    it('should NOT create ApplePay session if the form validation fails', async () => {
        const mockFormValidation = jest.fn().mockReturnValue(false);

        render(
            <ApplePayButton
                amountToPay={10}
                onPaymentAuthorised={paymentAuthorizationMock}
                formValidation={mockFormValidation}
            />,
        );

        const buttonContainer = screen.getByTestId('apple-pay-button');
        const applePayButton = buttonContainer.querySelector('apple-pay-button')!;

        await userEvent.click(applePayButton);

        expect(mockFormValidation).toHaveBeenCalledTimes(1);
        expect(applePaySessionConstructorSpy).not.toHaveBeenCalled();
    });

    describe('Google Analytics test', () => {
        it('should fire a Google Analytics event with gaApplePayButtonClicked when Apple Pay button is clicked', async () => {
            render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button');

            await userEvent.click(applePayButton!);

            const callsWithGaApplePayButtonClicked = getMockFunctionCallsWithSpecificParam(
                mockPushTrackingEvent,
                gaApplePayButtonClicked,
            );

            expect(callsWithGaApplePayButtonClicked).toHaveLength(1);
        });

        it('should fire a Google Analytics event with gaApplePayPaymentCancelled when user clicks on cancel', async () => {
            render(<ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />);
            const buttonContainer = screen.getByTestId('apple-pay-button');
            const applePayButton = buttonContainer.querySelector('apple-pay-button');
            await userEvent.click(applePayButton!);
            const session = (global as any).__lastApplePaySession__;

            await session.oncancel();

            const callsWithGaApplePayPaymentCancelled = getMockFunctionCallsWithSpecificParam(
                mockPushTrackingEvent,
                gaApplePayPaymentCancelled,
            );

            expect(callsWithGaApplePayPaymentCancelled).toHaveLength(1);
        });
    });

    describe('Payment Authorization', () => {
        const mockPayment = {
            token: {
                paymentData: 'mock-payment-data',
                paymentMethod: {
                    displayName: 'Visa',
                    network: 'Visa',
                    type: 'debit',
                },
                transactionIdentifier: 'mock-transaction-id',
            },
        };

        beforeEach(() => {
            mockStores = createStore();
            clearAllMocks();
            applePaySessionConstructorSpy.mockClear();
            beginMock.mockClear();
        });

        const getApplePayPaymentAuthorizationEvent = async (mockPaymentParam = mockPayment) => {
            const completePaymentMock = jest.fn();
            const { container } = render(
                <ApplePayButton amountToPay={10} onPaymentAuthorised={paymentAuthorizationMock} />,
            );

            const applePayButton = container.querySelector('apple-pay-button');

            await userEvent.click(applePayButton!);

            const session = (global as any).__lastApplePaySession__;

            session.completePayment = completePaymentMock;

            await session?.onpaymentauthorized?.({ payment: mockPaymentParam });

            return { completePaymentMock, session, applePayButton, container };
        };

        it('should complete ApplePaySession successfully when booking is committed', async () => {
            (mockStores.bookingStore.commitApplePayBooking as jest.Mock).mockResolvedValue({ success: true });

            const { completePaymentMock } = await getApplePayPaymentAuthorizationEvent();
            expect(completePaymentMock).toHaveBeenCalledWith({ status: ApplePaySession.STATUS_SUCCESS });
        });

        it('should complete ApplePaySession with failure when booking commit fails', async () => {
            const error = new Error('Booking failed');
            (mockStores.bookingStore.commitApplePayBooking as jest.Mock).mockRejectedValue(error);

            const { completePaymentMock } = await getApplePayPaymentAuthorizationEvent();
            expect(completePaymentMock).toHaveBeenCalledWith({ status: ApplePaySession.STATUS_FAILURE });
        });
    });
});
