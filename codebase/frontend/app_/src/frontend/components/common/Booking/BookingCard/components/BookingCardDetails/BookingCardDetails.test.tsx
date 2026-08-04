import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__/booking';

import { BookingCardDetails, IBookingCardDetailsProps } from './BookingCardDetails';

const mockUsePreparedBookingDetailsData = {
    isFlightDetailsDisplayed: true,
    isCanceled: false,
    details: {
        luggageCount: 5,
    },
};
jest.mock(
    'frontend/components/common/Booking/BookingCard/components/BookingCardDetails/BookingCardDetails.utils',
    () => ({
        usePreparedBookingDetailsData: jest.fn(() => mockUsePreparedBookingDetailsData),
    }),
);

jest.mock('frontend/components/common/HolidayFlightDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='holiday-flight-details' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    layoutStore: {
        largeCabinBagCode: 'SCB1',
    },
});

const createProps = (): IBookingCardDetailsProps => ({
    booking: mockBooking,
});

let mockProps;
let mockStores;

describe('<BookingCardDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        const { container } = render(<BookingCardDetails {...mockProps} />);

        expect(screen.getByTestId('holiday-flight-details')).toBeInTheDocument();

        expect(container.getElementsByClassName('hotel-card-txt--canceled')).toHaveLength(0);
    });

    it('should render when booking is canceled', () => {
        mockUsePreparedBookingDetailsData.isCanceled = true;
        const { container } = render(<BookingCardDetails {...mockProps} />);

        expect(screen.getByTestId('holiday-flight-details')).toBeInTheDocument();

        expect(container.getElementsByClassName('hotel-card-txt--canceled')).toHaveLength(1);
    });

    it('should NOT render flight details when isFlightDetailsDisplayed is false', () => {
        mockUsePreparedBookingDetailsData.isFlightDetailsDisplayed = false;
        render(<BookingCardDetails {...mockProps} />);

        expect(screen.queryByTestId('holiday-flight-details')).not.toBeInTheDocument();
    });
});
