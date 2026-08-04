import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { getPaymentSummaryMeta } from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendPaymentMetaBlock from './AmendPaymentMetaBlock';
import { IAmendPaymentMetaBlockProps, IPaymentDetailsProps } from './interfaces';

let mockProps;
let mockStores;

const createProps = (): IAmendPaymentMetaBlockProps => ({
    fields: {
        AmendTitleReminder: mockSitecoreField('AmendTitleReminder'),
        AmendZeroPriceDescriptionReminder: mockSitecoreField('AmendZeroPriceDescriptionReminder'),
        AmendRefundCreditsOnlyTitleReminder: mockSitecoreField('AmendRefundCreditsOnlyTitleReminder'),
        AmendRefundCreditsOnlyDescriptionReminder: mockSitecoreField('AmendRefundCreditsOnlyDescriptionReminder'),
        AmendRefundDescriptionReminder: mockSitecoreField('AmendRefundDescriptionReminder'),
        ProtectionTitle: mockSitecoreField('ProtectionTitle'),
        ProtectionImage: mockSitecoreField(mockSitecoreImageField('ProtectionImage')),
        ConfirmChangesLabel: mockSitecoreField('ConfirmChangesLabel'),
    } as IPaymentPageFields,
});

const mockMetaInfo: IPaymentDetailsProps = {
    title: 'You are about to pay',
    subtitle: mockSitecoreField('Your remaining balance of {balanceAmount} is due by {date}'),
    price: 721.61,
    shouldPayNow: true,
    updatedBalanceAmount: 1200,
    confirmCTA: 'Confirm & Pay',
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentFormProps = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentForm', () => ({
    __esModule: true,
    default: props => {
        mockPaymentFormProps(props);

        return <div data-tid='payment-form' />;
    },
}));

const mockAmendPaymentTermsAndConditions = jest.fn();
jest.mock('../AmendPaymentTermsAndConditions/AmendPaymentTermsAndConditions', () => ({
    __esModule: true,
    default: props => {
        mockAmendPaymentTermsAndConditions(props);

        return <div data-tid='amend-payment-terms-and-conditions' />;
    },
}));

jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock.utils',
    () => ({
        __esModule: true,
        getPaymentSummaryMeta: jest.fn(() => mockMetaInfo),
    }),
);

jest.mock('./AmendPaymentSummaryErrors/AmendPaymentSummaryErrors', () => ({
    __esModule: true,
    default: () => <div data-tid='amend-payment-summary-errors' />,
}));

const mockAmendPaymentTotalBlockProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendPaymentTotalBlock/AmendPaymentTotalBlock', () => ({
    __esModule: true,
    default: props => {
        mockAmendPaymentTotalBlockProps(props);

        return <div data-tid='amend-payment-total-block' />;
    },
}));

const mockThreeDSecure = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/ThreeDSecure/ThreeDSecure', () => ({
    __esModule: true,
    default: props => {
        mockThreeDSecure(props);

        return <div data-tid='three-d-secure' />;
    },
}));

const mockPaymentProtected = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentProtected', () => ({
    __esModule: true,
    default: props => {
        mockPaymentProtected(props);

        return <div data-tid='payment-protected' />;
    },
}));

