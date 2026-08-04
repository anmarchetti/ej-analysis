import { mockBoardType } from 'frontend/__mocks__/hotel';
import { mockUnitRoom } from 'frontend/__mocks__/room';
import { mockRoomAndBoardRoomVariant } from 'frontend/__mocks__/roomAndBoard';
import { AmendRoomAndBoardStore } from 'frontend/store/holidays/amend/amendRoomAndBoard/AmendRoomAndBoardStore';

export const mockAmendRoomAndBoardStore: Partial<AmendRoomAndBoardStore> = {
    isOriginalVariantChosen: false,
    isAmendCTAVisible: true,
    canLoadRoomAndBoardOptions: true,
    goToAmendRoomAndBoardPage: jest.fn(),
    loadRoomAndBoardData: jest.fn(),
    isLoadingInitialData: false,
    isLoadingValidatedOptions: false,
    chosenRoomVariant: mockRoomAndBoardRoomVariant,
    chosenRoom: {
        ...mockUnitRoom,
        roomType: {
            ...mockUnitRoom.roomType,
        } as any,
    },
    chosenBoard: mockBoardType,
    confirmChosenVariant: jest.fn(),
    clearStore: jest.fn(),
    setAreVariantsUnavailable: jest.fn(),
};
