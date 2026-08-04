import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceBreakdown from './PriceBreakdown';

const createStores = () => ({
    amendPaymentStore: {
        isRefund: true,
        isCreditRefund: false,
        refundData: { credit: { credit: 1 }, refund: { credit: 2, cash: 3 } },
        balanceAmount: 0,
        currency: 'GBP',
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceBreakdown />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render if is NOT refund', () => {
        mockStores.amendPaymentStore.isRefund = false;
        const { container } = render(<PriceBreakdown />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if balance amount > 0', () => {
        mockStores.amendPaymentStore.balanceAmount = 1;
        const { container } = render(<PriceBreakdown />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render CreditConfirmRefundCardsCreditRefundAmount and credit if isCreditRefund', () => {
        mockStores.amendPaymentStore.isCreditRefund = true;
        const { getByText } = render(<PriceBreakdown />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount)).toBeInTheDocument();
        expect(getByText('£1')).toBeInTheDocument();
    });

    it('should render CreditConfirmRefundCardsCashRefundAmount, CreditConfirmRefundCardsCashRefundAmount and refund prices if isCreditRefund', () => {
        const { getByText } = render(<PriceBreakdown />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount)).toBeInTheDocument();
        expect(getByText(SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount)).toBeInTheDocument();
        expect(getByText('£2')).toBeInTheDocument();
        expect(getByText('£3')).toBeInTheDocument();
    });
});
