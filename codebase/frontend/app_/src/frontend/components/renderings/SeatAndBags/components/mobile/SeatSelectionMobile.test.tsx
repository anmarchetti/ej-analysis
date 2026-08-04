import React from 'react';
import { render, screen } from '@testing-library/react';

import SeatSelectionMobile from './SeatSelectionMobile';

describe('<SeatSelectionMobile />', () => {
    const createProps = () => ({
        text: 'text1',
        seatColor: 'green' as string | null,
        seatNumber: '1A' as string | null,
    });

    let mockProps;

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<SeatSelectionMobile {...mockProps} />);

        expect(screen.getByTestId('seat-selection-container')).toBeInTheDocument();
    });

    it('should NOT find seatNumber displayed if seatNumber is null', () => {
        mockProps.seatNumber = null;
        render(<SeatSelectionMobile {...mockProps} />);

        expect(screen.queryByTestId('seat-selection-seat-number')).not.toBeInTheDocument();
    });

    it('should find props text and seatNumber', () => {
        render(<SeatSelectionMobile {...mockProps} />);

        expect(screen.queryByTestId('seat-selection-container')).toHaveTextContent(mockProps.text);
        expect(screen.queryByTestId('seat-selection-seat-number')).toHaveTextContent(mockProps.seatNumber);
    });
});
