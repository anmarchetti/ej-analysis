import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { NumberFormatPartTypes } from 'frontend/store/base';

import BasketPriceCellPrice, { IBasketPriceCellPriceProps } from './BasketPriceCellPrice';

const mockCountUpComponent = jest.fn();
jest.mock('react-countup', () => ({
    __esModule: true,
    default: ({ props }) => {
        mockCountUpComponent(props);

        return <div data-tid='count-up' />;
    },
}));

const createStores = () => ({
    bookingStore: {
        disableBasketAnimation: false,
        isClickChangeButton: false,
        currency: CurrencyCode.GBP,
    },
    marketStore: {
        getFormattingSymbol: jest.fn(() => false),
        formatMoneyToIntegerAndDecimal: jest.fn(() => []),
        formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => [
            { type: NumberFormatPartTypes.Currency, value: '£' },
            { type: NumberFormatPartTypes.Integer, value: '50' },
            { type: NumberFormatPartTypes.Decimal, value: '.10' },
        ]),
    },
});

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): IBasketPriceCellPriceProps => ({
    amount: 0,
    fractionPart: 0,
    integerPart: 0,
    prevFractionPart: 0,
    prevIntegerPart: 0,
});

describe('<BasketPriceCellPrice />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<BasketPriceCellPrice {...mocks} />);
    });

    it('should render static price when animation is disabled', () => {
        mockStores.bookingStore.disableBasketAnimation = true;
        mocks.amount = 50.2;
        const { container } = render(<BasketPriceCellPrice {...mocks} />);

        expect(container.querySelector('.basket__price__whole')).toBeInTheDocument();
        expect(screen.queryByTestId('count-up')).not.toBeInTheDocument();
    });

    it('should render animated price when animation is enabled', () => {
        mocks.amount = 50;
        mockStores.bookingStore.isClickChangeButton = true;

        const { container } = render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getByTestId('currency-symbol')).toBeInTheDocument();
        expect(screen.getByTestId('count-up')).toBeInTheDocument();
        expect(container.children.item(0)?.textContent).toBe('£');
    });

    it('should render empty string when currency value is empty', () => {
        mocks.amount = 50;
        mockStores.bookingStore.isClickChangeButton = true;
        mockStores.marketStore.formatMoneyToIntegerAndDecimalWithTypes = jest.fn(() => [
            { type: NumberFormatPartTypes.Currency, value: '' },
            { type: NumberFormatPartTypes.Integer, value: '50' },
            { type: NumberFormatPartTypes.Decimal, value: '.00' },
        ]);

        const { container } = render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getByTestId('currency-symbol')).toBeInTheDocument();
        expect(screen.getByTestId('count-up')).toBeInTheDocument();
        expect(container.children.item(0)?.textContent).toBe('');
    });

    it('should render currency symbol after price', () => {
        mocks.amount = 50;
        mockStores.bookingStore.isClickChangeButton = true;
        mockStores.marketStore.formatMoneyToIntegerAndDecimalWithTypes = jest.fn(() => [
            { type: NumberFormatPartTypes.Integer, value: '2 000' },
            { type: NumberFormatPartTypes.Decimal, value: ',10' },
            { type: NumberFormatPartTypes.Currency, value: ' €' },
        ]);

        const { container } = render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getByTestId('currency-symbol')).toBeInTheDocument();
        expect(screen.getByTestId('count-up')).toBeInTheDocument();
        const children = container.children;
        expect(children.item(children.length - 1)?.textContent).toBe(' €');
    });

    it('should render animated price when fractional and prevFractional have same values', () => {
        mockStores.bookingStore.isClickChangeButton = true;

        render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getByTestId('count-up')).toBeInTheDocument();
    });

    it('should render animated price when fractional and prevFractional have different values', () => {
        mockStores.bookingStore.isClickChangeButton = true;
        mocks.fractionPart = 5;

        render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getAllByTestId('count-up')).toHaveLength(2);
    });

    it('should render decimalPart when decimalPart exists for static prices', () => {
        const decimalPart = '5';
        mockStores.bookingStore.disableBasketAnimation = true;
        mockStores.marketStore.formatMoneyToIntegerAndDecimalWithTypes.mockReturnValue([
            { type: NumberFormatPartTypes.Integer, value: '10' },
            { type: NumberFormatPartTypes.Decimal, value: '5' },
        ]);
        render(<BasketPriceCellPrice {...mocks} />);

        expect(screen.getByTestId('decimal-part')).toBeInTheDocument();
        expect(screen.getByTestId('decimal-part')).toHaveTextContent(decimalPart);
        expect(screen.queryByTestId('count-up')).not.toBeInTheDocument();
    });
});
