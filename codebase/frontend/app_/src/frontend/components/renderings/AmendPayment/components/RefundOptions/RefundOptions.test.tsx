import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RefundOptions from './RefundOptions';
import * as utils from './refundOptions.utils';

const createProps = () => ({
    noTitle: false,
    fields: {
        RefundOptionsTitle: { value: 'RefundOptionsTitle' },
        RefundToBalanceOptionDescription: { value: 'RefundToBalanceOptionDescription' },
        UpdatedHolidayBalanceLabel: { value: 'UpdatedHolidayBalanceLabel' },
        PreviousBalanceLabel: { value: 'PreviousBalanceLabel' },
        TotalCostOfChange: { value: 'TotalCostOfChange' },
        RefundToBalanceOptionTitle: { value: 'RefundToBalanceOptionTitle' },
    },
});

const createStores = () => ({
    amendPaymentStore: {
        canRefund: false,
        canCredit: false,
        refundData: { credit: {}, refund: {} } as any,
        isCreditRefund: false,
        currency: 'GBP',
        setIsCreditRefund: jest.fn(),
        getAmendTransportLabel: jest.fn(),
        isOnlyRefundToBalance: false,
        balanceAmount: 20,
        totalPrice: -20,
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentBaseOption = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption', () => ({
    __esModule: true,
    default: props => {
        mockPaymentBaseOption(props);

        return <div data-tid='payment-base-option'>{props.children}</div>;
    },
}));

const mockOptionProps = jest.fn();
jest.mock('frontend/components/common/PriceOptions/PaymentOptionBreakdown/PaymentOptionBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockOptionProps(props);

        return <div data-tid='option' />;
    },
}));

describe('<RefundOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render title if RefundOptionsTitle is NOT provided', () => {
        mockProps.fields.RefundOptionsTitle = null;
        render(<RefundOptions {...mockProps} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render PaymentBaseOption with refundField when creditField and canCredit', () => {
        mockStores.amendPaymentStore.canCredit = true;
        jest.spyOn(utils, 'getCreditField').mockReturnValueOnce({ value: 'creditField' });
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('payment-base-option')).toBeInTheDocument();
        expect(screen.getByText('creditField')).toBeInTheDocument();
    });

    it('should render PaymentBaseOption with refundField when refundField and canRefund', () => {
        mockStores.amendPaymentStore.canRefund = true;
        jest.spyOn(utils, 'getRefundField').mockReturnValueOnce({ value: 'refundField' });
        render(<RefundOptions {...mockProps} />);

        expect(screen.getByTestId('payment-base-option')).toBeInTheDocument();
        expect(screen.getByText('refundField')).toBeInTheDocument();
    });

    it('should render refund credit and refund cash fields when refund credit and canRefund', () => {
        mockStores.amendPaymentStore.canRefund = true;
        mockStores.amendPaymentStore.refundData.refund = { credit: 5, cash: 10 };
        render(<RefundOptions {...mockProps} />);

        expect(screen.getAllByTestId('option')).toHaveLength(2);
        expect(mockOptionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: 5,
                className: 'option',
                label: SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount,
                dataTid: 'payment-option-breakdown-refund-credit',
                currency: mockStores.amendPaymentStore.currency,
            }),
        );
        expect(mockOptionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: 10,
                className: 'option',
                label: SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount,
                dataTid: 'payment-option-breakdown-refund-cash',
                currency: mockStores.amendPaymentStore.currency,
            }),
        );
    });

    it('should render refund to balance if and refund cash fields when refund credit and canRefund', () => {
        const updatedBalance = mockStores.amendPaymentStore.totalPrice + mockStores.amendPaymentStore.balanceAmount;
        mockStores.amendPaymentStore.isOnlyRefundToBalance = true;

        render(<RefundOptions {...mockProps} />);

        expect(mockPaymentBaseOption).toHaveBeenCalledWith({
            checkboxId: 'balance-option',
            children: expect.anything(),
            isSelected: true,
            price: updatedBalance,
            priceDescription: 'UpdatedHolidayBalanceLabel',
            title: 'RefundToBalanceOptionTitle',
            className: 'balanceRefund',
            currency: mockStores.amendPaymentStore.currency,
        });

        expect(mockOptionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: 20,
                className: 'option',
                label: mockProps.fields.PreviousBalanceLabel.value,
                dataTid: 'payment-option-breakdown-balance',
                currency: mockStores.amendPaymentStore.currency,
            }),
        );
        expect(mockOptionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: -20,
                className: 'option',
                label: mockProps.fields.TotalCostOfChange.value,
                dataTid: 'payment-option-breakdown-total',
                currency: mockStores.amendPaymentStore.currency,
            }),
        );

        expect(screen.getByText('RefundToBalanceOptionDescription')).toBeInTheDocument();
    });

    it('should NOT render refund credit and refund cash fields when no refund credit and canRefund', () => {
        mockStores.amendPaymentStore.canRefund = true;
        render(<RefundOptions {...mockProps} />);

        expect(
            screen.queryByText(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount)).not.toBeInTheDocument();
    });
});
