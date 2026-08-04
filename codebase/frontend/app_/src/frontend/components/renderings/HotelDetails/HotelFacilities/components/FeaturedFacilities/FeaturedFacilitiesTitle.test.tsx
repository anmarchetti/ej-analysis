import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FeaturedFacilitiesTitle from './FeaturedFacilitiesTitle';

const createProps = () => ({
    hotelName: 'hotel',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeaturedFacilitiesTitle />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render title', () => {
        const { getByRole } = render(<FeaturedFacilitiesTitle {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.HotelInfoLabelsFeaturedFacilitiesTitle);
    });
});
