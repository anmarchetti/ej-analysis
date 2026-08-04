import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { mockSeatsAndBagsFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import InboundOutboundSeatsDesktop from './InboundOutboundSeatsDesktop';

jest.mock('./SeatConfirmationDesktop', () => ({
    __esModule: true,
    default: () => <div data-tid='seat-confirmation-desktop' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    fields: mockSeatsAndBagsFields,
    passengers: [
        {
            outboundPassenger: {} as IFlightPassenger,
            inboundPassenger: {} as IFlightPassenger,
        },
        {
            outboundPassenger: {} as IFlightPassenger,
            inboundPassenger: {} as IFlightPassenger,
        },
        {
            outboundPassenger: {} as IFlightPassenger,
            inboundPassenger: {} as IFlightPassenger,
        },
    ] as IPassengerFlights[],
});

let mockProps;
let mockStores;

describe('<InboundOutboundSeatsDesktop />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render component', () => {
        const { container } = render(<InboundOutboundSeatsDesktop {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should render three instances of SeatConfirmationDesktop component as allAdultsAndInfants equal 1 and kids equal 2', () => {
        render(<InboundOutboundSeatsDesktop {...mockProps} />);

        expect(screen.queryAllByTestId('seat-confirmation-desktop')).toHaveLength(3);
    });

    it('should render zero instances of SeatConfirmationDesktop component as passengers equal 0', () => {
        mockProps.passengers = [];
        render(<InboundOutboundSeatsDesktop {...mockProps} />);

        expect(screen.queryAllByTestId('seat-confirmation-desktop')).toHaveLength(0);
    });
});
