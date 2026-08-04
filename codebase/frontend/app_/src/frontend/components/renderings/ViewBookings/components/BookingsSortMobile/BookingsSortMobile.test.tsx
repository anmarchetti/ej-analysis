import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import BookingsSortMobile from './BookingsSortMobile';

// Mock Drawer component
jest.mock('frontend/components/common/Drawer', () => ({ children, open }) => (
    <div data-testid='drawer' className={open ? 'open' : 'closed'}>
        {children}
    </div>
));

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        getPhrase: jest.fn(),
    },
});

const createMockProps = () =>
    ({
        sortBy: {
            value: 'BOOKINGDATE',
            label: 'Booking date',
        },
        options: [
            {
                value: 'BOOKINGDATE',
                label: 'Booking date',
            },
            {
                value: 'DEPARTUREDATE',
                label: 'Departure date',
            },
        ],
        onApplySortBy: jest.fn(),
    } as any);

let mockStores = createStores();
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('BookingsSortMobile', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
    });

    it('should render', () => {
        render(<BookingsSortMobile {...mockProps} />);

        expect(screen.queryByTestId('bookings-sort-mobile')).toBeInTheDocument();
        expect(screen.getByText('Booking date')).toBeInTheDocument();
        expect(screen.getByText('Departure date')).toBeInTheDocument();
    });

    it('should select a new option when clicking it', () => {
        const { container } = render(<BookingsSortMobile {...mockProps} />);

        fireEvent.click(screen.getAllByRole('button')[0]);

        fireEvent.click(screen.getByText('Departure date'));

        fireEvent.click(container.querySelectorAll('.drawer__actions button')[1]);

        expect(mockProps.onApplySortBy).toHaveBeenCalledWith({
            value: 'DEPARTUREDATE',
            label: 'Departure date',
        });
    });

    it('should not apply changes when clicking cancel', () => {
        const { container } = render(<BookingsSortMobile {...mockProps} />);

        fireEvent.click(screen.getAllByRole('button')[0]);

        fireEvent.click(screen.getByText('Departure date'));

        fireEvent.click(container.querySelectorAll('.drawer__actions button')[0]);

        expect(mockProps.onApplySortBy).not.toHaveBeenCalled();

        // Reopen drawer
        fireEvent.click(screen.getAllByRole('button')[0]);

        expect(screen.getByText('Departure date')).not.toHaveClass('active');

        expect(screen.getByText('Booking date')).toHaveClass('active');
    });
});
