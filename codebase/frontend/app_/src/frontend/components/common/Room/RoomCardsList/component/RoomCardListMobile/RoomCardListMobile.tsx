import { useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IUnit } from 'models/data/IOffer';
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import RoomCard from 'frontend/components/common/Room/RoomCard/RoomCard';
import RoomsCardListDrawer from 'frontend/components/common/Room/RoomCardsList/component/RoomsCardListDrawer/RoomsCardListDrawer';

import ShowMoreAction from './components/ShowMoreAction/ShowMoreAction';

export interface IRoomCardListMobileProps {
    onChangeRoom: (room: IUnit) => void;
    rooms: IUnit[];
    countryCode?: string;
    description?: string;
    freeChildPlaceTooltip?: string;
    isLoading?: boolean;
    pricePostfix?: SitecoreDictionary;
    rendering?: ISitecoreComponent['rendering'];
    showMoreLabel?: string;
    showRoomsPart?: number;
    title?: string;
}

const RoomCardListMobile = ({
    rooms,
    pricePostfix,
    showMoreLabel,
    showRoomsPart,
    onChangeRoom,
    isLoading,
    title,
    description,
    countryCode,
    freeChildPlaceTooltip,
    rendering,
}: IRoomCardListMobileProps) => {
    const { getPhrase, trackGenericAmendmentActionWithGuests } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackGenericAmendmentActionWithGuests:
            isHolidayStore(stores) && stores.trackingStore.trackGenericAmendmentActionWithGuests,
    }));
    const [isOpened, setIsOpened] = useState(false);

    const toggleOpen = () => {
        if (trackGenericAmendmentActionWithGuests) {
            const event = isOpened
                ? PostBookingBoardsAndRoomsEventAction.HideAlternativeRooms
                : PostBookingBoardsAndRoomsEventAction.SeeAlternativeRooms;
            trackGenericAmendmentActionWithGuests(AmendEventLabels.ChangeRoomAndBoard, event);
        }

        setIsOpened(!isOpened);
    };

    const handleDrawerChooseRoom = async (room: IUnit) => {
        await onChangeRoom(room);
        setIsOpened(false);
    };

    const showMoreButtonLabel = showMoreLabel || getPhrase(SitecoreDictionary.GlobalsLabelsShowMore);
    const slicedRooms = rooms.slice(1);
    const isShowMoreCTAVisible = rooms.length > 1 && !isLoading;

    return (
        <div>
            <RoomCard
                room={rooms[0]}
                pricePostfix={pricePostfix}
                onChange={onChangeRoom}
                isLoading={isLoading}
                countryCode={countryCode}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
            />
            <RoomsCardListDrawer
                rooms={slicedRooms}
                pricePostfix={pricePostfix}
                showMoreLabel={showMoreButtonLabel}
                showRoomsPart={showRoomsPart}
                isOpen={isOpened}
                onCollapse={toggleOpen}
                onChangeRoom={handleDrawerChooseRoom}
                isLoading={isLoading}
                title={title}
                description={description}
                countryCode={countryCode}
                freeChildPlaceTooltip={freeChildPlaceTooltip}
                rendering={rendering}
            />
            {isShowMoreCTAVisible && <ShowMoreAction label={showMoreButtonLabel} onClick={toggleOpen} />}
        </div>
    );
};

export default RoomCardListMobile;
