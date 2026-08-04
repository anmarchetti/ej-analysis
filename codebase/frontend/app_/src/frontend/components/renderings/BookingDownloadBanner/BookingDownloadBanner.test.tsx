import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';

import bookingDownloadBannerFieldsMocks from './components/__mocks__/bookingDownloadBannerFields';
import BookingDownloadBanner, { TBookingDownloadBannerProps } from './BookingDownloadBanner';

expect.extend(toHaveNoViolations);

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getPdfLinks: jest.fn(),
    getPdfRequestBody: jest.fn(),
    getBookingPdfFileName: jest.fn(),
}));

const createProps = (): TBookingDownloadBannerProps => ({
    fields: bookingDownloadBannerFieldsMocks(),
    rendering: {},
    params: {},
});

const mockBookingReferencesDropdownComponent = jest.fn();
const mockTruncatedTooltipComponent = jest.fn();
const mockFileDownloadComponent = jest.fn();
const mockPrintButtonComponent = jest.fn();

let props;
let mockStores;
let mockIsMobileViewport = false;

jest.mock('frontend/components/common/FileDownload', () => ({
    __esModule: true,
    default: props => {
        mockFileDownloadComponent(props);

        return <div data-tid='file-download'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/Booking/Header/PrintButton', () => ({
    __esModule: true,
    default: props => {
        mockPrintButtonComponent(props);

        return <button data-tid='print-button'>Print</button>;
    },
}));

jest.mock('./components/BookingReferencesDropdown', () => ({
    __esModule: true,
    default: props => {
        mockBookingReferencesDropdownComponent(props);

        return <div data-tid='booking-references-dropdown' />;
    },
}));

jest.mock('frontend/components/common/TruncatedTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTruncatedTooltipComponent(props);

        return <div data-tid='tooltip' />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingDownloadBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
        mockIsMobileViewport = false;
        mockStores.trackingStore = {
            ...mockStores.trackingStore,
            fireViewBookingEvent: jest.fn(),
        };
    });

    it('should standard render', () => {
        const mockedBooking = mockStores.viewBookingStore.booking;

        render(<BookingDownloadBanner {...props} />);

        expect(mockFileDownloadComponent).toHaveBeenCalled();
        expect(mockBookingReferencesDropdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isCopyButtonShown: false,
                bookingReference: mockedBooking.bookingReference,
                bookingRoutes: mockedBooking.package.transport.routes,
            }),
        );

        expect(screen.getByTestId('file-download')).toBeInTheDocument();
        expect(mockFileDownloadComponent).toHaveBeenCalledWith(expect.objectContaining({ showLoginPopup: false }));
        expect(mockTruncatedTooltipComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                text: props.fields.TravelDocumentsTitle.value,
            }),
        );
    });

    it('should pass an empty array into the dropdown component when booking routes is not defined', () => {
        mockStores.viewBookingStore.booking.package.transport.routes = undefined;

        render(<BookingDownloadBanner {...props} />);

        expect(mockBookingReferencesDropdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                bookingRoutes: [],
            }),
        );
    });

    it('should display copy ref number button on mobile devices', () => {
        mockIsMobileViewport = true;

        render(<BookingDownloadBanner {...props} />);

        expect(mockBookingReferencesDropdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isCopyButtonShown: true,
            }),
        );
    });

    it('should not render download button when booking is created on trade portal', () => {
        mockStores.viewBookingStore.booking.isExternalAgency = true;

        render(<BookingDownloadBanner {...props} />);

        expect(mockFileDownloadComponent).not.toHaveBeenCalled();
    });

    it('should render download button with showLoginPopup=true when user is not logged as lead passenger', () => {
        mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = false;
        mockStores.viewBookingStore.booking.isExternalAgency = false;

        render(<BookingDownloadBanner {...props} />);

        expect(mockFileDownloadComponent).toHaveBeenCalledWith(expect.objectContaining({ showLoginPopup: true }));
    });

    it('should not render the component when booking is not defined', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<BookingDownloadBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when sitecore fields are not defined', () => {
        props.fields = undefined;

        const { container } = render(<BookingDownloadBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render print button', () => {
        render(<BookingDownloadBanner {...props} />);

        expect(screen.getByTestId('print-button')).toBeInTheDocument();
        expect(mockPrintButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isLabelHidden: true,
                isText: true,
                dataTid: 'print-btn',
            }),
        );
    });

    it('should call tracking event when print button is clicked', async () => {
        render(<BookingDownloadBanner {...props} />);

        const printButton = mockPrintButtonComponent.mock.calls[0][0];
        printButton.onClick();

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });

    it('should render booking reference dropdown with correct id', () => {
        render(<BookingDownloadBanner {...props} />);

        expect(screen.getByTestId('booking-references-dropdown')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BookingDownloadBanner {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