describe('<AmendPaymentMetaBlock />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            payStore: {
                requirePaymentAuthorization: false,
                paymentAuthorization: true,
                amount: 100,
                amountToPay: 50,
                usedCredit: 40,
            },
            amendPaymentStore: {
                isPaying: false,
                totalPrice: 10,
                amountToPay: 20,
                balanceAmount: 30,
                newBalanceAmount: 1200,
                refundData: {
                    credit: { credit: 1, isEligible: true },
                    refund: { credit: 2, cash: 3, isEligible: true },
                },
                currency: CurrencyCode.GBP,
                onPay: jest.fn(),
            },
            paymentTypeStore: {
                setApplePayUnavailable: jest.fn(),
            },
            layoutStore: {
                getSettingAsBoolean: jest.fn(() => false),
            },
        });
        mockProps = createProps();
    });

    it('Should render component', () => {
        render(<AmendPaymentMetaBlock {...mockProps} />);
        const { payStore, amendPaymentStore } = mockStores;

        expect(getPaymentSummaryMeta).toHaveBeenCalledWith({
            amountToPay: payStore.amountToPay,
            hasBalance: true,
            fields: mockProps.fields,
            paymentOption: amendPaymentStore.paymentOption,
            totalPrice: amendPaymentStore.totalPrice,
            usedCredit: payStore.usedCredit,
            totalFeesAmount: amendPaymentStore.amendmentPaymentInfo?.totalFeesAmount,
            newBalanceAmount: amendPaymentStore.newBalanceAmount,
        });

        expect(screen.getByTestId('amend-payment-meta-block')).toBeInTheDocument();
        expect(mockPaymentFormProps).toHaveBeenCalledWith(
            expect.objectContaining({ fields: mockProps.fields, isDisabled: false, isAmendPayment: true }),
        );
        expect(screen.getByTestId('payment-form')).toBeInTheDocument();

        expect(mockThreeDSecure).not.toHaveBeenCalled();
        expect(screen.queryByTestId('three-d-secure')).not.toBeInTheDocument();

        expect(mockPaymentProtected).toHaveBeenCalledWith(
            expect.objectContaining({
                protectionImage: mockProps.fields.ProtectionImage,
                protectionTitle: mockProps.fields.ProtectionTitle,
            }),
        );
        expect(screen.getByTestId('payment-protected')).toBeInTheDocument();

        expect(mockAmendPaymentTermsAndConditions).toHaveBeenCalledWith(
            expect.objectContaining({ fields: mockProps.fields }),
        );
        expect(screen.getByTestId('amend-payment-terms-and-conditions')).toBeInTheDocument();

        expect(mockAmendPaymentTotalBlockProps).toHaveBeenCalledWith({
            updatedBalanceAmount: 1200,
            hasError: false,
            title: 'You are about to pay',
            subtitle: { value: 'Your remaining balance of {balanceAmount} is due by {date}' },
            price: 721.61,
            confirmLabel: 'Confirm & Pay',
            isFullCreditPayment: undefined,
            validateFormAndScrollToError: expect.any(Function),
            onPayWithApplePay: expect.any(Function),
            shouldPayNow: true,
        });
        expect(screen.getByTestId('amend-payment-total-block')).toBeInTheDocument();
    });

    it('Should render component with payment authorization', () => {
        mockStores.payStore.requirePaymentAuthorization = true;
        render(<AmendPaymentMetaBlock {...mockProps} />);

        expect(mockThreeDSecure).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentAuthorization: mockStores.payStore.paymentAuthorization,
                onPay: expect.any(Function),
            }),
        );
        expect(screen.getByTestId('three-d-secure')).toBeInTheDocument();
    });

    it('Should pass confirmLabel from fields when confirmCTA is empty', () => {
        mockMetaInfo.confirmCTA = undefined;
        render(<AmendPaymentMetaBlock {...mockProps} />);

        expect(mockAmendPaymentTotalBlockProps).toHaveBeenCalledWith(
            expect.objectContaining({
                confirmLabel: mockProps.fields.ConfirmChangesLabel.value,
            }),
        );
    });

    describe('Payment errors', () => {
        it('should render component with payment errors when customerIsNotPayingNow', () => {
            mockStores.payStore.fatalPaymentError = false;
            mockStores.payStore.requirePaymentAuthorization = false;
            mockStores.amendPaymentStore.paymentOption = PaymentOption.AddToBalance;
            mockMetaInfo.shouldPayNow = false;
            render(<AmendPaymentMetaBlock {...mockProps} />);

            expect(screen.getByTestId('amend-payment-summary-errors')).toBeInTheDocument();
        });

        it('should render component with payment errors when isRefund', () => {
            mockStores.amendPaymentStore.isRefund = true;
            render(<AmendPaymentMetaBlock {...mockProps} />);

            expect(screen.getByTestId('amend-payment-summary-errors')).toBeInTheDocument();
        });

        it('should NOT render component with payment errors when hasError', () => {
            mockStores.payStore.fatalPaymentError = true;
            render(<AmendPaymentMetaBlock {...mockProps} />);

            expect(screen.queryByTestId('amend-payment-summary-errors')).not.toBeInTheDocument();
        });
    });

    it('should NOT render PaymentProtected if amount is less than 0', () => {
        mockStores.payStore.amount = -100;
        render(<AmendPaymentMetaBlock {...mockProps} />);

        expect(screen.queryByTestId('payment-protected')).not.toBeInTheDocument();
    });
});
