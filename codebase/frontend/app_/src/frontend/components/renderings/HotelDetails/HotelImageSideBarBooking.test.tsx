import React from 'react';
import { render } from '@testing-library/react';

import HotelImageSideBarBooking from './HotelImageSideBarBooking';

const createProps = () => ({
    hotelInfo: {},
    offer: {},
    selectedSeatsPrice: 1,
    selectedSeatsPricePP: 2,
    rendering: {},
    params: {},
});

const createStores = () => ({
    bookingStore: { hotel: {}, selectedOffer: {} },
    seatMapStore: { selectedSeatsPrice: 1, selectedSeatsPricePP: 2 },
    layoutStore: { isTradePortal: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock(
    'frontend/components/renderings/HotelDetails/components/HotelImageCarouselSidebar/HotelImageCarouselSidebar',
    () => () => <div data-tid='hotel-image-carousel-sidebar' />,
);

describe('<HotelImageSideBarBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HotelImageCarouselSidebar', () => {
        const { getByTestId } = render(<HotelImageSideBarBooking {...mockProps} />);

        expect(getByTestId('hotel-image-carousel-sidebar')).toBeInTheDocument();
    });
});
