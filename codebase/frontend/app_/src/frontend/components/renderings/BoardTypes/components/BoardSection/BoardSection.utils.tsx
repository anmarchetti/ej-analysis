import { TWO } from 'code/commonNumbers';
import { getRoomName } from 'frontend/utils/offer.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit, TAllBoards } from 'models/data/IOffer';
import { IAlterationResultItem } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';

const DEFAULT_COLLAPSED_BOARDS_NUMBER = 3;

export const getNewAlternativeRooms = (
    changedBoard: IAltBoard | IBoardType,
    selectedRooms: IUnit[],
    allAlternativeRooms: IUnit[],
    fallbackImage: string | undefined,
): IAlterationResultItem<IUnit>[] => {
    const res: IAlterationResultItem<IUnit>[] = [];
    const roomAlterations = changedBoard?.roomAlterations || {};

    selectedRooms.forEach((selectedRoom, idx) => {
        const alterationCode = roomAlterations[selectedRoom.code];
        const isAlterationNeeded = !!alterationCode;

        if (!isAlterationNeeded) {
            return;
        }

        const alternativeRoom = allAlternativeRooms.find(el => el.code === alterationCode);
        const { roomType } = selectedRoom;

        if (alternativeRoom && roomType) {
            const selectedRoomImageSrc = roomType.images?.[0]?.small;

            res.push({
                newItem: {
                    item: alternativeRoom,
                    roomIdx: idx,
                    fallbackImg: fallbackImage,
                },
                oldItemName: getRoomName(roomType),
                oldItemImgSrc: selectedRoomImageSrc,
                isKidsPlaceWilBeRemoved: !!selectedRoom.isFreeForKids && !alternativeRoom.isFreeForKids,
            });
        }
    });

    return res;
};

export const getBoardTypesToShow = ({
    selectedBoard,
    alternativeBoards,
    allBoardTypes,
    offer,
    isEditMode,
    isCollapsed,
    isExtrasPage,
    drawerMode,
}: {
    allBoardTypes: TAllBoards;
    alternativeBoards: TAllBoards;
    isCollapsed: boolean;
    isEditMode: boolean;
    isExtrasPage: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    selectedBoard: IAltBoard | IBoardType;
    drawerMode?: boolean;
}): TAllBoards => {
    // all boards should be shown in EE
    if (isEditMode || !offer) {
        return allBoardTypes;
    }

    if (allBoardTypes.length < TWO) {
        return allBoardTypes;
    }

    if (drawerMode) {
        return alternativeBoards;
    }

    // handle collapsed state
    if (isCollapsed) {
        if (isExtrasPage) {
            return [selectedBoard];
        }

        return [selectedBoard, ...alternativeBoards].slice(0, DEFAULT_COLLAPSED_BOARDS_NUMBER);
    }

    // on expanded state alternative boards are displayed in ascending order of price
    return [selectedBoard, ...alternativeBoards];
};
