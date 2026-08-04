import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

import { createMockStores, mockBooking, mockFlightsRoutes, mockHotel, mockTransfer } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HotelBasket, { IHotelBasketProps } from './HotelBasket';

const createMockProps = (): IHotelBasketProps => ({
    unchangedLabel: 'Unchanged',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHotelDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/HotelDetails/HotelDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelDetailsProps(props);

        return <div data-tid='hotel-details' />;
    },
}));

const mockRatingsDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails', () => ({
    __esModule: true,
    default: props => {
        mockRatingsDetailsProps(props);

        return <div data-tid='ratings-details' />;
    },
}));

const mockDatesDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/DatesDetails/DatesDetails', () => ({
    __esModule: true,
    default: props => {
        mockDatesDetailsProps(props);

        return <div data-tid='dates-details' />;
    },
}));

const mockRoomDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RoomDetails/RoomDetails', () => ({
    __esModule: true,
    default: props => {
        mockRoomDetailsProps(props);

        return <div data-tid='room-details' />;
    },
}));

const mockBoardDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/BoardDetails/BoardDetails', () => ({
    __esModule: true,
    default: props => {
        mockBoardDetailsProps(props);

        return <div data-tid='board-details' />;
    },
}));

const mockTransferDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/TransferDetails/TransferDetails', () => ({
    __esModule: true,
    default: props => {
        mockTransferDetailsProps(props);

        return <div data-tid='transfer-details' />;
    },
}));

const mockFlightDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/FlightDetails/FlightDetails', () => ({
    __esModule: true,
    default: props => {
        mockFlightDetailsProps(props);

        return <div data-tid='flight-details' />;
    },
}));

const mockLuggageDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/LuggageDetails/LuggageDetails', () => ({
    __esModule: true,
    default: props => {
        mockLuggageDetailsProps(props);

        return <div data-tid='luggage-details' />;
    },
}));

const mockGetHotelChangeInfoResult = {
    transfer: mockTransfer,
    startDate: '2029-06-19',
    endDate: '2029-07-19',
    roomType: 'Double Room',
    boardType: 'All Inclusive',
    hotel: mockHotel,
    location: { city: 'Barcelona', country: 'Spain', region: 'package-region' },
    hasSelectedNewHotel: false,
    routes: mockFlightsRoutes,
};
jest.mock('frontend/components/renderings/AmendHotel/AmendHotel.utils', () => ({
    __esModule: true,
    getHotelChangeInfo: jest.fn().mockImplementation(() => mockGetHotelChangeInfoResult),
}));

describe('<HotelBasket />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('Should render the component', () => {
        render(<HotelBasket {...mockProps} />);

        expect(screen.getByTestId('hotel-basket')).toBeInTheDocument();

        expect(screen.getByTestId('hotel-details')).toBeInTheDocument();
        expect(mockHotelDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Hotel Example',
                location: { city: 'Barcelona', country: 'Spain', region: 'package-region' },
                dataTid: 'hotel-basket-hotel',
                className: 'row',
            }),
        );

        expect(screen.getByTestId('ratings-details')).toBeInTheDocument();
        expect(mockRatingsDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-ratings',
                className: 'ratings',
                ...mockBooking.hotel,
            }),
        );

        expect(screen.getByTestId('dates-details')).toBeInTheDocument();
        expect(mockDatesDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-dates',
                className: 'row',
                startDate: '2029-06-19',
                endDate: '2029-07-19',
            }),
        );

        expect(screen.getByTestId('room-details')).toBeInTheDocument();
        expect(mockRoomDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-room',
                className: 'row',
                roomType: mockGetHotelChangeInfoResult.roomType,
            }),
        );

        expect(screen.getByTestId('board-details')).toBeInTheDocument();
        expect(mockBoardDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-board',
                className: 'row',
                boardType: mockGetHotelChangeInfoResult.boardType,
            }),
        );

        expect(screen.getByTestId('transfer-details')).toBeInTheDocument();
        expect(mockTransferDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-transfer',
                className: 'row',
                transfer: mockTransfer,
            }),
        );
    });

    it('Should render unchanged details if hasSelectedNewHotel is true', () => {
        mockGetHotelChangeInfoResult.hasSelectedNewHotel = true;
        render(<HotelBasket {...mockProps} />);

        expect(screen.getByText(mockProps.unchangedLabel)).toBeInTheDocument();

        expect(screen.getByTestId('flight-details')).toBeInTheDocument();
        expect(mockFlightDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-flights',
                className: 'row',
                flightRoutes: mockGetHotelChangeInfoResult.routes,
            }),
        );

        expect(screen.getAllByTestId('dates-details')).toHaveLength(1);
        expect(mockDatesDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-dates',
                className: 'row',
                startDate: '2029-06-19',
                endDate: '2029-07-19',
                showOnlyDuration: true,
            }),
        );

        expect(screen.getByTestId('luggage-details')).toBeInTheDocument();
        expect(mockLuggageDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-luggage',
                booking: mockBooking,
            }),
        );

        expect(screen.getByTestId('hotel-basket-atol-protected')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.HotelDetailsLabelsAtolProtected)).toBeInTheDocument();
    });

    it('Should NOT render unchanged details if hasSelectedNewHotel is false', () => {
        mockGetHotelChangeInfoResult.hasSelectedNewHotel = false;
        render(<HotelBasket {...mockProps} />);

        expect(screen.queryByText(mockProps.unchangedLabel)).not.toBeInTheDocument();
        expect(screen.queryByTestId('flight-details')).not.toBeInTheDocument();
        expect(screen.queryByTestId('luggage-details')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hotel-basket-atol-protected')).not.toBeInTheDocument();
        expect(screen.getByTestId('dates-details')).toBeInTheDocument();
        expect(mockDatesDetailsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'hotel-basket-dates',
                className: 'row',
                startDate: '2029-06-19',
                endDate: '2029-07-19',
            }),
        );
    });

    it('Should render dataTid if provided', () => {
        mockProps.dataTid = 'data-tid';
        render(<HotelBasket {...mockProps} />);

        expect(screen.getByTestId('data-tid')).toBeInTheDocument();
    });

    it('Should return null if no booking', () => {
        mockStores.viewBookingStore.booking = null;

        render(<HotelBasket {...mockProps} />);

        expect(screen.queryByTestId('hotel-basket')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HotelBasket {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
