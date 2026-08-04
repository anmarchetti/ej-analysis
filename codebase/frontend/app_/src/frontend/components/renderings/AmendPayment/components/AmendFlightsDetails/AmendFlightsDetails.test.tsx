import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockInboundFlight, mockOutboundFlight, mockValidatedFlights } from 'frontend/__mocks__';
import { getRouteByDirection } from 'frontend/utils/airports.utils';

import AmendFlightsDetails from './AmendFlightsDetails';

expect.extend(toHaveNoViolations);

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFlightProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendFlightsDetails/components/Flight/Flight',
    () => ({
        __esModule: true,
        default: props => {
            mockFlightProps(props);

            return <div data-tid='flight' />;
        },
    }),
);

const mockFlightErrataProps = jest.fn();
jest.mock('frontend/components/common/ErrataInfo/FlightErrata', () => ({
    __esModule: true,
    default: props => {
        mockFlightErrataProps(props);

        return <div data-tid='flight-errata' />;
    },
}));

jest.mock('frontend/utils/airports.utils');

describe('<AmendFlightsDetails />', () => {
    beforeAll(() => {
        jest.mocked(getRouteByDirection).mockReturnValue({ outbound: mockOutboundFlight, inbound: mockInboundFlight });
    });

    beforeEach(() => {
        mockStores = createMockStores({
            amendFlightsStore: {
                selectedFlight: mockValidatedFlights.transports[0],
            },
        });
    });

    it('Should render component', () => {
        render(<AmendFlightsDetails />);

        expect(screen.getByTestId('amend-flights-card')).toBeInTheDocument();
        expect(screen.getByTestId('flight-errata')).toBeInTheDocument();
        expect(screen.getByTestId('flights-details')).toBeInTheDocument();
        expect(screen.getAllByTestId('flight').length).toBe(2);
        expect(mockFlightErrataProps).toHaveBeenCalledWith(
            expect.objectContaining({ errataFlightInfo: mockValidatedFlights.transports[0].errataFlightInfo }),
        );
    });

    it('Should NOT render errata component when it not included in selected flights', () => {
        mockStores.amendFlightsStore.selectedFlight.errataFlightInfo = undefined;

        render(<AmendFlightsDetails />);

        expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
    });

    it('Should render nothing if no selected flight', () => {
        mockStores.amendFlightsStore.selectedFlight = undefined;

        const { container } = render(<AmendFlightsDetails />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render neither outbound nor inbound flights', () => {
        jest.mocked(getRouteByDirection).mockReturnValueOnce({ inbound: undefined, outbound: undefined });
        render(<AmendFlightsDetails />);

        expect(screen.queryByTestId('flight')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendFlightsDetails />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
