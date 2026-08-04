import { renderHook } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { isTradeStore } from 'frontend/store/tradePortal';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventLabels } from 'models/enum/tracking/GenericEventParams';
import * as paymentTrackingUtils from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import usePaymentJumpPopup, {
    EVENT_ACTION_PAYMENT_JUMP_NAME,
    EVENT_LABEL_ACCEPT,
    EVENT_LABEL_DECLINE,
} from './PaymentJumpPopup.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useRef: jest.fn(),
}));

let mockProps;
let mockStores;

const mockTrackPaymentPriceJump = jest.fn();
jest.spyOn(paymentTrackingUtils, 'usePaymentPriceJumpTracking').mockReturnValue({
    trackPaymentPriceJump: mockTrackPaymentPriceJump,
});

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(),
}));

describe('usePaymentJumpPopup', () => {
    beforeEach(() => {
        mockProps = {
            acceptButton: { value: 'accept' },
            declineButton: { value: 'decline' },
            description: { value: 'description {price}' },
        };
        mockStores = createMockStores({
            bookingStore: {
                isPaymentPriceJump: true,
                priceAfterJump: 2000,
                setIsPaymentPriceJump: jest.fn(),
                validatePackage: jest.fn(),
                isFlightAndHotelPackage: false,
            },
            marketStore: { formatMoney: jest.fn(() => '2000'), currency: CurrencyCode.GBP },
            routerStore: { redirectToSearchResultsPage: jest.fn() },
            payStore: { setAmount: jest.fn() },
            paymentStore: { isDeposit: true },
            layoutStore: { isTradePortal: false },
            trackingStore: { trackEventWithParams: jest.fn() },
            queryParamStore: { buildFlightPlusHotelUrl: jest.fn() },
        });
        jest.mocked(isTradeStore).mockReturnValue(false);
    });

    describe('mount logic', () => {
        it('should call trackPaymentPriceJump when isPaymentPriceJump is true', () => {
            renderHook(() => usePaymentJumpPopup(mockProps));

            expect(mockTrackPaymentPriceJump).toHaveBeenCalledWith({
                event_action: EVENT_ACTION_PAYMENT_JUMP_NAME,
                event_label: EventLabels.Impression,
            });
        });

        it('should NOT call trackPaymentPriceJump when isPaymentPriceJump is false', () => {
            mockStores.bookingStore.isPaymentPriceJump = false;

            renderHook(() => usePaymentJumpPopup(mockProps));

            expect(mockTrackPaymentPriceJump).not.toHaveBeenCalled();
        });
    });

    describe('description', () => {
        it('should return description with price from props', () => {
            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            expect(current.descriptionContent).toBe(
                "description <span data-tid='payment-jump-popup-new-price'>2000</span>",
            );
        });

        it('should return empty description when description is NOT provided ', () => {
            mockProps.description = undefined;

            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            expect(current.descriptionContent).toBe('');
        });
    });

    describe('on click', () => {
        it('should call trackPaymentPriceJump, setIsPaymentPriceJump and validatePackage on approve click', () => {
            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            current.onApproveClick();

            expect(mockStores.payStore.setAmount).not.toHaveBeenCalled();
            expect(mockStores.bookingStore.setIsPaymentPriceJump).toHaveBeenCalledWith(false);
            expect(mockStores.bookingStore.validatePackage).toHaveBeenCalled();
            expect(mockTrackPaymentPriceJump).toHaveBeenCalledWith({
                event_action: EVENT_ACTION_PAYMENT_JUMP_NAME,
                event_label: EVENT_LABEL_ACCEPT,
            });
        });

        it('should call setAmount on approveClick when isTradeStore is true', () => {
            jest.mocked(isTradeStore).mockReturnValue(true);

            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            current.onApproveClick();

            expect(mockStores.payStore.setAmount).toHaveBeenCalledWith(2000);
        });

        it('should call trackPaymentPriceJump, redirectToSearchResultsPage and setIsPaymentPriceJump on decline click', () => {
            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            current.onDeclineClick();

            expect(mockStores.bookingStore.setIsPaymentPriceJump).toHaveBeenCalledWith(false);
            expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mockStores.queryParamStore.buildFlightPlusHotelUrl).not.toHaveBeenCalled();
            expect(mockTrackPaymentPriceJump).toHaveBeenCalledWith({
                event_action: EVENT_ACTION_PAYMENT_JUMP_NAME,
                event_label: EVENT_LABEL_DECLINE,
            });
        });

        it('should call buildFlightPlusHotelUrl on decline click when isFlightAndHotelPackage is true', () => {
            mockStores.bookingStore.isFlightAndHotelPackage = true;

            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            current.onDeclineClick();

            expect(mockStores.queryParamStore.buildFlightPlusHotelUrl).toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });
    });

    describe('TradePortal behavior', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should call trackEventWithParams when isPaymentPriceJump is true', () => {
            renderHook(() => usePaymentJumpPopup(mockProps));

            expect(mockTrackPaymentPriceJump).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(EventTypes.GenericEvent, {
                eventAction: EVENT_ACTION_PAYMENT_JUMP_NAME,
                eventLabel: EventLabels.Impression,
            });
        });

        it('should call trackEventWithParams on approve button click', () => {
            const {
                result: { current },
            } = renderHook(() => usePaymentJumpPopup(mockProps));

            current.onApproveClick();

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(2, EventTypes.GenericEvent, {
                eventAction: EVENT_ACTION_PAYMENT_JUMP_NAME,
                eventLabel: EVENT_LABEL_ACCEPT,
            });
        });
    });
});
