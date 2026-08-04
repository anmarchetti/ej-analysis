import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockSelectedSeats } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { TrackingEventCodes } from 'models/data/ISeatMapWidgetTrackingEvent';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { SeatType } from 'models/enum/SeatType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import SeatMap, { ISeatMapProps } from './SeatMap';
import { getSitTogetherWebStorageKeyFromDirection, getSitTogetherWebStorageKeyValue } from './SeatMap.utils';

jest.mock('next/script', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');

    const ScriptMock: React.FC<any> = ({ onLoad, onReady }) => {
        React.useEffect(() => {
            onLoad?.();
            onReady?.();
        }, [onLoad, onReady]);

        return <div data-tid='seat-map-script' />;
    };

    return {
        __esModule: true,
        default: ScriptMock,
    };
});

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div>RichTextWithLinks.{field.value}</div>,
}));

const mockFields = {
    BackToExtrasLabel: mockSitecoreField('BackToExtrasLabel'),
    BackToViewBookingLabel: mockSitecoreField('BackToViewBookingLabel'),
    BackToSummaryLabel: mockSitecoreField('BackToSummaryLabel'),
    BtnCancel: mockSitecoreField('BtnCancel'),
    BenefitsHeadImageBackground: mockSitecoreField(mockSitecoreImageField('BenefitsHeadImageBackground')),
    BenefitsTable: [],
    SeatsMapTitle: mockSitecoreField('SeatsMapTitle'),
    SeatsSubtitle: mockSitecoreField('SeatsSubtitle'),
    SeatsMapTitleMobile: mockSitecoreField('SeatsMapTitleMobile'),
    SpinnerHeader: mockSitecoreField('SpinnerHeader'),
    SelectionActionText: mockSitecoreField('SelectionActionText'),
    FullSelectionActionText: mockSitecoreField('FullSelectionActionText'),
    EmptySelectionBtnText: mockSitecoreField('EmptySelectionBtnText'),
    ContinueToReturnBtnText: mockSitecoreField('ContinueToReturnBtnText'),
    ConfirmSeatsBtnText: mockSitecoreField('ConfirmSeatsBtnText'),
    OutboundFlightDirectionName: mockSitecoreField('OutboundFlightDirectionName'),
    InboundFlightDirectionName: mockSitecoreField('InboundFlightDirectionName'),
    LoadingScreenTitle: mockSitecoreField('LoadingScreenTitle'),
    PerPersonLabel: mockSitecoreField('PerPersonLabel'),
    CancellationPopUpBackButton: mockSitecoreField('CancellationPopUpBackButton'),
    CancellationPopUpDescription: mockSitecoreField('CancellationPopUpDescription'),
    CancellationPopUpContinueButton: mockSitecoreField('CancellationPopUpContinueButton'),
    CancellationPopUpTitle: mockSitecoreField('CancellationPopUpTitle'),
    SeatsMapTitleLuxury: mockSitecoreField('SeatsMapTitleLuxury'),
    SeatsSubtitleLuxury: mockSitecoreField('SeatsSubtitleLuxury'),
};

const createProps = (): ISeatMapProps => ({
    props: {
        adultsCount: 2,
        childrenCount: 0,
        adultsWithInfantsCount: 0,
        depAirportCodeOut: '1234',
        arrAirportCodeOut: '56789',
        depDateOut: 'date1',
        flightNumberOut: '1234',
    },
    onClose: jest.fn(),
    fields: mockFields,
    params: {},
    rendering: {},
});

const createStore = () =>
    createMockStores({
        seatMapStore: {
            isProcessingSeatSelection: false,
            setOpenSeatMapForced: jest.fn(),
            validatedSelectedSeats: mockSelectedSeats,
        },
        flightsPassengersStore: {
            children: undefined,
        },
        appStore: {
            isScreenLarge: true,
        },
        trackingStore: {
            trackSeatsPageLoad: jest.fn(),
        },
        layoutStore: {
            isTradePortal: false,
        },
    });

let mockProps = createProps();
let mockStore = createStore();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

const mockSeatMapContent = jest.fn();
jest.mock('./components/SeatMapContent/SeatMapContent', () => ({
    __esModule: true,
    default: props => {
        mockSeatMapContent(props);

        return <div data-tid='seat-map-content' />;
    },
}));

const mockNavigationActionsBlock = jest.fn();
jest.mock('./components/NavigationActionsBlock/NavigationActionsBlock', () => ({
    __esModule: true,
    default: ({ onSelectSeats, ...props }) => {
        mockNavigationActionsBlock(props);

        return (
            <div data-tid='navigation-actions-block'>
                <button onClick={onSelectSeats}>onSelectSeats</button>
            </div>
        );
    },
}));

const mockFullScreenPopup = jest.fn();
jest.mock('frontend/components/common/FullScreenPopup/FullScreenPopup', () => ({
    __esModule: true,
    default: ({ onClose, navigationActionBlock, children, ...props }) => {
        mockFullScreenPopup(props);

        return (
            <div data-tid='full-screen-popup'>
                <button onClick={onClose}>onClose</button>
                {navigationActionBlock}
                {children}
            </div>
        );
    },
}));

