import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';

import BookingsList from './BookingsList';

const mockBookingCard = jest.fn();
jest.mock('frontend/components/common/Booking/BookingCard/BookingCard', () => ({
    __esModule: true,
    default: props => {
        mockBookingCard(props);

        return <div data-tid='booking-card'>{props.booking.hotel.name}</div>;
    },
}));

jest.mock('frontend/utils/offer.utils', () => ({
    __esModule: true,
    containsFAndHPromoCode: jest.fn(),
}));

const mockTabBarComponent = jest.fn();
jest.mock('frontend/components/common/TabBar', () => ({
    __esModule: true,
    default: props => {
        mockTabBarComponent(props);

        return <div data-tid='tab-bar' />;
    },
}));

jest.mock('frontend/components/renderings/ViewBookings/components/BookingsSort/BookingsSort', () => ({
    __esModule: true,
    default: () => <div data-tid='bookings-sort' />,
}));

const createStores = () =>
    createMockStores({
        viewBookingsStore: {
            activeTab: 'Upcoming' as any,
            bookings: [
                {
                    hotel: {
                        name: 'Fancy hotel',
                    },
                },
                {
                    hotel: {
                        name: 'Fancy hotel 2',
                    },
                },
            ] as IBookingInfo[],
            upcomingCount: 2,
            previousCount: 0,
            canceledCount: 0,
            onTabChange: jest.fn(),
            sortBy: { value: 'BOOKINGDATE', label: 'Booking date' },
            setSortBy: jest.fn(),
            availableSortOptions: [{ value: 'BOOKINGDATE', label: 'Booking date' }],
            isSortByDisabled: false,
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingsList />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render', () => {
        render(<BookingsList rendering={{ componentName: 'BookingsList' }} />);
        mockStores.viewBookingsStore.activeTab = 'Upcoming';

        expect(screen.getByTestId('bookings-list')).toBeInTheDocument();
        expect(screen.getAllByTestId('booking-card')).toHaveLength(2);
        expect(screen.getByText('Fancy hotel')).toBeInTheDocument();
        expect(screen.getByText('Fancy hotel 2')).toBeInTheDocument();
    });

    it('should pass tabClass to TabBar', () => {
        render(<BookingsList rendering={{ componentName: 'BookingsList' }} />);

        expect(mockTabBarComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                tabClass: expect.any(String),
            }),
        );
    });

    it('should return null without activeTab', () => {
        mockStores.viewBookingsStore.activeTab = undefined;
        render(<BookingsList rendering={{ componentName: 'BookingsList' }} />);

        expect(screen.queryByTestId('bookings-list')).not.toBeInTheDocument();
    });

    it('should render with previous tab', () => {
        mockStores.viewBookingsStore.previousCount = 1;
        mockStores.viewBookingsStore.upcomingCount = 0;
        mockStores.viewBookingsStore.bookings = [
            {
                hotel: {
                    name: 'Previous hotel',
                },
                package: {
                    transport: {
                        routes: [
                            {},
                            {
                                depDate: '2021-01-01',
                            },
                        ],
                    },
                },
            },
        ] as IBookingInfo[];
        mockStores.viewBookingsStore.activeTab = 'Previous';
        render(<BookingsList rendering={{ componentName: 'BookingsList' }} />);

        expect(screen.getByText('Previous hotel')).toBeInTheDocument();
    });

    it('should render with canceled tab', () => {
        mockStores.viewBookingsStore.canceledCount = 1;
        mockStores.viewBookingsStore.upcomingCount = 0;
        mockStores.viewBookingsStore.bookings = [
            {
                hotel: {
                    name: 'Canceled hotel',
                },
            },
        ] as IBookingInfo[];
        mockStores.viewBookingsStore.activeTab = 'Canceled';
        render(<BookingsList rendering={{ componentName: 'BookingsList' }} />);

        expect(screen.getByText('Canceled hotel')).toBeInTheDocument();
    });

    describe('Pill props', () => {
        const pillIcon = { value: { src: '/pill-icon.png' } };
        const pillText = { value: 'Flight + Hotel' };
        const regularPillIcon = { value: { src: '/regular-pill-icon.png' } };

        beforeEach(() => {
            (containsFAndHPromoCode as jest.Mock).mockReturnValue(false);
        });

        it('should pass PillIcon and PillText for F&H booking when mixed bookings', () => {
            (containsFAndHPromoCode as jest.Mock).mockImplementation(codes => codes && codes.includes('FH'));

            mockStores.viewBookingsStore.bookings = [
                { hotel: { name: 'FH Hotel' }, promoCollections: ['FH'] },
                { hotel: { name: 'Regular Hotel' }, promoCollections: [] },
            ] as any;

            render(
                <BookingsList
                    rendering={{ componentName: 'BookingsList' }}
                    FlightHotelPillIcon={pillIcon as any}
                    FlightHotelPillText={pillText as any}
                    RegularPillIcon={regularPillIcon as any}
                />,
            );

            const fhCall = mockBookingCard.mock.calls.find(call => call[0].booking.hotel.name === 'FH Hotel');
            const regularCall = mockBookingCard.mock.calls.find(call => call[0].booking.hotel.name === 'Regular Hotel');

            expect(fhCall[0].PillIcon).toEqual(pillIcon);
            expect(fhCall[0].PillText).toEqual(pillText);
            expect(regularCall[0].PillIcon).toEqual(regularPillIcon);
            expect(regularCall[0].PillText).toBeUndefined();
        });

        it('should not pass any pill props when there are no F&H bookings', () => {
            (containsFAndHPromoCode as jest.Mock).mockReturnValue(false);

            mockStores.viewBookingsStore.bookings = [
                { hotel: { name: 'Regular Hotel 1' }, promoCollections: [] },
                { hotel: { name: 'Regular Hotel 2' }, promoCollections: [] },
            ] as any;

            render(
                <BookingsList
                    rendering={{ componentName: 'BookingsList' }}
                    FlightHotelPillIcon={pillIcon as any}
                    FlightHotelPillText={pillText as any}
                    RegularPillIcon={regularPillIcon as any}
                />,
            );

            expect(mockBookingCard).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    PillIcon: expect.anything(),
                }),
            );
        });

        it('should pass PillIcon and PillText when all bookings are F&H', () => {
            (containsFAndHPromoCode as jest.Mock).mockReturnValue(true);

            mockStores.viewBookingsStore.bookings = [
                { hotel: { name: 'FH Hotel 1' }, promoCollections: ['FH'] },
                { hotel: { name: 'FH Hotel 2' }, promoCollections: ['FH'] },
            ] as any;

            render(
                <BookingsList
                    rendering={{ componentName: 'BookingsList' }}
                    FlightHotelPillIcon={pillIcon as any}
                    FlightHotelPillText={pillText as any}
                    RegularPillIcon={regularPillIcon as any}
                />,
            );

            expect(mockBookingCard).toHaveBeenCalledWith(
                expect.objectContaining({
                    PillIcon: pillIcon,
                    PillText: pillText,
                }),
            );
        });
    });
});
