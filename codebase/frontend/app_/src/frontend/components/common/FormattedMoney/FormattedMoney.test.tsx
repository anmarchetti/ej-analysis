import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { NumberFormatPartTypes } from 'frontend/store/base';

import FormattedMoney, { TFormattedMoneyProps } from './FormattedMoney';

const createProps = (): TFormattedMoneyProps => ({
    amount: 100,
    className: 'class',
    options: { currency: CurrencyCode.GBP },
    dataTid: 'formatted-money',
});

const createStores = () =>
    createMockStores({
        marketStore: {
            formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '50' },
                { type: NumberFormatPartTypes.Decimal, value: '.10' },
            ]),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FormattedMoney />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render with all props', () => {
        const { container } = render(<FormattedMoney {...mockProps} />);

        expect(mockStores.marketStore.formatMoneyToIntegerAndDecimalWithTypes).toHaveBeenCalledWith(mockProps.amount, {
            currency: CurrencyCode.GBP,
        });
        expect(container).toHaveTextContent('£');
        expect(container).toHaveTextContent('50');
        expect(screen.getByTestId('formatted-money')).toHaveTextContent('.10');
        expect(screen.getByTestId('formatted-money')).toHaveClass(mockProps.className!);
    });
});
