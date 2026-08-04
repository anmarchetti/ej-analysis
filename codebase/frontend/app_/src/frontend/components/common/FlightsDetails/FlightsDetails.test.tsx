import React from 'react';
import { render } from '@testing-library/react';

import FlightsDetails from './FlightsDetails';

const createProps = () => ({
    routes: [{ direction: 'outbound' }, { direction: 'inbound' }],
    shouldShowTerminal: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

const mockFlight = jest.fn();

jest.mock('frontend/components/common/FlightsDetails/Flight/Flight', () => ({
    __esModule: true,
    default: props => {
        mockFlight(props);

        return <div data-tid='flight' />;
    },
}));

describe('<FlightsDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render 2 Flights', () => {
        const { getAllByTestId } = render(<FlightsDetails {...mockProps} />);

        expect(getAllByTestId('flight').length).toBe(2);
    });

    it('should NOT render Flights when inbound and outbound not provided', () => {
        mockProps.routes = [];
        const { queryByTestId } = render(<FlightsDetails {...mockProps} />);

        expect(queryByTestId('flight')).not.toBeInTheDocument();
    });

    it('should call Flight with correct props', () => {
        render(<FlightsDetails {...mockProps} />);

        expect(mockFlight).toHaveBeenCalledWith({ route: mockProps.routes[0], shouldShowTerminal: false });
        expect(mockFlight).toHaveBeenCalledWith({ route: mockProps.routes[1], shouldShowTerminal: false });
    });

    it('should call Flight with shouldShowTerminal true when prop passed true and has terminal info', () => {
        mockProps.shouldShowTerminal = true;
        mockProps.routes[0].arrTerminal = 'Terminal 1';
        render(<FlightsDetails {...mockProps} />);

        expect(mockFlight).toHaveBeenCalledWith({ route: mockProps.routes[0], shouldShowTerminal: true });
    });
});
