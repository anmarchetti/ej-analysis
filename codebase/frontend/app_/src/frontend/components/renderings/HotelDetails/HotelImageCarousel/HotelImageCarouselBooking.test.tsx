import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import HotelImageCarouselBooking from './HotelImageCarouselBooking';

const createProps = () => ({
    fields: null,
    params: null,
    rendering: null,
});

const createStores = () =>
    createMockStores({
        bookingStore: { selectedOffer: null, failedToLoadData: false },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel', () => () => (
    <div data-tid='hotel-image-carousel' />
));

describe('<HotelImageCarouselBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HotelImageCarousel', () => {
        render(<HotelImageCarouselBooking {...mockProps} />);

        expect(screen.getByTestId('hotel-image-carousel')).toBeInTheDocument();
    });

    it('should render Failed to load offer data header when offer not provided and failedToLoadData', () => {
        mockStores.bookingStore.failedToLoadData = true;
        const { getByRole } = render(<HotelImageCarouselBooking {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('Failed to load offer data.');
    });

    it('should render Failed to load offer data header when offer not provided and failedToLoadData', () => {
        mockStores.bookingStore.failedToLoadData = true;
        const { getByRole } = render(<HotelImageCarouselBooking {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('Failed to load offer data.');
    });
});
