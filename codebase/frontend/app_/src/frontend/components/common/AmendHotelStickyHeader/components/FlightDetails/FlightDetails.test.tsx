import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockFlightsRoutes } from 'frontend/__mocks__';

import FlightDetails, { IFlightDetailsProps } from './FlightDetails';

const createMockProps = (): IFlightDetailsProps => ({
    flightRoutes: mockFlightsRoutes,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/DepartureFilled', () => props => (
    <div className={props.className} data-tid='departure-filled' />
));
jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn((date: string) => date),
}));

describe('<FlightDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<FlightDetails {...mockProps} />);

        expect(screen.getByTestId('flight-details')).toBeInTheDocument();
        const [outboundFlightIcon, inboundFlightIcon] = screen.getAllByTestId('departure-filled');
        expect(outboundFlightIcon).toBeInTheDocument();
        expect(inboundFlightIcon).toHaveClass('icon--reflect-x');
        expect(screen.getByText(mockFlightsRoutes[0].depName)).toBeInTheDocument();
        expect(screen.getByText(mockFlightsRoutes[1].depName)).toBeInTheDocument();
        expect(screen.getByText(mockFlightsRoutes[0].depDate)).toBeInTheDocument();
        expect(screen.getByText(mockFlightsRoutes[1].depDate)).toBeInTheDocument();
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<FlightDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        const { container } = render(<FlightDetails {...mockProps} />);

        expect(container.querySelector('.test-class')).toBeInTheDocument();
    });
});
