import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingRefs, { IBookingRefsProps } from './BookingRefs';

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

jest.mock('frontend/utils/clipboard.utils', () => ({
    __esModule: true,
    copyToClipboard: jest.fn(),
}));

jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-tid='tooltip'>{content}</div>,
}));

const mockFlightReferenceItem = jest.fn();
jest.mock('./FlightReferenceItem/FlightReferenceItem', () => ({
    __esModule: true,
    default: props => {
        mockFlightReferenceItem(props);

        return <div data-tid='flight-ref' />;
    },
}));

const mockReferenceItem = jest.fn();
jest.mock('./ReferenceItem/ReferenceItem', () => ({
    __esModule: true,
    default: props => {
        mockReferenceItem(props);

        return <div data-tid='reference-item' onClick={props.onClick} />;
    },
}));

const createProps = (): IBookingRefsProps => ({
    bookingRoutes: [],
    referenceNumber: 'referenceNumber',
    hasTooltips: true,
});

let props = createProps();

describe('<BookingRefs />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render flight and booking ref', () => {
        render(<BookingRefs {...props} />);
        const bookingReferenceItem = screen.getByTestId('reference-item');

        expect(bookingReferenceItem).toBeInTheDocument();
        expect(mockReferenceItem).toHaveBeenCalledWith({
            dataTid: 'booking-ref',
            referenceNumber: props.referenceNumber,
            title: SitecoreDictionary.BookingHeaderLabelsHolidayReference,
            tooltip: SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle,
            onClick: expect.any(Function),
        });
        fireEvent.click(bookingReferenceItem);
        expect(copyToClipboard).toHaveBeenCalledWith(props.referenceNumber);

        expect(screen.getByTestId('flight-ref')).toBeInTheDocument();
        expect(mockFlightReferenceItem).toHaveBeenCalledWith({
            flights: props.bookingRoutes,
            hasTooltips: props.hasTooltips,
            scrollToSeeFullReferences: undefined,
        });
    });

    it('should pass ScrollToSeeFullReferences to FlightReferenceItem', () => {
        const scrollField = mockSitecoreField('Scroll to see full references');
        props.scrollToSeeFullReferences = scrollField;

        render(<BookingRefs {...props} />);

        expect(mockFlightReferenceItem).toHaveBeenCalledWith({
            flights: props.bookingRoutes,
            hasTooltips: props.hasTooltips,
            scrollToSeeFullReferences: scrollField,
        });
    });

    describe('isFlightAndHotelPackage', () => {
        it('should render BookingReference title when isFlightAndHotelPackage is true', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;

            render(<BookingRefs {...props} />);

            expect(mockReferenceItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: SitecoreDictionary.BookingHeaderLabelsBookingReference,
                    tooltip: SitecoreDictionary.BookingHeaderLabelsBookingRefTitle,
                }),
            );
        });

        it('should render BookingReference title when isFlightAndHotelPackage is true on bookingStore', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;
            mockStores.bookingStore.isFlightAndHotelPackage = true;

            render(<BookingRefs {...props} />);

            expect(mockReferenceItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: SitecoreDictionary.BookingHeaderLabelsBookingReference,
                    tooltip: SitecoreDictionary.BookingHeaderLabelsBookingRefTitle,
                }),
            );
        });

        it('should render HolidayReference title when isFlightAndHotelPackage is false', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;

            render(<BookingRefs {...props} />);

            expect(mockReferenceItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: SitecoreDictionary.BookingHeaderLabelsHolidayReference,
                    tooltip: SitecoreDictionary.BookingHeaderLabelsHolidayRefTitle,
                }),
            );
        });
    });
});
