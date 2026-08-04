import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { getRouteByDirection } from 'frontend/utils/airports.utils';

import FlightPopupContent from './FlightPopupContent';

expect.extend(toHaveNoViolations);

let mockStore;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

describe('FlightPopupContent', () => {
    beforeEach(() => {
        mockStore = createMockStores();
        mockStore.viewBookingStore.booking.package.transport.routes = [
            { ...mockOutboundFlight },
            { ...mockInboundFlight },
        ];
    });

    it('renders null if no data', () => {
        mockStore.viewBookingStore.booking = null;
        const { container } = render(<FlightPopupContent />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders flights', () => {
        render(<FlightPopupContent />);
        expect(screen.getByText('London Gatwick (LGW) - Lanzarote (ACE)'));
        expect(screen.getByText('Lanzarote (ACE) - London Gatwick (LGW)'));
    });

    it('render only outbould flight', () => {
        const transport = mockStore.viewBookingStore.booking.package.transport;
        const { outbound } = getRouteByDirection(transport.routes);

        transport.routes = [outbound];

        render(<FlightPopupContent />);

        expect(screen.getByTestId('flight-outbound')).toBeInTheDocument();
        expect(screen.queryByTestId('flight-inbound')).not.toBeInTheDocument();
    });

    it('render only inbound flight', () => {
        const transport = mockStore.viewBookingStore.booking.package.transport;
        const { inbound } = getRouteByDirection(transport.routes);

        transport.routes = [inbound];

        render(<FlightPopupContent />);

        expect(screen.queryByTestId('flight-outbound')).not.toBeInTheDocument();
        expect(screen.getByTestId('flight-inbound')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<FlightPopupContent />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
