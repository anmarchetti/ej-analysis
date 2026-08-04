import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
    createMockStores as createDefaultMockStores,
    mockAmendDatesStore,
    mockBooking,
    mockGuests,
} from 'frontend/__mocks__';
import { mockAirportParking } from 'frontend/__mocks__/airportParking';
import { mockedNewSeatSelection } from 'frontend/__mocks__/tracking';
import { GuestType } from 'models/enum/GuestType';
import { TransferType } from 'models/enum/transfer/TransferType';
import luggageInfoFieldsMocks from 'frontend/components/common/Booking/LuggageInfo/__mocks__/LuggageInfoFields';

import HolidaySummary, { IHolidaySummaryProps } from './HolidaySummary';
import { SummaryInfo } from './HolidaySummary.utils';

expect.extend(toHaveNoViolations);

const createProps = (): IHolidaySummaryProps => ({
    booking: mockBooking,
    transfer: mockBooking.transfers[0],
    cabinBagsInfoFields: {},
});

const createMockStores = () =>
    createDefaultMockStores({
        amendDatesStore: mockAmendDatesStore,
        viewBookingStore: {
            extraLuggage: { totalHoldLuggageItemsNumber: 0 },
        },
    });

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHolidaySummaryFlightsProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryFlights/HolidaySummaryFlights', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryFlightsProps(props);

        return <div data-tid='flights-seats' />;
    },
}));

const mockHolidaySummaryBagsComponent = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryBags/HolidaySummaryBags', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryBagsComponent(props);

        return <div data-tid='bags' />;
    },
}));

const mockHolidaySummaryTransferComponent = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryTransfer/HolidaySummaryTransfer', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryTransferComponent(props);

        return <div data-tid='transfer' />;
    },
}));

const mockHolidaySummaryRoomAndBoardProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryRoomAndBoard/HolidaySummaryRoomAndBoard', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryRoomAndBoardProps(props);

        return <div data-tid='rooms-and-boards' />;
    },
}));

const mockHolidaySummaryPlainOptionsProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryPlainOptions/HolidaySummaryPlainOptions', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryPlainOptionsProps(props);

        return <div data-tid='plain-options' />;
    },
}));

jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => () => (
    <div data-tid='free-for-kids-pill' />
));

const mockHolidaySummaryAirportParkingProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummaryAirportParking/HolidaySummaryAirportParking', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryAirportParkingProps(props);

        return <div data-tid='holiday-summary-airport-parking' />;
    },
}));

