import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import countDifferenceSave from 'frontend/utils/countDifferenceSafe';
import isBackend from 'frontend/utils/isBackend';
import {
    getIsKidsInfoVisible,
    getPriceDifferencePP,
    getRoomName,
    isAlterationExtendedInfoVisible,
} from 'frontend/utils/offer.utils';
import { sortRoomsPriceLowHigh } from 'frontend/utils/sort.utils';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { parseRoomCode } from 'frontend/utils/url.utils';
import {
    IBoardAndRoomAlterationInfoFieldsProps,
    IBoardAndRoomAlterationKidsInfoFieldsProps,
} from 'models/data/IBoardAndRoomAlteration';
import { IImage } from 'models/data/IHotel';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { NextRoomDisplayOption } from 'models/enum/NextRoomDisplayOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { BoardsAndRoomsEventAction, BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import RoomCard from 'frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard';
import RoomCardInfo from 'frontend/components/renderings/RoomTypes/components/RoomCardInfo/RoomCardInfo';
import RoomSectionPreview from 'frontend/components/renderings/RoomTypes/components/RoomSectionPreview/RoomSectionPreview';

import RoomSectionButton from './components/RoomSectionButton/RoomSectionButton';

import styles from './RoomSection.module.scss';

interface IRoomSectionProps
    extends Partial<IBoardAndRoomAlterationInfoFieldsProps>,
        Partial<IBoardAndRoomAlterationKidsInfoFieldsProps> {
    alternativeRooms: IUnit[][];
    editRoomInTheCurrentSection: (roomSectionIndex: number) => void;
    fallbackImage: string;
    isMultipleRoomSelected: boolean;
    isOriginalRoomChanged: boolean;
    isPreview: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    onChangePanel: (panelIndex?: number) => void;
    onChangeRoom: (index: number, newRoom: IUnit, priceDiff: number) => Promise<void>;
    onCollapseSection: (index: number) => void;
    originalRooms: { alternativeRooms: IUnit[]; index: number; room: IUnit }[];
    selectedRoom: IUnit;
    selectedRoomSectionIndex: number;
    addImage?: (imagesItemId: string | null, callback?, itemId?: string) => void;
    altLabelPlural?: string;
    altLabelSingular?: string;
    getImageByItemId?: (itemId: string) => Promise<IImage | null>;
    isLoadingOffer?: boolean;
    nextRoomDisplayOption?: Nullable<NextRoomDisplayOption>;
    onDeleteItem?: (id: string) => void;
    onUpdateRoom?: (id: string) => void;
    openPanelLabel?: string;
    titleNextToSelectedRoomPlural?: string;
    titleNextToSelectedRoomSingular?: string;
}

