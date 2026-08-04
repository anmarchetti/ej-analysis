import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendPaymentOptions, { IAmendPaymentOptionsProps } from './AmendPaymentOptions';

const createMockProps = (): IAmendPaymentOptionsProps => ({
    fields: {
        PayFeeAmendDescription: mockSitecoreField('PayFeeAmendDescription'),
        PayFullAmendDescription: mockSitecoreField('PayFullAmendDescription'),
        PayFullAmendTitle: mockSitecoreField('PayFullAmendTitle'),
    } as IPaymentPageFields,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendmentPayNowProps = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/AmendmentPayNow/AmendmentPayNow', () => ({
    __esModule: true,
    default: props => {
        mockAmendmentPayNowProps(props);

        return <div data-tid='amendment-pay-now' />;
    },
}));

const mockPaymentOptionsFullProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionsFull/PaymentOptionsFull',
    () => ({
        __esModule: true,
        default: props => {
            mockPaymentOptionsFullProps(props);

            return <div data-tid='payment-options-full' />;
        },
    }),
);

const mockPaymentOptionsProps = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptions', () => ({
    __esModule: true,
    default: props => {
        mockPaymentOptionsProps(props);

        return <div data-tid='payment-options' />;
    },
}));

const mockRefundOptionsProps = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/components/RefundOptions/RefundOptions', () => ({
    __esModule: true,
    default: props => {
        mockRefundOptionsProps(props);

        return <div data-tid='refund-options' />;
    },
}));

describe('<AmendPaymentOptions />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendPaymentStore: {
                isPayingFeesOnly: false,
                canAddToBalance: false,
            },
        });
    });

    it('should render PaymentOptionsFull if isPayingFeesOnly is true', () => {
        mockStores.amendPaymentStore.isPayingFeesOnly = true;
        render(<AmendPaymentOptions {...mockProps} />);

        expect(screen.getByTestId('payment-options-full')).toBeInTheDocument();
        expect(mockPaymentOptionsFullProps).toHaveBeenCalledWith({ fields: mockProps.fields, isSelected: true });
        expect(screen.queryByTestId('amendment-pay-now')).not.toBeInTheDocument();
        expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
    });

    describe('refund options', () => {
        it('should render RefundOptions if canCredit is true and isRefund is true', () => {
            mockStores.amendPaymentStore.canCredit = true;
            mockStores.amendPaymentStore.isRefund = true;
            render(<AmendPaymentOptions {...mockProps} />);

            expect(screen.getByTestId('refund-options')).toBeInTheDocument();
            expect(mockRefundOptionsProps).toHaveBeenCalledWith({ fields: mockProps.fields });
            expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
            expect(screen.queryByTestId('payment-options-full')).not.toBeInTheDocument();
            expect(screen.queryByTestId('amendment-pay-now')).not.toBeInTheDocument();
        });

        it('should render RefundOptions if canRefund is true and isRefund is true', () => {
            mockStores.amendPaymentStore.canRefund = true;
            mockStores.amendPaymentStore.isRefund = true;
            render(<AmendPaymentOptions {...mockProps} />);

            expect(screen.getByTestId('refund-options')).toBeInTheDocument();
            expect(mockRefundOptionsProps).toHaveBeenCalledWith({ fields: mockProps.fields });
            expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
            expect(screen.queryByTestId('payment-options-full')).not.toBeInTheDocument();
            expect(screen.queryByTestId('amendment-pay-now')).not.toBeInTheDocument();
        });

        it('should render RefundOptions if isOnlyRefundToBalance is true and isRefund is true', () => {
            mockStores.amendPaymentStore.isOnlyRefundToBalance = true;
            mockStores.amendPaymentStore.isRefund = true;
            render(<AmendPaymentOptions {...mockProps} />);

            expect(screen.getByTestId('refund-options')).toBeInTheDocument();
            expect(mockRefundOptionsProps).toHaveBeenCalledWith({ fields: mockProps.fields });
            expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
            expect(screen.queryByTestId('payment-options-full')).not.toBeInTheDocument();
            expect(screen.queryByTestId('amendment-pay-now')).not.toBeInTheDocument();
        });
    });

    it('should render AmendmentPayNow if isBalanceDueDateExpired is true', () => {
        mockStores.amendPaymentStore.isBalanceDueDateExpired = true;
        render(<AmendPaymentOptions {...mockProps} />);

        expect(screen.getByTestId('amendment-pay-now')).toBeInTheDocument();
        expect(mockAmendmentPayNowProps).toHaveBeenCalledWith({ fields: mockProps.fields });
        expect(screen.queryByTestId('payment-options')).not.toBeInTheDocument();
        expect(screen.queryByTestId('payment-options-full')).not.toBeInTheDocument();
        expect(screen.queryByTestId('refund-options')).not.toBeInTheDocument();
    });

    it('should render PaymentOptions when not paying fees, not refunding and not balance due expired', () => {
        render(<AmendPaymentOptions {...mockProps} />);

        expect(screen.getByTestId('payment-options')).toBeInTheDocument();
        expect(mockPaymentOptionsProps).toHaveBeenCalledWith({ fields: mockProps.fields });
        expect(screen.queryByTestId('payment-options-full')).not.toBeInTheDocument();
        expect(screen.queryByTestId('amendment-pay-now')).not.toBeInTheDocument();
    });
});
