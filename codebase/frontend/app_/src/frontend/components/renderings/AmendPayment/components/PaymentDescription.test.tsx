import React from 'react';
import { render } from '@testing-library/react';

import PaymentDescription from './PaymentDescription';

const createProps = () => ({
    fields: {
        TakeFromBalanceForFlightDescription: { value: 'TakeFromBalanceForFlightDescription' },
        TakeFromBalanceForTransferDescription: { value: 'TakeFromBalanceForTransferDescription' },
        BalanceWillBePaidDescription: {
            value: 'BalanceWillBePaidDescription {amount} {remainingAmount} {balanceAmount} {creditAmount} {cashAmount}',
        },
        EligibleForOMOPRefundDescription: { value: 'EligibleForOMOPRefundDescription' },
        EligibleForCreditRefundDescription: { value: 'EligibleForCreditRefundDescription' },
    },
});

const createStores = () => ({
    amendPaymentStore: {
        balanceAmount: 10,
        totalPrice: 20,
        amountTakenFromBalance: 30,
        isRefund: true,
        isCreditRefund: false,
        refundData: { credit: { credit: 1 }, refund: { credit: 2, cash: 3 } },
        hasBalance: true,
        currency: 'GBP',
    },
    amendFlightsStore: { selectedFlight: {} },
    amendTransfersStore: { selectedTransfer: {} },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    layoutStore: {},
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

describe('<PaymentDescription />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if is NOT refund and has NOT balance', () => {
        mockStores.amendPaymentStore.isRefund = false;
        mockStores.amendPaymentStore.hasBalance = false;
        const { container } = render(<PaymentDescription {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render any message when no selectedFlight and no selectedTransfer and balanceAmount > totalPrice', () => {
        mockStores.amendFlightsStore.selectedFlight = null as any;
        mockStores.amendTransfersStore.selectedTransfer = null as any;
        mockStores.amendPaymentStore.balanceAmount = 30;
        const { container } = render(<PaymentDescription {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render only BalanceWillBePaidDescription when no selectedFlight and no selectedTransfer and balanceAmount = totalPrice', () => {
        mockStores.amendFlightsStore.selectedFlight = null as any;
        mockStores.amendTransfersStore.selectedTransfer = null as any;
        mockStores.amendPaymentStore.balanceAmount = 20;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('BalanceWillBePaidDescription')).toBeInTheDocument();
    });

    it('should render BalanceWillBePaidDescription EligibleForCreditRefundDescription when no selectedFlight and no selectedTransfer and balanceAmount < totalPrice and isCreditRefund', () => {
        mockStores.amendFlightsStore.selectedFlight = null as any;
        mockStores.amendTransfersStore.selectedTransfer = null as any;
        mockStores.amendPaymentStore.isCreditRefund = true;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('BalanceWillBePaidDescription EligibleForCreditRefundDescription')).toBeInTheDocument();
    });

    it('should render BalanceWillBePaidDescription EligibleForOMOPRefundDescription EligibleForCreditRefundDescription when no selectedFlight and no selectedTransfer and balanceAmount < totalPrice and no isCreditRefund', () => {
        mockStores.amendFlightsStore.selectedFlight = null as any;
        mockStores.amendTransfersStore.selectedTransfer = null as any;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(
            getByText(
                'BalanceWillBePaidDescription EligibleForOMOPRefundDescription EligibleForCreditRefundDescription',
            ),
        ).toBeInTheDocument();
    });

    it('should render TakeFromBalanceForFlightDescription when selectedFlight and no selectedTransfer', () => {
        mockStores.amendTransfersStore.selectedTransfer = null as any;
        mockStores.amendPaymentStore.balanceAmount = 20;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('TakeFromBalanceForFlightDescription BalanceWillBePaidDescription')).toBeInTheDocument();
    });

    it('should render TakeFromBalanceForTransferDescription when no selectedFlight and selectedTransfer', () => {
        mockStores.amendFlightsStore.selectedFlight = null as any;
        mockStores.amendPaymentStore.balanceAmount = 20;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('TakeFromBalanceForTransferDescription BalanceWillBePaidDescription')).toBeInTheDocument();
    });

    it('should render TakeFromBalanceForTransferDescription when selectedFlight and selectedTransfer', () => {
        mockStores.amendPaymentStore.balanceAmount = 20;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('TakeFromBalanceForTransferDescription BalanceWillBePaidDescription')).toBeInTheDocument();
    });

    it('should render prices provided in props', () => {
        mockStores.amendPaymentStore.balanceAmount = 20;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('£30')).toBeInTheDocument();
        expect(getByText('£0')).toBeInTheDocument();
        expect(getByText('£20')).toBeInTheDocument();
        expect(getByText('£2')).toBeInTheDocument();
        expect(getByText('£3')).toBeInTheDocument();
    });

    it('should render 0s when prices not provided in props', () => {
        mockStores.amendPaymentStore.balanceAmount = null as any;
        mockStores.amendPaymentStore.totalPrice = null as any;
        mockStores.amendPaymentStore.amountTakenFromBalance = null as any;
        mockStores.amendPaymentStore.refundData = {
            credit: { credit: null },
            refund: { credit: null, cash: null },
        } as any;
        const { getAllByText } = render(<PaymentDescription {...mockProps} />);

        expect(getAllByText('£0').length).toBe(5);
    });

    it('should render credit data when isCreditRefund', () => {
        mockStores.amendPaymentStore.balanceAmount = 20;
        mockStores.amendPaymentStore.isCreditRefund = true;
        const { getByText } = render(<PaymentDescription {...mockProps} />);

        expect(getByText('£1')).toBeInTheDocument();
    });
});
