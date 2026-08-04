import { mockFlightsRoutes, mockGuests, mockOutboundFlight, mockSelectedSeats } from 'frontend/__mocks__';

import { getSelectedSeats } from './AmendDatesSummarySeats.utils';

const getMockRoutes = () => [
    { ...mockFlightsRoutes[0], fltNo: `${mockOutboundFlight.car}${mockSelectedSeats[0].flightNumber}` },
    { ...mockFlightsRoutes[1], fltNo: `${mockOutboundFlight.car}${mockSelectedSeats[1].flightNumber}` },
];

let mockRoutes;

describe('AmendDatesSummarySeats.utils', () => {
    beforeEach(() => {
        mockRoutes = getMockRoutes();
    });

    describe('getSelectedSeats', () => {
        it('Return outbound and inbound seats', () => {
            const { outboundSeats, inboundSeats } = getSelectedSeats(mockRoutes, mockGuests, mockSelectedSeats);

            expect(outboundSeats.length).toBe(1);
            expect(inboundSeats.length).toBe(1);
            expect(outboundSeats[0].seatNumber).toBe('15C');
        });

        it('Return empty seats', () => {
            const { outboundSeats, inboundSeats } = getSelectedSeats([], mockGuests, mockSelectedSeats);

            expect(outboundSeats.length).toBe(0);
            expect(inboundSeats.length).toBe(0);
        });
    });
});
