import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesStore, mockBooking, mockOutboundFlight } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ScreenViews } from 'models/enum/ScreenViews';
import SitePath from 'models/enum/SitePath';

import AmendDatesSummary from './AmendDatesSummary';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        IsAttentionMessageEnabled: mockSitecoreField(true),
        IsStickySummaryEnabled: mockSitecoreField(true),
        FlightTitle: mockSitecoreField('FlightTitle'),
        FlightIcon: mockSitecoreField(mockSitecoreImageField('FlightIcon')),
        TransferTitle: mockSitecoreImageField('TransferTitle'),
        RoomTitle: mockSitecoreImageField('RoomTitle'),
        RoomIcon: mockSitecoreField(mockSitecoreImageField('RoomIcon')),
        SeatsTitle: mockSitecoreField('SeatsTitle'),
        SeatsIcon: mockSitecoreField(mockSitecoreImageField('SeatsIcon')),
        FallbackHotelImage: mockSitecoreField(mockSitecoreImageField('FallbackHotelImage')),
        LinkHotelLabel: mockSitecoreField('LinkHotelLabel'),
        ChangeFeeLabel: mockSitecoreField('ChangeFeeLabel'),
        TotalCostLabel: mockSitecoreField('TotalCostLabel'),
        AdditionalCostLabel: mockSitecoreField('AdditionalCostLabel'),
        TotalCostFooterLabel: mockSitecoreField('TotalCostFooterLabel'),
        AddSeatsCTA: mockSitecoreField('AddSeatsCTA'),
    },
    rendering: {
        placeholders: {
            [PlaceholderNames.ChangeFeeInfo]: [
                {
                    fields: {
                        Title: mockSitecoreField('Change Fee Info Title'),
                        Description: mockSitecoreField('Change Fee Info Description'),
                    },
                },
            ],
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSummaryFlightProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryFlight/AmendDatesSummaryFlight',
    () => ({
        __esModule: true,
        default: props => {
            mockSummaryFlightProps(props);

            return <div data-tid='summary-flight' />;
        },
    }),
);

const mockSummaryRoomProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryRoom/AmendDatesSummaryRoom',
    () => ({
        __esModule: true,
        default: props => {
            mockSummaryRoomProps(props);

            return <div data-tid='summary-room' />;
        },
    }),
);

const mockSummarySeatsProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/AmendDatesSummarySeats',
    () => ({
        __esModule: true,
        default: props => {
            mockSummarySeatsProps(props);

            return <div data-tid='summary-seats' />;
        },
    }),
);

const mockSummaryTransportProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryTransport/AmendDatesSummaryTransport',
    () => ({
        __esModule: true,
        default: props => {
            mockSummaryTransportProps(props);

            return <div data-tid='summary-transport' />;
        },
    }),
);

jest.mock('./components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='continue-btn'>{children}</div>,
}));

const mockSummaryFeeProps = jest.fn();
jest.mock('./components/AmendDatesSummaryFee/AmendDatesSummaryFee', () => ({
    __esModule: true,
    default: props => {
        mockSummaryFeeProps(props);

        return <div data-tid='fee' />;
    },
}));

const mockHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockHeaderProps(props);

        return <div data-tid='header' />;
    },
}));

const mockHotelProps = jest.fn();
jest.mock('./components/AmendDatesSummaryHotel/AmendDatesSummaryHotel', () => ({
    __esModule: true,
    default: props => {
        mockHotelProps(props);

        return <div data-tid='hotel' />;
    },
}));

const mockStickyHeaderProps = jest.fn();
jest.mock('./components/AmendSummaryStickyHeader/AmendSummaryStickyHeader', () => ({
    __esModule: true,
    default: props => {
        mockStickyHeaderProps(props);

        return <div data-tid='sticky-header' />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const mockAmendBookingErrorPopupProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup', () => ({
    __esModule: true,
    default: props => {
        mockAmendBookingErrorPopupProps(props);

        return <div data-tid='error-popup' onClick={props.onClose} />;
    },
}));

const mockPricesProps = jest.fn();
jest.mock('./components/AmendDatesSummaryPrices/AmendDatesSummaryPrices', () => ({
    __esModule: true,
    default: props => {
        mockPricesProps(props);

        return <div data-tid='summary-prices' />;
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

const mockNoAvailableFlightsPopupProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendFlights/components/NoAvailableFlightsPopup/NoAvailableFlightsPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockNoAvailableFlightsPopupProps(props);

            return <div data-tid='no-available-flights-popup' />;
        },
    }),
);

const mockOtherDepartureAirportsPopupProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendFlights/components/OtherDepartureAirportsPopup/OtherDepartureAirportsPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockOtherDepartureAirportsPopupProps(props);

            return <div data-tid='other-departure-airports-popup' />;
        },
    }),
);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={props.name}>{props.children}</div>;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/DatesBasket/DatesBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='dates-basket' />,
}));