const RoomSection = ({
    isPreview,
    offer,
    originalRooms,
    alternativeRooms,
    selectedRoom,
    selectedRoomSectionIndex,
    fallbackImage,
    isOriginalRoomChanged,
    isMultipleRoomSelected,
    isLoadingOffer,
    nextRoomDisplayOption,
    titleNextToSelectedRoomSingular,
    titleNextToSelectedRoomPlural,
    altLabelSingular,
    altLabelPlural,
    openPanelLabel,
    alterationInfoText,
    alterationExtendedInfoText,
    alterationExtendedInfoTitle,
    alterationInfoTitle,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    editRoomInTheCurrentSection,
    onCollapseSection,
    onChangeRoom,
    onUpdateRoom,
    onDeleteItem,
    onChangePanel,
    addImage,
    getImageByItemId,
}: IRoomSectionProps) => {
    const { getPhrase, isScreenMedium, isExtrasPage, isEditMode, trackEventWithParams } = useStore(
        (stores: TStores) => ({
            isScreenMedium: stores.appStore.isScreenMedium,
            isExtrasPage: stores.layoutStore.isExtrasPage,
            isEditMode: stores.layoutStore.isEditMode,
            getPhrase: stores.layoutStore.getPhrase,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
        }),
    );

    const viewRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setCollapsed] = useState<boolean>(!isEditMode);

    useEffect(() => {
        if (!isEditMode) {
            return;
        }

        const updateRoom = (e: Event): void => {
            const target = e.target as HTMLElement;
            const itemId = target.dataset.itemId;

            if (!itemId) {
                return;
            }

            onUpdateRoom?.(itemId);
        };

        const deleteRoom = (e: Event): void => {
            const shouldDelete = confirm('Are you sure you want to delete this room?');

            if (!shouldDelete) {
                return;
            }

            const target = e.target as HTMLButtonElement;
            const itemId = target.dataset.itemId;

            if (!itemId) {
                return;
            }

            onDeleteItem?.(itemId);
        };

        // addEventListener so it can work in EE, but add only once
        if (viewRef.current && !isBackend()) {
            viewRef.current
                .querySelectorAll('.update-room-btn')
                .forEach(item => item.addEventListener('click', updateRoom));
            viewRef.current
                .querySelectorAll('.delete-room-btn')
                .forEach(item => item.addEventListener('click', deleteRoom));
        }

        return () => {
            if (isEditMode && viewRef.current) {
                viewRef.current
                    .querySelectorAll('.update-room-btn')
                    .forEach(item => item.removeEventListener('click', updateRoom));
                viewRef.current
                    .querySelectorAll('.delete-room-btn')
                    .forEach(item => item.removeEventListener('click', deleteRoom));
            }
        };
    }, []);

    const { roomType: selectedRoomType } = selectedRoom;

    const selectedRoomName = selectedRoomType ? getRoomName(selectedRoomType) : '';
    const selectedRoomTypeCode = selectedRoomType?.code || parseRoomCode(selectedRoom?.code);
    const sectionTitle = roomTitleNormalize(selectedRoomName);

    const rooms = alternativeRooms[selectedRoomSectionIndex] || [];
    const roomsCount = rooms.length;
    // alternative rooms it's all rooms except selected
    const altRoomsCount = roomsCount - 1;
    // return the original rooms list for experience editor
    const sortedRooms = isEditMode ? rooms : [...rooms].sort(sortRoomsPriceLowHigh);

    // get selected apartment from the current room section
    const selectedRoomIdx = sortedRooms.findIndex(room => room.roomType.code === selectedRoomTypeCode);
    const mostExpensiveRoomIdx = sortedRooms.length - 1;
    const mostExpensiveRoom = sortedRooms[mostExpensiveRoomIdx];

    const isOneRoomToShow = isExtrasPage || !nextRoomDisplayOption || selectedRoomIdx === mostExpensiveRoomIdx;

    const visibleRoomsCount = isScreenMedium && !isOneRoomToShow && !isOriginalRoomChanged ? 1 : 0;

    /**
     * Helper to exclude specified rooms from the full rooms list based on params
     * @param {IUnit[]} rooms Rooms list
     * @param {string[]} codes Room codes which should be excluded
     */
    const filterRoomsByCode = (rooms: IUnit[], codes: string[]): IUnit[] =>
        rooms.filter(room => !codes.includes(room.roomType.code));

    const sliceRooms = (rooms: IUnit[]): IUnit[] => (isCollapsed ? rooms.slice(0, visibleRoomsCount) : rooms);

    const sortRoomsByPageParams = () => {
        // show all rooms sort ordered by default if we are in experience editor
        if (isEditMode) {
            return rooms;
        }

        if (!roomsCount) {
            return [];
        }

        // show only the selected apartment if it is the most expensive
        // or on Extras Page or if there is no setting which room should be next
        if (isOneRoomToShow) {
            return isCollapsed
                ? [selectedRoom]
                : [selectedRoom, ...filterRoomsByCode(sortedRooms, [selectedRoomTypeCode])];
        }

        // show the original room and next room that more expensive or alphabetically after the original
        if (nextRoomDisplayOption === NextRoomDisplayOption.NextMostExpensiveToSelected) {
            const nextMostExpensiveToSelected = sortedRooms[selectedRoomIdx + 1];
            const filteredRooms = filterRoomsByCode(sortedRooms, [
                selectedRoomTypeCode,
                nextMostExpensiveToSelected?.roomType.code,
            ]);

            return [selectedRoom, nextMostExpensiveToSelected, ...sliceRooms(filteredRooms)];
        }

        const filteredRooms = filterRoomsByCode(sortedRooms, [selectedRoomTypeCode, mostExpensiveRoom?.roomType.code]);

        // default case: show the original room and the most expensive room
        return [selectedRoom, mostExpensiveRoom, ...sliceRooms(filteredRooms)];
    };

    const roomsToShow = sortRoomsByPageParams();
    const roomsToShowCount = roomsToShow.length;

    const sectionDetailsClassName = classNames(styles.sectionDetails, {
        [styles.collapsed]: isCollapsed && isScreenMedium,
        [styles.collapsedAll]: roomsToShowCount === 1,
    });

    const sectionLabel = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.RoomTypesLabelsRoom),
        Tokens.Number,
        `${selectedRoomSectionIndex + 1}`,
    );

    const commonEventParams = {
        eventCategory: BoardsAndRoomsEventCategory.Room,
        eventType: EventTypes.Interaction,
        eventLabel: selectedRoomName,
        eventValue: null,
    };
    const commonCustomEventParams = generateGenericValues({
        destinationUrl: null,
        genericValue1: `${altRoomsCount}`,
    });

    const handleShowMore = () => {
        editRoomInTheCurrentSection(selectedRoomSectionIndex);

        if (isScreenMedium) {
            setCollapsed(!isCollapsed);

            if (!isCollapsed) {
                onCollapseSection(selectedRoomSectionIndex);
            }
        }

        let eventAction = BoardsAndRoomsEventAction.HideRooms;

        if (isCollapsed) {
            eventAction = isExtrasPage
                ? BoardsAndRoomsEventAction.ShowRoomsOnExtras
                : BoardsAndRoomsEventAction.ShowRooms;
        }

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction,
                eventLabel: `${altRoomsCount}`,
                eventValue: null,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
        );
    };

    const openPanel = () => {
        onChangePanel(selectedRoomSectionIndex);
    };

    const openPanelAndTrackEvent = () => {
        openPanel();
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.ShowRoomInformation,
            },
            commonCustomEventParams,
        );
    };

    const closePanel = () => {
        onChangePanel(undefined);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.HideRoomInformation,
            },
            commonCustomEventParams,
        );
    };

    const showAlternativeRooms = () => {
        openPanel();
        setCollapsed(false);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.ShowOtherRooms,
            },
            commonCustomEventParams,
        );
    };

    const renderSubtitle = () => {
        const initialText =
            isExtrasPage || roomsCount < settings.AlternativeRooms.defaultMaxVisibleRoomsOnCollapsedState
                ? titleNextToSelectedRoomSingular
                : titleNextToSelectedRoomPlural;

        const text = Tokenizer.replaceToken(initialText, Tokens.Number, `${roomsCount - 1}`);

        return text ? <h3 data-tid='room-section-subtitle'>{text}</h3> : null;
    };

    if (isPreview) {
        const altLabel = altRoomsCount === 1 ? altLabelSingular : altLabelPlural;

        return (
            <RoomSectionPreview
                roomType={selectedRoomType}
                title={sectionTitle}
                altRoomsCount={altRoomsCount}
                altLabel={altLabel}
                openPanelLabel={openPanelLabel}
                panelLabel={sectionLabel}
                sectionIndex={selectedRoomSectionIndex}
                showAlternativeRooms={showAlternativeRooms}
                openPanel={openPanelAndTrackEvent}
            />
        );
    }

    return (
        <div
            className={styles.section}
            ref={viewRef}
            data-tid='room-section'
            data-room-section='room-section'
            data-item-index={selectedRoomSectionIndex}
        >
            {originalRooms.length > 1 && (
                <div className={styles.sectionInfo}>
                    <div>
                        <div className={styles.sectionLabel} data-tid='room-section-label'>
                            <SvgHotelBedFilled className='d-block' />
                            {sectionLabel}
                        </div>

                        <span className={styles.sectionName} data-tid='room-section-title'>
                            {sectionTitle}
                        </span>
                    </div>
                    <div className={styles.sectionClose}>
                        <ShowMoreButton
                            isChevronUp
                            title={getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                            dataTid='room-section-close-btn'
                            onClick={closePanel}
                        />
                    </div>
                </div>
            )}
            <div className={sectionDetailsClassName}>
                {roomsToShow.map((newRoom, newRoomIndex) => {
                    const isSelected = !!offer && parseRoomCode(newRoom?.code) === selectedRoomTypeCode;
                    const isKidsInfoVisible = getIsKidsInfoVisible(selectedRoom, newRoom);
                    const isConfirmationRequired = !!newRoom.requireBoardAlteration || isKidsInfoVisible;

                    const priceDifference = isMultipleRoomSelected
                        ? countDifferenceSave(newRoom.price, selectedRoom.price)
                        : getPriceDifferencePP(newRoom.price - selectedRoom.price, [newRoom]);

                    return (
                        <React.Fragment key={`${newRoom.code}-${newRoomIndex}`}>
                            <RoomCard
                                room={newRoom}
                                isSelected={isSelected}
                                isSpoiler={
                                    isCollapsed &&
                                    roomsToShowCount - 1 === newRoomIndex &&
                                    (isOriginalRoomChanged ? newRoomIndex > 0 : newRoomIndex > 1)
                                }
                                isMultipleRoomSelected={isMultipleRoomSelected}
                                selectedRoomSectionIndex={selectedRoomSectionIndex}
                                priceDifference={priceDifference}
                                isLoadingOffer={isLoadingOffer}
                                onAddImage={addImage}
                                onChangeRoom={onChangeRoom}
                                onDeleteItem={onDeleteItem}
                                getImageByItemId={getImageByItemId}
                                offer={offer}
                                className={styles.sectionCard}
                                fallbackImage={fallbackImage}
                                // display info blocks when this room will change the board or free child place
                                infoBlock={
                                    <RoomCardInfo
                                        isScreenMedium={isScreenMedium}
                                        isAlterationInfoVisible={!isSelected && !!newRoom.requireBoardAlteration}
                                        alterationInfoTitle={alterationInfoTitle?.value}
                                        alterationInfoText={alterationInfoText?.value}
                                        isAlterationExtendedInfoVisible={isAlterationExtendedInfoVisible(
                                            !!newRoom.requireMoreRoomAlteration,
                                            isMultipleRoomSelected,
                                            isConfirmationRequired,
                                        )}
                                        alterationExtendedInfoTitle={alterationExtendedInfoTitle?.value}
                                        alterationExtendedInfoText={alterationExtendedInfoText?.value}
                                        isKidsInfoVisible={isKidsInfoVisible}
                                        kidsInfoTitle={freeChildPlaceInfoTitle?.value}
                                        kidsInfoText={freeChildPlaceInfoText?.value}
                                    />
                                }
                            />

                            {isEditMode && (
                                <div className='d-flex justify-content-end mb-3'>
                                    <div className='mx-2'>
                                        <button
                                            className='btn update-room-btn mb-3'
                                            data-item-id={newRoom.itemId}
                                            data-tid='update-room-btn'
                                        >
                                            Update
                                        </button>
                                    </div>
                                    <div className='mx-2'>
                                        <button
                                            className='btn delete-room-btn mb-3'
                                            data-item-id={newRoom.itemId}
                                            data-tid='delete-room-btn'
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* show the subtitle next to the selected room if there are more than 1 visible rooms */}
                            {roomsToShowCount > 1 && newRoomIndex === 0 && renderSubtitle()}
                        </React.Fragment>
                    );
                })}
                <RoomSectionButton
                    isCollapsed={isCollapsed}
                    handleShowMore={handleShowMore}
                    roomsCount={roomsCount}
                    visibleRoomsCount={visibleRoomsCount}
                    roomsToShowCount={roomsToShowCount}
                    isOriginalRoomChanged={isOriginalRoomChanged}
                />
            </div>
        </div>
    );
};

export default observer(RoomSection);