describe('<HolidaySummary />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render all children components', () => {
        mockProps.summaryInfoOrder = [
            SummaryInfo.Flight,
            SummaryInfo.LuggageAndTransfer,
            SummaryInfo.AccommodationAndBoard,
            SummaryInfo.PassengerDetails,
            SummaryInfo.FreeKids,
            SummaryInfo.AirportParking,
        ];
        mockProps.booking.guests.push({
            index: '3',
            age: 0,
            firstName: 'Bob',
            isLead: false,
            lastName: 'Brown',
            notBornYet: false,
            sex: 'SEX_FEMALE',
            title: 'Mrs',
            type: GuestType.Infant,
        });
        mockProps.booking.package.accom.rooms[0].isFreeForKids = true;

        render(<HolidaySummary {...mockProps} />);
        const parent = screen.getByTestId('holiday-summary');

        expect(parent).toBeInTheDocument();
        expect(within(parent).getByTestId('holiday-summary-flights')).toBeInTheDocument();
        expect(within(parent).getByTestId('flights-seats')).toBeInTheDocument();
        expect(mockHolidaySummaryFlightsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                flights: mockBooking.package.transport,
                passengers: mockBooking.guests,
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(within(parent).getByTestId('bags')).toBeInTheDocument();
        expect(within(parent).getByTestId('transfer')).toBeInTheDocument();
        expect(mockHolidaySummaryBagsComponent).toHaveBeenCalledWith({
            luggageInfo: mockBooking.extraLuggageInfo,
            dataTid: 'holiday-summary-bags',
            fields: undefined,
            guestsAmountByType: {
                adults: 2,
                children: 0,
                infants: 1,
            },
        });
        expect(mockHolidaySummaryTransferComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                transfer: mockBooking.transfers[0],
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-accommodation')).toBeInTheDocument();
        expect(within(parent).getByTestId('rooms-and-boards')).toBeInTheDocument();
        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                units: mockBooking.package.accom.rooms,
                hotel: {
                    resort: {
                        name: mockBooking.hotel!.resort.name,
                        region: mockBooking.package.location.region,
                    },
                    name: mockBooking.hotel!.name,
                },
                dataTid: 'holiday-summary-room-and-board',
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-passenger-details')).toBeInTheDocument();
        expect(within(parent).getAllByTestId('plain-options').length).toBe(1);
        expect(mockHolidaySummaryPlainOptionsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                guestsCount: {
                    [GuestType.Adult]: 2,
                    [GuestType.Child]: 0,
                    [GuestType.Infant]: 0,
                },
            }),
        );

        expect(within(parent).getByTestId('holiday-summary-free-kids')).toBeInTheDocument();
        expect(within(parent).getByTestId('free-for-kids-pill')).toBeInTheDocument();
        expect(within(parent).getByTestId('holiday-summary-airport-parking-details')).toBeInTheDocument();

        expect(mockHolidaySummaryAirportParkingProps).toHaveBeenCalledWith(
            expect.objectContaining({
                airportParking: mockAirportParking,
                dataTid: 'holiday-summary-airport-parking',
            }),
        );
    });

    it('should render RoomAndBoard component with empty hotel name', () => {
        const booking = {
            ...mockBooking,
        };
        booking.hotel!.resort!.name! = '';
        render(<HolidaySummary {...mockProps} booking={booking} />);

        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hotel: {
                    resort: {
                        name: '',
                        region: mockBooking.package.location.region,
                    },
                    name: mockBooking.hotel!.name,
                },
            }),
        );
    });

    it('should NOT render any children components when it does not match to provided order prop', () => {
        mockProps.summaryInfoOrder = [SummaryInfo.AccommodationAndBoard, undefined];
        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-accommodation')).toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-flights')).not.toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-luggage-transfer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-passenger-details')).not.toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-free-kids')).not.toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-airport-parking')).not.toBeInTheDocument();
    });

    it('should NOT render FreeForKids pill when booking does NOT have it', () => {
        mockProps.booking.package.accom.rooms[0].isFreeForKids = false;
        mockProps.summaryInfoOrder = [SummaryInfo.AccommodationAndBoard, SummaryInfo.FreeKids];

        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-accommodation')).toBeInTheDocument();
        expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-free-kids')).not.toBeInTheDocument();
    });

    it('should NOT render AirportParking when booking does NOT have it', () => {
        const testMockProps = { ...mockProps, booking: { ...mockBooking, airportParking: null } };

        render(<HolidaySummary {...testMockProps} />);

        expect(screen.getByTestId('holiday-summary-accommodation')).toBeInTheDocument();
        expect(screen.queryByTestId('holiday-summary-airport-parking-details')).not.toBeInTheDocument();
    });

    it('should render package data provided as props to override booking data', () => {
        mockProps.accom = {
            unit: [{ code: 'code1' }],
        };
        mockProps.flights = {
            code: 'code2',
        };
        mockProps.transfer = {
            code: 'code3',
        };
        mockProps.guestsCount = {
            [GuestType.Adult]: 1,
            [GuestType.Child]: 2,
            [GuestType.Infant]: 3,
        };
        mockProps.luggageInfo = {
            code: 'code4',
        };
        mockProps.extraLuggageInfo = {
            code: 'code5',
        };
        mockProps.selectedSeats = mockedNewSeatSelection;
        mockProps.luggageInfoFields = luggageInfoFieldsMocks();
        mockProps.booking.guests = mockGuests;

        render(<HolidaySummary {...mockProps} />);
        const parent = screen.getByTestId('holiday-summary');

        expect(parent).toBeInTheDocument();
        expect(within(parent).getByTestId('holiday-summary-flights')).toBeInTheDocument();
        expect(within(parent).getByTestId('flights-seats')).toBeInTheDocument();
        expect(mockHolidaySummaryFlightsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                flights: mockProps.flights,
                passengers: mockBooking.guests,
                selectedSeats: mockedNewSeatSelection,
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(within(parent).getByTestId('bags')).toBeInTheDocument();
        expect(within(parent).getByTestId('transfer')).toBeInTheDocument();
        expect(mockHolidaySummaryBagsComponent).toHaveBeenCalledWith({
            luggageInfo: mockProps.luggageInfo,
            dataTid: 'holiday-summary-bags',
            fields: mockProps.luggageInfoFields,
            guestsAmountByType: {
                adults: 2,
                children: 0,
                infants: 1,
            },
        });
        expect(mockHolidaySummaryTransferComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                transfer: mockProps.transfer,
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-accommodation')).toBeInTheDocument();
        expect(within(parent).getByTestId('rooms-and-boards')).toBeInTheDocument();
        expect(mockHolidaySummaryRoomAndBoardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                units: mockProps.accom.unit,
                hotel: {
                    resort: {
                        name: mockBooking.hotel!.resort.name,
                        region: mockBooking.package.location.region,
                    },
                    name: mockBooking.hotel!.name,
                },
            }),
        );
        expect(within(parent).getByTestId('holiday-summary-passenger-details')).toBeInTheDocument();
        expect(within(parent).getAllByTestId('plain-options').length).toBe(1);
        expect(mockHolidaySummaryPlainOptionsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                guestsCount: mockProps.guestsCount,
                dataTid: 'holiday-summary-passengers',
            }),
        );
    });

    it('should render prefix for data-tid', () => {
        mockProps.dataTidPrefix = 'amend-payment';
        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('amend-payment-holiday-summary')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-holiday-summary-flights')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-holiday-summary-accommodation')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-holiday-summary-passenger-details')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-holiday-summary-airport-parking-details')).toBeInTheDocument();
    });

    it('should pass booking seats if no seatSelection prop is passed', () => {
        mockProps.selectedSeats = null;
        mockProps.booking.seatSelection = mockedNewSeatSelection;
        render(<HolidaySummary {...mockProps} />);

        expect(mockHolidaySummaryFlightsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedSeats: mockedNewSeatSelection,
            }),
        );
    });

    it('should NOT render transfer and bags section shouldShowTransferAndBags === false', () => {
        mockProps.booking.guests = [{ type: GuestType.Adult }, { type: GuestType.Adult }];
        mockBooking.transfers[0].type = TransferType.NoTransfer;

        render(<HolidaySummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary-luggage-transfer')).not.toBeInTheDocument();
    });

    it('should render bags section AND NOT render transfer section when totalHoldLuggageItemsNumber !== 0', () => {
        mockStores.viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber = 3;
        mockBooking.transfers[0].type = TransferType.NoTransfer;

        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(screen.getByTestId('bags')).toBeInTheDocument();
        expect(screen.queryByTestId('transfer')).not.toBeInTheDocument();
    });

    it('should render transfer when AND NOT render bags section TransferType !== NoTransfer', () => {
        mockBooking.transfers[0].type = TransferType.Private;

        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(screen.getByTestId('transfer')).toBeInTheDocument();
        expect(screen.queryByTestId('bags')).not.toBeInTheDocument();
    });

    it('should render transfer section when transfer prop is not provided and booking.transfers[0].type is not NoTransfer', () => {
        mockProps.transfer = undefined;
        mockBooking.transfers[0].type = TransferType.Private;

        render(<HolidaySummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary-luggage-transfer')).toBeInTheDocument();
        expect(screen.getByTestId('transfer')).toBeInTheDocument();
    });

    it('should NOT render transfer section when transfer prop is not provided and booking.transfers[0].type is NoTransfer', () => {
        mockProps.transfer = undefined;
        mockProps.booking.guests = [{ type: GuestType.Adult }, { type: GuestType.Adult }] as any;
        mockBooking.transfers[0].type = TransferType.NoTransfer;

        render(<HolidaySummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary-luggage-transfer')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HolidaySummary {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
