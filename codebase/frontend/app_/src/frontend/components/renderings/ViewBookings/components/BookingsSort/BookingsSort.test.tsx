import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import BookingsSort from './BookingsSort';

jest.mock('react-select', () => ({ options, value, onChange, className }) => (
    <select className={className} data-tid='mock-select' onChange={e => onChange(e.target.value)} value={value}>
        {options.map(({ value, label }) => (
            <option key={value} value={value}>
                {label}
            </option>
        ))}
    </select>
));

const mockOnApplySortBy = jest.fn();
jest.mock('frontend/components/renderings/ViewBookings/components/BookingsSortMobile/BookingsSortMobile', () => ({
    __esModule: true,
    default: ({ onApplySortBy }) => {
        mockOnApplySortBy.mockImplementation(onApplySortBy);

        return <div data-tid='bookings-sort-mobile' />;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

const createStores = () => ({
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
        sortOptions: [
            {
                value: 'BOOKINGDATE',
                label: 'Booking date',
            },
            {
                value: 'DEPARTUREDATE',
                label: 'Departure date',
            },
        ],
        setSortBy: jest.fn(),
    } as any);

let mockStores = createStores();
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('BookingsSort', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
        mockUseMobileViewport = false;
    });

    it('should render', () => {
        const { container } = render(<BookingsSort {...mockProps} />);

        expect(screen.getByTestId('bookings-sort-desktop')).toBeInTheDocument();
        expect(screen.queryByTestId('bookings-sort-mobile')).not.toBeInTheDocument();
        expect(container.querySelector('.custom-select')).toBeInTheDocument();
    });

    it('should render mobile version', () => {
        mockUseMobileViewport = true;
        render(<BookingsSort {...mockProps} />);

        expect(screen.getByTestId('bookings-sort-mobile')).toBeInTheDocument();
        expect(screen.queryByTestId('bookings-sort-desktop')).not.toBeInTheDocument();
    });

    it('should call setSortBy on change', () => {
        render(<BookingsSort {...mockProps} />);

        fireEvent.change(screen.getByTestId('mock-select'), { target: { value: 'DEPARTUREDATE' } });

        expect(mockProps.setSortBy).toHaveBeenCalledWith('DEPARTUREDATE');
    });

    it('should call setSortBy from mobile sort', () => {
        mockUseMobileViewport = true;
        render(<BookingsSort {...mockProps} />);

        const mockOption = { value: 'DEPARTUREDATE', label: 'Departure date' };
        mockOnApplySortBy(mockOption);

        expect(mockProps.setSortBy).toHaveBeenCalledWith(mockOption);
    });
});
