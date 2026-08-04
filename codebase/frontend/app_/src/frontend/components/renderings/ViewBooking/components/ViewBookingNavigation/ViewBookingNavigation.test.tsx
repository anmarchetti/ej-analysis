import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking, mockHealthEntryRequirements } from 'frontend/__mocks__';
import { scrollToElement } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ViewBookingNavigation, { IBookingNavigationProps, ViewBookingAnchors } from './ViewBookingNavigation';

const createProps = (): IBookingNavigationProps => ({
    booking: mockBooking,
    bookingPdfLink: 'pdf link',
    bookingPdfFileName: 'pdf name',
    isLeadLoggedIn: false,
    showRemainingBalance: false,
});

const createStores = () =>
    createMockStores({
        trackingStore: {
            fireViewBookingEvent: jest.fn(),
        },
        viewBookingStore: {
            isFlightAndHotelPackage: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('frontend/components/common/Booking/Header/PrintButton', () => ({ onClick }) => (
    <div data-tid='print-button' onClick={onClick} />
));

const mockFileDownloadProps = jest.fn();
jest.mock('frontend/components/common/FileDownload', () => ({ children, ...rest }) => {
    mockFileDownloadProps(rest);

    return <div data-tid='file-download'>{children}</div>;
});

jest.mock('frontend/components/common/TruncatedTooltip/TruncatedTooltip', () => ({
    __esModule: true,
    TruncatedTooltip: () => <div data-tid='truncated-tooltip' />,
}));

const mockUseAnchorHighlight = jest.fn();
jest.mock('frontend/hooks/useAnchorScrollTracker', () => ({
    __esModule: true,
    useAnchorScrollTracker: props => {
        mockUseAnchorHighlight(props);
        const result = [...props.items];
        result[2] = { ...result[2], isActive: true };

        return result;
    },
}));

describe('<ViewBookingNavigation />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render summary title', () => {
        const { getByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getByTestId('sticky-box')).toBeInTheDocument();
    });

    it('should render 3 links', () => {
        const { getAllByRole } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getAllByRole('link').length).toBe(3);
    });

    it('should call scrollToElement when anchor is clicked', async () => {
        render(<ViewBookingNavigation {...mockProps} />);
        jest.spyOn(document, 'getElementById').mockReturnValue({ offsetTop: 100 } as HTMLElement);

        const anchor = screen.getAllByRole('link')[0];
        await userEvent.click(anchor);

        expect(scrollToElement).toBeCalledWith({ offsetTop: 100 }, 20);
    });

    it('should render 3 TruncatedTooltips', () => {
        const { getAllByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getAllByTestId('truncated-tooltip').length).toBe(3);
    });

    it('should render 4 TruncatedTooltips when isLeadLoggedIn', () => {
        mockProps.isLeadLoggedIn = true;
        const { getAllByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getAllByTestId('truncated-tooltip').length).toBe(4);
    });

    it('should render print button', () => {
        const { getByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getByTestId('print-button')).toBeInTheDocument();
    });

    it('should render FileDownload when isLeadLoggedIn', () => {
        mockProps.isLeadLoggedIn = true;
        const { getByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getByTestId('file-download')).toBeInTheDocument();
        expect(mockFileDownloadProps).toHaveBeenCalledWith(expect.objectContaining({ showLoginPopup: false }));
    });

    it('should render FileDownload with showLoginPopup=true when NOT isLeadLoggedIn', () => {
        mockProps.isLeadLoggedIn = false;
        const { getByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        expect(getByTestId('file-download')).toBeInTheDocument();
        expect(mockFileDownloadProps).toHaveBeenCalledWith(expect.objectContaining({ showLoginPopup: true }));
    });

    it('should render BookingSummaryButtonsDownloadTravelDocuments when isLeadLoggedIn', () => {
        mockProps.isLeadLoggedIn = true;
        render(<ViewBookingNavigation {...mockProps} />);

        expect(screen.getByTestId('file-download')).toBeInTheDocument();
    });

    it('should fire tracking event', () => {
        const { queryByTestId } = render(<ViewBookingNavigation {...mockProps} />);

        fireEvent.click(queryByTestId('print-button')!);
        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });

    it('should render Holiday Details anchor when booking has isExternalAgency flag', () => {
        mockProps.booking = { ...mockBooking, isExternalAgency: true };
        render(<ViewBookingNavigation {...mockProps} />);

        expect(screen.getByTestId('holiday-details-link')).toBeInTheDocument();
    });

    it('should render Holiday Details and Holiday Cost anchors when showRemainingBalance is true', () => {
        mockProps.showRemainingBalance = true;
        render(<ViewBookingNavigation {...mockProps} />);

        expect(screen.getByTestId('holiday-details-link')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-cost-link')).toBeInTheDocument();
    });

    it('should render Health Entry Requirements anchor when it is provided in booking', () => {
        mockProps.booking = { ...mockBooking, healthEntryRequirements: mockHealthEntryRequirements };
        render(<ViewBookingNavigation {...mockProps} />);

        expect(screen.getByTestId('health-entry-requirements-link')).toBeInTheDocument();
    });

    it('should scroll to the target element on anchor click', async () => {
        mockProps.showRemainingBalance = true;

        render(<ViewBookingNavigation {...mockProps} />);

        const holidaySummary = document.createElement('section');
        holidaySummary.id = ViewBookingAnchors.HolidayDetails.anchorId;
        document.body.appendChild(holidaySummary);

        const holidayCostAnchorElement = screen.getByTestId('holiday-details-link');

        await userEvent.click(holidayCostAnchorElement);

        expect(scrollToElement).toHaveBeenCalled();
    });

    it('should call useAnchorScrollTracker with correct props', () => {
        render(<ViewBookingNavigation {...mockProps} />);

        expect(mockUseAnchorHighlight).toHaveBeenCalledWith({
            baseOffset: 20,
            items: [
                {
                    id: 'holiday-summary',
                },
                {
                    id: 'holiday-details',
                },
                {
                    id: 'holiday-cost',
                },
            ],
        });
        expect(screen.getByTestId('holiday-cost-link')).toHaveClass('linkActive');
    });

    it('should use ViewBookingFHAnchors dictionary keys when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;

        render(<ViewBookingNavigation {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationBookingSummary,
        );
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationHolidaySummary,
        );
    });

    it('should use ViewBookingAnchors dictionary keys when isFlightAndHotelPackage is false', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = false;

        render(<ViewBookingNavigation {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationHolidaySummary,
        );
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationBookingSummary,
        );
    });

    it('should use FH anchors with correct dictionary for cost and details when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;
        mockProps.showRemainingBalance = true;

        render(<ViewBookingNavigation {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationBookingCost,
        );
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationBookingDetails,
        );
    });

    it('should use ViewBookingFHAnchors when isFlightAndHotelPackage is true on bookingStore', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = false;
        mockStores.bookingStore.isFlightAndHotelPackage = true;

        render(<ViewBookingNavigation {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationBookingSummary,
        );
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith(
            SitecoreDictionary.ViewBookingNavigationHolidaySummary,
        );
    });
});
