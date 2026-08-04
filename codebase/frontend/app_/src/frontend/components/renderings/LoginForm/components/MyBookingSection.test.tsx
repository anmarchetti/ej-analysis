import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import * as dateUtils from 'frontend/utils/date.utils';
import { GuestBookingInfoFields } from 'models/data/GuestBookingInfo';

import { MyBooking } from './MyBookingSection';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn() },
    userStore: {
        isLoggedIn: false,
        userData: null,
    },
    viewBookingStore: {
        guestBookingInfo: {
            onChangeField: jest.fn(),
            clearData: jest.fn(),
            departureDate: '',
            bookingReference: '',
            lastName: '',
        },
        clearGuestBookingInfo: jest.fn(),
        getBooking: jest.fn(),
        errorMessage: '',
        isLoading: false,
        changeErrorMessage: jest.fn(),
    },
    trackingStore: {
        trackValidation: jest.fn(),
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/OverlaySpinner', () => () => <div data-tid='overlay-spinner' />);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={`placeholder-${props.name}`} />;
    },
}));

const mockRendering = { componentName: 'MyBookingSection' };

describe('<MyBookingSection />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render normally', () => {
        render(<MyBooking rendering={mockRendering} />);
        expect(screen.getByTestId('departureDate')).toBeInTheDocument();
        expect(screen.getByTestId('bookingReference')).toBeInTheDocument();
        expect(screen.getByTestId('lastName')).toBeInTheDocument();
        expect(screen.getByTestId('view-booking-button')).toBeInTheDocument();
        expect(screen.queryByTestId('overlay-spinner')).not.toBeInTheDocument();
    });

    it('should show overlay Spinner', () => {
        mockStores.viewBookingStore.isLoading = true;
        render(<MyBooking rendering={mockRendering} />);
        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
    });

    it('should change departureDate when field is changed', () => {
        render(<MyBooking rendering={mockRendering} />);
        const value = '10/10/2024';
        const departureDate = screen.getByTestId('departureDate').getElementsByTagName('input')[0];
        act(() => {
            fireEvent.change(departureDate, { target: { value } });
        });

        expect(mockStores.viewBookingStore.guestBookingInfo.onChangeField).toHaveBeenCalledWith(
            GuestBookingInfoFields.DepartureDate,
            value,
        );
    });

    it('should change lastName when field is changed', () => {
        render(<MyBooking rendering={mockRendering} />);
        const value = 'test';
        const lastName = screen.getByTestId('lastName').getElementsByTagName('input')[0];

        act(() => {
            fireEvent.change(lastName, { target: { value } });
        });

        expect(mockStores.viewBookingStore.guestBookingInfo.onChangeField).toHaveBeenCalledWith(
            GuestBookingInfoFields.LastName,
            value,
        );
    });

    it('should clear data when component will unmount', () => {
        const { unmount } = render(<MyBooking rendering={mockRendering} />);
        unmount();

        expect(mockStores.viewBookingStore.guestBookingInfo.clearData).toHaveBeenCalled();
    });

    it('should clear errors when component will unmount', () => {
        const { unmount } = render(<MyBooking rendering={mockRendering} />);
        unmount();

        expect(mockStores.viewBookingStore.changeErrorMessage).toHaveBeenCalled();
    });

    it('should call autoCompleteDateYear on departure date blur', () => {
        jest.spyOn(dateUtils, 'autoCompleteDateYear').mockReturnValue('10/10/2024');
        mockStores.viewBookingStore.guestBookingInfo.departureDate = '10/10/24';
        render(<MyBooking rendering={mockRendering} />);
        const departureDate = screen.getByTestId('departureDate').getElementsByTagName('input')[0];

        act(() => {
            fireEvent.blur(departureDate);
        });

        expect(dateUtils.autoCompleteDateYear).toHaveBeenCalledWith('10/10/24');

        expect(mockStores.viewBookingStore.guestBookingInfo.onChangeField).toHaveBeenCalledWith(
            GuestBookingInfoFields.DepartureDate,
            '10/10/2024',
        );
    });

    it('should render FlightAndHotelBanner placeholder', () => {
        render(<MyBooking rendering={mockRendering} />);

        expect(screen.getByTestId('placeholder-flight-and-hotel-banner')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'flight-and-hotel-banner',
                rendering: mockRendering,
            }),
        );
    });
});
