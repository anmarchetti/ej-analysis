import React, { FC, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IBoardType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards, TAllBoards } from 'models/data/IOffer';
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AncillariesTitle from 'frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader';
import { IBoardTypesFields } from 'frontend/components/renderings/BoardTypes/BoardTypes';
import BoardSection from 'frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection';
import BoardTypesDrawer from 'frontend/components/renderings/BoardTypes/components/BoardTypesDrawer/BoardTypesDrawer';

export interface IBoardTypesWrapperProps {
    allBoardTypes: TAllBoards;
    anchor: string;
    offer: Nullable<IOfferWithoutAltBoards | IBookingInfo | IAmendHotelOffer>;
    selectedBoardType: Nullable<IBoardType>;
    countryCode?: string;
    fallbackImage?: string;
    fields?: IBoardTypesFields;
    freeChildPlaceTooltip?: string;
    isPostBooking?: boolean;
    onDeleteBoard?: (id: string) => void;
    onUpdateBoard?: (id: string) => void;
    rendering?: ISitecoreComponent['rendering'];
}

const BoardTypesWrapper: FC<IBoardTypesWrapperProps> = ({
    anchor,
    allBoardTypes,
    selectedBoardType,
    freeChildPlaceTooltip,
    countryCode,
    offer,
    fields,
    fallbackImage,
    onUpdateBoard,
    onDeleteBoard,
    isPostBooking,
    rendering,
}) => {
    const { isScreenMedium, trackGenericAmendmentActionWithGuests } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        trackGenericAmendmentActionWithGuests:
            isHolidayStore(stores) && stores.trackingStore.trackGenericAmendmentActionWithGuests,
    }));

    const boardRef = useRef<HTMLDivElement>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const selectedBoardTypeCode = selectedBoardType ? selectedBoardType.code : '';

    const scrollToNextBoard = (): void => {
        if (!isScreenMedium) {
            setTimeout(() => {
                if (boardRef?.current) {
                    scrollIntoViewIfNeeded(boardRef.current, {
                        behavior: 'smooth',
                        block: 'center',
                    });
                }
            });
        }
    };

    const handleToggleDrawer = (): void => {
        if (trackGenericAmendmentActionWithGuests && isPostBooking) {
            const eventLabel = isPopupOpen
                ? PostBookingBoardsAndRoomsEventAction.HideBoardOptions
                : PostBookingBoardsAndRoomsEventAction.SeeAllBoardOptions;

            trackGenericAmendmentActionWithGuests(AmendEventLabels.ChangeRoomAndBoard, eventLabel);
        }

        setIsPopupOpen(!isPopupOpen);

        if (isPopupOpen) {
            scrollToNextBoard();
        }
    };

    if (!fields) {
        return null;
    }

    const {
        Title,
        ShowLabel,
        HideLabel,
        EditLabel,
        AlternativeBoardsTitleSingular,
        AlternativeBoardsTitlePlural,
        AlterationSubtitle,
        AlterationRoomResultTitle,
        AlterationResultSubtitle,
        AlterationRoomResultTextSingular,
        AlterationRoomResultTextPlural,
        AlterationChangingFromTitle,
        AlterationInfoTitle,
        AlterationInfoText,
        AlterationExtendedInfoTitle,
        AlterationExtendedInfoText,
        FreeChildPlaceInfoTitle,
        FreeChildPlaceInfoText,
    } = fields;

    return (
        <section className='board-and-room' id={anchor} data-tid='board-types' ref={boardRef}>
            <div id={ScrollAnchorId.BoardTypes} aria-hidden='true' data-tid='board-types-scroll-anchor' />
            <AncillariesTitle title={Title} />
            <BoardSection
                offer={offer as IOfferWithoutAltBoards}
                allBoardTypes={allBoardTypes}
                selectedBoardTypeCode={selectedBoardTypeCode}
                altTitleSingular={AlternativeBoardsTitleSingular}
                altTitlePlural={AlternativeBoardsTitlePlural}
                hideLabelText={HideLabel?.value}
                showLabelText={ShowLabel?.value}
                editLabelText={EditLabel?.value}
                alterationSubtitle={AlterationSubtitle}
                alterationResTitle={AlterationRoomResultTitle}
                alterationResSubtitle={AlterationResultSubtitle}
                alterationResTextSingular={AlterationRoomResultTextSingular}
                alterationResTextPlural={AlterationRoomResultTextPlural}
                alterationChangingFromTitle={AlterationChangingFromTitle}
                alterationInfoTitle={AlterationInfoTitle}
                alterationInfoText={AlterationInfoText}
                alterationExtendedInfoTitle={AlterationExtendedInfoTitle}
                alterationExtendedInfoText={AlterationExtendedInfoText}
                freeChildPlaceInfoTitle={FreeChildPlaceInfoTitle}
                freeChildPlaceInfoText={FreeChildPlaceInfoText}
                onToggleDrawer={handleToggleDrawer}
                fallbackImage={fallbackImage}
                onUpdateBoard={onUpdateBoard}
                onDeleteBoard={onDeleteBoard}
                isPostBooking={isPostBooking}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                countryCode={countryCode}
            />
            {!isScreenMedium && (
                <BoardTypesDrawer
                    isOpen={isPopupOpen}
                    offer={offer as IOfferWithoutAltBoards}
                    allBoardTypes={allBoardTypes}
                    selectedBoardTypeCode={selectedBoardTypeCode}
                    fields={fields}
                    fallbackImage={fallbackImage}
                    closePopup={handleToggleDrawer}
                    onUpdateBoard={onUpdateBoard}
                    onDeleteBoard={onDeleteBoard}
                    isPostBooking={isPostBooking}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                    countryCode={countryCode}
                    rendering={rendering}
                />
            )}
        </section>
    );
};

export default observer(BoardTypesWrapper);
