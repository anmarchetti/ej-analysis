import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking, mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__';
import { mockExportDetailsFields } from 'frontend/__mocks__/exportHoliday';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ViewBookingHolidayBaseDetails, { IBookingHolidayBaseDetailsProps } from './ViewBookingHolidayBaseDetails';

const mockBookingFlightsComponent = jest.fn();
jest.mock('frontend/components/common/Booking/BookingFlights/BookingFlights', () => ({
    __esModule: true,
    default: props => {
        mockBookingFlightsComponent(props);

        return <div data-tid='booking-flights'>{props.lateCheckoutBanner}</div>;
    },
}));

const mockTransfersComponent = jest.fn();
jest.mock('frontend/components/common/Booking/Transfers/Transfers', () => ({
    __esModule: true,
    default: props => {
        mockTransfersComponent(props);

        return <div data-tid='transfers' />;
    },
}));

const mockRoomAndBoardComponent = jest.fn();
jest.mock('frontend/components/common/Booking/RoomAndBoard/RoomAndBoard', () => ({
    __esModule: true,
    default: ({ onAmendClick, ...props }) => {
        mockRoomAndBoardComponent(props);

        return <div data-tid='room-and-board' />;
    },
}));

const mockHoldLuggageViewBooking = jest.fn();
jest.mock(
    'frontend/components/renderings/ViewBooking/components/HoldLuggageViewBooking/HoldLuggageViewBooking',
    () => ({
        __esModule: true,
        default: ({ onAmendClick, ...props }) => {
            mockHoldLuggageViewBooking(props);

            return <div data-tid='hold-luggage-view-booking' />;
        },
    }),
);

const mockLuggageBanner = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/LuggageBanner/LuggageBanner', () => ({
    __esModule: true,
    default: ({ onAmendClick, ...props }) => {
        mockLuggageBanner(props);

        return <div data-tid='luggage-banner' />;
    },
}));

const createProps = (): IBookingHolidayBaseDetailsProps => ({
    booking: mockBooking,
    fields: mockExportDetailsFields,
    rendering: {} as any,
    children: <div data-tid='children' />,
    onAmendTransfersClick: jest.fn(),
    onAmendFlightsClick: jest.fn(),
    onAmendSeatsClick: jest.fn(),
    onAmendRoomAndBoardClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: { isTradePortal: false, isViewBookingPage: true, isConfirmationPage: false },
        viewBookingStore: { extraLuggage: {}, isFlightExternal: false },
        seatMapStore: {
            isHideSeatMapWarningMessages: false,
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ name }) => <div data-tid={name} />,
}));

describe('<ViewBookingHolidayBaseDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default', () => {
        mockProps.booking.lateRoomCheckout = true;
        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesHolidayDetails)).toBeInTheDocument();

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId(PlaceholderNames.HoldLuggageInfoBanner)).toBeInTheDocument();
        expect(screen.getByTestId(PlaceholderNames.SeatsAndBags)).toBeInTheDocument();
        expect(screen.getByTestId(PlaceholderNames.BookedAirportParking)).toBeInTheDocument();

        expect(screen.getByTestId('booking-flights')).toBeInTheDocument();
        expect(mockBookingFlightsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                csMask: true,
                onAmendFlightsClick: expect.any(Function),
                routes: [mockOutboundFlight, mockInboundFlight],
                fields: mockProps.fields,
            }),
        );
        expect(screen.getByTestId(PlaceholderNames.LateCheckoutBanner)).toBeInTheDocument();

        expect(screen.getByTestId('transfers')).toBeInTheDocument();
        expect(mockTransfersComponent).toHaveBeenCalledWith({
            amendEnabled: undefined,
            isIconOrange: true,
            onAmendTransfersClick: expect.any(Function),
            rendering: {},
            transfers: mockBooking.transfers,
        });

        expect(screen.getByTestId('room-and-board')).toBeInTheDocument();
        expect(mockRoomAndBoardComponent).toHaveBeenCalledWith({
            rooms: mockBooking.package.accom.rooms,
        });

        expect(screen.getByTestId('hold-luggage-view-booking')).toBeInTheDocument();
        expect(mockHoldLuggageViewBooking).toHaveBeenCalledWith({
            additionalFields: mockProps.fields,
            guestsAmount: {
                adults: 2,
                children: 0,
                infants: 0,
            },
        });
    });

    it('should render correct with default values', () => {
        mockProps.booking.transfers = null;
        mockProps.booking.package.transport = null;
        mockProps.booking.package.accom.rooms = null;
        mockProps.booking.lateRoomCheckout = false;
        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(mockBookingFlightsComponent).toHaveBeenCalledWith({
            csMask: true,
            lateCheckoutBanner: undefined,
            onAmendFlightsClick: expect.any(Function),
            routes: [],
            fields: mockProps.fields,
        });

        expect(screen.getByTestId('transfers')).toBeInTheDocument();
        expect(mockTransfersComponent).toHaveBeenCalledWith({
            isIconOrange: true,
            onAmendTransfersClick: expect.any(Function),
            rendering: {},
            transfers: [],
        });

        expect(screen.getByTestId('room-and-board')).toBeInTheDocument();
        expect(mockRoomAndBoardComponent).toHaveBeenCalledWith({
            rooms: [],
        });

        expect(screen.getByTestId('hold-luggage-view-booking')).toBeInTheDocument();
        expect(mockHoldLuggageViewBooking).toHaveBeenCalledWith({
            additionalFields: mockProps.fields,
            guestsAmount: {
                adults: 2,
                children: 0,
                infants: 0,
            },
        });
    });

    it('should NOT render children if children is NOT provided', () => {
        mockProps.children = null;

        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.queryByText('children')).not.toBeInTheDocument();
    });

    describe('generic info block', () => {
        beforeEach(() => {
            mockStores.seatMapStore.isHideSeatMapWarningMessages = true;
        });

        it('should not render generic info block banner', () => {
            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.HoldLuggageInfoBanner)).not.toBeInTheDocument();
        });

        it('should render generic info block banner on trade portal', () => {
            mockStores.layoutStore.isTradePortal = true;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.HoldLuggageInfoBanner)).toBeInTheDocument();
        });
    });

    it('should NOT render Luggage Banner for internal flight', () => {
        mockStores.viewBookingStore.isFlightExternal = false;

        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.queryByTestId('luggage-banner')).not.toBeInTheDocument();
    });

    it('should render Luggage Banner for external flight', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.getByTestId(PlaceholderNames.Bags)).toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-view-booking')).not.toBeInTheDocument();
    });

    it('should render Bags placeholder on Confirmation page', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.getByTestId(PlaceholderNames.Bags)).toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-view-booking')).not.toBeInTheDocument();
    });

    it('should not render luggageBanners when no fields', () => {
        mockProps.fields = undefined;
        mockStores.viewBookingStore.isFlightExternal = true;

        render(<ViewBookingHolidayBaseDetails {...mockProps} />);

        expect(screen.queryByTestId(PlaceholderNames.Bags)).not.toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-view-booking')).not.toBeInTheDocument();
        expect(mockBookingFlightsComponent).toHaveBeenCalledWith({
            csMask: true,
            onAmendFlightsClick: expect.any(Function),
            routes: [],
            lateCheckoutBanner: undefined,
            fields: undefined,
        });
        expect(mockLuggageBanner).not.toHaveBeenCalled();
    });

    describe('isFlightAndHotelPackage', () => {
        it('should render BookingDetails title when isFlightAndHotelPackage is true on viewBookingStore', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesBookingDetails)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesHolidayDetails)).not.toBeInTheDocument();
        });

        it('should render BookingDetails title when isFlightAndHotelPackage is true on bookingStore', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = true;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesBookingDetails)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesHolidayDetails)).not.toBeInTheDocument();
        });

        it('should render HolidayDetails title when isFlightAndHotelPackage is false', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = false;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesHolidayDetails)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesBookingDetails)).not.toBeInTheDocument();
        });

        it('should render Transfers when isFlightAndHotelPackage is true', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.getByTestId('transfers')).toBeInTheDocument();
        });

        it('should render Transfers when isFlightAndHotelPackage is false', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = false;

            render(<ViewBookingHolidayBaseDetails {...mockProps} />);

            expect(screen.getByTestId('transfers')).toBeInTheDocument();
        });
    });
});
