import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import {
    createMockStores,
    mockAmendBookingPayload,
    mockAmendDatesOfferWithPrice,
    mockAmendHotelOffer,
    mockAmendRoomAndBoardStore,
    mockPriceJumpPopupFields,
    mockTransfersWithAmendmentCharges,
    mockValidatedFlights,
} from 'frontend/__mocks__';
import { AmendEventActions } from 'models/data/tracking/AmendEvent';
import { gaTriggerPriceJumpPopup } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import PriceJumpPopup, { TPriceJumpPopupProps } from './PriceJumpPopup';

let mockProps: TPriceJumpPopupProps;
let mockStores;

const mockGetPriceFunction = jest.fn();
jest.mock('./PriceJumpPopup.utils', () => ({
    __esModule: true,
    ...jest.requireActual('./PriceJumpPopup.utils'),
    getPrices: (...params) => mockGetPriceFunction(...params),
}));

const mockPopupContentProps = jest.fn();
jest.mock('./components/PriceJumpPopupContent/PriceJumpPopupContent', () => ({
    __esModule: true,
    default: props => {
        mockPopupContentProps(props);

        return <div data-tid='content' />;
    },
}));

const mockPopupFooterProps = jest.fn();
jest.mock('./components/PriceJumpPopupFooter/PriceJumpPopupFooter', () => ({
    __esModule: true,
    default: ({ onClose, onDecline, ...props }) => {
        mockPopupFooterProps(props);

        return (
            <div data-tid='footer'>
                <div data-tid='footer-close' onClick={onClose} />
                <div data-tid='footer-decline' onClick={onDecline} />
            </div>
        );
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: { replaceTokens: jest.fn((s, v) => `${s} ${Object.values(v).join(' ')}`) },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPushTrackingEvent = jest.fn();
jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ footerContent, children, ...props }) => {
        mockPopupProps(props);

        return (
            <div data-tid='popup'>
                {footerContent}
                {children}
            </div>
        );
    },
}));

const mockUseTrackAppear = jest.fn();
const mockUseTrackInteraction = jest.fn();
jest.mock('./hooks/usePriceJumpPopupTracking', () => ({
    __esModule: true,
    usePriceJumpPopupTracking: () => ({
        trackAppear: mockUseTrackAppear,
        trackInteraction: mockUseTrackInteraction,
    }),
}));