const mockCancellationPopUp = jest.fn();
jest.mock('./components/CancellationPopUp/CancellationPopUp', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCancellationPopUp(props);

        return <div data-tid='cancellation-pop-up' />;
    },
}));

const mockGetBackButtonLabel = jest.fn().mockReturnValue(mockFields.BackToExtrasLabel);
jest.mock('frontend/components/renderings/SeatMap/SeatMap.utils', () => ({
    getBackButtonLabel: () => mockGetBackButtonLabel(),
    saveSitTogetherToSessionStorage: jest.fn(),
    getSitTogetherWebStorageKeyFromDirection: jest.fn(),
    getSitTogetherWebStorageKeyValue: jest.fn(),
}));

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(),
    setWebStorageItem: jest.fn(),
}));

const mockScript = jest.fn();
jest.mock('next/script', () => ({
    __esModule: true,
    default: ({ onReady, onLoad }) => {
        mockScript({ onReady, onLoad });

        //   onLoad();
        onReady();

        return <script data-tid='script' />;
    },
}));

const startSeatSelection = jest.fn();
const setApiUrl = jest.fn();
window.SeatsMapWidget = {
    startSeatSelection,
    setApiUrl,
    on: jest.fn(),
    setTranslations: jest.fn(),
    checkIfNewSeatsSelected: jest.fn(),
    clearAllSeats: jest.fn(),
    clearChangeListeners: jest.fn(),
    clearTrackingEventListeners: jest.fn(),
};

