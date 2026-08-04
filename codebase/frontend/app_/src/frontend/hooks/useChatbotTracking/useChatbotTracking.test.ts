import { renderHook } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';
import { getChatbotViewBookingEventParams } from 'frontend/utils/tracking/viewBooking.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { useChatbotTracking } from './useChatbotTracking';

const createStores = () =>
    createMockStores({
        trackingStore: {
            removeFromDataLayer: jest.fn(),
            fireChatbotViewBookingEvent: jest.fn(),
        },
    });

const createMockRouter = () => ({
    events: {
        on: jest.fn(),
        off: jest.fn(),
    },
});

let mockRouter = createMockRouter();
let mockStores = createStores();

jest.mock('frontend/utils/tracking/viewBooking.utils', () => ({
    getChatbotViewBookingEventParams: jest.fn(),
}));

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => true),
}));

jest.mock('next/router', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useChatbotTracking', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockRouter = createMockRouter();
        (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(true);
    });

    it('should fire chatbot view booking event when booking is present', () => {
        const mockedEventParams = 'gtm-booking-payload';
        (getChatbotViewBookingEventParams as jest.Mock).mockReturnValueOnce(mockedEventParams);

        renderHook(() => useChatbotTracking(mockBooking));

        expect(mockStores.trackingStore.fireChatbotViewBookingEvent).toHaveBeenCalledWith(mockedEventParams);
    });

    it('should not fire chatbot view booking event when enabled is false', () => {
        renderHook(() => useChatbotTracking(mockBooking, false));

        expect(mockStores.trackingStore.fireChatbotViewBookingEvent).not.toHaveBeenCalled();
    });

    it('should not fire chatbot view booking event when booking is null', () => {
        renderHook(() => useChatbotTracking(null));

        expect(mockStores.trackingStore.fireChatbotViewBookingEvent).not.toHaveBeenCalled();
    });

    it('should not fire chatbot view booking event when it is not a holiday store', () => {
        (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(false);
        mockStores = createStores();
        mockStores.trackingStore.fireChatbotViewBookingEvent = undefined;

        renderHook(() => useChatbotTracking(mockBooking));

        expect(mockStores.trackingStore.fireChatbotViewBookingEvent).toBeUndefined();
    });

    it('should not subscribe to routeChangeStart when enabled is false', () => {
        renderHook(() => useChatbotTracking(mockBooking, false));

        expect(mockRouter.events.on).not.toHaveBeenCalled();
    });

    it('should add routeChangeStart event listener on mount', () => {
        renderHook(() => useChatbotTracking(mockBooking));

        expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    });

    it('should remove routeChangeStart event listener on unmount', () => {
        const { unmount } = renderHook(() => useChatbotTracking(mockBooking));

        const eventListener = mockRouter.events.on.mock.calls[0][1];

        unmount();

        expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeStart', eventListener);
    });

    it('should call removeFromDataLayer with ChatbotViewBooking event type on route change', () => {
        renderHook(() => useChatbotTracking(mockBooking));

        const eventHandler = mockRouter.events.on.mock.calls[0][1];
        eventHandler();

        expect(mockStores.trackingStore.removeFromDataLayer).toHaveBeenCalledWith(EventTypes.ChatbotViewBooking);
    });

    it('should not call removeFromDataLayer when it is not a holiday store', () => {
        (isHolidayStore as jest.MockedFunction<any>).mockReturnValue(false);
        mockStores = createStores();
        mockStores.trackingStore.removeFromDataLayer = undefined;

        renderHook(() => useChatbotTracking(mockBooking));

        expect(mockStores.trackingStore.removeFromDataLayer).toBeUndefined();
    });
});
