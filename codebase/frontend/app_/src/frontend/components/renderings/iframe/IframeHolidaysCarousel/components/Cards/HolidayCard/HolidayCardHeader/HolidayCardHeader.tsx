import { FC } from 'react';

import { getHotelLocation } from 'frontend/utils/getHotelLocation';
import { IOffer } from 'models/data/IOffer';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

import styles from './HolidayCardHeader.module.scss';

interface IHolidayCardHeaderProps {
    hotelLink: string;
    offer: IOffer;
}

export const HolidayCardHeader: FC<IHolidayCardHeaderProps> = ({ offer, hotelLink }) => {
    const hotel = offer.hotel;

    if (!hotel) return null;

    return (
        <div className={styles.cardHeader} data-tid='hotel-card-header'>
            <a href={hotelLink} target='_blank' rel='noreferrer'>
                <h3 className={styles.cardTitle} data-tid='hotel-title'>
                    {hotel.name}
                </h3>
            </a>

            <div className={styles.hotelLocation} data-tid='hotel-location'>
                {getHotelLocation(hotel, false)}
            </div>

            <div className={styles.hotelRating} data-tid='hotel-rating'>
                {!!hotel.starRating && <StarRating rating={parseInt(hotel.starRating, 10)} />}

                {!!hotel.rating && !!hotel.numberOfReviews && (
                    <TripadvisorInfo rating={hotel.rating} reviews={hotel.numberOfReviews} />
                )}
            </div>
        </div>
    );
};

export default HolidayCardHeader;
