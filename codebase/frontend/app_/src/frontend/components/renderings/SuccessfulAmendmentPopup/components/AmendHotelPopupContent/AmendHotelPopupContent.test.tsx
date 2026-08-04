import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__/createMockStores';

import AmendHotelPopupContent from './AmendHotelPopupContent';

expect.extend(toHaveNoViolations);

let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

jest.mock('frontend/components/icons-new/HotelLined', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-icon' />,
}));

describe('AmendHotelPopupContent', () => {
    beforeEach(() => {
        mockStore = createMockStores();
    });

    it('renders null if no booking', () => {
        mockStore.viewBookingStore.booking = null;

        const { container } = render(<AmendHotelPopupContent />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should renders hotel change content', () => {
        mockStore.viewBookingStore.booking.hotel.name = 'Hotel Name';

        render(<AmendHotelPopupContent />);

        expect(screen.getByTestId('successful-amendment-hotel-popup-content')).toHaveClass('amendHotelContainer');
        expect(screen.getByTestId('successful-amendment-hotel')).toHaveClass('d-flex align-items-center');
        expect(screen.getByTestId('amend-hotel-popup-content-title')).toHaveTextContent('Hotel Name');
        expect(screen.getByTestId('hotel-icon')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendHotelPopupContent />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
