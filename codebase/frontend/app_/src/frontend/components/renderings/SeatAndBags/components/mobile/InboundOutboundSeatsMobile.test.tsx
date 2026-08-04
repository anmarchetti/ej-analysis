import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeatMapRow } from 'models/data/ISeatMapStore';
import { mockSeatsAndBagsFields } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import InboundOutboundSeatsMobile from './InboundOutboundSeatsMobile';

const createProps = () => ({
    isInbound: false,
    fields: mockSeatsAndBagsFields,
    passengers: [] as IPassengerFlights[],
    rowsDeparture: [] as ISeatMapRow[],
    rowsReturn: [] as ISeatMapRow[],
});

let mockProps = createProps();
let mockStores;

jest.mock('frontend/components/common/ReadMoreButton', () => ({
    __esModule: true,
    default: () => <div data-tid='read-more-button' />,
}));

jest.mock('./SeatConfirmationMobile', () => ({
    __esModule: true,
    default: () => <div data-tid='seat-confirmation-mobile' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<InboundOutboundSeatsMobile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render SeatConfirmationMobile component if allAdultsAndInfants is empty', () => {
        render(<InboundOutboundSeatsMobile {...mockProps} />);

        expect(screen.queryByTestId('seat-confirmation-mobile')).not.toBeInTheDocument();
    });

    it('should render two SeatConfirmationMobile components if passengers length equal two', () => {
        const passenger: IPassengerFlights = {
            inboundPassenger: {} as IFlightPassenger,
            outboundPassenger: {} as IFlightPassenger,
        };
        mockProps.passengers = [passenger, passenger];
        render(<InboundOutboundSeatsMobile {...mockProps} />);

        expect(screen.queryAllByTestId('seat-confirmation-mobile')).toHaveLength(2);
    });

    it('should NOT render SeatConfirmationMobile component if kids is empty', () => {
        render(<InboundOutboundSeatsMobile {...mockProps} />);

        expect(screen.queryByTestId('seat-confirmation-mobile')).not.toBeInTheDocument();
    });

    it('should show read more button when passenger exceed 4 length', () => {
        mockProps.passengers = Array(5).fill({
            outboundPassenger: {},
            inboundPassenger: {},
        }) as any;
        render(<InboundOutboundSeatsMobile {...mockProps} />);

        expect(screen.queryByTestId('read-more-button')).toBeInTheDocument();
    });

    it('should NOT show read more button when passenger are up to 4', () => {
        mockProps.passengers = Array(4).fill({
            outboundPassenger: {},
            inboundPassenger: {},
        }) as any;
        render(<InboundOutboundSeatsMobile {...mockProps} />);

        expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();
    });
});
