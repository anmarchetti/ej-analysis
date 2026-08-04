import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking, mockLuggageListFields } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import ViewBookingHolidayDetails from './ViewBookingHolidayDetails';

const createProps = () => ({
    booking: JSON.parse(JSON.stringify(mockBooking)),
    fields: mockLuggageListFields,
    children: <div data-tid='children' />,
    onAmendTransfersClick: jest.fn(),
    onAmendFlightsClick: jest.fn(),
    onAmendPassengerClick: jest.fn(),
    onAmendSeatsClick: jest.fn(),
    onAmendRoomAndBoardClick: jest.fn(),
    rendering: {},
});

const createStores = () =>
    createMockStores({
        bookingStore: { isCheckInAvailable: jest.fn() },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockViewBookingHolidayBaseDetailsComponent = jest.fn();
jest.mock('frontend/components/common/ViewBookingHolidayBaseDetails/ViewBookingHolidayBaseDetails', () => props => {
    mockViewBookingHolidayBaseDetailsComponent(props);

    return <div data-tid='view-booking-holiday-base-details' />;
});

const mockPassengerDetailsComponent = jest.fn();
jest.mock('frontend/components/common/Booking/PassengerDetails/PassengerDetails', () => props => {
    mockPassengerDetailsComponent(props);

    return <div data-tid='passenger-details' />;
});

const mockErrataMessageComponent = jest.fn();
jest.mock('frontend/components/common/ErrataInfo/ErrataMessage', () => ({
    __esModule: true,
    ErrataMessage: props => {
        mockErrataMessageComponent(props);

        return <div data-tid='errata-message' />;
    },
}));

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid={props.name} />;
    },
}));

describe('<ViewBookingHolidayDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render special-requests', () => {
        render(<ViewBookingHolidayDetails {...mockProps} />);

        expect(screen.getByTestId(PlaceholderNames.SpecialRequests)).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.SpecialRequests,
            rendering: {},
        });

        expect(screen.getByTestId(PlaceholderNames.CreditBookingDisruption)).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            booking: mockBooking,
            name: PlaceholderNames.CreditBookingDisruption,
            rendering: {},
            onClickButton: mockProps.onCancelBookingClick,
        });

        expect(screen.getByTestId('passenger-details')).toBeInTheDocument();
        expect(mockPassengerDetailsComponent).toHaveBeenCalledWith({
            flights: mockBooking.package.transport.routes,
            guests: mockBooking.guests,
            isBookingCanceled: false,
            isCheckInAvailable: undefined,
            isExternalAgency: undefined,
            isLeadLoggedIn: true,
            leadPassenger: mockBooking.leadPassenger,
            onAmendPassengerClick: mockProps.onAmendPassengerClick,
            showLeadEmailOnly: undefined,
        });

        expect(screen.getByTestId('errata-message')).toBeInTheDocument();
        expect(mockErrataMessageComponent).toHaveBeenCalledWith({
            className: 'view-booking-card',
            errataInfo: undefined,
            facilityErratas: ['Parking', 'Fitness Center'],
        });

        expect(screen.getByTestId('view-booking-holiday-base-details')).toBeInTheDocument();
        expect(mockViewBookingHolidayBaseDetailsComponent).toHaveBeenCalledWith({
            booking: mockBooking,
            rendering: {},
            fields: mockProps.fields,
            isPrintPreview: mockProps.isPrintPreview,
            onAmendTransfersClick: mockProps.onAmendTransfersClick,
            onAmendFlightsClick: mockProps.onAmendFlightsClick,
            onAmendSeatsClick: mockProps.onAmendSeatsClick,
            onAmendRoomAndBoardClick: mockProps.onAmendRoomAndBoardClick,
            children: <div data-tid='children' />,
        });
    });
});
