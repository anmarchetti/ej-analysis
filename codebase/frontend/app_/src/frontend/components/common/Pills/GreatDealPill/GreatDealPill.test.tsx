import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import GreatDealPill from './GreatDealPill';

const createProps = () => ({
    hideTooltip: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isGreatDealPillEnabled: true },
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

describe('<GreatDealPill />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when pill is NOT visible', () => {
        mockStores.layoutStore.isGreatDealPillEnabled = false;
        const { container } = render(<GreatDealPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render price pill when pill is visible', () => {
        const { getByTestId } = render(<GreatDealPill {...mockProps} />);

        expect(getByTestId('price-pill')).toBeInTheDocument();
    });

    it('should render great deal label', () => {
        const { getByText } = render(<GreatDealPill {...mockProps} />);

        expect(getByText(SitecoreDictionary.HolidayCardLabelsGreatDealPill)).toBeInTheDocument();
    });
});
