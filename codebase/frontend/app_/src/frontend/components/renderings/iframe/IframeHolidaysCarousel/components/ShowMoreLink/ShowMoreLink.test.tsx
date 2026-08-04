import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ShowMoreLink } from './ShowMoreLink';

jest.mock('frontend/utils/tokenizer', () => ({ Tokenizer: { replaceToken: mockReplaceToken } }));

const createProps = () => ({
    href: '/url',
    shouldShowPrice: true,
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    hotelsStore: {
        minPrice: 100,
        minPricePp: 100,
        currency: CurrencyCode.GBP,
    },
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ShowMoreLink />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render with price', () => {
        render(<ShowMoreLink {...mockProps} />);

        const link = screen.getByRole('link');

        expect(link).toHaveAttribute('href', '/url');
        expect(link).toHaveTextContent(`${SitecoreDictionary.IframePromotingHolidaysLabelsShowMoreWithPrice} £100`);
    });

    it('should render with price and pp label', () => {
        mockStores.hotelsStore.minPricePp = 50;
        render(<ShowMoreLink {...mockProps} />);

        const link = screen.getByRole('link');

        expect(link).toHaveAttribute('href', '/url');
        expect(link).toHaveTextContent(
            `${SitecoreDictionary.IframePromotingHolidaysLabelsShowMoreWithPrice} ${SitecoreDictionary.GlobalsPriceLabelsPerPerson} £50`,
        );
    });

    it('should render without price', () => {
        mockProps.shouldShowPrice = false;
        render(<ShowMoreLink {...mockProps} />);

        expect(screen.getByRole('link')).toHaveTextContent(SitecoreDictionary.IframePromotingHolidaysLabelsShowMore);
    });

    it('should render with custom class', () => {
        (mockProps as any).className = 'custom-class';
        render(<ShowMoreLink {...mockProps} />);

        expect(screen.getByRole('link')).toHaveClass('custom-class');
    });
});
