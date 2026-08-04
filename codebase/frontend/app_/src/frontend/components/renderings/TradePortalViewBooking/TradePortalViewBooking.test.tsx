import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockBooking } from 'frontend/__mocks__';
import { useViewBookingPageInit } from 'frontend/hooks/viewBooking.hooks';
import { AmendmentType } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import TradePortalViewBooking from './TradePortalViewBooking';

const createProps = () => ({
    fields: {},
    params: { FallbackImage: 'FallbackImage' },
    rendering: {},
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
    },
    viewBookingStore: {
        locationImage: {},
        isBookingCanceled: false,
        isMicroAppAmendSeatsAllowed: false,
        isB2BAmendmentAllowed: false,
        clearBooking: jest.fn(),
        successfulAmendmentStatus: null as Nullable<AmendmentType>,
    },
    routerStore: { redirectToTradePortalFindBookingPage: jest.fn(), redirectToMicroAppChangeSeatsPage: jest.fn() },
    seatMapStore: {
        setSeatMapOpened: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder'>{children}</div>;
    },
}));

jest.mock('frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar', () => () => (
    <div data-tid='view-booking-toolbar' />
));
const mockViewBookingToolbarProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar', () => props => {
    mockViewBookingToolbarProps(props);

    return <div data-tid='view-booking-toolbar' />;
});

jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => () => (
    <div data-tid='view-booking-hotel' />
));

jest.mock(
    'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails',
    () =>
        ({ onAmendSeatsClick, children }) =>
            (
                <div>
                    <span data-tid='view-booking-holiday-details' />
                    {onAmendSeatsClick && (
                        <button data-tid='on-amend-seats-click' onClick={onAmendSeatsClick}>
                            onAmendSeatsClick
                        </button>
                    )}
                    {children}
                </div>
            ),
);

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder'>{children}</div>;
    },
}));

const mockOverlaySpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerProps(props);

        return <div data-tid='overlay-spinner' />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

jest.mock('frontend/hooks/viewBooking.hooks', () => ({
    useViewBookingPageInit: jest.fn().mockReturnValue({
        booking: mockBooking,
        isLoading: false,
    }),
}));

