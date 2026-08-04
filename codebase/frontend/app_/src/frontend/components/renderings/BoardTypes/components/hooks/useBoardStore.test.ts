import { renderHook } from '@testing-library/react';

import { mockAmendHotelOffer, mockAmendRoomAndBoardLocalStore, mockBoardType } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';
import { useRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import useBoardStore from './useBoardStore';

jest.mock(
    'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore',
);
jest.mock('frontend/store/holidays');

const mockLocalStore = mockAmendRoomAndBoardLocalStore();

const mockChangeBoardCodeError = jest.fn();
const createStores = () => ({
    viewBookingStore: { booking: { id: 'booking1' } },
    bookingStore: {
        failedToLoadData: false,
        selectedOffer: { id: 'offer1' },
        boardType: { id: 'boardType1' },
        allBoardTypes: [{ id: 'boardType1' }, { id: 'boardType2' }],
        changeBoardCodeError: mockChangeBoardCodeError,
    },
    amendRoomAndBoardStore: {
        chosenRoom: { boardType: { id: 'boardType1' } },
        altBoards: [{ id: 'boardType1' }, { id: 'boardType2' }],
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useBoardStore', () => {
    beforeEach(() => {
        mockStores = createStores();
        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('should return postBookingProps when isPostBooking is true and offer is present', () => {
        jest.mocked(useRoomAndBoardLocalStore).mockReturnValue(mockLocalStore);
        const { result } = renderHook(() => useBoardStore(true));
        expect(result.current).toEqual({
            selectedBoardType: mockBoardType,
            allBoardTypes: [mockBoardType],
            offer: mockAmendHotelOffer,
        });
    });

    it('should return bookFlowProps when isPostBooking is false', () => {
        const { result } = renderHook(() => useBoardStore(false));
        expect(result.current).toEqual({
            offer: { id: 'offer1' },
            failedToLoadData: false,
            selectedBoardType: { id: 'boardType1' },
            allBoardTypes: [{ id: 'boardType1' }, { id: 'boardType2' }],
            changeBoardCodeError: mockChangeBoardCodeError,
        });
    });

    it('should return postBookingProps when isPostBooking is true and offer is not present', () => {
        jest.mocked(useRoomAndBoardLocalStore).mockReturnValue({ ...mockLocalStore, chosenOffer: null! });
        const { result } = renderHook(() => useBoardStore(true));
        expect(result.current).toEqual({
            offer: { id: 'booking1' },
            failedToLoadData: false,
            selectedBoardType: { id: 'boardType1' },
            allBoardTypes: [{ id: 'boardType1' }, { id: 'boardType2' }],
            changeBoardCodeError: mockChangeBoardCodeError,
        });
    });

    it('should return postBookingProps when isPostBooking is true and useRoomAndBoardLocalStore returns null', () => {
        jest.mocked(useRoomAndBoardLocalStore).mockReturnValue(null);
        const { result } = renderHook(() => useBoardStore(true));
        expect(result.current).toEqual({
            offer: { id: 'booking1' },
            failedToLoadData: false,
            selectedBoardType: { id: 'boardType1' },
            allBoardTypes: [{ id: 'boardType1' }, { id: 'boardType2' }],
            changeBoardCodeError: mockChangeBoardCodeError,
        });
    });
});
