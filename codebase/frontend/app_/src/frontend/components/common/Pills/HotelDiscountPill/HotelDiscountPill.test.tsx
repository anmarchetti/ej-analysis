import React from 'react';
import { render } from '@testing-library/react';

import HotelDiscountPill from './HotelDiscountPill';

const createProps = () => ({
    amount: 10,
    isSmall: false,
    countryCode: 'code',
    tooltipMessage: 'message',
    isPillVisible: jest.fn(() => true),
    className: 'test-class',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(() => '{amount} test'), isPillVisible: jest.fn(() => true) },
    marketStore: { formatMoney: jest.fn(p => `£${p}`) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Pills/PricePill/PricePill', () => ({ children }) => (
    <div data-tid='price-pill'>{children}</div>
));

describe('<HotelDiscountPill />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when pill is NOT visible', () => {
        mockStores.layoutStore.isPillVisible = jest.fn(() => false);
        const { container } = render(<HotelDiscountPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when amount NOT provided', () => {
        mockProps.amount = undefined;
        const { container } = render(<HotelDiscountPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render price pill when pill is visible', () => {
        const { getByTestId } = render(<HotelDiscountPill {...mockProps} />);

        expect(getByTestId('price-pill')).toBeInTheDocument();
    });

    it('should render label with amount', () => {
        const { getByText } = render(<HotelDiscountPill {...mockProps} />);

        expect(getByText('£10 test')).toBeInTheDocument();
    });
});
