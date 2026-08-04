import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockSeats, mockSelectedSeats } from 'frontend/__mocks__';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SeatsPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/SeatsPopupContent/SeatsPopupContent';

expect.extend(toHaveNoViolations);

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SeatsPopupContent />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        global.scrollTo = jest.fn();
    });

    it('should NOT render inbound seats when no present in package', () => {
        mockStores.viewBookingStore.booking.seatSelection = [
            mockSelectedSeats[1],
            {
                ...mockSelectedSeats[0],
                seats: [],
            },
        ];
        render(<SeatsPopupContent />);
        const { getAllByText } = within(screen.getByTestId('flight-FL123'));

        expect(getAllByText(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsNoSeatSelected)).toHaveLength(2);
    });

    it('should NOT render outbound seats when no present in package', () => {
        mockStores.viewBookingStore.booking.seatSelection = [
            mockSelectedSeats[0],
            {
                ...mockSelectedSeats[1],
                seats: [],
            },
        ];
        render(<SeatsPopupContent />);
        const { getAllByText } = within(screen.getByTestId('flight-FL124'));

        expect(getAllByText(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsNoSeatSelected)).toHaveLength(2);
    });

    it('should render outbound seats in the left container', () => {
        mockStores.viewBookingStore.booking.seatSelection = [mockSelectedSeats[0]];

        const { getByTestId, getAllByText, container } = render(<SeatsPopupContent />);

        expect(screen.getByTestId('flight-FL123')).toBeInTheDocument();
        expect(getByTestId('flight-direction-outbound')).toBeTruthy();
        expect(getAllByText(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsOutbound)).toHaveLength(1);
        expect(container.querySelectorAll('.icon--reflect-x')).toHaveLength(0);
    });

    it('should render inbound seats in the right container', () => {
        mockStores.viewBookingStore.booking.seatSelection = [mockSelectedSeats[1]];

        const { getByTestId, getAllByText, container } = render(<SeatsPopupContent />);

        expect(screen.getByTestId('flight-FL124')).toBeInTheDocument();
        expect(getByTestId('flight-direction-inbound')).toBeTruthy();
        expect(getAllByText(SitecoreDictionary.AmendSeatsConfirmationPopupLabelsInbound)).toHaveLength(1);
        expect(container.querySelector('.icon--reflect-x')).toBeInTheDocument();
    });

    it('should render seat decoration accordingly to seatPriceBand when set', () => {
        mockStores.viewBookingStore.booking.seatSelection = [
            {
                ...mockSelectedSeats[0],
                seats: [
                    ...mockSeats,
                    {
                        ...mockSeats[0],
                        priceBand: SeatType.ExtraLegroom,
                    },
                ],
            },
        ];
        const { container } = render(<SeatsPopupContent />);

        expect(container.querySelectorAll('.seat-confirmation__seat-number')).toHaveLength(3);
        expect(container.querySelectorAll('.seat-confirmation__seat-number--standard')).toHaveLength(1);
        expect(container.querySelectorAll('.seat-confirmation__seat-number--extra-legroom')).toHaveLength(1);
        expect(container.querySelectorAll('.seat-confirmation__seat-number--up-front')).toHaveLength(1);
    });

    it('should render standard seat decoration when seatPriceBand is not set', () => {
        mockStores.viewBookingStore.booking.seatSelection = mockSelectedSeats;

        const { container } = render(<SeatsPopupContent />);

        expect(container.querySelectorAll('.seat-confirmation__seat-number')).toHaveLength(4);
        expect(container.querySelectorAll('.seat-confirmation__seat-number--standard')).toHaveLength(2);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            mockStores.viewBookingStore.booking.seatSelection = mockSelectedSeats;

            const { container } = render(<SeatsPopupContent />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
