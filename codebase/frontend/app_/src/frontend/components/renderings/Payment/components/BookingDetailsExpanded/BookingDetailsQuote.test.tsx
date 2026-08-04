import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockFlightsRoutes, mockTransfer } from 'frontend/__mocks__';
import { mockExportDetailsFields } from 'frontend/__mocks__/exportHoliday';
import { IBoardType, IHotel, IRoomType } from 'models/data/IHotel';
import { DestinationRouteFlag } from 'models/enum/DestinationRouteFlag';
import { SeatType } from 'models/enum/SeatType';

import BookingDetailsQuote, { IBookingDetailsQuoteProps } from './BookingDetailsQuote';

const mockHotelInfo = jest.fn();
jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/HotelInfo/HotelInfo',
    () => ({
        __esModule: true,
        default: props => {
            mockHotelInfo(props);

            return <div data-tid='hotel-info' />;
        },
    }),
);

const mockFlightInfo = jest.fn();
jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/FlightsInfo/FlightsInfo',
    () => ({
        __esModule: true,
        default: props => {
            mockFlightInfo(props);

            return <div data-tid='flights-info' />;
        },
    }),
);

const mockLuggageInfo = jest.fn();
jest.mock('frontend/components/common/Booking/LuggageInfo/LuggageInfo', () => ({
    __esModule: true,
    default: props => {
        mockLuggageInfo(props);

        return <div data-tid='luggage-info' />;
    },
}));

const mockCabinInfo = jest.fn();
jest.mock('frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo', () => ({
    __esModule: true,
    default: props => {
        mockCabinInfo(props);

        return <div data-tid='cabin-bags-info' />;
    },
}));

const mockTransferInfo = jest.fn();
jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/TransferInfo/TransferInfo',
    () => ({
        __esModule: true,
        default: props => {
            mockTransferInfo(props);

            return <div data-tid='transfer-info' />;
        },
    }),
);

jest.mock('frontend/utils/guestsValidation', () => ({
    getNumberOfGuestsByCategory: jest.fn().mockReturnValue('1 adult, 2 children'),
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    generateExtraLuggageFullInfo: jest.fn().mockReturnValue('extra luggage info'),
    getDefaultBagsOneDirection: jest.fn().mockReturnValue('default bags'),
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <div>{field?.value}</div>,
}));

const createProps = (): IBookingDetailsQuoteProps => ({
    board: null,
    guestsAmountByType: {
        adults: 2,
        children: 1,
        infants: 1,
    },
    fields: mockExportDetailsFields,
    hotel: null,
    luggageItems: [],
    isShown: true,
    rooms: [],
    transfer: mockTransfer,
    transport: {
        routes: [mockFlightsRoutes[0], mockFlightsRoutes[1]],
    },
});

const mockSeat = {
    price: 'price',
    seatNumber: 'seatNumber',
    priceBand: SeatType.ExtraLegroom,
    products: [],
};

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn((p: string) => p),
        sportEquipmentCategoryCodes: ['sportEquipmentCategoryCodes'],
        holdLuggageCategoryCodes: ['holdLuggageCategoryCodes'],
    },
    bookingStore: {
        extraLuggage: { LCBCount: 2 },
    },
    flightsPassengersStore: {
        passengersByQueue: [
            {
                outboundPassenger: {
                    passengerId: 'passengerId',
                    seat: mockSeat,
                    firstName: 'firstName',
                    lastName: 'lastName',
                    title: 'title',
                    type: 'type',
                    withInfant: false,
                    age: 20,
                    index: 'index',
                    isLead: true,
                    notBornYet: false,
                    sex: 'sex',
                    dateOfBirth: 'dateOfBirth',
                },
                inboundPassenger: {
                    passengerId: 'passengerId',
                    firstName: 'firstName',
                    lastName: 'lastName',
                    title: 'title',
                    type: 'type',
                    withInfant: false,
                    age: 20,
                    index: 'index',
                    isLead: true,
                    notBornYet: false,
                    sex: 'sex',
                    dateOfBirth: 'dateOfBirth',
                },
            },
        ],
    },
});

let props: IBookingDetailsQuoteProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingDetailsQuote />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render HotelInfo component', () => {
        props.hotel = { name: 'Hotel XYZ' } as IHotel;
        props.rooms = [{ name: 'Test name' }] as IRoomType[];

        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByTestId('hotel-info')).toBeInTheDocument();
        expect(mockHotelInfo).toHaveBeenCalledWith({
            hotel: props.hotel,
            rooms: props.rooms,
            isPrintPreview: true,
        });
    });

    it('should render header for board title', () => {
        props.board = { title: 'All Inclusive' } as IBoardType;

        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByText(mockExportDetailsFields.BoardLabel.value)).toBeInTheDocument();
    });

    it('should render board title', () => {
        props.board = { title: 'All Inclusive' } as IBoardType;

        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByText(props.board.title)).toBeInTheDocument();
    });

    it('should NOT render board title if board is not provided', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.queryByText(mockExportDetailsFields.BoardLabel.value)).not.toBeInTheDocument();
    });

    it('should render FlightsInfo component', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByTestId('flights-info')).toBeInTheDocument();
        expect(mockFlightInfo).toHaveBeenCalledWith({
            departureRouteInfo: {
                route: mockFlightsRoutes[0],
                flag: DestinationRouteFlag.Departure,
                seatSelection: [mockSeat],
                seatSummaryText: '{number} seats selected',
            },
            arrivalRouteInfo: {
                route: mockFlightsRoutes[1],
                flag: DestinationRouteFlag.Arrival,
                seatSelection: [],
                seatSummaryText: '{number} seats selected',
            },
            isPrintPreview: true,
        });
    });

    it('should render CabinInfo component', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByTestId('cabin-bags-info')).toBeInTheDocument();
        expect(mockCabinInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockExportDetailsFields,
                guestsAmountByType: props.guestsAmountByType,
                LCBCount: mockStores.bookingStore.extraLuggage.LCBCount,
            }),
        );
    });

    it('should render TransferInfo component', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByTestId('transfer-info')).toBeInTheDocument();
        expect(mockTransferInfo).toHaveBeenCalledWith({
            transfer: mockTransfer,
            textClassName: 'smallText',
        });
    });

    it('should render guests amount by category', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByText('1 adult, 2 children')).toBeInTheDocument();
    });

    it('should render LuggageInfo component if luggage data is provided', () => {
        render(<BookingDetailsQuote {...props} />);

        expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        expect(mockLuggageInfo).toHaveBeenCalledWith({
            fields: mockExportDetailsFields,
            infantsNumber: props.guestsAmountByType.infants,
            extraLuggageFullInfo: 'extra luggage info',
            defaultBagsOneDirection: 'default bags',
            hideTitle: true,
            guestWithHoldLuggage: 3,
        });
    });
});
