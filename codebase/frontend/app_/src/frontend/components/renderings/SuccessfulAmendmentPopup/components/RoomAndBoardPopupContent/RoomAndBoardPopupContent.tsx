import classNames from 'classnames';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import styles from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup.module.scss';

const RoomAndBoardPopupContent = (): JSX.Element | null => {
    const { booking, getPhrase } = useStore((store: IHolidaysStores) => ({
        booking: store.viewBookingStore.booking,
        getPhrase: store.layoutStore.getPhrase,
    }));

    if (!booking) {
        return null;
    }

    const rooms = booking.package.accom.rooms;
    const boardType = rooms[0].boardType;

    return (
        <div
            className={classNames('mt-md-3 mt-4 mb-md-n4 mb-4', styles.roomAndBoardContainer)}
            data-tid='successful-amendment-popup-room-and-board-content'
        >
            {rooms.map((room, index) => {
                const safeRoomTitle =
                    typeof room.roomType.title === 'string' ? room.roomType.title : room.roomType.title.value;

                return (
                    <div
                        key={`${room.code}-${index}`}
                        className='d-flex align-items-center mb-1'
                        data-tid={`successful-amendment-popup-room-${index + 1}`}
                    >
                        <SVGHotelBedFilled className={styles.roomAndBoardIcon} />
                        <span
                            data-tid={`successful-amendment-popup-room-type-${index + 1}`}
                            className={styles.roomAndBoardName}
                        >
                            {rooms.length > 1 &&
                                `${Tokenizer.replaceToken(
                                    getPhrase(SitecoreDictionary.RoomAndBoardLabelsRoom),
                                    Tokens.Number,
                                    String(index + 1),
                                )}: `}
                            {safeRoomTitle}
                        </span>
                    </div>
                );
            })}
            <div className='d-flex align-items-center' data-tid='successful-amendment-popup-board'>
                <ImageWithFilter
                    imageSrc={cmsUrls.media(boardType.iconUrl)}
                    filterMatrix={SVGFilterMatrix.Grayscale}
                    className={styles.roomAndBoardIcon}
                    dataTid='successful-amendment-popup-board-icon'
                />
                <span data-tid='successful-amendment-popup-board-type' className={styles.roomAndBoardName}>
                    {boardType.title}
                </span>
            </div>
        </div>
    );
};

export default observer(RoomAndBoardPopupContent);
