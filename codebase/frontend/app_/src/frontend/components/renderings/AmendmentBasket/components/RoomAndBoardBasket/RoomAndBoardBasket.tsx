import { Fragment, FunctionComponent } from 'react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import styles from './RoomAndBoardBasket.module.scss';

export interface IRoomAndBoardBasketProps {
    units: (IUnit | IRoom)[] | undefined;
    dataTid?: string;
}

const RoomAndBoardBasket: FunctionComponent<IRoomAndBoardBasketProps> = ({
    units,
    dataTid = 'room-and-board-basket',
}) => {
    const { getPhrase, booking } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
        booking: store.viewBookingStore.booking,
    }));

    if (!booking) {
        return null;
    }

    const { name } = booking.hotel || {};
    const { location } = booking.package;

    const roomsMeta = getRoomsMeta(units as IUnit[], getPhrase);
    const board = roomsMeta[0].board;

    return (
        <>
            <div className={styles.block} data-tid={`${dataTid}-rooms`}>
                <SVGHotelBedFilled className={styles.icon} data-tid={`${dataTid}-room-icon`} />
                <div className={styles.content}>
                    <div className={styles.title} data-tid={`${dataTid}-hotel-title`}>
                        {name}
                    </div>
                    <div
                        className={styles.location}
                        data-tid={`${dataTid}-hotel-location`}
                    >{`${location?.city}, ${location?.region}`}</div>
                    <div className={styles.rooms}>
                        {roomsMeta.map(({ rooms, board }, unitIdx) => (
                            <Fragment key={`${dataTid}-${unitIdx}-${board.code}`}>
                                {rooms.map(({ title, roomNumber, forPeople, room }, roomIdx) => (
                                    <div
                                        key={`${unitIdx}-${room.code}-${roomIdx}`}
                                        data-tid={`${dataTid}-room-info`}
                                    >{`${roomNumber}: ${title} ${forPeople}`}</div>
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.block} data-tid={`${dataTid}-board`}>
                <div className={styles.block} data-tid={`${dataTid}-board-info`}>
                    <ImageWithFilter
                        imageSrc={cmsUrls.media(board.iconUrl as string)}
                        filterMatrix={SVGFilterMatrix.Grayscale}
                        className={styles.icon}
                        dataTid={`${dataTid}-board-icon`}
                    />
                    <div className={styles.content}>
                        <div data-tid={`${dataTid}-board-title`} className={styles.title}>
                            {board.title}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RoomAndBoardBasket;
