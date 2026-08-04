import { FC } from 'react';

import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import RouterLink from 'frontend/components/common/RouterLink';
import HotelStarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

import { IHotelItem } from './HotelsWithReviews';

import styles from './HotelsWithReviews.module.scss';

const HotelItem: FC<IHotelItem> = ({ StarRating, TotalNumberOfReviews, HotelRating, Name, EcoFacility, url }) => {
    if (!Name) {
        return null;
    }

    return (
        <div className={styles.item}>
            <RouterLink link={{ value: { href: url } }} className={styles.hotelName} dataId='hotel-name'>
                {Name}
            </RouterLink>

            <div className={styles.ratingWrapper}>
                {!!StarRating && <HotelStarRating rating={StarRating} />}
                {!!HotelRating && !!TotalNumberOfReviews && (
                    <TripadvisorInfo rating={HotelRating} reviews={TotalNumberOfReviews} />
                )}
                {!!EcoFacility && !!EcoFacility.Name && <EcoCertifiedPill title={EcoFacility.Name} />}
            </div>
        </div>
    );
};

export default HotelItem;
