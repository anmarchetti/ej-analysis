import React from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { IBookingPackage } from 'models/data/IBookingInfo';
import { IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import { getRoomTitle } from './AmendPaymentRoomsAndBoards.utils';

import styles from './AmendPaymentRoomsAndBoards.module.scss';

export interface IAmendDatesPaymentRoomBoardProps {
    hotel: {
        location: IBookingPackage['location'];
        name: string;
    };
    units: (IUnit | IRoom)[];
    areSeparateRooms?: boolean;
    dataTid?: string;
}

// @TODO: This can be deleted once AmendItemInfo is deleted
const AmendPaymentRoomsAndBoards = ({ units, hotel, dataTid, areSeparateRooms }: IAmendDatesPaymentRoomBoardProps) => {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    const roomsMeta = getRoomsMeta(units as IUnit[], getPhrase);

    return (
        <div className={classNames(styles.container, 'rbc-hotel-board')} data-tid={dataTid}>
            <div className={classNames(styles.block, styles.hotel)}>
                <SVGHotelBedFilled className={classNames(styles.icon)} />
                <div className={styles.content}>
                    <div className={styles.title}>{hotel.name}</div>
                    <div>{`${hotel.location.city}, ${hotel.location.region}`}</div>
                    <div data-tid='amend-payment-rooms'>
                        {roomsMeta.map(({ rooms, board }) => (
                            <div key={board.code}>
                                {rooms.map(roomMeta => (
                                    <div key={roomMeta.room.code}>
                                        <div>{getRoomTitle(roomMeta, areSeparateRooms)}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.block} data-tid='amend-payment-board'>
                {roomsMeta.map(({ board }) => (
                    <div className={styles.block} key={board.name}>
                        <ImageWithFilter
                            imageSrc={cmsUrls.media(board.iconUrl as string)}
                            filterMatrix={SVGFilterMatrix.Grayscale}
                            className={styles.icon}
                        />
                        <div className={styles.content}>
                            <div className={styles.title}>{board.title}</div>
                            <div>{board.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AmendPaymentRoomsAndBoards;
