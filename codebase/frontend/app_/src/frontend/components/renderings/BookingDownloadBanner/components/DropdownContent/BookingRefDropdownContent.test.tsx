import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockGuests, mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { groupPassengersByFlightRefs } from 'frontend/utils/passenger.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingRefDropdownContent from './BookingRefDropdownContent';

jest.mock('frontend/utils/clipboard.utils', () => ({
    copyToClipboard: jest.fn(),
}));

jest.mock('frontend/utils/passenger.utils', () => ({
    ...jest.requireActual('frontend/utils/passenger.utils'),
    groupPassengersByFlightRefs: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

const mockRoutes: IRoute[] = [mockOutboundFlight, mockInboundFlight];

describe('<BookingRefDropdownContent />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockStores.layoutStore.getPhrase = (key: string) => key;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            guests: mockGuests,
        };
        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(new Map());
    });

    it('should render booking reference when provided', () => {
        render(
            <BookingRefDropdownContent
                bookingRef='ABC123'
                bookingRoutes={mockRoutes}
                bookingRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle}
            />,
        );

        expect(screen.getByTestId('booking-ref')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    it('should not render booking reference section when bookingRef is not provided', () => {
        render(<BookingRefDropdownContent bookingRoutes={mockRoutes} />);

        expect(screen.queryByTestId('booking-ref')).not.toBeInTheDocument();
    });

    it('should render multiple flight references grouped by passengers', () => {
        const passengerMap = new Map([
            [mockOutboundFlight.extRefId, [mockGuests[0]]],
            [mockInboundFlight.extRefId, [mockGuests[1]]],
        ]);

        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(passengerMap);

        render(
            <BookingRefDropdownContent
                bookingRoutes={mockRoutes}
                flightRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsFlightRefTitle}
            />,
        );

        expect(screen.getByText(mockOutboundFlight.extRefId!)).toBeInTheDocument();
        expect(screen.getByText(mockInboundFlight.extRefId!)).toBeInTheDocument();
        expect(screen.getByText('Globals.Labels.Titles.Mrs Ann Brown')).toBeInTheDocument();
    });

    it('should call copyToClipboard when booking reference is clicked', async () => {
        const user = userEvent.setup();
        const bookingRef = 'ABC123';

        render(<BookingRefDropdownContent bookingRef={bookingRef} bookingRoutes={mockRoutes} />);

        const refButton = screen.getByTestId('booking-ref-ref-number');
        await user.click(refButton);

        expect(copyToClipboard).toHaveBeenCalledWith(bookingRef);
    });

    it('should call copyToClipboard when flight reference is clicked', async () => {
        const user = userEvent.setup();
        const flightRef = 'FL123';

        const passengerMap = new Map([[flightRef, [mockGuests[0]]]]);

        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(passengerMap);

        render(<BookingRefDropdownContent bookingRoutes={mockRoutes} />);

        const refButton = screen.getByTestId('flight-ref-ref-number');
        await user.click(refButton);

        expect(copyToClipboard).toHaveBeenCalledWith(flightRef);
    });

    it('should render help text when HelpText field is provided', () => {
        const helpText = 'Scroll to see full references';

        render(<BookingRefDropdownContent bookingRoutes={mockRoutes} helpText={{ value: helpText }} />);

        expect(screen.getByText(helpText)).toBeInTheDocument();
    });

    it('should render lead passenger pill for first passenger in each group', () => {
        const flightRef1 = 'FL123';
        const passengerMap = new Map([[flightRef1, mockGuests]]);

        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(passengerMap);

        render(<BookingRefDropdownContent bookingRoutes={mockRoutes} />);

        const leadPills = screen.getAllByText(SitecoreDictionary.BookingPassengersLabelsLeadPassenger);
        expect(leadPills).toHaveLength(1);
    });

    it('should render RichTextDictionary for booking ref help text', () => {
        render(
            <BookingRefDropdownContent
                bookingRef='ABC123'
                bookingRoutes={mockRoutes}
                bookingRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle}
            />,
        );

        expect(screen.getByTestId('booking-ref')).toBeInTheDocument();
    });

    it('should render RichTextDictionary for flight ref help text', () => {
        const passengerMap = new Map([['FL123', [mockGuests[0]]]]);
        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(passengerMap);

        render(
            <BookingRefDropdownContent
                bookingRoutes={mockRoutes}
                flightRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsFlightRefTitle}
            />,
        );

        expect(screen.getByTestId('flight-ref')).toBeInTheDocument();
    });

    it('should display all guests when no passenger grouping data available', () => {
        (groupPassengersByFlightRefs as jest.Mock).mockReturnValue(new Map());

        render(<BookingRefDropdownContent bookingRoutes={mockRoutes} />);

        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });

    describe('isFlightAndHotelPackage', () => {
        it('should render BookingReference title when isFlightAndHotelPackage is true on viewBookingStore', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;

            render(
                <BookingRefDropdownContent
                    bookingRef='ABC123'
                    bookingRoutes={mockRoutes}
                    bookingRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle}
                />,
            );

            expect(screen.getByText(SitecoreDictionary.BookingHeaderLabelsBookingReference)).toBeInTheDocument();
        });

        it('should render BookingReference title when isFlightAndHotelPackage is true on bookingStore', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = true;

            render(
                <BookingRefDropdownContent
                    bookingRef='ABC123'
                    bookingRoutes={mockRoutes}
                    bookingRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle}
                />,
            );

            expect(screen.getByText(SitecoreDictionary.BookingHeaderLabelsBookingReference)).toBeInTheDocument();
        });

        it('should render HolidayReference title when isFlightAndHotelPackage is false', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = false;

            render(
                <BookingRefDropdownContent
                    bookingRef='ABC123'
                    bookingRoutes={mockRoutes}
                    bookingRefHelpTextKey={SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle}
                />,
            );

            expect(screen.getByText(SitecoreDictionary.BookingHeaderLabelsHolidayReference)).toBeInTheDocument();
        });
    });
});
