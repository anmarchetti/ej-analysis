import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FreeForKidsPill from './FreeForKidsPill';

const createProps = () => ({
    isSmall: false,
    countryCode: 'code',
    tooltipMessage: 'message',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isPillVisible: jest.fn(() => true) },
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

describe('<FreeForKidsPill />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when pill is NOT visible', () => {
        mockStores.layoutStore.isPillVisible = jest.fn(() => false);
        const { container } = render(<FreeForKidsPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render price pill when pill is visible', () => {
        const { getByTestId } = render(<FreeForKidsPill {...mockProps} />);

        expect(getByTestId('price-pill')).toBeInTheDocument();
    });

    it('should render for kids label', () => {
        const { getByText } = render(<FreeForKidsPill {...mockProps} />);

        expect(getByText(SitecoreDictionary.BasketLabelFreeForKids)).toBeInTheDocument();
    });
});
