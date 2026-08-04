import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockAmendDatesStore, mockAmendRoomAndBoardStore, mockBooking } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as utils from 'frontend/utils/viewBooking.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import ViewBooking, { IViewBookingFields, IViewBookingProps } from './ViewBooking';

jest.mock('frontend/utils/priceBreakdown.utils', () => ({
    ...jest.requireActual('frontend/utils/priceBreakdown.utils'),
}));

const mockViewBookingToolbar = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Toolbar/ViewBookingToolbar', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingToolbar(props);

        return <div data-tid='view-booking-toolbar' />;
    },
}));

const mockViewBookingHotel = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingHotel(props);

        return <div>ViewBookingHotel</div>;
    },
}));

const mockViewBookingCost = jest.fn();

jest.mock('frontend/components/renderings/ViewBooking/HolidayCost/components/ViewBookingCost', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingCost(props);

        return <div data-tid='view-booking-cost'>ViewBookingCost</div>;
    },
}));

const mockViewBookingHolidayDetailsProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails', () => ({
    __esModule: true,
    default: ({
        onAmendFlightsClick,
        onAmendTransfersClick,
        onAmendPassengerClick,
        onAmendSeatsClick,
        onAmendRoomAndBoardClick,
        onCancelBookingClick,
        children,
        ...props
    }) => {
        mockViewBookingHolidayDetailsProps(props);

        return (
            <div data-tid='holiday-details'>
                {children}
                <button onClick={onAmendFlightsClick} data-tid='amend-flight-cta' />
                <button onClick={onAmendTransfersClick} data-tid='amend-transfer-cta' />
                <button onClick={onAmendPassengerClick} data-tid='amend-passenger-cta' />
                <button onClick={onAmendSeatsClick} data-tid='amend-seats-cta' />
                <button onClick={onAmendRoomAndBoardClick} data-tid='amend-room-and-board-cta' />
            </div>
        );
    },
}));

jest.mock(
    'frontend/components/renderings/AmendFlights/components/OtherDepartureAirportsPopup/OtherDepartureAirportsPopup',
    () => ({
        __esModule: true,
        default: () => <div data-tid='other-departure-airports-popup' />,
    }),
);

const mockUnavailableFlightsPopupProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendFlights/components/NoAvailableFlightsPopup/NoAvailableFlightsPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockUnavailableFlightsPopupProps(props);

            return <div data-tid='no-available-flights-popup' />;
        },
    }),
);

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return (
            <div data-tid='placeholder'>
                {children}
                <button>onClose</button>
            </div>
        );
    },
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div>OverlaySpinner</div>,
}));

const mockAmendDatesEntryProps = jest.fn();
jest.mock('frontend/components/renderings/AmendDates/components/AmendDatesEntry/AmendDatesEntry', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockAmendDatesEntryProps(props);

        return <button onClick={onClick} data-tid='amend-dates-entry' />;
    },
}));

const mockManageHolidayEntryProps = jest.fn();
jest.mock('./ManageHoliday/ManageHolidayEntry', () => ({
    __esModule: true,
    default: props => {
        mockManageHolidayEntryProps(props);

        return (
            <div data-tid='manage-holiday-entry'>
                <button data-tid='amend-dates-entry' onClick={props.onAmendDatesClick} aria-label='amend-dates-entry' />
                <button data-tid='amend-hotel-entry' onClick={props.onAmendHotelClick} aria-label='amend-hotel-entry' />
            </div>
        );
    },
}));

const mockAmendBookingErrorPopup = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup', () => ({
    __esModule: true,
    default: props => {
        mockAmendBookingErrorPopup(props);

        return <div data-tid='amend-booking-error-popup' />;
    },
}));

jest.mock('frontend/components/common/LuxuryBar/LuxuryBar', () => ({
    __esModule: true,
    default: ({ label }: { label: string }) => <div data-tid='luxury-bar'>{label}</div>,
}));

const createMockProps = () =>
    ({
        fields: {
            AmendHotelLabel: mockSitecoreField('AmendHotelLabel'),
            AmendDatesLabel: mockSitecoreField('AmendDatesLabel'),
            ManageBookingLabel: mockSitecoreField('ManageBookingLabel'),
            ManageHotelAndDatesLabel: mockSitecoreField('ManageHotelAndDatesLabel'),
        } as unknown as IViewBookingFields,
        params: {} as any,
        rendering: {},
        getPhrase: jest.fn(p => p),
    } as IViewBookingProps);

