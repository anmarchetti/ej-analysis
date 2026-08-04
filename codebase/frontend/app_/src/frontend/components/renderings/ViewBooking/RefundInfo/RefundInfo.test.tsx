import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { CreditExpiryState } from 'models/data/MyCreditInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import { mockRefundInfoFields } from './mocks/refundInfoFields.mock';
import { RefundInfo, TRefundInfoProps } from './RefundInfo';

const createProps = (): TRefundInfoProps => ({
    fields: mockRefundInfoFields,
    params: {},
    rendering: undefined,
});

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            isCreditBookingEnabled: true,
            isCreditEnabledApiSettings: true,
            canBeBookingCancelledFromWebsite: true,
            isOneTimeUseCreditEnabled: false,
            isEligibleForCreditRefund: true,
            isEligibleForOriginalPaymentRefund: true,
            cancellationSummary: undefined,
            startCreditBooking: jest.fn(),
            clearFetchCancellationSummary: jest.fn(),
            startBookingCancellation: jest.fn(),
            setPrevPagePath: jest.fn(),
            initializeCancellation: jest.fn(),
            showCreditExpiryInfoPopupBeforeCancellation: true,
        },
        viewBookingStore: {
            isBookingCancellationAllowed: true,
            booking: {
                bookingStatus: 'BOOKED',
                refund: {
                    credit: { isEligible: false },
                    refund: { isEligible: false },
                },
                isExternalAgency: false,
                isLoggedInAsLeadPassenger: true,
            } as IBookingInfo,
        },
        userStore: { isLoggedIn: true },
        trackingStore: { fireViewBookingEvent: jest.fn() },
        layoutStore: {
            viewBookingLinks: {
                preTravel: SitePath.PreTravel,
            },
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, dataId }) => (
        <div data-tid={dataId}>
            RichTextWithLinks <span>{field?.value}</span>
        </div>
    ),
}));

const mockRefundInfoPopupComponent = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/RefundInfoPopup', () => props => {
    mockRefundInfoPopupComponent(props);

    return (
        <div data-tid='refund-info-popup'>
            <button data-tid='popup-close' onClick={props.onClosePopup}>
                Close
            </button>
        </div>
    );
});

jest.mock('frontend/components/common/LoadingState/LoadingState', () => ({
    __esModule: true,
    default: () => <div data-tid='loading-state' />,
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => props => {
    mockRouterLinkProps(props);

    return <div data-tid='router-link' />;
});

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='placeholder' />,
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsFlightDeparted = false;
jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    isFlightDeparted: jest.fn(() => mockIsFlightDeparted),
    getViewBookingRedirectLink: jest.fn((_, links) => links.preTravel),
}));

let mockGetBannerContent: (typeof mockRefundInfoFields.Children)[0] | undefined = mockRefundInfoFields.Children[0];
jest.mock('./utils/RefundInfo.utils', () => ({
    __esModule: true,
    getBannerContent: jest.fn(() => mockGetBannerContent),
}));

