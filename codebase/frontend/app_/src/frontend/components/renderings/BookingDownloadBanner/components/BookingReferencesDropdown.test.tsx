import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { getFlightsReferences } from 'frontend/utils/route.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import bookingDownloadBannerFieldsMocks from './__mocks__/bookingDownloadBannerFields';
import BookingReferencesDropdown, { TBookingReferencesDropdownProps } from './BookingReferencesDropdown';

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            isFlightAndHotelPackage: false,
        },
    });

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/route.utils', () => ({
    getFlightsReferences: jest.fn(() => []),
}));

jest.mock('frontend/utils/clipboard.utils', () => ({
    copyToClipboard: jest.fn(),
}));

const createProps = (): TBookingReferencesDropdownProps => ({
    bookingReference: 'holiday-reference-code-123',
    bookingRoutes: [],
    isCopyButtonShown: false,
    fields: bookingDownloadBannerFieldsMocks(),
});

const mockBookingReferencesDropdownItemComponent = jest.fn();
const mockBookingRefDropdownContentComponent = jest.fn();
let props: TBookingReferencesDropdownProps;

jest.mock('./BookingReferencesDropdownItem', () => ({
    __esModule: true,
    default: props => {
        mockBookingReferencesDropdownItemComponent(props);

        return <li data-tid='booking-ref-dropdown-item' />;
    },
}));

jest.mock('./DropdownContent/BookingRefDropdownContent', () => ({
    __esModule: true,
    default: props => {
        mockBookingRefDropdownContentComponent(props);

        return <div data-tid='booking-ref-dropdown-content' />;
    },
}));

describe('<BookingReferencesDropdown />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<BookingReferencesDropdown {...props} />);

        expect(screen.getByTestId('booking-ref-dropdown')).not.toHaveClass('isExpanded');
        expect(
            screen.getByRole('button', { name: `${props.fields.ReferencesTitle.value} ${props.bookingReference}` }),
        ).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');

        expect(listItems).toHaveLength(1);
        expect(mockBookingReferencesDropdownItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                refNumber: props.bookingReference,
                title: props.fields.HolidayReferenceTitle.value,
                description: props.fields.HolidayReferenceDescription.value,
                ariaLabel: props.fields.CopyButtonAriaLabel.value,
                isCopyButtonShown: false,
            }),
        );
    });

    it('should render flight and holiday references info when it is exists', () => {
        const flightReferenceCode = 'flight-reference-code-123';

        (getFlightsReferences as any).mockReturnValueOnce([flightReferenceCode]);

        render(<BookingReferencesDropdown {...props} />);

        const listItems = screen.getAllByRole('listitem');

        expect(listItems).toHaveLength(2);
        expect(mockBookingReferencesDropdownItemComponent).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                refNumber: props.bookingReference,
                title: props.fields.HolidayReferenceTitle.value,
                description: props.fields.HolidayReferenceDescription.value,
            }),
        );

        expect(mockBookingReferencesDropdownItemComponent).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                refNumber: flightReferenceCode,
                title: props.fields.FlightReferenceTitle.value,
                description: props.fields.FlightReferenceDescription.value,
            }),
        );
    });

    it('should expand and collapse dropdown on click', async () => {
        render(<BookingReferencesDropdown {...props} />);

        const btn = screen.getByRole('button', {
            name: `${props.fields.ReferencesTitle.value} ${props.bookingReference}`,
        });

        await userEvent.click(btn);
        expect(screen.getByTestId('booking-ref-dropdown')).toHaveClass('isExpanded');

        await userEvent.click(btn);
        expect(screen.getByTestId('booking-ref-dropdown')).not.toHaveClass('isExpanded');
    });

    it('should render BookingRefDropdownContent when there are multiple flight references', () => {
        const flightReferenceCode1 = 'flight-reference-code-123';
        const flightReferenceCode2 = 'flight-reference-code-456';

        (getFlightsReferences as any).mockReturnValueOnce([flightReferenceCode1, flightReferenceCode2]);

        render(<BookingReferencesDropdown {...props} />);

        expect(screen.getByTestId('booking-ref-dropdown-content')).toBeInTheDocument();
        expect(screen.getByTestId('booking-ref-dropdown')).toHaveClass('multipleFlights');

        expect(mockBookingRefDropdownContentComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                bookingRef: props.bookingReference,
                bookingRoutes: props.bookingRoutes,
                bookingRefHelpTextKey: SitecoreDictionary.BookingHeaderLabelsMultipleFlightHolidayRefTitle,
                flightRefHelpTextKey: SitecoreDictionary.BookingHeaderLabelsMultipleFlightRefTitle,
            }),
        );
    });

    it('should render BookingRefTitle title when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;
        const flightReferenceCode1 = 'flight-reference-code-123';
        const flightReferenceCode2 = 'flight-reference-code-456';

        (getFlightsReferences as any).mockReturnValueOnce([flightReferenceCode1, flightReferenceCode2]);

        render(<BookingReferencesDropdown {...props} />);

        expect(mockBookingRefDropdownContentComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                bookingRefHelpTextKey: SitecoreDictionary.BookingHeaderLabelsMultipleFlightBookingRefTitle,
            }),
        );
    });

    it('should render individual dropdown items when there is only one flight reference', () => {
        const flightReferenceCode = 'flight-reference-code-123';

        (getFlightsReferences as any).mockReturnValueOnce([flightReferenceCode]);

        render(<BookingReferencesDropdown {...props} />);

        expect(screen.queryByTestId('booking-ref-dropdown-content')).not.toBeInTheDocument();
        expect(mockBookingReferencesDropdownItemComponent).toHaveBeenCalledTimes(2);
    });

    it('should render individual dropdown items when there are no flight references', () => {
        (getFlightsReferences as any).mockReturnValueOnce([]);

        render(<BookingReferencesDropdown {...props} />);

        expect(screen.queryByTestId('booking-ref-dropdown-content')).not.toBeInTheDocument();
        expect(mockBookingReferencesDropdownItemComponent).toHaveBeenCalledTimes(1);
    });
});
