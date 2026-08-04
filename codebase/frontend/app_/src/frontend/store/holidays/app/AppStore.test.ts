import { mockAmendDatesOfferWithPrice, mockAmendHotelOffer, mockAmendRoomAndBoardOffer } from 'frontend/__mocks__';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';

import AppStore from './AppStore';

const mockedAmendBookingPayload = {
    bookingReference: 'bookingReference',
    lastName: 'lastName',
    date: 'date',
} as any;

jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: jest.fn(() => mockedAmendBookingPayload),
    removeWebStorageItem: jest.fn(),
}));

describe('AppStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {},
        } as any);
    let rootStore;
    let store: AppStore;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new AppStore(rootStore);
    });

    describe('checkPayloadsFromStorage', () => {
        it('should set amendBookingItemPayload when isFromAmendTransfer', () => {
            rootStore.layoutStore.isAmendTransfersPage = true;
            mockedAmendBookingPayload.isFromAmendTransfer = true;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;
            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.amendBookingItemPayload).toEqual(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when isFromAmendFlight', () => {
            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = true;
            mockedAmendBookingPayload.isFromAmendFlight = true;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;
            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.amendBookingItemPayload).toEqual(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when isFromAmendSeats', () => {
            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = true;
            mockedAmendBookingPayload.isFromAmendSeats = true;
            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.amendBookingItemPayload).toEqual(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when amendDatesOffer is present, on amend dates summary page', () => {
            store.setAmendBookingItemPayload = jest.fn();

            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;

            rootStore.layoutStore.isAmendDatesSummaryPage = true;
            mockedAmendBookingPayload.amendDatesOffer = mockAmendDatesOfferWithPrice;

            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.setAmendBookingItemPayload).toHaveBeenCalledWith(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when amendDatesOffer is present, on amend dates page', () => {
            store.setAmendBookingItemPayload = jest.fn();

            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;

            rootStore.layoutStore.isAmendDatesPage = true;
            mockedAmendBookingPayload.amendDatesOffer = mockAmendDatesOfferWithPrice;

            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.setAmendBookingItemPayload).toHaveBeenCalledWith(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when amendRoomAndBoardOffer is present', () => {
            store.setAmendBookingItemPayload = jest.fn();

            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;

            rootStore.layoutStore.isAmendRoomAndBoardPage = true;
            mockedAmendBookingPayload.amendRoomAndBoardOffer = mockAmendRoomAndBoardOffer;

            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.setAmendBookingItemPayload).toHaveBeenCalledWith(mockedAmendBookingPayload);
        });

        it('should set amendBookingItemPayload when on AmendHotelSummaryPage and amendHotelOffer is present', () => {
            store.setAmendBookingItemPayload = jest.fn();

            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;

            rootStore.layoutStore.isAmendHotelSummaryPage = true;
            mockedAmendBookingPayload.amendHotelOffer = mockAmendHotelOffer;

            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.setAmendBookingItemPayload).toHaveBeenCalledWith(mockedAmendBookingPayload);
        });

        it('should not set amendBookingItemPayload', () => {
            rootStore.layoutStore.isAmendTransfersPage = false;
            mockedAmendBookingPayload.isFromAmendTransfer = false;
            rootStore.layoutStore.isAmendFlightsPage = false;
            mockedAmendBookingPayload.isFromAmendFlight = false;
            rootStore.layoutStore.isViewBookingPage = false;
            mockedAmendBookingPayload.isFromAmendSeats = false;
            expect(store.amendBookingItemPayload).toBeUndefined();

            store.checkPayloadsFromStorage();

            expect(store.amendBookingItemPayload).toBeUndefined();
        });

        it('should call removeWebStorageItem', () => {
            store.checkPayloadsFromStorage();

            expect(removeWebStorageItem).toBeCalledWith('amend-booking-payload', {});
        });
    });

    describe('isScreenLessLarge', () => {
        it('should be true when breakpoint is greater than 990', () => {
            store.breakpoint = 992;

            expect(store.isScreenLessLarge).toBe(false);
        });

        it('should be false when breakpoint is smaller 991', () => {
            store.breakpoint = 990;

            expect(store.isScreenLessLarge).toBe(true);
        });

        it('should be false when breakpoint is undefined', () => {
            expect(store.isScreenLessLarge).toBe(false);
        });
    });
});