describe('<TradePortalViewBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no booking', () => {
        (useViewBookingPageInit as jest.Mock).mockReturnValueOnce({ booking: undefined, isLoading: false });
        const { container } = render(<TradePortalViewBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render children when booking was canceled', () => {
        (useViewBookingPageInit as jest.Mock).mockReturnValueOnce({
            booking: { ...mockBooking, bookingStatus: BookingStatus.Canceled },
            isLoading: false,
        });
        render(<TradePortalViewBooking {...mockProps} />);

        expect(
            screen.getByTestId('view-booking-holiday-details').querySelector('[data-tid="placeholder"]'),
        ).not.toBeInTheDocument();
    });

    it('should render OverlaySpinner when isLoading is true', () => {
        mockProps.fields = {
            LoadingBookingTitle: { value: 'Loading Title' },
            LoadingBookingSubtitle: { value: 'Loading Subtitle' },
        };
        (useViewBookingPageInit as jest.Mock).mockReturnValueOnce({ booking: undefined, isLoading: true });
        render(<TradePortalViewBooking {...mockProps} />);

        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith({
            header: mockProps.fields?.LoadingBookingTitle?.value,
            description: mockProps.fields?.LoadingBookingSubtitle?.value,
        });
    });

    it('should render AmendRestrictions placeholder', () => {
        render(<TradePortalViewBooking {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.AmendRestrictions,
            rendering: mockProps.rendering,
            depDate: new Date(mockBooking.package?.transport?.routes?.[0]?.depDate),
            isExternalAgency: undefined,
            isLeadLoggedIn: true,
        });
    });

    it('should render view-booking--canceled container if booking is canceled', () => {
        mockStores.viewBookingStore.isBookingCanceled = true;
        const { container } = render(<TradePortalViewBooking {...mockProps} />);

        expect(container.getElementsByClassName('view-booking--canceled').length).toBe(1);
    });

    it('should NOT render view-booking--canceled container if booking is NOT canceled', () => {
        const { container } = render(<TradePortalViewBooking {...mockProps} />);

        expect(container.getElementsByClassName('view-booking--canceled').length).toBe(0);
    });

    it('should render banner placeholder', () => {
        render(<TradePortalViewBooking {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.HeroBannerTopSection,
            rendering: mockProps.rendering,
        });
    });

    it('should render ViewBookingToolbar', () => {
        const { getByTestId } = render(<TradePortalViewBooking {...mockProps} />);

        expect(getByTestId('view-booking-toolbar')).toBeInTheDocument();
        expect(mockViewBookingToolbarProps).toHaveBeenCalledWith({
            booking: mockBooking,
            isBookingCanceled: false,
            isLeadLoggedIn: true,
            rendering: {},
            fields: {},
        });
    });

    it('should render ViewBookingHotel', () => {
        const { getByTestId } = render(<TradePortalViewBooking {...mockProps} />);

        expect(getByTestId('view-booking-hotel')).toBeInTheDocument();
        expect(useViewBookingPageInit).toHaveBeenCalled();
    });

    it('should render ViewBookingHolidayDetails', () => {
        const { getByTestId } = render(<TradePortalViewBooking {...mockProps} />);

        expect(getByTestId('view-booking-holiday-details')).toBeInTheDocument();
    });

    it('should render 5 placeholders when healthEntryRequirements provided', () => {
        (useViewBookingPageInit as jest.Mock).mockReturnValueOnce({
            booking: {
                ...mockBooking,
                healthEntryRequirements: [
                    {
                        description: 'description',
                        title: 'title',
                        trackingLabel: 'trackingLabel',
                    },
                ],
            },
            isLoading: false,
        });
        const { getAllByTestId } = render(<TradePortalViewBooking {...mockProps} />);

        expect(getAllByTestId('placeholder').length).toBe(5);
    });

    it('should render 4 placeholders when no healthEntryRequirements provided', () => {
        (useViewBookingPageInit as jest.Mock).mockReturnValueOnce({
            booking: { ...mockBooking, healthEntryRequirements: [] },
            isLoading: false,
        });
        const { getAllByTestId } = render(<TradePortalViewBooking {...mockProps} />);

        expect(getAllByTestId('placeholder').length).toBe(4);
    });

    it('should clear booking when unmount', () => {
        const { unmount } = render(<TradePortalViewBooking {...mockProps} />);

        unmount();

        expect(mockStores.viewBookingStore.clearBooking).toBeCalled();
    });

    describe('onAmendSeatsClick', () => {
        it('should call onAmendSeatsClick', async () => {
            const { getByTestId } = render(<TradePortalViewBooking {...mockProps} />);

            await userEvent.click(getByTestId('on-amend-seats-click'));

            expect(mockStores.seatMapStore.setSeatMapOpened).toBeCalledWith(true);
        });

        it('should call redirectToMicroAppChangeSeatsPage when both flags are true', async () => {
            mockStores.viewBookingStore.isMicroAppAmendSeatsAllowed = true;
            mockStores.viewBookingStore.isB2BAmendmentAllowed = true;

            const { getByTestId } = render(<TradePortalViewBooking {...mockProps} />);

            await userEvent.click(getByTestId('on-amend-seats-click'));

            expect(mockStores.routerStore.redirectToMicroAppChangeSeatsPage).toHaveBeenCalled();
        });
    });

    describe('SuccessfulAmendmentPopup', () => {
        it('should not render if no status is set', () => {
            mockStores.viewBookingStore.successfulAmendmentStatus = null;
            render(<TradePortalViewBooking {...mockProps} />);
            expect(mockPlaceholderComponent).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.SuccessfulAmendmentPopup,
                }),
            );
        });

        it('should render if amendment status is set', () => {
            mockStores.viewBookingStore.successfulAmendmentStatus = AmendmentType.Dates;
            render(<TradePortalViewBooking {...mockProps} />);
            expect(mockPlaceholderComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.SuccessfulAmendmentPopup,
                }),
            );
        });
    });
});
