import { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getHotelContractType } from 'frontend/utils/offer.utils';
import { sortBoardsByPrice } from 'frontend/utils/sort.utils';
import {
    getAlterationStatus,
    getIsRoomAlterationNeeded,
    getPriceChangeStatus,
} from 'frontend/utils/tracking/boardsAndRooms.utils';
import { generateGenericValues, getRoomsTypesTitles } from 'frontend/utils/tracking/tracking.utils';
import {
    IBoardAndRoomAlterationInfoFieldsProps,
    IBoardAndRoomAlterationKidsInfoFieldsProps,
} from 'models/data/IBoardAndRoomAlteration';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit, TAllBoards } from 'models/data/IOffer';
import { BoardsAndRoomsEventAction, BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { useRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import BoardAlterationDrawer from './components/BoardAlterationDrawer/BoardAlterationDrawer';
import BoardList from './components/BoardList/BoardList';
import BoardSectionButton from './components/BoardSectionButton/BoardSectionButton';
import { getBoardTypesToShow, getNewAlternativeRooms } from './BoardSection.utils';

import styles from './BoardSection.module.scss';

export interface IBoardSectionProps
    extends IBoardAndRoomAlterationInfoFieldsProps,
        IBoardAndRoomAlterationKidsInfoFieldsProps {
    allBoardTypes: TAllBoards;
    alterationChangingFromTitle: ISitecoreField<string>;
    alterationResSubtitle: ISitecoreField<string>;
    alterationResTextPlural: ISitecoreField<string>;
    alterationResTextSingular: ISitecoreField<string>;
    alterationResTitle: ISitecoreField<string>;
    alterationSubtitle: ISitecoreField<string>;
    offer: Nullable<IOfferWithoutAltBoards>;
    altTitlePlural?: ISitecoreField<string>;
    altTitleSingular?: ISitecoreField<string>;
    countryCode?: string;
    drawerMode?: boolean;
    editLabelText?: string;
    fallbackImage?: string;
    freeChildPlaceTooltip?: string;
    hideLabelText?: string;
    isPostBooking?: boolean;
    onDeleteBoard?: (id: string) => void;
    onSelectBoard?: () => void;
    onToggleDrawer?: () => void;
    onUpdateBoard?: (id: string) => void;
    selectedBoardTypeCode?: string;
    showLabelText?: string;
}

const BoardSection: FC<IBoardSectionProps> = ({
    offer,
    allBoardTypes,
    fallbackImage,
    selectedBoardTypeCode,
    drawerMode,
    altTitleSingular,
    altTitlePlural,
    hideLabelText,
    showLabelText,
    editLabelText,
    alterationSubtitle,
    alterationResTitle,
    alterationResSubtitle,
    alterationResTextSingular,
    alterationResTextPlural,
    alterationChangingFromTitle,
    alterationInfoTitle,
    alterationInfoText,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    onSelectBoard,
    onUpdateBoard,
    onDeleteBoard,
    onToggleDrawer,
    isPostBooking,
    freeChildPlaceTooltip,
    countryCode,
}) => {
    const {
        isEditMode,
        isExtrasPage,
        isScreenMedium,
        notValidatedOfferPricePP,
        allAlternativeRooms,
        trackEventWithParams,
        bookingBoardType,
        postBookingBoardType,
        trackNewRoomOrBoardClick,
    } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        notValidatedOfferPricePP: stores.bookingStore.notValidatedOfferPricePP,
        allAlternativeRooms: stores.bookingStore.allAlternativeRooms,
        isScreenMedium: stores.appStore.isScreenMedium,
        postBookingBoardType: isHolidayStore(stores) && stores.amendRoomAndBoardStore.changeBoardType,
        bookingBoardType: stores.bookingStore.changeBoardType,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        trackNewRoomOrBoardClick: isHolidayStore(stores) && stores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick,
    }));

    const { selectBoardType } = useRoomAndBoardLocalStore() ?? {};

    const changeBoardType = isPostBooking ? postBookingBoardType : bookingBoardType;

    const [isCollapsed, setCollapsed] = useState<boolean>(!isEditMode);

    // board alteration params
    const [isAlterationModalShown, setAlterationModalShown] = useState<boolean>(false);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [changedBoard, setChangedBoard] = useState<IAltBoard | IBoardType>(allBoardTypes[0] || undefined);

    // get current rooms for alterations
    const selectedRooms = offer?.accom?.unit || [];

    // booking store sets selected board on the top of the all boards list
    const [selectedBoard] = allBoardTypes || {};

    const boardsSortedByPrice = sortBoardsByPrice(allBoardTypes, notValidatedOfferPricePP);

    // getting the index of the selected board to determine the next display order
    const selectedBoardIdx = boardsSortedByPrice.findIndex(el => el.code === selectedBoard.code);
    const mostExpensiveIdx = boardsSortedByPrice.length - 1;
    const isMostExpensiveBoardSelected = selectedBoardIdx === mostExpensiveIdx;

    const alternativeBoards = boardsSortedByPrice.filter(el => el.code !== selectedBoard.code);
    const alternativeBoardsCount = alternativeBoards.length;

    const commonEventParams = {
        eventCategory: BoardsAndRoomsEventCategory.BoardAndRoom,
        eventType: EventTypes.Interaction,
        eventLabel: getAlterationStatus(false, isAlterationModalShown),
    };

    const newAltRooms = getNewAlternativeRooms(changedBoard, selectedRooms, allAlternativeRooms, fallbackImage);
    const firstNewAltRoom = newAltRooms[0]?.newItem.item as Nullable<IUnit>; // we use only first as rooms have the same contract type
    const customParams = generateGenericValues({
        genericValue1: getRoomsTypesTitles(newAltRooms.map(item => item.newItem.item) as IUnit[]),
        genericValue2: allBoardTypes.find(board => board.code === changedBoard?.code)?.title,
        genericValue3: firstNewAltRoom
            ? getHotelContractType(firstNewAltRoom.isExt || false, firstNewAltRoom.accommodationId)
            : null,
        genericValue4: getPriceChangeStatus(priceChange),
    });

    const onChangeBoard = async (boardType: IAltBoard | IBoardType, priceDiff: number): Promise<void> => {
        if (selectBoardType) {
            selectBoardType(boardType);
            drawerMode && onSelectBoard?.();

            return;
        }

        // save the board selection for alteration
        setPriceChange(priceDiff);
        setChangedBoard(boardType);

        const isRoomAlterationNeeded =
            !!boardType?.roomAlterations && getIsRoomAlterationNeeded(boardType.roomAlterations);

        if (!isAlterationModalShown && isPostBooking && trackNewRoomOrBoardClick) {
            // Event should not be triggered on Drawer
            trackNewRoomOrBoardClick(
                EventTypes.PostBookingChangeBoardSelect,
                boardType.itemName || boardType.title,
                priceDiff,
            );
        }

        if (!isAlterationModalShown && !isPostBooking) {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventCategory: BoardsAndRoomsEventCategory.Board,
                    eventType: EventTypes.Interaction,
                    eventAction: BoardsAndRoomsEventAction.BoardSelected,
                    eventLabel: boardType.title,
                    eventValue: priceDiff,
                },
                generateGenericValues({
                    destinationUrl: null,
                    genericValue1: changedBoard?.title || null,
                    genericValue2: `${alternativeBoardsCount}`,
                    genericValue3: getAlterationStatus(false, isRoomAlterationNeeded),
                    genericValue4: getPriceChangeStatus(priceDiff),
                }),
            );
        }

        if (!isAlterationModalShown && isRoomAlterationNeeded) {
            // show alternation confirmation drawer when selected board requires room alteration
            setAlterationModalShown(true);

            return;
        }

        changeBoardType &&
            (await changeBoardType(boardType.code, priceDiff, () => {
                onSelectBoard?.();
                setCollapsed(true);
            }));
    };

    const handleCancelClick = (): void => {
        setAlterationModalShown(false);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.AlterationCancel,
            },
            customParams,
        );
    };

    const handleConfirmClick = (): void => {
        setAlterationModalShown(false);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                ...commonEventParams,
                eventAction: BoardsAndRoomsEventAction.AlterationConfirm,
            },
            customParams,
        );

        if (changedBoard) {
            onChangeBoard(changedBoard, priceChange);
        }
    };

    const boardsToShow = getBoardTypesToShow({
        selectedBoard,
        alternativeBoards,
        allBoardTypes,
        offer,
        isEditMode,
        isCollapsed,
        isExtrasPage,
        drawerMode,
    });

    const altTitleField = alternativeBoardsCount === 1 ? altTitleSingular : altTitlePlural;

    const boardsSectionClassName = classNames(styles.boards, {
        [styles.collapsed]: isCollapsed && isScreenMedium,
        [styles.collapsedAll]: boardsToShow.length === 1,
    });

    const handleShowMore = (): void => {
        onToggleDrawer?.();

        if (isScreenMedium) {
            setCollapsed(!isCollapsed);
        }

        let eventAction = BoardsAndRoomsEventAction.HideBoards;

        if (isCollapsed) {
            eventAction = isExtrasPage
                ? BoardsAndRoomsEventAction.ShowBoardsOnExtras
                : BoardsAndRoomsEventAction.ShowBoards;
        }

        if (!isPostBooking) {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventCategory: BoardsAndRoomsEventCategory.Board,
                    eventType: EventTypes.Interaction,
                    eventAction,
                    eventLabel: `${alternativeBoardsCount}`,
                    eventValue: null,
                },
                generateGenericValues({
                    destinationUrl: null,
                }),
            );
        }
    };

    const titleWhenCollapsed = isExtrasPage ? editLabelText : showLabelText;
    const buttonTitle = isCollapsed ? titleWhenCollapsed : hideLabelText;

    return (
        <div className={boardsSectionClassName} data-tid='boards-section'>
            <BoardList
                items={boardsToShow}
                isCollapsed={isCollapsed && !drawerMode}
                alterationInfoTitle={alterationInfoTitle}
                alterationInfoText={alterationInfoText}
                altTitleField={altTitleField}
                freeChildPlaceInfoTitle={freeChildPlaceInfoTitle}
                freeChildPlaceInfoText={freeChildPlaceInfoText}
                offer={offer}
                isMostExpensiveBoardSelected={isMostExpensiveBoardSelected}
                selectedRooms={selectedRooms}
                onChangeBoard={onChangeBoard}
                onUpdateBoard={onUpdateBoard}
                onDeleteBoard={onDeleteBoard}
                selectedBoardTypeCode={selectedBoardTypeCode}
                fallbackImage={fallbackImage}
                alternativeBoardsCount={alternativeBoardsCount}
                isPostBooking={isPostBooking}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                countryCode={countryCode}
            />
            <BoardSectionButton
                offer={offer}
                handleShowMore={handleShowMore}
                isCollapsed={isCollapsed}
                alternativeBoardsCount={alternativeBoardsCount}
                isMostExpensiveBoardSelected={isMostExpensiveBoardSelected}
                title={buttonTitle}
            />
            {!!changedBoard && (
                <BoardAlterationDrawer
                    changedBoard={changedBoard}
                    newAlternativeRooms={newAltRooms}
                    fallbackImage={fallbackImage}
                    alterationResTextPlural={alterationResTextPlural}
                    alterationResTextSingular={alterationResTextSingular}
                    alterationResTitle={alterationResTitle}
                    alterationResSubtitle={alterationResSubtitle}
                    priceChange={priceChange}
                    alterationSubtitle={alterationSubtitle}
                    alterationChangingFromTitle={alterationChangingFromTitle}
                    freeChildPlaceInfoTitle={freeChildPlaceInfoTitle}
                    freeChildPlaceInfoText={freeChildPlaceInfoText}
                    isAlterationModalShow={isAlterationModalShown}
                    handleCancelClick={handleCancelClick}
                    handleConfirmClick={handleConfirmClick}
                    countryCode={countryCode}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                />
            )}
        </div>
    );
};

export default observer(BoardSection);
