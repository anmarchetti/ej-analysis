import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import countDifferenceSave from 'frontend/utils/countDifferenceSafe';
import {
    getIsKidsInfoVisible,
    getPriceDifferencePP,
    isAlterationExtendedInfoVisible,
} from 'frontend/utils/offer.utils';
import { sortRoomsPriceLowHigh } from 'frontend/utils/sort.utils';
import {
    IBoardAndRoomAlterationInfoFieldsProps,
    IBoardAndRoomAlterationKidsInfoFieldsProps,
} from 'models/data/IBoardAndRoomAlteration';
import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import RoomCard from 'frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard';
import RoomCardInfo from 'frontend/components/renderings/RoomTypes/components/RoomCardInfo/RoomCardInfo';
import styles from 'frontend/components/renderings/RoomTypes/components/RoomsDrawer/RoomsDrawer.module.scss';

export interface IRoomsDrawerProps
    extends Partial<IBoardAndRoomAlterationInfoFieldsProps>,
        Partial<IBoardAndRoomAlterationKidsInfoFieldsProps> {
    activeRoomSectionIndex: number;
    alternativeRooms: IUnit[][];
    fallbackImage: string;
    isOpen: boolean;
    onChangeRoom: (index: number, newRoom: IUnit, priceDiff: number) => void;
    onClose: () => void;
    originalRooms: { alternativeRooms: IUnit[]; index: number; room: IUnit }[];
    description?: ISitecoreField<string>;
    isLoadingOffer?: boolean;
    title?: ISitecoreField<string>;
}

const RoomsDrawers = (props: IRoomsDrawerProps) => {
    const { offer, getPhrase } = useStore((stores: TStores) => ({
        offer: stores.bookingStore.selectedOffer,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const {
        isOpen,
        activeRoomSectionIndex,
        originalRooms,
        alternativeRooms,
        title,
        description,
        fallbackImage,
        isLoadingOffer,
        alterationInfoTitle,
        alterationInfoText,
        alterationExtendedInfoTitle,
        alterationExtendedInfoText,
        freeChildPlaceInfoTitle,
        freeChildPlaceInfoText,
        onClose,
        onChangeRoom,
    } = props;

    if (!offer || !alternativeRooms?.length) {
        return null;
    }

    const rooms = alternativeRooms[activeRoomSectionIndex]
        ? alternativeRooms[activeRoomSectionIndex].sort(sortRoomsPriceLowHigh)
        : [];

    const offerUnits = offer.accom?.unit ?? [];
    const selectedRoom = offerUnits[activeRoomSectionIndex];
    const selectedRoomCode = selectedRoom?.code ?? '';
    const isMultipleRoomSelected = offerUnits.length > 1;

    const roomsToShow = rooms.filter(room => room.code !== selectedRoomCode);

    return (
        <Drawer open={isOpen} className='drawer--animation-bottom' dataTid='drawer-room-select'>
            {!!originalRooms?.length && (
                <div className={`row ${styles.container}`}>
                    <div className={`col-12 px-4 ${styles.header}`}>
                        <Text
                            field={title}
                            tag='h2'
                            className='board-and-room__title'
                            data-tid='board-and-room-drawer-title'
                        />
                        <Text
                            tag='p'
                            field={description}
                            className='board-and-room__subtitle'
                            data-tid='board-and-room-drawer-subtitle'
                        />
                    </div>

                    {roomsToShow.map(room => {
                        const priceDifference = isMultipleRoomSelected
                            ? countDifferenceSave(room.price, selectedRoom.price)
                            : getPriceDifferencePP(room.price - selectedRoom.price, [room]);

                        return (
                            <div key={`${room.code}`} className='col-12 px-4'>
                                <RoomCard
                                    room={room}
                                    offer={offer}
                                    fallbackImage={fallbackImage}
                                    priceDifference={priceDifference}
                                    selectedRoomSectionIndex={activeRoomSectionIndex}
                                    isSelected={false}
                                    isLoadingOffer={isLoadingOffer}
                                    disableFullScreen
                                    isMultipleRoomSelected={isMultipleRoomSelected}
                                    onChangeRoom={onChangeRoom}
                                    infoBlock={
                                        <RoomCardInfo
                                            isScreenMedium={false}
                                            isAlterationInfoVisible={!!room.requireBoardAlteration}
                                            alterationInfoTitle={alterationInfoTitle?.value}
                                            alterationInfoText={alterationInfoText?.value}
                                            isAlterationExtendedInfoVisible={isAlterationExtendedInfoVisible(
                                                !!room.requireMoreRoomAlteration,
                                                isMultipleRoomSelected,
                                                !!room.requireBoardAlteration ||
                                                    getIsKidsInfoVisible(selectedRoom, room),
                                            )}
                                            alterationExtendedInfoTitle={alterationExtendedInfoTitle?.value}
                                            alterationExtendedInfoText={alterationExtendedInfoText?.value}
                                            isKidsInfoVisible={!!selectedRoom?.isFreeForKids && !room.isFreeForKids}
                                            kidsInfoTitle={freeChildPlaceInfoTitle?.value}
                                            kidsInfoText={freeChildPlaceInfoText?.value}
                                        />
                                    }
                                />
                            </div>
                        );
                    })}

                    <div className='col-12 drawer__actions'>
                        <Button
                            className={styles.cancelBtn}
                            isText
                            isFullWidth
                            disabled={isLoadingOffer}
                            dataTid='cancel-btn'
                            onClick={onClose}
                        >
                            {getPhrase(SitecoreDictionary.RoomTypesButtonsCancel)}
                        </Button>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default observer(RoomsDrawers);
