import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingToolbar, { TBookingToolbarProps } from './BookingToolbar';

const mockBookingRefs = jest.fn();
jest.mock('frontend/components/common/Booking/BookingRefs/BookingRefs', () => ({
    __esModule: true,
    default: props => {
        mockBookingRefs(props);

        return <div data-tid='booking-refs' />;
    },
}));

const mockPrintButton = jest.fn();
jest.mock('frontend/components/common/Booking/Header/PrintButton', () => ({
    __esModule: true,
    default: props => {
        mockPrintButton(props);

        return (
            <button data-tid='print-button' onClick={props.onClick}>
                Print
            </button>
        );
    },
}));

const mockFileDownload = jest.fn();
jest.mock('frontend/components/common/FileDownload', () => ({
    __esModule: true,
    default: props => {
        mockFileDownload(props);

        return <button data-tid={props.buttonDataTid} onClick={props.onClick} />;
    },
}));

const mockLink = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLink(props);

        return (
            <a data-tid='check-in-link' {...props}>
                {children}
            </a>
        );
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text'>{props.field?.value}</div>;
    },
}));

const createProps = (): TBookingToolbarProps => ({
    fields: {
        CancelledOnLabel: mockSitecoreField('CancelledOnLabel'),
        CheckInNowLabel: mockSitecoreField('CheckInNowLabel'),
    },
    rendering: {},
    params: {},
});

let props: TBookingToolbarProps;
let mockContext;
let mockStores;
let mockIsMoreThenTabletViewport = false;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockIsMoreThenTabletViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: jest.fn(() => mockContext),
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: jest.fn(selector => selector(mockStores)),
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    getCheckInLink: jest.fn(() => 'check-in-link'),
    getPdfLinks: jest.fn(() => 'pdf-link'),
    getPdfRequestBody: jest.fn(() => ({ bookingReference: 'ref', lastName: 'name', date: 'date' })),
    getBookingPdfFileName: jest.fn(() => 'booking.pdf'),
}));

jest.mock('react-intersection-observer', () => ({
    useInView: jest.fn(() => ({ ref: jest.fn(), inView: false })),
}));

