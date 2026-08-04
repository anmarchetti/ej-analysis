import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockLuggageListFields } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PaymentType } from 'models/enum/PaymentType';
import { gaLoginSuccess } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { IPaymentFormProps, PaymentForm } from './PaymentForm';

const createMockProps = (): IPaymentFormProps => ({
    isDisabled: false,
    isBillingOpen: false,
    isAmendPayment: false,
    fields: {
        PayWithDepositAttention: mockSitecoreField('test'),
        PayWithDepositDescription: mockSitecoreField('test'),
        PayWithDepositDescriptionOnePassenger: mockSitecoreField('test'),
        PayFullDescription: mockSitecoreField('test'),
        ImportantInformation: mockSitecoreField('test'),
        ImportantInformationConfirmation: mockSitecoreField('test'),
        PaymentDeny: mockSitecoreField('test'),
        AmountLeftToPay: mockSitecoreField('test'),
        AmountLeftToPayWithApplePayToggleOn: mockSitecoreField('AmountLeftToPayWithApplePayToggleOn'),
        CreditDebitCardLabel: mockSitecoreField('testCreditDebitCardLabel'),

        PaymentImages: [],
        CvvInfo: mockSitecoreField(mockSitecoreImageField('image.png')),
        CvvInfoAMEX: mockSitecoreField(mockSitecoreImageField('image.png')),
        IssueNumberInfo: mockSitecoreField(mockSitecoreImageField('image.png')),

        ProtectionImage: mockSitecoreField(mockSitecoreImageField('image.png')),
        ProtectionTitle: mockSitecoreField('test'),
        ...mockLuggageListFields,

        IsUseCreditShown: mockSitecoreField(true),
        UseCreditTitle: mockSitecoreField('test'),
        UseCreditDescription: mockSitecoreField('test'),
        UseCreditFormTitle: mockSitecoreField('test'),
        UseCreditLogInText: mockSitecoreField('test'),
        EnablePriceJumpInfoBox: mockSitecoreField(true),
        PriceDecreasedMessage: mockSitecoreField('PriceDecreasedMessage'),
        PriceIncreasedMessage: mockSitecoreField('PriceIncreasedMessage'),
        IconCreditInfoBlock: mockSitecoreField(mockSitecoreImageField('image.png')),
        TextCreditInfoBlock: mockSitecoreField('TextCreditInfoBlock'),
        LuggageInfoTitle: mockSitecoreField('LuggageInfoTitle'),
        PramName: mockSitecoreField('PramName'),
        SportEquipmentsLabel: mockSitecoreField('SportEquipmentsLabel'),
        PriceJumpPopupAccept: mockSitecoreField('accept'),
        PriceJumpPopupDecline: mockSitecoreField('decline'),
        PriceJumpPopupDescription: mockSitecoreField('description'),
        PriceJumpPopupTitle: mockSitecoreField('title'),
        TouristTaxPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxPaymentRequiredBannerTitle'),
        TouristTaxPaymentRequiredBannerText: mockSitecoreField('TouristTaxPaymentRequiredBannerText'),
        TouristTaxNoPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxNoPaymentRequiredBannerTitle'),
        TouristTaxNoPaymentRequiredBannerText: mockSitecoreField('TouristTaxNoPaymentRequiredBannerText'),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseCreditProps = jest.fn();
jest.mock('./UseCredit', () => ({
    __esModule: true,
    default: props => {
        mockUseCreditProps(props);

        return <div data-tid='use-credit' />;
    },
}));

const mockPaymentErrorsProps = jest.fn();
jest.mock('./PaymentErrors', () => ({
    __esModule: true,
    default: props => {
        mockPaymentErrorsProps(props);

        return <div data-tid='payment-errors' />;
    },
}));

const mockAmountLeftToPay = jest.fn();
jest.mock('./AmountLeftToPay', () => ({
    __esModule: true,
    default: props => {
        mockAmountLeftToPay(props);

        return <div data-tid='amount-left-to-pay' />;
    },
}));

const mockPaymentOptionsProps = jest.fn();
jest.mock('./PaymentOptions', () => ({
    __esModule: true,
    default: props => {
        mockPaymentOptionsProps(props);

        return <div data-tid='payment-options' />;
    },
}));

const mockUseCreditLoginProps = jest.fn();
jest.mock('./UseCreditLogin', () => ({
    __esModule: true,
    default: props => {
        mockUseCreditLoginProps(props);

        return <div data-tid='use-credit-login' />;
    },
}));

const mockBillingAddressFormProps = jest.fn();
jest.mock('./BillingAddressForm', () => ({
    __esModule: true,
    default: props => {
        mockBillingAddressFormProps(props);

        return <div data-tid='billing-address-form' />;
    },
}));

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const canMakePaymentsMock = jest.fn().mockReturnValue(true); // Simulate availability

const constructorSpy = jest.fn();

class ApplePaySessionMock {
    constructor(version: number, paymentRequest: object) {
        constructorSpy({ version, paymentRequest });
        (global as any).__lastApplePaySession__ = this;
    }

    completeMerchantValidation = (session: any) => {
        throw new Error('completeMerchantValidation', session);
    };

    static canMakePayments = () => canMakePaymentsMock();
}

global.window.ApplePaySession = ApplePaySessionMock;

describe('<PaymentForm />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            payStore: {
                amount: 100,
                amountToPay: 100,
                hasCredit: false,
                isUseCreditActive: false,
                usedCredit: 0,
            },
            paymentTypeStore: {
                paymentTypes: [PaymentType.Card],
            },
            layoutStore: {
                getPhrase: (key: string) => key,
                getSettingAsBoolean: jest.fn(() => false),
            },
        });
    });

    it('should not disable forms if prop isDisabled is not active', () => {
        render(<PaymentForm {...mockProps} />);

        expect(mockPaymentOptionsProps).toHaveBeenCalledWith(expect.objectContaining({ isDisabled: false }));
        expect(mockBillingAddressFormProps).toHaveBeenCalledWith(expect.objectContaining({ isDisabled: false }));
    });

    it('should disable forms if prop isDisabled is active', () => {
        render(<PaymentForm {...mockProps} isDisabled />);

        expect(mockPaymentOptionsProps).toHaveBeenCalledWith(expect.objectContaining({ isDisabled: true }));
        expect(mockBillingAddressFormProps).toHaveBeenCalledWith(expect.objectContaining({ isDisabled: true }));
    });

    it('should prompt the user to input payment details if amount to pay is greater than 0 ', () => {
        mockStores.payStore.amountToPay = 1;

        render(<PaymentForm {...mockProps} />);

        expect(screen.getByTestId('amount-left-to-pay')).toBeInTheDocument();
        expect(screen.getByTestId('payment-options')).toBeInTheDocument();
        expect(screen.getByTestId('use-credit-login')).toBeInTheDocument();
        expect(screen.getByTestId('billing-address-form')).toBeInTheDocument();
    });

    it('should NOT prompt the user to input payment details if amount to pay is 0 ', () => {
        mockStores.payStore.amountToPay = 0;

        render(<PaymentForm {...mockProps} />);

        expect(screen.queryByTestId('amount-left-to-pay')).not.toBeInTheDocument();
        expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
        expect(screen.queryByTestId('use-credit-login')).not.toBeInTheDocument();
        expect(screen.queryByTestId('billing-address-form')).not.toBeInTheDocument();
    });

    it('should hide payment form when use credit is checked but has not been applied', () => {
        mockStores.payStore.isUseCreditActive = true;
        mockStores.payStore.usedCredit = 0;

        render(<PaymentForm {...mockProps} />);

        expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
        expect(screen.queryByTestId('billing-address-form')).not.toBeInTheDocument();
    });

    it('should render title if isAmendPayment is false', () => {
        mockProps.isAmendPayment = false;
        render(<PaymentForm {...mockProps} />);

        expect(screen.getByText('Payment.Titles.PaymentDetails')).toBeInTheDocument();
    });

    it('should NOT render title if isAmendPayment is true', () => {
        mockProps.isAmendPayment = true;
        render(<PaymentForm {...mockProps} />);

        expect(screen.queryByText('Payment.Titles.PaymentDetails')).not.toBeInTheDocument();
    });

    describe('Amount left to pay label', () => {
        describe('when on Amend Payment', () => {
            beforeEach(() => {
                mockProps.isAmendPayment = true;
            });

            it('should be the new label when we have Apple Pay', () => {
                canMakePaymentsMock.mockReturnValue(true);

                render(<PaymentForm {...mockProps} />);

                expect(mockAmountLeftToPay).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amountLeftToPayField: mockProps.fields.AmountLeftToPayWithApplePayToggleOn,
                    }),
                );
            });

            it('should be the original label when we do not have ApplePay', () => {
                canMakePaymentsMock.mockReturnValue(false);

                render(<PaymentForm {...mockProps} />);

                expect(mockAmountLeftToPay).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amountLeftToPayField: mockProps.fields.AmountLeftToPay,
                    }),
                );
            });
        });

        describe('when is NOT on Amend Payment', () => {
            beforeEach(() => {
                mockProps.isAmendPayment = false;
            });

            it('should be the original label when we have ApplePay', () => {
                canMakePaymentsMock.mockReturnValue(true);

                render(<PaymentForm {...mockProps} />);

                expect(mockAmountLeftToPay).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amountLeftToPayField: mockProps.fields.AmountLeftToPay,
                    }),
                );
            });

            it('should be the original label when we do NOT have ApplePay', () => {
                canMakePaymentsMock.mockReturnValue(false);

                render(<PaymentForm {...mockProps} />);

                expect(mockAmountLeftToPay).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amountLeftToPayField: mockProps.fields.AmountLeftToPay,
                    }),
                );
            });
        });
    });

    describe('UseCreditLogin', () => {
        it('should render UseCreditLogin if there is UseCreditLogInText', () => {
            render(<PaymentForm {...mockProps} />);

            expect(mockUseCreditLoginProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    textField: mockProps.fields.UseCreditLogInText,
                }),
            );
            expect(screen.getByTestId('use-credit-login')).toBeInTheDocument();
        });

        it('should NOT render UseCreditLogin if there is NO UseCreditLogInText', () => {
            mockProps.fields.UseCreditLogInText = null;
            render(<PaymentForm {...mockProps} />);

            expect(screen.queryByTestId('use-credit-login')).not.toBeInTheDocument();
            expect(mockUseCreditLoginProps).not.toHaveBeenCalled();
        });

        it('should call pushTrackingEvent when login is successful', async () => {
            render(<PaymentForm {...mockProps} />);

            const [[useCreditLoginProps]] = mockUseCreditLoginProps.mock.calls;
            expect(typeof useCreditLoginProps.onSuccessLogin).toBe('function');

            await useCreditLoginProps.onSuccessLogin();

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaLoginSuccess);
        });
    });
});
