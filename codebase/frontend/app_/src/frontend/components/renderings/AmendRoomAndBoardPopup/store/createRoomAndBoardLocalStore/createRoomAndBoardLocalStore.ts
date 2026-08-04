import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';
import { AmendRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/amendRoomAndBoardLocalStore/amendRoomAndBoardLocalStore';

export const [withRoomAndBoardLocalStore, useRoomAndBoardLocalStore] = createLocalStore<
    Nullable<AmendRoomAndBoardLocalStore>,
    unknown
>((rootStore: HolidaysRootStore) => new AmendRoomAndBoardLocalStore(rootStore));