describe('<BookingToolbar />', () => {
    beforeEach(() => {
        props = createProps();
        mockContext = {
            booking: mockBooking,
        };
        mockStores = createMockStores({
            layoutStore: {
                getPhrase: jest.fn(key => key),
                getSetting: jest.fn(),
                isTradePortal: false,
                isHotelCheckInEnabled: false,
            },
            bookingStore: {
                isCheckInAvailable: jest.fn(() => false),
            },
            trackingStore: {
                fireViewBookingEvent: jest.fn(),
            },
        });
        mockIsMoreThenTabletViewport = false;
    });

    it('should NOT render the component when booking is NOT defined', () => {
        mockContext.booking = undefined;

        const { container } = render(<BookingToolbar {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        mockContext.booking.isLoggedInAsLeadPassenger = true;
        mockContext.booking.isExternalAgency = false;

        render(<BookingToolbar {...props} />);

        expect(screen.getByTestId('booking-toolbar')).toHaveClass('toolbar');
        expect(mockBookingRefs).toHaveBeenCalledWith({
            bookingRoutes: mockBooking.package.transport.routes,
            referenceNumber: mockBooking.bookingReference,
            hasTooltips: true,
        });
        expect(screen.getByTestId('booking-refs')).toBeInTheDocument();
        expect(screen.queryByTestId('cancelled-info')).not.toBeInTheDocument();
        expect(screen.getByTestId('toolbar-buttons')).toBeInTheDocument();
    });

    it('should render cancelled info when booking is cancelled', () => {
        mockContext.booking.bookingStatus = BookingStatus.Canceled;
        mockContext.booking.cancellationDate = '12-12-2020';

        render(<BookingToolbar {...props} />);

        expect(screen.getByTestId('cancelled-info')).toHaveClass('cancelledInfo');
        expect(screen.getByText(props.fields!.CancelledOnLabel.value)).toBeInTheDocument();
        expect(screen.getByTestId('cancelled-date')).toHaveTextContent('12/12/2020');
    });

    describe('Print Button', () => {
        beforeEach(() => {
            mockContext.booking.bookingStatus = BookingStatus.Booking;
        });

        it('should render print button when viewport is more than tablet', () => {
            mockIsMoreThenTabletViewport = true;

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('print-button')).toBeInTheDocument();
            expect(mockPrintButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isText: true,
                    dataTid: 'print-btn-toolbar',
                }),
            );
        });

        it('should NOT render print button when viewport is NOT more than tablet', () => {
            mockIsMoreThenTabletViewport = false;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('print-button')).not.toBeInTheDocument();
        });

        it('should call tracking event when print button is clicked', async () => {
            mockIsMoreThenTabletViewport = true;
            const user = userEvent.setup();

            render(<BookingToolbar {...props} />);

            await user.click(screen.getByTestId('print-button'));

            expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
        });
    });

    describe('File Download Button', () => {
        beforeEach(() => {
            mockContext.booking.bookingStatus = BookingStatus.Booking;
        });

        it('should render file download button when lead is logged in', () => {
            mockContext.booking.isLoggedInAsLeadPassenger = true;
            mockContext.booking.isExternalAgency = false;

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('download-btn-toolbar')).toBeInTheDocument();
            expect(mockFileDownload).toHaveBeenCalledWith(
                expect.objectContaining({
                    fileName: 'booking.pdf',
                    fileURL: 'pdf-link',
                    buttonDataTid: 'download-btn-toolbar',
                    showLoginPopup: false,
                }),
            );
        });

        it('should render file download with showLoginPopup=true when user is NOT logged in as lead passenger', () => {
            mockContext.booking.isLoggedInAsLeadPassenger = false;

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('download-btn-toolbar')).toBeInTheDocument();
            expect(mockFileDownload).toHaveBeenCalledWith(
                expect.objectContaining({
                    showLoginPopup: true,
                    fileName: 'booking.pdf',
                    fileURL: 'pdf-link',
                    buttonDataTid: 'download-btn-toolbar',
                }),
            );
        });

        it('should NOT render file download when booking is external agency', () => {
            mockContext.booking.isLoggedInAsLeadPassenger = true;
            mockContext.booking.isExternalAgency = true;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('file-download')).not.toBeInTheDocument();
        });

        it('should call tracking event when download button is clicked', async () => {
            mockContext.booking.isLoggedInAsLeadPassenger = true;
            mockContext.booking.isExternalAgency = false;
            const user = userEvent.setup();

            render(<BookingToolbar {...props} />);

            await user.click(screen.getByTestId('download-btn-toolbar'));

            expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
        });
    });

    describe('Flight Check-In Button', () => {
        beforeEach(() => {
            mockContext.booking.bookingStatus = BookingStatus.Booking;
        });

        it('should render check-in button when check-in is available', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('check-in-link')).toBeInTheDocument();
            expect(mockLink).toHaveBeenCalledWith(
                expect.objectContaining({
                    href: 'check-in-link',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                }),
            );
        });

        it('should NOT render check-in button when check-in is NOT available', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => false);

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('check-in-link')).not.toBeInTheDocument();
        });

        it('should render check-in now label when check-in is available', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('rich-text')).toBeInTheDocument();
            expect(mockRichTextWithLinks).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: props.fields!.CheckInNowLabel,
                }),
            );
        });

        it('should NOT render check-in now label when booking is Flight & Hotel package', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
        });
    });

    describe('VAT Document Download', () => {
        beforeEach(() => {
            mockContext.booking.bookingStatus = BookingStatus.Booking;
            mockContext.booking.isLoggedInAsLeadPassenger = true;
            mockContext.booking.isExternalAgency = false;
            mockStores.viewBookingStore.isFlightAndHotelPackage = true;
            mockStores.viewBookingStore.isPostTravelPage = true;
        });

        it('should render VAT doc download when all conditions are met', () => {
            render(<BookingToolbar {...props} />);

            expect(mockFileDownload).toHaveBeenCalledWith(
                expect.objectContaining({
                    errorMessage: SitecoreDictionary.FlightPlusHotelPaymentReceiptDownloadError,
                    showLoginPopup: false,
                    buttonDataTid: 'download-receipt-toolbar',
                    fileName: 'Payment receipt.pdf',
                }),
            );
        });

        it('should NOT render VAT doc download when NOT a flight and hotel package', () => {
            mockStores.viewBookingStore.isFlightAndHotelPackage = false;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('download-receipt-toolbar')).not.toBeInTheDocument();
        });

        it('should NOT render VAT doc download when NOT post travel page', () => {
            mockStores.viewBookingStore.isPostTravelPage = false;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('download-receipt-toolbar')).not.toBeInTheDocument();
        });

        it('should render VAT doc download with showLoginPopup=true when NOT logged in as lead passenger', () => {
            mockContext.booking.isLoggedInAsLeadPassenger = false;

            render(<BookingToolbar {...props} />);

            expect(mockFileDownload).toHaveBeenCalledWith(
                expect.objectContaining({
                    errorMessage: SitecoreDictionary.FlightPlusHotelPaymentReceiptDownloadError,
                    showLoginPopup: true,
                    buttonDataTid: 'download-receipt-toolbar',
                    fileName: 'Payment receipt.pdf',
                }),
            );
        });

        it('should NOT render VAT doc download when booking is from external agency', () => {
            mockContext.booking.isExternalAgency = true;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('download-receipt-toolbar')).not.toBeInTheDocument();
        });

        it('should call tracking event when VAT doc download button is clicked', async () => {
            const user = userEvent.setup();

            render(<BookingToolbar {...props} />);

            const fileDownloadButtons = screen.getByTestId('download-receipt-toolbar');
            await user.click(fileDownloadButtons);

            expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
        });
    });

    describe('Post Travel Page', () => {
        beforeEach(() => {
            mockContext.booking.bookingStatus = BookingStatus.Booking;
            mockStores.viewBookingStore.isPostTravelPage = true;
        });

        it('should show toolbar-buttons on post travel page without other conditions met', () => {
            mockContext.booking.isLoggedInAsLeadPassenger = false;

            render(<BookingToolbar {...props} />);

            expect(screen.getByTestId('toolbar-buttons')).toBeInTheDocument();
        });

        it('should NOT render print button on post travel page even on large viewport', () => {
            mockIsMoreThenTabletViewport = true;

            render(<BookingToolbar {...props} />);

            expect(screen.queryByTestId('print-button')).not.toBeInTheDocument();
        });

        it('should pass hasTooltips as false to BookingRefs on post travel page', () => {
            render(<BookingToolbar {...props} />);

            expect(mockBookingRefs).toHaveBeenCalledWith(expect.objectContaining({ hasTooltips: false }));
        });
    });

    it('should NOT render buttons-container when booking is canceled', () => {
        mockContext.booking.bookingStatus = BookingStatus.Canceled;

        render(<BookingToolbar {...props} />);

        expect(screen.queryByTestId('buttons-container')).not.toBeInTheDocument();
    });

    it('should NOT render buttons when it is trade portal', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<BookingToolbar {...props} />);

        expect(screen.queryByTestId('toolbar-buttons')).not.toBeInTheDocument();
    });
});
