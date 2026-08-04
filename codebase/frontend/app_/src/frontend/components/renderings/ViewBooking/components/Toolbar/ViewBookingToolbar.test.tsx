import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

import ViewBookingToolbar, { IViewBookingToolbarProps } from './ViewBookingToolbar';

let mockIsMoreThenTabletViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockIsMoreThenTabletViewport,
}));

jest.mock('frontend/components/common/Booking/Header/PrintButton', () => ({ onClick }) => (
    <div data-tid='print-button' onClick={onClick} />
));

const mockFileDownloadProps = jest.fn();
jest.mock('frontend/components/common/FileDownload', () => ({
    __esModule: true,
    default: ({ onClick, buttonClassName, ...rest }) => {
        mockFileDownloadProps({ onClick, buttonClassName, ...rest });

        return <button data-tid={rest.buttonDataTid} onClick={onClick} />;
    },
}));

const mockPlaceholder = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholder(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockBookingRefsProps = jest.fn();
jest.mock('frontend/components/common/Booking/BookingRefs/BookingRefs', () => ({
    __esModule: true,
    default: props => {
        mockBookingRefsProps(props);

        return <div data-tid='booking-refs' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid={props.dataTid} onClick={props.onClick} />;
    },
}));

const mockLinkProps = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLinkProps(props);

        return <a {...props}>{children}</a>;
    },
}));

const mockHotelCheckInPopupProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/HotelCheckInPopup/HotelCheckInPopup', () => ({
    __esModule: true,
    default: props => {
        mockHotelCheckInPopupProps(props);

        return <div data-tid='hotel-check-in-popup' onClick={props.onClose} />;
    },
}));

const createProps = (): IViewBookingToolbarProps => ({
    booking: mockBooking,
    bookingPdfLink: 'file-link',
    bookingPdfFileName: 'file',
    isLeadLoggedIn: false,
    isBookingCanceled: false,
    rendering: {} as ComponentRendering,
    fields: {
        ManageHubLabel: {
            value: 'ManageHubLabel',
        },
    } as IViewBookingFields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isTradePortal: false,
            isHotelCheckInEnabled: false,
        },
        trackingStore: {
            fireViewBookingEvent: jest.fn(),
        },
        routerStore: {
            isBookingConfirmationPage: jest.fn(() => false),
        },
        bookingStore: {
            isCheckInAvailable: jest.fn(() => false),
        },
        viewBookingStore: {
            isMicroAppManageMyHolidayAllowed: false,
            isB2BAmendmentAllowed: false,
        },
    });

let props = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockCheckInLink: string | undefined = 'check-in-link';
jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    getCheckInLink: jest.fn(() => mockCheckInLink),
    getPdfRequestBody: jest.fn(() => ({ bookingReference: 'ref', lastName: 'name', date: 'date' })),
}));

let mockGetFlightsReferences = ['ref 1'];
jest.mock('frontend/utils/route.utils', () => ({
    __esModule: true,
    getFlightsReferences: jest.fn(() => mockGetFlightsReferences),
}));

const mockManageHubCTAProps = jest.fn();
jest.mock('./components/ManageHubCTA/ManageHubCTA', () => ({
    __esModule: true,
    ManageHubCTA: props => {
        mockManageHubCTAProps(props);

        return <div data-tid='manage-hub' />;
    },
}));