describe('<PriceJumpPopup />', () => {
    beforeEach(() => {
        mockGetPriceFunction.mockReturnValue({
            deltaPrice: 10,
            totalPrice: 100,
            isPriceJumpPopupShownByPrice: true,
        });

        mockStores = createMockStores({
            amendPaymentStore: {
                isRefund: true,
                isFromAmendFlight: false,
                isFromAmendHotel: false,
                currency: CurrencyCode.GBP,
                goBackToPreviousPage: jest.fn(),
                totalPrice: 100,
                prevSelectedItemPrice: 10,
            },
            amendDatesStore: {
                setPrevOfferWithPrices: jest.fn(),
                prevOfferWithPrices: {
                    ...mockAmendDatesOfferWithPrice,
                    amendmentDatesCharges: 55,
                },
            },
            amendRoomAndBoardStore: mockAmendRoomAndBoardStore,
            amendFlightsStore: {
                selectedFlight: mockValidatedFlights.transports[0],
                prevSelectedFlight: mockValidatedFlights.transports[1],
            },
            amendTransfersStore: {
                selectedTransfer: mockTransfersWithAmendmentCharges[0],
                prevSelectedTransfer: mockTransfersWithAmendmentCharges[1],
            },
            amendHotelStore: {
                newlySelectedHotelOffer: mockAmendHotelOffer,
                prevSelectedHotelOffer: {
                    ...mockAmendHotelOffer,
                    amendmentPaymentInfo: {
                        ...mockAmendHotelOffer.amendmentPaymentInfo,
                        amendmentChargesWithoutFees: 13,
                    },
                    hotel: {
                        ...mockAmendHotelOffer.hotel,
                        name: 'mock_hotel_name',
                    },
                },
                setPrevSelectedHotelOffer: jest.fn(),
            },
            layoutStore: {
                isAmendFlightsPage: true,
                isAmendDatesSummaryPage: false,
                isAmendPaymentPage: false,
                isAmendHotelSummaryPage: false,
                isAmendTransfersPage: false,
            },
            appStore: {
                amendBookingItemPayload: mockAmendBookingPayload,
            },
            routerStore: {
                redirectToAmendHotelPage: jest.fn(),
            },
        });
        mockProps = {
            params: {},
            rendering: undefined,
            fields: mockPriceJumpPopupFields,
        };
    });

    Object.defineProperty(window, 'scrollTo', {
        configurable: true,
    });
    window.scrollTo = jest.fn();

    it('Should render component', async () => {
        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(mockPopupContentProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            description: 'DefaultDescription StatusIncreased £10 £100',
            refundDescription: 'RefundDescription £100',
            isRefund: false,
            isOnlyOneButton: true,
            promoCodeSubtitle: { value: 'PromoUpgradeLabel' },
        });

        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(mockPopupFooterProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isOnlyCloseButton: true,
            isOnlyContinueButton: false,
        });

        expect(mockGetPriceFunction).toHaveBeenCalledWith({
            flight: { isPage: true, price: 226, prevPrice: 234 },
            transfer: { isPage: false, price: 13, prevPrice: 0 },
            dates: { isPage: false, price: 10, prevPrice: 55 },
            payment: { isPage: false, price: 100, prevPrice: 10 },
            hotel: { isPage: false, price: 80, prevPrice: 13, totalPriceToBeShown: 57.89 },
        });
    });

    it('should be rendered on AmendPayment page', () => {
        mockStores.layoutStore.isAmendPaymentPage = true;
        mockGetPriceFunction.mockReturnValue({ isPriceJumpPopupShownByPrice: true });
        mockStores.amendPaymentStore.isLoadingData = false;
        mockStores.amendPaymentStore.isProductUnavailable = false;

        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should be rendered on AmendDatesSummary page', () => {
        mockStores.layoutStore.isAmendDatesSummaryPage = false;
        mockGetPriceFunction.mockReturnValue({ isPriceJumpPopupShownByPrice: true });
        mockStores.viewBookingStore.isLoadingBookingFromPayload = false;

        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should be rendered with common requirements', () => {
        mockGetPriceFunction.mockReturnValue({ isPriceJumpPopupShownByPrice: true });
        mockStores.viewBookingStore.isLoadingBookingFromPayload = false;
        mockStores.viewBookingStore.isAmendErrorPopupShown = false;

        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should NOT be rendered if isPriceJumpPopupShownByPrice is false', () => {
        mockGetPriceFunction.mockReturnValue({ isPriceJumpPopupShownByPrice: false });

        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should render component for amend transfer page', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendTransfersPage = true;

        render(<PriceJumpPopup {...mockProps} />);

        expect(mockGetPriceFunction).toHaveBeenCalledWith({
            flight: { isPage: false, price: 226, prevPrice: 234 },
            transfer: { isPage: true, price: 13, prevPrice: 0 },
            dates: { isPage: false, price: 10, prevPrice: 55 },
            payment: { isPage: false, price: 100, prevPrice: 10 },
            hotel: { isPage: false, price: 80, prevPrice: 13, totalPriceToBeShown: 57.89 },
        });
    });

    it('should render component for dates summary page', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendDatesSummaryPage = true;

        render(<PriceJumpPopup {...mockProps} />);

        expect(mockGetPriceFunction).toHaveBeenCalledWith({
            flight: { isPage: false, price: 226, prevPrice: 234 },
            transfer: { isPage: false, price: 13, prevPrice: 0 },
            dates: { isPage: true, price: 10, prevPrice: 55 },
            payment: { isPage: false, price: 100, prevPrice: 10 },
            hotel: { isPage: false, price: 80, prevPrice: 13, totalPriceToBeShown: 57.89 },
        });
    });

    it('should render component for hotel summary page', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendHotelSummaryPage = true;

        render(<PriceJumpPopup {...mockProps} />);

        expect(mockGetPriceFunction).toHaveBeenCalledWith({
            flight: { isPage: false, price: 226, prevPrice: 234 },
            transfer: { isPage: false, price: 13, prevPrice: 0 },
            dates: { isPage: false, price: 10, prevPrice: 55 },
            payment: { isPage: false, price: 100, prevPrice: 10 },
            hotel: { isPage: true, price: 80, prevPrice: 13, totalPriceToBeShown: 57.89 },
        });
    });

    it('should render component for hotel summary page with previous price from amendmentChargesInfo', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendHotelSummaryPage = true;
        mockStores.amendHotelStore.prevSelectedHotelOffer.amendmentPaymentInfo = null;

        render(<PriceJumpPopup {...mockProps} />);

        expect(mockGetPriceFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                hotel: { isPage: true, price: 80, prevPrice: 57.89, totalPriceToBeShown: 57.89 },
            }),
        );
    });

    it('should render component for hotel payment page', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendPaymentPage = true;

        render(<PriceJumpPopup {...mockProps} />);

        expect(mockGetPriceFunction).toHaveBeenCalledWith({
            flight: { isPage: false, price: 226, prevPrice: 234 },
            transfer: { isPage: false, price: 13, prevPrice: 0 },
            dates: { isPage: false, price: 10, prevPrice: 55 },
            payment: { isPage: true, price: 100, prevPrice: 10 },
            hotel: { isPage: false, price: 80, prevPrice: 13, totalPriceToBeShown: 57.89 },
        });
    });

    it('Should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<PriceJumpPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should promo subtitle NOT be rendered if no promo code has been provided', () => {
        mockStores.amendRoomAndBoardStore.chosenRoomVariant.promoCodeBreakDown = undefined;
        render(<PriceJumpPopup {...mockProps} />);

        expect(screen.queryByTestId('promo-subtitle')).not.toBeInTheDocument();
    });

    it('Should render increase amount', () => {
        render(<PriceJumpPopup {...mockProps} />);

        expect(mockPopupContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'DefaultDescription StatusIncreased £10 £100',
                refundDescription: 'RefundDescription £100',
            }),
        );
    });

    it('Should render decrease amount', () => {
        mockGetPriceFunction.mockReturnValue({
            deltaPrice: -10,
            totalPrice: 100,
            isPriceJumpPopupShownByPrice: true,
        });
        render(<PriceJumpPopup {...mockProps} />);

        expect(mockPopupContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'DefaultDescription StatusDecreased £10 £100',
                refundDescription: 'RefundDescription £100',
            }),
        );
    });

    it('Should call Content with transfer description', () => {
        mockStores.amendPaymentStore.isFromAmendTransfer = true;
        render(<PriceJumpPopup {...mockProps} />);

        expect(mockPopupContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'TransferDescription StatusIncreased £10 £100',
            }),
        );
    });

    it('Should call Content with flight description', () => {
        mockStores.amendPaymentStore.isFromAmendFlight = true;
        render(<PriceJumpPopup {...mockProps} />);

        expect(mockPopupContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'FlightDescription StatusIncreased £10 £100',
            }),
        );
    });

    describe('Handle of closing price jump popup', () => {
        it('Should call onClose function on close click', async () => {
            const { container } = render(<PriceJumpPopup {...mockProps} />);

            const closeBtn = screen.getByTestId('footer-close');
            await userEvent.click(closeBtn);

            expect(mockStores.trackingStore.trackGenericAmendmentAction).not.toHaveBeenCalled();
            expect(container).toBeEmptyDOMElement();
        });

        it('should be managed when on amend hotel summary page', async () => {
            mockStores.layoutStore.isAmendHotelSummaryPage = true;

            render(<PriceJumpPopup {...mockProps} />);

            const closeBtn = screen.getByTestId('footer-close');
            await userEvent.click(closeBtn);

            expect(mockStores.amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(
                mockStores.amendHotelStore.newlySelectedHotelOffer,
            );
            expect(mockUseTrackInteraction).toHaveBeenCalledWith(10, true);
        });

        it('should call setDatesPrevOfferWithPrices when on amend dates summary page', async () => {
            mockStores.layoutStore.isAmendDatesSummaryPage = true;

            render(<PriceJumpPopup {...mockProps} />);

            const closeBtn = screen.getByTestId('footer-close');
            await userEvent.click(closeBtn);

            expect(mockStores.amendDatesStore.setPrevOfferWithPrices).toHaveBeenCalledWith(null);
        });
    });

    describe('Decline click', () => {
        it('Should call goBackToPreviousPage function on decline click', async () => {
            render(<PriceJumpPopup {...mockProps} />);

            const declineBtn = screen.getByTestId('footer-decline');
            await userEvent.click(declineBtn);

            expect(mockStores.amendPaymentStore.goBackToPreviousPage).toHaveBeenCalled();
        });

        it('Should call logic functions on decline click, when is on isAmendHotelSummaryPage', async () => {
            mockStores.layoutStore.isAmendHotelSummaryPage = true;
            render(<PriceJumpPopup {...mockProps} />);

            const declineBtn = screen.getByTestId('footer-decline');
            await userEvent.click(declineBtn);

            expect(mockStores.routerStore.redirectToAmendHotelPage).toHaveBeenCalled();
            expect(mockUseTrackInteraction).toHaveBeenCalledWith(10);
            expect(mockStores.amendPaymentStore.goBackToPreviousPage).not.toHaveBeenCalled();
        });

        it('Call redirectToAmendHotelPage function on decline click, when amendPaymentStore.isFromAmendHotel is true', async () => {
            mockStores.amendPaymentStore.isFromAmendHotel = true;
            render(<PriceJumpPopup {...mockProps} />);

            const declineBtn = screen.getByTestId('footer-decline');
            await userEvent.click(declineBtn);

            expect(mockStores.routerStore.redirectToAmendHotelPage).toHaveBeenCalled();
            expect(mockStores.amendPaymentStore.goBackToPreviousPage).not.toHaveBeenCalled();
        });
    });

    it('Should call track function on button click for transfers', async () => {
        mockStores.amendPaymentStore.isFromAmendTransfer = true;
        render(<PriceJumpPopup {...mockProps} />);

        const closeBtn = screen.getByTestId('footer-close');
        await userEvent.click(closeBtn);

        expect(mockStores.trackingStore.trackGenericAmendmentAction).toHaveBeenCalledWith(
            AmendEventActions.ChangeTransfer,
            'Price Change: Close',
        );
    });

    it('should push tracking events price jump popup if it is shown', async () => {
        render(<PriceJumpPopup {...mockProps} />);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaTriggerPriceJumpPopup);
        expect(mockUseTrackAppear).toHaveBeenCalledWith(10);
    });

    describe('Render content with isOnlyOneButton prop', () => {
        it('should render content with isOnlyOneButton props as false, when no any criteria meet', () => {
            mockStores.layoutStore.isAmendDatesSummaryPage = false;
            mockStores.layoutStore.isAmendTransfersPage = false;
            mockStores.layoutStore.isAmendFlightsPage = false;

            render(<PriceJumpPopup {...mockProps} />);

            expect(mockPopupContentProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOnlyOneButton: false,
                }),
            );
        });

        it('should render content with isOnlyOneButton props as true, when isAmendDatesSummaryPage', () => {
            mockStores.layoutStore.isAmendDatesSummaryPage = true;

            render(<PriceJumpPopup {...mockProps} />);

            expect(mockPopupContentProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOnlyOneButton: true,
                }),
            );
        });

        it('should render content with isOnlyOneButton props as true, with isAmendTransfersPage', () => {
            mockStores.layoutStore.isAmendTransfersPage = true;

            render(<PriceJumpPopup {...mockProps} />);

            expect(mockPopupContentProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOnlyOneButton: true,
                }),
            );
        });

        it('should render content with isOnlyOneButton props as true, with isAmendFlightsPage', () => {
            mockStores.layoutStore.isAmendFlightsPage = true;

            render(<PriceJumpPopup {...mockProps} />);

            expect(mockPopupContentProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOnlyOneButton: true,
                }),
            );
        });
    });
});
