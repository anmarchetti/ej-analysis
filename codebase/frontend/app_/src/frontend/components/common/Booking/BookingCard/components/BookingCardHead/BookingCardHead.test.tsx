import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__/booking';

import { BookingCardHead, IBookingCardDetailsProps } from './BookingCardHead';

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: () => <div data-tid='link' />,
}));

jest.mock('frontend/components/renderings/ViewBookings/components/HolidayTheme', () => ({
    __esModule: true,
    default: () => <div data-tid='holiday-theme' />,
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: () => <div data-tid='star-rating' />,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='trip-advisor-info' />,
}));

jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: () => <div data-tid='eco-certified-pill' />,
}));

const createProps = (): IBookingCardDetailsProps => ({
    isScreenExtraSmall: false,
    isEcoCertifiedEnabledOnBookingListPage: true,
    booking: mockBooking,
    isPaymentReminderVisible: jest.fn().mockReturnValue(false),
    getPhrase: jest.fn(),
});

let mockProps;

describe('<BookingCardHead />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render with upcoming holidays', () => {
        render(<BookingCardHead {...mockProps} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getAllByTestId('holiday-theme')).toHaveLength(1);
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('trip-advisor-info')).toBeInTheDocument();
        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
        expect(screen.getByTestId('booking-reference')).toBeInTheDocument();
    });

    it('should NOT render HolidayTheme when hotelType is null', () => {
        mockProps.booking.package.accom.hotel.type = null;
        render(<BookingCardHead {...mockProps} />);

        expect(screen.queryByTestId('holiday-theme')).not.toBeInTheDocument();
    });

    it('should NOT render TripadvisorInfo when isTAInfoDisplayed is false', () => {
        mockProps.booking.package.accom.hotel.rating = null;
        mockProps.booking.package.accom.hotel.numberOfReviews = null;
        render(<BookingCardHead {...mockProps} />);

        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
    });

    it('should NOT render EcoCertifiedPill when isEcoCertifiedPillDisplayed is false', () => {
        mockProps.isEcoCertifiedEnabledOnBookingListPage = false;
        render(<BookingCardHead {...mockProps} />);

        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });
});
