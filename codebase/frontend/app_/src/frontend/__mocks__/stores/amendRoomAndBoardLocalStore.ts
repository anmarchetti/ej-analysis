import { mockAmendHotelOffer } from 'frontend/__mocks__/amendHotel';
import { mockBoardType } from 'frontend/__mocks__/hotel';
import { mockUnitRoom } from 'frontend/__mocks__/room';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { AmendRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/amendRoomAndBoardLocalStore/amendRoomAndBoardLocalStore';

export const mockAmendRoomAndBoardLocalStore = (): Required<AmendRoomAndBoardLocalStore> => ({
    allOffers: [],
    upsellAmount: 0,
    chosenOffer: mockAmendHotelOffer,
    isPopupShown: false,
    offersRequest: null,
    initialOffer: mockAmendHotelOffer,
    rootStore: {} as HolidaysRootStore,

    loadRoomAndBoardData: jest.fn(),

    altBoards: [],
    altRooms: [],
    chosenBoard: mockBoardType,
    chosenRoom: mockUnitRoom,

    selectOffer: jest.fn(),
    cancelRequests: jest.fn(),
    showPopup: jest.fn(),
    hidePopup: jest.fn(),
    submitOffer: jest.fn(),

    isSubmitDisabled: false,
    allBoardTypes: [mockBoardType],
    selectBoardType: jest.fn(),
});
