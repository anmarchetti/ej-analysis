import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockResolvedObservablePromise } from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ViewBookings from './ViewBookings';

const mockAddBookingPopup = jest.fn();
jest.mock('./components/AddBookingPopup/AddBookingPopup', () => props => {
    mockAddBookingPopup(props);

    return <div data-tid='add-booking-popup' />;
});

const createStores = () => ({
    viewBookingsStore: {
        initialize: jest.fn(),
        cancelFetchBookings: jest.fn(),
        hasNoBookings: false,
        bookings: [{}, {}],
        bookingsRequest: mockResolvedObservablePromise(),
        areBookingsLoading: false,
    },
    layoutStore: {
        getPhrase: jest.fn(),
    },
    userStore: {
        setUserDetails: jest.fn(),
        isLoggedIn: true,
    },
    addBookingStore: {
        isAddBookingShown: false,
        toggleAddBooking: jest.fn(),
    },
    holidayCreditStore: {
        hasCreditHistory: true,
        isCreditBookingEnabled: false,
    },
    routerStore: {
        redirectToHolidayCredit: jest.fn(),
    },
    appStore: {
        isScreenLessMedium: false,
    },
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
});

const createMockProps = () =>
    ({
        fields: {
            NoBookingsTitle: {
                value: 'No bookings found',
            },
            FlightHotelPillIcon: {
                value: { src: '/pill-icon.png' },
            },
            FlightHotelPillText: {
                value: 'Flight + Hotel',
            },
            RegularPillIcon: {
                value: { src: '/regular-pill-icon.png' },
            },
        },
        params: {},
        rendering: { componentName: 'ViewBookings' },
    } as any);

let mockStores = createStores();
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBookingsList = jest.fn();
jest.mock('./components/BookingsList/BookingsList', () => ({
    __esModule: true,
    default: props => {
        mockBookingsList(props);

        return <div data-tid='bookings-list' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => <div data-tid={props['data-tid']} />,
}));

jest.mock('./components/NoBookings', () => ({
    __esModule: true,
    default: () => <div data-tid='no-bookings' />,
}));

describe('<ViewBookings />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createStores();
    });

    it('should render', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;

        render(<ViewBookings {...mockProps} />);
        expect(screen.getByTestId('credit-expires-banner-placeholder')).toBeInTheDocument();
    });

    it('should show credits if no bookings found', () => {
        mockStores.viewBookingsStore.hasNoBookings = true;
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;
        render(<ViewBookings {...mockProps} />);

        expect(screen.getByTestId('view-credits-card')).toBeInTheDocument();
    });

    it('should render 2 cards if hasCreditHistory', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;
        render(<ViewBookings {...mockProps} />);

        expect(screen.getByTestId('view-credits-card')).toBeInTheDocument();
        expect(screen.getByTestId('add-booking-card')).toBeInTheDocument();
    });

    it('should toggleAddBooking if addBookingCard is clicked', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;
        render(<ViewBookings {...mockProps} />);

        fireEvent.click(screen.getByTestId('add-booking-card-btn'));
        expect(mockStores.addBookingStore.toggleAddBooking).toBeCalled();
    });

    it('should render null if user is not logged in', () => {
        mockStores.userStore.isLoggedIn = false;
        const { container } = render(<ViewBookings {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render skeleton loader if areBookingsLoading is true', () => {
        mockStores.viewBookingsStore.areBookingsLoading = true;
        const { container } = render(<ViewBookings {...mockProps} />);

        expect(container.querySelectorAll('.placeholder-shimmer')).toHaveLength(3);
    });

    it('should render no bookings message if hasNoBookings', () => {
        mockStores.viewBookingsStore.hasNoBookings = true;
        mockStores.holidayCreditStore.isCreditBookingEnabled = false;
        render(<ViewBookings {...mockProps} />);

        expect(screen.getByTestId('no-bookings')).toBeInTheDocument();
    });

    it('should show AddBookingPopup if isAddBookingShown', () => {
        mockStores.addBookingStore.isAddBookingShown = true;
        render(<ViewBookings {...mockProps} />);

        expect(screen.getByTestId('add-booking-popup')).toBeInTheDocument();
    });

    it('should not call initialize when fields are undefined', () => {
        mockProps.fields = undefined;
        render(<ViewBookings {...mockProps} />);

        expect(mockStores.viewBookingsStore.initialize).not.toHaveBeenCalled();
    });

    it('should NOT render AddBookingCTA when isCreditBookingEnabled and IsAddBookingCTAShown', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;
        mockProps.fields.IsAddBookingCTAShown = mockSitecoreField(true);
        render(<ViewBookings {...mockProps} />);

        expect(screen.queryByTestId('add-booking-cta')).not.toBeInTheDocument();
    });

    it('should pass FlightHotelPillIcon, FlightHotelPillText and RegularPillIcon to BookingsList', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = true;
        render(<ViewBookings {...mockProps} />);

        expect(mockBookingsList).toHaveBeenCalledWith(
            expect.objectContaining({
                FlightHotelPillIcon: mockProps.fields.FlightHotelPillIcon,
                FlightHotelPillText: mockProps.fields.FlightHotelPillText,
                RegularPillIcon: mockProps.fields.RegularPillIcon,
            }),
        );
    });

    it('should pass rendering to AddBookingPopup', () => {
        mockStores.addBookingStore.isAddBookingShown = true;
        render(<ViewBookings {...mockProps} />);

        expect(mockAddBookingPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                rendering: mockProps.rendering,
            }),
        );
    });
});
