import React from 'react';
import { render, screen } from '@testing-library/react';

import {
    createMockStores,
    mockLuggageBenefit,
    mockOutboundFlight,
    mockPassengersList,
    mockSeats,
} from 'frontend/__mocks__';
import { SeatColor } from 'models/enum/SeatColor';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendDatesSummarySeatsDirection from './SeatsSummary';

const createProps = () => ({
    chosenSeats: mockSeats,
    passengers: mockPassengersList,
    fallbackBenefit: mockLuggageBenefit,
    title: 'title',
    route: mockOutboundFlight,
    fields: 'fields',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCabinBagsInfoProps = jest.fn();
jest.mock('frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo', () => ({
    __esModule: true,
    default: props => {
        mockCabinBagsInfoProps(props);

        return <div data-tid='cabin-bags-info'>SeatBag</div>;
    },
}));

const mockSeatSelectionDesktopProps = jest.fn();
jest.mock('frontend/components/renderings/SeatAndBags/components/desktop/SeatSelectionDesktop', () => ({
    __esModule: true,
    default: props => {
        mockSeatSelectionDesktopProps(props);

        return <div data-tid='seat-selection-desktop'>SeatSelectionDesktop</div>;
    },
}));

describe('<AmendDatesSummarySeatsDirection />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                extraLuggage: {
                    LCBCount: 0,
                },
            },
        });
        mockProps = createProps();
    });

    it('Render passed props', () => {
        render(<AmendDatesSummarySeatsDirection {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText(`${mockOutboundFlight.depPt} - ${mockOutboundFlight.arrPt}`)).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.GlobalsLabelsNoSeatSelected)).not.toBeInTheDocument();
        expect(screen.getByTestId('cabin-bags-info')).toBeInTheDocument();
        expect(mockCabinBagsInfoProps).toHaveBeenCalledWith(
            expect.objectContaining({
                LCBCount: 0,
                bagTypeClassName: 'cabinBags',
                containerClassName: 'cabinBagsWrapper',
                fields: 'fields',
                guestsAmountByType: { adults: 1, children: 2, infants: 1 },
                iconClassName: 'icon',
            }),
        );
        expect(screen.getAllByTestId('seat-selection-desktop').length).toBe(2);
        expect(mockSeatSelectionDesktopProps).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockSeats[0].priceBand,
                color: SeatColor.Orange,
                seatNumber: mockSeats[0].seatNumber,
                hasSecondaryStyle: undefined,
                isPricesHidden: true,
            }),
        );
        expect(mockSeatSelectionDesktopProps).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockSeats[1].priceBand,
                color: SeatColor.Blue,
                seatNumber: mockSeats[1].seatNumber,
                hasSecondaryStyle: undefined,
                isPricesHidden: true,
            }),
        );
    });

    it('Render no seats selected message when no seats selected', () => {
        mockProps.chosenSeats = [];
        render(<AmendDatesSummarySeatsDirection {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsNoSeatSelected)).toBeInTheDocument();
        expect(screen.queryAllByTestId('seat-selection-desktop').length).toBe(0);
    });

    it('Should NOT render route data if it is not passed', () => {
        mockProps.route = undefined;
        render(<AmendDatesSummarySeatsDirection {...mockProps} />);

        expect(screen.queryByTestId('airport-details')).not.toBeInTheDocument();
    });
});
