import { waitFor } from '@testing-library/dom';

import { mockAmendHotelOffer, mockAmendHotelRoomAndBoardOffer, mockBoardType, mockBooking } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import {
    mockPendingObservablePromise,
    mockRejectedObservablePromise,
    mockResolvedObservablePromise,
} from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { observableFromPromise } from 'frontend/utils/observerablePromise/observerablePromise.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendHotelRoomAndBoardInfoResponse } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IUnit } from 'models/data/IOffer';

import { AmendRoomAndBoardLocalStore } from './amendRoomAndBoardLocalStore';

jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/observerablePromise/observerablePromise.utils');
jest.mock('frontend/services/logging', () => ({
    logger: {
        error: jest.fn(),
    },
}));

describe('AmendRoomAndBoardStore', () => {
    let store: AmendRoomAndBoardLocalStore;
    let rootStore: HolidaysRootStore;

    beforeEach(() => {
        rootStore = new HolidaysRootStore();
        store = new AmendRoomAndBoardLocalStore(rootStore);

        rootStore.amendHotelStore.setNewlySelectedHotelOffer = jest.fn();
        rootStore.trackingStore.changeHotel.clickOnRoomAndBoardConfirm = jest.fn();
    });

    it('should initialize with default values', () => {
        expect(store.allOffers).toEqual([]);
        expect(store.upsellAmount).toBeUndefined();
        expect(store.chosenOffer).toBeUndefined();
        expect(store.isPopupShown).toBeUndefined();
        expect(store.offersRequest).toBeNull();
    });

    it('should load room and board data', async () => {
        const mockResponse: IAmendHotelRoomAndBoardInfoResponse = {
            amendHotelOffers: [],
            upsellAmount: 100,
        };
        jest.mocked(observableFromPromise).mockReturnValue(mockResolvedObservablePromise(mockResponse));
        (bookingService.getAmendHotelRoomAndBoardVariants as jest.Mock).mockResolvedValue(mockResponse);

        rootStore.viewBookingStore.booking = mockBooking;
        rootStore.amendHotelStore.newlySelectedHotelOffer = {} as IAmendHotelOffer;

        store.loadRoomAndBoardData();

        expect(store.allOffers).toEqual([]);
        expect(store.offersRequest).not.toBeNull();
        await store.offersRequest;
        expect(store.chosenOffer).toEqual(rootStore.amendHotelStore.newlySelectedHotelOffer);
        expect(store.allOffers).toEqual(mockResponse.amendHotelOffers);
        waitFor(() => expect(store.upsellAmount).toEqual(mockResponse.upsellAmount));
    });

    it('should log the caught error', async () => {
        rootStore.viewBookingStore.booking = mockBooking;
        store.chosenOffer = mockAmendHotelOffer;

        jest.mocked(observableFromPromise).mockReturnValue(mockRejectedObservablePromise('Error'));

        try {
            await store.loadRoomAndBoardData();
        } catch (e) {
            expect(logger.error).toHaveBeenCalledWith(e);
        }
    });

    it('should compute altBoards', () => {
        store.allOffers = [];
        store.chosenOffer = {} as IAmendHotelOffer;
        expect(store.altBoards).toEqual([]);
    });

    it('should compute altRooms', () => {
        store.allOffers = [];
        store.chosenOffer = {} as IAmendHotelOffer;
        expect(store.altRooms).toEqual([]);
    });

    it('should compute chosenBoard', () => {
        store.chosenOffer = mockAmendHotelOffer;
        expect(store.chosenBoard).toEqual(mockBoardType);
    });

    it('should compute chosenRoom', () => {
        store.chosenOffer = { accom: { unit: [{} as IUnit] } } as IAmendHotelOffer;
        expect(store.chosenRoom).toEqual({});
    });

    it('should select offer', () => {
        const offer = {} as IUnit;
        store.allOffers = [];
        store.selectOffer(offer);
        expect(store.chosenOffer).toBeUndefined();
    });

    it('should show popup', () => {
        store.showPopup();
        expect(store.isPopupShown).toBe(true);
    });

    it('should hide popup', async () => {
        store.cancelRequests = jest.fn();
        store.hidePopup();

        expect(store.isPopupShown).toBe(false);
        expect(store.chosenOffer).toBeUndefined();
        expect(store.allOffers).toEqual([]);
        expect(store.cancelRequests).toHaveBeenCalled();
    });

    it('should confirm selection', () => {
        store.chosenOffer = mockAmendHotelOffer;
        store.submitOffer();
        expect(rootStore.amendHotelStore.setNewlySelectedHotelOffer).toHaveBeenCalledWith(mockAmendHotelOffer);
        expect(store.isPopupShown).toBe(false);
    });

    describe('isSubmitDisabled', () => {
        it('should allow to submit if offers are not the same', () => {
            store.initialOffer = mockAmendHotelOffer;
            store.chosenOffer = mockAmendHotelOffer;
            store.chosenOffer.accom.unit[0].roomType.code = 'room2';

            expect(store.isSubmitDisabled).toBe(false);
        });

        it('should disable submit if offers are the same', () => {
            store.initialOffer = mockAmendHotelOffer;
            store.chosenOffer = mockAmendHotelOffer;
            expect(store.isSubmitDisabled).toBe(true);
        });

        it('should disable submit if offers are loading', () => {
            store.offersRequest = mockPendingObservablePromise();
            waitFor(() => {
                expect(store.isSubmitDisabled).toBe(true);
            });
        });

        it('should compute allBoardTypes', () => {
            store.allOffers = [mockAmendHotelRoomAndBoardOffer];
            store.chosenOffer = { ...mockAmendHotelRoomAndBoardOffer.amendHotelOffer };
            expect(store.allBoardTypes).toEqual([
                {
                    ...mockBoardType,
                    price: 150,
                },
                {
                    ...mockBoardType,
                    price: 23.45,
                },
            ]);
        });

        it('should select board type', () => {
            store.allOffers = [mockAmendHotelRoomAndBoardOffer];
            store.chosenOffer = { ...mockAmendHotelOffer };
            store.selectBoardType(mockBoardType);

            expect(store.chosenOffer).toEqual(mockAmendHotelOffer);
        });
    });

    describe('submitOffer', () => {
        const mockOffer = {
            ...mockAmendHotelOffer,
            hotel: {
                ...mockAmendHotelOffer.hotel,
                name: 'Test Name',
            },
        };

        beforeEach(() => {
            store.chosenOffer = mockOffer;
        });

        it('should call setPrevSelectedHotelOffer with amend hotel offer by calling submitOffer', () => {
            rootStore.amendHotelStore.setPrevSelectedHotelOffer = jest.fn();
            store.chosenOffer = mockAmendHotelOffer;

            store.submitOffer();

            expect(rootStore.amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(mockAmendHotelOffer);
        });

        it('should call clickOnRoomAndBoardConfirm when newlySelectedHotelOffer exists and isAmendHotelSummaryPage is true', () => {
            rootStore.amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;
            jest.spyOn(rootStore.layoutStore, 'isAmendHotelSummaryPage', 'get').mockReturnValue(true);

            store.submitOffer();

            expect(rootStore.trackingStore.changeHotel.clickOnRoomAndBoardConfirm).toHaveBeenCalledWith(
                rootStore.amendHotelStore.newlySelectedHotelOffer,
                mockOffer,
            );
        });

        it('should NOT call clickOnRoomAndBoardConfirm when newlySelectedHotelOffer is NOT exists and isAmendHotelSummaryPage is true', () => {
            rootStore.amendHotelStore.newlySelectedHotelOffer = null;
            jest.spyOn(rootStore.layoutStore, 'isAmendHotelSummaryPage', 'get').mockReturnValue(true);

            store.submitOffer();

            expect(rootStore.trackingStore.changeHotel.clickOnRoomAndBoardConfirm).not.toHaveBeenCalled();
        });

        it('should NOT call clickOnRoomAndBoardConfirm when newlySelectedHotelOffer exists and isAmendHotelSummaryPage is false', () => {
            rootStore.amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;
            jest.spyOn(rootStore.layoutStore, 'isAmendHotelSummaryPage', 'get').mockReturnValue(false);

            store.submitOffer();

            expect(rootStore.trackingStore.changeHotel.clickOnRoomAndBoardConfirm).not.toHaveBeenCalled();
        });
    });
});
