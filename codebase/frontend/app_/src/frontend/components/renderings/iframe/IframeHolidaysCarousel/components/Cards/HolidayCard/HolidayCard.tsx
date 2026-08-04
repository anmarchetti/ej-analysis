import { FC, useMemo } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { IOffer } from 'models/data/IOffer';

import HolidayCardBody from './HolidayCardBody/HolidayCardBody';
import HolidayCardHeader from './HolidayCardHeader/HolidayCardHeader';
import HolidayCardImage from './HolidayCardImage/HolidayCardImage';

import styles from './HolidayCard.module.scss';

interface IHolidayCardProps {
    fallbackImage: string;
    offer: IOffer;
    shouldShowPrice: boolean;
}

export const HolidayCard: FC<IHolidayCardProps> = ({ offer, fallbackImage, shouldShowPrice }) => {
    const { basePath, buildHotelQueryPromotingIframe } = useStore((stores: IHolidaysStores) => ({
        basePath: stores.layoutStore.basePath,
        buildHotelQueryPromotingIframe: stores.queryParamStore.buildHotelQueryPromotingIframe,
    }));

    const hotelLink = useMemo(() => {
        const query = buildHotelQueryPromotingIframe(offer);

        return basePath + buildHotelDetailsUrl(offer.hotel) + query;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offer, basePath]);

    const isLuxuryPackage = containsLuxuryPromoCode(offer.promoCollections);

    return (
        <div className={styles.card}>
            <HolidayCardImage offer={offer} fallbackImage={fallbackImage} isLuxuryPackage={isLuxuryPackage} />

            <HolidayCardHeader offer={offer} hotelLink={hotelLink} />

            <HolidayCardBody
                offer={offer}
                hotelLink={hotelLink}
                shouldShowPrice={shouldShowPrice}
                isLuxuryPackage={isLuxuryPackage}
            />
        </div>
    );
};

export default HolidayCard;