const createMockRouter = () => ({
    events: {
        on: jest.fn(),
        off: jest.fn(),
    },
});

let mockRouter = createMockRouter();
let mockProps = createMockProps();
let mockStores = createMockStores();

jest.mock('next/router', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

describe('<ViewBooking  />', () => {
    beforeEach(() => {
        mockRouter = createMockRouter();
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendFlightsStore: {
                isNoAvailableFlightsPopupShown: false,
                isAmendCTAVisible: true,
                startAmendBookingFlights: jest.fn(),
                clearStore: jest.fn(),
                allowanceRestrictions: {},
            },
            amendTransfersStore: {
                fetchAmendableAlternativeTransfers: jest.fn(),
                startToChangeTransferClick: jest.fn(),
                clearStore: jest.fn(),
                isAmendCTAVisible: true,
            },
            amendPassengerStore: {
                startEditPassengerDetails: jest.fn(),
            },
            routerStore: {
                redirectToAmendTransferPage: jest.fn(),
                redirectToAmendHotelPage: jest.fn(),
            },
            amendDatesStore: mockAmendDatesStore,
            amendRoomAndBoardStore: mockAmendRoomAndBoardStore,
            viewBookingStore: {
                isViewBookingStatusPage: false,
                isBookingPayloadClearRequired: jest.fn().mockReturnValue(false),
                setIsViewBookingStatusPage: jest.fn(),
                readRefreshBookingPayloadFromStorage: jest.fn(),
                isAmendErrorPopupShow: false,
                isLuxuryPackage: false,
            },
            hotelReviewsStore: {
                fetchReviews: jest.fn(),
            },
            flightsPassengersStore: {
                setPassengersStore: jest.fn(),
            },
            amendHotelStore: {
                isAmendCTAVisible: true,
                clearStore: jest.fn(),
                onAmendHotelButtonClick: jest.fn(),
            },
        });
    });

    it('should loadBooking when no booking received', async () => {
        mockStores.viewBookingStore.booking = null;
        render(<ViewBooking {...mockProps} />);
        await waitFor(() => expect(mockStores.viewBookingStore.loadBooking).toHaveBeenCalled());
    });

    it('should toggle loading when booking received', async () => {
        render(<ViewBooking {...mockProps} />);

        await waitFor(() => {
            expect(mockStores.viewBookingStore.toggleLoading).toHaveBeenCalledWith(false);
            expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
            expect(screen.getByTestId('view-booking')).toBeInTheDocument();
        });
    });

    it('should show spinner when data is still loading', () => {
        mockStores.viewBookingStore.isLoading = true;
        render(<ViewBooking {...mockProps} />);

        expect(screen.getByText('OverlaySpinner')).toBeInTheDocument();
    });

    it('should render overlay spinner when forcely open SeatMap', () => {
        mockStores.seatMapStore.shouldOpenSeatMapForced = true;

        render(<ViewBooking {...mockProps} />);

        expect(screen.getByTestId('view-booking')).toBeInTheDocument();
        expect(screen.getByText('OverlaySpinner')).toBeInTheDocument();
    });

    it('should call tracking function on amendmentClick', () => {
        render(<ViewBooking {...mockProps} />);

        fireEvent.click(screen.getByTestId('amend-flight-cta'));
        expect(mockStores.trackingStore.trackGenericAmendmentAction).toHaveBeenCalledWith(
            'View Booking',
            'Edit Your Flights',
        );
        fireEvent.click(screen.getByTestId('amend-transfer-cta'));
        expect(mockStores.trackingStore.trackGenericAmendmentAction).toHaveBeenCalledWith(
            'View Booking',
            'Edit Your Transfer',
        );
    });

    it('should render ViewBookingHotel', () => {
        render(<ViewBooking {...mockProps} />);

        expect(mockViewBookingHotel).toHaveBeenCalledWith({
            booking: mockStores.viewBookingStore.booking,
            fallbackImage: 'HotelFallbackImage',
            rendering: {},
        });
    });

    describe('Micro app is on scenarios', () => {
        it('should call redirectToMicroAppChangeFlightPage if isMicroAppAmendFlightsAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendFlightsAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-flight-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeFlightPage).toHaveBeenCalled();
        });

        it('should call redirectToMicroAppChangeFlightPage if isMicroAppAmendFlightsAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendTransferAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-transfer-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeTransferPage).toHaveBeenCalled();
        });

        it('should call redirectToMicroAppChangeNamePage if isMicroAppAmendNameAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendNameAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-passenger-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeNamePage).toHaveBeenCalled();
        });

        it('should call redirectToMicroAppChangeDatePage if isMicroAppAmendDateAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendDateAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-dates-entry'));

            expect(mockStores.routerStore.redirectToMicroAppChangeDatePage).toHaveBeenCalled();
        });

        it('should call redirectToMicroAppChangeHotelPage if isMicroAppAmendHotelAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendHotelAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-hotel-entry'));

            expect(mockStores.routerStore.redirectToMicroAppChangeHotelPage).toHaveBeenCalled();
        });

        it('should call redirectToMicroAppChangeRoomAndBoardPage if isMicroAppAmendRoomAndBoardAllowed is true', () => {
            mockStores.viewBookingStore.isMicroAppAmendRoomAndBoardAllowed = true;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-room-and-board-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeRoomAndBoardPage).toHaveBeenCalled();
        });

        it('should redirect multi-room booking to micro app when multi-room flag is enabled', () => {
            mockStores.viewBookingStore.isMicroAppAmendRoomAndBoardAllowed = false;
            mockStores.viewBookingStore.isMicroAppAmendMultiRoomAndBoardAllowed = true;
            const multiRoomBooking = {
                ...mockStores.viewBookingStore.booking,
                package: {
                    ...mockStores.viewBookingStore.booking.package,
                    accom: {
                        ...mockStores.viewBookingStore.booking.package.accom,
                        rooms: [
                            mockStores.viewBookingStore.booking.package.accom.rooms[0],
                            { ...mockStores.viewBookingStore.booking.package.accom.rooms[0], code: 'DB02' },
                        ],
                    },
                },
            };
            mockStores.viewBookingStore.booking = multiRoomBooking;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-room-and-board-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeRoomAndBoardPage).toHaveBeenCalled();
            expect(mockStores.amendRoomAndBoardStore.goToAmendRoomAndBoardPage).not.toHaveBeenCalled();
        });

        it('should NOT redirect multi-room booking to micro app when multi-room flag is disabled', () => {
            mockStores.viewBookingStore.isMicroAppAmendRoomAndBoardAllowed = false;
            mockStores.viewBookingStore.isMicroAppAmendMultiRoomAndBoardAllowed = false;
            const multiRoomBooking = {
                ...mockStores.viewBookingStore.booking,
                package: {
                    ...mockStores.viewBookingStore.booking.package,
                    accom: {
                        ...mockStores.viewBookingStore.booking.package.accom,
                        rooms: [
                            mockStores.viewBookingStore.booking.package.accom.rooms[0],
                            { ...mockStores.viewBookingStore.booking.package.accom.rooms[0], code: 'DB02' },
                        ],
                    },
                },
            };
            mockStores.viewBookingStore.booking = multiRoomBooking;

            render(<ViewBooking {...mockProps} />);

            fireEvent.click(screen.getByTestId('amend-room-and-board-cta'));

            expect(mockStores.routerStore.redirectToMicroAppChangeRoomAndBoardPage).not.toHaveBeenCalled();
            expect(mockStores.amendRoomAndBoardStore.goToAmendRoomAndBoardPage).toHaveBeenCalled();
        });
    });

    describe('isBookingClearRequired', () => {
        it('should clear booking on unmount if isBookingClearRequired return true', async () => {
            mockStores.viewBookingStore.isBookingClearRequired = jest.fn().mockReturnValue(true);

            const { unmount } = render(<ViewBooking {...mockProps} />);

            expect(mockStores.viewBookingStore.isBookingClearRequired).not.toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).not.toHaveBeenCalled();

            await act(async () => {
                unmount();
            });

            expect(mockStores.viewBookingStore.isBookingClearRequired).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).toHaveBeenCalled();
        });

        it('should not clear booking on unmount if isBookingClearRequired return false', async () => {
            mockStores.viewBookingStore.isBookingClearRequired = jest.fn().mockReturnValue(false);

            const { unmount } = render(<ViewBooking {...mockProps} />);
            expect(mockStores.viewBookingStore.clearBooking).not.toHaveBeenCalled();

            await act(async () => {
                unmount();
            });

            expect(mockStores.viewBookingStore.isBookingClearRequired).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearBooking).not.toHaveBeenCalled();
        });
    });

    describe('isBookingPayloadClearRequired', () => {
        it('should clear booking on unmount if isBookingPayloadClearRequired return true', async () => {
            mockStores.viewBookingStore.isBookingPayloadClearRequired = jest.fn().mockReturnValue(true);
            const { unmount } = render(<ViewBooking {...mockProps} />);

            expect(mockStores.viewBookingStore.clearViewBookingPayload).not.toHaveBeenCalled();

            await act(async () => {
                unmount();
            });

            expect(mockStores.viewBookingStore.isBookingPayloadClearRequired).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearViewBookingPayload).toHaveBeenCalled();
        });

        it('should not clear booking on unmount if isBookingClearRequired return false', async () => {
            const { unmount } = render(<ViewBooking {...mockProps} />);
            expect(mockStores.viewBookingStore.clearViewBookingPayload).not.toHaveBeenCalled();

            await act(async () => {
                unmount();
            });

            expect(mockStores.viewBookingStore.isBookingPayloadClearRequired).toHaveBeenCalled();
            expect(mockStores.viewBookingStore.clearViewBookingPayload).not.toHaveBeenCalled();
        });
    });

    describe('Manage Holiday entry', () => {
        it('should show ManageHoliday', () => {
            mockStores.viewBookingStore.isMicroAppManageMyHolidayAllowed = true;

            render(<ViewBooking {...mockProps} />);

            expect(screen.getByTestId('manage-holiday-entry')).toBeInTheDocument();
            expect(mockManageHolidayEntryProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    onAmendDatesClick: expect.any(Function),
                    onAmendHotelClick: expect.any(Function),
                    amendDatesLabel: 'AmendDatesLabel',
                    amendHotelLabel: 'AmendHotelLabel',
                    manageBookingLabel: 'ManageHotelAndDatesLabel',
                }),
            );
        });

        it('should NOT handle click if non-lead passenger', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = false;
            render(<ViewBooking {...mockProps} />);

            const manageHoliday = screen.getByTestId('manage-holiday-entry');
            await userEvent.click(manageHoliday);

            expect(mockStores.amendDatesStore.onAmendDatesButtonClick).not.toHaveBeenCalled();
        });

        it('should invoke click for change dates', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;
            render(<ViewBooking {...mockProps} />);

            const amendDatesButton = screen.getByTestId('amend-dates-entry');
            await userEvent.click(amendDatesButton);

            expect(mockStores.amendDatesStore.onAmendDatesButtonClick).toHaveBeenCalled();
            expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventActions.ViewBooking,
                AmendEventLabels.ChangeDate,
                {},
                false,
            );
        });

        it('should invoke click for change hotel', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;
            render(<ViewBooking {...mockProps} />);

            const amendHotelButton = screen.getByTestId('amend-hotel-entry');
            await userEvent.click(amendHotelButton);

            expect(mockStores.amendHotelStore.onAmendHotelButtonClick).toHaveBeenCalled();
        });

        it('should invoke click for change hotel when not logged in as lead passenger', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = false;
            render(<ViewBooking {...mockProps} />);

            const amendHotelButton = screen.getByTestId('amend-hotel-entry');
            await userEvent.click(amendHotelButton);

            expect(mockStores.userStore.setIsRedirectPreventedAfterLogin).toHaveBeenCalled();
            expect(mockStores.userStore.setRedirectUrl).toHaveBeenCalled();
            expect(mockStores.userStore.toggleLoginPopup).toHaveBeenCalled();
        });

        it('should NOT render manage hotel CTA when neither Amend Dates CTA visible nor Amend Hotel CTA visible', () => {
            mockStores.amendDatesStore.isAmendCTAVisible = false;
            mockStores.amendHotelStore.isAmendCTAVisible = false;

            expect(screen.queryByTestId('manage-holiday-entry')).not.toBeInTheDocument();
        });

        it('should NOT render manage hotel CTA when Luxury package', () => {
            mockStores.viewBookingStore.isLuxuryPackage = true;

            expect(screen.queryByTestId('manage-holiday-entry')).not.toBeInTheDocument();
        });
    });

    describe('fetchAmendableAlternativeTransfers', () => {
        it('should not fetch if not canLoadTransfers is false', async () => {
            mockStores.amendTransfersStore.canLoadTranfers = false;
            render(<ViewBooking {...mockProps} />);

            await waitFor(() =>
                expect(mockStores.amendTransfersStore.fetchAmendableAlternativeTransfers).not.toHaveBeenCalled(),
            );
        });

        it('should fetch alternative transfers if it is enabled', async () => {
            mockStores.amendTransfersStore.canLoadTransfers = true;
            render(<ViewBooking {...mockProps} />);

            await waitFor(() =>
                expect(mockStores.amendTransfersStore.fetchAmendableAlternativeTransfers).toHaveBeenCalled(),
            );
        });

        it('should fetch transfers after login when isLoginPopupShown is true', () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;
            mockStores.userStore.isLoginPopupShown = true;
            mockStores.amendTransfersStore.canLoadTransfers = true;

            render(<ViewBooking {...mockProps} />);

            expect(mockStores.amendTransfersStore.fetchAmendableAlternativeTransfers).toHaveBeenCalled();
        });
    });

    describe('loadRoomAndBoardData', () => {
        it('should not load if disabled', async () => {
            mockStores.amendRoomAndBoardStore.canLoadRoomAndBoardOptions = false;

            render(<ViewBooking {...mockProps} />);

            await waitFor(() => expect(mockStores.amendRoomAndBoardStore.loadRoomAndBoardData).not.toHaveBeenCalled());
        });

        it('should load room and board data if enabled', async () => {
            mockStores.amendRoomAndBoardStore.canLoadRoomAndBoardOptions = true;

            render(<ViewBooking {...mockProps} />);

            await waitFor(() => expect(mockStores.amendRoomAndBoardStore.loadRoomAndBoardData).toHaveBeenCalled());
        });
    });

    it('should render other departure airports popup', () => {
        mockStores.amendFlightsStore.isOtherDepartureAirportsPopupShown = true;
        render(<ViewBooking {...mockProps} />);

        expect(screen.getByTestId('other-departure-airports-popup')).toBeInTheDocument();
    });

    it('should clear amendTransfersStore, amendRoomAndBoardStore, amendFlightsStore and amendDatesStore when component renders', () => {
        render(<ViewBooking {...mockProps} />);

        expect(mockStores.amendTransfersStore.clearStore).toHaveBeenCalled();
        expect(mockStores.amendFlightsStore.clearStore).toHaveBeenCalled();
        expect(mockStores.amendDatesStore.clearStore).toHaveBeenCalled();
        expect(mockStores.amendRoomAndBoardStore.clearStore).toHaveBeenCalled();
        expect(mockStores.amendHotelStore.clearStore).toHaveBeenCalled();
    });

    it('should correctly sort the price breakdown', async () => {
        render(<ViewBooking {...mockProps} />);

        await waitFor(() => {
            const costComponent = screen.getByTestId('view-booking-cost');
            expect(costComponent).toBeInTheDocument();

            expect(mockViewBookingCost).toHaveBeenCalledWith(
                expect.objectContaining({
                    priceBreakdown: [
                        {
                            amount: 100,
                            code: 'Adults',
                            name: 'Adults',
                            quantity: 1,
                        },
                        {
                            amount: 50,
                            code: 'Promotions',
                            name: 'Promo',
                            quantity: 1,
                        },
                        {
                            amount: -10,
                            code: 'Discount',
                            name: 'Discount',
                            quantity: 1,
                        },
                    ],
                }),
            );
        });
    });

    it('should correctly sort the price breakdown without extras', async () => {
        mockStores.viewBookingStore.booking.extraPriceBreakdown = undefined;

        render(<ViewBooking {...mockProps} />);

        await waitFor(() => {
            const costComponent = screen.getByTestId('view-booking-cost');
            expect(costComponent).toBeInTheDocument();

            expect(mockViewBookingCost).toHaveBeenCalledWith(
                expect.objectContaining({
                    priceBreakdown: [
                        { name: 'Children', amount: 80, code: 'Adults', quantity: 1 },
                        { name: 'Promotion', amount: 70, code: 'Promotions', quantity: 1 },
                        { name: 'ExtraDiscount', amount: -20, code: 'Discount', quantity: 1 },
                    ],
                }),
            );
        });
    });

    describe('SuccessfulAmendmentPopup', () => {
        it('should not render if no status is set', () => {
            mockStores.viewBookingStore.successfulAmendmentStatus = null;
            render(<ViewBooking {...mockProps} />);
            expect(mockPlaceholderComponent).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.SuccessfulAmendmentPopup,
                }),
            );
        });

        it('should render if amendment status is set', () => {
            mockStores.viewBookingStore.successfulAmendmentStatus = AmendmentType.Dates;
            render(<ViewBooking {...mockProps} />);
            expect(mockPlaceholderComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.SuccessfulAmendmentPopup,
                }),
            );
        });

        it('should render AmendBookingErrorPopup', () => {
            mockStores.viewBookingStore.isAmendErrorPopupShown = true;
            render(<ViewBooking {...mockProps} />);
            expect(mockAmendBookingErrorPopup).toHaveBeenCalledWith({
                onClose: expect.any(Function),
            });
        });
    });

    describe('ViewBookingHolidayDetails', () => {
        it('should be rendered with props', () => {
            render(<ViewBooking {...mockProps} />);

            expect(screen.getByTestId('holiday-details')).toBeInTheDocument();
            expect(mockViewBookingHolidayDetailsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    booking: mockBooking,
                    fields: mockProps.fields,
                    rendering: mockProps.rendering,
                }),
            );
            expect(screen.getByTestId('holiday-details').querySelector('[data-tid="placeholder"]')).toBeInTheDocument();
        });

        it('should not render children when booking was canceled', () => {
            mockStores.viewBookingStore.isBookingCanceled = true;
            render(<ViewBooking {...mockProps} />);

            expect(
                screen.getByTestId('holiday-details').querySelector('[data-tid="placeholder"]'),
            ).not.toBeInTheDocument();
        });
    });

    it('should render unavailable flow popup placeholder', () => {
        render(<ViewBooking {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.UnAvailableFlowPopup,
            rendering: mockProps.rendering,
        });
    });

    describe('Amend Room and Board CTA', () => {
        it('should NOT call redirectToAmendTransferPage when user is logged in as not a lead passenger', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = false;

            render(<ViewBooking {...mockProps} />);

            await userEvent.click(screen.getByTestId('amend-room-and-board-cta'));

            expect(mockStores.routerStore.redirectToAmendTransferPage).not.toHaveBeenCalled();
        });

        it('should call redirectToAmendTransferPage and trackGenericAmendmentActionWithGuests event when click on the CTA', async () => {
            mockStores.viewBookingStore.booking.isLoggedInAsLeadPassenger = true;
            render(<ViewBooking {...mockProps} />);

            await userEvent.click(screen.getByTestId('amend-room-and-board-cta'));

            expect(mockStores.amendRoomAndBoardStore.goToAmendRoomAndBoardPage).toHaveBeenCalled();
            expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventActions.ViewBooking,
                AmendEventLabels.ChangeRoomAndBoard,
                { destinationUrl: 'sitePath/booking/change-room-and-board' },
            );
        });
    });

    it('should render banner placeholder', () => {
        render(<ViewBooking {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.HeroBannerTopSection,
            rendering: mockProps.rendering,
        });
    });

    describe('ViewBookingToolbar', () => {
        it('should render ViewBookingToolbar', () => {
            jest.spyOn(utils, 'getPdfLinks').mockReturnValue('bookingPdfLink');
            jest.spyOn(utils, 'getBookingPdfFileName').mockReturnValue('bookingPdfFileName');
            render(<ViewBooking {...mockProps} />);

            expect(screen.getByTestId('view-booking-toolbar')).toBeInTheDocument();
            expect(mockViewBookingToolbar).toHaveBeenCalledWith({
                booking: mockBooking,
                rendering: mockProps.rendering,
                bookingPdfFileName: 'bookingPdfFileName',
                bookingPdfLink: 'bookingPdfLink',
                isBookingCanceled: false,
                isLeadLoggedIn: true,
                fields: mockProps.fields,
            });
        });
    });
});
