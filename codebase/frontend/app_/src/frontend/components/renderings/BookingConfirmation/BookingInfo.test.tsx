import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';

import { BookingInfo } from './BookingInfo';

const createStores = () =>
    createMockStores({
        bookingStore: {
            booking: mockBooking,
            loadBookingConfirmationInfo: jest.fn(),
            payRemainingBalance: jest.fn(),
            clearBooking: jest.fn(),
            isLoadingBookingConfirmationInfo: false,
            bookingInfoPayload: {
                cardType: 'Visa',
            },
        },
        appStore: {
            isScreenLarge: true,
        },
        paymentTypeStore: {
            selectedPaymentType: 'Card',
        },
    });

const createProps = () => ({
    fields: {},
    rendering: {},
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useChatbotTracking/useChatbotTracking', () => ({
    useChatbotTracking: jest.fn(),
}));

const mockPushTrackingEvent = jest.fn();
jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

jest.mock('frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-tid='test-toolbar' />),
}));

jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-tid='test-hotel' />),
}));

const mockViewBookingCostProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/HolidayCost/components/ViewBookingCost', () => ({
    __esModule: true,
    default: ({ priceBreakdown }) => {
        mockViewBookingCostProps(priceBreakdown);

        return <div data-tid='test-cost' />;
    },
}));

const mockViewBookingNavigation = jest.fn();
jest.mock(
    'frontend/components/renderings/ViewBooking/components/ViewBookingNavigation/ViewBookingNavigation.tsx',
    () => ({
        __esModule: true,
        default: props => {
            mockViewBookingNavigation(props);

            return <div data-tid='view-booking-navigation' />;
        },
        ViewBookingAnchors: { HolidaySummary: { anchorId: 'holiday-summary' } },
    }),
);

const mockViewBookingHotel = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => ({
    __esModule: true,
    default: jest.fn(props => {
        mockViewBookingHotel(props);

        return <div data-tid='view-booking-hotel' />;
    }),
}));

jest.mock('frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-tid='test-booking' />),
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

describe('<BookingInfo />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
    });

    it('should render BookingInfo', () => {
        render(<BookingInfo {...props} />);

        expect(screen.getByTestId('booking-info')).toBeInTheDocument();
    });

    it('should call useChatbotTracking with booking', () => {
        render(<BookingInfo {...props} />);

        expect(useChatbotTracking).toHaveBeenCalledWith(mockBooking);
    });

    it('should pass extraPriceBreakdown to ViewBookingCost when it is available', () => {
        mockStores.bookingStore.booking.extraPriceBreakdown = [
            { name: 'Bags', amount: 50 },
            { name: 'Discount', amount: -20 },
            { name: 'Luggage', amount: 200 },
        ];
        mockStores.bookingStore.booking.priceBreakdown = null;

        const expectedResult = [
            { name: 'Bags', amount: 50 },
            { name: 'Luggage', amount: 200 },
            { name: 'Discount', amount: -20 },
        ];

        render(<BookingInfo {...props} />);
        expect(mockViewBookingCostProps).toHaveBeenCalledWith(expectedResult);
    });

    it('should pass priceBreakdown to ViewBookingCost when extraPriceBreakdown is not available', () => {
        const testPriceBreakdown = [
            { name: 'Discount', amount: -20 },
            { name: 'Bags', amount: 30 },
            { name: 'Luggage', amount: 150 },
        ];

        mockStores.bookingStore.booking.extraPriceBreakdown = null;
        mockStores.bookingStore.booking.priceBreakdown = testPriceBreakdown;

        const expectedResult = [
            { name: 'Bags', amount: 30 },
            { name: 'Luggage', amount: 150 },
            { name: 'Discount', amount: -20 },
        ];

        render(<BookingInfo {...props} />);
        expect(mockViewBookingCostProps).toHaveBeenCalledWith(expectedResult);
    });

    it('should call pushTrackingEvent with payment history when booking is available', () => {
        const mockPaymentHistory = [
            {
                amount: 100,
                paymentDate: '2024-11-18T13:33:35+00:00',
                isCredit: true,
            },
            {
                amount: 50,
                paymentDate: '2024-11-18T13:33:35+00:00',
                isCredit: false,
            },
        ];

        mockStores.bookingStore.booking.paymentInfo = { paymentHistory: mockPaymentHistory };

        render(<BookingInfo {...props} />);

        expect(mockPushTrackingEvent).toHaveBeenCalled();
    });

    it('should call pushTrackingEvent with Apple Pay when paymentType is ApplePay', () => {
        const mockPaymentHistory = [
            {
                amount: 100,
                paymentDate: '2024-11-18T13:33:35+00:00',
                isCredit: false,
            },
        ];

        mockStores.bookingStore.booking.paymentInfo = {
            paymentHistory: mockPaymentHistory,
            currency: 'GBP',
        };
        mockStores.bookingStore.bookingInfoPayload = {
            cardType: 'Visa',
            paymentType: 'ApplePay',
        };

        render(<BookingInfo {...props} />);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                generic_value_1: 'Apple Pay - Visa',
            }),
        );
    });

    it('should call pushTrackingEvent with card type when selectedPaymentType is Card', () => {
        const mockPaymentHistory = [
            {
                amount: 100,
                paymentDate: '2024-11-18T13:33:35+00:00',
                isCredit: false,
            },
        ];

        mockStores.bookingStore.booking.paymentInfo = { paymentHistory: mockPaymentHistory };
        mockStores.paymentTypeStore = {
            selectedPaymentType: 'Card',
        };
        mockStores.bookingStore.bookingInfoPayload = {
            cardType: 'MasterCard',
        };

        render(<BookingInfo {...props} />);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                generic_value_1: 'MasterCard',
            }),
        );
    });

    it('Should render ViewBookingHotel', () => {
        render(<BookingInfo {...props} />);

        expect(mockViewBookingHotel).toHaveBeenCalledWith({
            booking: mockStores.viewBookingStore.booking,
            fallbackImage: 'HotelFallbackImage',
            rendering: {},
        });
    });

    it('should call ViewBookingNavigation', () => {
        render(<BookingInfo {...props} />);

        expect(mockViewBookingNavigation).toHaveBeenCalledWith({
            booking: mockBooking,
            bookingPdfFileName: expect.any(String),
            bookingPdfLink: 'http://test/api/v1.0/booking/confirmation',
            isLeadLoggedIn: true,
            showRemainingBalance: true,
        });
    });

    it('should not call ViewBookingNavigation', () => {
        mockStores.appStore.isScreenLarge = false;
        render(<BookingInfo {...props} />);

        expect(mockViewBookingNavigation).not.toHaveBeenCalled();
    });
});
