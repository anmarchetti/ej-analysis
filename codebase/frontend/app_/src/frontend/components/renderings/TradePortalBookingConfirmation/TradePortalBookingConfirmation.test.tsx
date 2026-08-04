import React from 'react';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { TradePortalBookingConfirmation } from './TradePortalBookingConfirmation';

const departureDate = 'test';
const countryName = 'test';
const bookingReference = 'test';
const flightReference = 'test';
const mockUseInView = { inView: true };

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

jest.mock('frontend/components/common/Booking/PassengerDetails/PassengerDetails', () => () => (
    <div data-tid='passenger-details' />
));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div data-tid='overlay-spinner' />,
}));

const mockViewBookingHolidayDetailsComponent = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingHolidayDetailsComponent(props);

        return <div data-tid='view-booking-holidays-details' />;
    },
}));

const mockViewBookingToolbarComponent = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingToolbarComponent(props);

        return <div data-tid='view-booking-toolbar' />;
    },
}));

const mockViewBookingHotelComponent = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingHotelComponent(props);

        return <div data-tid='view-booking-hotel' />;
    },
}));

const mockBookingErrorPopupComponent = jest.fn();
jest.mock('frontend/components/common/BookingErrorPopup', () => ({
    __esModule: true,
    default: props => {
        mockBookingErrorPopupComponent(props);

        return <div data-tid='booking-error-popup' />;
    },
}));

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid={props.name} {...props} />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const createStores = () => ({
    bookingStore: {
        booking: {
            package: {
                accom: {
                    hotel: {
                        name: '',
                        country: {
                            name: countryName,
                        },
                        location: {
                            name: '',
                        },
                        region: {
                            name: '',
                        },
                    },
                    rooms: [],
                },
                transport: {
                    routes: [
                        {
                            extRefId: flightReference,
                            depDate: departureDate,
                        },
                    ],
                },
                location: {
                    region: '',
                },
            },
            guests: [],
            bookingReference,
        } as any,
        loadBookingConfirmationInfo: jest.fn(),
        isLoadingBookingConfirmationInfo: false,
        payBalance: jest.fn(),
        locationImage: 'locationImage',
        clearBooking: jest.fn(),
        isCheckInAvailable: jest.fn(),
    },
    layoutStore: {
        getPhrase: jest.fn(),
        getSetting: jest.fn(),
        filterFacilitiesByDesignVariant: jest.fn(() => []),
    },
    appStore: { isScreenLarge: true },
    trackingStore: { trackEventWithParams: jest.fn() },
    userStore: {
        isLoggedIn: true,
    },
    seatMapStore: {
        isHideSeatMapWarningMessages: false,
    },
    amendFlightsStore: {
        isAmendCTAVisible: true,
    },
    amendTransfersStore: { isNoAvailableTransfers: false },
});
const createProps = () => ({
    fields: {},
    rendering: {},
    params: {},
});

let props;
let mockStores;

describe('<TradePortalBookingConfirmation />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
    });

    it('should NOT render TradePortalBookingConfirmation when booking not defined', () => {
        mockStores.bookingStore.booking = null;

        const { container } = render(<TradePortalBookingConfirmation {...props} />);

        expect(container.querySelector('.view-booking')).not.toBeInTheDocument();
    });

    it('should render loader when isLoadingBookingConfirmationInfo', () => {
        mockStores.bookingStore.isLoadingBookingConfirmationInfo = true;

        const { container } = render(<TradePortalBookingConfirmation {...props} />);

        expect(container.querySelector('.view-booking')).not.toBeInTheDocument();
        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
    });

    it('should render TradePortalBookingConfirmation', () => {
        const { container } = render(<TradePortalBookingConfirmation {...props} />);

        expect(container.querySelector('.view-booking')).toBeInTheDocument();
        expect(screen.getByTestId('view-booking-toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('view-booking-hotel')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.HeroBannerTopSection,
            rendering: props.rendering,
        });
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({ name: PlaceholderNames.AtolProtection }),
        );
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({ name: PlaceholderNames.ViewBookingCost }),
        );
        expect(screen.getByTestId('view-booking-holidays-details')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({ name: PlaceholderNames.Feedback }),
        );
    });

    it('should NOT render HealthEntryRequirements component when healthEntryRequirements array is empty', () => {
        mockStores.bookingStore.booking = { ...mockStores.bookingStore.booking, healthEntryRequirements: [] };

        const { container } = render(<TradePortalBookingConfirmation {...props} />);

        expect(container.querySelector('.view-booking')).toBeInTheDocument();
        expect(screen.queryByTestId(PlaceholderNames.HealthEntryRequirements)).not.toBeInTheDocument();
    });

    it('should render HealthEntryRequirements component when healthEntryRequirements array is NOT empty', () => {
        mockStores.bookingStore.booking = { ...mockStores.bookingStore.booking, healthEntryRequirements: [1, 2] };

        render(<TradePortalBookingConfirmation {...props} />);

        expect(screen.getByTestId(PlaceholderNames.HealthEntryRequirements)).toBeInTheDocument();
    });

    it('should call clearBooking on unmount', () => {
        const { unmount } = render(<TradePortalBookingConfirmation {...props} />);

        unmount();

        expect(mockStores.bookingStore.clearBooking).toHaveBeenCalled();
    });
});
