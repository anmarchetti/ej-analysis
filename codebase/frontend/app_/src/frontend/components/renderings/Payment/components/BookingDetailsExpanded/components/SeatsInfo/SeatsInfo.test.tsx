import React from 'react';
import { render, screen } from '@testing-library/react';

import { getSeatBorderColor } from 'frontend/utils/seatAndBags.utils';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SeatsInfo, { ISeatsInfoProps } from './SeatsInfo';

const createProps = (): ISeatsInfoProps => ({
    flag: DestinationRouteFlag.Departure,
    seats: [],
});

const createStores = () => ({
    bookingStore: {
        outboundFlight: { isExt: true },
        inboundFlight: { isExt: true },
    },
    seatMapStore: {
        isSeatMapFlowEnabled: true,
        haveOutboundSelectedSeats: false,
        haveInboundSelectedSeats: false,
    },
    layoutStore: {
        isPaymentPage: true,
        getPhrase: jest.fn(p => p),
    },
    flightsPassengersStore: {
        passengersByQueue: [{ outboundPassenger: { seat: { seatNumber: '1A', priceBand: 'High' } } }],
    },
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSeatSelectionDesktopComponent = jest.fn();

jest.mock('frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockSeatSelectionDesktopComponent(props);

        return <div data-tid='seat-selection-desktop'>Seat Selection Desktop</div>;
    },
}));

describe('<SeatsInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render seats from passengersByQueue when seat map flow is enabled and passengersByQueue is not empty', () => {
        mockStores.seatMapStore.haveOutboundSelectedSeats = true;
        mockStores.seatMapStore.haveInboundSelectedSeats = true;

        mockStores.flightsPassengersStore.passengersByQueue = [
            {
                outboundPassenger: {
                    seat: {
                        priceBand: SeatType.Standard,
                        seatNumber: '10A',
                        price: 100,
                        products: [],
                    },
                },
            },
        ];

        render(<SeatsInfo {...mockProps} />);

        expect(mockSeatSelectionDesktopComponent).toHaveBeenCalledWith({
            seatNumber: '10A',
            text: SeatType.Standard,
            color: getSeatBorderColor(SeatType.Standard),
        });
    });

    it('should always render seats from seats prop if present', () => {
        mockStores.seatMapStore.haveOutboundSelectedSeats = true;
        mockStores.seatMapStore.haveInboundSelectedSeats = true;

        mockStores.seatMapStore.passengersByQueue = [
            {
                outboundPassenger: {
                    seat: {
                        priceBand: SeatType.Standard,
                        seatNumber: '10A',
                        price: 100,
                        products: [],
                    },
                },
            },
        ];

        mockProps.seats = [
            {
                priceBand: SeatType.UpFront,
                seatNumber: '15B',
                paxIndex: 1,
            },
        ];

        render(<SeatsInfo {...mockProps} />);

        expect(screen.getByTestId('seats-info')).toBeInTheDocument();
        expect(screen.queryByTestId('passengers-info')).not.toBeInTheDocument();

        expect(mockSeatSelectionDesktopComponent).toHaveBeenCalledWith({
            seatNumber: '15B',
            text: SeatType.UpFront,
            color: getSeatBorderColor(SeatType.UpFront),
        });
    });

    it('should alwars render "no seat selected" if no outboundSeats or inboundSeats', () => {
        mockStores.flightsPassengersStore.passengersByQueue = [
            {
                outboundPassenger: {
                    seat: {
                        priceBand: SeatType.Standard,
                        seatNumber: '10A',
                        price: 100,
                        products: [],
                    },
                },
            },
        ];

        render(<SeatsInfo {...mockProps} />);

        expect(mockSeatSelectionDesktopComponent).toBeCalledWith({
            text: SitecoreDictionary.GlobalsLabelsNoSeatSelected,
        });
        expect(screen.queryByTestId('passengers-info')).not.toBeInTheDocument();
    });

    it('should render provided seats when seatSelection is passed', () => {
        mockStores.flightsPassengersStore.passengersByQueue = [];
        mockProps.seats = [
            {
                priceBand: SeatType.UpFront,
                seatNumber: '15B',
                paxIndex: 1,
            },
        ];

        render(<SeatsInfo {...mockProps} />);

        expect(mockSeatSelectionDesktopComponent).toHaveBeenCalledWith({
            seatNumber: '15B',
            text: SeatType.UpFront,
            color: getSeatBorderColor(SeatType.UpFront),
        });
    });

    it('should show "no seat selected" when no passangers and seats are present', () => {
        mockStores.flightsPassengersStore.passengersByQueue = [];

        render(<SeatsInfo {...mockProps} />);

        expect(screen.getByTestId('seat-selection-desktop')).toBeInTheDocument();

        expect(mockSeatSelectionDesktopComponent).toBeCalledWith({
            text: SitecoreDictionary.GlobalsLabelsNoSeatSelected,
        });
    });
});