describe('<RefundInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockIsFlightDeparted = false;
        mockGetBannerContent = mockRefundInfoFields.Children[0];
    });

    it('should call initializeCancellation when isOneTimeUseCreditEnabled is true', () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = true;
        mockStores.holidayCreditStore.initializeCancellation = jest.fn();

        render(<RefundInfo {...mockProps} />);

        expect(mockStores.holidayCreditStore.initializeCancellation).toHaveBeenCalled();
    });

    it('should render loading state when isCancellationSummaryIsLoading is true', () => {
        mockStores.holidayCreditStore.isCancellationSummaryIsLoading = true;

        render(<RefundInfo {...mockProps} />);

        expect(screen.queryByTestId('refund-info-container')).not.toBeInTheDocument();
        expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should NOT render if credits disabled on sitecore', () => {
        mockStores.holidayCreditStore.isCreditBookingEnabled = false;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if booking was already canceled', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            bookingStatus: BookingStatus.Canceled,
        };
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no fields', () => {
        mockGetBannerContent = undefined;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if user is not logged in as lead passenger and it is NOT trade booking', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isExternalAgency: false,
            isLoggedInAsLeadPassenger: false,
        };
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if user is NOT logged in', () => {
        mockStores.userStore.isLoggedIn = false;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no booking', () => {
        mockStores.viewBookingStore.booking = null;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if flight has departed', () => {
        mockIsFlightDeparted = true;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should show an error message if credit functionality are not available in API', () => {
        mockStores.holidayCreditStore.isCreditEnabledApiSettings = false;
        render(<RefundInfo {...mockProps} />);

        expect(screen.getByTestId('refund-info-unavailable-container')).toBeInTheDocument();
        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.HolidayCreditTitlesHolidayCredit);
        expect(screen.getByText(SitecoreDictionary.HolidayCreditErrorMessagesCantAccessToCredit)).toBeInTheDocument();
    });

    it('should NOT show an error message if credit functionality are not available in API but it is trade booking', () => {
        mockStores.holidayCreditStore.isCreditEnabledApiSettings = false;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isExternalAgency: true,
        };
        render(<RefundInfo {...mockProps} />);

        expect(screen.queryByTestId('refund-info-unavailable-container')).not.toBeInTheDocument();
    });

    it('should open popup when hasExpiredOrExpiringCredit is true and matching creditExpiryState exists', () => {
        mockStores.holidayCreditStore.cancellationSummary = {
            creditExpiryState: CreditExpiryState.ExpiredOnly,
        };
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);
        const button = screen.getByText('Credit And Cash Refund Button');

        fireEvent.click(button);

        expect(mockRefundInfoPopupComponent).toHaveBeenLastCalledWith(expect.objectContaining({ isOpened: true }));
    });

    it('should NOT open popup when it is toggled off', () => {
        mockStores.holidayCreditStore.showCreditExpiryInfoPopupBeforeCancellation = false;
        mockStores.holidayCreditStore.cancellationSummary = {
            creditExpiryState: CreditExpiryState.ExpiredOnly,
        };
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);
        const button = screen.getByText('Credit And Cash Refund Button');

        fireEvent.click(button);

        expect(mockStores.holidayCreditStore.startBookingCancellation).toHaveBeenCalled();
    });

    it('should NOT open popup when hasExpiredOrExpiringCredit is true but no matching ExpiryPopupItems', () => {
        mockStores.holidayCreditStore.cancellationSummary = {
            creditExpiryState: CreditExpiryState.Both,
        };
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);
        const button = screen.getByText('Credit And Cash Refund Button');

        fireEvent.click(button);

        expect(mockStores.holidayCreditStore.startBookingCancellation).toHaveBeenCalled();
    });

    it('should pass creditExpiryPopupFields and CTA labels to RefundInfoPopup', () => {
        mockStores.holidayCreditStore.cancellationSummary = {
            creditExpiryState: CreditExpiryState.ExpiredOnly,
        };
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);

        expect(mockRefundInfoPopupComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                creditExpiryPopupFields: mockProps.fields!.ExpiryPopupItems[0].fields,
                ExpiryPopupCTA: mockProps.fields!.ExpiryPopupCTA,
                ExpiryPopupCancelCTA: mockProps.fields!.ExpiryPopupCancelCTA,
            }),
        );
    });

    it('should start cancellation and call track event when cancel booking button is clicked', () => {
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);
        const cancelButton = screen.getByText('Credit And Cash Refund Button');

        fireEvent.click(cancelButton);

        expect(mockStores.holidayCreditStore.setPrevPagePath).toHaveBeenCalledWith(SitePath.PreTravel);
        expect(mockStores.holidayCreditStore.startBookingCancellation).toHaveBeenCalledTimes(1);
        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalledWith(
            ViewBookingTrackingEvents.CancelBooking,
            'Cancel Booking',
        );
    });

    it('should render terms link if cancel button is hidden', () => {
        mockGetBannerContent = mockProps.fields!.Children[4];

        render(<RefundInfo {...mockProps} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            link: mockProps.fields!.Children[4].fields.TermsAndConditionsLink,
            className: 'ctaLink btn btn--small',
            dataId: 'terms-cta-link',
            children: mockProps.fields!.Children[4].fields.TermsAndConditionsLink.value.text,
        });
    });

    it('should render contact us button placeholder if ShowContactUsButton is true', () => {
        mockGetBannerContent = mockProps.fields!.Children[5];
        render(<RefundInfo {...mockProps} />);

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });

    it('should NOT render when canBeBookingCancelledFromWebsite is false and booking is not destination rules and not external agency', () => {
        mockStores.holidayCreditStore.canBeBookingCancelledFromWebsite = false;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isDestinationRulesApplied: false,
            isExternalAgency: false,
        };
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when canBeBookingCancelledFromWebsite is false but destination rules are applied', () => {
        mockStores.holidayCreditStore.canBeBookingCancelledFromWebsite = false;
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            isDestinationRulesApplied: true,
            isExternalAgency: false,
        };
        render(<RefundInfo {...mockProps} />);

        expect(screen.getByTestId('refund-info-container')).toBeInTheDocument();
    });

    it('should NOT render when not eligible for credit or original payment and one time use credit is disabled', () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = false;
        mockStores.holidayCreditStore.isEligibleForCreditRefund = false;
        mockStores.holidayCreditStore.isEligibleForOriginalPaymentRefund = false;
        const { container } = render(<RefundInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should close popup when onClosePopup is called', () => {
        mockStores.holidayCreditStore.cancellationSummary = {
            creditExpiryState: CreditExpiryState.ExpiredOnly,
        };
        mockStores.viewBookingStore.booking = {
            ...mockStores.viewBookingStore.booking,
            refund: {
                credit: { isEligible: true },
                refund: { isEligible: true },
            },
        };

        render(<RefundInfo {...mockProps} />);

        // Open popup by clicking cancel
        fireEvent.click(screen.getByText('Credit And Cash Refund Button'));

        // Close popup
        fireEvent.click(screen.getByTestId('popup-close'));

        expect(mockRefundInfoPopupComponent).toHaveBeenLastCalledWith(expect.objectContaining({ isOpened: false }));
    });
});
