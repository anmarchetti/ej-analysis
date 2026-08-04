import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockFlightsRoutes } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightsBasket from './FlightsBasket';

expect.extend(toHaveNoViolations);

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<FlightsBasket />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendFlightsStore: {
                bookingRoutes: {},
                selectedFlight: {
                    routes: mockFlightsRoutes,
                } as any,
            },
        });
    });

    it('Should render correctly on desktop', () => {
        render(<FlightsBasket />);

        expect(screen.getByText('London Gatwick (LGW)')).toBeInTheDocument();
        expect(screen.getByText('Thu 11th May - 12:10')).toBeInTheDocument();
        expect(screen.getByText('Lanzarote (ACE)')).toBeInTheDocument();
        expect(screen.getByText('Thu 18th May - 20:40')).toBeInTheDocument();
    });

    it('Should render correctly on mobile', () => {
        mockUseMobileViewport = true;
        render(<FlightsBasket />);

        expect(screen.getByText('LGW')).toBeInTheDocument();
        expect(screen.getByText('Thu 11th May 12:10')).toBeInTheDocument();
        expect(screen.getByText('ACE')).toBeInTheDocument();
        expect(screen.getByText('Thu 18th May 20:40')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsNumberOfNights)).toBeInTheDocument();
    });

    it('Should render selected flight absent', () => {
        mockUseMobileViewport = false;
        mockStores.amendFlightsStore.bookingRoutes = [...mockStores.amendFlightsStore.selectedFlight.routes];
        mockStores.amendFlightsStore.selectedFlight = null;
        render(<FlightsBasket />);

        expect(screen.getByText('AmendFlights.Labels.CurrentFlights')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<FlightsBasket />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render aria-label', () => {
            render(<FlightsBasket />);

            expect(screen.getByTestId('amend-flight-basket')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AmendFlightsLabelsCurrentFlights,
            );
        });
    });
});
