import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__/booking';
import { BookingStatus } from 'models/enum/BookingStatus';

import { BookingCardOptions, IBookingCardOptionsProps } from './BookingCardOptions';

jest.mock(
    'frontend/components/common/Booking/BookingCard/components/BookingCanceledStatusInfo/BookingCanceledStatusInfo',
    () => ({
        __esModule: true,
        default: () => <div data-tid='canceled-status-info' />,
    }),
);

jest.mock('frontend/components/renderings/SearchResults/components/OfferKeySellingPoints', () => ({
    __esModule: true,
    default: () => <div data-tid='offer-key-selling-points' />,
}));

const createProps = (): IBookingCardOptionsProps => ({
    booking: mockBooking,
});

let mockProps;

describe('<BookingCardOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render with upcoming holidays', () => {
        const { container } = render(<BookingCardOptions {...mockProps} />);

        expect(screen.queryByTestId('canceled-status-info')).not.toBeInTheDocument();
        expect(screen.getByTestId('offer-key-selling-points')).toBeInTheDocument();

        expect(container.getElementsByClassName('hotel-card-txt--canceled')).toHaveLength(0);
    });

    it('should render when booking is canceled', () => {
        mockProps.booking.bookingStatus = BookingStatus.Canceled;
        const { container } = render(<BookingCardOptions {...mockProps} />);

        expect(screen.getAllByTestId('canceled-status-info')).toHaveLength(1);
        expect(container.getElementsByClassName('hotel-card-txt--canceled')).toHaveLength(1);
    });
});
