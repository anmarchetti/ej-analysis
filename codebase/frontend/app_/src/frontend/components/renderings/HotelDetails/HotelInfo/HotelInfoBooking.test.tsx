import React from 'react';
import { render } from '@testing-library/react';

import HotelInfoBooking from './HotelInfoBooking';

const createProps = () => ({
    offer: 'offer',
    isShowEcoFacilityPlaceholder: false,
    rendering: {},
});

const createStores = () => ({
    bookingStore: { selectedOffer: 'offer' },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelInfo/components/HotelInfo', () => () => (
    <div data-tid='hotel-info' />
));

describe('<HotelInfoBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HotelInfo', () => {
        const { getByTestId } = render(<HotelInfoBooking {...mockProps} />);

        expect(getByTestId('hotel-info')).toBeInTheDocument();
    });
});