describe('<ViewBookingToolbar />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
        mockIsMoreThenTabletViewport = true;
        mockCheckInLink = 'check-in-link';
        mockGetFlightsReferences = ['ref 1'];
    });

    it('should render component', () => {
        render(<ViewBookingToolbar {...props} />);

        expect(screen.getByTestId('booking-refs')).toBeInTheDocument();
        expect(mockBookingRefsProps).toHaveBeenCalledWith({
            bookingRoutes: mockBooking.package?.transport?.routes,
            referenceNumber: mockBooking.bookingReference,
            hasTooltips: true,
            scrollToSeeFullReferences: props.fields!.ScrollToSeeFullReferences,
        });

        expect(mockPlaceholder).toHaveBeenCalledWith({
            name: PlaceholderNames.ToolbarTopSection,
            rendering: props.rendering,
        });
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });

    describe('Print button', () => {
        it('should render print button for large screens', () => {
            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByTestId('print-button')).toBeInTheDocument();
        });

        it('should NOT render print button for NOT large screens', () => {
            mockIsMoreThenTabletViewport = false;
            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('print-button')).not.toBeInTheDocument();
        });

        it('should fire tracking event', async () => {
            render(<ViewBookingToolbar {...props} />);

            await userEvent.click(screen.getByTestId('print-button'));
            expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
        });
    });

    describe('Travel Document button', () => {
        it('should render travel document button when lead is logged in', () => {
            props.isLeadLoggedIn = true;
            render(<ViewBookingToolbar {...props} />);

            expect(mockFileDownloadProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showLoginPopup: false,
                    buttonDataTid: 'download-btn-toolbar',
                    buttonClassName: 'transparentBtn travelDocumentBtn',
                }),
            );
        });

        it('should render travel document button with showLoginPopup=true when lead is NOT logged in', () => {
            render(<ViewBookingToolbar {...props} />);

            expect(mockFileDownloadProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showLoginPopup: true,
                    buttonDataTid: 'download-btn-toolbar',
                    buttonClassName: 'transparentBtn travelDocumentBtn',
                }),
            );
        });

        it('should NOT render travel document button when user is logged in but bookingPdfLink & bookingPdfFileName are NOT defined', () => {
            props.isLeadLoggedIn = true;
            props.bookingPdfLink = undefined;
            props.bookingPdfFileName = undefined;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('download-btn-toolbar')).not.toBeInTheDocument();
        });

        it('should NOT render travel document button when it is agency booking', () => {
            props.booking.isExternalAgency = true;
            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('download-btn-toolbar')).not.toBeInTheDocument();
        });
    });

    describe('Flight Check In button', () => {
        it('should render check in link when it is available with right classes', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);
            props.isLeadLoggedIn = true;
            mockBooking.isExternalAgency = false;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByRole('link')).toBeInTheDocument();

            expect(mockLinkProps).toHaveBeenCalledWith({
                href: 'check-in-link',
                className: 'borderedBtn',
                rel: 'noopener noreferrer',
                target: '_blank',
                'data-tid': 'check-in-link',
            });
        });

        it('should NOT render check in button when check in link is not provided', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);
            mockCheckInLink = undefined;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('link')).not.toBeInTheDocument();
        });

        it('should render check in button even when there are multiple flight references', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);
            mockGetFlightsReferences = ['ref1', 'ref2'];

            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByRole('link')).toBeInTheDocument();
        });

        it('should render check in link with orange button class when hotel check-in is disabled and manage button is not outlined', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);
            mockStores.layoutStore.isHotelCheckInEnabled = false;
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = true;
            props.isLeadLoggedIn = true;

            render(<ViewBookingToolbar {...props} />);

            expect(mockLinkProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'borderedBtn orangeBtn',
                }),
            );
        });
    });

    describe('Hotel Check In button', () => {
        beforeEach(() => {
            mockStores.layoutStore.isHotelCheckInEnabled = true;
        });

        it('should render hotel check in button', () => {
            render(<ViewBookingToolbar {...props} />);

            expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'borderedBtn orangeBtn',
                isSecondary: true,
                onClick: expect.any(Function),
                children: SitecoreDictionary.ViewBookingButtonsHotelCheckIn,
                dataTid: 'hotel-check-in-btn',
            });
        });

        it('should render hotel check in button with right class when Flight check in link is visible', () => {
            mockStores.bookingStore.isCheckInAvailable = jest.fn(() => true);
            render(<ViewBookingToolbar {...props} />);

            expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'borderedBtn',
                isSecondary: true,
                onClick: expect.any(Function),
                children: SitecoreDictionary.ViewBookingButtonsHotelCheckIn,
                dataTid: 'hotel-check-in-btn',
            });
        });

        it('should render hotel check in popup', async () => {
            render(<ViewBookingToolbar {...props} />);

            await userEvent.click(screen.getByTestId('hotel-check-in-btn'));

            expect(screen.getByTestId('hotel-check-in-popup')).toBeInTheDocument();
            expect(mockHotelCheckInPopupProps).toHaveBeenCalledWith({
                onClose: expect.any(Function),
            });

            await userEvent.click(screen.getByTestId('hotel-check-in-popup'));

            expect(screen.queryByTestId('hotel-check-in-popup')).not.toBeInTheDocument();
        });
    });

    it('should NOT render any button when booking is cancelled', () => {
        props.isBookingCanceled = true;
        render(<ViewBookingToolbar {...props} />);

        expect(screen.queryByTestId('toolbar-buttons')).not.toBeInTheDocument();
    });

    it('should NOT render buttons wrapper when it is Trade Portal website', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<ViewBookingToolbar {...props} />);

        expect(screen.queryByTestId('toolbar-buttons')).not.toBeInTheDocument();
    });

    it('should fire tracking event', () => {
        mockStores.appStore.isScreenLarge = true;
        render(<ViewBookingToolbar {...props} />);

        fireEvent.click(screen.getByTestId('print-button')!);
        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });

    describe('Manage hub button', () => {
        it('should render the button', () => {
            props.isLeadLoggedIn = true;
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = true;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByTestId('manage-hub')).toBeInTheDocument();
            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
            });
        });
    });

    describe('Payment reminder and holiday CTA logic', () => {
        beforeEach(() => {
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = true;
            mockStores.bookingStore.isPaymentReminderVisible = jest.fn(() => false);
        });

        it('should NOT render Holiday CTA when on booking confirmation page', () => {
            mockStores.routerStore.isBookingConfirmationPage = jest.fn(() => true);

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('manage-hub')).not.toBeInTheDocument();
        });

        it('should render Holiday CTA when not on booking confirmation page and micro app is allowed', () => {
            mockStores.routerStore.isBookingConfirmationPage = jest.fn(() => false);
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = true;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByTestId('manage-hub')).toBeInTheDocument();
        });

        it('should NOT render Holiday CTA when micro app is not allowed', () => {
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = false;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('manage-hub')).not.toBeInTheDocument();
        });

        it('should NOT render Holiday CTA when in Trade Portal and B2B amendments are allowed but isBookingConfirmationPage is true', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isB2BAmendmentAllowed = true;
            mockStores.routerStore.isBookingConfirmationPage = jest.fn(() => true);

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('manage-hub')).not.toBeInTheDocument();
        });

        it('should pass buttonClass when user is not logged in', () => {
            props.isLeadLoggedIn = false;
            mockStores.layoutStore.isTradePortal = false;

            render(<ViewBookingToolbar {...props} />);

            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
                buttonClass: expect.any(String),
            });
        });

        it('should pass buttonClass when payment reminder is visible', () => {
            props.isLeadLoggedIn = true;
            mockStores.layoutStore.isTradePortal = false;
            mockStores.bookingStore.isPaymentReminderVisible = jest.fn(() => true);

            render(<ViewBookingToolbar {...props} />);

            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
                buttonClass: expect.any(String),
            });
        });

        it('should not pass buttonClass when user is logged in and no payment reminder is visible', () => {
            props.isLeadLoggedIn = true;
            mockStores.layoutStore.isTradePortal = false;
            mockStores.bookingStore.isPaymentReminderVisible = jest.fn(() => false);

            render(<ViewBookingToolbar {...props} />);

            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
                buttonClass: undefined,
            });
        });

        it('should never pass buttonClass when in trade portal regardless of other conditions', () => {
            props.isLeadLoggedIn = false;
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isB2BAmendmentAllowed = true;
            mockStores.bookingStore.isPaymentReminderVisible = jest.fn(() => true);

            render(<ViewBookingToolbar {...props} />);

            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
                buttonClass: undefined,
            });
        });

        it('should handle undefined isPaymentReminderVisible function', () => {
            mockStores.bookingStore.isPaymentReminderVisible = undefined;
            props.isLeadLoggedIn = true;
            mockStores.layoutStore.isTradePortal = false;

            render(<ViewBookingToolbar {...props} />);

            expect(mockManageHubCTAProps).toHaveBeenCalledWith({
                label: 'ManageHubLabel',
                buttonClass: undefined,
            });
        });
    });

    describe('Trade Portal + B2B Amendment CTA rendering', () => {
        it('should render Holiday CTA when in Trade Portal AND B2B amendment is allowed', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isB2BAmendmentAllowed = true;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.getByTestId('manage-hub')).toBeInTheDocument();
        });

        it('should NOT render Holiday CTA when in Trade Portal AND B2B amendment is NOT allowed', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isB2BAmendmentAllowed = false;

            render(<ViewBookingToolbar {...props} />);

            expect(screen.queryByTestId('manage-hub')).not.toBeInTheDocument();
        });
    });
});
