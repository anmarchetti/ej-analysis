import { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    getHotelContractType,
    getIsKidsInfoVisible,
    getRoomName,
    isAlterationExtendedInfoVisible,
    isRoomPricePPShown,
} from 'frontend/utils/offer.utils';
import { getAlterationStatus, getPriceChangeStatus } from 'frontend/utils/tracking/boardsAndRooms.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IBoardAndRoomAlterationKidsInfoFieldsProps } from 'models/data/IBoardAndRoomAlteration';
import { IUnit } from 'models/data/IOffer';
import { BoardsAndRoomsEventAction, BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BookingAlterationDrawer, {
    IAlterationResults,
} from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import RoomCardBase from 'frontend/components/renderings/RoomTypes/components/RoomCardBase/RoomCardBase';

import { getNewAlternativeBoards, getNewAlternativeRooms } from './RoomAlterations.utils';

export interface IRoomAlterationsProps extends Partial<IBoardAndRoomAlterationKidsInfoFieldsProps> {
    currentRoom: IUnit;
    fallbackImage: string;
    isMultipleRoomSelected: boolean;
    newRoom: Nullable<IUnit>;
    onAlterationChecked: (val: boolean) => void;
    onConfirm: (index: number, room: IUnit, priceDiff: number) => Promise<void>;
    onPriceChange: (val: number) => void;
    otherAvailableRoomsCount: number;
    price: number;
    sectionIdx: number;
    shouldCheckAlteration: boolean;
    boardResultTextSingular?: ISitecoreField<string>;
    boardResultTitle?: ISitecoreField<string>;
    changingFromTitle?: ISitecoreField<string>;
    resultRoomsSubtitle?: ISitecoreField<string>;
    resultSubtitle?: ISitecoreField<string>;
    roomResultTextPlural?: ISitecoreField<string>;
    roomResultTextSingular?: ISitecoreField<string>;
    roomResultTitle?: ISitecoreField<string>;
    subtitle?: ISitecoreField<string>;
}

const RoomAlterations: FC<IRoomAlterationsProps> = ({
    shouldCheckAlteration,
    currentRoom,
    newRoom,
    sectionIdx,
    price,
    fallbackImage,
    isMultipleRoomSelected,
    otherAvailableRoomsCount,
    subtitle,
    boardResultTitle,
    roomResultTitle,
    resultSubtitle,
    resultRoomsSubtitle,
    boardResultTextSingular,
    roomResultTextSingular,
    roomResultTextPlural,
    changingFromTitle,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    onConfirm,
    onAlterationChecked,
    onPriceChange,
}) => {
    const { allBoardTypes, offerUnits, totalPrice, totalPricePP, fetchNewOfferContract, trackEventWithParams } =
        useStore((stores: TStores) => ({
            allBoardTypes: stores.bookingStore.allBoardTypes,
            offerUnits: stores.bookingStore.offerUnits,
            totalPrice: stores.bookingStore.totalPrice,
            totalPricePP: stores.bookingStore.totalPricePP,
            fetchNewOfferContract: stores.bookingStore.fetchNewOfferContract,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
        }));

    const [isContractChanged, setChangeContract] = useState<boolean>(false);
    const [isAlterationModalShow, setAlterationModalShow] = useState<boolean>(false);

    const handleAlterationCheck = async (): Promise<void> => {
        if (!newRoom) {
            return;
        }

        const { code, requireBoardAlteration, requireMoreRoomAlteration, packageId, accommodationId, isExt } = newRoom;

        // when the selected room is free for kids and the new room is the vice versa, the price will increase - required confirmation from the user
        const isConfirmationRequired = !!requireBoardAlteration || getIsKidsInfoVisible(currentRoom, newRoom);
        const isMoreRoomAlterationRequired = isAlterationExtendedInfoVisible(
            !!requireMoreRoomAlteration,
            isMultipleRoomSelected,
            isConfirmationRequired,
        );

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: BoardsAndRoomsEventCategory.Room,
                eventType: EventTypes.Interaction,
                eventAction: BoardsAndRoomsEventAction.RoomSelected,
                eventLabel: getRoomName(newRoom.roomType),
                eventValue: price,
            },
            generateGenericValues({
                destinationUrl: null,
                genericValue1: getRoomName(currentRoom.roomType),
                genericValue2: `${otherAvailableRoomsCount}`,
                genericValue3: getAlterationStatus(!!newRoom.requireBoardAlteration, newRoom.requireMoreRoomAlteration),
                genericValue4: getPriceChangeStatus(price),
            }),
        );

        // show alternation confirmation drawer when selected room requires board alteration or when user changes free for kids room
        if (isConfirmationRequired && !isAlterationModalShow) {
            if (isMoreRoomAlterationRequired && !!packageId && !!accommodationId) {
                const newOfferContract = await fetchNewOfferContract(
                    packageId,
                    accommodationId,
                    sectionIdx,
                    code,
                    isExt,
                    requireBoardAlteration,
                );
                const calculatedPrice =
                    newOfferContract &&
                    (isRoomPricePPShown(newOfferContract)
                        ? newOfferContract.pricePP - totalPricePP
                        : newOfferContract.price - totalPrice);

                calculatedPrice && isFinite(calculatedPrice) && onPriceChange(calculatedPrice);
                setChangeContract(true);
            }

            setAlterationModalShow(true);
        } else {
            onAlterationChecked(true);
            onConfirm(sectionIdx, newRoom, price);
        }
    };

    useEffect(() => {
        if (shouldCheckAlteration) {
            handleAlterationCheck();
        }
    }, [shouldCheckAlteration]);

    if (!newRoom) {
        return null;
    }

    const newAlternativeBoards = getNewAlternativeBoards(allBoardTypes, newRoom);

    const newAlternativeRooms = getNewAlternativeRooms(offerUnits, sectionIdx, isContractChanged, fallbackImage);

    const alterationResults: IAlterationResults[] = [
        {
            items: newAlternativeBoards,
            isBoardAlteration: true,
            title: boardResultTitle,
            subtitle: resultSubtitle,
            text: boardResultTextSingular,
        },
        {
            items: newAlternativeRooms,
            title: roomResultTitle,
            subtitle: resultRoomsSubtitle,
            text: newAlternativeRooms.length > 1 ? roomResultTextPlural : roomResultTextSingular,
        },
    ];

    const isFreeChildPlaceInfoVisible = !!currentRoom?.isFreeForKids && !newRoom?.isFreeForKids;
    const commonEventParams = {
        eventCategory: BoardsAndRoomsEventCategory.BoardAndRoom,
        eventType: EventTypes.Interaction,
        eventLabel: getAlterationStatus(!!newRoom.requireBoardAlteration, newRoom.requireMoreRoomAlteration),
    };
    const customParams = generateGenericValues({
        genericValue1: getRoomName(newRoom.roomType),
        genericValue2: allBoardTypes.find(board => board.code === newRoom.board)?.title,
        genericValue3: getHotelContractType(newRoom.isExt || false, newRoom.accommodationId),
        genericValue4: getPriceChangeStatus(price),
    });

    const closeModal = () => {
        setAlterationModalShow(false);
        setChangeContract(false);
    };

    const handleConfirmClick = () => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.AlterationConfirm,
            },
            customParams,
        );

        closeModal();
        onAlterationChecked(true);
        onConfirm(sectionIdx, newRoom, price);
    };

    const handleCancelClick = () => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.AlterationCancel,
            },
            customParams,
        );

        closeModal();
        onAlterationChecked(false);
    };

    return (
        <BookingAlterationDrawer
            selectedItemElement={<RoomCardBase room={newRoom} roomIdx={sectionIdx} fallbackImg={fallbackImage} />}
            hideInfoBlock={!isFreeChildPlaceInfoVisible}
            price={price}
            isRoomSelection
            subtitle={subtitle}
            alterationResults={alterationResults}
            alterationChangingFromTitle={changingFromTitle}
            freeChildPlaceInfoTitle={freeChildPlaceInfoTitle}
            freeChildPlaceInfoText={freeChildPlaceInfoText}
            fallbackImage={fallbackImage}
            isOpen={isAlterationModalShow}
            onCancel={handleCancelClick}
            onConfirm={handleConfirmClick}
        />
    );
};

export default observer(RoomAlterations);