describe('<AmendDatesSummary />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: mockAmendDatesStore,
            appStore: {
                isScreenMedium: true,
                amendBookingItemPayload: {
                    amendDatesOffer: {
                        amendmentDatesCharges: 70,
                    },
                },
            },
            amendFlightsStore: {
                isOtherDepartureAirportsPopupShown: false,
                isNoAvailableFlightsPopupShown: false,
            },
            layoutStore: {
                getBreadcrumb: jest.fn().mockReturnValue(SitePath.AmendDates),
            },
            viewBookingStore: {
                isLoadingBookingFromPayload: false,
            },
            seatMapStore: {
                clearValidatedSeats: jest.fn(),
            },
        });
        mockProps = createProps();
    });

    it('Render all components', () => {
        render(<AmendDatesSummary {...mockProps} />);

        expect(mockStores.amendDatesStore.initiateSummaryPage).toHaveBeenCalled();

        expect(screen.getByTestId(PlaceholderNames.PriceJumpPopup)).toBeInTheDocument();
        expect(screen.getByTestId('component-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('sticky-header')).toBeInTheDocument();
        expect(mockStickyHeaderProps).toHaveBeenCalledWith(expect.objectContaining({ fields: mockProps.fields }));
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(mockHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.Title,
                subtitle: mockProps.fields.Subtitle,
                isAttentionMessageOn: true,
                rendering: mockProps.rendering,
            }),
        );

        expect(screen.getByTestId(PlaceholderNames.UnAvailableFlowPopup)).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.UnAvailableFlowPopup,
                rendering: mockProps.rendering,
            }),
        );

        expect(screen.getByTestId('hotel')).toBeInTheDocument();
        expect(mockHotelProps).toHaveBeenCalledWith(
            expect.objectContaining({ fallbackHotelImage: 'FallbackHotelImage', linkLabel: 'LinkHotelLabel' }),
        );

        expect(screen.getByTestId('summary-flight')).toBeInTheDocument();
        expect(mockSummaryFlightProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.FlightTitle,
                icon: mockProps.fields.FlightIcon,
            }),
        );

        expect(screen.getByTestId('summary-room')).toBeInTheDocument();
        expect(mockSummaryRoomProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.RoomTitle,
                icon: mockProps.fields.RoomIcon,
            }),
        );

        expect(screen.getByTestId('summary-seats')).toBeInTheDocument();
        expect(mockSummarySeatsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                rendering: mockProps.rendering,
            }),
        );

        expect(screen.getByTestId('summary-transport')).toBeInTheDocument();
        expect(mockSummaryTransportProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.TransferTitle,
            }),
        );
        expect(screen.getByTestId('continue-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('overlay-spinner')).not.toBeInTheDocument();

        expect(screen.getByTestId('summary-prices')).toBeInTheDocument();

        expect(mockPricesProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                className: 'pricesDesktop',
                tidPostfix: ScreenViews.Desktop,
            }),
        );

        expect(screen.getByTestId('amend-dates-summary-block')).toHaveClass('amendSummaryDates');
    });

    it('should render summary price component on mobile', () => {
        mockUseMobileViewport = true;

        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('summary-prices')).toBeInTheDocument();
        expect(mockPricesProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
                className: 'pricesMobile',
                tidPostfix: ScreenViews.Mobile,
            }),
        );
    });

    it('should render amendSummaryDates block with .withFeeBanner classname when feePP is included', () => {
        mockStores.amendDatesStore.feePP = 12;
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('amend-dates-summary-block')).toHaveClass('amendSummaryDates withFeeBanner');
    });

    it('Should render product unavailable popup when isValidatedOfferUnavailable is true', () => {
        mockStores.amendDatesStore.isValidatedOfferUnavailable = true;
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId(PlaceholderNames.ProductUnavailablePopup)).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'product-unavailable-popup',
                onClose: mockStores.routerStore.redirectToAmendDatesPage,
                rendering: mockProps.rendering,
            }),
        );
    });

    it('Render null if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<AmendDatesSummary {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render null if no booking', () => {
        mockStores.amendDatesStore = { ...mockStores.amendDatesStore, booking: null };
        const { container } = render(<AmendDatesSummary {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Hide header if in settings was turned off', () => {
        mockProps.fields.IsStickySummaryEnabled = null;
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.queryByTestId('sticky-header')).not.toBeInTheDocument();
    });

    it('Render other departure airports popup', () => {
        mockStores.amendFlightsStore.isOtherDepartureAirportsPopupShown = true;
        mockStores.amendDatesStore.booking = mockBooking;
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('other-departure-airports-popup')).toBeInTheDocument();
        expect(mockOtherDepartureAirportsPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({ airportName: mockOutboundFlight.depName }),
        );
    });

    it('Render change your dates in breadcrumb', () => {
        render(<AmendDatesSummary {...mockProps} />);

        expect(mockHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({ breadcrumbRootPath: SitePath.AmendDates }),
        );
    });

    it('Render error popup if isSummaryRequestError = true', () => {
        mockStores.amendDatesStore.isSummaryRequestError = true;

        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('error-popup')).toBeInTheDocument();
        expect(mockAmendBookingErrorPopupProps).toHaveBeenCalledWith({ onClose: expect.any(Function) });
    });

    it('Should call appropriate method when click on error popup close cta', async () => {
        mockStores.amendDatesStore.isSummaryRequestError = true;
        mockStores.amendDatesStore.setIsSummaryRequestError = jest.fn();

        render(<AmendDatesSummary {...mockProps} />);

        await userEvent.click(screen.getByTestId('error-popup'));

        expect(mockStores.amendDatesStore.setIsSummaryRequestError).toHaveBeenCalledWith(false);
    });

    it('Does not render error popup if isSummaryRequestError = false', () => {
        mockStores.amendDatesStore.isSummaryRequestError = false;

        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.queryByTestId('error-popup')).not.toBeInTheDocument();
    });

    it('Render overlay spinner when loading state', () => {
        mockStores.amendDatesStore.isInitialDataLoading = true;
        mockStores.amendDatesStore = {
            ...mockStores.amendDatesStore,
            booking: null,
        };
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith(
            expect.objectContaining({ header: 'AmendDates.Labels.ValidatingDates' }),
        );
    });

    it('Render overlay spinner when isLoadingBookingFromPayload state is active', () => {
        mockStores.viewBookingStore.isLoadingBookingFromPayload = true;
        mockStores.amendDatesStore = {
            ...mockStores.amendDatesStore,
            booking: null,
        };
        render(<AmendDatesSummary {...mockProps} />);

        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
    });

    it('Should call clearValidatedSeats on unmount', () => {
        const { unmount } = render(<AmendDatesSummary {...mockProps} />);

        unmount();

        expect(mockStores.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
    });

    describe('PriceJumpPopup', () => {
        it('Render PriceJumpPopup', () => {
            mockStores.amendDatesStore.isInitialDataLoading = false;
            render(<AmendDatesSummary {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.PriceJumpPopup)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                name: PlaceholderNames.PriceJumpPopup,
                rendering: mockProps.rendering,
            });
        });

        it('Do not render if loading', () => {
            mockStores.amendDatesStore.isInitialDataLoading = true;
            render(<AmendDatesSummary {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.PriceJumpPopup)).not.toBeInTheDocument();
        });
    });

    describe('MobileBasket', () => {
        it('Should render MobileBasket when isMobile', () => {
            mockUseMobileViewport = true;
            render(<AmendDatesSummary {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.MobileBasket,
                    rendering: mockProps.rendering,
                    hasOptionSelected: true,
                    handleSubmit: mockStores.amendDatesStore.confirmChosenDates,
                    price: 10,
                }),
            );
            expect(screen.getByTestId('dates-basket')).toBeInTheDocument();
        });

        it('Should NOT render MobileBasket when isMobile is false', () => {
            mockUseMobileViewport = false;
            render(<AmendDatesSummary {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.MobileBasket)).not.toBeInTheDocument();
            expect(screen.queryByTestId('dates-basket')).not.toBeInTheDocument();
        });
    });

    describe('ChangeFeeInfo', () => {
        it('Should render AmendSummaryStickyHeader with calloutProps if ChangeFeeInfo rendering is present and feePP is not null', () => {
            mockStores.amendDatesStore.feePP = 25;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockStickyHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    calloutProps: {
                        position: CalloutPosition.Right,
                        orientation: CalloutOrientation.Bottom,
                        isShownOnHover: true,
                        content: expect.anything(),
                    },
                }),
            );
        });

        it('Should render MobileBasket with calloutProps if ChangeFeeInfo rendering is present and feePP is not null', () => {
            mockUseMobileViewport = true;
            mockStores.amendDatesStore.feePP = 25;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    calloutProps: {
                        drawerTitle: mockProps.rendering.placeholders[PlaceholderNames.ChangeFeeInfo][0].fields.Title,
                        content: expect.anything(),
                        isDrawerVariant: true,
                        drawerTitleClassName: 'priceDrawerTitle',
                    },
                }),
            );
        });

        it('Should NOT render AmendSummaryStickyHeader with calloutProps if ChangeFeeInfo rendering is not present', () => {
            mockProps.rendering.placeholders[PlaceholderNames.ChangeFeeInfo] = null;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockStickyHeaderProps).toHaveBeenCalledWith(
                expect.not.objectContaining({ calloutProps: expect.anything() }),
            );
        });

        it('Should NOT render MobileBasket with calloutProps if ChangeFeeInfo rendering is not present', () => {
            mockProps.rendering.placeholders[PlaceholderNames.ChangeFeeInfo] = null;
            mockUseMobileViewport = true;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    calloutProps: expect.anything(),
                }),
            );
        });

        it('Should NOT render AmendSummaryStickyHeader with calloutProps if feePP is null', () => {
            mockStores.amendDatesStore.feePP = null;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockStickyHeaderProps).toHaveBeenCalledWith(
                expect.not.objectContaining({ calloutProps: expect.anything() }),
            );
        });

        it('Should NOT render MobileBasket with calloutProps if feePP is null', () => {
            mockStores.amendDatesStore.feePP = null;
            mockUseMobileViewport = true;
            render(<AmendDatesSummary {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    calloutProps: expect.anything(),
                }),
            );
        });
    });
});
