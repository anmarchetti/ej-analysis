import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { convertHtmlToTextWithReplacingBRsWithSpaces } from 'frontend/utils/string.utils';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { BookedAirportParking, IBookedAirportParkingFields } from './BookedAirportParking';

const REFERENCE_NUMBER: string = 'XUGHJK';
const REFERENCE_NUMBER_LABEL: string = 'Reference #';
const YOUR_PARKING_TEXT: string = 'Your Parking';
const FAQ_TEXT: string =
    'If you need to change or cancel your airport parking, please refer to out <a rel="" href="https://www.easyjet.com/en/holidays/help" target="_blank">Frequently Asked Questions</a>.';
const CAR_REGISTRATION_TEXT: string = 'Car Registration';
const CAR_REGISTRATION_LINK: string = 'https://www.holidayextras.com/easyjetholidays/manage-booking.html?agent=AJ514';

let mockProps;
let mockStores;

const createProps = (): ISitecoreComponent<IBookedAirportParkingFields> => ({
    fields: {
        BookedAirportParkingReferenceTitle: mockSitecoreField(REFERENCE_NUMBER_LABEL),
        BookedAirportParkingSectionTitle: mockSitecoreField(YOUR_PARKING_TEXT),
        BookedAirportParkingBottomLine: mockSitecoreField(FAQ_TEXT),
        BookedAirportParkingCarRegistrationButton: mockSitecoreField(
            mockSitecoreLinkField(CAR_REGISTRATION_LINK, CAR_REGISTRATION_TEXT, SitecoreLinkType.External),
        ),
    },
    params: {},
    rendering: undefined,
});

const testBooking = {
    ...mockBooking,
    bookingStatus: BookingStatus.Booking,
    airportParking: {
        ...mockBooking.airportParking,
        bookingDetails: {
            ...mockBooking.airportParking?.bookingDetails,
            extRefId: REFERENCE_NUMBER,
        },
    },
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    formatDateL10n: jest.fn(date => date),
    getTimeWithoutSeconds: jest.fn(time => time),
}));

