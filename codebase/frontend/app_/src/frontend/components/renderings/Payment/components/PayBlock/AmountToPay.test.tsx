import React from 'react';
import { render } from '@testing-library/react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';

import AmountToPay from './AmountToPay';

const mockFormattedMoneyProps = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoneyProps(props);

        return <div data-tid='formatted-money' />;
    },
    MIN_FRACTION_DIGITS: 2,
}));

describe('AmountToPay', () => {
    it('should render formatted parts when amount and currency are defined', () => {
        render(<AmountToPay amount={120} currency={CurrencyCode.GBP} />);

        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: 120,

            options: { currency: CurrencyCode.GBP, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger },
        });
    });

    it('should NOT render component if amount is undefined', () => {
        const { container } = render(<AmountToPay amount={undefined} currency={CurrencyCode.GBP} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component if currency is undefined', () => {
        const { container } = render(<AmountToPay amount={120} currency={undefined} />);
        expect(container).toBeEmptyDOMElement();
    });
});
