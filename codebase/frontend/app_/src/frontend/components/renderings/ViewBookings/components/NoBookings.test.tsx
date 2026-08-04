import React from 'react';
import { render, screen } from '@testing-library/react';

import NoBookings from './NoBookings';

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: () => <button data-tid='add-booking-button' />,
}));

const resetMocks = () => ({
    getPhrase: jest.fn(),
    rendering: {},
    fields: {
        NoBookingsTitle: { value: '' },
        NoBookingsDescription: { value: '' },
        IsNoBookingsButtonHidden: { value: '' },
    },
    onAddBooking: jest.fn(),
});

let mocks;

describe('<NoBookings />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Rendering', () => {
        it('should be render', () => {
            render(<NoBookings {...mocks} />);
            expect(screen.queryByTestId('no-bookings-wrapper')).toBeInTheDocument();
        });

        it('should be render Title and button', () => {
            mocks.fields.NoBookingsTitle.value = 'TEST';
            mocks.fields.NoBookingsDescription = undefined;
            render(<NoBookings {...mocks} />);
            expect(screen.queryByTestId('no-bookings-wrapper')).toBeInTheDocument();
            expect(screen.queryByTestId('no-bookings-title')).toBeInTheDocument();
            expect(screen.queryByTestId('no-bookings-description')).not.toBeInTheDocument();
            expect(screen.queryByTestId('add-booking-button')).toBeInTheDocument();
        });

        it('should be render description', () => {
            mocks.fields.NoBookingsDescription.value = 'TEST';
            mocks.fields.IsNoBookingsButtonHidden.value = 'TEST';
            render(<NoBookings {...mocks} />);
            expect(screen.queryByTestId('no-bookings-wrapper')).toBeInTheDocument();
            expect(screen.queryByTestId('no-bookings-title')).not.toBeInTheDocument();
            expect(screen.queryByTestId('no-bookings-description')).toBeInTheDocument();
            expect(screen.queryByTestId('add-booking-button')).not.toBeInTheDocument();
        });
    });
});
