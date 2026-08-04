import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceBreakdownAfter from './PriceBreakdownAfter';

const createStores = () => ({
    amendPaymentStore: { isRefund: false, newBalanceAmount: 10, addToBalanceDueDate: 'date' as any, currency: 'GBP' },
    layoutStore: { getPhrase: jest.fn(p => p) },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceBreakdownAfter />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render if is refund', () => {
        mockStores.amendPaymentStore.isRefund = true;
        const { container } = render(<PriceBreakdownAfter />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if newBalanceAmount = 0', () => {
        mockStores.amendPaymentStore.newBalanceAmount = 0;
        const { container } = render(<PriceBreakdownAfter />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if newBalanceAmount < 0', () => {
        mockStores.amendPaymentStore.newBalanceAmount = -10;
        const { container } = render(<PriceBreakdownAfter />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render all data', () => {
        const { getByText } = render(<PriceBreakdownAfter />);

        expect(getByText(SitecoreDictionary.BookingPaymentLabelsRemainingBalanceDueDate)).toBeInTheDocument();
        expect(getByText(SitecoreDictionary.BookingPaymentLabelsRemainingBalance)).toBeInTheDocument();
        expect(getByText('£10')).toBeInTheDocument();
    });
});
