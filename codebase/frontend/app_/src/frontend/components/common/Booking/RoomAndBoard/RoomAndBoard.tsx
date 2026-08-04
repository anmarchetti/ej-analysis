import React from 'react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { IRoom } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { OfferCardSlider } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';
import AmendRoomAndBoardEntry from 'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardEntry/AmendRoomAndBoardEntry';
import RoomFacilities from 'frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities';

import BoardType from './components/BoardType/BoardType';
import RoomType from './components/RoomType/RoomType';

import styles from './RoomAndBoard.module.scss';

interface IRoomAndBoardProps {
    rooms: IRoom[];
    isPrintPreview?: boolean;
    onAmendClick?: (e: React.MouseEvent) => void;
}

const RoomAndBoard: React.FC<IRoomAndBoardProps> = ({ isPrintPreview, rooms, onAmendClick }) => {
    const { getPhrase, isAmendCTAVisible, getSetting } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isAmendCTAVisible: isHolidayStore(stores) && stores.amendRoomAndBoardStore.isAmendCTAVisible,
    }));

    if (!rooms.length) {
        return null;
    }

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const boardTypes = Array.from(new Set(rooms.map(item => item.board)));

    return (
        <ViewBookingComponentWrapper
            dataTid='room-and-board'
            Title={{
                value: getPhrase(
                    rooms.length > 1
                        ? SitecoreDictionary.BookingSummaryTitlesRoomsAndBoard
                        : SitecoreDictionary.BookingSummaryTitlesRoomAndBoard,
                ),
            }}
        >
            <div className={styles.roomContainer}>
                {rooms.map((room, i) => {
                    const isLast = i === rooms.length - 1;
                    const shouldShowBoardType = (boardTypes.length > 1 || isLast) && !!room.boardType;
                    const canShowAmendCTA = isLast && isAmendCTAVisible && !!onAmendClick;
                    const shouldShowRoomTypeCTA = canShowAmendCTA && !shouldShowBoardType;

                    return (
                        <div key={`${room.code}-${room.boardType?.code}`} className={styles.roomWrapper}>
                            <div className={styles.room} data-tid='room'>
                                <div className={styles.offerCardSlider}>
                                    <OfferCardSlider
                                        fallbackImage={fallbackImage}
                                        images={room.roomType?.images}
                                        roomItemId={room.code}
                                        showIndex
                                        roomImagesFolderId={room.roomType?.roomImagesFolderId}
                                        isFullScreenEnabled={true}
                                        isPromoPage={false}
                                        isSearchResultsPage={false}
                                    />
                                </div>
                                <div className={styles.roomBoardContainer}>
                                    <div className={styles.roomItem}>
                                        <div className={styles.roomTypeContainer}>
                                            <RoomType room={room} roomNumber={i + 1} />
                                        </div>
                                        <RoomFacilities
                                            key={room.code}
                                            facilities={room.roomType?.facilities}
                                            roomFacilityFolderId={room.roomType?.roomFacilityFolderId}
                                            roomId={room.code}
                                            tooltipClass={undefined}
                                        />
                                        {shouldShowRoomTypeCTA && (
                                            <AmendRoomAndBoardEntry
                                                className={styles.amendCta}
                                                onClick={onAmendClick}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                            {shouldShowBoardType && (
                                <div className={`${styles.roomItem} ${styles.boardTypeContainer}`}>
                                    <BoardType board={room.boardType} isPrintPreview={isPrintPreview} />
                                    {canShowAmendCTA && (
                                        <AmendRoomAndBoardEntry className={styles.amendCta} onClick={onAmendClick} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </ViewBookingComponentWrapper>
    );
};

export default RoomAndBoard;
