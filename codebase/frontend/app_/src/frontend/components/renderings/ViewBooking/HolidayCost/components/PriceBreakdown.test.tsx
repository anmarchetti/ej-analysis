import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceBreakdown from './PriceBreakdown';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    currency: CurrencyCode.GBP,
    priceBreakdown: [
        { code: 'A', name: 'Test-1', quantity: 2, amount: 300 },
        { code: 'B', name: 'Test-2', quantity: 3, amount: 100 },
    ],
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceBreakdown />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should render breakdowns', () => {
        render(<PriceBreakdown {...props} />);
        const items = screen.getAllByTestId('price-breakdown-item');

        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('Test-1');
    });

    it('should render breakdown with negative price', () => {
        props.priceBreakdown = [{ code: 'T', name: 'Test', quantity: 0, amount: -200 }];
        render(<PriceBreakdown {...props} />);

        expect(screen.getByTestId('price-breakdown-price')).toHaveTextContent(`${props.priceBreakdown[0].amount}`);
    });

    it('should render dictionary label for kids breakdown', () => {
        props.priceBreakdown = [{ code: PriceBreakdownCode.Kids, name: 'Kids', quantity: 0, amount: 100 }];
        render(<PriceBreakdown {...props} />);

        expect(screen.getByTestId('price-breakdown-price')).toHaveTextContent(
            SitecoreDictionary.BoardTypesButtonsIncluded,
        );
    });
});
