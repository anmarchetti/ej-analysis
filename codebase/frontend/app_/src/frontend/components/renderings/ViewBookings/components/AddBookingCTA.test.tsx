import React from 'react';
import { render, screen } from '@testing-library/react';

import AddBookingCTA from './AddBookingCTA';

const resetMocks = () => ({
    toggleAddBooking: jest.fn(),
    fields: { AddBookingCTAText: { value: '' } },
    getPhrase: jest.fn(),
});

let mocks;

describe('<AddBookingCTA />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Rendering', () => {
        it('should be render', () => {
            render(<AddBookingCTA {...mocks} />);
            expect(screen.queryByTestId('add-booking-cta')).toBeInTheDocument();
        });
    });
});
