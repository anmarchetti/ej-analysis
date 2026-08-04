import { FunctionComponent, useCallback, useEffect } from 'react';

import { usePagination } from 'frontend/hooks/usePagination/usePagination';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IUnit } from 'models/data/IOffer';
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';
import RoomCard from 'frontend/components/common/Room/RoomCard/RoomCard';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';

import styles from './RoomCardListDesktop.module.scss';

const COLLAPSED_CARDS_SHOW_COUNT = 1;

export interface IRoomCardListDesktopProps {
    hideMoreCollapsedTitle: string;
    onChangeRoom: (room: IUnit) => void;
    rooms: IUnit[];
    showMoreExpandedTitle: string;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    pricePostfix?: SitecoreDictionary;
    showRoomsPart?: number;
}

const RoomCardListDesktop: FunctionComponent<IRoomCardListDesktopProps> = ({
    rooms,
    pricePostfix,
    hideMoreCollapsedTitle,
    showMoreExpandedTitle,
    onChangeRoom,
    showRoomsPart = rooms.length,
    isLoading,
    freeChildPlaceTooltip,
    countryCode,
}) => {
    const { trackGenericAmendmentActionWithGuests } = useStore((stores: TStores) => ({
        trackGenericAmendmentActionWithGuests:
            isHolidayStore(stores) && stores.trackingStore.trackGenericAmendmentActionWithGuests,
    }));

    const { itemsToShow, goToNext, goToPage, isLastPage } = usePagination<IUnit>(rooms, {
        defaultToShow: COLLAPSED_CARDS_SHOW_COUNT,
        numberToShow: showRoomsPart,
        continuous: true,
    });

    const onShowMore = useCallback(() => {
        if (trackGenericAmendmentActionWithGuests) {
            const eventLabel = isLastPage
                ? PostBookingBoardsAndRoomsEventAction.HideAlternativeRooms
                : PostBookingBoardsAndRoomsEventAction.SeeAlternativeRooms;
            trackGenericAmendmentActionWithGuests(AmendEventLabels.ChangeRoomAndBoard, eventLabel);
        }

        isLastPage ? goToPage(0) : goToNext();
    }, [goToNext, goToPage, isLastPage, trackGenericAmendmentActionWithGuests]);

    useEffect(() => {
        goToPage(0);
    }, [rooms, goToPage]);

    const expandButtonTitle = isLastPage ? hideMoreCollapsedTitle : showMoreExpandedTitle;
    const shouldShowMoreCTAVisible = rooms.length > COLLAPSED_CARDS_SHOW_COUNT && !isLoading;
    const shouldShowFadeRoom = !isLastPage && !isLoading;

    return (
        <div>
            <div className={styles.list}>
                {itemsToShow.map(room => (
                    <RoomCard
                        key={`${room.code}-${room.board}`}
                        room={room}
                        pricePostfix={pricePostfix}
                        onChange={onChangeRoom}
                        isLoading={isLoading}
                        freeChildPlaceTooltip={freeChildPlaceTooltip}
                        countryCode={countryCode}
                    />
                ))}
                {shouldShowFadeRoom && <div className={styles.fadeRoom} />}
            </div>
            {shouldShowMoreCTAVisible && (
                <ShowMoreButton
                    onClick={onShowMore}
                    isChevronUp={isLastPage}
                    title={expandButtonTitle}
                    dataTid='show-more-rooms-button-desktop'
                />
            )}
        </div>
    );
};

export default RoomCardListDesktop;