describe('<SeatMap />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createStore();
    });

    it('should not render if no fields', () => {
        delete mockProps.fields;

        const { container } = render(<SeatMap {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('<FullScreenPopup />', () => {
        it('should render FullScreenPopup', () => {
            render(<SeatMap {...mockProps} />);

            expect(screen.queryByTestId('full-screen-popup')).toBeInTheDocument();
            expect(mockFullScreenPopup).toBeCalledWith(
                expect.objectContaining({
                    fields: {
                        BackToLabel: mockProps.fields?.BackToExtrasLabel,
                        BtnCancel: mockProps.fields?.BtnCancel,
                    },
                    isMobile: false,
                    isInitialized: false,
                }),
            );

            expect(screen.queryByTestId('navigation-actions-block')).toBeInTheDocument();
            expect(mockNavigationActionsBlock).toBeCalledWith(
                expect.objectContaining({
                    fields: mockProps.fields,
                    totalPassengers: 2,
                    widgetOutputData: {
                        direction: SeatMapFlightDirection.Outbound,
                        selectedSeatLength: 0,
                        actionMode: NavigationActionMode.EmptySelection,
                        isSelectionEmpty: false,
                        isSelectionIncorrect: false,
                        isSelectionImpossible: false,
                    },
                }),
            );

            expect(screen.queryByTestId('seat-map-content')).toBeInTheDocument();
            expect(mockSeatMapContent).toHaveBeenCalledWith({
                ...mockProps.fields,
            });
        });
    });

    describe('onClose', () => {
        it('should open cancel popup when seats are selected', async () => {
            window.SeatsMapWidget.checkIfNewSeatsSelected.mockReturnValue(true);

            const { getByRole, queryByTestId } = render(<SeatMap {...mockProps} />);

            const button = getByRole('button', { name: 'onClose' });

            await userEvent.click(button);

            expect(mockProps.onClose).not.toHaveBeenCalled();

            expect(queryByTestId('cancellation-pop-up')).toBeInTheDocument();
            expect(mockCancellationPopUp).toBeCalledWith(
                expect.objectContaining({
                    CancellationPopUpBackButton: mockProps.fields?.CancellationPopUpBackButton,
                    CancellationPopUpDescription: mockProps.fields?.CancellationPopUpDescription,
                    CancellationPopUpContinueButton: mockProps.fields?.CancellationPopUpContinueButton,
                    CancellationPopUpTitle: mockProps.fields?.CancellationPopUpTitle,
                    onSeatMapClose: expect.anything(),
                    setIsCancelPopupOpened: expect.anything(),
                }),
            );
        });

        it('should call onClose prop function when NO seats are selected', async () => {
            window.SeatsMapWidget.checkIfNewSeatsSelected.mockReturnValue(false);

            const { getByRole, queryByTestId } = render(<SeatMap {...mockProps} />);

            const button = getByRole('button', { name: 'onClose' });

            await userEvent.click(button);

            expect(mockProps.onClose).toBeCalled();
            expect(queryByTestId('cancellation-pop-up')).not.toBeInTheDocument();
            expect(mockCancellationPopUp).not.toBeCalled();
        });
    });

    it('should call startSeatSelection with right params', () => {
        mockStore.seatMapStore.seatWidgetWasLoadedOnce = true;

        render(<SeatMap {...mockProps} />);

        expect(startSeatSelection).toHaveBeenCalledWith(
            mockProps.props.adultsCount,
            mockProps.props.childrenCount,
            mockProps.props.adultsWithInfantsCount,
            mockProps.props.depAirportCodeOut,
            mockProps.props.arrAirportCodeOut,
            mockProps.props.depDateOut,
            mockProps.props.flightNumberOut,
            mockProps.props.depAirportCodeIn,
            mockProps.props.arrAirportCodeIn,
            mockProps.props.depDateIn,
            mockProps.props.flightNumberIn,
            expect.objectContaining({
                selector: '#seat-map',
                hideCtaFlow: true,
                shouldSeatAll: true,
                initialSelection: mockStore.seatMapStore.seatMapInitialSelection,
                timeBannerAutoHide: mockStore.seatMapStore.seatsMapTimeBannerAutoHide,
                responseOverride: mockStore.seatMapStore.seatsResponse,
                isPostBooking: false,
                isTradePortal: false,
                isPricesHidden: false,
                isLuxury: false,
                trackSeatMapTabSwitching: mockStore.trackingStore.trackSeatMapTabSwitching,
                includedSeatCategories: [],
            }),
            undefined,
        );
    });

    it('should call startSeatSelection with right params for luxury package', () => {
        mockStore.seatMapStore.seatWidgetWasLoadedOnce = true;
        mockStore.bookingStore.isLuxuryPackage = true;

        render(<SeatMap {...mockProps} />);

        expect(startSeatSelection).toHaveBeenCalledWith(
            mockProps.props.adultsCount,
            mockProps.props.childrenCount,
            mockProps.props.adultsWithInfantsCount,
            mockProps.props.depAirportCodeOut,
            mockProps.props.arrAirportCodeOut,
            mockProps.props.depDateOut,
            mockProps.props.flightNumberOut,
            mockProps.props.depAirportCodeIn,
            mockProps.props.arrAirportCodeIn,
            mockProps.props.depDateIn,
            mockProps.props.flightNumberIn,
            expect.objectContaining({
                selector: '#seat-map',
                hideCtaFlow: true,
                shouldSeatAll: true,
                initialSelection: mockStore.seatMapStore.seatMapInitialSelection,
                timeBannerAutoHide: mockStore.seatMapStore.seatsMapTimeBannerAutoHide,
                responseOverride: mockStore.seatMapStore.seatsResponse,
                isPostBooking: false,
                isTradePortal: false,
                isPricesHidden: false,
                isLuxury: true,
                trackSeatMapTabSwitching: mockStore.trackingStore.trackSeatMapTabSwitching,
                includedSeatCategories: [SeatType.Standard, SeatType.RearStandard],
            }),
            undefined,
        );
    });

    describe('trackingEvent', () => {
        let trackingEventCallback = jest.fn();

        beforeEach(() => {
            window.SeatsMapWidget.on = jest.fn((event, callback) => {
                if (event === 'trackingEvent') {
                    trackingEventCallback = callback;
                }
            });

            mockStore.seatMapStore.seatWidgetWasLoadedOnce = true;
            mockStore.seatMapStore.validatedSelectedSeats = [];
        });

        it('should call trackSeatMapSitTogetherClick on a sit together click event', async () => {
            render(<SeatMap {...mockProps} />);

            trackingEventCallback({
                code: TrackingEventCodes.SitTogetherClicked,
                data: { isChecked: true, flightDirection: SeatMapFlightDirection.Inbound },
            });

            expect(mockStore.trackingStore.trackSeatMapSitTogetherClick).toHaveBeenCalledWith({
                isChecked: true,
                flightDirection: SeatMapFlightDirection.Inbound,
            });
        });

        it('should call setWebStorageItem on a sit together impression event', async () => {
            (getSitTogetherWebStorageKeyFromDirection as jest.Mock).mockReturnValue(
                WebStorageKeys.SeatTogetherCheckboxDeparture,
            );
            (getSitTogetherWebStorageKeyValue as jest.Mock).mockReturnValue('unavailable');
            render(<SeatMap {...mockProps} />);

            trackingEventCallback({
                code: TrackingEventCodes.SitTogetherImpression,
                data: { isAvailable: false, flightDirection: SeatMapFlightDirection.Outbound },
            });

            expect(setWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.SeatTogetherCheckboxDeparture,
                'unavailable',
                {},
            );
        });

        it('should call setWebStorageItem on a sit together clicked event', async () => {
            (getSitTogetherWebStorageKeyFromDirection as jest.Mock).mockReturnValue(
                WebStorageKeys.SeatTogetherCheckboxReturn,
            );
            (getSitTogetherWebStorageKeyValue as jest.Mock).mockReturnValue('checked');
            render(<SeatMap {...mockProps} />);

            trackingEventCallback({
                code: TrackingEventCodes.SitTogetherClicked,
                data: { isChecked: true, flightDirection: SeatMapFlightDirection.Inbound },
            });

            expect(setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.SeatTogetherCheckboxReturn, 'checked', {});
        });
    });
});
