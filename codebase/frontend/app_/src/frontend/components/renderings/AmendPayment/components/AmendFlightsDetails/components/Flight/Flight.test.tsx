import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockOutboundFlight } from 'frontend/__mocks__';

import Flight, { IFlightProps } from './Flight';

expect.extend(toHaveNoViolations);

let mockProps: IFlightProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    formatDateL10n: date => date,
}));

describe('<Flight />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            route: mockOutboundFlight,
        };
    });

    it('Should render component', () => {
        render(<Flight {...mockProps} />);

        expect(screen.getByTestId('outbound-flight')).toBeInTheDocument();
        expect(screen.getByTestId('flight-date')).toBeInTheDocument();
        expect(screen.getByTestId('flight-number')).toBeInTheDocument();
        expect(screen.getByTestId('dep-time')).toBeInTheDocument();
        expect(screen.getByTestId('dep-location')).toBeInTheDocument();
        expect(screen.getAllByTestId('flight-icon').length).toBe(2);
        expect(screen.getAllByTestId('arr-time').length).toBe(2);
        expect(screen.getByTestId('mobile-arr-time')).toBeInTheDocument();
        expect(screen.getAllByTestId('arr-location').length).toBe(2);
        expect(screen.getByTestId('mobile-arr-location')).toBeInTheDocument();
        expect(screen.getAllByText('2023-05-11T12:10:00+00:00').length).toBe(2);
        expect(screen.getAllByText('2023-05-11T16:25:00+00:00').length).toBe(2);
        expect(screen.getByTestId('flights-info')).toBeInTheDocument();
        expect(screen.getByText('EZY6453')).toBeInTheDocument();
        expect(screen.getByText('London Gatwick')).toBeInTheDocument();
        expect(screen.getAllByText('Lanzarote').length).toBe(2);
        expect(screen.getByText('(LGW)')).toBeInTheDocument();
        expect(screen.getAllByText('(ACE)').length).toBe(2);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<Flight {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
