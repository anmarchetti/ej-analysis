import { getRoomName } from 'frontend/utils/offer.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IUnit, TAllBoards } from 'models/data/IOffer';
import { IAlterationResultItem } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';

export const getNewAlternativeBoards = (
    allBoards: TAllBoards,
    changedRoom?: IUnit,
): IAlterationResultItem<IAltBoard | IBoardType>[] => {
    const [selectedBoard, ...altBoards] = allBoards;
    const selectedBoardName = selectedBoard?.title;
    const selectedBoardImageSrc = selectedBoard?.iconUrl;
    const newAltBoard = altBoards.find(el => el.code === changedRoom?.requireBoardAlteration);

    if (!newAltBoard) {
        return [];
    }

    return [
        {
            newItem: { item: newAltBoard },
            oldItemName: selectedBoardName,
            oldItemImgSrc: selectedBoardImageSrc,
        },
    ];
};

export const getNewAlternativeRooms = (
    offerUnits: IUnit[],
    changedRoomSectionIdx: number,
    isContractChanged: boolean,
    fallbackImage: string,
): IAlterationResultItem<IUnit>[] => {
    if (!isContractChanged) {
        return [];
    }

    return offerUnits.reduce(
        (acc, el, idx) =>
            idx === changedRoomSectionIdx
                ? acc
                : [
                      ...acc,
                      {
                          newItem: {
                              item: el,
                              roomIdx: idx,
                              fallbackImg: fallbackImage,
                          },
                          oldItemName: getRoomName(el.roomType),
                          oldItemImgSrc: el.roomType.images?.[0]?.small,
                      },
                  ],
        [] as IAlterationResultItem<IUnit>[],
    );
};
