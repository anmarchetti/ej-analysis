import React from 'react';
import classNames from 'classnames';

import { IHotel, IRoomType } from 'models/data/IHotel';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import IconBed from 'frontend/components/icons-new/HotelBedFilled';
import styles from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsExpanded.module.scss';

import hotelInfoStyles from './HotelInfo.module.scss';

export interface IHotelInfoProps {
    hotel: Nullable<IHotel>;
    rooms: IRoomType[];
    isPrintPreview?: boolean;
}

const HotelInfo = ({ hotel, rooms, isPrintPreview = false }: IHotelInfoProps): React.ReactNode => {
    const getSafeText = (val: string | ISitecoreField<string> | undefined | null): string | null => {
        if (!val) return null;

        return typeof val === 'object' ? val.value : val;
    };

    const hotelLocation = hotel?.resort?.name
        ? hotel?.country?.name
            ? `${hotel.resort.name}, ${hotel.country.name}`
            : hotel.resort.name
        : null;

    return (
        <div className={styles.blockItem}>
            <IconBed className={styles.svgIcon} />
            <div
                className={classNames({ [styles.head]: !isPrintPreview, [hotelInfoStyles.head]: isPrintPreview })}
                data-tid='hotel-name'
            >
                {getSafeText(hotel?.name)}
            </div>
            {!isPrintPreview && hotelLocation && <span data-tid='location'>{hotelLocation}</span>}
            {rooms.map((room, i) => (
                <div key={`${room.code}_${i}`}>
                    <div data-tid='room-title'>{getSafeText(room.title)}</div>
                    <div data-tid='room-description'>{room.description}</div>
                </div>
            ))}
        </div>
    );
};

export default HotelInfo;