describe('<BookedAirportParking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isViewBookingPage: true,
            },
            viewBookingStore: {
                booking: deepClone(testBooking),
            },
            bookingStore: {
                booking: deepClone(testBooking),
            },
        });
    });

    it('should render correctly the part of the component that is always displayed', () => {
        const title: string = mockStores.viewBookingStore.booking.airportParking.title;
        const address: string = mockStores.viewBookingStore.booking.airportParking.address;
        render(<BookedAirportParking {...mockProps} />);
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(`${REFERENCE_NUMBER_LABEL} ${REFERENCE_NUMBER}`)).toBeInTheDocument();
        expect(screen.getByText(convertHtmlToTextWithReplacingBRsWithSpaces(address))).toBeInTheDocument();
        expect(screen.getByTestId('booked-airport-parking-title')).toBeInTheDocument();
    });

    it.each([testBooking, null])(
        'should render correctly the part of the component that is always displayed when viewBookingStore is null',
        viewBookingStoreValue => {
            mockStores.viewBookingStore.booking = viewBookingStoreValue;
            const title: string = testBooking.airportParking.title!;
            const address: string = testBooking.airportParking.address!;

            render(<BookedAirportParking {...mockProps} />);

            expect(screen.getByText(title)).toBeInTheDocument();
            expect(screen.getByText(`${REFERENCE_NUMBER_LABEL} ${REFERENCE_NUMBER}`)).toBeInTheDocument();
            expect(screen.getByText(convertHtmlToTextWithReplacingBRsWithSpaces(address))).toBeInTheDocument();
            expect(screen.getByTestId('booked-airport-parking-title')).toBeInTheDocument();
        },
    );

    it('should render correctly the part of the component that is only visible in the view booking page', () => {
        mockStores.layoutStore.isViewBookingPage = true;
        render(<BookedAirportParking {...mockProps} />);

        const carRegistrationButton = screen.getByRole('button', { name: CAR_REGISTRATION_TEXT });

        expect(carRegistrationButton).toBeInTheDocument();
        expect(carRegistrationButton).not.toHaveAttribute('disabled');
        expect(screen.getByTestId('bottom-line')).toBeInTheDocument();
    });

    it('should not render the part of the component that is only visible in the view booking page', () => {
        mockStores.layoutStore.isViewBookingPage = false;
        render(<BookedAirportParking {...mockProps} />);
        expect(screen.queryByRole('button', { name: CAR_REGISTRATION_TEXT })).not.toBeInTheDocument();
        expect(screen.queryByTestId('bottom-line')).not.toBeInTheDocument();
    });

    it('should render null if selectedAirportParking is null', () => {
        mockStores.viewBookingStore.booking.airportParking = null;

        const { container } = render(<BookedAirportParking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render null if booking is null', () => {
        mockStores.viewBookingStore.booking = null;
        mockStores.bookingStore.booking = null;

        const { container } = render(<BookedAirportParking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render sitecore fields when their value is null', () => {
        mockProps.fields = {
            BookedAirportParkingReferenceTitle: null,
            BookedAirportParkingSectionTitle: null,
            BookedAirportParkingBottomLine: null,
            BookedAirportParkingCarRegistrationButton: null,
        };

        render(<BookedAirportParking {...mockProps} />);

        expect(screen.queryByTestId('booked-airport-parking-title')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: CAR_REGISTRATION_TEXT })).not.toBeInTheDocument();
        expect(screen.queryByTestId('bottom-line')).not.toBeInTheDocument();
    });

    it('should NOT render sitecore fields when they are null', () => {
        mockProps.fields = null;

        render(<BookedAirportParking {...mockProps} />);

        expect(screen.queryByTestId('booked-airport-parking-title')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: CAR_REGISTRATION_TEXT })).not.toBeInTheDocument();
        expect(screen.queryByTestId('bottom-line')).not.toBeInTheDocument();
    });

    it('should NOT render car registration button and FAQ when the booking is canceled', () => {
        mockStores.viewBookingStore.booking.bookingStatus = BookingStatus.Canceled;
        render(<BookedAirportParking {...mockProps} />);

        expect(screen.getByTestId('booked-airport-parking-title')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: CAR_REGISTRATION_TEXT })).not.toBeInTheDocument();
        expect(screen.queryByTestId('bottom-line')).not.toBeInTheDocument();
    });

    it('should remove br from the address of the parking', () => {
        mockStores.viewBookingStore.booking.airportParking.address = `Holiday Extras <span style="font-weight:bold">Park & Ride</span> by Purple Parking - all terminals
    Charlwood Road,<br />Lowfield Heath,<br />Crawley<br />RH11 0QB`;

        render(<BookedAirportParking {...mockProps} />);
        expect(
            screen.getByText(
                'Holiday Extras Park &amp; Ride by Purple Parking - all terminals Charlwood Road, Lowfield Heath, Crawley RH11 0QB',
            ),
        ).toBeInTheDocument();
    });

    it('should display only the label for Reference and hash if there is no reference number', () => {
        mockStores.viewBookingStore.booking.airportParking.bookingDetails.extRefId = undefined;
        render(<BookedAirportParking {...mockProps} />);

        expect(screen.getByText(REFERENCE_NUMBER_LABEL)).toBeInTheDocument();
        expect(screen.queryByText(REFERENCE_NUMBER)).not.toBeInTheDocument();
    });

    it('should display only the reference number if there is no reference number label', () => {
        mockProps.fields = {
            BookedAirportParkingReferenceTitle: mockSitecoreField(''),
        };
        render(<BookedAirportParking {...mockProps} />);

        expect(screen.getByText(REFERENCE_NUMBER)).toBeInTheDocument();
        expect(screen.queryByText(REFERENCE_NUMBER_LABEL)).not.toBeInTheDocument();
    });

    it('should open the right URL when the button is clicked', async () => {
        window.open = jest.fn();
        const { fields } = mockProps;
        const leadGuestLastName: string = mockStores.viewBookingStore.booking.guests[0].lastName;

        const expectedUrl: string = `${fields.BookedAirportParkingCarRegistrationButton.value.href}&bkref=${REFERENCE_NUMBER}&surname=${leadGuestLastName}`;

        render(<BookedAirportParking {...mockProps} />);
        const carRegistrationButton = screen.getByRole('button', { name: CAR_REGISTRATION_TEXT });
        await userEvent.click(carRegistrationButton);

        expect(window.open).toHaveBeenCalledWith(
            expectedUrl,
            mockProps.fields.BookedAirportParkingCarRegistrationButton.value.target,
        );
        expect(window.open).toHaveBeenCalledTimes(1);
    });

    it.each([undefined, null, ''])(`should disable the button if the value of is '%s'`, async extRefId => {
        window.open = jest.fn();
        mockStores.viewBookingStore.booking.airportParking.bookingDetails.extRefId = extRefId;
        render(<BookedAirportParking {...mockProps} />);
        const carRegistrationButton = screen.getByRole('button', { name: CAR_REGISTRATION_TEXT });

        await userEvent.click(carRegistrationButton);

        expect(window.open).toHaveBeenCalledTimes(0);
        expect(carRegistrationButton).toHaveAttribute('disabled');
    });
});
